const MAX_MESSAGES = 10;
const WINDOW_MS = 10_000;
// The server receives a send slightly later than the client records it.
const DELIVERY_MARGIN_MS = 250;

export interface SendLimitStatus {
  remaining: number;
  cooldownSeconds: number;
}

export class SendRateLimit {
  private timestamps: number[] = [];
  private blockedUntil = 0;

  status(now = Date.now()): SendLimitStatus {
    this.timestamps = this.timestamps.filter(
      (timestamp) => now - timestamp < WINDOW_MS + DELIVERY_MARGIN_MS,
    );
    const availableAt = Math.max(
      this.blockedUntil,
      this.timestamps.length >= MAX_MESSAGES
        ? this.timestamps[0] + WINDOW_MS + DELIVERY_MARGIN_MS
        : 0,
    );
    return {
      remaining: Math.max(0, MAX_MESSAGES - this.timestamps.length),
      cooldownSeconds: Math.max(0, Math.ceil((availableAt - now) / 1000)),
    };
  }

  tryConsume(now = Date.now()): boolean {
    if (this.status(now).cooldownSeconds > 0) return false;
    this.timestamps.push(now);
    return true;
  }

  // chat_error has no retryAfter: wait a full window if another socket or
  // delayed delivery made the server's counter differ from ours.
  penalize(now = Date.now()): void {
    this.blockedUntil = now + WINDOW_MS + DELIVERY_MARGIN_MS;
  }

  reset(): void {
    this.timestamps = [];
    this.blockedUntil = 0;
  }
}

import { useCallback, useEffect, useState } from 'react';
import { SendRateLimit } from '@/chat/send-rate-limit';

export function useSendRateLimit() {
  const [limiter] = useState(() => new SendRateLimit());
  const [status, setStatus] = useState(() => limiter.status());

  const reset = useCallback(() => {
    limiter.reset();
    setStatus(limiter.status());
  }, [limiter]);

  useEffect(() => {
    if (status.remaining === 10 && status.cooldownSeconds === 0) return;
    // Recompute from the clock, so background-tab throttling doesn't extend
    // the pause when the user returns to the chat.
    const timer = setInterval(() => setStatus(limiter.status()), 250);
    return () => clearInterval(timer);
  }, [limiter, status.remaining, status.cooldownSeconds]);

  const tryConsume = useCallback(() => {
    const allowed = limiter.tryConsume();
    setStatus(limiter.status());
    return allowed;
  }, [limiter]);

  const penalize = useCallback(() => {
    limiter.penalize();
    setStatus(limiter.status());
  }, [limiter]);

  return { ...status, tryConsume, penalize, reset };
}

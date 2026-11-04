import assert from 'node:assert/strict';
import { test } from 'node:test';
import { SendRateLimit } from '../src/chat/send-rate-limit.ts';

test('a burst stops before the eleventh send and waits for the delivery margin', () => {
  const limiter = new SendRateLimit();
  for (let i = 0; i < 10; i++) assert.equal(limiter.tryConsume(0), true);
  assert.equal(limiter.tryConsume(0), false);
  assert.equal(limiter.status(0).remaining, 0);
  assert.equal(limiter.tryConsume(10_249), false);
  assert.equal(limiter.tryConsume(10_250), true);
  assert.equal(limiter.status(10_250).remaining, 9);
});

test('a sliding window releases slots individually', () => {
  const limiter = new SendRateLimit();
  for (let i = 0; i < 10; i++) assert.equal(limiter.tryConsume(i * 500), true);
  assert.equal(limiter.tryConsume(10_250), true);
  assert.equal(limiter.tryConsume(10_250), false);
  assert.equal(limiter.status(10_250).cooldownSeconds, 1);
  assert.equal(limiter.tryConsume(10_750), true);
});

test('a server rejection starts a full pause even with local slots remaining', () => {
  const limiter = new SendRateLimit();
  limiter.tryConsume(0);
  limiter.penalize(2000);
  assert.equal(limiter.status(2000).remaining, 9);
  assert.equal(limiter.tryConsume(12_249), false);
  assert.equal(limiter.tryConsume(12_250), true);
  assert.equal(limiter.status(12_250).cooldownSeconds, 0);
});

test('a late timer catches up from the clock and a fresh connection resets the limit', () => {
  const limiter = new SendRateLimit();
  for (let i = 0; i < 10; i++) limiter.tryConsume(0);
  assert.deepEqual(limiter.status(60_000), {
    remaining: 10,
    cooldownSeconds: 0,
  });
  limiter.penalize(60_000);
  limiter.reset();
  assert.deepEqual(limiter.status(60_000), {
    remaining: 10,
    cooldownSeconds: 0,
  });
  assert.equal(limiter.tryConsume(60_000), true);
});

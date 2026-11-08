import assert from 'node:assert/strict';
import test from 'node:test';
import { formatPhoneInput, normalizePhone } from '../src/auth/phone.ts';

test('phone formatting preserves incomplete input and deletion', () => {
  assert.equal(formatPhoneInput(''), '');
  assert.equal(formatPhoneInput('+'), '+');
  assert.equal(formatPhoneInput('+7 999 1'), '+7 999 1');
  assert.equal(formatPhoneInput('+7 999 12'), '+7 999 12');
});

test('Russian pasted forms format alike and normalize to the same account', () => {
  for (const input of ['+7 (999) 000-10-01', '8 999 000 10 01', '9990001001']) {
    const formatted = formatPhoneInput(input);
    assert.equal(formatted, '+7 999 000 10 01');
    assert.equal(normalizePhone(formatted), '+79990001001');
  }
});

test('international phone numbers keep their country code', () => {
  for (const phone of ['+375291234567', '+447911123456', '+12025550123']) {
    assert.equal(normalizePhone(formatPhoneInput(phone)), phone);
  }
});

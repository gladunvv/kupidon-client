import assert from 'node:assert/strict';
import { test } from 'node:test';
import { ApiError, NetworkError } from '../src/api/errors.ts';
import { getErrorMessage, messageForCode } from '../src/api/error-messages.ts';
import { parseApiResponse } from '../src/api/response.ts';

test('API codes preserve diagnostics without displaying server messages or details', () => {
  const details = { database: 'private diagnostic' };
  assert.throws(
    () =>
      parseApiResponse(
        JSON.stringify({
          success: false,
          message: 'private server stack',
          error: { code: 'FILE_TOO_LARGE', details },
          meta: { requestId: 'body-id' },
        }),
        413,
        'header-id',
      ),
    (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.code, 'FILE_TOO_LARGE');
      assert.equal(error.status, 413);
      assert.equal(error.requestId, 'body-id');
      assert.deepEqual(error.details, details);
      assert.equal(getErrorMessage(error), 'Файл больше 5 МБ');
      return true;
    },
  );
});

test('unknown API codes fall back to HTTP status', () => {
  for (const [status, code] of [
    [400, 'VALIDATION_ERROR'],
    [401, 'UNAUTHORIZED'],
    [403, 'FORBIDDEN'],
    [404, 'NOT_FOUND'],
    [503, 'INTERNAL_SERVER_ERROR'],
  ] as const) {
    assert.equal(
      getErrorMessage(
        new ApiError('private detail', 'FUTURE_CODE', status, undefined),
      ),
      messageForCode(code),
    );
  }
  assert.match(
    getErrorMessage(
      new ApiError('private detail', 'FUTURE_CODE', 429, undefined),
    ),
    /Слишком много запросов/,
  );
});

test('unknown and inherited dictionary keys always produce a safe string', () => {
  const fallback = messageForCode('UNKNOWN_CODE');
  for (const code of [
    '__proto__',
    'constructor',
    'toString',
    'hasOwnProperty',
  ]) {
    assert.equal(messageForCode(code), fallback);
    assert.equal(messageForCode(code, 'phone'), fallback);
    assert.equal(
      typeof getErrorMessage(
        new ApiError('private detail', code, 500, undefined),
      ),
      'string',
    );
  }
});

test('phone and chat overrides are confined to their contexts', () => {
  const badRequest = new ApiError(
    'private detail',
    'BAD_REQUEST',
    400,
    undefined,
  );
  assert.equal(
    getErrorMessage(badRequest, 'phone'),
    'Сервер не принял номер. Проверьте его',
  );
  assert.notEqual(
    getErrorMessage(badRequest),
    getErrorMessage(badRequest, 'phone'),
  );
  assert.equal(
    getErrorMessage(
      new ApiError('proxy error', 'HTTP_ERROR', 400, undefined),
      'phone',
    ),
    getErrorMessage(badRequest, 'phone'),
  );
  assert.equal(
    getErrorMessage(
      new ApiError('proxy error', 'HTTP_ERROR', 404, undefined),
      'chat',
    ),
    messageForCode('NOT_FOUND', 'chat'),
  );
  assert.equal(messageForCode('NOT_FOUND', 'chat'), 'Диалог недоступен');
  assert.notEqual(
    messageForCode('NOT_FOUND'),
    messageForCode('NOT_FOUND', 'chat'),
  );
});

test('only transport failures are described as connection problems', () => {
  const cause = new TypeError('fetch failed');
  const network = new NetworkError(cause);
  assert.equal(network.cause, cause);
  assert.match(getErrorMessage(network), /Нет соединения/);
  const fallback = messageForCode('UNKNOWN_CODE');
  for (const error of [
    new Error('private error'),
    new TypeError('private bug'),
    new SyntaxError('invalid JSON'),
    new DOMException('cancelled', 'AbortError'),
    null,
  ]) {
    assert.equal(getErrorMessage(error), fallback);
  }
});

test('HTML, empty bodies and contradictory success flags preserve HTTP errors', () => {
  for (const [body, status] of [
    ['<html>private proxy error</html>', 502],
    ['', 503],
    ['null', 404],
    ['[]', 429],
    [JSON.stringify({ success: true, message: 'ok', data: null }), 401],
  ] as const) {
    assert.throws(
      () => parseApiResponse(body, status, 'header-id'),
      (error: unknown) => {
        assert.ok(error instanceof ApiError);
        assert.equal(error.status, status);
        assert.equal(error.code, 'HTTP_ERROR');
        assert.equal(error.requestId, 'header-id');
        assert.doesNotMatch(getErrorMessage(error), /Нет соединения|private/);
        return true;
      },
    );
  }
});

test('malformed successful responses are distinguished from network errors', () => {
  for (const body of [
    '',
    'null',
    '{}',
    '{"success":true}',
    '{"success":false,"error":{}}',
  ]) {
    assert.throws(
      () => parseApiResponse(body, 200),
      (error: unknown) => {
        assert.ok(error instanceof ApiError);
        assert.equal(error.code, 'INVALID_RESPONSE');
        assert.equal(
          getErrorMessage(error),
          messageForCode('INVALID_RESPONSE'),
        );
        return true;
      },
    );
  }
});

test('normal and void success envelopes remain supported', () => {
  const body = {
    success: true,
    message: 'ok',
    data: { id: 'one' },
    meta: { requestId: 'id' },
  };
  assert.deepEqual(parseApiResponse(JSON.stringify(body), 200), body);
  assert.equal(
    parseApiResponse<{ id: string }>(JSON.stringify(body), 200).data.id,
    'one',
  );
  assert.equal(
    parseApiResponse(
      JSON.stringify({ success: true, message: 'ok', data: null }),
      201,
    ).data,
    null,
  );
  assert.equal(
    parseApiResponse(JSON.stringify({ success: true, message: 'ok' }), 201)
      .data,
    undefined,
  );
});

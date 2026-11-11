import { getLocalMockOrigin, isLocalDevelopment } from './local-development';

const keys = ['AIRSYNC_LOCAL_DEVELOPMENT', 'MOCK_SERVER_URL', 'AWS_LAMBDA_FUNCTION_NAME', 'AWS_EXECUTION_ENV', 'LAMBDA_TASK_ROOT'];
const saved = Object.fromEntries(keys.map((key) => [key, process.env[key]]));

beforeEach(() => { keys.forEach((key) => delete process.env[key]); });
afterEach(() => {
  keys.forEach((key) => {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  });
});

test('keeps the production endpoint when the runner does not provide an override', () => {
  expect(getLocalMockOrigin()).toBeUndefined();
  expect(isLocalDevelopment()).toBe(false);
});

test('accepts the runner loopback origin only with explicit local development', () => {
  process.env.MOCK_SERVER_URL = 'http://127.0.0.1:8123';
  expect(() => getLocalMockOrigin()).toThrow('AIRSYNC_LOCAL_DEVELOPMENT=1');
  process.env.AIRSYNC_LOCAL_DEVELOPMENT = 'true';
  expect(() => getLocalMockOrigin()).toThrow('AIRSYNC_LOCAL_DEVELOPMENT=1');
  process.env.AIRSYNC_LOCAL_DEVELOPMENT = '1';
  expect(getLocalMockOrigin()).toBe('http://127.0.0.1:8123');
});

test.each(['https://example.com', 'http://example.com', 'http://127.0.0.1/provider', 'http://user@localhost', 'http://localhost?secret=value'])('rejects non-loopback or ambiguous overrides: %s', (url) => {
  process.env.AIRSYNC_LOCAL_DEVELOPMENT = '1';
  process.env.MOCK_SERVER_URL = url;
  expect(() => getLocalMockOrigin()).toThrow();
});

test.each(['AWS_LAMBDA_FUNCTION_NAME', 'AWS_EXECUTION_ENV', 'LAMBDA_TASK_ROOT'])('rejects even an empty deployment marker: %s', (key) => {
  process.env.AIRSYNC_LOCAL_DEVELOPMENT = '1';
  process.env.MOCK_SERVER_URL = 'http://localhost:8123';
  process.env[key] = '';
  expect(() => getLocalMockOrigin()).toThrow('deployed Lambda');
  expect(() => isLocalDevelopment()).toThrow('deployed Lambda');
});

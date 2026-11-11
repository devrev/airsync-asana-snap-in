const deploymentMarkers = ['AWS_LAMBDA_FUNCTION_NAME', 'AWS_EXECUTION_ENV', 'LAMBDA_TASK_ROOT'];

export function isLocalDevelopment(): boolean {
  const enabled = process.env.AIRSYNC_LOCAL_DEVELOPMENT === '1';
  if (enabled && deploymentMarkers.some((key) => Object.prototype.hasOwnProperty.call(process.env, key))) {
    throw new Error('Local development overrides cannot run in a deployed Lambda.');
  }
  return enabled;
}

/** The component runner supplies an origin; provider API path prefixes stay unchanged. */
export function getLocalMockOrigin(): string | undefined {
  const value = process.env.MOCK_SERVER_URL;
  if (value === undefined) return undefined;
  if (!isLocalDevelopment()) throw new Error('MOCK_SERVER_URL requires AIRSYNC_LOCAL_DEVELOPMENT=1.');
  const url = new URL(value);
  if (url.protocol !== 'http:' || !['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname) ||
      url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error('MOCK_SERVER_URL must be a plain HTTP loopback origin.');
  }
  return url.origin;
}

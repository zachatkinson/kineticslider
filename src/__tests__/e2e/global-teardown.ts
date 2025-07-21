async function globalTeardown(_config: unknown): Promise<void> {
  try {
    // Perform any global cleanup tasks here
    // e.g., clean up test data, close connections, etc.
  } catch {
    // Don't throw here to avoid masking test failures
  }
}

export default globalTeardown;

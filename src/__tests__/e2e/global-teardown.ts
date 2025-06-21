import { FullConfig } from '@playwright/test';

async function globalTeardown(_config: FullConfig): Promise<void> {
  console.log('🧹 Starting E2E test global teardown...');

  try {
    // Perform any global cleanup tasks here
    // e.g., clean up test data, close connections, etc.

    console.log('✅ Global teardown completed successfully!');
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw here to avoid masking test failures
  }
}

export default globalTeardown;

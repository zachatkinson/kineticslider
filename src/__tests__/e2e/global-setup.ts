import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig): Promise<void> {
  console.log('Starting E2E test global setup...');

  const browser = await chromium.launch();
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
  });
  const page = await context.newPage();

  try {
    const baseURL = config.projects[0].use.baseURL || 'http://localhost:3000';
    console.log('Waiting for server at', baseURL);

    await page.goto(baseURL, { waitUntil: 'networkidle' });
    console.log('Server is ready!');
  } catch (error) {
    console.error('Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }

  console.log('Global setup completed successfully!');
}

export default globalSetup;

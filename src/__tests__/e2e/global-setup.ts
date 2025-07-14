async function globalSetup(_config: unknown): Promise<void> {
  console.log('Starting E2E test global setup...');

  // webServer will handle starting the dev server automatically
  // Any additional global setup can be done here

  console.log('Global setup completed successfully!');
}

export default globalSetup;

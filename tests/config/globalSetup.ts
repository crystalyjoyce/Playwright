import { FullConfig } from '@playwright/test';
import { APP_URLS } from './appUrls';

export default async function globalSetup(config: FullConfig) {
  console.log('\n[Global Setup] Initializing test suite with standardized application ports:');
  console.log(`  - FOMS Frontend: ${APP_URLS.foms}`);
  console.log(`  - SpeedPay Portal: ${APP_URLS.speedpay}`);
  console.log(`  - AI Frontend: ${APP_URLS.ai}`);
  console.log(`  - FOMS Backend: ${APP_URLS.fomsBackend}`);
  console.log(`  - AI Gateway: ${APP_URLS.aiGateway}`);
  console.log(`  - AI Service: ${APP_URLS.aiService}`);
  console.log('[Global Setup] Playwright webServers launching...\n');
}

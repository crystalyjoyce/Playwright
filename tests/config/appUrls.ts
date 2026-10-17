/**
 * Centralized Application URLs configuration for Playwright End-to-End Tests.
 * Ensures tests do not depend on hardcoded changing localhost URLs.
 */

export const APP_URLS = {
  foms: process.env.FOMS_URL || 'http://localhost:5176',
  speedpay: process.env.SPEEDPAY_URL || 'http://localhost:5174',
  ai: process.env.AI_URL || 'http://localhost:5175',
  fomsBackend: process.env.FOMS_BACKEND_URL || 'http://localhost:5000',
  aiGateway: process.env.AI_GATEWAY_URL || 'http://localhost:5001',
  aiService: process.env.AI_SERVICE_URL || 'http://localhost:8000',
};

// Export alias for flexible imports
export const appUrls = APP_URLS;

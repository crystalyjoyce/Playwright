const path = require('path');
const { spawnSync } = require('child_process');

const playwrightCli = path.join(__dirname, '..', 'node_modules', 'playwright', 'cli.js');
const testFiles = [
  'tests/ai-duplication.spec.ts',
  'tests/ai-recommendation-risk-register.spec.ts',
  'tests/client-payment-workflow.spec.ts',
  'tests/ITE.spec.ts',
  'tests/security-access-controls.spec.ts',
];
const playwrightArgs = process.argv.slice(2);

for (const testFile of testFiles) {
  console.log(`\n=== Running ${testFile} ===\n`);
  const result = spawnSync(
    process.execPath,
    [playwrightCli, 'test', testFile, ...playwrightArgs],
    { stdio: 'inherit' }
  );

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

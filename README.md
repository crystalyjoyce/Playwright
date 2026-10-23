# Playwright

Playwright end-to-end tests for the FOMS, SpeedPay, and AI workflows. The test
configuration starts the AI service and seeds any missing local demo accounts;
it never replaces existing account passwords.

Install dependencies with `npm ci`. Run the collaboration suite in Chromium with
`npm run test:collab`, or run all configured browsers with `npm run test:e2e`.
The account login checks can also be run on their own:

```sh
npx playwright test TESTS/login-accounts.spec.ts --project=chromium
```

The demo password is `Password@123` for seeded accounts `EMP-001` through
`EMP-007` and client accounts `CA-001` through `CA-003`. Set `FOMS_REPO_ROOT`
when the FOMS source repository is not at the sibling `tesda/FOMS-System-Repository`
path.

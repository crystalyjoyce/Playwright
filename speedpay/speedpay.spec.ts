import { test, expect } from '@playwright/test';

test('speedpay with PayMongo', async ({ page, context }) => {

  // ==================================================
  // 1. OPEN SPEEDPAY
  // ==================================================
  await page.goto('http://localhost:5174/', {
    waitUntil: 'domcontentloaded',
  });

  await expect(
    page.getByRole('textbox', { name: 'Client ID' })
  ).toBeVisible();


  // ==================================================
  // 2. LOGIN
  // ==================================================
  await page
    .getByRole('textbox', { name: 'Client ID' })
    .fill('test-001');

  await page
    .getByRole('textbox', { name: 'Password' })
    .fill('password123');

  await page
    .getByRole('button', { name: 'Log In' })
    .click();


  // ==================================================
  // 3. GO TO PAY AN INVOICE
  // ==================================================
  const payInvoiceLink = page.getByRole('link', {
    name: 'Pay an Invoice',
  });

  await expect(payInvoiceLink).toBeVisible({
    timeout: 15000,
  });

  await payInvoiceLink.click();


  // ==================================================
  // 4. OPEN PAYMONGO
  // ==================================================
  const payViaPayMongo = page.getByRole('button', {
    name: /Pay via PayMongo/i,
  });

  await expect(payViaPayMongo).toBeVisible({
    timeout: 15000,
  });

  const [paymongoPage] = await Promise.all([
    context.waitForEvent('page'),
    payViaPayMongo.click(),
  ]);


  // ==================================================
  // 5. WAIT FOR PAYMONGO CHECKOUT
  // ==================================================
  await paymongoPage.waitForLoadState('domcontentloaded');

  await paymongoPage.waitForURL(
    /checkout\.paymongo\.com/,
    {
      timeout: 30000,
    }
  );

  console.log(
    'PayMongo URL:',
    paymongoPage.url()
  );

  await expect(paymongoPage).toHaveURL(
    /checkout\.paymongo\.com/
  );


  // ==================================================
  // 6. SELECT E-WALLETS
  // ==================================================
  const eWalletOption = paymongoPage
    .getByRole('button')
    .filter({
      hasText: /E-Wallets/i,
    })
    .first();

  await expect(eWalletOption).toBeVisible({
    timeout: 20000,
  });

  await eWalletOption.click();


  // ==================================================
  // 7. SELECT GCASH
  // ==================================================
  const gcashOption = paymongoPage
    .getByText('GCash', {
      exact: true,
    })
    .first();

  await expect(gcashOption).toBeVisible({
    timeout: 20000,
  });

  await gcashOption.click();


  // ==================================================
  // 8. CONTINUE
  // ==================================================
  const continueButton = paymongoPage
    .getByRole('button', {
      name: /^Continue$/i,
    });

  await expect(continueButton).toBeEnabled({
    timeout: 20000,
  });

  await continueButton.click();


  // ==================================================
  // 9. CUSTOMER NAME
  // ==================================================
  const nameInput = paymongoPage.getByRole(
    'textbox',
    {
      name: /^Name$/i,
    }
  );

  await expect(nameInput).toBeVisible({
    timeout: 15000,
  });

  await nameInput.fill('Joana Ogaya');


  // ==================================================
  // 10. CUSTOMER EMAIL
  // ==================================================
  await paymongoPage
    .getByRole('textbox', {
      name: /Email/i,
    })
    .fill('joanaogaya@gmail.com');


  // ==================================================
  // 11. MOBILE NUMBER
  // ==================================================
  await paymongoPage
    .getByRole('textbox', {
      name: /Mobile Phone/i,
    })
    .fill('9456321786');


  // ==================================================
  // 12. PAY
  // ==================================================
  const payButton = paymongoPage
    .getByRole('button', {
      name: /Pay ₱/i,
    });

  await expect(payButton).toBeEnabled({
    timeout: 15000,
  });

  await payButton.click();


  // ==================================================
  // 13. AUTHORIZE TEST PAYMENT
  // ==================================================
  const authorizeButton = paymongoPage
    .getByRole('button', {
      name: /Authorize Test Payment/i,
    });

  await expect(authorizeButton).toBeVisible({
    timeout: 20000,
  });

  await authorizeButton.click();

  console.log('PayMongo test payment authorized.');


  // ==================================================
  // 14. RETURN TO SPEEDPAY
  // ==================================================
  await page.bringToFront();

  await expect(page).toHaveURL(
    /localhost:5174/,
    {
      timeout: 15000,
    }
  );


  // ==================================================
  // 15. UPLOAD PAYMENT PROOF
  // ==================================================
  const fileInput = page
    .locator('input[type="file"]')
    .first();

  await expect(fileInput).toBeAttached({
    timeout: 20000,
  });

  await fileInput.setInputFiles(
    'Screenshot 2026-09-15 201147.png'
  );

  console.log('Payment proof uploaded.');


  // ==================================================
  // 16. SUBMIT PAYMENT
  // ==================================================
  const submitButton = page.getByRole(
    'button',
    {
      name: /Submit Payment/i,
    }
  );

  await expect(submitButton).toBeEnabled({
    timeout: 15000,
  });

  await submitButton.click();


  // ==================================================
  // 17. FINISHED
  // ==================================================
  console.log(
    'SpeedPay payment submitted successfully.'
  );

});
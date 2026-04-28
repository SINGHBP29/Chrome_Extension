const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: "new", args: ['--no-sandbox'] });
  const page = await browser.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  await page.goto('http://localhost:8080/');
  console.log('Navigated to index');

  // Wait for React to render
  await page.waitForSelector('button');

  // Find the Admin button and click it
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text === 'Admin') {
      await btn.click();
      console.log('Clicked Admin role button');
      break;
    }
  }

  // Find "Submit Timesheet" button and click it
  for (const btn of buttons) {
    const text = await page.evaluate(el => el.textContent, btn);
    if (text === 'Submit Timesheet') {
      await btn.click();
      console.log('Clicked Submit Timesheet');
      break;
    }
  }

  await new Promise(r => setTimeout(r, 2000));

  const title = await page.title();
  const url = page.url();
  console.log('Current URL:', url);
  console.log('Page Title:', title);

  await browser.close();
})();

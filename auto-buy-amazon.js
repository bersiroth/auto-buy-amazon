const puppeteer = require('puppeteer');

(async () => {
    const browser = await puppeteer.connect({ browserWSEndpoint: 'ws://browserless:3000' });
    const page = await browser.newPage();

    // go to amazon home page
    await page.goto('https://www.amazon.fr/');

    // disable cookies banner
    await page.click('.a-link-emphasis');

    // search cookies banner
    const searchInput = await page.$('#twotabsearchtextbox');
    await searchInput.type('vagabond tome 5');
    await searchInput.press('Enter');

    // check first result title
    // const priceSpan = await page.waitForSelector(('div[data-cel-widget="search_result_1"] span.a-price-whole'));
    // const priceValue = await page.evaluate(el => el.textContent, priceSpan);

    // check first result price
    const priceSpan = await page.waitForSelector(('div[data-cel-widget="search_result_1"] span.a-price-whole'));
    const priceValue = await page.evaluate(el => el.textContent, priceSpan);

    // check first result prime

    console.log(priceValue);

    await page.screenshot({ path: 'test.png' });

    await browser.close();
})().catch((e) => {
    console.log(e.message);
});
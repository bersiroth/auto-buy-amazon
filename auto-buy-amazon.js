import dotenv from 'dotenv'
import puppeteer from 'puppeteer'
import chalk from 'chalk';

dotenv.config()

function logStep(message) {
    console.log(chalk.green(message));
}

const startDate = new Date(2022,0,1);
const now = new Date();
const monthDiff = now.getMonth() - startDate.getMonth() +
    (12 * (now.getFullYear() - startDate.getFullYear()))  + 1;
const volumeNumber = monthDiff - 1;

console.log(chalk.blue('<=================================================================>'));
console.log('target = buy volume ' + chalk.red(volumeNumber));


(async () => {
    const browser = await puppeteer.connect({ browserWSEndpoint: 'ws://browserless:3000' });
    const page = await browser.newPage();

    // go to amazon home page
    logStep('1 - go to amazon home page');
    await page.goto('https://www.amazon.fr/');

    // disable cookies banner
    logStep('2 - disable cookies banner');
    const cookiesLink = await page.waitForSelector('.a-link-emphasis');
    await cookiesLink.click();

    // sign in
    logStep('3 - sign in');
    console.log('login');
    await page.click('a[data-nav-role="signin"]');
    const loginInput = await page.waitForSelector('#ap_email');
    await loginInput.type(process.env.AMAZON_LOGIN);
    await loginInput.press('Enter');
    console.log('password');
    const passwordInput = await page.waitForSelector('#ap_password');
    await passwordInput.type(process.env.AMAZON_PWD);
    await passwordInput.press('Enter');

    // search cookies banner
    const research = 'Vagabond T' + volumeNumber;
    logStep('4 - research ' + research);
    const searchInput = await page.waitForSelector('#twotabsearchtextbox');
    await searchInput.type(research);
    await searchInput.press('Enter');

    // find good article
    await page.waitForSelector('div[data-cel-widget="search_result_1"] span.a-price-whole');
    const article = await page.$$eval('div[data-component-type="s-search-result"]', (results, volumeNumber) => {
        let title;
        let price;
        for (let i = 0; i < results.length; i++) {
            const result = results[i];
            title = result.querySelector('h2').textContent;
            price = result.querySelector('span.a-price-whole') ? parseFloat(result.querySelector('span.a-price-whole').textContent) : null;
            if (title.toLowerCase().includes('vagabond')
                && (title.toLowerCase().includes(' ' + volumeNumber.toString() + ' ') || title.toLowerCase().includes('t' + volumeNumber.toString()))
                && result.querySelector('.s-title-instructions-style div')
                && !result.querySelector('.s-title-instructions-style div').textContent.toLowerCase().includes('édition en')
                && result.querySelector('.s-title-instructions-style div').textContent.toLowerCase().includes('inou')
                && !result.textContent.includes('Actuellement indisponible.')
                && result.querySelector('i[aria-label="Amazon Prime"]')
                && price
                && price < 10
            ) {
                result.querySelector('h2 a').click();
                break;
            }
        }
        return {
            title, price
        };
    }, volumeNumber);
    console.log('Find article with title ' + chalk.yellow(article.title.trim()) + ' and price ' + chalk.yellow(article.price + 'e'));

    // product page
    logStep('5 - go to article page');
    await page.waitForSelector('#productTitle');
    const language = await page.$eval("ol > li:nth-child(2) > div > div.a-section.a-spacing-none.a-text-center.rpi-attribute-value > span", (node) => node.textContent);
    console.log('language = ' + chalk.yellow(language));
    if (language !== 'Français') {
        return;
    }

    // buy now
    logStep('6 - buy now');
    const buyNowButton = await page.waitForSelector('#buy-now-button');
    await buyNowButton.click();
    await page.waitForSelector('#turbo-checkout-modal-header').finally(
        await page.screenshot(
            {
                path: 'error.png',
                fullPage: true
            }
        )
    );

    await page.screenshot(
        {
            path: 'screenshot-' + volumeNumber + '.png',
            fullPage: true
        }
    );

    await browser.close();
    console.log(chalk.blue('<=================================================================>'));
})().catch((e) => {
    console.log(e.message);
});
export async function getBrowser() {
    if (process.env.NODE_ENV === 'production') {
        // Production: Serverless Chromium
        const [chromiumModule, puppeteerModule] = await Promise.all([
            import('@sparticuz/chromium-min'),
            import('puppeteer-core')
        ]);

        const chromium = chromiumModule.default;
        const puppeteer = puppeteerModule.default;

        return puppeteer.launch({
            args: [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox'],
            defaultViewport: {
                width: 1920,
                height: 1080,
            },
            executablePath: await chromium.executablePath(),
            headless: true,
        });
    } else {
        // Local: Full Puppeteer with bundled Chrome
        const puppeteerModule = await import('puppeteer');
        const puppeteer = puppeteerModule.default;

        return puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });
    }
}
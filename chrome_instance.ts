import puppeteer, { Browser } from 'puppeteer';
import lighthouse from 'lighthouse';

export class ChromeInstance {
    private browser: Browser | null = null;

    async initialize() {
        console.log('Chrome 인스턴스 초기화 시작');
        this.browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        console.log('Chrome 인스턴스 초기화 완료');
    }

    async runLighthouse(url: string): Promise<any> {
        if (!this.browser) {
            throw new Error('Browser not initialized');
        }

        console.log(`Lighthouse 분석 시작: ${url}`);
        
        const page = await this.browser.newPage();
        const port = (new URL((await page.browser().wsEndpoint())).port);
        const options = {
            port: parseInt(port),
            output: 'json',
            logLevel: 'error',
        };

        try {
            const runnerResult = await lighthouse(url, options);
            if (!runnerResult) {
                throw new Error('Lighthouse analysis failed');
            }
            console.log(`Lighthouse 분석 완료: ${url}`);
            
            return JSON.parse(runnerResult.report);
        } catch (error: any) {
            console.error(`Lighthouse 분석 실패: ${url}`, error);
            throw error;
        } finally {
            await page.close();
        }
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
            console.log('Chrome 인스턴스 종료');
        }
    }
}
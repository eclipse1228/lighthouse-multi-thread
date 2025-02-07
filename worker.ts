import { parentPort, workerData } from 'worker_threads';
import { ChromeInstance } from './chrome_instance.js';

interface WorkerMessage {
    url: string;
    institution: any;
}

if (!parentPort) {
    throw new Error('이 스크립트는 워커 스레드로만 실행할 수 있습니다.');
}

const workerId = workerData.workerId;
console.log(`워커 ${workerId} 시작`);

let chromeInstance: ChromeInstance | null = null;

parentPort.on('message', async (message: WorkerMessage) => {
    try {
        if (!chromeInstance) {
            console.log(`워커 ${workerId}: Chrome 인스턴스 초기화 중...`);
            chromeInstance = new ChromeInstance();
            await chromeInstance.initialize();
        }

        console.log(`워커 ${workerId}: URL 분석 시작 - ${message.url}`);
        const lighthouseResult = await chromeInstance.runLighthouse(message.url);

        parentPort?.postMessage({
            status: 'success',
            url: message.url,
            data: lighthouseResult,
            institution: message.institution
        });

    } catch (error) {
        console.error(`워커 ${workerId} 오류:`, error);
        parentPort?.postMessage({
            status: 'error',
            url: message.url,
            error: error instanceof Error ? error.message : String(error)
        });
    }
});

process.on('SIGINT', async () => {
    console.log(`\n워커 ${workerId} 종료 신호 감지`);
    if (chromeInstance) {
        await chromeInstance.close();
    }
    process.exit(0);
});

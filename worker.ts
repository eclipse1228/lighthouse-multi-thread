import { parentPort, workerData } from 'worker_threads';
import { ChromeInstance } from './chrome_instance.js';

interface WorkerMessage {
    url: string;
    institution: any;
}

if (!parentPort) {
    throw new Error('this script can only be run as a worker thread.');
}

const workerId = workerData.workerId;
console.log(`Worker ${workerId} Start`);

let chromeInstance: ChromeInstance | null = null;

// 메인 스레드(index.ts)로 부터 메시지를 받으면 실행되는 이벤트 리스너
parentPort.on('message', async (message: WorkerMessage) => {
    try {
        if (!chromeInstance) {
            console.log(`Worker ${workerId}: Chrome instance initialization...`);
            chromeInstance = new ChromeInstance();
            await chromeInstance.initialize();
        }

        console.log(`Worker ${workerId}: URL Analysis Started - ${message.url}`);
        const lighthouseResult = await chromeInstance.runLighthouse(message.url);

        // 성공한 경우에만 데이터 전송
        parentPort?.postMessage({ // postMessage() is worker send result to main thread
            status: 'success',
            url: message.url,
            data: lighthouseResult,
            institution: message.institution
        });

    } catch (error) {
        console.error(`워커 ${workerId} 오류:`, error);
        // 에러가 발생한 경우 error 상태로 메시지 전송
        parentPort?.postMessage({
            status: 'error',
            url: message.url,
            error: error instanceof Error ? error.message : String(error)
        });

        // Chrome 인스턴스 재생성을 위해 현재 인스턴스 정리
        if (chromeInstance) {
            await chromeInstance.close();
            chromeInstance = null;
        }
    }
});

process.on('SIGINT', async () => {
    console.log(`\nWorker ${workerId} Stop`);
    if (chromeInstance) {
        console.log('Chrome 인스턴스 종료(Chrome Instance closing)');
        await chromeInstance.close();
    }
    process.exit(0);
});

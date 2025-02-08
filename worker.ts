import { parentPort, workerData } from 'worker_threads';
import { ChromeInstance } from './chrome_instance.js';
import winston from 'winston';
import os from 'os';

interface WorkerMessage {
    url: string;
    institution: any;
}

// Winston 로거 설정
const logger = winston.createLogger({
    level: 'debug',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    defaultMeta: { 
        worker_id: workerData.workerId,
        hostname: os.hostname(),
        pid: process.pid
    },
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' }),
        new winston.transports.Console({
            format: winston.format.simple()
        })
    ]
});

if (!parentPort) {
    throw new Error('this script can only be run as a worker thread.');
}

const workerId = workerData.workerId;
logger.info('Worker started', {
    event: 'worker_start',
    memory_usage: process.memoryUsage()
});

let chromeInstance: ChromeInstance | null = null;

// 메인 스레드(index.ts)로 부터 메시지를 받으면 실행되는 이벤트 리스너
parentPort.on('message', async (message: WorkerMessage) => {
    const startTime = Date.now();
    try {
        if (!chromeInstance) {
            logger.debug('Initializing Chrome instance', {
                event: 'chrome_init_start'
            });
            chromeInstance = new ChromeInstance();
            await chromeInstance.initialize();
            logger.debug('Chrome instance initialized', {
                event: 'chrome_init_complete'
            });
        }

        logger.info('URL Analysis Started', {
            event: 'analysis_start',
            url: message.url,
            memory_usage: process.memoryUsage()
        });

        const lighthouseResult = await chromeInstance.runLighthouse(message.url);

        logger.info('URL Analysis Completed', {
            event: 'analysis_complete',
            url: message.url,
            duration_ms: Date.now() - startTime,
            memory_usage: process.memoryUsage()
        });

        // 성공한 경우에만 데이터 전송
        parentPort?.postMessage({
            status: 'success',
            url: message.url,
            data: lighthouseResult,
            institution: message.institution
        });

    } catch (error) {
        logger.error('Worker error occurred', {
            event: 'worker_error',
            url: message.url,
            error: error instanceof Error ? error.message : String(error),
            error_stack: error instanceof Error ? error.stack : undefined,
            duration_ms: Date.now() - startTime,
            memory_usage: process.memoryUsage()
        });

        // 에러가 발생한 경우 error 상태로 메시지 전송
        parentPort?.postMessage({
            status: 'error',
            url: message.url,
            error: error instanceof Error ? error.message : String(error)
        });

        // Chrome 인스턴스 재생성을 위해 현재 인스턴스 정리
        if (chromeInstance) {
            logger.debug('Closing Chrome instance after error', {
                event: 'chrome_close_error'
            });
            await chromeInstance.close();
            chromeInstance = null;
        }
    }
});

process.on('SIGINT', async () => {
    logger.info('Worker stopping', {
        event: 'worker_stop',
        memory_usage: process.memoryUsage()
    });
    
    if (chromeInstance) {
        await chromeInstance.close();
    }
    process.exit(0);
});

// 예기치 않은 에러 처리
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', {
        event: 'uncaught_exception',
        error: error.message,
        error_stack: error.stack,
        memory_usage: process.memoryUsage()
    });
});

process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection', {
        event: 'unhandled_rejection',
        error: reason instanceof Error ? reason.message : String(reason),
        error_stack: reason instanceof Error ? reason.stack : undefined,
        memory_usage: process.memoryUsage()
    });
});

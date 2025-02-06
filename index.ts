import { Worker } from 'worker_threads';
import { MongoClient, Collection } from 'mongodb';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { UrlManager } from './url_manager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MongoDB 연결 설정
const MONGO_URI = 'mongodb://localhost:27017';
const DB_NAME = 'eco-web';

// CPU 코어 수에 기반한 워커 수 설정
const NUM_WORKERS = os.cpus().length; // 현재 나는 16개 

interface WorkerStatus {
    worker: Worker;
    busy: boolean;
    lastUrl?: string;
}
let resourceCollection: Collection;
let trafficCollection: Collection;

async function main() {
    console.log('프로그램 시작: 워커 수 =', NUM_WORKERS);

    try {
        // MongoDB 연결
        const client = await MongoClient.connect(MONGO_URI);
        const db = client.db(DB_NAME);
        
        // 컬렉션 생성 (처음 실행시..)
        // resourceCollection = await db.createCollection('lighthouse_resource');
        // trafficCollection = await db.createCollection('lighthouse_traffic');
        
        resourceCollection = db.collection('lighthouse_resource');
        trafficCollection = db.collection('lighthouse_traffic');

        console.log('MongoDB 연결 or 컬렉션 생성 완료');

        // URL 관리자 초기화`
        const urlManager = new UrlManager(resourceCollection, trafficCollection);
        await urlManager.loadUrls();

        // 워커 생성
        const workers: WorkerStatus[] = [];
        
        for (let i = 0; i < NUM_WORKERS; i++) {
            const worker = new Worker(path.join(__dirname, 'worker.js'), {
                workerData: { workerId: i }
            });
            workers.push({ worker, busy: false });

            worker.on('message', async (message: { status: string; url: string; error?: string }) => {
                const workerStatus = workers.find(w => w.worker === worker);
                if (!workerStatus) return;

                if (message.status === 'success') {
                    console.log(`작업 완료: ${message.url}`);
                } else {
                    console.error(`작업 실패: ${message.url}`, message.error);
                }

                workerStatus.busy = false;
                workerStatus.lastUrl = undefined;

                // 다음 URL 처리
                await processNextUrl(workerStatus);
            });

            worker.on('error', (error) => {
                console.error('워커 에러:', error);
            });

            worker.on('exit', (code) => {
                if (code !== 0) {
                    console.error(`워커가 종료됨 (코드: ${code})`);
                }
            });
        }

        // 메모리 모니터링
        const monitoringInterval = setInterval(() => {
            const usedMemory = process.memoryUsage().heapUsed / 1024 / 1024;
            console.log(`현재 메모리 사용량: ${Math.round(usedMemory)}MB`);
            console.log(urlManager.getProgress());

            // 모든 작업이 완료되었는지 확인
            if (!urlManager.hasNext() && workers.every(w => !w.busy)) {
                console.log('모든 작업이 완료되었습니다.');
                clearInterval(monitoringInterval);
                process.exit(0);
            }
        }, 5000);

        // 초기 작업 분배
        for (const workerStatus of workers) {
            await processNextUrl(workerStatus);
        }

        async function processNextUrl(workerStatus: WorkerStatus) {
            if (workerStatus.busy || !urlManager.hasNext()) return;

            const institution = urlManager.getNext();
            if (!institution) return;

            workerStatus.busy = true;
            workerStatus.lastUrl = institution.siteLink;
            workerStatus.worker.postMessage(institution);
        }

    } catch (error) {
        console.error('에러 발생:', error);
        process.exit(1);
    }
}

main().catch(console.error);

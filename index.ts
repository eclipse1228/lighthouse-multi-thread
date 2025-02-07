import { Worker } from 'worker_threads';
import { MongoClient, Collection } from 'mongodb';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { UrlManager } from './url_manager.js';
import { ChromeInstance } from './chrome_instance.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// MongoDB 연결 설정
const MONGO_URI = 'mongodb://localhost:27017';
const DB_NAME = 'eco-web';

// CPU 코어 수에 기반한 워커 수 설정
const NUM_WORKERS = os.cpus().length - 12; // 현재 4개 
console.log('사용 가능한 CPU 코어:', os.cpus().length);
console.log('설정된 워커 수:', NUM_WORKERS);

interface WorkerStatus {
    worker: Worker;
    busy: boolean;
    lastUrl?: string;
    startTime?: number;
}

interface Institution {
    siteLink: string;
    siteName: string;
    [key: string]: any;
}

let resourceCollection: Collection;
let trafficCollection: Collection;
let client: MongoClient;

async function cleanup() {
    console.log('프로그램 종료 및 리소스 정리 시작...');
    
    // MongoDB 연결 종료
    if (client) {
        console.log('MongoDB 연결 종료 중...');
        await client.close();
        console.log('MongoDB 연결 종료 완료');
    }
}

process.on('SIGINT', async () => {
    console.log('\n프로그램 강제 종료 신호 감지');
    await cleanup();
    process.exit(0);
});

async function main() {
    console.log('프로그램 시작: 워커 수 =', NUM_WORKERS);
    console.log('시작 시간:', new Date().toISOString());

    try {
        // MongoDB 연결
        client = await MongoClient.connect(MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 10000
        });
        const db = client.db(DB_NAME);
        
        // 컬렉션 생성 (처음 실행시..)
        // resourceCollection = await db.createCollection('lighthouse_resource');
        // trafficCollection = await db.createCollection('lighthouse_traffic');
        
        resourceCollection = db.collection('lighthouse_resource');
        trafficCollection = db.collection('lighthouse_traffic');

        console.log('MongoDB 연결 완료');
        console.log('컬렉션 준비 완료:', {
            resource: await resourceCollection.countDocuments(),
            traffic: await trafficCollection.countDocuments()
        });

        // URL 관리자 초기화
        const urlManager = new UrlManager(resourceCollection, trafficCollection);
        await urlManager.loadUrls();
        console.log('URL 관리자 초기화 완료');

        // 워커 생성
        const workers: WorkerStatus[] = [];
        let processedCount = 0;
        const TEST_LIMIT = 8;
        
        for (let i = 0; i < NUM_WORKERS; i++) {
            console.log(`워커 ${i} 생성 중...`);
            const worker = new Worker(path.join(__dirname, 'worker.js'), {
                workerData: { workerId: i }
            });
            workers.push({ worker, busy: false });

            worker.on('message', async (message: { 
                status: string; 
                url: string; 
                data?: { 
                    networkRequests: any[]; 
                    resourceSummary: any[]; 
                }; 
                institution?: Institution;
                error?: string 
            }) => {
                const workerStatus = workers.find(w => w.worker === worker);
                if (!workerStatus) return;

                const duration = workerStatus.startTime ? 
                    ((Date.now() - workerStatus.startTime) / 1000).toFixed(2) : 'N/A';

                if (message.status === 'success' && message.data && message.institution) {
                    try {
                        console.log(`데이터 저장 시작: ${message.url}`);
                        
                        // lighthouse_resource 컬렉션에 저장
                        await resourceCollection.insertOne({
                            url: message.url,
                            network_request: message.data.networkRequests,
                            ...message.institution
                        });
                        console.log('lighthouse_resource 데이터 저장 완료');

                        // lighthouse_traffic 컬렉션에 저장
                        await trafficCollection.insertOne({
                            url: message.url,
                            resource_summary: message.data.resourceSummary,
                            ...message.institution
                        });
                        console.log('lighthouse_traffic 데이터 저장 완료');

                        console.log(`작업 완료: ${message.url} (소요 시간: ${duration}초)`);
                        processedCount++;
                    } catch (error) {
                        console.error(`MongoDB 저장 중 오류: ${message.url}`, error);
                    }
                } else {
                    console.error(`작업 실패: ${message.url} (소요 시간: ${duration}초)`, message.error);
                }

                workerStatus.busy = false;
                workerStatus.lastUrl = message.url;

                // 테스트 제한에 도달했는지 확인
                if (processedCount >= TEST_LIMIT) {
                    console.log(`테스트 제한(${TEST_LIMIT})에 도달. 프로그램을 종료합니다.`);
                    await cleanup();
                    process.exit(0);
                }

                // 다음 URL 처리
                const nextUrl = await urlManager.getNext();
                console.log('다음 URL 가져옴:', nextUrl?.siteLink);
                
                if (nextUrl) {
                    workerStatus.busy = true;
                    workerStatus.startTime = Date.now();
                    worker.postMessage({ url: nextUrl.siteLink, institution: nextUrl });
                }
            });

            worker.on('error', (error) => {
                console.error(`워커 ${i} 오류:`, error);
            });

            worker.on('exit', (code) => {
                console.log(`워커 ${i} 종료. 종료 코드:`, code);
            });
        }

        // 초기 URL 할당
        for (const workerStatus of workers) {
            const url = await urlManager.getNext();
            console.log('초기 URL 할당:', url?.siteLink);
            
            if (url) {
                workerStatus.busy = true;
                workerStatus.startTime = Date.now();
                workerStatus.worker.postMessage({ url: url.siteLink, institution: url });
            }
        }

        // 메모리 사용량 모니터링
        setInterval(() => {
            const used = process.memoryUsage();
            console.log('메모리 사용량:', {
                heapUsed: `${Math.round(used.heapUsed / 1024 / 1024)}MB`,
                heapTotal: `${Math.round(used.heapTotal / 1024 / 1024)}MB`,
                external: `${Math.round(used.external / 1024 / 1024)}MB`
            });
        }, 30000);

    } catch (error) {
        console.error('치명적 오류 발생:', error);
        await cleanup();
        process.exit(1);
    }
}

main().catch(async (error) => {
    console.error('메인 프로세스 오류:', error);
    await cleanup();
    process.exit(1);
});

import { ChromeInstance } from './chrome_instance.js';
import { MongoClient } from 'mongodb';

interface NetworkRequest {
    url: string;
    resourceType: string;
    mimeType: string;
    finished: boolean;
    statusCode: number;
    resourceSize: number;
    transferSize: number;
}

interface LighthouseAuditDetails {
    items?: NetworkRequest[];
}

interface LighthouseAudit {
    details?: LighthouseAuditDetails;
    numericValue?: number;
}

interface LighthouseResult {
    audits?: {
        'network-requests'?: LighthouseAudit;
        'network-rtt'?: LighthouseAudit;
        'network-server-latency'?: LighthouseAudit;
    };
}

async function testSingleUrl() {
    const testUrl = 'http://www.bai.go.kr';
    let chromeInstance: ChromeInstance | null = null;
    let client: MongoClient | null = null;
    
    try {
        console.log('프로그램 시작');
        console.log('테스트 URL:', testUrl);
        
        // MongoDB 연결 시도
        console.log('MongoDB 연결 시도 중...');
        client = await MongoClient.connect('mongodb://localhost:27017', {
            serverSelectionTimeoutMS: 5000,
            connectTimeoutMS: 10000
        });
        console.log('MongoDB 연결 성공');
        
        const db = client.db('eco-web');
        const resourceCollection = db.collection('lighthouse_resource');
        const trafficCollection = db.collection('lighthouse_traffic');
        
        // Chrome 인스턴스 생성 및 초기화
        console.log('Chrome 인스턴스 생성 중...');
        chromeInstance = new ChromeInstance();
        await chromeInstance.initialize();
        
        // Lighthouse 분석 실행
        console.log('Lighthouse 분석 시작...');
        const result = await chromeInstance.runLighthouse(testUrl) as LighthouseResult;
        
        // 결과 처리
        console.log('\n결과 처리 시작...');
        console.log('Lighthouse 결과 구조:', {
            hasResult: !!result,
            hasAudits: !!result?.audits,
            hasNetworkRequests: !!result?.audits?.['network-requests'],
            hasNetworkRTT: !!result?.audits?.['network-rtt'],
            hasServerLatency: !!result?.audits?.['network-server-latency']
        });

        // 네트워크 요청 처리
        const networkRequests = result?.audits?.['network-requests']?.details?.items || [];
        console.log(`총 네트워크 요청 수: ${networkRequests.length}`);
        
        if (networkRequests.length > 0) {
            console.log('\n처음 5개 요청:');
            networkRequests.slice(0, 5).forEach((req: NetworkRequest, index: number) => {
                console.log(`${index + 1}. ${req.url} (${req.resourceType})`);
            });
        } else {
            console.log('네트워크 요청이 없습니다.');
        }

        // 성능 메트릭 추출
        const timestamp = new Date();
        const rtt = result?.audits?.['network-rtt']?.numericValue || 0;
        const serverLatency = result?.audits?.['network-server-latency']?.numericValue || 0;
        
        console.log('\n성능 메트릭:');
        console.log('- RTT:', rtt, 'ms');
        console.log('- 서버 지연 시간:', serverLatency, 'ms');
        
        // 데이터 저장
        console.log('\n데이터 저장 시작...');
        const saveData = {
            url: testUrl,
            timestamp: timestamp,
            networkRequests: networkRequests,
            rtt: rtt,
            serverLatency: serverLatency
        };
        console.log('저장할 데이터:', saveData);

        await Promise.all([
            resourceCollection.insertOne({
                url: testUrl,
                timestamp: timestamp,
                networkRequests: networkRequests
            }),
            trafficCollection.insertOne({
                url: testUrl,
                timestamp: timestamp,
                rtt: rtt,
                serverLatency: serverLatency
            })
        ]);
        
        console.log('데이터 저장 완료');
        
    } catch (error: any) {
        console.error('\n오류 발생:');
        console.error('메시지:', error.message);
        if (error.stack) {
            console.error('스택:', error.stack);
        }
    } finally {
        console.log('\n정리 작업 시작...');
        
        if (chromeInstance) {
            try {
                await chromeInstance.close();
                console.log('Chrome 인스턴스 종료 완료');
            } catch (error) {
                console.error('Chrome 인스턴스 종료 중 오류:', error);
            }
        }
        
        if (client) {
            try {
                await client.close();
                console.log('MongoDB 연결 종료');
            } catch (error) {
                console.error('MongoDB 연결 종료 중 오류:', error);
            }
        }
        
        console.log('\n프로그램 종료');
        process.exit(0);
    }
}

process.on('SIGINT', () => {
    console.log('\n프로그램 강제 종료 요청 받음');
    process.exit(1);
});

testSingleUrl().catch(error => {
    console.error('최상위 오류 발생:', error);
    process.exit(1);
});

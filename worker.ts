import { parentPort, workerData } from 'worker_threads';
import { ChromeInstance } from './chrome_instance.js';
import { MongoClient } from 'mongodb';

async function processUrl(url: string, institutionData: any) {
    const chrome = new ChromeInstance();
    await chrome.initialize();

    try {
        const lighthouseResult = await chrome.runLighthouse(url);
        
        // MongoDB 연결
        const client = await MongoClient.connect('mongodb://localhost:27017');
        const db = client.db('ecoweb');

        // 네트워크 요청 데이터 추출 및 저장
        const networkRequests = lighthouseResult.artifacts.NetworkRequests;
        const resourceData = {
            url: url,
            network_request: networkRequests.map((req: any) => ({
                url: req.url,
                resourceType: req.resourceType,
                mimeType: req.mimeType,
                finished: req.finished,
                statusCode: req.statusCode,
                resourceSize: req.resourceSize,
                transferSize: req.transferSize
            }))
        };

        // 리소스 타입별 요약 데이터 생성
        const resourceSummary = Object.entries(
            networkRequests.reduce((acc: any, req: any) => {
                if (!acc[req.resourceType]) {
                    acc[req.resourceType] = 0;
                }
                acc[req.resourceType] += req.transferSize || 0;
                return acc;
            }, {})
        ).map(([resourceType, transferSize]) => ({
            resourceType,
            transferSize
        }));

        const trafficData = {
            url,
            resource_summary: resourceSummary,
            ...institutionData
        };

        // 데이터 저장
        await Promise.all([
            db.collection('lighthouse_resource').insertOne(resourceData),
            db.collection('lighthouse_traffic').insertOne(trafficData)
        ]);

        console.log(`데이터 저장 완료: ${url}`);
        await client.close();

    } catch (error) {
        console.error(`작업 실패: ${url}`, error);
        throw error;
    } finally {
        await chrome.close();
    }
}

// 워커 메시지 수신 및 처리
if (parentPort) {
    parentPort.on('message', async (data) => {
        try {
            await processUrl(data.url, data.institutionData);
            parentPort?.postMessage({ status: 'success', url: data.url });
        } catch (error: any) {
            parentPort?.postMessage({ status: 'error', url: data.url, error: error?.message || 'Unknown error' });
        }
    });
}

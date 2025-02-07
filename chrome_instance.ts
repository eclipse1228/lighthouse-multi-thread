import * as chromeLauncher from 'chrome-launcher';
import lighthouse from 'lighthouse';
import { resolve } from 'path';
import { rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';

interface NetworkRequest {
    url: string;
    resourceType: string;
    mimeType: string;
    finished: boolean;
    statusCode: number;
    resourceSize: number;
    transferSize: number;
    protocol: string;
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
        'resource-summary'?: LighthouseAudit;
    };
}

export class ChromeInstance {
    private chrome: any;
    private tempDir: string;

    constructor() {
        // Lighthouse 임시 파일을 저장할 디렉토리 설정
        this.tempDir = join(tmpdir(), `lighthouse-${process.pid}`);
        console.log('Lighthouse 임시 디렉토리(Temp Directory):', this.tempDir);
    }

    async initialize() {
        console.log('Chrome 인스턴스 초기화 시작(Chrome Instance initialization)');
        
        const chromeFlags = [
            '--headless',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
            `--user-data-dir=${this.tempDir}` // 임시 디렉토리 사용
        ];

        // Windows 환경의 Chrome 경로
        const chromePath = process.platform === 'win32'
            ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
            : '/usr/bin/google-chrome';

        console.log('Chrome 경로(Chrome path):', chromePath);
        
        const options = {
            chromeFlags: chromeFlags,
            chromePath: chromePath
        };

        console.log('Chrome 실행 옵션:', options);

        try {
            this.chrome = await chromeLauncher.launch(options);
            console.log('Chrome 인스턴스 성공적으로 시작됨(Chrome Instance started successfully)');
            console.log('Chrome 포트(Chrome port):', this.chrome.port);
        } catch (error) {
            console.error('Chrome 인스턴스 시작 중 오류(Chrome Instance failed to start):', error);
            throw error;
        }
    }

    async runLighthouse(url: string) {
        if (!this.chrome) {
            throw new Error('Chrome 인스턴스가 초기화되지 않았습니다.(Chrome Instance not initialized)');
        }

        console.log('Lighthouse 분석 시작(Lighthouse Analysis Started):', url);

        const options = {
            logLevel: 'info',
            output: 'json',
            port: this.chrome.port,
            onlyCategories: ['performance'],
            onlyAudits: [
                'network-requests',
                'resource-summary',
                'network-rtt',
                'network-server-latency'
            ],
            settings: {
                formFactor: 'desktop',
                throttling: {
                    cpuSlowdownMultiplier: 1,
                    requestLatencyMs: 0,
                    downloadThroughputKbps: 0,
                    uploadThroughputKbps: 0
                }
            }
        };
        console.log('Lighthouse 설정(Lighthouse Options):', JSON.stringify(options, null, 2));

        try {
            console.log('Lighthouse 분석 실행 중...(Lighthouse Analysis Running)');
            const runnerResult = await lighthouse(url, options);
            console.log('Lighthouse 분석 완료(Lighthouse Analysis Completed):', url);

            const result = runnerResult as unknown as { lhr: LighthouseResult };
            
            // 네트워크 요청 데이터 추출
            const networkRequests = result.lhr.audits?.['network-requests']?.details?.items || [];
            console.log('네트워크 요청 데이터 추출 완료');
            
            if (!networkRequests.length) { 
                throw new Error('Network requests empty');
            }

            // 네트워크 요약 데이터 추출
            const resourceSummary = result.lhr.audits?.['resource-summary']?.details?.items || [];
            console.log('네트워크 요약 데이터 추출:', JSON.stringify(resourceSummary, null, 2));

            console.log('데이터 추출 완료(Data Extraction Completed)');
            console.log('네트워크 요청 수(Network Requests):', networkRequests.length);

            return {
                networkRequests: networkRequests.map((request: NetworkRequest) => ({
                    url: request.url,
                    resourceType: request.resourceType,
                    resourceSize: request.resourceSize,
                    transferSize: request.transferSize,
                    statusCode: request.statusCode,
                    protocol: request.protocol
                })),
                resourceSummary: resourceSummary
            };
        } catch (error) {
            console.error('Lighthouse 분석 중 오류 (Lighthouse Analysis Error):', error);
            throw error;
        }
    }

    async close() {
        console.log('리소스 정리 시작(Start Resource Summary)...');
        
        if (this.chrome) {
            console.log('Chrome 인스턴스 종료 중(Killing Chrome Instance)...');
            await this.chrome.kill();
            console.log('Chrome 인스턴스 종료 완료(Chrome Instance Closed)');
        }

        try {
            await rm(this.tempDir, { recursive: true, force: true });
            console.log('임시 파일 정리 완료(Cleaning Temp Files Completed)');
        } catch (error) {
            console.warn('임시 파일 정리 중 오류(Cleaning Temp Files Error):', error);
        }
    }
}
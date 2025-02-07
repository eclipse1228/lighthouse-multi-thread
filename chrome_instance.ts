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
    };
}

export class ChromeInstance {
    private chrome: any;
    private tempDir: string;

    constructor() {
        // Lighthouse 임시 파일을 저장할 디렉토리 설정
        this.tempDir = join(tmpdir(), `lighthouse-${process.pid}`);
        console.log('Lighthouse 임시 디렉토리:', this.tempDir);
    }

    async initialize() {
        console.log('Chrome 인스턴스 초기화 시작');
        
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

        console.log('Chrome 경로:', chromePath);
        
        const options = {
            chromeFlags: chromeFlags,
            chromePath: chromePath
        };

        console.log('Chrome 실행 옵션:', options);

        try {
            this.chrome = await chromeLauncher.launch(options);
            console.log('Chrome 인스턴스 성공적으로 시작됨');
            console.log('Chrome 포트:', this.chrome.port);
        } catch (error) {
            console.error('Chrome 인스턴스 시작 중 오류:', error);
            throw error;
        }
    }

    async runLighthouse(url: string) {
        if (!this.chrome) {
            throw new Error('Chrome 인스턴스가 초기화되지 않았습니다.');
        }

        console.log('Lighthouse 분석 시작:', url);

        const options = {
            logLevel: 'info',
            output: 'json',
            port: this.chrome.port,
            onlyCategories: ['performance'],
            onlyAudits: [
                'network-requests',
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
        console.log('Lighthouse 설정:', JSON.stringify(options, null, 2));

        try {
            console.log('Lighthouse 분석 실행 중...');
            const runnerResult = await lighthouse(url, options);
            console.log('Lighthouse 분석 완료:', url);

            const result = runnerResult as unknown as { lhr: LighthouseResult };
            
            // 네트워크 요청 데이터 추출
            const networkRequests = result.lhr.audits?.['network-requests']?.details?.items || [];
            
            // 리소스 타입별 요약 데이터 생성
            const resourceSummary = networkRequests.reduce((acc: any[], request: NetworkRequest) => {
                const existingType = acc.find(item => item.resourceType === request.resourceType);
                if (existingType) {
                    existingType.transferSize += request.transferSize || 0;
                } else {
                    acc.push({
                        resourceType: request.resourceType,
                        transferSize: request.transferSize || 0
                    });
                }
                return acc;
            }, []);

            console.log('데이터 추출 완료');
            console.log('네트워크 요청 수:', networkRequests.length);
            console.log('리소스 타입 수:', resourceSummary.length);

            return {
                networkRequests: networkRequests.map((request: NetworkRequest) => ({
                    url: request.url,
                    resourceType: request.resourceType,
                    mimeType: request.mimeType,
                    finished: request.finished,
                    statusCode: request.statusCode,
                    resourceSize: request.resourceSize,
                    transferSize: request.transferSize
                })),
                resourceSummary
            };
        } catch (error) {
            console.error('Lighthouse 분석 중 오류:', error);
            throw error;
        }
    }

    async close() {
        console.log('리소스 정리 시작...');
        
        if (this.chrome) {
            console.log('Chrome 인스턴스 종료 중...');
            await this.chrome.kill();
            console.log('Chrome 인스턴스 종료 완료');
        }

        try {
            console.log('임시 파일 정리 중...');
            await rm(this.tempDir, { recursive: true, force: true });
            console.log('임시 파일 정리 완료');
        } catch (error) {
            console.warn('임시 파일 정리 중 오류:', error);
        }
    }
}
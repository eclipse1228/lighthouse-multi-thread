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

interface ResourceSummaryItem {
    // Add properties for ResourceSummaryItem
}

interface LighthouseAuditDetails {
    items?: NetworkRequest[];
}

interface LighthouseAudit {
    details?: LighthouseAuditDetails;
    numericValue?: number;
    displayValue?: string;
}

interface LighthouseResult {
    audits?: {
        'network-requests'?: LighthouseAudit;
        'resource-summary'?: LighthouseAudit;
        'unused-javascript'?: LighthouseAudit;
        'unused-css-rules'?: LighthouseAudit;
        'modern-image-formats'?: LighthouseAudit;
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

        // Windows 환경의 Chrome 경로 , Linux 환경의 Chrome 경로 설정
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
        } catch (error: unknown) {
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
            port: this.chrome.port, // Chrome 인스턴스의 port 직접 사용
            output: 'json',
            logLevel: 'info', // 'verbose' -> 'silent'로 변경하여 로그 비활성화
            chromeFlags: [
                '--headless',
                '--disable-gpu',
                '--no-sandbox',
                '--disable-dev-shm-usage',
                '--disable-software-rasterizer',
                '--no-zygote',
                '--disable-setuid-sandbox',
                '--disable-accelerated-2d-canvas',
                '--disable-accelerated-jpeg-decoding',
                '--disable-accelerated-mjpeg-decode',
                '--disable-accelerated-video-decode',
                '--disable-gpu-rasterization',
                '--disable-zero-copy',
                '--ignore-certificate-errors'
            ],
            onlyCategories: ['performance'],
            skipAudits: [
                'screenshot-thumbnails',
                'final-screenshot',
                'full-page-screenshot'
            ],
            settings: {
                formFactor: 'desktop',
                throttling: {
                    rttMs: 40,
                    throughputKbps: 10240,
                    cpuSlowdownMultiplier: 1,
                    requestLatencyMs: 0,
                    downloadThroughputKbps: 0,
                    uploadThroughputKbps: 0
                },
            },
            audits: [
                'network-requests',
                'resource-summary',
                'network-rtt',
                'network-server-latency',
                'unused-javascript',
                'unused-css-rules',
                'modern-image-formats'
            ]
        };

        console.log('Lighthouse 옵션:', options);

        try {
            const runnerResult = await lighthouse(url, options);
            console.log('Lighthouse 분석 완료(Lighthouse Analysis Completed):', url);

            const result = { lhr: runnerResult.lhr };
            
            // 네트워크 요청 데이터 추출
            const networkRequests = (result.lhr.audits?.['network-requests']?.details?.items || []) as NetworkRequest[];
            
            if (!networkRequests.length) { 
                throw new Error('Network requests empty');
            }

            // 네트워크 요약 데이터 추출
            const resourceSummary = (result.lhr.audits?.['resource-summary']?.details?.items || []) as ResourceSummaryItem[];

            // 미사용 자바스크립트, CSS, 이미지 포맷 데이터 추출
            const unusedJavaScript = result.lhr.audits?.['unused-javascript'];
            const unusedCssRules = result.lhr.audits?.['unused-css-rules'];
            const modernImageFormats = result.lhr.audits?.['modern-image-formats'];

            // lighthouse_unused 테이블에 저장할 데이터 구성
            const unusedData = {
                url: url,
                timestamp: new Date(),
                unused_javascript: {
                    displayValue: unusedJavaScript?.displayValue || '',
                    numericValue: unusedJavaScript?.numericValue || 0
                },
                unused_css_rules: {
                    displayValue: unusedCssRules?.displayValue || '',
                    numericValue: unusedCssRules?.numericValue || 0
                },
                modern_image_formats: {
                    displayValue: modernImageFormats?.displayValue || '',
                    numericValue: modernImageFormats?.numericValue || 0
                }
            };

            return {
                networkRequests: networkRequests.map((request: NetworkRequest) => ({
                    url: request.url,
                    resourceType: request.resourceType,
                    resourceSize: request.resourceSize,
                    transferSize: request.transferSize,
                    statusCode: request.statusCode,
                    protocol: request.protocol
                })),
                resourceSummary: resourceSummary,
                unusedData: unusedData
            };
        } catch (error: unknown) {
            console.log('Lighthouse 분석 중 에러 발생:', error);
            // error가 Error 타입인지 확인
            if (error instanceof Error && 
                (error.message.includes('LanternError') || error.message.includes('cycle detected'))) {
                console.warn('Lighthouse 분석 중 LanternError 발생 (무시됨):', url);
                return {
                    networkRequests: [],
                    resourceSummary: [],
                    unusedData: {
                        url: url,
                        timestamp: new Date(),
                        unused_javascript: { displayValue: '', numericValue: 0 },
                        unused_css_rules: { displayValue: '', numericValue: 0 },
                        modern_image_formats: { displayValue: '', numericValue: 0 }
                    }
                };
            }
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
        } catch (error: unknown) {
            console.warn('임시 파일 정리 중 오류(Cleaning Temp Files Error):', error);
        }
    }
}
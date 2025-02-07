// js 라이브러리를 안전하게 사용하려면 d.ts 파일 필요합니다. 
declare module 'lighthouse' {
    interface NetworkRequest {
        url: string;
        resourceType: string;
        resourceSize: number;
        transferSize: number;
        statusCode: number;
        protocol: string;
    }
    interface UnusedCssItem {
        numericValue: number;
        displayValue: string;  // 빈 문자열이 될 수 있음
    }
    interface UnusedJsItem{
        numericValue: number;
        displayValue: string;  // "Potential savings of X KiB" 형식
    }
    interface ModernImageItem {
        numericValue: number;
        displayValue: string;  // "Potential savings of X KiB" 형식
    }

    interface ResourceSummaryItem {
        resourceType: string;
        label: string;
        requestCount: number;
        transferSize: number;
    }

    interface LighthouseAuditDetails {
        items: NetworkRequest[] | ResourceSummaryItem[] | UnusedCssItem[] | UnusedJsItem[] | ModernImageItem[];
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
        report: string;
        artifacts: {
            NetworkRequests: Array<{
                url: string;
                resourceType: string;
                mimeType: string;
                finished: boolean;
                statusCode: number;
                resourceSize: number;
                transferSize: number;
            }>;
        };
    }

    function lighthouse(url: string, options: any): Promise<{ lhr: LighthouseResult }>;
    export = lighthouse;
}

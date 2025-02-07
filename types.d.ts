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

    interface ResourceSummaryItem {
        resourceType: string;
        label: string;
        requestCount: number;
        transferSize: number;
    }

    interface LighthouseAuditDetails {
        items: NetworkRequest[] | ResourceSummaryItem[];
    }

    interface LighthouseAudit {
        details?: LighthouseAuditDetails;
    }

    interface LighthouseResult {
        audits?: {
            'network-requests'?: LighthouseAudit;
            'resource-summary'?: LighthouseAudit;
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

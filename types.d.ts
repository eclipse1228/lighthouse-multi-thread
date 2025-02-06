declare module 'lighthouse' {
    interface LighthouseResult {
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

    function lighthouse(url: string, options: any): Promise<LighthouseResult>;
    export = lighthouse;
}

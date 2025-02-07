import { Collection } from 'mongodb';
import * as fs from 'fs';
import * as path from 'path';

export interface Institution {
    institutionType: string;
    institutionCategory: string;
    institutionSubcategory: string;
    siteName: string;
    siteType: string;
    siteLink: string;
}

export class UrlManager {
    private urls: Institution[] = [];
    private currentIndex = 0;
    private invalidUrls: Institution[] = [];

    constructor(private collection: Collection, private trafficCollection: Collection) {}

    private isValidUrl(url: string): boolean {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    async loadUrls() {
        console.log('URL 목록 로딩 시작');
        try {
            // korea_public_website_url.json 파일 읽기
            const filePath = path.join(process.cwd(), 'korea_public_website_url.json');
            console.log(`파일 경로: ${filePath}`);
            const url_data = fs.readFileSync(filePath, 'utf8');
            
            // JSON 파싱
            const allUrls: Institution[] = JSON.parse(url_data);
            console.log(`전체 URL 수: ${allUrls.length}개`);
            
            // 중앙행정기관 필터링
            const centralGovUrls = allUrls.filter(url => url.institutionType === '중앙행정기관');
            console.log(`중앙행정기관 URL 수: ${centralGovUrls.length}개`);
            
            // URL 유효성 검사
            this.urls = [];
            this.invalidUrls = [];
            
            for (const institution of centralGovUrls) {
                console.log(`URL 검사 중: ${institution.siteLink} (${institution.siteName})`);
                
                if (this.isValidUrl(institution.siteLink)) {
                    this.urls.push(institution);
                    console.log(`유효한 URL 추가: ${institution.siteLink}`);
                } else {
                    this.invalidUrls.push(institution);
                    console.log(`유효하지 않은 URL 발견: ${institution.siteLink}`);
                }
            }
            
            console.log(`유효한 URL 수: ${this.urls.length}개`);
            console.log(`유효하지 않은 URL 수: ${this.invalidUrls.length}개`);
            
            // 데이터 샘플 출력
            if (this.urls.length > 0) {
                console.log('첫 번째 유효한 URL 데이터:', JSON.stringify(this.urls[0], null, 2));
            }
            
            if (this.invalidUrls.length > 0) {
                console.log('유효하지 않은 URL 목록:');
                this.invalidUrls.forEach(invalid => {
                    console.log(`- ${invalid.siteName}: ${invalid.siteLink}`);
                });
            }
        } catch (error: any) {
            console.error('URL 목록 로딩 중 오류 발생:', error.message);
            throw error;
        }
        
        console.log(`URL 목록 로딩 완료: 유효한 URL ${this.urls.length}개 로드됨`);
    }

    hasNext(): boolean {
        return this.currentIndex < this.urls.length;
    }

    getNext(): Institution | null {
        if (!this.hasNext()) {
            return null;
        }
        return this.urls[this.currentIndex++];
    }

    getProgress(): string {
        return `진행률: ${this.currentIndex}/${this.urls.length} (${Math.round(this.currentIndex / this.urls.length * 100)}%)`;
    }
}

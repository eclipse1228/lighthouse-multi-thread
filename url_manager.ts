import { Collection } from 'mongodb';

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

    constructor(private collection: Collection, private trafficCollection: Collection) {}

    async loadUrls() {
        console.log('URL 목록 로딩 시작');
        // TODO: korea_public_website에서 URL 목록 로드
        this.urls = [];
        console.log(`URL 목록 로딩 완료: ${this.urls.length}개`);
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

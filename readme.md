# 설계의 목적 
Google Lighthouse를 통해 많은 url을 병렬처리를 통해 빠르게 데이터를 얻는다.
데이터 수집의 이유는 대한민국의 기관의 웹사이트의 탄소배출량을 확인하기 위함이다.

# 설계
0. Chrome headless Browser
- chrome brower 다운로드 필요
-- window(default), Linux 따로 설정 필요. linux는 /chrome/google-chrome-stable..deb 파일 사용

1. 컨테이너화 (Docker) (미완료)

2. 병렬 처리 (Thread) (완료)
- 워커 쓰레드 CPU 코어 수 기반 동적 워커 생성
- 실시간 상태 보고 시스템 구현
- 메모리 사용량 모니터링(약 500MB/인스턴스)

3. 저장 데이터 구조 
-  NoSQL (MongoDB)

4. 순서

1) korea_public_website의 'siteLink'를 Google Lighthouse를 통해 테스트하고 메모리에 json 객체를 저장합니다.

2) lighthouse의 결과 json 객체의 형태에 대해 궁금하다면, report.json 파일을 읽고 구조를 파악하세요.

2) 아래의 데이터 형식으로 데이터를 저장할 것입니다. (Nosql MongoDB) (완료)

- Create Databse ecoweb
- Create Table lighthouse_resource
- Create Table lighthouse_traffic
- lighthouse_resource 테이블의 구조는 아래와 같다.
_id: 
url: 
network_request: Array()
    > Object: 
        > url: 
        > resourceType: 
        > mimeType:
        > finished:
        > statusCode:
        > resourceSize: 
        > transferSize:
    > Object: 
        > url: 
        > resourceType: 
        > mimeType:
        > finished:
        > statusCode:
        > resourceSize: 
        > transferSize:
    ...

- lighthouse_traffic의 구조는 아래와 같다.
_id:
url:
resource_summary: Array()
    > Object:
        > resourceType:
        > transferSize:
    > Object:
        > resourceType:
        > transferSize:
    ...

institutionType: 
institutionCategory:
institutionSubcategory:
siteName:
siteType:
siteLink:



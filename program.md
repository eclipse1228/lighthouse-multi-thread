# 프로그램 개발 진행 상황

## 1. 프로젝트 초기 설정
- package.json 생성
- TypeScript 기반 프로젝트 설정
- 필요한 의존성 패키지 정의 (puppeteer, lighthouse, mongodb 등)

## 2. 핵심 컴포넌트 구현

### Chrome 인스턴스 관리 (chrome_instance.ts)
- Chrome 브라우저 초기화 및 관리

### URL 관리자 개선 (url_manager.ts)
- URL 유효성 검사 기능 추가
- 유효하지 않은 URL 추적 및 로깅 기능 추가
- 상세한 로깅 기능 추가

### 워커 프로세스 개선 (worker.ts)
- URL 유효성 검사 기능 추가
- 상세한 로깅 기능 추가
- 오류 처리 개선

## 3. 버그 수정

### INVALID_URL 오류 해결 (2024-02-06)
- worker.ts의 URL 처리 로직 수정
  - URL 데이터 전달 방식 변경 (data.url 대신 institution.siteLink 사용)
  - 기관 정보를 포함한 데이터 구조 개선
  - 상세한 로깅 추가
- 중복 URL 유효성 검사 제거
  - url_manager.ts에서만 URL 유효성 검사 수행
  - worker.ts에서는 유효성 검사 제거

### Lighthouse 분석 개선 (2024-02-06)
- chrome_instance.ts 수정
  - Chrome 실행 옵션 최적화
    - 메모리 사용량 최소화 (--disable-dev-shm-usage)
    - 단일 프로세스 모드 (--single-process)
    - 불필요한 기능 비활성화 (--disable-extensions 등)
  - 시스템 안정성 강화
    - 타임아웃 설정 (30초)
    - 자동화 기능 비활성화
  - 상세 로깅 추가
    - Chrome 버전 확인
    - 초기화 상태 추적

### 테스트 코드 개선 (2024-02-06)
- lighthouse_test.ts 수정
  - 안정성 강화
    - 자원 정리 기능 개선
    - 예외 처리 강화
  - MongoDB 연결 개선
    - 타임아웃 설정 추가
    - 연결 상태 모니터링
  - 프로그램 종료 처리 개선
    - SIGINT 신호 처리
    - 자원 정리 순서 최적화

### 테스트 시스템 개선 (2024-02-06)
- index.ts 수정
  - 테스트를 위한 URL 처리 제한 (8개)
  - 처리된 URL 수 추적 기능 추가
  - 테스트 완료 시 자동 종료 기능 추가
- Lighthouse 분석 실행 기능
- 리소스 관리를 위한 브라우저 종료 기능
- 모든 함수에 상태 출력 로깅 추가

### 워커 쓰레드 구현 (worker.ts)
- URL 처리를 위한 워커 로직 구현
- MongoDB 데이터 저장 로직 구현
- 네트워크 요청 데이터 추출 및 가공
- 리소스 타입별 요약 데이터 생성

### 메인 프로그램 (index.ts)
- CPU 코어 수 기반 동적 워커 생성
- MongoDB 연결 및 컬렉션 생성
- 메모리 사용량 모니터링 구현

## 프로그램 수정 사항

## 2024-02-06 수정사항

### chrome_instance.ts 수정
1. 임시 파일 관리 개선
   - Chrome 인스턴스별로 고유한 임시 디렉토리 사용
   - 프로세스 ID를 사용하여 임시 디렉토리 이름 생성
   - 인스턴스 종료 시 자동으로 임시 파일 정리
2. 로깅 개선
   - 각 단계별 상세한 로그 추가
   - 리소스 정리 과정 로깅 추가

### index.ts 수정
1. 메모리 관리 개선
   - 상세한 메모리 사용량 모니터링 추가
   - 힙 사용량, 총 힙 크기, 외부 메모리 모니터링
2. 워커 관리 개선
   - 워커별 작업 시간 추적
   - 워커 상태 모니터링 개선
3. 리소스 정리 기능 추가
   - 프로그램 종료 시 MongoDB 연결 정리
   - SIGINT 시그널 처리 (Ctrl+C)
4. 로깅 개선
   - 시작/종료 시간 기록
   - 워커별 진행 상황 상세 로깅
   - 에러 처리 및 로깅 개선

## 2024-02-07 수정사항

### chrome_instance.ts 수정
1. runLighthouse 함수 개선
   - 네트워크 요청 데이터 추출 기능 추가
   - 리소스 타입별 요약 데이터 생성 기능 추가
   - MongoDB 스키마에 맞는 데이터 구조 반환
   - 상세한 로깅 추가 (네트워크 요청 수, 리소스 타입 수)

### index.ts 수정
1. MongoDB 데이터 저장 기능 추가
   - lighthouse_resource 컬렉션에 네트워크 요청 데이터 저장
   - lighthouse_traffic 컬렉션에 리소스 타입별 요약 데이터 저장
   - 기관 정보(institution) 포함하여 저장
2. 워커 메시지 처리 개선
   - 데이터 저장 과정 상세 로깅 추가
   - MongoDB 저장 오류 처리 추가

## 2024-02-07 수정사항 (2차)

### chrome_instance.ts 수정
1. 타입 정의 추가
   - NetworkRequest 인터페이스 추가
   - LighthouseAuditDetails 인터페이스 추가
   - LighthouseAudit 인터페이스 추가
   - LighthouseResult 인터페이스 추가
2. runLighthouse 함수 개선
   - 타입 안전성 강화
   - 결과 데이터 구조 수정
   - 에러 처리 개선

### index.ts 수정
1. MongoDB 연결 설정 개선
   - 연결 타임아웃 설정 추가
   - 서버 선택 타임아웃 설정 추가
2. URL 관리자 사용 방식 수정
   - getNextUrl을 getNext로 수정
   - 타입 정의 추가 (UrlData 인터페이스)
3. 워커 메시지 처리 개선
   - 타입 안전성 강화
   - institution 데이터 처리 방식 수정

### worker.ts 수정
1. 타입 정의 추가
   - WorkerMessage 인터페이스 추가
2. 데이터 처리 로직 단순화
   - 불필요한 데이터 변환 제거
   - chrome_instance.ts의 결과를 직접 사용
3. 에러 처리 개선
   - 상세한 에러 메시지 전달
   - Chrome 인스턴스 정리 로직 추가

## 2024-02-07 수정사항 (3차)

### chrome_instance.ts 수정
1. Lighthouse 결과 타입 처리 개선
   - runnerResult 타입을 { lhr: LighthouseResult }로 수정
   - 타입 캐스팅 방식 변경으로 타입 안전성 향상

### index.ts 수정
1. 타입 정의 개선
   - Institution 인터페이스 추가 (siteLink, siteName 포함)
   - UrlData 타입 제거하고 Institution 타입으로 통일
2. 로깅 기능 강화
   - URL 처리 과정 상세 로깅 추가
   - 다음 URL 가져오기 로깅 추가
   - 초기 URL 할당 로깅 추가

## 2024-02-07 수정사항 (4차)

### chrome_instance.ts 수정
1. Chrome 실행 경로 개선
   - Windows 환경 지원 추가
   - process.platform을 사용하여 OS별 Chrome 경로 설정
   - Windows: C:\Program Files\Google\Chrome\Application\chrome.exe
   - Linux: /usr/bin/google-chrome
2. 로깅 개선
   - Chrome 경로 로깅 추가

## 2024-02-07 수정사항 (5차)

### worker.ts 수정
1. 에러 처리 개선
   - 에러 발생 시 Chrome 인스턴스 재생성
   - 에러 메시지 전달 방식 개선

### index.ts 수정
1. 에러 처리 및 로깅 개선
   - MongoDB errorCollection에 실패한 URL 기록
   - 에러 타입 구분 (lighthouse_error, mongodb_error)
   - 타임스탬프 추가
2. 데이터 저장 로직 개선
   - 성공한 경우에만 데이터 저장
   - 실패한 URL은 별도 기록

### chrome_instance.ts 수정
1. 네트워크 요청 검증 추가
   - 빈 네트워크 요청 데이터 체크
   - 404 페이지 등 무효한 URL 필터링

## 2024-02-07 수정사항 (6차)

### types.d.ts 수정
1. 타입 정의 개선
   - NetworkRequest 인터페이스 추가
   - NetworkSummaryItem 인터페이스 추가
   - LighthouseAuditDetails와 LighthouseAudit 인터페이스 개선

### chrome_instance.ts 수정
1. 네트워크 요약 데이터 처리 개선
   - network-summary audit 추가
   - 요약 데이터 자동 생성 로직 구현
   - 기본 리소스 타입 지원 (document, script, stylesheet 등)
2. 로깅 기능 강화
   - 네트워크 요청 데이터 추출 로그 추가
   - 요약 데이터 생성 과정 상세 로깅
3. 데이터 구조 개선
   - NetworkRequest 매핑 필드 정리
   - protocol 필드 추가

## 2025-02-07 수정사항

### Chrome 인스턴스 관리 (chrome_instance.ts) 수정
- LighthouseResult 인터페이스의 audits 타입 수정
  - 'resource-summary' 속성 추가로 타입 오류 해결
  - 네트워크 리소스 요약 데이터 추출 기능 정상화

## 2025-02-07 수정사항 추가 업데이트

### Chrome 인스턴스 관리 (chrome_instance.ts) 수정
- Lighthouse 분석 데이터 확장
  - 미사용 JavaScript 데이터 추출 ('unused-javascript')
  - 미사용 CSS 규칙 데이터 추출 ('unused-css-rules')
  - 최신 이미지 포맷 데이터 추출 ('modern-image-formats')
  - lighthouse_unused 테이블 저장을 위한 데이터 구조화
  - 상세한 로깅 추가

### types.d.ts 수정
- Lighthouse 타입 정의 확장
  - UnusedCssItem, UnusedJsItem, ModernImageItem 인터페이스 추가
  - LighthouseResult audits 타입에 새로운 속성 추가
  - displayValue가 빈 문자열("")이 될 수 있음을 고려한 타입 정의

## 2025-02-07 수정사항 추가 업데이트 3

### 프로그램 종료 처리 개선 (index.ts)
- 정상 종료 조건 강화
  - TEST_LIMIT 도달 시 진행 중인 작업 완료 대기 추가
  - 모든 URL 처리 완료 시 자동 종료 로직 추가
  - 워커의 상태(busy/idle) 확인 후 종료하도록 개선
- 비정상 종료 처리 강화
  - 워커 오류 발생 시 해당 워커 종료 처리 추가
  - 워커 종료 시 종료 코드에 따른 상태 구분
  - 모든 워커 종료 시 프로그램 자동 종료 로직 추가

## 4. 타입스크립트 에러 처리 개선 (2025-02-07)
### chrome_instance.ts 수정
- catch 블록의 error 타입을 unknown으로 명시적 지정
- Error 인스턴스 체크를 통한 타입 가드 추가
- 에러 메시지 접근 시 타입 안전성 강화
- 모든 에러 상황에 대한 로깅 추가

### Lighthouse 모듈 개선 (2024-02-06)
- chrome_instance.ts 전면 수정
  - puppeteer 제거하고 chrome-launcher로 변경
  - Lighthouse 공식 문서 기반으로 코드 재작성
  - 성능 관련 메트릭만 수집하도록 최적화
  - 상세한 로깅 추가 (네트워크 요청 수, RTT, 서버 지연 시간)
  - 불필요한 옵션 제거 및 코드 단순화

### lighthouse_test.ts 개선 (2024-02-06)
- 코드 안정성 강화
  - 타입 정의 추가 (NetworkRequest, LighthouseAudit 등)
  - Optional Chaining 사용으로 안전한 속성 접근
  - 기본값 설정으로 undefined 방지
- 로깅 개선
  - Lighthouse 결과 구조 상세 출력
  - 네트워크 요청 정보 상세 출력
  - 성능 메트릭 출력 추가
  - 데이터 저장 과정 상세 출력

### WSL 환경 대응 (2024-02-06)
- chrome_instance.ts 수정
  - Chrome 실행 옵션 추가
    - --no-sandbox: 새로운 프로세스 생성 제한 옵션 비활성화
    - --disable-setuid-sandbox: setuid 샌드박스 비활성화
    - --disable-dev-shm-usage: 공유 메모리 사용 제한
    - --disable-gpu: GPU 하드웨어 가속 비활성화
  - Chrome 경로 직접 지정 (/usr/bin/google-chrome)
  - 상세한 로깅 추가


### Docker 파일 작성 (02-07)

## 다음 단계

## TO_DO

- CPU Core 만큼 워커를 실행하는데, 리소스 부족 문제가 발생함. 
- 각 url 마다 새로운 chrome 인스턴스를 생성하는 대신 crhome 인스턴스를 재사용하는 방식으로 변경해야함.
- Docker 컨테이너에서 한글이 깨짐 -> 한글 json { url.institutionType === '지방자치단체' 부분이 깨질 수 있음.} -> utf-8로 명시했기 때문에, 올바르게 처리됨. (js 문자열 비교는 내부적으로 유니코드 값을 사용해서 한글도 비교됨.)
- chrome instance가 init이 안 되는 경우 발생
-- Docker 컨테이너 리소스 제한을 확인하고 조정해야함. 
```
docker run -it --shm-size=2g \ 
-- memory = 4g \ 
-- cpus=2 \
your-image-name
```

```
const chromeFlags = [
  '--headless',
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-gpu',
  '--single-process', // 단일 프로세스 모드
  '--no-zygote',     // Zygote 프로세스 비활성화
  '--disable-extensions', // 확장 프로그램 비활성화
  '--disable-background-networking' // 백그라운드 네트워킹 비활성화
];
```




1. 성능 최적화
2. 테스트 커버리지 확대

# 프로그램 개발 진행 상황

## 1. 프로젝트 초기 설정
- package.json 생성
- TypeScript 기반 프로젝트 설정
- 필요한 의존성 패키지 정의 (puppeteer, lighthouse, mongodb 등)

## 2. 핵심 컴포넌트 구현

### Chrome 인스턴스 관리 (chrome_instance.ts)
- Chrome 브라우저 초기화 및 관리
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

## 다음 단계
1. URL 목록 처리 및 작업 분배 로직 구현
2. 에러 처리 및 재시도 메커니즘 추가
3. 도커라이징 구현
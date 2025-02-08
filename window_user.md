Node.js LTS 버전 설치 (https://nodejs.org/)
Chrome 브라우저 설치 (https://www.google.com/chrome/)

1. 타입스크립트 설치
npm install -g typescript
npm install

2. chrome 경로 설정
const defaultChromePath = process.platform === 'win32' 
  ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  : '/usr/bin/google-chrome';

3. tsconfig.json 설정
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}

4. 

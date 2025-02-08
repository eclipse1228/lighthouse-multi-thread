# Node.js 기본 이미지 사용
FROM node:20-bullseye

# 작업 디렉토리 설정
WORKDIR /app

# 시스템 패키지 및 Chrome 설치
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    curl \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list \
    && apt-get update \
    && apt-get install -y \
    google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

# nano 설치
RUN apt-get update && apt-get install -y nano

# MongoDB 설치
RUN wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | apt-key add - \
    && echo "deb http://repo.mongodb.org/apt/debian bullseye/mongodb-org/7.0 main" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list \
    && apt-get update \
    && apt-get install -y mongodb-org \
    && mkdir -p /data/db

# 앱 종속성 파일 복사 및 설치
COPY package*.json ./
RUN npm install

# TypeScript 설치 및 빌드 도구 설치
RUN npm install -g typescript ts-node

# 소스 코드 복사
COPY . .

# TypeScript 컴파일
RUN npm run build

# MongoDB 및 앱 실행을 위한 시작 스크립트
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# 포트 설정 (MongoDB)
EXPOSE 27017

# 시작 스크립트 실행
ENTRYPOINT ["docker-entrypoint.sh"]

# 컨테이너 실행 시 기본 명령어 (bash 쉘 제공)
CMD ["/bin/bash"]

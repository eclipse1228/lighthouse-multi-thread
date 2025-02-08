#!/bin/bash

# MongoDB 시작
mongod --fork --logpath /var/log/mongodb.log

# 명령줄 인자로 전달된 명령어 실행
exec "$@"

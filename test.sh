#!/bin/bash

docker build -t jayfong/yapi:latest .
docker-compose down
docker-compose up -d

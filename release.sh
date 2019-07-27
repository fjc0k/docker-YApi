#!/bin/bash

YAPI_VERSION=$(grep -o "YAPI_VERSION=.*" Dockerfile | sed "s/YAPI_VERSION=//g")

docker build -t "jayfong/yapi:$YAPI_VERSION" -t jayfong/yapi:latest .

docker push jayfong/yapi

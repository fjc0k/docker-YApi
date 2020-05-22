######## 构建 ########
FROM --platform=${BUILDPLATFORM:-amd64} node:12.16.3-alpine3.11 as builder

# 安装构建工具
RUN apk add --update --no-cache ca-certificates curl wget cmake build-base git bash python make gcc g++ zlib-dev autoconf automake file nasm \
  && update-ca-certificates

# YApi 版本
ENV YAPI_VERSION=1.9.1

# 编译脚本
WORKDIR /yapi/scripts
COPY . .
RUN yarn && yarn build

WORKDIR /yapi/vendors

# 使用 bash 作为 shell 以支持下面要使用的 globstar
SHELL ["/bin/bash", "-c"]

# 拉取 YApi 源码
RUN git clone \
  --branch "v${YAPI_VERSION}" \
  --single-branch \
  --depth 1 \
  https://github.com/YMFE/yapi.git .

RUN cp /yapi/scripts/start.js ./start.js

# 执行一些准备工作
RUN node /yapi/scripts/prepare.js $(pwd)

# 安装依赖
RUN yarn

# 清理文件
RUN node /yapi/scripts/clean.js $(pwd) \
  && rm -rf /yapi/scripts

# 构建应用
RUN yarn build-client

######## 镜像 ########
FROM node:12.16.3-alpine3.11

WORKDIR /yapi

COPY --from=builder /yapi .

EXPOSE 3000

CMD ["node", "/yapi/vendors/start.js"]

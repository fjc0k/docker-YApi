######## 构建 ########
FROM --platform=${BUILDPLATFORM:-amd64} node:16-alpine3.15 as builder

# 安装构建工具
RUN apk add --update --no-cache ca-certificates curl wget cmake build-base git bash python3 make gcc g++ zlib-dev autoconf automake file nasm \
  && update-ca-certificates

# YApi 版本
ENV YAPI_VERSION=1.10.2

# 编译脚本
WORKDIR /yapi/scripts
COPY . .
RUN yarn && yarn build

WORKDIR /yapi/vendors

# 拉取 YApi 源码
RUN git clone \
  --branch "v${YAPI_VERSION}" \
  --single-branch \
  --depth 1 \
  https://github.com/YMFE/yapi.git .

# 拷贝启动脚本
RUN cp /yapi/scripts/start.js ./start.js

# 执行一些准备工作
RUN node /yapi/scripts/prepare.js $(pwd)

# 安装依赖、清理文件、构建应用、清理文件
RUN yarn \
  && node /yapi/scripts/clean.js $(pwd) \
  && yarn build-client \
  && node /yapi/scripts/clean.js $(pwd)

# 删除脚本
RUN rm -rf /yapi/scripts


######## 镜像 ########
FROM node:16-alpine3.15

WORKDIR /yapi

COPY --from=builder /yapi .

EXPOSE 3000

CMD ["node", "/yapi/vendors/start.js"]

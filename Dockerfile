######## 源码 ########
FROM node:alpine as source

ENV YAPI_VERSION=1.8.1
ENV YAPI_PKG_LOCK_URL=https://raw.githubusercontent.com/YMFE/yapi/v${YAPI_VERSION}/package-lock.json

WORKDIR /yapi

RUN npm pack yapi-vendor@${YAPI_VERSION} \
  && tar -xzf *.tgz \
  && rm *.tgz \
  && mv package vendors
RUN cd vendors \
  && wget ${YAPI_PKG_LOCK_URL} \
  && rm -rf .history .github *.jpg *.md


######## 依赖 ########
FROM node:alpine as deps

WORKDIR /yapi/vendors

COPY --from=source /yapi/vendors/package.json /yapi/vendors/package-lock.json ./

RUN apk add --no-cache python make gcc g++
# 高版本 Node.js 下需升级 node-sass 版本
RUN npm install node-sass --package-lock-only
RUN npm ci


######## 镜像 ########
FROM node:alpine

WORKDIR /yapi

COPY --from=source /yapi .
COPY --from=deps /yapi/vendors ./vendors
COPY config.js .
COPY start.js .

EXPOSE 3000

CMD ["node", "./start.js"]

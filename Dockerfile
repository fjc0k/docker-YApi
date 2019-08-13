######## 源码 ########
FROM node:alpine as source

ENV YAPI_VERSION=1.8.1
ENV YAPI_PKG_LOCK_URL=https://raw.githubusercontent.com/YMFE/yapi/v${YAPI_VERSION}/package-lock.json

WORKDIR /yapi

COPY config.js .
COPY start.js .

RUN set -ex \
  && apk add --no-cache python make gcc g++ \
  && echo $( \
      node -e "console.log(JSON.stringify(require('./config.js')))" \
    ) > config.json \
  && npm pack yapi-vendor@${YAPI_VERSION} \
  && tar -xzf *.tgz \
  && rm *.tgz \
  && mv package vendors \
  && cd vendors \
  && wget ${YAPI_PKG_LOCK_URL} \
  && sed -i -e 's|Alert,|Alert, Divider,|' ./client/components/Notify/Notify.js \
  && sed -i -e 's|</a>|</a><Divider type="vertical" /><a target="view_window" href="https://github.com/fjc0k/docker-YApi#%E5%A6%82%E4%BD%95%E5%8D%87%E7%BA%A7">Docker 版升级指南</a>|' ./client/components/Notify/Notify.js \
  && npm install node-sass --package-lock-only \
  && npm ci \
  && npm run build-client \
  && rm -rf .history .github *.jpg *.md \
  && cd node_modules \
  && rm -rf .cache .happypack .ykit_cache


######## 镜像 ########
FROM node:alpine

WORKDIR /yapi

COPY --from=source /yapi .

EXPOSE 3000

CMD ["node", "./start.js"]

FROM node:alpine

ENV YAPI_VERSION=1.8.0
ENV YAPI_VENDOR_URL=https://registry.npm.taobao.org/yapi-vendor/download/yapi-vendor-${YAPI_VERSION}.tgz

WORKDIR /yapi

COPY config.json .
COPY start.js .

RUN apk add --update --no-cache wget \
  && wget ${YAPI_VENDOR_URL} \
  && tar -xzf *.tgz \
  && rm *.tgz \
  && mv package vendors \
  && cd ./vendors \
  && npm install --production --registry https://registry.npm.taobao.org \
  && rm -rf .history .github *.jpg *.md clinet/components clinet/containers clinet/styles clinet/images clinet/font clinet/reducer clinet/*.js \
  && npm cache clean --force \
  && rm -rf /var/cache/apk/* \
  && rm -rf /tmp/* \
  && apk update \
  && apk del wget

EXPOSE 3000

CMD [ "node", "./start.js" ]

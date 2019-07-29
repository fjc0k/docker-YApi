FROM node:alpine
ENV YAPI_VERSION=1.8.0
ENV YAPI_VENDOR_URL=https://registry.npm.taobao.org/yapi-vendor/download/yapi-vendor-${YAPI_VERSION}.tgz
WORKDIR /yapi
COPY config.js .
COPY start.js .
RUN apk add --update --no-cache python make gcc g++ wget
RUN yarn config set registry "https://registry.npm.taobao.org" \
  && yarn config set sass-binary-site "http://npm.taobao.org/mirrors/node-sass"
RUN wget ${YAPI_VENDOR_URL} \
  && tar -xzf *.tgz \
  && rm *.tgz \
  && mv package vendors
WORKDIR /yapi/vendors
RUN echo -e "LICENSE*\n*.md\n*.yml\n*.yaml\n__*\n.*\n*.log\n*.ts" > .yarnclean
RUN yarn install --production --ignore-optional --ignore-engines
RUN rm -rf .history .github .eslintrc.js .yarnclean *.jpg *.md
RUN echo -e "module.exports={}" > .eslintrc.js

FROM node:alpine
WORKDIR /yapi
RUN yarn config set registry "https://registry.npm.taobao.org"
COPY --from=0 /yapi .
EXPOSE 3000
CMD [ "node", "./start.js" ]

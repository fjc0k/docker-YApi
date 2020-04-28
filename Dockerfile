######## 构建 ########
FROM jayfong/front-end-builder:latest as builder

ENV YAPI_VERSION=1.9.1

WORKDIR /yapi/vendors

SHELL ["/bin/bash", "-c"]

RUN echo '{"adminAccount":"admin@docker.yapi","db":{"servername":"yapi-mongo","port":27017,"DATABASE":"yapi"},"mail":{"enable":false},"ldapLogin":{"enable":false},"closeRegister":true,"plugins":[]}' > /yapi/config.json
RUN git clone -b "v${YAPI_VERSION}" --single-branch --depth 1 https://github.com/YMFE/yapi.git . \
  && rm -rf .git .github docs test *.{jpg,md} \
  && sed -i -e 's|Alert,|Alert, Divider,|' ./client/components/Notify/Notify.js \
  && sed -i -e 's|</a>|</a><Divider type="vertical" /><a target="view_window" href="https://github.com/fjc0k/docker-YApi#%E5%A6%82%E4%BD%95%E5%8D%87%E7%BA%A7">Docker 版升级指南</a>|' ./client/components/Notify/Notify.js \
  && sed -i -e 's/yapi.commons.generatePassword(/yapi.commons.generatePassword(yapi.WEBCONFIG.adminPassword || /' ./server/install.js \
  && sed -i -e 's/密码："ymfe.org"/密码："${yapi.WEBCONFIG.adminPassword || "ymfe.org"}"/' ./server/install.js
RUN npm install ykit node-sass react-dnd react-dnd-html5-backend vm2 --package-lock-only
RUN npm ci
RUN npm run build-client
RUN cd .. \
  && yarn add deepmerge \
  && shopt -s globstar \
  && rm -rf **/*.{map,lock,log,md,yml}

######## 镜像 ########
FROM node:alpine

WORKDIR /yapi

COPY --from=builder /yapi .
COPY start.js .

EXPOSE 3000

CMD ["node", "./start.js"]

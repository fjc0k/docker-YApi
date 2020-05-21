######## 构建 ########
FROM node:12.16.3-alpine3.11 as builder

# 安装构建工具
RUN apk add --update --no-cache \
  ca-certificates \
  curl \
  wget \
  cmake \
  build-base \
  git \
  bash \
  python \
  make \
  gcc \
  g++ \
  zlib-dev \
  autoconf \
  automake \
  file \
  nasm \
  && update-ca-certificates \
  && rm -rf /var/cache/apk/*

# YApi 版本
ENV YAPI_VERSION=1.9.1

WORKDIR /yapi/vendors

# 使用 bash 作为 shell 以支持下面要使用的 globstar
SHELL ["/bin/bash", "-c"]

# 写入临时配置
RUN echo '{"adminAccount":"admin@docker.yapi","db":{"servername":"yapi-mongo","port":27017,"DATABASE":"yapi"},"mail":{"enable":false},"ldapLogin":{"enable":false},"closeRegister":true,"plugins":[]}' > /yapi/config.json

# 克隆源码并修改部分代码
RUN git clone -b "v${YAPI_VERSION}" --single-branch --depth 1 https://github.com/YMFE/yapi.git . \
  && rm -rf .git .github docs test *.{jpg,md} \
  && sed -i -e 's|Alert,|Alert, Divider,|' ./client/components/Notify/Notify.js \
  && sed -i -e 's|</a>|</a><Divider type="vertical" /><a target="view_window" href="https://github.com/fjc0k/docker-YApi#%E5%A6%82%E4%BD%95%E5%8D%87%E7%BA%A7">Docker 版升级指南</a>|' ./client/components/Notify/Notify.js \
  && sed -i -e 's/yapi.commons.generatePassword(/yapi.commons.generatePassword(yapi.WEBCONFIG.adminPassword || /' ./server/install.js \
  && sed -i -e 's/密码："ymfe.org"/密码："${yapi.WEBCONFIG.adminPassword || "ymfe.org"}"/' ./server/install.js

# 锁定 npm 版本为 6.13.7
# issue: https://github.com/npm/cli/issues/1185
RUN npm install -g npm@6.13.7

# 升级部分依赖
RUN npm install --package-lock-only \
  ykit \
  react-dnd \
  react-dnd-html5-backend \
  vm2

# 使用 dart-sass 代替 node-sass
# ref: https://github.com/webpack-contrib/sass-loader#implementation
RUN npm uninstall node-sass ghooks \
  && npm install --package-lock-only sass

# 使用 ci 以安装正确的依赖
RUN npm ci

# 构建应用
RUN npm run build-client

RUN \
  # 切换至引导目录
  cd .. \
  # 安装引导脚本的依赖
  && yarn add deepmerge \
  # 删除不必要的文件减小体积
  && shopt -s globstar && rm -rf **/*.{map,lock,log,md,yml}


######## 镜像 ########
FROM node:12.16.3-alpine3.11

WORKDIR /yapi

COPY --from=builder /yapi .
COPY start.js .

RUN npm install -g npm@6.13.7

EXPOSE 3000

CMD ["node", "./start.js"]

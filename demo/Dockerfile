FROM jayfong/yapi:latest

ENV YAPI_ADMIN_ACCOUNT=admin@docker.yapi
ENV YAPI_ADMIN_PASSWORD=adm1n
ENV YAPI_CLOSE_REGISTER=false
ENV YAPI_DB_SERVERNAME=127.0.0.1
ENV YAPI_DB_PORT=27017
ENV YAPI_DB_DATABASE=yapi
ENV YAPI_MAIL_ENABLE=false
ENV YAPI_LDAP_LOGIN_ENABLE=false
ENV YAPI_PLUGINS=[]

RUN echo 'http://dl-cdn.alpinelinux.org/alpine/v3.6/main' >> /etc/apk/repositories && \
  echo 'http://dl-cdn.alpinelinux.org/alpine/v3.6/community' >> /etc/apk/repositories && \
  apk add --update --no-cache mongodb && \
  mkdir -p /data/db

CMD mongod --fork --logpath=mongodb.log && node /yapi/vendors/start.js

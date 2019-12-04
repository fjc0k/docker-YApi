# docker-YApi

在 [Docker](https://www.docker.com/) 中运行 [YApi](https://github.com/YMFE/yapi)。

<!-- TOC depthFrom:2 -->

- [要求](#要求)
- [安装](#安装)
- [如何配置](#如何配置)
  - [通过 config.json 或者 config.js 配置](#通过-configjson-或者-configjs-配置)
  - [通过环境变量配置](#通过环境变量配置)
    - [基础配置](#基础配置)
    - [数据库配置](#数据库配置)
    - [邮件配置](#邮件配置)
    - [LDAP 登录配置](#ldap-登录配置)
    - [插件配置](#插件配置)
- [如何重启](#如何重启)
- [如何升级](#如何升级)
- [查看日志](#查看日志)
- [如何迁移](#如何迁移)
- [许可](#许可)

<!-- /TOC -->

## 要求

你得确保在你的设备上安装了不是太老版本的 [`Docker`](https://docs.docker.com/install/linux/docker-ce/centos/#install-docker-ce) 和 [`Docker Compose`](https://docs.docker.com/compose/install/)。

## 安装

首先，克隆本项目：

```bash
git clone https://github.com/fjc0k/docker-YApi.git
```

接下来，修改 `docker-compose.yml` 中 `yapi-web` 下的环境变量 `YAPI_ADMIN_ACCOUNT` 为你的管理员邮箱，`YAPI_ADMIN_PASSWORD` 为你的管理员密码。

最后，执行 `docker-compose up -d` 启动服务。

然后，通过 `http://localhost:40001` 即可访问 `YApi`。

## 如何配置

为了减少二次配置，`docker-YApi` 新增了 `adminPassword` 选项以设置管理员密码。

### 通过 config.json 或者 config.js 配置

`config.json` 是 YApi 官方支持的配置文件，`config.js` 是 `docker-YApi` 扩展支持的配置文件，其实就是将 JSON 数据写成了更简洁的 JavaScript 对象。

你可通过将外部的 `config.json` 或 `config.js` 配置文件映射进容器内部来使用它们：

```bash
./config.json:/yapi/config.json
./config.js:/yapi/config.js
```

### 通过环境变量配置

通过环境变量配置的选项会覆盖通过 `config.json` 或者 `config.js` 配置的选项。

#### 基础配置

环境变量名称 | 类型 | 说明 | 示例
--- | --- | --- | ---
YAPI_ADMIN_ACCOUNT | string | 管理员账号（邮箱） | admin@foo.bar
YAPI_ADMIN_PASSWORD | string | 管理员密码 | adm1n
YAPI_CLOSE_REGISTER | boolean | 是否关闭注册 | true
YAPI_NPM_REGISTRY | string | npm 源，目前仅在安装插件时使用，默认官方源，国内可以设为淘宝源加速 | https://registry.npm.taobao.org

#### 数据库配置

环境变量名称 | 类型 | 说明 | 示例
--- | --- | --- | ---
YAPI_DB_SERVERNAME | string | MongoDB 服务地址 | yapi-mongo
YAPI_DB_PORT | number | MongoDB 服务端口 | 27017
YAPI_DB_DATABASE | string | 使用的 MongoDB 数据库 | yapi
YAPI_DB_USER | string | 登录 MongoDB 服务的用户名 | root
YAPI_DB_PASS | string | 登录 MongoDB 服务的用户密码 | r00t
YAPI_DB_AUTH_SOURCE | string | MongoDB 身份认证所用库 | admin
YAPI_DB_CONNECT_STRING | string | 使用 MongoDB 集群时配置 | mongodb://127.0.0.100:8418,127.0.0.101:8418/yapidb?slaveOk=true
YAPI_DB_OPTIONS | json | Mongoose 连接 MongoDB 服务时的额外选项，一般不用设置。请参考: [Mongoose.prototype.connect()](https://mongoosejs.com/docs/api/mongoose.html#mongoose_Mongoose-connect) | {}

#### 邮件配置

环境变量名称 | 类型 | 说明 | 示例
--- | --- | --- | ---
YAPI_MAIL_ENABLE | boolean | 是否启用 | true
YAPI_MAIL_HOST | string | 邮件服务地址 | smtp.163.com
YAPI_MAIL_PORT | number | 邮件服务端口 | 465
YAPI_MAIL_FROM | string | 发送人邮箱 | foo@163.com
YAPI_MAIL_AUTH_USER | string | 登录邮件服务的用户名 | bar@163.com
YAPI_MAIL_AUTH_PASS | string | 登录邮件服务的用户密码 | f00bar

#### LDAP 登录配置

[点击查看 YApi 仓库下 LDAP 相关的 issues 👉](https://github.com/YMFE/yapi/issues?utf8=%E2%9C%93&q=ldap)

环境变量名称 | 类型 | 说明 | 示例
--- | --- | --- | ---
YAPI_LDAP_LOGIN_ENABLE | boolean | 是否启用 | true
YAPI_LDAP_LOGIN_SERVER | string | LDAP 服务地址 | ldap://ldap.foo.bar
YAPI_LDAP_LOGIN_BASE_DN | string | 登录 LDAP 服务的用户名 | cn=admin,dc=foo,dc=bar
YAPI_LDAP_LOGIN_BIND_PASSWORD | string | 登录 LDAP 服务的用户密码 | f00bar
YAPI_LDAP_LOGIN_SEARCH_DN | string | 查询用户数据的路径 | ou=users,dc=foo,dc=bar
YAPI_LDAP_LOGIN_SEARCH_STANDARD | string | 查询条件，其中 `%s` 会被 `username` 替换 | &(objectClass=user)(cn=%s)
YAPI_LDAP_LOGIN_EMAIL_POSTFIX | string | 登录邮箱后缀 | @163.com
YAPI_LDAP_LOGIN_EMAIL_KEY | string | LDAP 数据库存储用户邮箱的字段 | mail
YAPI_LDAP_LOGIN_USERNAME_KEY | string | LDAP 数据库存储用户名的字段 | name

#### 插件配置

环境变量名称 | 类型 | 说明 | 示例
--- | --- | --- | ---
YAPI_PLUGINS | json | 要使用的插件列表。[点击查看开源 YApi 插件列表→](https://www.npmjs.com/search?q=yapi-plugin-) | [{"name":"interface-oauth2-token"},{"name":"gitlab","options":{}}]


## 如何重启

若你修改了配置，务必重启应用才能生效：

```bash
docker-compose restart yapi-web
```

## 如何升级

<img src="https://badgen.net/github/tag/YMFE/yapi?label=YApi%20%E6%9C%80%E6%96%B0%E7%89%88%E6%9C%AC"> <img src="https://badgen.net/github/tag/fjc0k/docker-YApi?label=docker-YApi%20%E6%9C%80%E6%96%B0%E7%89%88%E6%9C%AC">

若 `YApi` 有更新，本项目应会尽快跟进，之后，你可使用以下命令升级：

```bash
docker-compose pull yapi-web \
  && docker-compose down \
  && docker-compose up -d
```

> 升级不会对原有数据造成任何影响！

## 查看日志

如果出现意外情况，你可通过以下命令查看运行日志：

```bash
docker-compose logs yapi-web
```

## 如何迁移

直接打包整个目录去新的服务器即可。

## 许可

Jay Fong © MIT

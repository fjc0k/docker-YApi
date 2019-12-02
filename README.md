# docker-YApi

在 [Docker](https://www.docker.com/) 中运行 [YApi](https://github.com/YMFE/yapi)。

## 要求

你得确保在你的设备上安装了不是太老版本的 [`Docker`](https://docs.docker.com/install/linux/docker-ce/centos/#install-docker-ce) 和 [`Docker Compose`](https://docs.docker.com/compose/install/)。

## 安装

首先，克隆本项目：

```bash
git clone https://github.com/fjc0k/docker-YApi.git
```

接下来，修改 `config.js` 配置文件中的 `adminAccount` 为你的邮箱，其他选项可不做修改。

最后，执行 `docker-compose up -d` 启动服务。

然后，通过 `http://localhost:40001` 即可访问 `YApi`。

> 注意：默认的管理员账号是你在 `config.js` 中设置的 `adminAccount`，密码是 `ymfe.org`。

## 使用插件

👉 [点击查看 YApi 插件列表](https://www.npmjs.com/search?q=yapi-plugin-)。

假设你要使用这个插件：[yapi-plugin-interface-oauth2-token](https://www.npmjs.com/package/yapi-plugin-interface-oauth2-token)，编辑 `config.js`，将该插件名称（去除 `yapi-plugin-` 前缀）加入 `plugins` 即可：

```js
{
  plugins: [
    { name: 'interface-oauth2-token' }
  ]
}
```

若插件可配置，则可同时传入选项：

```js
{
  plugins: [
    { name: 'interface-oauth2-token' },
    {
      name: 'gitlab',
      options: {
        host: '***',
        // ...其他选项
      }
    }
  ]
}
```

## 环境变量

如果你熟悉 JavaScript，建议你在 `config.js` 进行相关配置。如果你不熟悉 JavaScript 或者有其他特殊需求，你可以通过环境变量完成配置。

### 基础配置

环境变量名称 | 类型 | 说明 | 示例
--- | --- | --- | ---
YAPI_ADMIN_ACCOUNT | string | 管理员账号（邮箱） | admin@foo.bar
YAPI_ADMIN_PASSWORD | string | 管理员密码 | adm1n
YAPI_CLOSE_REGISTER | boolean | 是否关闭注册 | true

### 数据库配置

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

### 邮件配置

环境变量名称 | 类型 | 说明 | 示例
--- | --- | --- | ---
YAPI_MAIL_ENABLE | boolean | 是否启用 | true
YAPI_MAIL_HOST | string | 邮件服务地址 | smtp.163.com
YAPI_MAIL_PORT | number | 邮件服务端口 | 465
YAPI_MAIL_FROM | string | 发送人邮箱 | foo@163.com
YAPI_MAIL_AUTH_USER | string | 登录邮件服务器的用户名 | bar@163.com
YAPI_MAIL_AUTH_PASS | string | 登录邮件服务器的用户密码 | f00bar

### LDAP 登录配置

环境变量名称 | 类型 | 说明 | 示例
--- | --- | --- | ---
YAPI_LDAP_LOGIN_ENABLE | boolean | 是否启用 | true
YAPI_LDAP_LOGIN_SERVER | string | LDAP 服务地址 | ldap://ldap.foo.bar
YAPI_LDAP_LOGIN_BASE_DN | string | 登录 LDAP 服务的用户名 | cn=admin,dc=foo,dc=bar
YAPI_LDAP_LOGIN_BIND_PASSWORD | string | 登录 LDAP 服务的用户密码 | f00bar
YAPI_LDAP_LOGIN_SEARCH_DN | string | 查询用户数据的路径 | ou=users,dc=foo,dc=bar
YAPI_LDAP_LOGIN_SEARCH_STANDARD | string | 存储用户邮箱的字段 | mail
YAPI_LDAP_LOGIN_EMAIL_POSTFIX | string | 登录邮箱后缀 | @163.com
YAPI_LDAP_LOGIN_EMAIL_KEY | string | LDAP 数据库存储用户邮箱的字段 | mail
YAPI_LDAP_LOGIN_USERNAME_KEY | string | LDAP 数据库存储用户名的字段 | name

### 插件配置

环境变量名称 | 类型 | 说明 | 示例
--- | --- | --- | ---
YAPI_PLUGINS | json | 要使用的插件列表 | [{"name":"interface-oauth2-token"},{"name":"gitlab","options":{}}]


## 如何重启

若你修改了配置文件 `config.js`，务必重启应用才能生效：

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

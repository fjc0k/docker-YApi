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

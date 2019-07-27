# docker-YApi

在 [Docker](https://www.docker.com/) 中运行 [YApi](https://github.com/YMFE/yapi)。

## 要求

你得确保在你的设备上安装了不是太老版本的 [`Docker`](https://docs.docker.com/install/linux/docker-ce/centos/#install-docker-ce) 和 [`Docker Compose`](https://docs.docker.com/compose/install/)。

## 安装

首先，克隆本项目：

```bash
git clone https://github.com/fjc0k/docker-YApi.git
```

接下来，按照 [YApi 官方的配置说明](https://hellosean1025.github.io/yapi/devops/index.html#%e9%85%8d%e7%bd%ae%e9%82%ae%e7%ae%b1) 修改 `config.json` 配置文件。

> 值得一提的是，如果 `config.json` 中的 `port` 不是 `3000`，你得同时修改 `docker-compose.yml` 中的 `3000` 为新的端口号。

最后，执行 `docker-compose up -d` 启动服务。

然后，通过 `http://localhost:40001` 即可访问 `YApi`。

> 注意：默认的管理员账号是你在 `config.json` 中设置的 `adminAccount`，密码是 `ymfe.org`。

## 如何升级

若 `YApi` 有更新，本项目应会尽快跟进，之后，你可使用以下命令升级：

```bash
docker-compose pull yapi-web
docker-compose down
docker-compose up -d
```

> 升级不会对原有数据造成任何影响！

## 许可

Jay Fong © MIT

const fs = require('fs')
const childProcess = require('child_process')
const http = require('http')
const merge = require('deepmerge')

class Helper {
  /**
   * 简单的 CONSTANT_CASE 实现。
   *
   * @param {string} str 要转换的字符串
   * @returns {string} 转换后的字符串
   */
  static constCase(str) {
    return str
      .replace(/(?<=[a-z])(?=[A-Z])/g, '_')
      .toUpperCase()
  }

  /**
   * 是否是假值。
   *
   * @param {string} value 要判断的值
   * @returns {boolean} 是或否
   */
  static isFalsy(value) {
    return [
      'false', 'False', 'FALSE',
      'off', 'Off', 'OFF',
      'no', 'No', 'NO',
      '0',
    ].includes(value)
  }
}

class ConfigParser {
  /**
   * 配置格式
   *
   * @see https://hellosean1025.github.io/yapi/devops/index.html
   */
  static configShape = {
    adminAccount: String,
    // 管理员密码：
    // 由 Docker-YApi 新增，
    // 在 Dockerfile 里有对相关文件进行修改以支持该配置的命令
    adminPassword: String,
    // NPM 源：
    // 由 Docker-YApi 新增，
    // 目前仅在安装插件时使用
    npmRegistry: String,
    closeRegister: Boolean,
    db: {
      servername: String,
      port: Number,
      DATABASE: String,
      user: String,
      pass: String,
      connectString: String,
      authSource: String,
      options: JSON,
    },
    mail: {
      enable: Boolean,
      host: String,
      port: Number,
      from: String,
      auth: {
        user: String,
        pass: String,
      }
    },
    ldapLogin: {
      enable: Boolean,
      server: String,
      baseDn: String,
      bindPassword: String,
      searchDn: String,
      searchStandard: String,
      emailPostfix: String,
      emailKey: String,
      usernameKey: String,
    },
    plugins: JSON,
  }

  /**
   * 从文件获取配置。
   *
   * @returns 返回获取到的配置
   */
  static extractConfigFromFile() {
    return fs.existsSync('./config.js')
      ? require('./config.js')
      : fs.existsSync('./config.json')
        ? JSON.parse(fs.readFileSync('./config.json').toString())
        : {}
  }

  /**
   * 从环境变量获取配置。
   *
   * @param configCtx 配置上下文
   * @param shapeCtx 格式上下文
   * @param envPath 环境变量路径
   * @returns 返回获取到的配置
   */
  static extractConfigFromEnv(
    configCtx = {},
    shapeCtx = ConfigParser.configShape,
    envPath = ['YAPI'],
  ) {
    for (const [key, shape] of Object.entries(shapeCtx)) {
      const KEY = Helper.constCase(key)
      if (shape === JSON || typeof shape === 'function') {
        const envKey = envPath.concat(KEY).join('_')
        const envValue = process.env[envKey]
        if (envValue != null) {
          configCtx[key] = shape === Boolean
            ? !Helper.isFalsy(envValue)
            : shape === JSON
              ? JSON.parse(envValue.trim())
              : shape(envValue)
        }
      } else {
        if (configCtx[key] == null) {
          configCtx[key] = {}
        }
        ConfigParser.extractConfigFromEnv(configCtx[key], shape, envPath.concat(KEY))
      }
    }
    return configCtx
  }

  /**
   * 合并配置。
   *
   * @param config1 配置1
   * @param config2 配置2
   * @returns 返回合并后的配置
   */
  static mergeConfig(config1, config2) {
    return merge(config1, config2)
  }

  /**
   * 获取配置。
   */
  static extractConfig() {
    const configFromFile = ConfigParser.extractConfigFromFile()
    const configFromEnv = ConfigParser.extractConfigFromEnv()
    const config = ConfigParser.mergeConfig(configFromFile, configFromEnv)
    // 端口固定为 3000
    Object.assign(config, { port: 3000 })
    return config
  }
}

class BootstrapServer {
  constructor(port) {
    this.port = port
    this.server = null
    this.logs = []
  }

  /**
   * 日志记录。
   */
  log(message) {
    this.logs.push(message)
  }

  /**
   * 打开引导服务。
   */
  open() {
    this.server = http.createServer((req, res) => {
      res.setHeader('Connection', 'close')
      if (/\/logs$/.test(req.url)) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(JSON.stringify(this.logs))
      } else {
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        res.end(`<!DOCTYPE html><html>
          <head>
            <meta charset="utf-8">
            <title>YApi 正在启动...</title>
            <script crossorigin="anonymous" src="https://polyfill.io/v3/polyfill.min.js?features=fetch"></script>
          </head>
          <body>
            <h1>YApi 正在启动...</h1>
            <hr />
            <pre id="data"></pre>
            <script>
              function fetchData() {
                var timer = setTimeout(fetchData, 500)
                fetch('./logs')
                  .then(function (res) {
                    return res.json()
                  })
                  .then(function (data) {
                    document.querySelector('#data').innerHTML = data.join('\\n')
                  })
                  .catch(function () {
                    clearTimeout(timer)
                    setTimeout(function () { location.reload() }, 2000)
                  })
              }
              fetchData()
            </script>
          </body>
        </html>`)
      }
    })
    this.server.listen(this.port)
  }

  /**
   * 关闭引导服务。
   */
  close() {
    return new Promise(resolve => {
      this.server.close(resolve)
    })
  }
}

class Main {
  constructor() {
    this.config = ConfigParser.extractConfig()
    this.bootstrapServer = new BootstrapServer(this.config.port)
  }

  /**
   * 日志记录。
   */
  log(message) {
    console.log(message)
    this.bootstrapServer.log(message)
  }

  /**
   * 安装 YApi 插件。
   */
  installPluginsIfNeeded() {
    return new Promise(resolve => {
      if (Array.isArray(this.config.plugins) && this.config.plugins.length) {
        const packages = this.config.plugins
          .map(plugin => `yapi-plugin-${plugin.name}`)
          .join(' ')
        const e = childProcess.exec(`
          set -ex
          cd /yapi/vendors
          npm install ${packages} ${this.config.npmRegistry ? '--registry=' + this.config.npmRegistry : ''} --no-audit
          npm run build-client
        `)
        e.stdout.on('data', data => {
          this.log(String(data))
        })
        e.stderr.on('data', data => {
          this.log(String(data))
        })
        e.on('exit', resolve)
      } else {
        resolve()
      }
    })
  }

  /**
   * 等待 MongoDB 服务可用。
   */
  waitMongoDBAvailable() {
    return new Promise(resolve => {
      childProcess
        .exec(`
          until nc -z ${this.config.db.servername} ${this.config.db.port || 27017}
          do
            sleep 0.5
          done
        `)
        .on('exit', resolve)
    })
  }

  async start() {
    this.log('启动引导服务...')
    this.bootstrapServer.open()

    this.log('写入配置...')
    this.log(JSON.stringify(this.config, null, 2))
    fs.writeFileSync(
      './config.json',
      JSON.stringify(this.config),
    )

    this.log('等待 MongoDB 服务可用...')
    await this.waitMongoDBAvailable()

    this.log('安装 YApi 插件...')
    await this.installPluginsIfNeeded()

    this.log('尝试安装 YApi...')
    try {
      require('./vendors/server/install.js')
    } catch (e) {}

    this.log('关闭引导服务...')
    await this.bootstrapServer.close()

    this.log('尝试启动 YApi...')
    require('./vendors/server/app.js')
  }
}

new Main().start()

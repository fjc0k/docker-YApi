import childProcess from 'child_process'
import fs from 'fs'
import http from 'http'
import merge from 'deepmerge'

// ==== 辅助函数 ====
class Helper {
  /**
   * 简单的 CONSTANT_CASE 实现。
   *
   * @param str 要转换的字符串
   * @returns 返回转换后的字符串
   */
  static constCase(str: string): string {
    return str.replace(/(?<=[a-z])(?=[A-Z])/g, '_').toUpperCase()
  }

  /**
   * 是否是假值。
   *
   * @param value 要判断的值
   * @returns 返回判断结果
   */
  static isFalsy(value: string): boolean {
    return [
      'false',
      'False',
      'FALSE',
      'off',
      'Off',
      'OFF',
      'no',
      'No',
      'NO',
      '0',
    ].includes(value)
  }

  /**
   * 执行命令。
   *
   * @param cmd 要执行的命令
   * @param log 记录执行过程
   * @returns 返回执行结果
   */
  static async exec(
    cmd: string,
    log?: (message: string) => any,
  ): Promise<{
    error?: Error
    stdout: string
    stderr: string
    cmd: string
    code?: number
  }> {
    return new Promise((resolve) => {
      const child = childProcess.spawn('sh', ['-c', `set -ex\n${cmd}`], {
        stdio: 'pipe',
        cwd: process.cwd(),
      })

      let stdout = ''
      let stderr = ''

      child.stdout.on('data', (data) => {
        log && log(String(data))
        stdout += data
      })

      child.stderr.on('data', (data) => {
        log && log(String(data))
        stderr += data
      })

      child.on('error', (error) => {
        resolve({ error, stdout, stderr, cmd })
      })

      child.on('close', (code) => {
        resolve({ stdout, stderr, cmd, code })
      })
    })
  }

  /**
   * 执行 JS 文件。
   *
   * @param path 文件路径
   * @param log 记录执行过程
   * @returns 返回执行结果
   */
  static async execJsFile(path: string, log?: (message: string) => any) {
    return Helper.exec(`node --unhandled-rejections=strict ${path}`, log)
  }
}

// ==== 配置解析 ====
// 配置格式
// ref: https://hellosean1025.github.io/yapi/devops/index.html
const configShape = {
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
  port: Number,
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
    },
    // 传递给 NodeMailer 的额外参数：
    // 由 Docker-YApi 新增，
    // ref: https://nodemailer.com/smtp/
    options: JSON,
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
  plugins: [
    {
      name: String,
      options: JSON,
    },
  ],
} as const

type IConfigShape = typeof configShape

type GetType<T extends Record<any, any>> = {
  [K in keyof T]: T[K] extends StringConstructor
    ? string
    : T[K] extends BooleanConstructor
    ? boolean
    : T[K] extends NumberConstructor
    ? number
    : T[K] extends Record<any, any>
    ? GetType<T[K]>
    : T[K] extends [infer P]
    ? Array<GetType<P>>
    : any
}

export type IConfig = GetType<IConfigShape>

class ConfigParser {
  /**
   * 从文件获取配置。
   *
   * @returns 返回获取到的配置
   */
  static extractConfigFromFile(): IConfig {
    return fs.existsSync('/yapi/config.js')
      ? require('/yapi/config.js')
      : fs.existsSync('/yapi/config.json')
      ? JSON.parse(fs.readFileSync('/yapi/config.json').toString())
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
    shapeCtx = configShape,
    envPath = ['YAPI'],
  ): IConfig {
    for (const [key, shape] of Object.entries(shapeCtx)) {
      const KEY = Helper.constCase(key)
      if (
        Array.isArray(shape) ||
        (shape as any) === JSON ||
        typeof shape === 'function'
      ) {
        const envKey = envPath.concat(KEY).join('_')
        const envValue = process.env[envKey]
        if (envValue != null) {
          ;(configCtx as any)[key] =
            shape === Boolean
              ? !Helper.isFalsy(envValue)
              : Array.isArray(shape) || (shape as any) === JSON
              ? JSON.parse(envValue.trim())
              : (shape as any)(envValue)
        }
      } else {
        if ((configCtx as any)[key] == null) {
          ;(configCtx as any)[key] = {}
        }
        ConfigParser.extractConfigFromEnv(
          (configCtx as any)[key],
          shape as any,
          envPath.concat(KEY),
        )
      }
    }
    return configCtx as any
  }

  /**
   * 合并配置，配置2覆盖配置1。
   *
   * @param config1 配置1
   * @param config2 配置2
   * @returns 返回合并后的配置
   */
  static mergeConfig(config1: IConfig, config2: IConfig): IConfig {
    const config = merge(config1, config2)
    const plugins: IConfig['plugins'][0][] = []
    for (const plugin of [...(config.plugins || [])].reverse()) {
      if (!plugins.find((item) => item.name === plugin.name)) {
        plugins.push(plugin)
      }
    }
    ;(config as any).plugins = plugins
    return config
  }

  /**
   * 获取配置。
   */
  static extractConfig(): IConfig {
    const configFromFile = ConfigParser.extractConfigFromFile()
    const configFromEnv = ConfigParser.extractConfigFromEnv()
    const config = ConfigParser.mergeConfig(configFromFile, configFromEnv)
    // 端口固定为 3000，但支持通过环境变量 PORT 改变
    // 注: Heroku 必须使用 PORT 环境变量
    Object.assign(config, {
      port: process.env.PORT || 3000,
    })
    return config
  }
}

// ==== 引导服务 ====
class BootstrapServer {
  server!: http.Server

  logs: string[] = []

  constructor(private port: number) {}

  /**
   * 日志记录。
   */
  log(message: string) {
    this.logs.push(message)
  }

  /**
   * 打开引导服务。
   */
  open() {
    this.server = http.createServer((req, res) => {
      res.setHeader('Connection', 'close')
      if (/\/logs$/.test(req.url || '')) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8')
        res.end(JSON.stringify(this.logs))
      } else {
        res.setHeader('Content-Type', 'text/html; charset=utf-8')
        res.end(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>docker-YApi</title>
              <script crossorigin="anonymous" src="https://cdn.staticfile.org/fetch/3.0.0/fetch.min.js"></script>
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
          </html>
        `)
      }
    })
    this.server.listen(this.port)
  }

  /**
   * 关闭引导服务。
   */
  async close(): Promise<any> {
    return new Promise((resolve) => {
      this.server.close(resolve)
    })
  }
}

// ==== 入口 ====
class Main {
  private config!: IConfig

  private bootstrapServer!: BootstrapServer

  constructor() {
    this.config = ConfigParser.extractConfig()
    this.bootstrapServer = new BootstrapServer(this.config.port)
  }

  /**
   * 日志记录。
   */
  log(message: string, sendToClient: boolean = false) {
    console.log(message)
    if (sendToClient) {
      this.bootstrapServer.log(message)
    }
  }

  /**
   * 写入配置。
   */
  writeConfig(config: IConfig) {
    const finalConfig = JSON.parse(JSON.stringify(config))
    const mailOptions = finalConfig.mail.options || {}
    delete finalConfig.mail.options
    finalConfig.mail = merge(finalConfig.mail, mailOptions)
    fs.writeFileSync('/yapi/config.json', JSON.stringify(finalConfig))
  }

  /**
   * 安装 YApi 插件。
   */
  async installPluginsIfNeeded() {
    if (Array.isArray(this.config.plugins) && this.config.plugins.length > 0) {
      const packages = this.config.plugins
        .map((plugin) => `yapi-plugin-${plugin.name}`)
        .filter(
          (packageName) =>
            !fs.existsSync(`/yapi/vendors/node_modules/${packageName}`),
        )
        .join(' ')
      if (packages.length > 0) {
        await Helper.exec(
          `
            cd /yapi/vendors
            yarn add ${packages} ${
            this.config.npmRegistry
              ? `--registry=${this.config.npmRegistry}`
              : ''
          }
            yarn build-client
          `,
          (message) => this.log(message),
        )
      }
    }
  }

  /**
   * 等待 MongoDB 服务可用。
   */
  async waitMongoDBAvailable() {
    // fix: 使用数据库集群时跳过 MongoDB 检测
    // issue: https://github.com/fjc0k/docker-YApi/issues/41
    if (this.config.db.connectString) return
    await Helper.exec(`
      until nc -z ${this.config.db.servername} ${this.config.db.port || 27017}
      do
        sleep 0.5
      done
    `)
  }

  async start() {
    this.log('启动引导服务...', true)
    this.bootstrapServer.open()

    this.log('写入配置...', true)
    this.log(JSON.stringify(this.config, null, 2))
    this.writeConfig(this.config)

    this.log('等待 MongoDB 服务可用...', true)
    await this.waitMongoDBAvailable()

    this.log('安装 YApi 插件...', true)
    await this.installPluginsIfNeeded()

    this.log('尝试安装 YApi...', true)
    await Helper.execJsFile('/yapi/vendors/server/install.js', (message) =>
      this.log(message),
    )

    this.log('关闭引导服务...', true)
    await this.bootstrapServer.close()

    this.log('尝试启动 YApi...', true)
    require('/yapi/vendors/server/app.js')
  }
}

new Main().start().catch((err) => {
  throw err
})

const fs = require('fs')
const childProcess = require('child_process')
const http = require('http')
const config = require('./config.js')

// 端口固定为 3000
Object.assign(config, { port: 3000 })

const consoleInfo = []

const addLog = message => {
  console.log(message)
  consoleInfo.push(message)
}

const server = http.createServer((req, res) => {
  res.setHeader('Connection', 'close')
  if (/\/consoleInfo$/.test(req.url)) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify(consoleInfo))
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
            fetch('./consoleInfo')
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

server.listen(config.port)

// 写入 YApi 可识别的配置文件
fs.writeFileSync(
  './config.json',
  JSON.stringify(config),
)

const start = () => {
  addLog('等待 MongoDB 可用...')
  childProcess
    .exec(`
      until nc -z ${config.db.servername} ${config.db.port || 27017}
      do
        sleep 0.5
      done
    `)
    .on('exit', () => {
      addLog('准备完成，开始启动...')

      try {
        // 尝试安装
        require('./vendors/server/install.js')
      } catch (e) {}

      server.close(() => {
        // 启动
        require('./vendors/server/app.js')
      })
    })
}

if (config.plugins && config.plugins.length) {
  // 要安装的插件列表
  const packages = config.plugins
    .map(plugin => `yapi-plugin-${plugin.name}`)
    .join(' ')

  // 安装插件
  const e = childProcess.exec(`
    cd /yapi/vendors
    echo "=== 安装插件 ===\n"
    echo "npm install ${packages}"
    npm install ${packages} --no-audit
    echo "=== 应用构建 ==="
    npm run build-client
  `)
  e.stdout.on('data', data => {
    addLog(String(data))
  })
  e.stderr.on('data', data => {
    addLog(String(data))
  })
  e.on('exit', start)
} else {
  start()
}

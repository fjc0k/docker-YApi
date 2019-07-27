const { db } = require('./config.json')

require('child_process')
  // 等待 mongo 可用
  .exec(`
    until nc -z ${db.servername} ${db.port || 27017}
    do
      sleep 0.5
    done
  `)
  .on('exit', () => {
    try {
      // 尝试安装
      require('./vendors/server/install.js')
    } catch (e) {}

    // 启动
    require('./vendors/server/app.js')
  })


module.exports = {
  // 管理员账号，管理员默认密码是 ymfe.org，不可配置，请安装完成后自行登录修改
  adminAccount: 'admin@hello.yapi',

  // MongoDB 数据库配置
  db: {
    // MongoDB 所在服务器
    servername: 'yapi-mongo',
    // MongoDB 端口
    port: 27017,
    // YApi 使用的数据库名称
    DATABASE: 'yapi',
  },

  // 邮件通知配置，默认关闭，若需开启请访问下面链接查看如何配置：
  // https://hellosean1025.github.io/yapi/devops/index.html#%e9%85%8d%e7%bd%ae%e9%82%ae%e7%ae%b1
  mail: {
    enable: false
  },

  // LDAP 登录配置，默认关闭，若需开启请访问下面链接查看如何配置：
  // https://hellosean1025.github.io/yapi/devops/index.html#%e9%85%8d%e7%bd%aeldap%e7%99%bb%e5%bd%95
  ldapLogin: {
    enable: false
  },

  // 是否禁止注册
  closeRegister: true,

  // 需安装的插件列表
  plugins: [
    // {
    //   name: '插件名称',
    //   options: {}
    // }
    // { name: 'import-swagger-customize' },
    // { name: 'interface-oauth2-token' }
  ]
}

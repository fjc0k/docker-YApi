import fs from 'fs-extra'
import { join } from 'path'
import childProcess from 'child_process'

async function prepare(rootDir: string) {
  // 删除不必要的文件
  childProcess.execSync(
    `
      cd ${rootDir}
      rm -rf .git .github docs test *.{jpg,md} .npmrc package-lock.json
    `
  )

  // 写入临时配置文件
  const configFile = join(rootDir, '../config.json')
  await fs.writeJSON(configFile, {})

  // 依赖修复
  const pkgFile = join(rootDir, './package.json')
  const pkgContent: Record<
    'dependencies' | 'devDependencies',
    Record<string, string>
  > = await fs.readJson(pkgFile)
  for (const deps of [pkgContent.dependencies, pkgContent.devDependencies]) {
    for (const [name, version] of Object.entries(deps)) {
      if (
        ['sass-loader', 'node-sass', 'ghooks', 'ava'].includes(name) ||
        name.includes('eslint')
      ) {
        delete deps[name]
      } else if (version.charAt(0) === '^') {
        deps[name] = version.substr(1)
      }
    }
  }
  Object.assign(pkgContent.devDependencies, {
    'sass-loader': '7.3.1',
    'sass': '1.22.10'
  })
  console.log('pkgContent', pkgContent)
  await fs.writeJSON(pkgFile, pkgContent)

  // 支持 adminPassword 配置项
  const installFile = join(rootDir, './server/install.js')
  let installFileContent = await fs.readFile(installFile, 'utf8')
  installFileContent = installFileContent
    .replace(
      'yapi.commons.generatePassword(',
      'yapi.commons.generatePassword(yapi.WEBCONFIG.adminPassword || '
    )
    .replace(
      '密码："ymfe.org"',
      '密码："${yapi.WEBCONFIG.adminPassword || "ymfe.org"}"'
    )
  await fs.writeFile(installFile, installFileContent)

  // 去除 eslint
  const ykitConfigFile = join(rootDir, './ykit.config.js')
  let ykitConfigContent = await fs.readFile(ykitConfigFile, 'utf8')
  ykitConfigContent = ykitConfigContent.replace(
    /baseConfig\.module\.preLoaders\.push.*?eslint-loader.*?;/s,
    ''
  )
  await fs.writeFile(ykitConfigFile, ykitConfigContent)
}

prepare(process.argv[2])

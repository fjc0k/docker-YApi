import fs from 'fs-extra'
import { join } from 'path'
import childProcess from 'child_process'
import { dedent } from 'vtils'

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

  // 写入 yarn 配置文件
  // const yarnConfigFile = join(rootDir, './.yarnrc')
  // await fs.writeFile(yarnConfigFile, dedent`
  //   save-prefix ''

  // `)

  // 依赖修复
  const pkgFile = join(rootDir, './package.json')
  const pkgContent: Record<
    'dependencies' | 'devDependencies',
    Record<string, string>
  > = await fs.readJson(pkgFile)
  for (const deps of [pkgContent.dependencies, pkgContent.devDependencies]) {
    for (const [name, version] of Object.entries(deps)) {
      if (version.charAt(0) === '^') {
        deps[name] = version.substr(1)
      } else if (['node-sass', 'ghooks'].includes(name)) {
        delete deps[name]
      }
    }
  }
  pkgContent.devDependencies.sass = '1.22.10'
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
}

prepare(process.argv[2])

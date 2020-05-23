import fs from 'fs-extra'
import { join, parse } from 'path'
import childProcess from 'child_process'
import globby from 'globby'

async function clean(rootDir: string) {
  const projectFilePath = join.bind(null, rootDir)
  const pkgFilePath = join.bind(null, projectFilePath('node_modules'))

  // 需要保留的文件列表
  const reservedFiles = [
    pkgFilePath('react/cjs/react.production.min.js'),
    pkgFilePath('react-dom/cjs/react-dom.production.min.js'),
    pkgFilePath('react-is/cjs/react-is.production.min.js'),
    pkgFilePath('scheduler/cjs/scheduler.production.min.js'),
    pkgFilePath('history/cjs/history.min.js'),
    pkgFilePath('resolve-pathname/cjs/resolve-pathname.min.js'),
    pkgFilePath('value-equal/cjs/value-equal.min.js'),
    pkgFilePath('jsondiffpatch/dist/jsondiffpatch.umd.js'),
    pkgFilePath('ajv-i18n/localize/es'),
    pkgFilePath('svgo/.svgo.yml'),
    pkgFilePath('.bin'),
    ...(await globby('**/*.min.*', {
      absolute: true,
      cwd: rootDir,
      ignore: ['**/node_modules/**'],
    })),
  ].map((filePath) => {
    const { dir, base } = parse(filePath)
    return {
      from: filePath,
      to: join(dir, 'r_' + base.replace(/\./g, '')),
    }
  })

  await Promise.all(
    reservedFiles.map(async ({ from, to }) => {
      await fs.rename(from, to)
    }),
  )

  childProcess.execSync(
    `
      cd ${rootDir}
      shopt -s globstar
      rm -rf \\
        **/*.{map,lock,log,md,yml,yaml,ts,txt} \\
        **/.[!.]* \\
        **/__*__ \\
        **/{tsconfig.json,package-lock.json,Makefile,CHANGELOG} \\
        **/*.{test,spec,min,umd,es,esm}.* \\
        **/{test,tests,example,examples,doc,docs,coverage,demo,umd,es,esm}/
    `,
    { shell: '/bin/bash' },
  )

  await Promise.all(
    reservedFiles.map(async ({ from, to }) => {
      await fs.rename(to, from)
    }),
  )
}

clean(process.argv[2])

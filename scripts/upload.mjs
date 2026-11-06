/**
 * 用 miniprogram-ci 上传小程序（上传后在后台“版本管理”里是开发版，可设为体验版）。
 *
 *   MP_PRIVATE_KEY_PATH=/path/to/private.wxXXXX.key npm run upload:mock
 *
 * 密钥在小程序后台「开发 → 开发管理 → 开发设置 → 小程序代码上传」生成，
 * 只放在本机或 CI 的密钥管理里，不要提交到仓库。
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import ci from 'miniprogram-ci'

const manifest = JSON.parse(readFileSync('src/manifest.json', 'utf8'))
const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
const appid = manifest['mp-weixin'].appid
const keyPath = process.env.MP_PRIVATE_KEY_PATH
const projectPath = resolve('dist/build/mp-weixin')
const version = process.env.MP_VERSION || pkg.version
const desc = process.env.MP_DESC || `${process.argv.includes('--mock') ? 'mock 演示版' : '正式数据'} ${new Date().toISOString().slice(0, 16)}`

if (!appid) throw new Error('src/manifest.json 里没有 mp-weixin.appid')
if (!keyPath || !existsSync(keyPath)) throw new Error('请用 MP_PRIVATE_KEY_PATH 指定上传密钥文件')
if (!existsSync(projectPath)) throw new Error('先构建：npm run build:mp-weixin 或 build:mp-weixin:mock')

const project = new ci.Project({ appid, type: 'miniProgram', projectPath, privateKeyPath: keyPath, ignores: ['node_modules/**/*'] })

const result = await ci.upload({
  project,
  version,
  desc,
  robot: 1,
  setting: { es6: true, es7: true, minify: true, autoPrefixWXSS: true },
  onProgressUpdate: (t) => typeof t === 'object' && t.status === 'done' && console.log('✓', t.message),
})
console.log(`上传成功：${appid} v${version}「${desc}」`)
console.log(result)

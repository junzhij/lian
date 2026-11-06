import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import uni from '@dcloudio/vite-plugin-uni'

/** 正式包里把 src/mock/index.ts 换成空实现（src/mock/stub.ts），模拟数据不会被打进小程序包 */
function stripMock(): Plugin {
  const stub = fileURLToPath(new URL('./src/mock/stub.ts', import.meta.url))
  return {
    name: 'strip-mock',
    enforce: 'pre',
    load(id) {
      if (/[\\/]src[\\/]mock[\\/]index\.ts$/.test(id.split('?')[0])) return readFileSync(stub, 'utf8')
    },
  }
}

export default defineConfig(({ mode }) => {
  const useMock = loadEnv(mode, process.cwd()).VITE_USE_MOCK === 'true'
  return {
    plugins: [useMock ? null : stripMock(), uni()],
  }
})

/// <reference types="vite/client" />

declare module '*.vue' {
  import { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

interface ImportMetaEnv {
  readonly VITE_USE_MOCK: string
  readonly VITE_API_BASE: string
  readonly VITE_MAP_CENTER: string
  readonly VITE_MAP_SCALE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

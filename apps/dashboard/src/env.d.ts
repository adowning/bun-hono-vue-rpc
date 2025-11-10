/// <reference types="vite/client" />
/// <reference types="element-plus/global" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}


interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_API_URL: string
  readonly VITE_APP_ENV: string
  readonly VITE_WS_HOST: string
  readonly VITE_WS_PORT: string
  readonly VITE_SUPABASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Environment variables
declare const __APP_VERSION__: string;
declare const __BUILD_TIME__: string;

// Element Plus global component types
declare module 'element-plus' {
  const ElMessage: any
  const ElNotification: any
  const ElMessageBox: any
  const ElLoading: any
  const Error: any
  export { ElMessage, ElNotification, ElMessageBox, ElLoading }
}

export { }
/// <reference types="vite/client" />
/// <reference types="element-plus/global" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, any>
  export default component
}

// Vite environment variables interface
// interface ImportMetaEnv {
//   readonly VITE_APP_TITLE: string
//   readonly VITE_API_URL: string
//   readonly VITE_APP_ENV: string
//   readonly VITE_WS_HOST: string
//   readonly VITE_WS_PORT: string
//   readonly VITE_SUPABASE_URL: string
// }

// Global interface for Vite import.meta env
// interface ImportMeta {
//   readonly env: ImportMetaEnv
// }

// Element Plus global component types
declare module 'element-plus' {
  const ElMessage: any
  const ElNotification: any
  const ElMessageBox: any
  const ElLoading: any
  export { ElMessage, ElNotification, ElMessageBox, ElLoading }
}

export {}

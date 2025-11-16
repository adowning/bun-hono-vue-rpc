import App from './App.vue'
import { createApp } from 'vue'
import { initStore } from './store'                 // Store
import { initRouter } from './router'               // Router
import language from './locales'                    // 国际化
import '@styles/tailwind.css'                           // tailwind
import '@styles/reset.scss'                         // 重置HTML样式
import '@styles/app.scss'                           // 全局样式
import '@styles/el-ui.scss'                         // 优化 Element 样式
import '@styles/mobile.scss'                        // 移动端样式优化
import '@styles/change.scss'                        // 主题切换过渡优化
import '@styles/theme-animation.scss'               // 主题切换动画
import '@styles/el-dark.scss'                       // Element 暗黑主题
import '@styles/dark.scss'                          // 系统主题
import '@utils/sys/console.ts'                      // 控制台输出内容
import { setupGlobDirectives } from './directives'
import { setupErrorHandle } from './utils/sys/error-handle'

// 🛡️ EARLY LOCALSTORAGE MONITORING

// Override localStorage operations as early as possible
(function monitorLocalStorageEarly() {
  const originalSetItem = localStorage.setItem.bind(localStorage)
  const originalRemoveItem = localStorage.removeItem.bind(localStorage)
  const originalClear = localStorage.clear.bind(localStorage)

  localStorage.setItem = function (key, value) {
    console.log('🔑 EARLY: Setting localStorage key:', key)
    return originalSetItem(key, value)
  }

  localStorage.removeItem = function (key) {
    console.log('🗑️ EARLY: Removing localStorage key:', key)
    return originalRemoveItem(key)
  }

  localStorage.clear = function () {
    console.log('🚨🚨🚨 EARLY: localStorage.CLEAR() CALLED 🚨🚨🚨')
    console.log('Stack trace:', new Error().stack)
    console.log('Keys before clear:', Object.keys(localStorage))
    return originalClear()
  }
})()

document.addEventListener(
  'touchstart',
  function () { },
  { passive: false }
)



// --- ADD THIS LOGIC ---

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Register the worker from the root
    navigator.serviceWorker.register('/public/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('[Dashboard] ServiceWorker registration successful with scope: ', registration.scope);
      })
      .catch((error) => {
        console.error('[Dashboard] ServiceWorker registration failed: ', error);
      });
  });
}

// --- END ADDITION ---

const app = createApp(App)
initStore(app)
initRouter(app)
setupGlobDirectives(app)
setupErrorHandle(app)

app.use(language)
app.mount('#app')

// ... rest of your app setup (use(router), use(pinia), etc.)
<template>
  <ElConfigProvider size="default" :locale="getLocale()" :z-index="3000">
    <RouterView></RouterView>
  </ElConfigProvider>
</template>

<script setup lang="ts">
  import en from 'element-plus/es/locale/lang/en'
  import zh from 'element-plus/es/locale/lang/zh-cn'
  import { useUserStore } from './store/modules/user'
  import { systemUpgrade } from './utils/sys'
  // import { useWebsocketStore } from '@/store/modules/websocket'
  import { LanguageEnum } from '@/enums/appEnum'

  import { getMe } from './services/client'
  import { supabase } from './services/supabase'
  import { router } from './router'
  import { checkStorageCompatibility } from './utils/storage'
  import { setThemeTransitionClass } from './utils/theme/animation'
  // const webSocketStore = useWebsocketStore()
  // console.log(webSocketStore.isAuthed)
  const userStore = useUserStore()
  const { language } = storeToRefs(userStore)

  const locales: Record<LanguageEnum, any> = {
    [LanguageEnum.ZH]: zh,
    [LanguageEnum.EN]: en
  }

  // Type assertion to ensure TypeScript knows language is a key of locales
  const getLocale = () => locales[language.value as LanguageEnum]

  onBeforeMount(() => {
    setThemeTransitionClass(true)
  })

  onMounted(() => {
    // Initialize auth state immediately
    const initializeAuth = async () => {
      console.log('[App] Initializing authentication state...')
      const { data: { session } } = await supabase.auth.getSession()
      console.log('[App] Initial session:', session ? 'exists' : 'null')
      
      if (session == null) {
        console.log('[App] No session found, setting login status to false')
        userStore.setLoginStatus(false)
      } else {
        console.log('[App] Session found, setting login status to true')
        const userInfo = await getMe()
        userStore.setCurrentUserInfo(userInfo)
        userStore.setLoginStatus(true)
        userStore.setToken(session.access_token, session.refresh_token)
        
        if (navigator.serviceWorker) {
          navigator.serviceWorker.ready
            .then((registration) => {
              if (registration.active) {
                registration.active.postMessage({
                  type: 'SET_TOKEN',
                  token: session.access_token
                })
                console.log('[AuthListener] Sent token to active Service Worker.')
              } else {
                console.error('[AuthListener] Service worker is registered but not active.')
              }
            })
            .catch((err) => {
              console.error('[AuthListener] Service worker .ready promise failed:', err)
            })
        }
      }
    }

    // Initialize auth state immediately, then set up listener
    initializeAuth().then(() => {
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('[AuthListener] Auth state changed:', event)
        console.log('[AuthListener] Session:', session ? 'exists' : 'null')
        
        if (session == null) {
          userStore.setLoginStatus(false)
          // Don't auto-redirect here - let the router guard handle it
        } else {
          const userInfo = await getMe()
          userStore.setCurrentUserInfo(userInfo)
          userStore.setLoginStatus(true)
          userStore.setToken(session.access_token, session.refresh_token)
          
          if (navigator.serviceWorker) {
            navigator.serviceWorker.ready
              .then((registration) => {
                if (registration.active) {
                  registration.active.postMessage({
                    type: 'SET_TOKEN',
                    token: session.access_token
                  })
                  console.log('[AuthListener] Sent token to active Service Worker.')
                } else {
                  console.error('[AuthListener] Service worker is registered but not active.')
                }
              })
              .catch((err) => {
                console.error('[AuthListener] Service worker .ready promise failed:', err)
              })
          }
        }
      })
    })
    // 检查存储兼容性
    // checkStorageCompatibility() // Commented out to prevent localStorage clearing
    
    // 提升暗黑主题下页面刷新视觉体验
    setThemeTransitionClass(false)
    // 系统升级
    systemUpgrade()
  })
</script>

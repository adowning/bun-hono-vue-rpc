<template>
  <div class="devtools-page" v-if="initialized">
    <!-- Page Header -->
    <div class="page-header mb-1">
      <div class="flex items-center justify-between">
        <!-- <div>
          <h1 class="text-3xl font-bold text-gray-900 mb-2">🔧 Developer Tools</h1>
          <p class="text-gray-600">Game testing and development environment</p>
        </div> -->
        <div class="flex items-center space-x-4">
          <div class="status-badge" :class="statusBadgeClass">
            <span class="flex items-center space-x-2">
              <div class="w-2 h-2 rounded-full" :class="statusIndicatorClass"></div>
              <span>{{ connectionStatus }}</span>
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content Grid -->
    <el-row :gutter="2">
      <!-- Game Loader Sidebar -->
      <el-col :xs="24" :sm="24" :md="8" :lg="6">
        <div class="loader-section">
          <game-loader
            @game-loaded="onGameLoaded"
            @game-error="onGameError"
            @token-changed="onTokenChanged"
            ref="gameLoaderRef"
          />
        </div>
      </el-col>

      <!-- Game Frame Section -->
      <el-col :xs="24" :sm="24" :md="16" :lg="18">
        <div class="game-section">
          <game-frame
            ref="gameFrameRef"
            :game-url="currentGameUrl"
            @iframe-load="onIframeLoad"
            @iframe-error="onIframeError"
          />
        </div>
      </el-col>
    </el-row>

    <!-- Additional Controls Section -->
    <el-row :gutter="2" class="mt-2">
      <el-col :span="24">
        <div class="additional-controls bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">🔧 Development Tools</h3>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <!-- Debug Info -->
            <div class="debug-info">
              <h4 class="text-sm font-medium text-gray-700 mb-2">Debug Information</h4>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-500">Frame Count:</span>
                  <span class="font-mono">{{ debugInfo.frameCount }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">Load Time:</span>
                  <span class="font-mono">{{ debugInfo.loadTime }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">Token Length:</span>
                  <span class="font-mono">{{ debugInfo.tokenLength }}</span>
                </div>
              </div>
            </div>

            <!-- Quick Actions -->
            <div class="quick-actions">
              <h4 class="text-sm font-medium text-gray-700 mb-2">Quick Actions</h4>
              <div class="space-y-2">
                <button
                  @click="clearConsole"
                  class="w-full text-left px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                >
                  🗑️ Clear Console
                </button>
                <button
                  @click="downloadLogs"
                  class="w-full text-left px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                >
                  📥 Download Logs
                </button>
                <button
                  @click="resetSession"
                  class="w-full text-left px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                >
                  🔄 Reset Session
                </button>
              </div>
            </div>

            <!-- Performance Metrics -->
            <div class="performance-metrics">
              <h4 class="text-sm font-medium text-gray-700 mb-2">Performance</h4>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-gray-500">Memory Usage:</span>
                  <span class="font-mono">{{ performance.memory }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">Frame Rate:</span>
                  <span class="font-mono">{{ performance.frameRate }}fps</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">Load Status:</span>
                  <span
                    class="font-mono"
                    :class="
                      performance.loadStatus === 'ready' ? 'text-green-600' : 'text-yellow-600'
                    "
                  >
                    {{ performance.loadStatus }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- Notification Toast -->
    <transition name="el-fade-in">
      <div v-if="notification.show" class="notification-toast fixed top-4 right-4 z-50 max-w-sm">
        <div
          class="flex items-center p-4 rounded-lg shadow-lg border-l-4"
          :class="notificationClasses"
        >
          <div class="flex-shrink-0">
            <span class="text-lg">{{ notification.icon }}</span>
          </div>
          <div class="ml-3 flex-1">
            <p class="text-sm font-medium" :class="notificationTitleClasses">
              {{ notification.title }}
            </p>
            <p class="text-sm" :class="notificationMessageClasses">
              {{ notification.message }}
            </p>
          </div>
          <div class="ml-4 flex-shrink-0">
            <button
              @click="hideNotification"
              class="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </transition>
  </div>

  <!-- Loading State -->
  <div v-else class="devtools-loading flex items-center justify-center min-h-screen">
    <div class="text-center">
      <div
        class="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"
      ></div>
      <h2 class="text-xl font-semibold text-gray-700">Initializing DevTools...</h2>
      <p class="text-gray-500 mt-2">Setting up game environment</p>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted } from 'vue'
  import GameLoader from '../../components/devtools/GameLoader.vue'
  import GameFrame from '../../components/devtools/GameFrame.vue'

  defineOptions({ name: 'DevTools' })

  /**
   * Injects the auth token into the game's iframe.
   * This function monkey-patches 'fetch' and 'XMLHttpRequest' inside the iframe.
   */
  const injectTokenPatch = (iframeWindow: Window, authToken: string) => {
    if (!iframeWindow) {
      console.error('Patch Error: Iframe window is not accessible.')
      return
    }

    console.log('Injecting auth patch into game frame...')

    const bearerToken = `Bearer ${authToken}`

    // 1. Patch window.fetch
    const originalFetch = iframeWindow.fetch
    iframeWindow.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
      try {
        if (!init) init = {}
        if (!init.headers) init.headers = {}

        // Add our auth header
        if (init.headers instanceof Headers) {
          init.headers.set('Authorization', bearerToken)
        } else if (Array.isArray(init.headers)) {
          init.headers.push(['Authorization', bearerToken])
        } else {
          init.headers['Authorization'] = bearerToken
        }
      } catch (e) {
        console.error('Error in fetch patch:', e)
      }

      return originalFetch.call(this, input, init)
    }

    // 2. Patch XMLHttpRequest (cast to any to handle iframe context)
    const iframeAny = iframeWindow as any
    const originalXHR_open = iframeAny.XMLHttpRequest.prototype.open
    const originalXHR_send = iframeAny.XMLHttpRequest.prototype.send

    iframeAny.XMLHttpRequest.prototype.open = function (
      method: string,
      url: string | URL,
      async: boolean = true,
      user?: string | null,
      password?: string | null
    ) {
      // Store the request URL to check in send()
      this._requestUrl = url.toString()
      return originalXHR_open.apply(this, [method, url, async, user, password])
    }

    iframeAny.XMLHttpRequest.prototype.send = function (
      body?: Document | XMLHttpRequestBodyInit | null
    ) {
      try {
        // Add our auth header
        this.setRequestHeader('Authorization', bearerToken)
      } catch (e) {
        console.error('Error in XHR patch:', e)
      }

      return originalXHR_send.call(this, body)
    }

    console.log('Auth patch injected successfully.')
  }
  // Reactive state
  const initialized = ref(false)
  const connectionStatus = ref('Connecting...')
  const frameCount = ref(0)
  let performanceInterval: NodeJS.Timeout | null = null

  // Component refs
  const gameLoaderRef = ref<InstanceType<typeof GameLoader>>()
  const gameFrameRef = ref<InstanceType<typeof GameFrame>>()

  // Shared state for game URL
  const currentGameUrl = ref<string>('')

  // Shared state for token (MISSING DECLARATION - BUG!)
  const token = ref<string>('')

  // Notification state
  const notification = ref({
    show: false,
    type: 'info' as 'success' | 'error' | 'warning' | 'info',
    title: '',
    message: '',
    icon: ''
  })

  // Debug information
  const debugInfo = ref({
    frameCount: 0,
    loadTime: '0ms',
    tokenLength: 0
  })

  // Performance metrics
  const performance = ref({
    memory: '0MB',
    frameRate: 0,
    loadStatus: 'loading'
  })

  // Computed properties
  const statusBadgeClass = computed(() => {
    switch (connectionStatus.value) {
      case 'Connected':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'Connecting...':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Error':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  })

  const statusIndicatorClass = computed(() => {
    switch (connectionStatus.value) {
      case 'Connected':
        return 'bg-green-500'
      case 'Connecting...':
        return 'bg-yellow-500'
      case 'Error':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  })

  const notificationClasses = computed(() => {
    const baseClasses = 'bg-white'
    const typeClasses = {
      success: 'border-green-500 text-green-800',
      error: 'border-red-500 text-red-800',
      warning: 'border-yellow-500 text-yellow-800',
      info: 'border-blue-500 text-blue-800'
    }
    return `${baseClasses} ${typeClasses[notification.value.type]}`
  })

  const notificationTitleClasses = computed(() => {
    const typeClasses = {
      success: 'text-green-800',
      error: 'text-red-800',
      warning: 'text-yellow-800',
      info: 'text-blue-800'
    }
    return typeClasses[notification.value.type]
  })

  const notificationMessageClasses = computed(() => {
    const typeClasses = {
      success: 'text-green-700',
      error: 'text-red-700',
      warning: 'text-yellow-700',
      info: 'text-blue-700'
    }
    return typeClasses[notification.value.type]
  })

  // Event handlers
  const onGameLoaded = (url: string) => {
    console.log('Game loaded:', url)
    currentGameUrl.value = url // Store the URL for GameFrame
    connectionStatus.value = 'Connected'
    performance.value.loadStatus = 'ready'

    debugInfo.value.loadTime = `${Date.now() - startTime}ms`

    showNotification('success', 'Game Loaded', 'Game has been successfully loaded')
  }

  const onGameError = (error: string) => {
    console.error('Game error:', error)
    connectionStatus.value = 'Error'
    performance.value.loadStatus = 'error'

    showNotification('error', 'Load Failed', error)
  }

  const onTokenChanged = (newToken: string) => {
    token.value = newToken // Store the token
    debugInfo.value.tokenLength = newToken.length
    console.log('Token changed, length:', newToken.length)
    showNotification('info', 'Token Updated', 'Authentication token has been refreshed')
  }

  const onIframeLoad = () => {
    console.log('GameFrame iframe loaded successfully')

    if (gameFrameRef.value) {
      const frameRef = gameFrameRef.value as any
      if (frameRef.iframeEl) {
        const iframeWindow = frameRef.iframeEl.contentWindow

        if (iframeWindow && token.value) {
          // Here is the magic!
          injectTokenPatch(iframeWindow, token.value)
        } else {
          console.error('Could not inject patch: iframe window or token is missing.')
          if (!token.value) {
            showNotification('error', 'Patch Failed', 'No auth token available to inject.')
          }
        }
      } else {
        console.error('iframeEl not found on gameFrameRef')
      }
    }
  }
  const onIframeError = (error: string) => {
    console.error('GameFrame iframe error:', error)
    connectionStatus.value = 'Error'
    showNotification('error', 'Frame Load Failed', error)
  }

  // Notification methods
  const showNotification = (
    type: typeof notification.value.type,
    title: string,
    message: string
  ) => {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    }

    notification.value = {
      show: true,
      type,
      title,
      message,
      icon: icons[type]
    }

    setTimeout(() => {
      hideNotification()
    }, 5000)
  }

  const hideNotification = () => {
    notification.value.show = false
  }

  // Development tools methods
  const clearConsole = () => {
    console.clear()
    showNotification('info', 'Console Cleared', 'Browser console has been cleared')
  }

  const downloadLogs = () => {
    const logs = {
      timestamp: new Date().toISOString(),
      connectionStatus: connectionStatus.value,
      debugInfo: debugInfo.value,
      performance: performance.value,
      url: window.location.href,
      userAgent: navigator.userAgent
    }

    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `devtools-logs-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)

    showNotification('success', 'Logs Downloaded', 'Development logs have been saved')
  }

  const resetSession = async () => {
    try {
      // Reset all state
      connectionStatus.value = 'Connecting...'
      currentGameUrl.value = '' // Clear the game URL
      debugInfo.value = {
        frameCount: 0,
        loadTime: '0ms',
        tokenLength: 0
      }
      performance.value = {
        memory: '0MB',
        frameRate: 0,
        loadStatus: 'loading'
      }

      // Reload components
      if (gameLoaderRef.value) {
        await gameLoaderRef.value.refreshToken()
      }

      if (gameFrameRef.value) {
        await gameFrameRef.value.reloadGame()
      }

      showNotification('success', 'Session Reset', 'All components have been reset')
    } catch (error) {
      console.error('Reset failed:', error)
      showNotification('error', 'Reset Failed', 'Failed to reset session')
    }
  }

  // Performance monitoring
  const updatePerformance = () => {
    // Update memory usage if available
    if ('memory' in performance) {
      const mem = (performance as any).memory
      performance.value.memory = `${Math.round(mem.usedJSHeapSize / 1024 / 1024)}MB`
    }

    // Update frame count and calculate frame rate
    debugInfo.value.frameCount++

    if (debugInfo.value.frameCount % 60 === 0) {
      performance.value.frameRate = 60 // Simplified calculation
    }
  }

  let startTime = Date.now()

  // Lifecycle
  onMounted(async () => {
    try {
      // Initialize the page
      await new Promise((resolve) => setTimeout(resolve, 1500)) // Simulate initialization
      initialized.value = true
      startTime = Date.now()

      // Start performance monitoring
      performanceInterval = setInterval(updatePerformance, 1000)

      // Set initial status
      connectionStatus.value = 'Ready'
    } catch (error) {
      console.error('Initialization failed:', error)
      showNotification('error', 'Initialization Failed', 'Failed to initialize devtools')
    }
  })

  onUnmounted(() => {
    if (performanceInterval) {
      clearInterval(performanceInterval)
    }
  })
</script>

<style scoped>
  .devtools-page {
    padding: 0.1rem;
    background-color: #f8fafc;
    min-height: 100vh;
  }

  .loader-section {
    position: sticky;
    top: 0.5rem;
    z-index: 10;
  }

  .game-section {
    background: transparent;
    min-height: 600px;
  }

  /* .status-badge {
    @apply px-3 py-1 rounded-full text-sm font-medium border;
  } */

  .additional-controls {
    transition: all 0.3s ease;
  }

  .additional-controls:hover {
    box-shadow:
      0 10px 25px -5px rgba(0, 0, 0, 0.1),
      0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }

  .devtools-loading {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  }

  /* Notification animations */
  .el-fade-in-enter-active,
  .el-fade-in-leave-active {
    transition: all 0.3s ease;
  }

  .el-fade-in-enter-from,
  .el-fade-in-leave-to {
    opacity: 0;
    transform: translateX(100%);
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .devtools-page {
      padding: 0.1rem;
    }

    .loader-section {
      position: static;
      margin-bottom: 0.1rem;
    }
  }

  @media (max-width: 640px) {
    .page-header h1 {
      font-size: 1.875rem;
    }

    .grid {
      grid-template-columns: 1fr;
    }
  }
</style>

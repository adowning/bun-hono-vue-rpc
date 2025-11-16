<template>
  <div class="game-loader p-6 bg-white rounded-lg shadow-lg border border-gray-200">
    <!-- Header Section -->
    <div class="loader-header mb-6">
      <h2 class="text-2xl font-bold text-gray-800 mb-2">🎮 Game Loader</h2>
      <p class="text-gray-600">Load and manage your game instance</p>
    </div>

    <!-- Status Panel -->
    <div class="status-panel mb-6">
      <div
        class="flex items-center justify-between p-4 rounded-lg border-l-4"
        :class="statusClasses"
      >
        <div class="flex items-center space-x-3">
          <div class="w-3 h-3 rounded-full animate-pulse" :class="statusIndicatorClasses"></div>
          <div>
            <h3 class="font-semibold" :class="statusTextClasses">{{ statusTitle }}</h3>
            <p class="text-sm" :class="statusSubtextClasses">{{ statusMessage }}</p>
          </div>
        </div>
        <div class="flex items-center space-x-2">
          <span
            v-if="isLoading"
            class="animate-spin rounded-full h-5 w-5 border-b-2"
            :class="spinnerColorClass"
          ></span>
          <button
            v-if="error"
            @click="clearError"
            class="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    </div>

    <!-- Token Information -->
    <div class="token-info mb-6" v-if="tokenInfo">
      <h4 class="text-sm font-medium text-gray-700 mb-2">Authentication Status</h4>
      <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div class="flex items-center space-x-2">
          <span class="text-green-500">✓</span>
          <span class="text-sm text-gray-600">Token: {{ tokenInfo.substring(0, 20) }}...</span>
        </div>
        <button
          @click="copyToken"
          class="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Copy
        </button>
      </div>
    </div>

    <!-- Game Controls -->
    <div class="game-controls space-y-4">
      <div class="control-row flex items-center justify-between">
        <label class="text-sm font-medium text-gray-700">Game URL</label>
        <div class="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
          <!-- {{ baseGameUrl }} -->
        </div>
      </div>

      <!-- URL Preview -->
      <div class="url-preview">
        <label class="text-sm font-medium text-gray-700 block mb-2">Preview URL</label>
        <div class="relative">
          <input
            v-model="fullGameUrl"
            type="text"
            readonly
            class="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            @click="copyUrl"
            class="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            📋
          </button>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="action-buttons grid grid-cols-2 gap-3 mt-6">
        <button
          @click="loadGame"
          :disabled="isLoading || !isTokenValid"
          class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
        >
          <span
            v-if="isLoading"
            class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"
          ></span>
          <span v-else>🚀</span>
          <span>{{ isLoading ? 'Loading...' : 'Load Game' }}</span>
        </button>

        <button
          @click="refreshToken"
          :disabled="isLoading"
          class="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
        >
          <span>🔄</span>
          <span>Refresh Token</span>
        </button>
      </div>

      <!-- Error Display -->
      <div v-if="error" class="error-display mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div class="flex items-center space-x-2">
          <span class="text-red-500">⚠️</span>
          <span class="text-red-700 font-medium">Error Details</span>
        </div>
        <p class="text-red-600 text-sm mt-2">{{ error }}</p>
        <button
          @click="loadGame"
          class="mt-3 text-sm px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>

    <!-- Statistics -->
    <div class="statistics mt-6 pt-6 border-t border-gray-200">
      <h4 class="text-sm font-medium text-gray-700 mb-3">Session Info</h4>
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div class="stat-item">
          <span class="text-gray-500">Load Count:</span>
          <span class="font-medium ml-2">{{ loadCount }}</span>
        </div>
        <div class="stat-item">
          <span class="text-gray-500">Last Load:</span>
          <span class="font-medium ml-2">{{ lastLoadTime }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, watch } from 'vue'

  defineOptions({ name: 'GameLoader' })

  // Token key from localStorage
  const TOKEN_KEY = 'sb-crqbazcsrncvbnapuxcp-auth-token'
  // const baseGameUrl = 'https://game.cashflowcasino.com/public/games/netent/NarcosNET/index.html'
  // const baseGameUrl = 'https://game.cashflowcasino.com/public/games/netent/FlowersNET/index.html'
  const baseGameUrl = '/public/games/netent/index.html' ///index.html?'
  // const baseGameUrl = 'https://api.cashflowcasino.com/games/netent/NarcosNET/index.html'
  // const baseGameUrl = 'https://r2-worker.andrews.workers.dev/NarcosNET.html?'
  // const baseGameUrl = `
  // https://r2-worker.andrews.workers.dev/games/NarcosNET/games/narcos-client/game/narcos-client.xhtml?launchType=iframe&iframeSandbox=allow-scripts%20allow-popups%20allow-popups-to-escape-sandbox%20allow-top-navigation%20allow-top-navigation-by-user-activation%20allow-same-origin%20allow-forms%20allow-pointer-lock&applicationType=browser&gameId=narcos_not_mobile&server=https%3A%2F%2Fnetent-game.casinomodule.com%2F&lang=en&sessId=DEMO-3262959954-EUR&operatorId=netent&statisticEndpointURL=/&casinourl=/&loadSeqNo=0`
  // Emits for communication with parent component
  const emit = defineEmits<{
    gameLoaded: [url: string]
    gameError: [error: string]
    tokenChanged: [token: string]
  }>()

  // Reactive state
  const token = ref<string>('')
  const isLoading = ref(false)
  const error = ref<string>('')
  const loadCount = ref(0)
  const lastLoadTime = ref<string>('')

  // Computed properties
  const tokenInfo = computed(() => {
    return token.value ? `${token.value.substring(0, 50)}...` : ''
  })

  const isTokenValid = computed(() => {
    return token.value && token.value.length > 0
  })

  const fullGameUrl = computed(() => {
    console.log('=== URL DEBUG ===')
    console.log('baseGameUrl:', baseGameUrl.trim())
    console.log('token available:', !!token.value, 'length:', token.value.length)
    console.log('isTokenValid:', isTokenValid.value)

    const result = isTokenValid.value
      ? `${baseGameUrl.trim()}?token=${encodeURIComponent(token.value)}`
      : baseGameUrl.trim()

    console.log('result URL:', result)
    console.log('==================')

    return result
  })

  const statusTitle = computed(() => {
    if (isLoading.value) return 'Loading Game...'
    if (error.value) return 'Load Failed'
    if (isTokenValid.value) return 'Ready to Load'
    return 'No Token Found'
  })

  const statusMessage = computed(() => {
    if (isLoading.value) return 'Initializing game instance...'
    if (error.value) return error.value
    if (isTokenValid.value) return 'Authentication token is valid'
    return 'Please login to obtain an authentication token'
  })

  const statusClasses = computed(() => {
    if (isLoading.value) return 'bg-blue-50 border-blue-500'
    if (error.value) return 'bg-red-50 border-red-500'
    if (isTokenValid.value) return 'bg-green-50 border-green-500'
    return 'bg-yellow-50 border-yellow-500'
  })

  const statusIndicatorClasses = computed(() => {
    if (isLoading.value) return 'bg-blue-500'
    if (error.value) return 'bg-red-500'
    if (isTokenValid.value) return 'bg-green-500'
    return 'bg-yellow-500'
  })

  const statusTextClasses = computed(() => {
    if (isLoading.value) return 'text-blue-700'
    if (error.value) return 'text-red-700'
    if (isTokenValid.value) return 'text-green-700'
    return 'text-yellow-700'
  })

  const statusSubtextClasses = computed(() => {
    if (isLoading.value) return 'text-blue-600'
    if (error.value) return 'text-red-600'
    if (isTokenValid.value) return 'text-green-600'
    return 'text-yellow-600'
  })

  const spinnerColorClass = computed(() => {
    if (isLoading.value) return 'border-blue-500'
    return 'border-gray-300'
  })

  // Methods
  const retrieveToken = () => {
    console.log('=== GameLoader: retrieveToken START ===')
    try {
      console.log('Looking for token key:', TOKEN_KEY)
      const storedToken = localStorage.getItem(TOKEN_KEY)
      console.log(
        'Found stored token:',
        !!storedToken,
        storedToken ? `length: ${storedToken.length}` : 'null'
      )

      if (storedToken && storedToken !== token.value) {
        console.log('Parsing token JSON...')
        try {
          const parsedToken = JSON.parse(storedToken)
          console.log('Parsed token structure:', {
            hasAccessToken: !!parsedToken.access_token,
            accessTokenLength: parsedToken.access_token ? parsedToken.access_token.length : 0,
            keys: Object.keys(parsedToken)
          })

          if (parsedToken.access_token) {
            token.value = parsedToken.access_token
            console.log('Token set successfully:', token.value.substring(0, 20) + '...')
            emit('tokenChanged', token.value) // Emit the actual token value, not raw storage
          } else {
            console.error('No access_token found in parsed token')
            error.value = 'No access_token found in stored token'
          }
        } catch (parseErr) {
          console.error('Failed to parse token JSON:', parseErr)
          console.log('Raw token content:', storedToken)
          error.value = 'Failed to parse stored authentication token'
        }
      } else {
        console.log('Token unchanged or not found')
      }
    } catch (err) {
      console.error('Error retrieving token:', err)
      console.error('Error stack:', err.stack)
      error.value = 'Failed to retrieve authentication token from storage'
    }
    console.log('=== GameLoader: retrieveToken END ===')
  }

  const loadGame = async () => {
    if (!isTokenValid.value) {
      error.value = 'No valid authentication token found'
      return
    }

    isLoading.value = true
    error.value = ''

    try {
      // Simulate loading time for better UX
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const gameUrl = fullGameUrl.value
      loadCount.value++
      lastLoadTime.value = new Date().toLocaleTimeString()

      emit('gameLoaded', gameUrl)
    } catch (err) {
      console.error('Error loading game:', err)
      error.value = 'Failed to load game. Please try again.'
      emit('gameError', error.value)
    } finally {
      isLoading.value = false
    }
  }

  const refreshToken = () => {
    retrieveToken()
    if (isTokenValid.value) {
      error.value = ''
    }
  }

  const clearError = () => {
    error.value = ''
  }

  const copyToken = async () => {
    try {
      await navigator.clipboard.writeText(token.value)
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy token:', err)
    }
  }

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(fullGameUrl.value)
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy URL:', err)
    }
  }

  // Lifecycle
  onMounted(async () => {
    retrieveToken()
    await loadGame()
  })

  // Watch for localStorage changes
  window.addEventListener('storage', (e) => {
    if (e.key === TOKEN_KEY) {
      retrieveToken()
    }
  })

  // Watch for token changes
  watch(token, (newToken) => {
    if (newToken && !isLoading.value) {
      error.value = ''
    }
  })

  // Expose methods for parent component
  defineExpose({
    loadGame,
    refreshToken,
    retrieveToken,
    isLoading,
    error,
    token
  })
</script>

<style scoped>
  .game-loader {
    max-width: 500px;
  }

  .control-row {
    padding: 0.5rem 0;
  }

  .stat-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  /* Responsive adjustments */
  @media (max-width: 768px) {
    .game-loader {
      padding: 1rem;
      margin: 0.5rem;
    }

    .action-buttons {
      grid-template-columns: 1fr;
    }
  }
</style>

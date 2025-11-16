<template>
  <div class="test-reload-container p-6 bg-white rounded-lg shadow-lg">
    <h2 class="text-2xl font-bold mb-4">🧪 Reload Button Test</h2>
    
    <!-- Test Game Frame -->
    <div class="mb-4">
      <GameFrame
        ref="gameFrameRef"
        :game-url="testGameUrl"
        @iframe-load="onIframeLoad"
        @iframe-error="onIframeError"
      />
    </div>
    
    <!-- Control Panel -->
    <div class="flex space-x-4">
      <button 
        @click="reloadGame"
        :disabled="isLoading"
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 transition-colors"
      >
        🔄 Reload Game
      </button>
      <span v-if="isLoading" class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></span>
      <span class="text-sm text-gray-600">Status: {{ status }}</span>
    </div>
    
    <!-- Debug Info -->
    <div class="mt-4 p-3 bg-gray-100 rounded">
      <h3 class="font-semibold mb-2">Debug Info:</h3>
      <div class="text-sm">
        <div>Frame Ref Available: {{ !!gameFrameRef }}</div>
        <div>Iframe El Available: {{ !!gameFrameRef?.iframeEl }}</div>
        <div>Game Iframe Ref Available: {{ !!gameFrameRef?.gameIframe }}</div>
        <div>Last Load: {{ lastLoadTime }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import GameFrame from './devtools/GameFrame.vue'

  defineOptions({ name: 'TestGameReload' })

  // Test game URL
  const testGameUrl = 'https://game.cashflowcasino.com/public/games/netent/FlowersNET.html'
  
  // Component refs
  const gameFrameRef = ref<InstanceType<typeof GameFrame>>()

  // Reactive state
  const isLoading = ref(false)
  const lastLoadTime = ref('')
  const status = ref('Ready')

  // Methods
  const reloadGame = async () => {
    console.log('🧪 Test: Starting reload...')
    status.value = 'Loading...'
    isLoading.value = true
    
    try {
      if (gameFrameRef.value) {
        console.log('🧪 Test: Calling reloadGame...')
        await gameFrameRef.value.reloadGame()
        status.value = 'Reload completed'
        lastLoadTime.value = new Date().toLocaleTimeString()
      } else {
        console.error('🧪 Test: GameFrame ref not available')
        status.value = 'Frame ref missing'
      }
    } catch (error) {
      console.error('🧪 Test: Reload failed:', error)
      status.value = 'Reload failed'
    } finally {
      isLoading.value = false
    }
  }

  const onIframeLoad = () => {
    console.log('🧪 Test: Iframe loaded successfully')
    status.value = 'Iframe loaded'
  }

  const onIframeError = (error: string) => {
    console.error('🧪 Test: Iframe error:', error)
    status.value = 'Iframe error'
  }

  // Expose for parent
  defineExpose({
    reloadGame
  })
</script>

<style scoped>
  .test-reload-container {
    max-width: 600px;
    margin: 2rem auto;
  }
</style>
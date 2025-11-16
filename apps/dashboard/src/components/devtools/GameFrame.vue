<template>
  <div
    class="game-frame-container flex flex-col items-center justify-center min-h-[500px] bg-gray-50 p-1"
  >
    <!-- Loading State -->
    <div v-if="isLoading" class="flex flex-col items-center justify-center space-y-4">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      <p class="text-gray-600">Loading game...</p>
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="flex flex-col items-center justify-center space-y-4 p-8 bg-red-50 rounded-lg border border-red-200"
    >
      <div class="text-red-500 text-6xl">⚠️</div>
      <h3 class="text-lg font-semibold text-red-700">Failed to Load Game</h3>
      <p class="text-red-600 text-center">{{ error }}</p>
      <button
        @click="reloadGame"
        class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
      >
        Retry
      </button>
    </div>

    <!-- Game Frame -->
    <div v-else-if="gameUrl" class="game-frame-wrapper" :class="{ 'opacity-0': isLoading }">
      <iframe
        ref="gameIframe"
        :src="gameUrl"
        class="game-iframe shadow-2xl rounded-lg border border-gray-300"
        :style="iframeStyle"
        @load="onIframeLoad"
        @error="onIframeError"
        frameborder="0"
        allow="fullscreen; autoplay; gamepad; xr-spatial-tracking"
        allowfullscreen
      ></iframe>
    </div>

    <!-- Control Panel -->
    <div class="mt-6 flex items-center space-x-4">
      <button
        @click="reloadGame"
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        :disabled="isLoading"
      >
        🔄 Reload Game
      </button>
      <button
        @click="toggleFullscreen"
        class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
        :disabled="!gameUrl"
      >
        ⛶ Fullscreen
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, nextTick, watch } from 'vue'

  defineOptions({ name: 'GameFrame' })

  // Props
  interface Props {
    gameUrl?: string
  }
  const props = defineProps<Props>()

  // Emits
  const emit = defineEmits<{
    iframeLoad: []
    iframeError: [error: string]
  }>()

  // Reactive state
  const isLoading = ref(false)
  const error = ref<string>('')
  const gameIframe = ref<HTMLIFrameElement>()

  // Google Pixel dimensions
  const PIXEL_WIDTH = 412
  const PIXEL_HEIGHT = 915

  // Computed game URL with token
  const gameUrl = computed(() => {
    return props.gameUrl || ''
  })

  // Responsive iframe style
  const iframeStyle = computed(() => {
    // Calculate responsive size maintaining aspect ratio
    const maxWidth = Math.min(window.innerWidth - 32, PIXEL_WIDTH)
    const scale = maxWidth / PIXEL_WIDTH
    const width = maxWidth
    const height = PIXEL_HEIGHT * scale

    return {
      width: `${PIXEL_WIDTH}px`,
      height: `${PIXEL_HEIGHT}px`,
      transform: `scale(${scale})`,
      transformOrigin: 'top center'
    }
  })

  // Methods
  const reloadGame = async () => {
    if (!gameUrl.value) {
      error.value = 'No game URL provided'
      return
    }

    isLoading.value = true
    error.value = ''

    try {
      await nextTick()
      if (gameIframe.value) {
        gameIframe.value.src = gameUrl.value
      }
    } catch (err) {
      console.error('Error reloading game:', err)
      error.value = 'Failed to reload game.'
      isLoading.value = false
    }
  }

  const onIframeLoad = () => {
    console.log('Game iframe loaded successfully')
    isLoading.value = false
    error.value = ''
    emit('iframeLoad')
  }

  const onIframeError = (event: Event) => {
    console.error('Game iframe error:', event)
    error.value = 'Failed to load the game. Please check your connection and try again.'
    isLoading.value = false
    emit('iframeError', error.value)
  }

  const toggleFullscreen = () => {
    if (!gameIframe.value) return

    try {
      if (document.fullscreenElement) {
        document.exitFullscreen()
      } else {
        gameIframe.value.requestFullscreen()
      }
    } catch (err) {
      console.error('Fullscreen error:', err)
    }
  }

  // Handle window resize for responsive iframe
  const handleResize = () => {
    // Trigger recomputation of iframe style
  }

  // Lifecycle
  onMounted(() => {
    // Add resize listener
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  })

  // Watch for gameUrl changes
  // Watch for gameUrl changes
  watch(
    () => props.gameUrl,
    (newUrl) => {
      console.log('GameFrame: gameUrl prop changed:', newUrl)
      if (newUrl && gameIframe.value) {
        console.log('GameFrame: Loading new game URL:', newUrl)
        reloadGame()
      } else if (!newUrl) {
        console.log('GameFrame: No game URL provided, clearing frame')
        isLoading.value = false
        error.value = ''
      }
    }
  )
  watch(
    () => props.gameUrl,
    (newUrl) => {
      if (newUrl && gameIframe.value) {
        console.log('GameFrame: Loading new game URL:', newUrl)
        reloadGame()
      }
    }
  )

  // Expose methods for parent component
  defineExpose({
    reloadGame,
    toggleFullscreen,
    gameIframe: gameIframe,
    iframeEl: gameIframe
  })
</script>

<style scoped>
  .game-frame-container {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 80vh;
  }

  .game-frame-wrapper {
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    position: relative;
  }

  .game-iframe {
    transition: opacity 0.3s ease;
    background: #000;
  }

  /* Responsive adjustments */
  @media (max-width: 480px) {
    .game-frame-wrapper {
      padding: 0.5rem;
      margin: 0.5rem;
    }
  }

  @media (max-width: 768px) {
    .game-frame-container {
      padding: 0.5rem;
    }
  }
</style>

import { echarts, type EChartsOption } from '@/utils/echarts'
import { storeToRefs } from 'pinia'
import { useSettingStore } from '@/store/modules/setting'
import { getCssVar } from '@/utils/ui'
import type { BaseChartProps, ChartThemeConfig, UseChartOptions } from '@/types/component/chart'

// Chart Theme Configuration
export const useChartOps = (): ChartThemeConfig => ({
  /** */
  chartHeight: '16rem',
  /** Font Size */
  fontSize: 13,
  /** Font Color */
  fontColor: '#999',
  /** Theme Color */
  themeColor: getCssVar('--el-color-primary-light-1'),
  /** Color Group */
  colors: [
    getCssVar('--el-color-primary-light-1'),
    '#4ABEFF',
    '#EDF2FF',
    '#14DEBA',
    '#FFAF20',
    '#FA8A6C',
    '#FFAF20'
  ]
})

// Constant definitions
const RESIZE_DELAYS = [50, 100, 200, 350] as const
const MENU_RESIZE_DELAYS = [50, 100, 200] as const
const RESIZE_DEBOUNCE_DELAY = 100

export function useChart(options: UseChartOptions = {}) {
  const { initOptions, initDelay = 0, threshold = 0.1, autoTheme = true } = options

  const settingStore = useSettingStore()
  const { isDark, menuOpen, menuType } = storeToRefs(settingStore)

  const chartRef = ref<HTMLElement>()
  let chart: echarts.ECharts | null = null
  let intersectionObserver: IntersectionObserver | null = null
  let pendingOptions: EChartsOption | null = null
  let resizeTimeoutId: number | null = null
  let resizeFrameId: number | null = null
  let isDestroyed = false
  let emptyStateDiv: HTMLElement | null = null

  // Unified method for clearing timers
  const clearTimers = () => {
    if (resizeTimeoutId) {
      clearTimeout(resizeTimeoutId)
      resizeTimeoutId = null
    }
    if (resizeFrameId) {
      cancelAnimationFrame(resizeFrameId)
      resizeFrameId = null
    }
  }

  // Use requestAnimationFrame to optimize resize handling
  const requestAnimationResize = () => {
    if (resizeFrameId) {
      cancelAnimationFrame(resizeFrameId)
    }
    resizeFrameId = requestAnimationFrame(() => {
      handleResize()
      resizeFrameId = null
    })
  }

  // Debounced resize handling (for window resize events)
  const debouncedResize = () => {
    if (resizeTimeoutId) {
      clearTimeout(resizeTimeoutId)
    }
    resizeTimeoutId = window.setTimeout(() => {
      requestAnimationResize()
      resizeTimeoutId = null
    }, RESIZE_DEBOUNCE_DELAY)
  }

  // Multi-delay resize handling - unified method
  const multiDelayResize = (delays: readonly number[]) => {
    // Call immediately once for quick response
    nextTick(requestAnimationResize)

    // Use delay time to ensure chart properly adapts to changes
    delays.forEach((delay) => {
      setTimeout(requestAnimationResize, delay)
    })
  }

  // When menu collapses, recalculate chart size
  watch(menuOpen, () => multiDelayResize(RESIZE_DELAYS))

  // Menu type change trigger
  watch(menuType, () => {
    nextTick(requestAnimationResize)
    setTimeout(() => multiDelayResize(MENU_RESIZE_DELAYS), 0)
  })

  // Reconfigure chart options when theme changes
  if (autoTheme) {
    watch(isDark, () => {
      // Update empty state style
      emptyStateManager.updateStyle()

      if (chart && !isDestroyed) {
        // Use requestAnimationFrame to optimize theme update
        requestAnimationFrame(() => {
          if (chart && !isDestroyed) {
            const currentOptions = chart.getOption()
            if (currentOptions) {
              updateChart(currentOptions as EChartsOption)
            }
          }
        })
      }
    })
  }

  // Style generator - unified style configuration
  const createLineStyle = (color: string, width = 1, type?: 'solid' | 'dashed') => ({
    color,
    width,
    ...(type && { type })
  })

  // Axis Line Style
  const getAxisLineStyle = (show: boolean = true) => ({
    show,
    lineStyle: createLineStyle(isDark.value ? '#444' : '#EDEDED')
  })

  // Split Line Style
  const getSplitLineStyle = (show: boolean = true) => ({
    show,
    lineStyle: createLineStyle(isDark.value ? '#444' : '#EDEDED', 1, 'dashed')
  })

  // Axis Label Style
  const getAxisLabelStyle = (show: boolean = true) => {
    const { fontColor, fontSize } = useChartOps()
    return {
      show,
      color: fontColor,
      fontSize
    }
  }

  // Axis Tick Style
  const getAxisTickStyle = () => ({
    show: false
  })

  // Get animation configuration
  const getAnimationConfig = (animationDelay: number = 50, animationDuration: number = 1500) => ({
    animationDelay: (idx: number) => idx * animationDelay + 200,
    animationDuration: (idx: number) => animationDuration - idx * 50,
    animationEasing: 'quarticOut' as const
  })

  // Get unified tooltip configuration
  const getTooltipStyle = (trigger: 'item' | 'axis' = 'axis', customOptions: any = {}) => ({
    trigger,
    backgroundColor: isDark.value ? 'rgba(0, 0, 0, 0.8)' : 'rgba(255, 255, 255, 0.9)',
    borderColor: isDark.value ? '#333' : '#ddd',
    borderWidth: 1,
    textStyle: {
      color: isDark.value ? '#fff' : '#333'
    },
    ...customOptions
  })

  // Get unified legend configuration
  const getLegendStyle = (
    position: 'bottom' | 'top' | 'left' | 'right' = 'bottom',
    customOptions: any = {}
  ) => {
    const baseConfig = {
      textStyle: {
        color: isDark.value ? '#fff' : '#333'
      },
      itemWidth: 12,
      itemHeight: 12,
      itemGap: 20,
      ...customOptions
    }

    // Set different configuration based on position
    switch (position) {
      case 'bottom':
        return {
          ...baseConfig,
          bottom: 0,
          left: 'center',
          orient: 'horizontal',
          icon: 'roundRect'
        }
      case 'top':
        return {
          ...baseConfig,
          top: 0,
          left: 'center',
          orient: 'horizontal',
          icon: 'roundRect'
        }
      case 'left':
        return {
          ...baseConfig,
          left: 0,
          top: 'center',
          orient: 'vertical',
          icon: 'roundRect'
        }
      case 'right':
        return {
          ...baseConfig,
          right: 0,
          top: 'center',
          orient: 'vertical',
          icon: 'roundRect'
        }
      default:
        return baseConfig
    }
  }

  // Calculate grid configuration based on legend position
  const getGridWithLegend = (
    showLegend: boolean,
    legendPosition: 'bottom' | 'top' | 'left' | 'right' = 'bottom',
    baseGrid: any = {}
  ) => {
    const defaultGrid = {
      top: 15,
      right: 15,
      bottom: 8,
      left: 0,
      containLabel: true,
      ...baseGrid
    }

    if (!showLegend) {
      return defaultGrid
    }

    // Adjust grid based on legend position
    switch (legendPosition) {
      case 'bottom':
        return {
          ...defaultGrid,
          bottom: 40
        }
      case 'top':
        return {
          ...defaultGrid,
          top: 40
        }
      case 'left':
        return {
          ...defaultGrid,
          left: 120
        }
      case 'right':
        return {
          ...defaultGrid,
          right: 120
        }
      default:
        return defaultGrid
    }
  }

  // Create Intersection Observer
  const createIntersectionObserver = () => {
    if (intersectionObserver || !chartRef.value) return

    intersectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && pendingOptions && !isDestroyed) {
            // Use requestAnimationFrame to ensure chart initialization in next frame
            requestAnimationFrame(() => {
              if (!isDestroyed && pendingOptions) {
                try {
                  // Element becomes visible, initialize chart
                  if (!chart) {
                    chart = echarts.init(entry.target as HTMLElement)
                  }

                  // Trigger custom event to let component handle animation logic
                  const event = new CustomEvent('chartVisible', {
                    detail: { options: pendingOptions }
                  })
                  entry.target.dispatchEvent(event)

                  pendingOptions = null
                  cleanupIntersectionObserver()
                } catch (error) {
                  console.error('Chart initialization failed:', error)
                }
              }
            })
          }
        })
      },
      { threshold }
    )

    intersectionObserver.observe(chartRef.value)
  }

  // Clean up Intersection Observer
  const cleanupIntersectionObserver = () => {
    if (intersectionObserver) {
      intersectionObserver.disconnect()
      intersectionObserver = null
    }
  }

  // Check if container is visible
  const isContainerVisible = (element: HTMLElement): boolean => {
    const rect = element.getBoundingClientRect()
    return rect.width > 0 && rect.height > 0 && rect.top < window.innerHeight && rect.bottom > 0
  }

  // Core logic for chart initialization
  const performChartInit = (options: EChartsOption) => {
    if (!chart && chartRef.value && !isDestroyed) {
      chart = echarts.init(chartRef.value)
    }
    if (chart && !isDestroyed) {
      chart.setOption(options)
      pendingOptions = null
    }
  }

  // Empty state manager
  const emptyStateManager = {
    create: () => {
      if (!chartRef.value || emptyStateDiv) return

      emptyStateDiv = document.createElement('div')
      emptyStateDiv.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        color: ${isDark.value ? '#666' : '#999'};
        background: transparent;
        z-index: 10;
      `
      emptyStateDiv.innerHTML = `<span>暂无数据</span>`

      // Ensure parent container has relative positioning
      if (
        chartRef.value.style.position !== 'relative' &&
        chartRef.value.style.position !== 'absolute'
      ) {
        chartRef.value.style.position = 'relative'
      }

      chartRef.value.appendChild(emptyStateDiv)
    },

    remove: () => {
      if (emptyStateDiv && chartRef.value) {
        chartRef.value.removeChild(emptyStateDiv)
        emptyStateDiv = null
      }
    },

    updateStyle: () => {
      if (emptyStateDiv) {
        emptyStateDiv.style.color = isDark.value ? '#666' : '#999'
      }
    }
  }

  // Initialize chart
  const initChart = (options: EChartsOption = {}, isEmpty: boolean = false) => {
    if (!chartRef.value || isDestroyed) return

    const mergedOptions = { ...initOptions, ...options }

    try {
      if (isEmpty) {
        // Handle empty data situation - show custom empty state div
        if (chart) {
          chart.clear()
        }
        emptyStateManager.create()
        return
      } else {
        // Remove empty state div when data is available
        emptyStateManager.remove()
      }

      if (isContainerVisible(chartRef.value)) {
        // Container is visible, initialize normally
        if (initDelay > 0) {
          setTimeout(() => performChartInit(mergedOptions), initDelay)
        } else {
          performChartInit(mergedOptions)
        }
      } else {
        // Container is not visible, save options and set listener
        pendingOptions = mergedOptions
        createIntersectionObserver()
      }
    } catch (error) {
      console.error('Chart initialization failed:', error)
    }
  }

  // Update chart
  const updateChart = (options: EChartsOption) => {
    if (isDestroyed) return

    try {
      if (!chart) {
        // If chart doesn't exist, initialize first
        initChart(options)
        return
      }
      chart.setOption(options)
    } catch (error) {
      console.error('Chart update failed:', error)
    }
  }

  // Handle window size changes
  const handleResize = () => {
    if (chart && !isDestroyed) {
      try {
        chart.resize()
      } catch (error) {
        console.error('Chart resize failed:', error)
      }
    }
  }

  // Destroy chart
  const destroyChart = () => {
    isDestroyed = true

    if (chart) {
      try {
        chart.dispose()
      } catch (error) {
        console.error('Chart destruction failed:', error)
      } finally {
        chart = null
      }
    }

    // Clean up empty state div
    emptyStateManager.remove()
    cleanupIntersectionObserver()
    clearTimers()
    pendingOptions = null
  }

  // Get chart instance
  const getChartInstance = () => chart

  // Check if chart is initialized
  const isChartInitialized = () => chart !== null

  onMounted(() => {
    window.addEventListener('resize', debouncedResize)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', debouncedResize)
  })

  onUnmounted(() => {
    destroyChart()
  })

  return {
    isDark,
    chartRef,
    initChart,
    updateChart,
    handleResize,
    destroyChart,
    getChartInstance,
    isChartInitialized,
    emptyStateManager,
    getAxisLineStyle,
    getSplitLineStyle,
    getAxisLabelStyle,
    getAxisTickStyle,
    getAnimationConfig,
    getTooltipStyle,
    getLegendStyle,
    useChartOps,
    getGridWithLegend
  }
}

// Advanced chart component abstraction
interface UseChartComponentOptions<T extends BaseChartProps> {
  /** Props reactive object */
  props: T
  /** Chart configuration generation function */
  generateOptions: () => EChartsOption
  /** Empty data check function */
  checkEmpty?: () => boolean
  /** Custom reactive data to watch */
  watchSources?: (() => any)[]
  /** Custom visibility event handling */
  onVisible?: () => void
  /** useChart options */
  chartOptions?: UseChartOptions
}

export function useChartComponent<T extends BaseChartProps>(options: UseChartComponentOptions<T>) {
  const {
    props,
    generateOptions,
    checkEmpty,
    watchSources = [],
    onVisible,
    chartOptions = {}
  } = options

  const chart = useChart(chartOptions)
  const { chartRef, initChart, isDark, emptyStateManager } = chart

  // Check if data is empty
  const isEmpty = computed(() => {
    if (props.isEmpty) return true
    if (checkEmpty) return checkEmpty()
    return false
  })

  // Update chart
  const updateChart = () => {
    nextTick(() => {
      if (isEmpty.value) {
        // Handle empty data situation - show custom empty state div
        if (chart.getChartInstance()) {
          chart.getChartInstance()?.clear()
        }
        emptyStateManager.create()
      } else {
        // Remove empty state div and initialize chart when data is available
        emptyStateManager.remove()
        initChart(generateOptions())
      }
    })
  }

  // Handle logic when chart enters visible area
  const handleChartVisible = () => {
    if (onVisible) {
      onVisible()
    } else {
      updateChart()
    }
  }

  // Set up data watchers
  const setupWatchers = () => {
    // Watch custom data sources
    if (watchSources.length > 0) {
      watch(watchSources, updateChart, { deep: true })
    }

    // Watch theme changes
    watch(isDark, () => {
      emptyStateManager.updateStyle()
      updateChart()
    })
  }

  // Set up lifecycle
  const setupLifecycle = () => {
    onMounted(() => {
      updateChart()

      // Watch chart visible events
      if (chartRef.value) {
        chartRef.value.addEventListener('chartVisible', handleChartVisible)
      }
    })

    onBeforeUnmount(() => {
      // Clean up event listeners
      if (chartRef.value) {
        chartRef.value.removeEventListener('chartVisible', handleChartVisible)
      }
      // Clean up empty state div
      emptyStateManager.remove()
    })
  }

  // Initialize
  setupWatchers()
  setupLifecycle()

  return {
    ...chart,
    isEmpty,
    updateChart,
    handleChartVisible
  }
}

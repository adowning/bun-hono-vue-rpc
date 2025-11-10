import type { ColumnOption } from '@/types/component'
import { useWindowSize } from '@vueuse/core'
import { computed, nextTick, onMounted, onUnmounted, reactive, readonly, ref } from 'vue'
import { CacheInvalidationStrategy, TableCache, type ApiResponse } from '../utils/table/tableCache'
import { tableConfig } from '../utils/table/tableConfig'
import
{
  createErrorHandler,
  createSmartDebounce,
  defaultResponseAdapter,
  extractTableData,
  updatePaginationFromResponse,
  type TableError
} from '../utils/table/tableUtils'
import { useTableColumns } from './useTableColumns'

// Type inference utility types
type InferApiParams<T> = T extends (params: infer P) => any ? P : never
type InferApiResponse<T> = T extends (params: any) => Promise<infer R> ? R : never
type InferRecordType<T> = T extends Api.Common.PaginatedResponse<infer U> ? U : never

// Optimized configuration interface - supports automatic type inference
export interface UseTableConfig<
  TApiFn extends (params: any) => Promise<any> = (params: any) => Promise<any>,
  TRecord = InferRecordType<InferApiResponse<TApiFn>>,
  TParams = InferApiParams<TApiFn>,
  TResponse = InferApiResponse<TApiFn>
>
{
  // Core configuration
  core: {
    /** API request function */
    apiFn: TApiFn
    /** Default request parameters */
    apiParams?: Partial<TParams>
    /** Properties to exclude from apiParams */
    excludeParams?: string[]
    /** Whether to load data immediately */
    immediate?: boolean
    /** Column configuration factory function */
    columnsFactory?: () => ColumnOption<TRecord>[]
    /** Custom pagination field mapping */
    paginationKey?: {
      /** Current page field name, default is 'current' */
      page?: string
      /** Page size field name, default is 'size' */
      perPage?: string
    }
  }

  // Data processing
  transform?: {
    /** Data transformation function */
    dataTransformer?: (data: TRecord[]) => TRecord[]
    /** Response data adapter */
    responseAdapter?: (response: TResponse) => ApiResponse<TRecord>
  }

  // Performance optimization
  performance?: {
    /** Whether to enable caching */
    enableCache?: boolean
    /** Cache time (milliseconds) */
    cacheTime?: number
    /** Debounce delay time (milliseconds) */
    debounceTime?: number
    /** Maximum cache size limit */
    maxCacheSize?: number
  }

  // Lifecycle hooks
  hooks?: {
    /** Data loading success callback (only triggered when network request succeeds) */
    onSuccess?: (data: TRecord[], response: ApiResponse<TRecord>) => void
    /** Error handling callback */
    onError?: (error: TableError) => void
    /** Cache hit callback (triggered when data is retrieved from cache) */
    onCacheHit?: (data: TRecord[], response: ApiResponse<TRecord>) => void
    /** Loading state change callback */
    onLoading?: (loading: boolean) => void
    /** Reset form callback function */
    resetFormCallback?: () => void
  }

  // Debug configuration
  debug?: {
    /** Whether to enable log output */
    enableLog?: boolean
    /** Log level */
    logLevel?: 'info' | 'warn' | 'error'
  }
}

export function useTable<TApiFn extends (params: any) => Promise<any>>(
  config: UseTableConfig<TApiFn>
)
{
  return useTableImpl(config)
}

/**
 * Core implementation of useTable - powerful table data management Hook
 *
 * Provides a complete table solution, including:
 * - Data fetching and caching
 * - Pagination control
 * - Search functionality
 * - Smart refresh strategies
 * - Error handling
 * - Column configuration management
 */
function useTableImpl<TApiFn extends (params: any) => Promise<any>>(
  config: UseTableConfig<TApiFn>
)
{
  type TRecord = InferRecordType<InferApiResponse<TApiFn>>
  type TParams = InferApiParams<TApiFn>
  const {
    core: {
      apiFn,
      apiParams = {} as Partial<TParams>,
      excludeParams = [],
      immediate = true,
      columnsFactory,
      paginationKey
    },
    transform: { dataTransformer, responseAdapter = defaultResponseAdapter } = {},
    performance: {
      enableCache = false,
      cacheTime = 5 * 60 * 1000,
      debounceTime = 300,
      maxCacheSize = 50
    } = {},
    hooks: { onSuccess, onError, onCacheHit, resetFormCallback } = {},
    debug: { enableLog = false } = {}
  } = config

  // Pagination field name configuration: prioritize passed configuration, otherwise use global configuration
  const pageKey = paginationKey?.current || tableConfig.paginationKey.current
  const sizeKey = paginationKey?.size || tableConfig.paginationKey.size

  // Reactive trigger for manually updating cache statistics
  const cacheUpdateTrigger = ref(0)

  // Logger utility functions
  const logger = {
    log: (message: string, ...args: unknown[]) =>
    {
      if (enableLog) {
        console.log(`[useTable] ${message}`, ...args)
      }
    },
    warn: (message: string, ...args: unknown[]) =>
    {
      if (enableLog) {
        console.warn(`[useTable] ${message}`, ...args)
      }
    },
    error: (message: string, ...args: unknown[]) =>
    {
      if (enableLog) {
        console.error(`[useTable] ${message}`, ...args)
      }
    }
  }

  // Cache instance
  const cache = enableCache ? new TableCache<TRecord>(cacheTime, maxCacheSize, enableLog) : null

  // Loading state
  const loading = ref(false)

  // Error state
  const error = ref<TableError | null>(null)

  // Table data
  const data = ref<TRecord[]>([])

  // Request cancellation controller
  let abortController: AbortController | null = null

  // Cache cleanup timer
  let cacheCleanupTimer: NodeJS.Timeout | null = null

  // Search parameters
  const searchParams = reactive(
    Object.assign(
      {
        [pageKey]: 1,
        [sizeKey]: 10
      },
      apiParams || {}
    ) as TParams
  )

  // Pagination configuration
  const pagination = reactive<Api.Common.PaginationParams>({
    current: ((searchParams as Record<string, unknown>)[pageKey] as number) || 1,
    size: ((searchParams as Record<string, unknown>)[sizeKey] as number) || 10,
    total: 0
  })

  // Mobile pagination (reactive)
  const { width } = useWindowSize()
  const mobilePagination = computed(() => ({
    ...pagination,
    small: width.value < 768
  }))

  // Column configuration
  const columnConfig = columnsFactory ? useTableColumns<TRecord>(columnsFactory) : null
  const columns = columnConfig?.columns
  const columnChecks = columnConfig?.columnChecks

  // Whether has data
  const hasData = computed(() => data.value.length > 0)

  // Cache statistics
  const cacheInfo = computed(() =>
  {
    // Dependency trigger to ensure recalculation when cache changes
    void cacheUpdateTrigger.value
    if (!cache) return { total: 0, size: '0KB', hitRate: '0 avg hits' }
    return cache.getStats()
  })

  // Error handling function
  const handleError = createErrorHandler(onError, enableLog)

  // Clear cache, selectively clear cache according to different business scenarios
  const clearCache = (strategy: CacheInvalidationStrategy, context?: string): void =>
  {
    if (!cache) return

    let clearedCount = 0

    switch (strategy) {
      case CacheInvalidationStrategy.CLEAR_ALL:
        cache.clear()
        logger.log(`Clear all cache - ${context || ''}`)
        break

      case CacheInvalidationStrategy.CLEAR_CURRENT:
        clearedCount = cache.clearCurrentSearch(searchParams)
        logger.log(`Clear current search cache ${clearedCount} items - ${context || ''}`)
        break

      case CacheInvalidationStrategy.CLEAR_PAGINATION:
        clearedCount = cache.clearPagination()
        logger.log(`Clear pagination cache ${clearedCount} items - ${context || ''}`)
        break

      case CacheInvalidationStrategy.KEEP_ALL:
      default:
        logger.log(`Keep cache unchanged - ${context || ''}`)
        break
    }
    // Manually trigger cache state update
    cacheUpdateTrigger.value++
  }

  // Core method for fetching data
  const fetchData = async (
    params?: Partial<TParams>,
    useCache = enableCache
  ): Promise<ApiResponse<TRecord>> =>
  {
    // Cancel the previous request
    if (abortController) {
      abortController.abort()
    }

    // Create new cancellation controller
    const currentController = new AbortController()
    abortController = currentController

    loading.value = true
    error.value = null

    try {
      let requestParams = Object.assign(
        {},
        searchParams,
        {
          [pageKey]: pagination.current,
          [sizeKey]: pagination.size
        },
        params || {}
      ) as TParams

      // Exclude unnecessary parameters
      if (excludeParams.length > 0) {
        const filteredParams = { ...requestParams }
        excludeParams.forEach((key) =>
        {
          delete (filteredParams as Record<string, unknown>)[key]
        })
        requestParams = filteredParams as TParams
      }

      // Check cache
      if (useCache && cache) {
        const cachedItem = cache.get(requestParams)
        if (cachedItem) {
          data.value = cachedItem.data
          updatePaginationFromResponse(pagination, cachedItem.response)

          // Fix: avoid setting same values repeatedly, prevent reactive loop updates
          const paramsRecord = searchParams as Record<string, unknown>
          if (paramsRecord[pageKey] !== pagination.current) {
            paramsRecord[pageKey] = pagination.current
          }
          if (paramsRecord[sizeKey] !== pagination.size) {
            paramsRecord[sizeKey] = pagination.size
          }

          loading.value = false

          // Trigger specialized callback on cache hit, not onSuccess
          if (onCacheHit) {
            onCacheHit(cachedItem.data, cachedItem.response)
          }

          logger.log(`Cache hit`)
          return cachedItem.response
        }
      }

      const response = await apiFn(requestParams)

      // Check if request was cancelled
      if (currentController.signal.aborted) {
        throw new Error('Request cancelled')
      }

      // Convert to standard format using response adapter
      const standardResponse = responseAdapter(response)

      // Process response data
      let tableData = extractTableData(standardResponse)

      // Apply data transformation function
      if (dataTransformer) {
        tableData = dataTransformer(tableData)
      }

      // Update state
      data.value = tableData
      updatePaginationFromResponse(pagination, standardResponse)

      // Fix: avoid setting same values repeatedly, prevent reactive loop updates
      const paramsRecord = searchParams as Record<string, unknown>
      if (paramsRecord[pageKey] !== pagination.current) {
        paramsRecord[pageKey] = pagination.current
      }
      if (paramsRecord[sizeKey] !== pagination.size) {
        paramsRecord[sizeKey] = pagination.size
      }

      // Cache data
      if (useCache && cache) {
        cache.set(requestParams, tableData, standardResponse)
        // Manually trigger cache state update
        cacheUpdateTrigger.value++
        logger.log(`Data cached`)
      }

      // Success callback
      if (onSuccess) {
        onSuccess(tableData, standardResponse)
      }

      return standardResponse
    } catch (err) {
      if (err instanceof Error && err.message === 'Request cancelled') {
        // Request cancelled, do nothing
        return { records: [], total: 0, current: 1, size: 10 }
      }

      data.value = []
      const tableError = handleError(err, 'Failed to fetch table data')
      throw tableError
    } finally {
      loading.value = false
      // Only clear if current controller is active
      if (abortController === currentController) {
        abortController = null
      }
    }
  }

  // Get data (maintain current page)
  const getData = async (params?: Partial<TParams>): Promise<ApiResponse<TRecord> | void> =>
  {
    try {
      return await fetchData(params)
    } catch {
      // Error already handled in fetchData
      return Promise.resolve()
    }
  }

  // Get data by page (reset to first page) - specifically used for search scenarios
  const getDataByPage = async (params?: Partial<TParams>): Promise<ApiResponse<TRecord> | void> =>
  {
    pagination.current = 1
      ; (searchParams as Record<string, unknown>)[pageKey] = 1

    // Clear current search condition cache when searching, ensure getting latest data
    clearCache(CacheInvalidationStrategy.CLEAR_CURRENT, 'Search data')

    try {
      return await fetchData(params, false) // Don't use cache when searching
    } catch {
      // Error already handled in fetchData
      return Promise.resolve()
    }
  }

  // Smart debounced search function
  const debouncedGetDataByPage = createSmartDebounce(getDataByPage, debounceTime)

  // Reset search parameters
  const resetSearchParams = async (): Promise<void> =>
  {
    // Cancel debounced search
    debouncedGetDataByPage.cancel()

    // Save default values related to pagination
    const paramsRecord = searchParams as Record<string, unknown>
    const defaultPagination = {
      [pageKey]: 1,
      [sizeKey]: (paramsRecord[sizeKey] as number) || 10
    }

    // Clear all search parameters
    Object.keys(searchParams).forEach((key) =>
    {
      delete paramsRecord[key]
    })

    // Reset default parameters
    Object.assign(searchParams, apiParams || {}, defaultPagination)

    // Reset pagination
    pagination.current = 1
    pagination.size = defaultPagination[sizeKey] as number

    // Clear error state
    error.value = null

    // Clear cache
    clearCache(CacheInvalidationStrategy.CLEAR_ALL, 'Reset search')

    // Re-fetch data
    await getData()

    // Execute reset callback
    if (resetFormCallback) {
      await nextTick()
      resetFormCallback()
    }
  }

  // Flag to prevent duplicate calls
  let isCurrentChanging = false

  // Handle page size change
  const handleSizeChange = async (newSize: number): Promise<void> =>
  {
    if (newSize <= 0) return

    debouncedGetDataByPage.cancel()

    const paramsRecord = searchParams as Record<string, unknown>
    pagination.size = newSize
    pagination.current = 1
    paramsRecord[sizeKey] = newSize
    paramsRecord[pageKey] = 1

    clearCache(CacheInvalidationStrategy.CLEAR_CURRENT, 'Page size change')

    await getData()
  }

  // Handle current page change
  const handleCurrentChange = async (newCurrent: number): Promise<void> =>
  {
    if (newCurrent <= 0) return

    // Fix: prevent duplicate calls
    if (isCurrentChanging) {
      return
    }

    // Fix: if current page hasn't changed, no need to re-request
    if (pagination.current === newCurrent) {
      logger.log('Page number unchanged, skipping request')
      return
    }

    try {
      isCurrentChanging = true

      // Fix: only update necessary state
      const paramsRecord = searchParams as Record<string, unknown>
      pagination.current = newCurrent
      // Only update when searchParams pagination field differs from new value
      if (paramsRecord[pageKey] !== newCurrent) {
        paramsRecord[pageKey] = newCurrent
      }

      await getData()
    } finally {
      isCurrentChanging = false
    }
  }

  // Refresh methods for different business scenarios

  // Refresh after create: go to first page and clear pagination cache (suitable after adding data)
  const refreshCreate = async (): Promise<void> =>
  {
    debouncedGetDataByPage.cancel()
    pagination.current = 1
      ; (searchParams as Record<string, unknown>)[pageKey] = 1
    clearCache(CacheInvalidationStrategy.CLEAR_PAGINATION, 'Add data')
    await getData()
  }

  // Refresh after update: maintain current page, only clear current search cache (suitable after updating data)
  const refreshUpdate = async (): Promise<void> =>
  {
    clearCache(CacheInvalidationStrategy.CLEAR_CURRENT, 'Edit data')
    await getData()
  }

  // Refresh after delete: intelligently handle page numbers, avoid empty pages (suitable after deleting data)
  const refreshRemove = async (): Promise<void> =>
  {
    const { current } = pagination

    // Clear cache and get latest data
    clearCache(CacheInvalidationStrategy.CLEAR_CURRENT, 'Delete data')
    await getData()

    // If current page is empty and not first page, go to previous page
    if (data.value.length === 0 && current > 1) {
      pagination.current = current - 1
        ; (searchParams as Record<string, unknown>)[pageKey] = current - 1
      await getData()
    }
  }

  // Full refresh: clear all cache, re-fetch data (suitable for manual refresh button)
  const refreshData = async (): Promise<void> =>
  {
    debouncedGetDataByPage.cancel()
    clearCache(CacheInvalidationStrategy.CLEAR_ALL, 'Manual refresh')
    await getData()
  }

  // Light refresh: only clear current search condition cache, maintain pagination state (suitable for timed refresh)
  const refreshSoft = async (): Promise<void> =>
  {
    clearCache(CacheInvalidationStrategy.CLEAR_CURRENT, 'Soft refresh')
    await getData()
  }

  // Cancel current request
  const cancelRequest = (): void =>
  {
    if (abortController) {
      abortController.abort()
    }
    debouncedGetDataByPage.cancel()
  }

  // Clear data
  const clearData = (): void =>
  {
    data.value = []
    error.value = null
    clearCache(CacheInvalidationStrategy.CLEAR_ALL, 'Clear data')
  }

  // Clean up expired cache entries, release memory space
  const clearExpiredCache = (): number =>
  {
    if (!cache) return 0
    const cleanedCount = cache.cleanupExpired()
    if (cleanedCount > 0) {
      // Manually trigger cache state update
      cacheUpdateTrigger.value++
    }
    return cleanedCount
  }

  // Set up periodic cleanup of expired cache
  if (enableCache && cache) {
    cacheCleanupTimer = setInterval(() =>
    {
      const cleanedCount = cache.cleanupExpired()
      if (cleanedCount > 0) {
        logger.log(`Auto cleanup ${cleanedCount} expired cache items`)
        // Manually trigger cache state update
        cacheUpdateTrigger.value++
      }
    }, cacheTime / 2) // Clean once every half cache period
  }

  // Auto load data on mount
  if (immediate) {
    onMounted(async () =>
    {
      await getData()
    })
  }

  // Thorough cleanup on component unmount
  onUnmounted(() =>
  {
    cancelRequest()
    if (cache) {
      cache.clear()
    }
    if (cacheCleanupTimer) {
      clearInterval(cacheCleanupTimer)
    }
  })

  // Optimized return value structure
  return {
    // Data related
    /** Table data */
    data,
    /** Data loading state */
    loading: readonly(loading),
    /** Error state */
    error: readonly(error),
    /** Whether data is empty */
    isEmpty: computed(() => data.value.length === 0),
    /** Whether has data */
    hasData,

    // Pagination related
    /** Pagination state information */
    pagination: readonly(pagination),
    /** Mobile pagination configuration */
    paginationMobile: mobilePagination,
    /** Page size change handler */
    handleSizeChange,
    /** Current page change handler */
    handleCurrentChange,

    // Search related - unified prefix
    /** Search parameters */
    searchParams,
    /** Reset search parameters */
    resetSearchParams,

    // Data operations - clearer operation intent
    /** Load data */
    fetchData: getData,
    /** Get data */
    getData: getDataByPage,
    /** Get data (debounced) */
    getDataDebounced: debouncedGetDataByPage,
    /** Clear data */
    clearData,

    // Refresh strategies
    /** Full refresh: clear all cache, re-fetch data (suitable for manual refresh button) */
    refreshData,
    /** Light refresh: only clear current search condition cache, maintain pagination state (suitable for timed refresh) */
    refreshSoft,
    /** Refresh after create: go to first page and clear pagination cache (suitable after adding data) */
    refreshCreate,
    /** Refresh after update: maintain current page, only clear current search cache (suitable after updating data) */
    refreshUpdate,
    /** Refresh after delete: intelligently handle page numbers, avoid empty pages (suitable after deleting data) */
    refreshRemove,

    // Cache control
    /** Cache statistics */
    cacheInfo,
    /** Clear cache, selectively clear cache according to different business scenarios: */
    clearCache,
    // Support 4 clearing strategies
    // clearCache(CacheInvalidationStrategy.CLEAR_ALL, 'Manual refresh')     // Clear all cache
    // clearCache(CacheInvalidationStrategy.CLEAR_CURRENT, 'Search data') // Only clear current search condition cache
    // clearCache(CacheInvalidationStrategy.CLEAR_PAGINATION, 'Add data') // Clear pagination related cache
    // clearCache(CacheInvalidationStrategy.KEEP_ALL, 'Keep cache')      // Don't clear any cache
    /** Clean up expired cache entries, release memory space */
    clearExpiredCache,

    // Request control
    /** Cancel current request */
    cancelRequest,

    // Column configuration (if columnsFactory provided)
    ...(columnConfig && {
      /** Table column configuration */
      columns,
      /** Column display control */
      columnChecks,
      /** Add column */
      addColumn: columnConfig.addColumn,
      /** Remove column */
      removeColumn: columnConfig.removeColumn,
      /** Toggle column display state */
      toggleColumn: columnConfig.toggleColumn,
      /** Update column configuration */
      updateColumn: columnConfig.updateColumn,
      /** Batch update column configurations */
      batchUpdateColumns: columnConfig.batchUpdateColumns,
      /** Reorder columns */
      reorderColumns: columnConfig.reorderColumns,
      /** Get specific column configuration */
      getColumnConfig: columnConfig.getColumnConfig,
      /** Get all column configurations */
      getAllColumns: columnConfig.getAllColumns,
      /** Reset all column configurations to default state */
      resetColumns: columnConfig.resetColumns
    })
  }
}

// Re-export types and enums for convenient use
export { CacheInvalidationStrategy } from '../utils/table/tableCache'
export type { ApiResponse, CacheItem } from '../utils/table/tableCache'
export type { BaseRequestParams, TableError } from '../utils/table/tableUtils'


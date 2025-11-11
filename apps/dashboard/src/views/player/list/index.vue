<script setup lang="ts">
  import { ref, computed, watch, nextTick } from 'vue'
  import { Plus, Delete, Edit, Search, Refresh, ArrowDown } from '@element-plus/icons-vue'
  import { ElMessageBox } from 'element-plus'
  import { useTable, CacheInvalidationStrategy } from '@/composables/useTable'
  import { getColumnKey } from '@/composables/useTableColumns'
  import { getAllUsersWithBalance } from '@/api/client'

  defineOptions({ name: 'AdvancedTableDemo' })
  const router = useRouter()

  type UserListItem = Api.SystemManage.UserListItem

  // Selected rows
  const selectedRows = ref<UserListItem[]>([])

  // Table instance reference
  const tableRef = ref()

  // Debug panel state
  const showDebugPanel = ref(false)
  const debugActiveNames = ref(['cache', 'request', 'logs'])

  // Cache debug state
  const cacheDebugLogs = ref<string[]>([])
  const requestParams = ref<any>({
    current: 1,
    size: 20,
    name: '',
    phone: '',
    status: '',
    department: '',
    daterange: undefined
  })

  // Cache key information
  const cacheKeys = ref<string[]>([])

  // Phone search
  const phoneSearch = ref('')

  // Event demo related
  const eventDemoEnabled = ref(false)
  const eventLogs = ref<Array<{ type: string; message: string; time: string }>>([])

  // Table configuration demo
  const tableConfig = ref({
    height: '100%',
    fixedHeight: false // New: fixed height toggle
  })

  // Calculate actual table height
  const computedTableHeight = computed(() => {
    return tableConfig.value.fixedHeight ? '500px' : ''
  })

  // Search form ref
  const searchBarRef = ref()

  // Validation rules
  const rules = {
    name: [{ required: true, message: 'Please enter username', trigger: 'blur' }],
    phone: [
      { required: true, message: 'Please enter phone number', trigger: 'blur' },
      {
        pattern: /^1[3456789]\d{9}$/,
        message: 'Please enter correct phone number',
        trigger: 'blur'
      }
    ]
  }
  // const tableData = ref<any[]>([])
  // Form search initial values
  const searchFormState = ref({
    name: '',
    phone: '',
    status: '1',
    department: '',
    daterange: ['2025-01-01', '2025-02-10']
  })
  const formatterUSD = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  })
  // Search form state
  // const searchFormState = ref({ ...defaultFilter.value })

  // User status configuration
  const USER_STATUS_CONFIG = {
    ONLINE: { type: 'success' as const, text: 'Online' },
    OFFLINE: { type: 'info' as const, text: 'Offline' },
    INGAME: { type: 'warning' as const, text: 'InGame' },
    BANNED: { type: 'danger' as const, text: 'Banned' }
  } as const

  // Search form configuration
  // Date picker has multiple types, please refer to src/components/core/forms/art-search-bar/widget/art-search-date/README.md documentation
  const searchItems = computed(() => [
    {
      key: 'name',
      label: 'Username',
      type: 'input',
      props: {
        placeholder: 'Please enter username'
      }
    },
    {
      key: 'phone',
      label: 'Phone',
      type: 'input',
      props: {
        placeholder: 'Please enter phone number',
        maxlength: '11'
      }
    },
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { label: 'All', value: '' },
        { label: 'Online', value: 'ONLINE' },
        { label: 'Offline', value: 'OFFLINE' },
        { label: 'InGame', value: 'INGAME' },
        { label: 'Banned', value: 'BANNED' }
      ]
    },
    {
      key: 'department',
      label: 'Department',
      type: 'select',
      options: [
        { label: 'All', value: '' },
        { label: 'Technology', value: 'Technology' },
        { label: 'Product', value: 'Product' },
        { label: 'Operations', value: 'Operations' },
        { label: 'Marketing', value: 'Marketing' },
        { label: 'Design', value: 'Design' }
      ]
    },
    {
      key: 'daterange',
      label: 'Date Range',
      type: 'daterange',
      props: {
        type: 'daterange',
        startPlaceholder: 'Start Date',
        endPlaceholder: 'End Date',
        valueFormat: 'YYYY-MM-DD'
      }
    }
  ])

  // Export column configuration
  const exportColumns = computed(() => ({
    userName: { title: 'Username', width: 15 },
    userEmail: { title: 'Email', width: 20 },
    userPhone: { title: 'Phone', width: 15 },
    userGender: { title: 'Gender', width: 10 },
    department: { title: 'Department', width: 15 },
    status: {
      title: 'Status',
      width: 10,
      formatter: (value: string) => getUserStatusConfig(value).text
    }
  }))

  // Get user status configuration
  const getUserStatusConfig = (status: string) => {
    console.log(status)
    return (
      USER_STATUS_CONFIG[status as keyof typeof USER_STATUS_CONFIG] || {
        type: 'info' as const,
        text: 'Unknown'
      }
    )
  }
  const getUserRtpConfig = (rtp: number) => {
    console.log(rtp)
    // return (
    //   USER_STATUS_CONFIG[status as keyof typeof USER_STATUS_CONFIG] || {
    //     type: 'info' as const,
    //     text: 'Unknown'
    //   }
    // )
    if (rtp < 75 || rtp > 95) {
      return {
        type: 'danger' as const
      }
    }
    if (rtp < 80 || rtp > 90) {
      return {
        type: 'warning' as const
      }
    }
    return {
      type: 'success' as const
    }
  }
  // const fetchData = async () => {
  //   loading.value = true
  //   try {
  //     const response = await fetch('/mock/players.json')
  //     if (!response.ok) throw new Error('Failed to fetch')
  //     tableData.value = await response.json()
  //   } catch (error) {
  //     console.error('Error fetching players:', error)
  //     tableData.value = []
  //   } finally {
  //     loading.value = false
  //   }
  // }

  onMounted(() => {
    console.log('mounted')
    // fetchData()
  })
  // Simulate network request
  // const simulateNetworkRequest = (): Promise<void> => {
  //   return new Promise((resolve) => {
  //     setTimeout(() => {
  //       resolve()
  //     }, 500)
  //   })
  // }

  // Load data after simulated network request completes
  // onMounted(async () => {
  //   // Wait for simulated network request to complete
  //   await simulateNetworkRequest()
  //   await fetchData({ name: 'ricky', phone: 19388828388 })
  // })

  /**
   * Use useTable Hook to manage table data
   * Provides complete table solution, including data fetching, caching, pagination, search and other features
   */
  const {
    // Data related
    data, // Table data
    loading, // Loading state
    error, // Data loading error state
    hasData, // Whether has data
    // isEmpty, // Whether data is empty

    // Pagination related
    pagination, // Pagination information
    // paginationMobile, // Mobile pagination configuration
    handleSizeChange, // Page size change handler
    handleCurrentChange, // Current page change handler

    // Search related
    searchParams, // Search parameters
    resetSearchParams, // Reset search parameters

    // Data operations
    // fetchData, // Manual data loading method, can be used to wait for other requests to complete, used when immediate is false
    getData, // Get data
    getDataDebounced, // Get data (debounced)
    clearData, // Clear data

    // Refresh strategies
    refreshData, // Full refresh: clear all cache, refetch data (for manual refresh button)
    refreshSoft, // Light refresh: only clear current search condition cache, maintain pagination state (for timed refresh)
    refreshCreate, // Refresh after create: return to first page and clear pagination cache (after adding data)
    refreshUpdate, // Refresh after update: keep current page, only clear current search cache (after updating data)
    refreshRemove, // Refresh after delete: intelligently handle page numbers, avoid empty pages (after deleting data)

    // Cache control
    cacheInfo, // Cache statistics information
    clearCache, // Clear cache, selectively clean cache based on different business scenarios
    // Support 4 clearing strategies
    // clearCache(CacheInvalidationStrategy.CLEAR_ALL, 'Manual refresh')     // Clear all cache
    // clearCache(CacheInvalidationStrategy.CLEAR_CURRENT, 'Search data') // Only clear current search condition cache
    // clearCache(CacheInvalidationStrategy.CLEAR_PAGINATION, 'Add data') // Clear pagination related cache
    // clearCache(CacheInvalidationStrategy.KEEP_ALL, 'Keep cache')      // Don't clear any cache
    clearExpiredCache, // Clear expired cache, release memory space

    // Request control
    cancelRequest, // Cancel current request

    // Dynamic column configuration methods
    columns, // Table column configuration
    columnChecks, // Column display and drag configuration
    addColumn, // Add column
    removeColumn, // Remove column
    updateColumn, // Update column
    toggleColumn, // Toggle column display state
    resetColumns, // Reset column configuration
    batchUpdateColumns, // Batch update column configuration
    reorderColumns, // Reorder columns
    getColumnConfig, // Get column configuration
    getAllColumns // Get all column configuration
  } = useTable({
    // Core configuration
    core: {
      apiFn: (params) => {
        // Add debug info before API call
        const requestKey = JSON.stringify(params)
        console.log('🚀 API Request Params:', params)
        addCacheLog(`🚀 API Request: current=${params.current}, size=${params.size}`)
        addCacheLog(`🔑 Request Key: ${requestKey.substring(0, 100)}...`)

        // Record cache key (assumed to be cached)
        updateCacheKeys(requestKey)
        // return fetchData()
        const requestParams = {
          page: params.current,
          perPage: params.size
        }
        return getAllUsersWithBalance(requestParams)
      },
      apiParams: {
        current: 1,
        size: 20,
        ...searchFormState.value
      },
      // Exclude properties from apiParams
      excludeParams: ['daterange'],
      // Custom pagination field mapping, if not set will use global configuration paginationKey in tableConfig.ts
      // paginc
      immediate: true, // Whether to load data immediately
      columnsFactory: () => [
        // {
        //   type: 'expand',
        //   label: 'Expand Row',
        //   width: 80,
        //   formatter: (row) =>
        //     h('div', { style: 'padding: 10px 30px' }, [
        //       h('p', {}, 'User ID: ' + row.id),
        //       h('p', {}, 'Username: ' + row.userName),
        //       h('p', {}, 'Phone: ' + row.userPhone),
        //       h('p', {}, 'Email: ' + row.userEmail),
        //       h('p', {}, 'Gender: ' + row.userGender),
        //       h('p', {}, 'Status: ' + row.status),
        //       h('p', {}, 'Create Date: ' + row.createTime)
        //     ])
        // },
        { type: 'selection', width: 50 },
        // { type: 'index', width: 60, label: 'Number' }, // Local index column
        // { type: 'globalIndex', width: 60, label: 'Number' }, // Global index column
        {
          prop: 'avatar',
          // label: 'User Info',
          minWidth: 200,
          useSlot: true,
          useHeaderSlot: true,
          sortable: true
          // checked: false, // Hide column
        },
        {
          prop: 'roles',
          label: 'Role',
          sortable: true,
          formatter: (row) => row.roles[0] || 'User'
        },
        {
          prop: 'userBalance.realBalance',
          label: 'Balance',
          useHeaderSlot: true,
          sortable: false,
          formatter: (row) => `${formatterUSD.format(row.userBalance.realBalance / 100 || 0)}`
        },
        {
          prop: 'RTP',
          label: 'RTP',
          useSlot: true,
          sortable: false
          // formatter: (row) =>
          //   `${((row.userBalance.totalWon / row.userBalance.totalWagered) * 100).toFixed(2)}`
        },
        {
          prop: 'GGR',
          label: 'GGR',
          sortable: true,
          formatter: (row) =>
            `$${(row.userBalance.totalWagered - row.userBalance.totalWon).toFixed(2)}`
        },
        {
          prop: 'score',
          label: 'Vip',
          useSlot: true,
          sortable: true
        },
        {
          prop: 'status',
          label: 'Status',
          useSlot: true,
          sortable: true,
          formatter: (row) => row.status || 'ONLINE'
        },
        {
          prop: 'operation',
          label: '',
          width: 90,
          useSlot: true,
          fixed: 'right'
        }
      ]
    },

    // Data processing
    transform: {
      dataTransformer: (records) => {
        if (!Array.isArray(records)) return []

        return records.map((item) => ({
          ...item,
          avatar: `https://gameui.cashflowcasino.com/public/avatars/${item.avatar.replace(
            'avif',
            'webp'
          )}`, //ACCOUNT_TABLE_DATA[index % ACCOUNT_TABLE_DATA.length].avatar,
          // department: ['Technology', 'Product', 'Operations', 'Marketing', 'Design'][
          //   Math.floor(Math.random() * 5)
          // ],
          score: Math.floor(Math.random() * 5) + 1
          // status: ['ONLINE', 'OFFLINE', 'INGAME', 'BANNED'][Math.floor(Math.random() * 4)]
        }))
      }
      // Custom response adapter, handle special backend return format
      // responseAdapter: (data) => {
      //   const { list, total, pageNum, pageSize } = data
      //   return {
      //     records: list,
      //     total: total,
      //     current: pageNum,
      //     size: pageSize
      //   }
      // }
    },

    // Performance optimization
    performance: {
      enableCache: true, // Enable cache
      cacheTime: 5 * 60 * 1000, // 5 minutes
      debounceTime: 300,
      maxCacheSize: 100
    },

    // Lifecycle hooks
    hooks: {
      onSuccess: (data, response) => {
        console.log('📊 Response Details:', response)
        addCacheLog(`✅ Network request successful: ${data.length} records`)
        addCacheLog(
          `📝 Response Info: total=${response.total}, current=${response.current}, size=${response.size}`
        )
      },
      onError: (error) => {
        console.error('❌ Data loading failed:', error)
        addCacheLog(`❌ Request failed: ${error.message}`)
        ElMessage.error(error.message)
      },
      onCacheHit: (data, response) => {
        console.log('🎯 Cache hit:', data.length, 'records')
        console.log('🔑 Cache source:', response)
        addCacheLog(
          `🎯 Cache hit: ${data.length} records (current=${response.current}, size=${response.size})`
        )
        ElMessage.info('Data from cache')
      },
      resetFormCallback: () => {
        console.log('🔄 Form has been reset')
        addCacheLog('🔄 Form has been reset')
      }
    },

    // Debug configuration
    debug: {
      enableLog: true,
      logLevel: 'info'
    }
  })

  // Event handler functions
  const handleSelectionChange = (selection: UserListItem[]) => {
    selectedRows.value = selection
    console.log('Selection changed:', selection)
  }

  const handleRowClick = (row: UserListItem) => {
    console.log('Row clicked:', row)
    logEvent('Row Click', `Clicked user: ${row.userName}`)
  }

  /**
   * Header click event handler
   * @param column Column information
   */
  const handleHeaderClick = (column: { label: string; property: string }) => {
    console.log('Header clicked:', column)
    logEvent('Header Click', `Clicked ${column.label} column header`)
  }

  /**
   * Sort information type
   */
  interface SortInfo {
    prop: string
    order: 'ascending' | 'descending' | null
  }

  /**
   * Sort change event handler
   * @param sortInfo Sort information
   */
  const handleSortChange = (sortInfo: SortInfo) => {
    console.log('Sort event:', sortInfo)
    console.log('Sort field:', sortInfo.prop)
    console.log('Sort direction:', sortInfo.order)
    logEvent('Sort Change', `Field: ${sortInfo.prop}, Direction: ${sortInfo.order}`)
  }

  // Event log recording
  const logEvent = (type: string, message: string) => {
    if (!eventDemoEnabled.value) return

    const time = new Date().toLocaleTimeString()
    eventLogs.value.unshift({ type, message, time })

    // Limit log count
    if (eventLogs.value.length > 20) {
      eventLogs.value = eventLogs.value.slice(0, 20)
    }
  }

  // Get event type style
  const getEventType = (type: string): 'primary' | 'success' | 'warning' | 'info' | 'danger' => {
    const typeMap: Record<string, 'primary' | 'success' | 'warning' | 'info' | 'danger'> = {
      'Row Click': 'primary',
      'Row Double Click': 'success',
      'Row Right Click': 'warning',
      'Cell Click': 'info',
      'Cell Double Click': 'success',
      'Header Click': 'primary',
      'Selection Change': 'warning',
      'Sort Change': 'success'
    }
    return typeMap[type] || 'info'
  }

  // Demo function methods
  const toggleEventDemo = () => {
    eventDemoEnabled.value = !eventDemoEnabled.value
    if (eventDemoEnabled.value) {
      ElMessage.success(
        'Event monitoring enabled, please interact with the table to see the effect'
      )
    } else {
      ElMessage.info('Event monitoring disabled')
    }
  }

  const clearEventLogs = () => {
    eventLogs.value = []
    ElMessage.info('Event logs cleared')
  }

  const handleScrollToTop = () => {
    tableRef.value?.scrollToTop()
  }

  const handleScrollToPosition = () => {
    tableRef.value?.elTableRef.setScrollTop(200)
  }

  const handleToggleSelection = () => {
    if (selectedRows.value.length === 0) {
      tableRef.value?.elTableRef.toggleAllSelection()
      ElMessage.info('All selected')
    } else {
      tableRef.value?.elTableRef.clearSelection()
      ElMessage.info('Selection cleared')
    }
  }

  const handleGetTableInfo = () => {
    const info = {
      DataCount: data.value.length,
      SelectedCount: selectedRows.value.length,
      ColumnCount: columns?.value?.length ?? 0,
      CurrentPage: pagination.current,
      PageSize: pagination.size,
      TotalCount: pagination.total
    }

    console.log('Table info:', info)
    ElMessage.info(`Table info output to console, currently ${info.DataCount} records`)
  }

  const handleSearch = async () => {
    await searchBarRef.value.validate()

    console.log('Search params:', searchFormState.value)
    const { daterange, ...filtersParams } = searchFormState.value
    const [startTime, endTime] = Array.isArray(daterange) ? daterange : [null, null]

    // Assign search parameters
    Object.assign(searchParams, { ...filtersParams, startTime, endTime })
    getData()
  }

  const handleReset = () => {
    addCacheLog('🔄 Reset search')
    // Reset search form state
    // searchFormState.value = { ...defaultFilter.value }
    resetSearchParams()
  }

  const handlePhoneSearch = (value: string) => {
    searchFormState.value.phone = value
    searchParams.phone = value
    requestParams.value = { ...searchParams, phone: value }
    addCacheLog(`📱 Phone search: ${value}`)
    getDataDebounced()
  }

  const handleRefresh = () => {
    addCacheLog('🔄 Manual refresh')
    refreshData()
  }

  // CRUD operations
  const handleAdd = () => {
    ElMessage.success('User added successfully')
    refreshCreate()
  }

  const handleEdit = (row: UserListItem) => {
    router.push({ name: 'PlayerDetail', params: { id: row.id } })
    // ElMessage.success(`User ${row.userName} edited successfully`)
    // setTimeout(() => {
    //   refreshUpdate()
    // }, 1000)
  }

  const handleDelete = async (row: UserListItem) => {
    try {
      await ElMessageBox.confirm(
        `Are you sure you want to delete user ${row.userName}?`,
        'Warning',
        {
          confirmButtonText: 'Confirm',
          cancelButtonText: 'Cancel',
          type: 'warning'
        }
      )

      ElMessage.success('Deleted successfully')
      setTimeout(() => {
        refreshRemove()
      }, 1000)
    } catch {
      ElMessage.info('Deletion cancelled')
    }
  }

  const handleView = (row: UserListItem) => {
    // ElMessage.info(`View user ${row.userName}`)
    router.push({ name: 'PlayerDetail', params: { id: row.id } })
  }

  const handleBatchDelete = async () => {
    try {
      await ElMessageBox.confirm(
        `Are you sure you want to delete ${selectedRows.value.length} selected users?`,
        'Warning',
        {
          confirmButtonText: 'Confirm',
          cancelButtonText: 'Cancel',
          type: 'warning'
        }
      )

      ElMessage.success(`Successfully deleted ${selectedRows.value.length} users`)
      selectedRows.value = []
      setTimeout(() => {
        refreshRemove()
      }, 1000)
    } catch {
      ElMessage.info('Deletion cancelled')
    }
  }

  // Import export
  const handleExportSuccess = (filename: string, count: number) => {
    ElMessage.success(`Successfully exported ${count} records`)
  }

  /**
   * Excel import success handler
   * @param data Imported data array
   */
  const handleImportSuccess = (data: Record<string, any>[]) => {
    ElMessage.success(`Successfully imported ${data.length} records`)
    refreshCreate()
  }

  const handleImportError = (error: Error) => {
    ElMessage.error(`Import failed: ${error.message}`)
  }

  // Debug functions
  const handleClearCache = () => {
    clearCache(CacheInvalidationStrategy.CLEAR_ALL, 'Manual clear')
    cacheKeys.value = [] // Clear cache key list
    addCacheLog('🗑️ Manually clear all cache')
    ElMessage.success('Cache cleared')
  }

  const handleCleanExpiredCache = () => {
    const count = clearExpiredCache()
    addCacheLog(`🧹 Cleaned ${count} expired cache entries`)
    ElMessage.info(`Cleaned ${count} expired cache entries`)
  }

  const handleCancelRequest = () => {
    cancelRequest()
    addCacheLog('❌ Cancel current request')
    ElMessage.info('Request cancelled')
  }

  const handleClearData = () => {
    clearData()
    addCacheLog('🗑️ Clear all data')
    ElMessage.info('Data cleared')
  }

  const handleTestCache = () => {
    // Simulate rapid page switching to test cache
    const testPages = [1, 2, 3, 2, 1] // Test page sequence

    ElMessage.info('Starting cache test...')
    addCacheLog('🧪 Starting cache test')

    let index = 0
    const testInterval = setInterval(() => {
      if (index >= testPages.length) {
        clearInterval(testInterval)
        addCacheLog('✅ Cache test completed')
        ElMessage.success('Cache test completed! Observe the changes in cache statistics')
        return
      }

      const page = testPages[index]
      addCacheLog(`📄 Test switch to page ${page}`)
      // Update request parameters
      requestParams.value = { ...requestParams.value, current: page }

      // Switch to test page
      handleCurrentChange(page!)
      index++
    }, 1000)
  }

  /**
   * Add cache debug log
   * @param message Log message
   */
  const addCacheLog = (message: string): void => {
    const timestamp = new Date().toLocaleTimeString()
    cacheDebugLogs.value.unshift(`[${timestamp}] ${message}`)
    if (cacheDebugLogs.value.length > 20) {
      cacheDebugLogs.value = cacheDebugLogs.value.slice(0, 20)
    }
  }

  /**
   * Update cache key list
   * @param key Cache key
   * @param operation Operation type
   */
  const updateCacheKeys = (key: string, operation: 'add' | 'remove' = 'add'): void => {
    if (operation === 'add' && !cacheKeys.value.includes(key)) {
      cacheKeys.value.push(key)
      addCacheLog(`Added cache key: ${getCacheKeySummary(key)}`)
    } else if (operation === 'remove') {
      const index = cacheKeys.value.indexOf(key)
      if (index > -1) {
        cacheKeys.value.splice(index, 1)
        addCacheLog(`Removed cache key: ${getCacheKeySummary(key)}`)
      }
    }
  }

  /**
   * Get cache key summary information
   * @param key Cache key
   * @returns Cache key summary
   */
  const getCacheKeySummary = (key: string): string => {
    try {
      const params = JSON.parse(key)
      return `Page: ${params.current || 1}, Size: ${params.size || 20}${
        params.name ? ', Name: ' + params.name : ''
      }${params.status ? ', Status: ' + params.status : ''}`
    } catch {
      return 'Invalid cache key'
    }
  }

  /**
   * Force refresh cache information
   */
  const forceRefreshCacheInfo = (): void => {
    const currentStats = cacheInfo.value
    addCacheLog(`Cache info refreshed: ${currentStats.total} cache entries`)

    if (currentStats.total === 0) {
      cacheKeys.value = []
    }

    nextTick(() => {
      console.log('Current cache statistics:', cacheInfo.value)
    })
  }

  // Watch pagination and search state changes
  watch(
    () => [pagination.current, pagination.size, searchFormState.value],
    ([current, size, search]) => {
      requestParams.value = {
        ...(search as any),
        current,
        size
      }
    },
    { deep: true, immediate: true }
  )

  /**
   * Handle dynamic column configuration commands
   */
  const handleColumnCommand = (command: string): void => {
    switch (command) {
      case 'addColumn': {
        // Add "Remark" column
        addColumn?.({
          prop: 'remark',
          label: 'Remark',
          width: 150,
          formatter: () => h('span', { style: 'color: #999' }, 'No remarks')
        })
        ElMessage.success('Added "Remark" column')
        break
      }

      case 'toggleColumn': {
        // Toggle gender column display/hide
        if (getColumnConfig?.('userPhone')) {
          toggleColumn?.('userPhone')
        }
        break
      }

      case 'removeColumn': {
        // Remove column
        removeColumn?.('status')
        // Support array mode
        // removeColumn?.(['status', 'score'])
        break
      }

      case 'reorderColumns': {
        // Exchange gender and phone column positions
        const allCols = getAllColumns?.()
        if (allCols) {
          const genderIndex = allCols.findIndex((col) => getColumnKey(col) === 'userGender')
          const phoneIndex = allCols.findIndex((col) => getColumnKey(col) === 'userPhone')

          if (genderIndex !== -1 && phoneIndex !== -1) {
            reorderColumns?.(genderIndex, phoneIndex)
            ElMessage.success('Exchanged gender and phone column positions')
          }
        }
        break
      }

      case 'updateColumn': {
        // Modify phone column title
        updateColumn?.('userPhone', {
          label: 'Contact Phone',
          width: 140
        })
        ElMessage.success('Phone column title updated to "Contact Phone"')
        break
      }

      case 'batchUpdate': {
        // Batch update data
        batchUpdateColumns?.([
          {
            prop: 'userGender',
            updates: { width: 200, label: 'Gender-update', sortable: false }
          },
          {
            prop: 'userPhone',
            updates: { width: 200, label: 'Phone-update', sortable: false }
          }
        ])
        break
      }

      case 'resetColumns': {
        // Reset all column configuration
        resetColumns?.()
        ElMessage.success('Reset all column configuration')
        break
      }

      default:
        console.warn('Unknown column configuration command:', command)
    }
  }
</script>

<!-- Advanced Table Capability Showcase -->
<!-- In actual development, choose which features to use based on requirements, refer to the minimal examples below the feature examples for development -->
<template>
  <div class="flex flex-col gap-4 pb-5">
    <!-- Feature introduction card -->
    <ElCard shadow="never">
      <template #header>
        <div class="flex-wrap gap-3 flex-cb">
          <h3 class="m-0">Advanced Table Complete Capability Showcase</h3>
          <div class="flex flex-wrap gap-2">
            <ElTag type="success" effect="light">Smart Cache</ElTag>
            <ElTag type="primary" effect="light">Debounce Search</ElTag>
            <ElTag type="warning" effect="light">Multiple Refresh</ElTag>
            <ElTag type="info" effect="light">Error Handling</ElTag>
          </div>
        </div>
      </template>
      <div>
        <p class="m-0 mb-4 leading-[1.6] text-g-700">
          Integrates search, refresh, fullscreen, size control, column display/hide, drag sorting,
          table style control, and built-in useTable composition function, providing powerful
          composition API, integrating data fetching, intelligent caching (LRU algorithm), multiple
          refresh strategies and other core features, comprehensively improving table development
          efficiency.
        </p>

        <!-- Debug panel -->
        <div class="my-4" v-if="showDebugPanel">
          <ElCollapse v-model="debugActiveNames">
            <ElCollapseItem name="cache" title="Cache Statistics & Demo">
              <div class="flex flex-col gap-2">
                <div class="flex-cb">
                  <span class="font-medium text-g-700">Cache Status:</span>
                  <ElTag type="success">Enabled</ElTag>
                </div>
                <div class="flex-cb">
                  <span class="font-medium text-g-700">Cache Count:</span>
                  <span class="font-semibold text-theme">{{ cacheInfo.total }}</span>
                </div>
                <div class="flex-cb">
                  <span class="font-medium text-g-700">Cache Size:</span>
                  <span class="font-semibold text-theme">{{ cacheInfo.size }}</span>
                </div>
                <div class="flex-cb">
                  <span class="font-medium text-g-700">Hit Info:</span>
                  <span class="font-semibold text-theme">{{ cacheInfo.hitRate }}</span>
                </div>

                <div class="flex gap-2 mt-2">
                  <ElButton size="small" @click="handleClearCache">Clear Cache</ElButton>
                  <ElButton size="small" @click="handleCleanExpiredCache"
                    >Clean Expired Cache</ElButton
                  >
                  <ElButton size="small" @click="handleTestCache">Test Cache</ElButton>
                  <ElButton size="small" @click="forceRefreshCacheInfo"
                    >Refresh Cache Info</ElButton
                  >
                </div>
              </div>
            </ElCollapseItem>
            <ElCollapseItem name="logs" title="Cache Logs">
              <div class="flex flex-col gap-2">
                <div class="max-h-50 overflow-y-auto">
                  <div v-if="cacheDebugLogs.length === 0" class="p-5 text-center">
                    <ElEmpty description="No cache logs yet" :image-size="60" />
                  </div>
                  <div v-else class="flex flex-col gap-1">
                    <div
                      v-for="(log, index) in cacheDebugLogs"
                      :key="index"
                      class="p-1.5 px-2 text-xs leading-[1.4] bg-g-200 border-l-1 border-g-400 rounded"
                      :class="{
                        'bg-[rgba(103,194,58,0.1)] !border-l-success': log.includes('✅'),
                        'bg-[rgba(64,158,255,0.1)] !border-l-theme': log.includes('🎯'),
                        'bg-[rgba(245,108,108,0.1)] !border-l-danger': log.includes('❌')
                      }"
                    >
                      {{ log }}
                    </div>
                  </div>
                </div>
                <div class="flex gap-2 mt-2">
                  <ElButton size="small" @click="cacheDebugLogs = []">Clear Logs</ElButton>
                </div>
              </div>
            </ElCollapseItem>
            <ElCollapseItem name="request" title="Request Status">
              <div class="flex flex-col gap-2">
                <div class="flex-cb">
                  <span class="font-medium text-g-700">Loading Status:</span>
                  <ElTag :type="loading ? 'warning' : 'success'">
                    {{ loading ? 'Loading' : 'Idle' }}
                  </ElTag>
                </div>
                <div class="flex-cb">
                  <span class="font-medium text-g-700">Data Status:</span>
                  <ElTag :type="hasData ? 'success' : 'info'">
                    {{ hasData ? `${data.length} records` : 'No data' }}
                  </ElTag>
                </div>
                <div class="flex-cb">
                  <span class="font-medium text-g-700">Error Status:</span>
                  <ElTag :type="error ? 'danger' : 'success'">
                    {{ error ? 'Has Errors' : 'Normal' }}
                  </ElTag>
                </div>
                <div class="flex flex-col gap-2">
                  <span class="font-medium text-g-700">Current Request Parameters:</span>
                  <ElText
                    tag="pre"
                    class="max-h-50 p-2 overflow-y-auto text-xs bg-g-200 border border-g-400 rounded-md"
                    >{{ JSON.stringify(requestParams, null, 2) }}</ElText
                  >
                </div>
                <div class="flex gap-2 mt-2">
                  <ElButton size="small" @click="handleCancelRequest">Cancel Request</ElButton>
                  <ElButton size="small" @click="handleClearData">Clear Data</ElButton>
                </div>
              </div>
            </ElCollapseItem>
          </ElCollapse>
        </div>

        <!-- Feature toggle -->
        <div class="flex flex-wrap gap-4 mt-4">
          <ElSwitch v-model="showDebugPanel" active-text="Debug Panel" />
          <ElText type="info" size="small">
            💡 Cache function is enabled, view detailed information through the debug panel
          </ElText>
        </div>
      </div>
    </ElCard>

    <!-- Search area -->
    <ArtSearchBar
      ref="searchBarRef"
      v-model="searchFormState"
      :items="searchItems"
      :rules="rules"
      :is-expand="false"
      :show-expand="true"
      :show-reset-button="true"
      :show-search-button="true"
      :disabled-search-button="false"
      @search="handleSearch"
      @reset="handleReset"
    />

    <!-- Table area -->
    <ElCard class="flex-1 art-table-card" shadow="never" style="margin-top: 0">
      <template #header>
        <div class="flex-cb">
          <h4 class="m-0">User Data Table</h4>
          <div class="flex gap-2">
            <ElTag v-if="error" type="danger">{{ error.message }}</ElTag>
            <ElTag v-else-if="loading" type="warning">Loading...</ElTag>
            <ElTag v-else type="success">{{ data.length }} records</ElTag>
          </div>
        </div>
      </template>

      <!-- Table toolbar -->
      <!-- fullClass property is used to set fullscreen area, if you need to set fullscreen area, please use this property -->
      <ArtTableHeader
        v-model:columns="columnChecks"
        :loading="loading"
        @refresh="handleRefresh"
        layout="refresh,size,fullscreen,columns,settings"
        fullClass="art-table-card"
      >
        <template #left>
          <ElButton type="primary" @click="handleAdd" v-ripple>
            <ElIcon>
              <Plus />
            </ElIcon>
            Add User
          </ElButton>

          <!-- Export import function -->
          <ArtExcelExport
            :data="data as any"
            :columns="exportColumns as any"
            filename="User Data"
            :auto-index="true"
            button-text="Export"
            @export-success="handleExportSuccess"
          />
          <ArtExcelImport
            @import-success="handleImportSuccess"
            @import-error="handleImportError"
            style="margin: 0 12px"
          />

          <ElButton @click="handleClearData" plain v-ripple> Clear Data </ElButton>

          <ElButton @click="handleBatchDelete" :disabled="selectedRows.length === 0" v-ripple>
            <ElIcon>
              <Delete />
            </ElIcon>
            Batch Delete ({{ selectedRows.length }})
          </ElButton>
          <!-- Dynamic column configuration demo button -->
          <ElDropdown @command="handleColumnCommand" style="margin-left: 10px">
            <ElButton type="primary" plain>
              Dynamic Update Table Columns
              <ElIcon class="el-icon--right">
                <ArrowDown />
              </ElIcon>
            </ElButton>
            <template #dropdown>
              <ElDropdownMenu>
                <ElDropdownItem command="addColumn">Add Column (Remark Column)</ElDropdownItem>
                <ElDropdownItem command="toggleColumn">Show/Hide (Phone Column)</ElDropdownItem>
                <ElDropdownItem command="removeColumn"
                  >Delete Column (Status Column)</ElDropdownItem
                >
                <ElDropdownItem command="reorderColumns"
                  >Exchange Column Positions (Gender, Phone)</ElDropdownItem
                >
                <ElDropdownItem command="updateColumn">Update Column (Phone Column)</ElDropdownItem>
                <ElDropdownItem command="batchUpdate">Batch Update (Gender, Phone)</ElDropdownItem>
                <ElDropdownItem command="resetColumns" divided
                  >Reset All Column Configuration</ElDropdownItem
                >
              </ElDropdownMenu>
            </template>
          </ElDropdown>
        </template>
      </ArtTableHeader>

      <ArtTable
        ref="tableRef"
        :loading="loading"
        :pagination="pagination"
        :data="data"
        :columns="columns"
        :height="computedTableHeight"
        empty-height="360px"
        @selection-change="handleSelectionChange"
        @row-click="handleRowClick"
        @header-click="handleHeaderClick"
        @sort-change="handleSortChange"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      >
        <!-- User info column -->
        <template #avatar="{ row }">
          <div class="flex gap-3 user-info">
            <ElAvatar :src="row.avatar" :size="40" />
            <div class="flex-1 min-w-0">
              <p class="m-0 overflow-hidden font-medium text-ellipsis whitespace-nowrap">
                {{ row.displayName }}
              </p>
              <p
                class="m-0 mt-1 overflow-hidden text-xs text-g-700 text-ellipsis whitespace-nowrap"
              >
                {{ new Date(row.createdAt).toLocaleDateString('en-US') }}
              </p>
            </div>
          </div>
        </template>

        <!-- Custom user info header -->
        <!-- <template #avatar-header="{ column }">
          <div class="flex-c gap-1">
            <span>{{ column.label }}</span>
            <ElTooltip content="Include avatar, name and email" placement="top">
              <ElIcon>
                <QuestionFilled />
              </ElIcon>
            </ElTooltip>
          </div>
        </template> -->
        <!-- RTP column -->
        <template #RTP="{ row }">
          <ElTag
            effect="plain"
            round
            :type="
              getUserRtpConfig(
                ((row.userBalance.totalWon / row.userBalance.totalWagered) * 100).toFixed(2)
              ).type
            "
          >
            {{ `${((row.userBalance.totalWon / row.userBalance.totalWagered) * 100).toFixed(2)}` }}
          </ElTag>
        </template>

        <!-- Status column -->
        <template #status="{ row }">
          <ElTag :type="getUserStatusConfig(row.status).type" effect="light">
            {{ getUserStatusConfig(row.status).text }}
          </ElTag>
        </template>

        <!-- Rating column -->
        <template #score="{ row }">
          <ElRate v-model="row.score" disabled size="small" />
        </template>

        <!-- Action column -->
        <template #operation="{ row }">
          <div class="flex justify-end">
            <ArtButtonTable type="view" :row="row" @click="handleView(row)" />
            <!-- <ArtButtonTable type="add" :row="row" @click="handleAdd()" />
            <ArtButtonTable type="edit" :row="row" @click="handleEdit(row)" />
            <ArtButtonTable type="delete" :row="row" @click="handleDelete(row)" /> -->
          </div>
        </template>

        <!-- Custom phone header -->
        <template #userPhone-header="{ column }">
          <ElPopover placement="bottom" :width="200" trigger="hover">
            <template #reference>
              <div class="inline-block gap-1 text-theme c-p custom-header">
                <span>{{ column.label }}</span>
                <ElIcon>
                  <Search />
                </ElIcon>
              </div>
            </template>
            <ElInput
              v-model="phoneSearch"
              placeholder="Search phone number"
              size="small"
              @input="handlePhoneSearch"
            >
              <template #prefix>
                <ElIcon>
                  <Search />
                </ElIcon>
              </template>
            </ElInput>
          </ElPopover>
        </template>
      </ArtTable>
    </ElCard>

    <!-- Advanced feature demo -->
    <ElCard shadow="never">
      <template #header>
        <h4 class="m-0">Advanced Feature Demo</h4>
      </template>
      <div class="flex flex-col gap-6">
        <!-- Event monitoring demo -->
        <div class="p-4 bg-g-200 border-full-d rounded-lg">
          <h5 class="m-0 mb-4 text-sm font-semibold">Event Monitoring Demo</h5>
          <div class="flex flex-wrap gap-2 mb-3 last:mb-0">
            <ElButton @click="toggleEventDemo" :type="eventDemoEnabled ? 'success' : 'primary'">
              {{ eventDemoEnabled ? 'Disable' : 'Enable' }} Event Monitoring
            </ElButton>
            <ElButton @click="clearEventLogs" v-if="eventDemoEnabled">Clear Logs</ElButton>
          </div>
          <div
            v-if="eventDemoEnabled && eventLogs.length > 0"
            class="p-3 mt-3 bg-g-200 border border-g-400 rounded-md"
          >
            <div class="flex-cb mb-2 font-medium text-g-700">
              <span>Recent Event Logs:</span>
              <ElTag size="small">{{ eventLogs.length }} records</ElTag>
            </div>
            <div class="flex flex-col gap-1 max-h-50 overflow-y-auto">
              <div
                v-for="(log, index) in eventLogs.slice(0, 20)"
                :key="index"
                class="flex-c gap-2 p-1.5 px-2 text-xs bg-g-300 border-l-1 border-g-400 rounded"
              >
                <ElTag :type="getEventType(log.type)" size="small">{{ log.type }}</ElTag>
                <span class="flex-1 text-g-700">{{ log.message }}</span>
                <span class="text-xs text-g-600">{{ log.time }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Table configuration demo -->
        <div class="p-4 bg-g-200 border-full-d rounded-lg">
          <h5 class="m-0 mb-4 text-sm font-semibold">Table Configuration Demo</h5>
          <div class="flex flex-wrap gap-2 mb-3 last:mb-0">
            <ElSwitch
              v-model="tableConfig.fixedHeight"
              active-text="Fixed Height (500px)"
              inactive-text="Auto Height"
              class="ml-2"
            />
          </div>
        </div>

        <!-- Custom function demo -->
        <div class="p-4 bg-g-200 border-full-d rounded-lg">
          <h5 class="m-0 mb-4 text-sm font-semibold">Custom Functions</h5>
          <div class="flex flex-wrap gap-2 mb-3 last:mb-0">
            <ElButton @click="handleScrollToTop">Scroll to Top</ElButton>
            <ElButton @click="handleScrollToPosition">Scroll to Position</ElButton>
            <ElButton @click="handleToggleSelection">Toggle Select All</ElButton>
            <ElButton @click="handleGetTableInfo">Get Table Info</ElButton>
          </div>
        </div>
      </div>
    </ElCard>

    <!-- Cache refresh strategy demo -->
    <ElCard shadow="never">
      <template #header>
        <h4 class="m-0">Cache Refresh Strategy Demo</h4>
      </template>
      <div class="flex flex-wrap gap-2 max-md:flex-col">
        <ElButton @click="refreshData" v-ripple>
          <ElIcon>
            <Refresh />
          </ElIcon>
          General Refresh
        </ElButton>
        <ElButton @click="refreshSoft" v-ripple>
          <ElIcon>
            <Refresh />
          </ElIcon>
          Soft Refresh
        </ElButton>
        <ElButton @click="refreshCreate" v-ripple>
          <ElIcon>
            <Plus />
          </ElIcon>
          Refresh After Create
        </ElButton>
        <ElButton @click="refreshUpdate" v-ripple>
          <ElIcon>
            <Edit />
          </ElIcon>
          Refresh After Edit
        </ElButton>
        <ElButton @click="refreshRemove" v-ripple>
          <ElIcon>
            <Delete />
          </ElIcon>
          Refresh After Delete
        </ElButton>
      </div>
    </ElCard>
  </div>
</template>

<style scoped>
  .user-info .el-avatar {
    flex-shrink: 0;
    width: 40px !important;
    height: 40px !important;
  }

  .user-info .el-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
  }

  .custom-header:hover {
    color: var(--el-color-primary-light-3);
  }

  .demo-group .config-toggles .el-switch {
    --el-switch-on-color: var(--el-color-primary);
  }

  .demo-group .performance-info .el-alert {
    --el-alert-padding: 12px;
  }
</style>

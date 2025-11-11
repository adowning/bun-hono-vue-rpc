<!-- Table Component -->
<!-- Supports: all el-table properties, events, slots, same as official documentation -->
<!-- Extended features: pagination component, custom column rendering, loading, table global border, zebra pattern, table size, header background configuration -->
<!-- Get ref: by default exposes elTableRef, external can call el-table methods through ref.value.elTableRef -->
<template>
  <div class="art-table" :class="{ 'is-empty': isEmpty }" :style="containerHeight">
    <ElTable
      ref="elTableRef"
      v-loading="!!loading"
      v-bind="{ ...$attrs, ...props, height, stripe, border, size, headerCellStyle }"
    >
      <template v-for="col in columns" :key="col.prop || col.type">
        <!-- Render global index column -->
        <ElTableColumn v-if="col.type === 'globalIndex'" v-bind="{ ...col }">
          <template #default="{ $index }">
            <span>{{ getGlobalIndex($index) }}</span>
          </template>
        </ElTableColumn>

        <!-- Render expand row -->
        <ElTableColumn v-else-if="col.type === 'expand'" v-bind="cleanColumnProps(col)">
          <template #default="{ row }">
            <component :is="col.formatter ? col.formatter(row) : null" />
          </template>
        </ElTableColumn>

        <!-- Render normal column -->
        <ElTableColumn v-else v-bind="cleanColumnProps(col)">
          <template v-if="col.useHeaderSlot && col.prop" #header="headerScope">
            <slot
              :name="col.headerSlotName || `${col.prop}-header`"
              v-bind="{ ...headerScope, prop: col.prop, label: col.label }"
            >
              {{ col.label }}
            </slot>
          </template>
          <template v-if="col.useSlot && col.prop" #default="slotScope">
            <slot
              :name="col.slotName || col.prop"
              v-bind="{
                ...slotScope,
                prop: col.prop,
                value: col.prop ? slotScope.row[col.prop] : undefined
              }"
            />
          </template>
        </ElTableColumn>
      </template>

      <template v-if="$slots.default" #default><slot /></template>

      <template #empty>
        <div v-if="loading"></div>
        <ElEmpty v-else :description="emptyText" :image-size="120" />
      </template>
    </ElTable>

    <div
      class="pagination custom-pagination"
      v-if="showPagination"
      :class="mergedPaginationOptions?.align"
      ref="paginationRef"
    >
      <ElPagination
        v-bind="mergedPaginationOptions"
        :total="pagination?.total"
        :disabled="loading"
        :page-size="pagination?.size"
        :current-page="pagination?.current"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, nextTick, onMounted, onUnmounted, watch } from 'vue'
  import type { ElTable, TableProps } from 'element-plus'
  import { storeToRefs } from 'pinia'
  import { ColumnOption } from '@/types'
  import { useTableStore } from '@/store/modules/table'
  import { useCommon } from '@/composables/useCommon'
  import { useElementSize, useWindowSize } from '@vueuse/core'

  defineOptions({ name: 'ArtTable' })

  const { width } = useWindowSize()
  const elTableRef = ref<InstanceType<typeof ElTable> | null>(null)
  const paginationRef = ref<HTMLElement>()
  const tableStore = useTableStore()
  const { isBorder, isZebra, tableSize, isFullScreen, isHeaderBackground } = storeToRefs(tableStore)

  // Dynamically calculate table header height
  const tableHeaderHeight = ref(0)

  // ResizeObserver for monitoring table header height changes
  let resizeObserver: ResizeObserver | null = null

  /** Pagination Configuration Interface */
  interface PaginationConfig {
    /** Current page number */
    current: number
    /** Number of items per page */
    size: number
    /** Total number of items */
    total: number
  }

  /** Pagination Options Interface */
  interface PaginationOptions {
    /** Options list for page size selector */
    pageSizes?: number[]
    /** Pagination alignment */
    align?: 'left' | 'center' | 'right'
    /** Pagination layout */
    layout?: string
    /** Whether to show pagination background */
    background?: boolean
    /** Whether to hide pagination when only one page */
    hideOnSinglePage?: boolean
    /** Pagination size */
    size?: 'small' | 'default' | 'large'
    /** Number of page numbers */
    pagerCount?: number
  }

  /** ArtTable Component Props Interface */
  interface ArtTableProps extends TableProps<Record<string, any>> {
    /** Loading state */
    loading?: boolean
    /** Column rendering configuration */
    columns?: ColumnOption[]
    /** Pagination state */
    pagination?: PaginationConfig
    /** Pagination configuration */
    paginationOptions?: PaginationOptions
    /** Table height for empty data */
    emptyHeight?: string
    /** Text to display when data is empty */
    emptyText?: string
    /** Whether to enable ArtTableHeader, solving table height auto-fit issue */
    showTableHeader?: boolean
  }

  const props = withDefaults(defineProps<ArtTableProps>(), {
    columns: () => [],
    fit: true,
    showHeader: true,
    stripe: undefined,
    border: undefined,
    size: undefined,
    emptyHeight: '100%',
    emptyText: 'No data yet',
    showTableHeader: true
  })

  const LAYOUT = {
    MOBILE: 'prev, pager, next, sizes, jumper, total',
    IPAD: 'prev, pager, next, jumper, total',
    DESKTOP: 'total, prev, pager, next, sizes, jumper'
  }

  const layout = computed(() => {
    if (width.value < 768) {
      return LAYOUT.MOBILE
    } else if (width.value < 1024) {
      return LAYOUT.IPAD
    } else {
      return LAYOUT.DESKTOP
    }
  })

  // Default pagination constants
  const DEFAULT_PAGINATION_OPTIONS: PaginationOptions = {
    pageSizes: [10, 20, 30, 50, 100],
    align: 'center',
    background: true,
    layout: layout.value,
    hideOnSinglePage: false,
    size: 'default',
    pagerCount: width.value > 1200 ? 7 : 5
  }

  // Merge pagination configuration
  const mergedPaginationOptions = computed(() => ({
    ...DEFAULT_PAGINATION_OPTIONS,
    ...props.paginationOptions
  }))

  // Border (priority: props > store)
  const border = computed(() => props.border ?? isBorder.value)
  // Zebra pattern
  const stripe = computed(() => props.stripe ?? isZebra.value)
  // Table size
  const size = computed(() => props.size ?? tableSize.value)
  // Whether data is empty
  const isEmpty = computed(() => props.data?.length === 0)

  const { height: paginationHeight } = useElementSize(paginationRef)

  // Container height calculation
  const containerHeight = computed(() => {
    let offset = 0
    if (!props.showTableHeader) {
      // When there's no table header, only consider pagination height
      offset = paginationHeight.value === 0 ? 0 : paginationHeight.value + PAGINATION_SPACING.value
    } else {
      // When there's a table header, dynamically calculate table header height + pagination height + spacing
      const headerHeight = tableHeaderHeight.value || DEFAULT_TABLE_HEADER_HEIGHT
      const paginationOffset =
        paginationHeight.value === 0 ? 0 : paginationHeight.value + PAGINATION_SPACING.value
      offset = headerHeight + paginationOffset + TABLE_HEADER_SPACING
    }
    return { height: offset === 0 ? '100%' : `calc(100% - ${offset}px)` }
  })

  // Table height logic
  const height = computed(() => {
    // In fullscreen mode, take up full screen
    if (isFullScreen.value) return '100%'
    // Fixed height when data is empty and not loading
    if (isEmpty.value && !props.loading) return props.emptyHeight
    // Use the passed height
    if (props.height) return props.height
    // Default to fill container height
    return '100%'
  })

  // Header background color style
  const headerCellStyle = computed(() => ({
    background: isHeaderBackground.value
      ? 'var(--el-fill-color-lighter)'
      : 'var(--default-box-color)',
    ...(props.headerCellStyle || {}) // Merge user-provided styles
  }))

  // Whether to show pagination
  const showPagination = computed(() => props.pagination && !isEmpty.value)

  // Clean column props, remove slot-related custom properties to ensure they won't be misinterpreted by ElTableColumn
  const cleanColumnProps = (col: ColumnOption) => {
    const columnProps = { ...col }
    // Delete custom slot control properties
    delete columnProps.useHeaderSlot
    delete columnProps.headerSlotName
    delete columnProps.useSlot
    delete columnProps.slotName
    return columnProps
  }

  // Page size change
  const handleSizeChange = (val: number) => {
    emit('pagination:size-change', val)
  }

  // Page current change
  const handleCurrentChange = (val: number) => {
    emit('pagination:current-change', val)
    scrollToTop() // Scroll to top of table after page number changes
  }

  // Scroll table content to top, and can also scroll page to top
  const scrollToTop = () => {
    nextTick(() => {
      elTableRef.value?.setScrollTop(0) // Scroll ElTable internal scrollbar to top
      useCommon().scrollToTop() // Call common composable to scroll page to top
    })
  }

  // Global index
  const getGlobalIndex = (index: number) => {
    if (!props.pagination) return index + 1
    const { current, size } = props.pagination
    return (current - 1) * size + index + 1
  }

  const emit = defineEmits<{
    (e: 'pagination:size-change', val: number): void
    (e: 'pagination:current-change', val: number): void
  }>()

  // Default table header height constant
  const DEFAULT_TABLE_HEADER_HEIGHT = 44
  // Spacing constant between pagination and table (computed property, responsive to showTableHeader changes)
  const PAGINATION_SPACING = computed(() => (props.showTableHeader ? 6 : 15))
  // Spacing constant between table header and table
  const TABLE_HEADER_SPACING = 12

  // Find and monitor table header height changes
  const observeTableHeader = () => {
    try {
      // Clean up previous listeners
      if (resizeObserver) {
        resizeObserver.disconnect()
        resizeObserver = null
      }

      // Return directly if table header doesn't need to be shown
      if (!props.showTableHeader) {
        tableHeaderHeight.value = 0
        return
      }

      // Find table header element
      const tableHeader = document.getElementById('art-table-header') as HTMLElement
      if (!tableHeader) {
        // If table header not found, use default height
        tableHeaderHeight.value = DEFAULT_TABLE_HEADER_HEIGHT
        return
      }

      // Initialize height
      tableHeaderHeight.value = tableHeader.offsetHeight

      // Create ResizeObserver to monitor height changes
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.target === tableHeader) {
            tableHeaderHeight.value = entry.contentRect.height
          }
        }
      })

      resizeObserver.observe(tableHeader)
    } catch (error) {
      console.warn('Failed to monitor table header height:', error)
      // Use default height on error
      tableHeaderHeight.value = DEFAULT_TABLE_HEADER_HEIGHT
    }
  }

  // Find table header after component is mounted
  onMounted(() => {
    nextTick(() => {
      observeTableHeader()
    })
  })

  // Watch for data changes and table header display state changes, re-observe table header
  watch(
    [() => props.data, () => props.showTableHeader],
    () => {
      nextTick(() => {
        observeTableHeader()
      })
    },
    { flush: 'post' }
  )

  // Clean up ResizeObserver when component is unmounted
  onUnmounted(() => {
    if (resizeObserver) {
      resizeObserver.disconnect()
      resizeObserver = null
    }
  })

  defineExpose({
    scrollToTop,
    elTableRef
  })
</script>

<style lang="scss" scoped>
  @use './style';
</style>

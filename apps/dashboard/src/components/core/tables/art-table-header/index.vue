<!-- Table Header, containing table size, refresh, fullscreen, column settings, other settings -->
<template>
  <div class="flex-cb" id="art-table-header">
    <div class="flex-wrap">
      <slot name="left"></slot>
    </div>

    <div class="flex-c md:justify-end">
      <div
        v-if="showSearchBar != null"
        class="button"
        @click="search"
        :class="showSearchBar ? 'active !bg-theme hover:!bg-theme/80' : ''"
      >
        <ArtSvgIcon icon="ri:search-line" :class="showSearchBar ? 'text-white' : 'text-g-700'" />
      </div>
      <div
        v-if="shouldShow('refresh')"
        class="button"
        @click="refresh"
        :class="{ loading: loading && isManualRefresh }"
      >
        <ArtSvgIcon
          icon="ri:refresh-line"
          :class="loading && isManualRefresh ? 'animate-spin text-g-600' : ''"
        />
      </div>

      <ElDropdown v-if="shouldShow('size')" @command="handleTableSizeChange">
        <div class="button">
          <ArtSvgIcon icon="ri:arrow-up-down-fill" />
        </div>
        <template #dropdown>
          <ElDropdownMenu>
            <div
              v-for="item in tableSizeOptions"
              :key="item.value"
              class="table-size-btn-item [&_.el-dropdown-menu__item]:!mb-[3px] last:[&_.el-dropdown-menu__item]:!mb-0"
            >
              <ElDropdownItem
                :key="item.value"
                :command="item.value"
                :class="tableSize === item.value ? '!bg-g-300/55' : ''"
              >
                {{ item.label }}
              </ElDropdownItem>
            </div>
          </ElDropdownMenu>
        </template>
      </ElDropdown>

      <div v-if="shouldShow('fullscreen')" class="button" @click="toggleFullScreen">
        <ArtSvgIcon :icon="isFullScreen ? 'ri:fullscreen-exit-line' : 'ri:fullscreen-line'" />
      </div>

      <!-- Column settings -->
      <ElPopover v-if="shouldShow('columns')" placement="bottom" trigger="click">
        <template #reference>
          <div class="button">
            <ArtSvgIcon icon="ri:align-right" />
          </div>
        </template>
        <div>
          <VueDraggable
            v-model="columns"
            :disabled="false"
            filter=".fixed-column"
            :prevent-on-filter="false"
            @move="checkColumnMove"
          >
            <div
              v-for="item in columns"
              :key="item.prop || item.type"
              class="column-option flex-c"
              :class="{ 'fixed-column': item.fixed }"
            >
              <div
                class="drag-icon mr-2 h-4.5 flex-cc text-g-500"
                :class="item.fixed ? 'cursor-default text-g-300' : 'cursor-move'"
              >
                <ArtSvgIcon
                  :icon="item.fixed ? 'ri:unpin-line' : 'ri:drag-move-2-fill'"
                  class="text-base"
                />
              </div>
              <ElCheckbox
                v-model="item.checked"
                :disabled="item.disabled"
                class="flex-1 min-w-0 [&_.el-checkbox__label]:overflow-hidden [&_.el-checkbox__label]:text-ellipsis [&_.el-checkbox__label]:whitespace-nowrap"
                >{{
                  item.label || (item.type === 'selection' ? t('table.selection') : '')
                }}</ElCheckbox
              >
            </div>
          </VueDraggable>
        </div>
      </ElPopover>
      <!-- Other settings -->
      <ElPopover v-if="shouldShow('settings')" placement="bottom" trigger="click">
        <template #reference>
          <div class="button">
            <ArtSvgIcon icon="ri:settings-line" />
          </div>
        </template>
        <div>
          <ElCheckbox v-if="showZebra" v-model="isZebra" :value="true">{{
            t('table.zebra')
          }}</ElCheckbox>
          <ElCheckbox v-if="showBorder" v-model="isBorder" :value="true">{{
            t('table.border')
          }}</ElCheckbox>
          <ElCheckbox v-if="showHeaderBackground" v-model="isHeaderBackground" :value="true">{{
            t('table.headerBackground')
          }}</ElCheckbox>
        </div>
      </ElPopover>
      <slot name="right"></slot>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { computed, ref, onMounted, onUnmounted } from 'vue'
  import { storeToRefs } from 'pinia'
  import { TableSizeEnum } from '@/enums/formEnum'
  import { useTableStore } from '@/store/modules/table'
  import { VueDraggable } from 'vue-draggable-plus'
  import { useI18n } from 'vue-i18n'
  import type { ColumnOption } from '@/types/component'

  defineOptions({ name: 'ArtTableHeader' })

  const { t } = useI18n()

  interface Props {
    /** Zebra pattern */
    showZebra?: boolean
    /** Border */
    showBorder?: boolean
    /** Header background */
    showHeaderBackground?: boolean
    /** Fullscreen class */
    fullClass?: string
    /** Component layout, child component names separated by commas */
    layout?: string
    /** Loading */
    loading?: boolean
    /** Search bar display state */
    showSearchBar?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    showZebra: true,
    showBorder: true,
    showHeaderBackground: true,
    fullClass: 'art-page-view',
    layout: 'search,refresh,size,fullscreen,columns,settings',
    showSearchBar: undefined
  })

  const columns = defineModel<ColumnOption[]>('columns', {
    required: false,
    default: () => []
  })

  const emit = defineEmits<{
    (e: 'refresh'): void
    (e: 'search'): void
    (e: 'update:showSearchBar', value: boolean): void
  }>()

  /** Table size options configuration */
  const tableSizeOptions = [
    { value: TableSizeEnum.SMALL, label: t('table.sizeOptions.small') },
    { value: TableSizeEnum.DEFAULT, label: t('table.sizeOptions.default') },
    { value: TableSizeEnum.LARGE, label: t('table.sizeOptions.large') }
  ]

  const tableStore = useTableStore()
  const { tableSize, isZebra, isBorder, isHeaderBackground } = storeToRefs(tableStore)

  /** Parse layout attribute, convert to array */
  const layoutItems = computed(() => {
    return props.layout.split(',').map((item) => item.trim())
  })

  /**
   * Check if component should be shown
   * @param componentName Component name
   * @returns Whether to show
   */
  const shouldShow = (componentName: string) => {
    return layoutItems.value.includes(componentName)
  }

  /**
   * Drag move event handler - prevent fixed column position changes
   * @param evt move event object
   * @returns Whether to allow movement
   */
  const checkColumnMove = (event: any) => {
    // Target DOM element that drag enters
    const toElement = event.related as HTMLElement
    // If target position is fixed column, don't allow movement
    if (toElement && toElement.classList.contains('fixed-column')) {
      return false
    }
    return true
  }

  /** Search event handler */
  const search = () => {
    // Toggle search bar display state
    emit('update:showSearchBar', !props.showSearchBar)
    emit('search')
  }

  /** Refresh event handler */
  const refresh = () => {
    isManualRefresh.value = true
    emit('refresh')
  }

  /**
   * Table size change handler
   * @param command Table size enum value
   */
  const handleTableSizeChange = (command: TableSizeEnum) => {
    useTableStore().setTableSize(command)
  }

  /** Whether manually clicked refresh */
  const isManualRefresh = ref(false)

  /** Loading */
  const isFullScreen = ref(false)

  /** Save original overflow style for restoration when exiting fullscreen */
  const originalOverflow = ref('')

  /**
   * Toggle fullscreen state
   * When entering fullscreen, hide page scrollbar, restore original state when exiting
   */
  const toggleFullScreen = () => {
    const el = document.querySelector(`.${props.fullClass}`)
    if (!el) return

    isFullScreen.value = !isFullScreen.value

    if (isFullScreen.value) {
      // Enter fullscreen: save original style and hide scrollbar
      originalOverflow.value = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      el.classList.add('el-full-screen')
      tableStore.setIsFullScreen(true)
    } else {
      // Exit fullscreen: restore original style
      document.body.style.overflow = originalOverflow.value
      el.classList.remove('el-full-screen')
      tableStore.setIsFullScreen(false)
    }
  }

  /**
   * ESC key exit fullscreen event handler
   * Need to save reference to properly remove listener when component is unmounted
   */
  const handleEscapeKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isFullScreen.value) {
      toggleFullScreen()
    }
  }

  /** Register global event listener when component is mounted */
  onMounted(() => {
    document.addEventListener('keydown', handleEscapeKey)
  })

  /** Clean up resources when component is unmounted */
  onUnmounted(() => {
    // Remove event listener
    document.removeEventListener('keydown', handleEscapeKey)

    // If component is unmounted while in fullscreen state, restore page scroll state
    if (isFullScreen.value) {
      document.body.style.overflow = originalOverflow.value
      const el = document.querySelector(`.${props.fullClass}`)
      if (el) {
        el.classList.remove('el-full-screen')
      }
    }
  })
</script>

<style scoped>
  @reference '@styles/tailwind.css';

  .button {
    @apply ml-2 
    size-8 
    flex 
    items-center 
    justify-center 
    cursor-pointer 
    rounded-md 
    bg-g-300/55 
    text-g-700  
    hover:bg-g-300 
    md:ml-0 
    md:mr-2.5;
  }
</style>

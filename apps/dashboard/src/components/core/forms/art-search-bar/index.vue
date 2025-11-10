<!-- Table search component -->
<!-- Supports common form components, custom components, slots, validation, hidden form items -->
<!-- Same syntax as ElementPlus official documentation components, just write attributes in props -->
<template>
  <section
    class="art-card-xs px-5 pb-0 pt-3.5 md:px-5 md:pt-3.5"
    :class="{ 'is-expanded': isExpanded }"
  >
    <ElForm
      ref="formRef"
      :model="modelValue"
      :label-position="labelPosition"
      v-bind="{ ...$attrs }"
    >
      <ElRow class="flex flex-wrap" :gutter="gutter">
        <ElCol
          v-for="item in visibleFormItems"
          :key="item.key"
          :xs="24"
          :sm="12"
          :md="8"
          :lg="item.span || span"
          :xl="item.span || span"
        >
          <ElFormItem
            :label="item.label"
            :prop="item.key"
            :label-width="item.label ? item.labelWidth || labelWidth : undefined"
          >
            <slot :name="item.key" :item="item" :modelValue="modelValue">
              <component
                :is="getComponent(item)"
                v-model="modelValue[item.key]"
                v-bind="getProps(item)"
              >
                <!-- Dropdown select -->
                <template v-if="item.type === 'select' && getProps(item)?.options">
                  <ElOption
                    v-for="option in getProps(item).options"
                    v-bind="option"
                    :key="option.value"
                  />
                </template>

                <!-- Checkbox group -->
                <template v-if="item.type === 'checkboxgroup' && getProps(item)?.options">
                  <ElCheckbox
                    v-for="option in getProps(item).options"
                    v-bind="option"
                    :key="option.value"
                  />
                </template>

                <!-- Radio group -->
                <template v-if="item.type === 'radiogroup' && getProps(item)?.options">
                  <ElRadio
                    v-for="option in getProps(item).options"
                    v-bind="option"
                    :key="option.value"
                  />
                </template>

                <!-- Dynamic slot support -->
                <template v-for="(slotFn, slotName) in getSlots(item)" :key="slotName" #[slotName]>
                  <component :is="slotFn" />
                </template>
              </component>
            </slot>
          </ElFormItem>
        </ElCol>
        <ElCol :xs="24" :sm="24" :md="span" :lg="span" :xl="span" class="max-w-full flex-1">
          <div
            class="mb-3 flex flex-wrap items-center justify-end md:flex-row md:items-stretch md:gap-2"
            :style="actionButtonsStyle"
          >
            <div class="flex gap-2 md:justify-center">
              <ElButton v-if="showReset" class="reset-button" @click="handleReset" v-ripple>
                {{ t('table.searchBar.reset') }}
              </ElButton>
              <ElButton
                v-if="showSearch"
                type="primary"
                class="search-button"
                @click="handleSearch"
                v-ripple
                :disabled="disabledSearch"
              >
                {{ t('table.searchBar.search') }}
              </ElButton>
            </div>
            <div
              v-if="shouldShowExpandToggle"
              class="ml-2.5 c-p flex-c leading-8 text-theme tad-200 hover:text-black md:ml-0 md:justify-center"
              @click="toggleExpand"
            >
              <span class="select-none text-sm">{{ expandToggleText }}</span>
              <div class="ml-1 flex-c text-sm transition-transform duration-200 ease-in-out">
                <ElIcon>
                  <ArrowUpBold v-if="isExpanded" />
                  <ArrowDownBold v-else />
                </ElIcon>
              </div>
            </div>
          </div>
        </ElCol>
      </ElRow>
    </ElForm>
  </section>
</template>

<script setup lang="ts">
  import { ArrowUpBold, ArrowDownBold } from '@element-plus/icons-vue'
  import { useWindowSize } from '@vueuse/core'
  import { useI18n } from 'vue-i18n'
  import {
    ElCascader,
    ElCheckbox,
    ElCheckboxGroup,
    ElDatePicker,
    ElInput,
    ElInputNumber,
    ElRadioGroup,
    ElRate,
    ElSelect,
    ElSlider,
    ElSwitch,
    ElTimePicker,
    ElTimeSelect,
    ElTreeSelect,
    type FormInstance
  } from 'element-plus'

  defineOptions({ name: 'ArtSearchBar' })

  const componentMap = {
    input: ElInput, // Input field
    number: ElInputNumber, // Number input field
    select: ElSelect, // Selector
    switch: ElSwitch, // Switch
    checkbox: ElCheckbox, // Checkbox
    checkboxgroup: ElCheckboxGroup, // Checkbox group
    radiogroup: ElRadioGroup, // Radio group
    date: ElDatePicker, // Date picker
    daterange: ElDatePicker, // Date range picker
    datetime: ElDatePicker, // Date time picker
    datetimerange: ElDatePicker, // Date time range picker
    rate: ElRate, // Rating
    slider: ElSlider, // Slider
    cascader: ElCascader, // Cascader selector
    timepicker: ElTimePicker, // Time picker
    timeselect: ElTimeSelect, // Time select
    treeselect: ElTreeSelect // Tree selector
  }

  const { width } = useWindowSize()
  const { t } = useI18n()
  const isMobile = computed(() => width.value < 500)

  const formInstance = useTemplateRef<FormInstance>('formRef')

  // Form item configuration
  export interface SearchFormItem {
    /** Unique identifier for the form item */
    key: string
    /** Label text for the form item */
    label: string
    /** Width of the form item label, overrides Form's labelWidth */
    labelWidth?: string | number
    /** Type of the form item, can be predefined string type or custom component */
    type: keyof typeof componentMap | string | (() => VNode)
    /** Whether to hide this form item */
    hidden?: boolean
    /** Column width occupied by the form item, based on 24-column grid system */
    span?: number
    /** Option data, used for select, checkbox-group, radio-group, etc. */
    options?: Record<string, any>
    /** Properties passed to the form item component */
    props?: Record<string, any>
    /** Slot configuration for the form item */
    slots?: Record<string, (() => any) | undefined>
    /** Placeholder text for the form item */
    placeholder?: string
    /** For more property configuration, please refer to ElementPlus official documentation */
  }

  // Form configuration
  interface SearchBarProps {
    /** Form data */
    items: SearchFormItem[]
    /** Width of each column (based on 24-column layout) */
    span?: number
    /** Spacing between form controls */
    gutter?: number
    /** Expand/collapse */
    isExpand?: boolean
    /** Default expansion state (only takes effect when showExpand is true and isExpand is false) */
    defaultExpanded?: boolean
    /** Position of form field labels */
    labelPosition?: 'left' | 'right' | 'top'
    /** Text width */
    labelWidth?: string | number
    /** Whether to show expand/collapse */
    showExpand?: boolean
    /** Button left alignment limit (when form items are less than or equal to this value) */
    buttonLeftLimit?: number
    /** Whether to show reset button */
    showReset?: boolean
    /** Whether to show search button */
    showSearch?: boolean
    /** Whether to disable search button */
    disabledSearch?: boolean
  }

  const props = withDefaults(defineProps<SearchBarProps>(), {
    items: () => [],
    span: 6,
    gutter: 12,
    isExpand: false,
    labelPosition: 'right',
    labelWidth: '70px',
    showExpand: true,
    defaultExpanded: false,
    buttonLeftLimit: 2,
    showReset: true,
    showSearch: true,
    disabledSearch: false
  })

  interface SearchBarEmits {
    reset: []
    search: []
  }

  const emit = defineEmits<SearchBarEmits>()

  const modelValue = defineModel<Record<string, any>>({ default: {} })

  /**
   * Expand state
   */
  const isExpanded = ref(props.defaultExpanded)

  const rootProps = ['label', 'labelWidth', 'key', 'type', 'hidden', 'span', 'slots']

  const getProps = (item: SearchFormItem) => {
    if (item.props) return item.props
    const props = { ...item }
    rootProps.forEach((key) => delete (props as Record<string, any>)[key])
    return props
  }

  // Get slots
  const getSlots = (item: SearchFormItem) => {
    if (!item.slots) return {}
    const validSlots: Record<string, () => any> = {}
    Object.entries(item.slots).forEach(([key, slotFn]) => {
      if (slotFn) {
        validSlots[key] = slotFn
      }
    })
    return validSlots
  }

  // Component
  const getComponent = (item: SearchFormItem) => {
    const { type } = item
    if (type && typeof item.type !== 'string') return type
    // If type is not passed, default to input
    return componentMap[type as keyof typeof componentMap] || componentMap['input']
  }

  /**
   * Visible form items
   */
  const visibleFormItems = computed(() => {
    const filteredItems = props.items.filter((item) => !item.hidden)
    const shouldShowLess = !props.isExpand && !isExpanded.value
    if (shouldShowLess) {
      const maxItemsPerRow = Math.floor(24 / props.span) - 1
      return filteredItems.slice(0, maxItemsPerRow)
    }
    return filteredItems
  })

  /**
   * Whether to show expand/collapse button
   */
  const shouldShowExpandToggle = computed(() => {
    const filteredItems = props.items.filter((item) => !item.hidden)
    return (
      !props.isExpand && props.showExpand && filteredItems.length > Math.floor(24 / props.span) - 1
    )
  })

  /**
   * Expand/collapse button text
   */
  const expandToggleText = computed(() => {
    return isExpanded.value ? t('table.searchBar.collapse') : t('table.searchBar.expand')
  })

  /**
   * Action button style
   */
  const actionButtonsStyle = computed(() => ({
    'justify-content': isMobile.value
      ? 'flex-end'
      : props.items.filter((item) => !item.hidden).length <= props.buttonLeftLimit
        ? 'flex-start'
        : 'flex-end'
  }))

  /**
   * Toggle expand/collapse state
   */
  const toggleExpand = () => {
    isExpanded.value = !isExpanded.value
  }

  /**
   * Handle reset event
   */
  const handleReset = () => {
    // Reset form fields (UI layer)
    formInstance.value?.resetFields()

    // Clear all form item values (including hidden items)
    Object.assign(
      modelValue.value,
      Object.fromEntries(props.items.map(({ key }) => [key, undefined]))
    )

    // Trigger reset event
    emit('reset')
  }

  /**
   * Handle search event
   */
  const handleSearch = () => {
    emit('search')
  }

  defineExpose({
    ref: formInstance,
    validate: (...args: any[]) => formInstance.value?.validate(...args),
    reset: handleReset
  })

  // Destructure props for direct use in template
  const { span, gutter, labelPosition, labelWidth } = toRefs(props)
</script>
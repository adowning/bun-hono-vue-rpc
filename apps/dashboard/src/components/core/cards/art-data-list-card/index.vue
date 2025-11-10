<!-- 数据列表卡片 -->
<template>
  <div class="art-card p-5">
    <div class="pb-3.5">
      <p class="text-lg font-medium">{{ title }}</p>
      <p class="text-sm text-g-600">{{ subtitle }}</p>
    </div>
    <ElScrollbar :style="{ height: maxHeight }">
      <div v-for="(item, index) in data" :key="index" class="flex-c py-3">
        <img
          class="size-12.5 object-cover rounded-md"
          :src="`https://gameui.cashflowcasino.com/public/avatars/avatar-${index + 1}.webp`"
        />
        <!-- <div v-if="item.icon" class="flex-cc mr-3 size-10 rounded-lg" :class="item.class">
          <ArtSvgIcon :icon="item.icon" class="text-xl" />
        </div> -->
        <div class="flex-1 ml-1">
          <div class="mb-1 text-sm">{{ item.user }}</div>

          <div class="text-xs text-g-500">{{ new Date(item.timestamp).toDateString() }}</div>
        </div>
        <!-- <div class="flex-col"> -->
        <div
          class="flex-cc flex-col size-12 rounded-lg"
          :class="item.type == 'DEPOSIT' ? 'bg-success/12' : 'bg-error/12'"
        >
          <ArtSvgIcon
            class="size-12 pt-1"
            :icon="item.type === 'DEPOSIT' ? 'ph:hand-deposit' : 'hugeicons:reverse-withdrawal-01'"
          />
          <div class="mb-1 text-sm">{{ item.amount }}</div>
          <!-- </div> -->
        </div>
        <!-- <div class="ml-3 text-xs text-g-500">{{ item.status }}</div> -->
      </div>
    </ElScrollbar>
    <ElButton
      class="mt-[25px] w-full text-center"
      v-if="showMoreButton"
      v-ripple
      @click="handleMore"
      >查看更多</ElButton
    >
  </div>
</template>

<script setup lang="ts">
  defineOptions({ name: 'ArtDataListCard' })

  /**
   * Activity data interface
   */

  const ITEM_HEIGHT = 66

  const props = withDefaults(
    defineProps<{
      title: string
      data: any[]
    }>(),
    {
      // showActivity: true // Default to true for "Recent Activities"
    }
  )
  const maxHeight = computed(() => `${ITEM_HEIGHT * props.maxCount}px`)

  const emit = defineEmits<{
    /** 点击更多按钮事件 */
    (e: 'more'): void
  }>()

  const handleMore = () => emit('more')
</script>

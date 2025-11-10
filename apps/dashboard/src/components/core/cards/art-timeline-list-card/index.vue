<!-- 时间轴列表卡片 -->
<template>
  <div class="art-card p-5">
    <div class="pb-3.5">
      <p class="text-lg font-medium">{{ title }}</p>
      <p class="text-sm text-g-600">{{ subtitle }}</p>
    </div>
    <ElScrollbar :style="{ height: maxHeight }">
      <ElTimeline class="!pl-0.5">
        <ElTimelineItem
          v-for="item in list"
          :key="item.time"
          :timestamp="new Date(item.time).toLocaleString()"
          :placement="TIMELINE_PLACEMENT"
          :color="item.deposit > 0 ? '#30bd9f' : '#5479e6'"
          :center="true"
        >
          <!-- <div class="flex-c gap-3 space-y-5"> -->
          <!-- <div class="flex-c gap-2"> -->
          <!-- <div class="w-full p-0 m-0" body-style="padding: 8px"> -->
          <!-- <el-card class="flex-c gap-2"> -->
          <div class="flex-c w-full gap-2 text-xs"
            >{{ item.username }} deposit: ${{ item.deposit }} bonus: {{ item.bonus }} bets:
            {{ item.bets }}
          </div>
          <p> </p>
          <!-- </el-card> -->
          <!-- </div> -->
        </ElTimelineItem>
      </ElTimeline>
    </ElScrollbar>
  </div>
</template>

<script setup lang="ts">
  defineOptions({ name: 'ArtTimelineListCard' })

  // 常量配置
  const ITEM_HEIGHT = 65
  const TIMELINE_PLACEMENT = 'top'
  const DEFAULT_MAX_COUNT = 5

  interface TimelineItem {
    /** 时间 */
    username: string
    /** 状态颜色 */
    img: string
    /** 内容 */
    deposit: number
    /** 代码标识 */
    bonus?: number
    bets?: number
    balance?: number
    time?: string
  }

  interface Props {
    /** 时间轴列表数据 */
    list: TimelineItem[]
    /** 标题 */
    title: string
    /** 副标题 */
    subtitle?: string
    /** 最大显示数量 */
    maxCount?: number
  }

  // Props 定义和验证
  const props = withDefaults(defineProps<Props>(), {
    title: '',
    subtitle: '',
    maxCount: DEFAULT_MAX_COUNT
  })

  // 计算最大高度
  const maxHeight = computed(() => `${ITEM_HEIGHT * props.maxCount}px`)
</script>

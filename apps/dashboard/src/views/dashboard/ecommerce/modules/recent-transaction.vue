<template>
  <art-data-list-card :title="title" :data="data">
    <template #item="{ item }">
      <div class="recent-transaction-item">
        <div class="recent-transaction-item__left">
          <el-avatar :size="40" class="mr-3">
            {{ getAvatarText(item.user) }}
          </el-avatar>
          <div>
            <div class="font-medium">{{ item.user }}</div>
            <div v-if="showActivity" class="text-xs text-tx-secondary">
              {{ item.description }}
            </div>
            <div v-else class="text-xs text-tx-secondary">
              {{ item.type }}
            </div>
          </div>
        </div>
        <div class="recent-transaction-item__right">
          <div v-if="!showActivity" class="font-medium">
            {{ formatAmount(item.amount, item.type) }}
          </div>
          <div v-if="showActivity" class="text-xs text-tx-secondary">
            {{ formatTimestamp(item.timestamp) }}
          </div>
          <el-tag :type="getStatusType(item.status)" size="small" class="mt-1">
            {{ item.status }}
          </el-tag>
        </div>
      </div>
    </template>
  </art-data-list-card>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { format, formatDistanceToNow } from 'date-fns'

  const props = withDefaults(
    defineProps<{
      title: string
      data: any[]
      showActivity?: boolean // Our new prop
    }>(),
    {
      showActivity: true // Default to true for "Recent Activities"
    }
  )

  const getAvatarText = (name: string) => {
    return name ? name.substring(0, 2).toUpperCase() : 'NA'
  }

  const getStatusType = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'success'
      case 'PENDING':
        return 'warning'
      case 'FAILED':
        return 'danger'
      default:
        return 'info'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
  }

  const formatAmount = (amount: number, type: string) => {
    const sign = type === 'DEPOSIT' ? '+' : '-'
    return `${sign}$${amount.toFixed(2)}`
  }
</script>

<style scoped lang="scss">
  .recent-transaction-item {
    display: flex;
    justify-content: space-between;
    align-items: center;

    &__left {
      display: flex;
      align-items: center;
    }

    &__right {
      text-align: right;
    }
  }
</style>

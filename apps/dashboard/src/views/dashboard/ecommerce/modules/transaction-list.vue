<template>
  <ArtDataListCard
    class="mb-5"
    :maxCount="4"
    :data="data"
    title="Recent Activities"
    subtitle="Order Processing Status"
    :showMoreButton="true"
    @more="handleMore"
  />
</template>

<script setup lang="ts">
  // interface TransactionItem {
  //   title: string
  //   status: string
  //   time: string
  //   class: string
  //   icon: string
  // }
  withDefaults(
    defineProps<{
      title: string
      data: any[]
    }>(),
    {
      // showActivity: true // Default to true for "Recent Activities"
    }
  )
  /**
   * Handle view more button click event
   */
  const handleMore = (): void => {
    // TODO: Add view more logic
  }
</script>

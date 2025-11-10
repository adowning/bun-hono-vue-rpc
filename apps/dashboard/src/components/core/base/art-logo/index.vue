<!-- 系统logo -->
<template>
  <div class="flex-cc">
    <img :style="logoStyle" src="/images/logo.png" alt="logo" class="w-full h-full" />
  </div>
</template>

<script setup lang="ts">
  defineOptions({ name: 'ArtLogo' })

  interface Props {
    /** logo 大小 */
    size?: number | string
  }

  const props = withDefaults(defineProps<Props>(), {
    size: 58
  })

  const logoStyle = computed(() => ({ width: `${props.size}px` }))
</script>

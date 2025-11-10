<!-- eslint-disable vue/no-mutating-props -->
<template>
  <el-form :model="searchForm" inline>
    <el-form-item label="Display Name">
      <el-input v-model="searchForm.displayName" placeholder="Enter display name" />
    </el-form-item>
    <el-form-item label="Email">
      <el-input v-model="searchForm.email" placeholder="Enter email" />
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
  defineProps<{
    searchForm: {
      displayName: string
      email: string
    }
  }>()
</script>

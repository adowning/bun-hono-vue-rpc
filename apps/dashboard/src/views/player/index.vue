<template>
  <div class="player-list-view">
    <art-table-header
      v-model:search-form="searchForm"
      :search-items="searchItems"
      @search="handleSearch"
      @reset="handleReset"
    >
      <player-search :search-form="searchForm" />
    </art-table-header>

    <art-table
      :data="tableData"
      :columns="tableColumns"
      :loading="loading"
      @row-click="handleRowClick"
      class="cursor-pointer"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  // import { ArtTableHeader, ArtTable } from '@/components/core/tables'
  import PlayerSearch from './modules/player-search.vue'
  // import PlayerDialog from './modules/player-dialog.vue' // No longer used for edits
  import { format, formatDistanceToNow } from 'date-fns'

  const router = useRouter()

  // Search form
  const searchForm = ref({
    displayName: '',
    email: ''
  })
  const searchItems = ref([
    { label: 'Display Name', prop: 'displayName', component: 'el-input' },
    { label: 'Email', prop: 'email', component: 'el-input' }
  ])

  // Table
  const loading = ref(true)
  const tableData = ref<any[]>([])
  const tableColumns = ref([
    { label: 'ID', prop: 'id' },
    { label: 'Display Name', prop: 'displayName' },
    { label: 'Email', prop: 'email' },
    {
      label: 'Total GGR',
      prop: 'totalGGR',
      formatter: (row: any) => `$${row.totalGGR.toFixed(2)}`
    },
    {
      label: 'Total Deposits',
      prop: 'totalDeposits',
      formatter: (row: any) => `$${row.totalDeposits.toFixed(2)}`
    },
    {
      label: 'Status',
      prop: 'status',
      component: 'el-tag',
      props: (row: any) => ({
        type: row.status === 'ACTIVE' ? 'success' : 'danger'
      })
    },
    {
      label: 'Join Date',
      prop: 'joinDate',
      formatter: (row: any) => formatDistanceToNow(new Date(row.joinDate), { addSuffix: true })
    }
  ])

  // --- REMOVED DIALOG LOGIC ---
  // const dialogVisible = ref(false)
  // const dialogType = ref('add')
  // const selectedRow = ref(null)

  // Fetch mock data
  const fetchData = async () => {
    loading.value = true
    try {
      const response = await fetch('/mock/players.json')
      if (!response.ok) throw new Error('Failed to fetch')
      tableData.value = await response.json()
    } catch (error) {
      console.error('Error fetching players:', error)
      tableData.value = []
    } finally {
      loading.value = false
    }
  }

  onMounted(() => {
    console.log('mounted')
    fetchData()
  })

  // --- NEW ROW CLICK HANDLER ---
  const handleRowClick = (row: any) => {
    router.push({ name: 'PlayerDetail', params: { id: row.id } })
  }

  // Search and Reset
  const handleSearch = () => {
    // In a real app, you'd filter or re-fetch
    // For mock, we just re-fetch all
    fetchData()
  }

  const handleReset = () => {
    searchForm.value = {
      displayName: '',
      email: ''
    }
    fetchData()
  }
</script>

<style lang="scss" scoped>
  .player-list-view {
    :deep(.el-table__row) {
      cursor: pointer;
    }
  }
</style>

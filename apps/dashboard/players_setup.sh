#!/bin/bash

echo "Creating mock data directory..."
mkdir -p public/mock

# 1. Create mock data for the player list
echo "Creating public/mock/players.json..."
cat << 'EOF' > public/mock/players.json
[
  {
    "id": "u_001",
    "displayName": "CasinoKing",
    "email": "king@example.com",
    "totalGGR": 1250.00,
    "totalDeposits": 5800.00,
    "status": "ACTIVE",
    "joinDate": "2025-11-01T10:30:00Z"
  },
  {
    "id": "u_002",
    "displayName": "SpinQueen",
    "email": "queen@example.com",
    "totalGGR": 850.50,
    "totalDeposits": 3200.00,
    "status": "ACTIVE",
    "joinDate": "2025-10-28T14:15:00Z"
  },
  {
    "id": "u_003",
    "displayName": "JackpotJoe",
    "email": "joe@example.com",
    "totalGGR": -200.00,
    "totalDeposits": 500.00,
    "status": "ACTIVE",
    "joinDate": "2025-10-25T08:00:00Z"
  },
  {
    "id": "u_004",
    "displayName": "LapsedPlayer",
    "email": "lapsed@example.com",
    "totalGGR": 15.00,
    "totalDeposits": 50.00,
    "status": "INACTIVE",
    "joinDate": "2025-09-15T12:00:00Z"
  },
  {
    "id": "u_005",
    "displayName": "HighRoller",
    "email": "roller@example.com",
    "totalGGR": 5400.00,
    "totalDeposits": 25000.00,
    "status": "ACTIVE",
    "joinDate": "2025-11-05T17:45:00Z"
  }
]
EOF

# 2. Create mock data for the player detail page
echo "Creating public/mock/player-detail.json..."
cat << 'EOF' > public/mock/player-detail.json
{
  "user": {
    "id": "u_001",
    "displayName": "CasinoKing",
    "email": "king@example.com",
    "roles": ["USER", "VIP_TIER_2"],
    "createdAt": "2025-11-01T10:30:00Z",
    "status": "ACTIVE"
  },
  "balance": {
    "realBalance": 1500.75,
    "freeSpinsRemaining": 10,
    "depositWageringRemaining": 250.00,
    "totalDepositedReal": 5800.00,
    "totalWithdrawn": 2000.00,
    "totalWagered": 10500.00,
    "totalWon": 9250.00,
    "totalBonusGranted": 1500.00
  },
  "activeBonuses": [
    {
      "id": "ab_001",
      "status": "ACTIVE",
      "priority": 100,
      "currentBonusBalance": 50.00,
      "currentWageringRemaining": 1000.00,
      "expiresAt": "2025-11-15T10:00:00Z"
    }
  ],
  "recentGameSessions": [
    {
      "id": "gs_001",
      "gameName": "BassBossRTG",
      "status": "COMPLETED",
      "totalWagered": 150.00,
      "totalWon": 300.00,
      "duration": 15,
      "createdAt": "2025-11-10T05:30:00Z"
    },
    {
      "id": "gs_002",
      "gameName": "SpaceCatKA",
      "status": "COMPLETED",
      "totalWagered": 75.00,
      "totalWon": 10.50,
      "duration": 8,
      "createdAt": "2025-11-10T05:15:00Z"
    }
  ],
  "recentTransactions": [
    {
      "id": "rt_001",
      "type": "DEPOSIT",
      "amount": 250.00,
      "status": "COMPLETED",
      "createdAt": "2025-11-10T05:10:00Z"
    },
    {
      "id": "rt_002",
      "type": "WITHDRAWAL",
      "amount": 1000.00,
      "status": "PENDING",
      "createdAt": "2025-11-09T14:00:00Z"
    }
  ]
}
EOF

# 3. Create the new Player Detail view
echo "Creating views/player/detail/index.vue..."
mkdir -p src/views/player/detail
cat << 'EOF' > src/views/player/detail/index.vue
<template>
  <div class="player-detail-view p-4">
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card class="mb-4">
          <div class="flex flex-col items-center">
            <el-avatar :size="100" class="mb-4">
              {{ getAvatarText(playerData.user.displayName) }}
            </el-avatar>
            <h2 class="text-xl font-bold">{{ playerData.user.displayName }}</h2>
            <p class="text-tx-secondary">{{ playerData.user.email }}</p>
            <div class="flex gap-2 mt-2">
              <el-tag type="success" size="small">{{ playerData.user.status }}</el-tag>
              <el-tag v-for="role in playerData.user.roles" :key="role" size="small" type="info">
                {{ role }}
              </el-tag>
            </div>
          </div>
        </el-card>

        <el-card class="mb-4">
          <template #header>
            <div class="card-header">
              <span>Balance Overview</span>
            </div>
          </template>
          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="text-tx-secondary">Real Balance</span>
              <span class="font-medium">${{ playerData.balance.realBalance.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-tx-secondary">Free Spins</span>
              <span class="font-medium">{{ playerData.balance.freeSpinsRemaining }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-tx-secondary">Deposit WR</span>
              <span class="font-medium">${{ playerData.balance.depositWageringRemaining.toFixed(2) }}</span>
            </div>
          </div>
        </el-card>
        
        <el-card class="mb-4">
           <template #header>
            <div class="card-header">
              <span>Lifetime Stats</span>
            </div>
          </template>
          <div class="space-y-2">
            <div class="flex justify-between">
              <span class="text-tx-secondary">Total Deposited</span>
              <span class="font-medium text-green-500">${{ playerData.balance.totalDepositedReal.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-tx-secondary">Total Withdrawn</span>
              <span class="font-medium text-red-500">${{ playerData.balance.totalWithdrawn.toFixed(2) }}</span>
            </div>
             <div class="flex justify-between">
              <span class="text-tx-secondary">Total Wagered</span>
              <span class="font-medium">${{ playerData.balance.totalWagered.toFixed(2) }}</span>
            </div>
             <div class="flex justify-between">
              <span class="text-tx-secondary">Total Won</span>
              <span class="font-medium">${{ playerData.balance.totalWon.toFixed(2) }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-tx-secondary">Net GGR</span>
              <span class="font-medium" :class="netGGR >= 0 ? 'text-green-500' : 'text-red-500'">
                ${{ netGGR.toFixed(2) }}
              </span>
            </div>
          </div>
        </el-card>

      </el-col>

      <el-col :span="16">
        <el-card>
          <el-tabs v-model="activeTab">
            <el-tab-pane label="Recent Activity" name="activity">
              <el-timeline>
                <el-timeline-item
                  v-for="session in playerData.recentGameSessions"
                  :key="session.id"
                  :timestamp="formatTimestamp(session.createdAt)"
                  placement="top"
                >
                  <el-card>
                    <h4>Played {{ session.gameName }}</h4>
                    <p>Wagered: ${{ session.totalWagered.toFixed(2) }}</p>
                    <p>Won: ${{ session.totalWon.toFixed(2) }}</p>
                    <p>Duration: {{ session.duration }} mins</p>
                  </el-card>
                </el-timeline-item>
              </el-timeline>
            </el-tab-pane>
            
            <el-tab-pane label="Transactions" name="transactions">
              <el-table :data="playerData.recentTransactions" stripe>
                <el-table-column prop="type" label="Type" />
                <el-table-column label="Amount">
                  <template #default="{ row }">
                    <span :class="row.type === 'DEPOSIT' ? 'text-green-500' : 'text-red-500'">
                      ${{ row.amount.toFixed(2) }}
                    </span>
                  </template>
                </el-table-column>
                <el-table-column prop="status" label="Status">
                  <template #default="{ row }">
                    <el-tag :type="row.status === 'COMPLETED' ? 'success' : 'warning'">
                      {{ row.status }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="Date">
                   <template #default="{ row }">
                    {{ formatTimestamp(row.createdAt) }}
                   </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>

            <el-tab-pane label="Active Bonuses" name="bonuses">
               <el-table :data="playerData.activeBonuses" stripe>
                <el-table-column prop="status" label="Status" />
                <el-table-column label="Bonus Balance">
                   <template #default="{ row }">
                      ${{ row.currentBonusBalance.toFixed(2) }}
                   </template>
                </el-table-column>
                <el-table-column label="Wagering Remaining">
                   <template #default="{ row }">
                      ${{ row.currentWageringRemaining.toFixed(2) }}
                   </template>
                </el-table-column>
                <el-table-column label="Expires">
                   <template #default="{ row }">
                    {{ formatTimestamp(row.expiresAt) }}
                   </template>
                </el-table-column>
              </el-table>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { format, formatDistanceToNow } from 'date-fns'

const route = useRoute()
const activeTab = ref('activity')

const defaultData = {
  user: { displayName: 'Loading...', email: '', roles: [], createdAt: '', status: '' },
  balance: {
    realBalance: 0,
    freeSpinsRemaining: 0,
    depositWageringRemaining: 0,
    totalDepositedReal: 0,
    totalWithdrawn: 0,
    totalWagered: 0,
    totalWon: 0,
    totalBonusGranted: 0,
  },
  activeBonuses: [],
  recentGameSessions: [],
  recentTransactions: [],
}

const playerData = ref<any>(defaultData)

const netGGR = computed(() => {
  return playerData.value.balance.totalWagered - playerData.value.balance.totalWon
})

const getAvatarText = (name: string) => {
  return name ? name.substring(0, 2).toUpperCase() : 'NA'
}

const formatTimestamp = (timestamp: string) => {
  if (!timestamp) return 'N/A'
  return formatDistanceToNow(new Date(timestamp), { addSuffix: true })
}

onMounted(async () => {
  const playerId = route.params.id
  console.log(`Fetching data for player: ${playerId}`)
  // In a real app, you'd use the ID: fetch(\`/api/player/${playerId}\`)
  // For this mock, we'll just fetch the one detail file.
  try {
    const response = await fetch('/mock/player-detail.json')
    if (!response.ok) {
      throw new Error('Failed to fetch mock data')
    }
    playerData.value = await response.json()
  } catch (error) {
    console.error('Error loading player detail data:', error)
  }
})
</script>

<style lang="scss" scoped>
.player-detail-view {
  .card-header {
    font-weight: bold;
  }
  .el-card {
    border-radius: 8px;
  }
}
</style>
EOF

# 4. Update the router to include the new detail page
echo "Updating src/router/modules/player.ts..."
cat << 'EOF' > src/router/modules/player.ts
import Layout from '@/components/core/layouts/art-page-content/index.vue'

const playerRoutes = {
  name: 'Player',
  path: '/player',
  component: Layout,
  redirect: '/player/list',
  meta: {
    title: 'Player Management',
    icon: 'User',
    order: 3,
  },
  children: [
    {
      name: 'PlayerList',
      path: 'list',
      component: () => import('@/views/player/index.vue'),
      meta: {
        title: 'Player List',
        icon: 'User',
      },
    },
    {
      name: 'PlayerDetail',
      path: 'detail/:id', // NEW: Dynamic route for player details
      component: () => import('@/views/player/detail/index.vue'),
      meta: {
        title: 'Player Details',
        icon: 'File',
        isHidden: true, // Hide this from the sidebar menu
      },
    },
  ],
}

export default playerRoutes
EOF

# 5. Modify the player list view to fetch mock data and handle row clicks
echo "Updating src/views/player/index.vue..."
cat << 'EOF' > src/views/player/index.vue
<template>
  <div class="player-list-view">
    <art-table-header
      v-model:search-form="searchForm"
      :search-items="searchItems"
      @search="handleSearch"
      @reset="handleReset"
    >
      <player-search
        :search-form="searchForm"
      />
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
import { ArtTableHeader, ArtTable } from '@/components/core/tables'
import PlayerSearch from './modules/player-search.vue'
// import PlayerDialog from './modules/player-dialog.vue' // No longer used for edits
import { format, formatDistanceToNow } from 'date-fns'

const router = useRouter()

// Search form
const searchForm = ref({
  displayName: '',
  email: '',
})
const searchItems = ref([
  { label: 'Display Name', prop: 'displayName', component: 'el-input' },
  { label: 'Email', prop: 'email', component: 'el-input' },
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
  },
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
    email: '',
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
EOF

# 6. Modify the player search component to remove the "Add" button
echo "Updating src/views/player/modules/player-search.vue..."
cat << 'EOF' > src/views/player/modules/player-search.vue
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
EOF

echo "Player UI refactor script finished."
echo "Run 'bun run dev' and navigate to /player/list to see the changes."
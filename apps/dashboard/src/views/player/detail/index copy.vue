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

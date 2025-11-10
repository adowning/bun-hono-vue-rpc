<!-- 电子商务页面 -->
<template>
  <div class="ecommerce">
    <!-- <ElRow :gutter="20">
      <ElCol :sm="24" :md="24" :lg="16">
        <Banner />
      </ElCol>
      <ElCol :sm="12" :md="12" :lg="4">
        <TotalOrderVolume />
      </ElCol>
      <ElCol :sm="12" :md="12" :lg="4">
        <TotalProducts />
      </ElCol>
    </ElRow> -->
    <CardList></CardList>
    <!-- <ElRow :gutter="20">
      <ElCol :sm="12" :md="12" :lg="8">
        <SalesTrend />
      </ElCol>
      <ElCol :sm="12" :md="12" :lg="8">
        <SalesClassification />
      </ElCol>
      <ElCol :sm="24" :md="24" :lg="8">
        <ElRow :gutter="20">
          <ElCol :sm="24" :md="12" :lg="12">
            <ProductSales />
          </ElCol>
          <ElCol :sm="24" :md="12" :lg="12">
            <SalesGrowth />
          </ElCol>
          <ElCol :span="24" class="no-margin-bottom">
            <CartConversionRate />
          </ElCol>
        </ElRow>
      </ElCol>
    </ElRow> -->

    <ElRow :gutter="20">
      <ElCol :sm="24" :md="12" :lg="8">
        <HotCommodity
          :title="dashboardData.hotProductsList.title"
          :data="dashboardData.hotProductsList.data"
        />
      </ElCol>
      <ElCol :sm="24" :md="12" :lg="8">
        <!-- <AnnualSales /> -->
        <!-- <ArtDonutChartCard :value="36358" title="粉丝量" :percentage="18" percentageLabel="较去年" :data="[50, 40]"
          :height="9.5" currentValue="2022" previousValue="2021" :radius="['50%', '70%']" /> -->
        <div class="art-card p-5 mb-5 h-105">
          <div class="art-card-header">
            <div class="title">
              <h4>Bonus Classification</h4>
              <p>By bonus type</p>
            </div>
          </div>

          <ArtRingChart
            :data="dashboardData.bonusBreakdown.data"
            :color="['#4C87F3', '#EDF2FF', '#8BD8FC']"
            :radius="['70%', '80%']"
            height="16.5rem"
            :showLabel="false"
            :borderRadius="0"
            :centerText="
              dashboardData.bonusBreakdown.data[0].value +
              dashboardData.bonusBreakdown.data[1].value +
              dashboardData.bonusBreakdown.data[2].value
            "
          />
          <div class="flex justify-around">
            <div class="flex-c">
              <div class="flex-cc size-10.5 mr-2.5 text-theme bg-theme/10 rounded-lg">
                <ArtSvgIcon icon="mdi:currency-usd" class="text-xl" />
              </div>
              <div>
                <p class="text-lg"
                  >${{
                    (dashboardData.bonusBreakdown.data[0].value +
                      dashboardData.bonusBreakdown.data[1].value +
                      dashboardData.bonusBreakdown.data[2].value) *
                    0.5
                  }}</p
                >
                <span class="text-sm">generated</span>
              </div>
            </div>
            <div class="flex-c">
              <div class="flex-cc size-10.5 mr-2.5 text-theme bg-theme/10 rounded-lg">
                <ArtSvgIcon icon="mdi:finance" class="text-xl" />
              </div>
              <div>
                <p class="text-lg"
                  >${{
                    (dashboardData.bonusBreakdown.data[0].value +
                      dashboardData.bonusBreakdown.data[1].value +
                      dashboardData.bonusBreakdown.data[2].value) *
                    1.3
                  }}</p
                >
                <span class="text-sm">projected </span>
              </div>
            </div>
          </div>
        </div>
        <!-- <ArtDonutChartCard :value="36358" title="粉丝量" :percentage="18" percentageLabel="较去年" :data="[50, 40]"
          :height="9.5" currentValue="2022" previousValue="2021" :radius="['50%', '70%']" /> -->
      </ElCol>
      <ElCol :sm="24" :md="24" :lg="8">
        <!-- <TransactionList :data="dashboardData.recentActivities" /> -->
        <ArtTimelineListCard
          :list="dashboardData.latestUsers.data"
          :title="dashboardData.latestUsers.title"
          subtitle="2024-12-20"
        />
      </ElCol>
    </ElRow>

    <ElRow :gutter="20">
      <ElCol :md="24" :lg="8">
        <recent-transaction
          class="mb-4"
          :title="'Recent Transactions'"
          :data="dashboardData.recentTransactions"
          :show-activity="false"
        />
      </ElCol>
      <ElCol :md="24" :lg="16" class="no-margin-bottom">
        <HotProductsList :data="dashboardData.hotProductsList" />
      </ElCol>
    </ElRow>
  </div>
</template>

<script setup lang="ts">
  import { dataTool } from 'echarts'
  import CardList from './modules/card-list.vue'
  import HotCommodity from './modules/hot-commodity.vue'
  import HotProductsList from './modules/hot-products-list.vue'
  import RecentTransaction from './modules/recent-transaction.vue'
  import TransactionList from './modules/transaction-list.vue'

  defineOptions({ name: 'Ecommerce' })
  // Define the shape of our new data
  interface DashboardData {
    statsCards: any[]
    recentActivities: any[]
    topGamesByGGR: { title: string; data: any[] }
    bonusBreakdown: { title: string; data: any[] }
    recentTransactions: any[]
    hotProductsList: { title: string; data: any[] }
    latestUsers: { title: string; data: any[] }
  }

  // Create a reactive ref to hold our mock data
  const dashboardData = ref<DashboardData>({
    statsCards: [],
    recentActivities: [],
    topGamesByGGR: { title: 'Top Games by GGR', data: [] },
    bonusBreakdown: { title: 'Bonus Classification', data: [] },
    recentTransactions: [],
    hotProductsList: { title: 'Hot Games', data: [] },
    latestUsers: { title: 'New Users', data: [] }
  })

  // Fetch the mock data when the component mounts
  onMounted(async () => {
    try {
      const response = await fetch('/mock/dashboard-data.json')
      if (!response.ok) {
        throw new Error('Failed to fetch mock data')
      }
      const data = await response.json()
      dashboardData.value = data
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    }
  })
</script>

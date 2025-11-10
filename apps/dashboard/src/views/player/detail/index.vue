<!-- Personal Center Page -->
<template>
  <div class="w-full h-full p-0 bg-transparent border-none shadow-none">
    <div class="relative flex-b mt-2.5 max-md:block max-md:mt-1">
      <div class="w-112 mr-5 max-md:w-full max-md:mr-0">
        <div class="art-card-sm relative p-9 pb-6 overflow-hidden text-center">
          <img class="absolute top-0 left-0 w-full h-50 object-cover" src="/images/sunoco.jpg" />
          <img
            class="relative z-10 w-24 h-24 mt-30 mx-auto object-cover border-2 border-white rounded-full"
            :src="`https://gameui.cashflowcasino.com/public/avatars/${userInfo.avatar.replace('avif', 'webp')}`"
          />
          <h2 class="mt-5 text-xl font-normal">{{ userInfo.displayName }}</h2>
          <p class="mt-5 text-sm">Focusing on user experience and visual design</p>

          <div class="w-75 mx-auto mt-7.5 text-left">
            <div class="mt-2.5">
              <ArtSvgIcon icon="ri:mail-line" class="text-g-700" />
              <span class="ml-2 text-sm">{{ userInfo.email }}</span>
            </div>
            <div class="mt-2.5">
              <ArtSvgIcon icon="ri:calendar-line" class="text-g-700" />
              <span class="ml-2 text-sm">{{
                new Date(userInfo.createdAt).toLocaleDateString()
              }}</span>
            </div>
            <div class="mt-2.5">
              <ArtSvgIcon icon="ri:map-pin-line" class="text-g-700" />
              <span class="ml-2 text-sm">Tyler, Texas</span>
            </div>
            <div class="mt-2.5">
              <ArtSvgIcon icon="ri:trophy-line" class="text-g-700" />
              <span class="ml-2 text-sm">VIP Rank - 1</span>
            </div>
          </div>

          <!-- <div class="mt-10">
            <h3 class="text-sm font-medium">Tags</h3>
            <div class="flex flex-wrap justify-center mt-3.5">
              <div
                v-for="item in lableList"
                :key="item"
                class="py-1 px-1.5 mr-2.5 mb-2.5 text-xs border border-g-300 rounded"
              >
                {{ item }}
              </div>
            </div>
          </div> -->
        </div>
      </div>
      <div class="flex-1 overflow-hidden max-md:w-full max-md:mt-3.5">
        <el-collapse v-model="activeTab" accordion>
          <el-collapse-item title="Player Stats" name="1">
            <div class="art-card-sm">
              <div class="overflow-auto h-full">
                <ArtTable
                  :data="products"
                  style="width: 100%"
                  size="large"
                  :border="false"
                  :stripe="false"
                  :header-cell-style="{ background: 'transparent' }"
                >
                  <ElTableColumn prop="name" label="Product name" width="200" />
                  <ElTableColumn prop="popularity" label="Sales volume">
                    <template #default="scope">
                      <ElProgress
                        :percentage="scope.row.popularity"
                        :color="getColor(scope.row.popularity)"
                        :stroke-width="5"
                        :show-text="false"
                      />
                    </template>
                  </ElTableColumn>
                  <ElTableColumn prop="sales" label="Sales" width="80">
                    <template #default="scope">
                      <span
                        :style="{
                          color: getColor(scope.row.popularity),
                          backgroundColor: `rgba(${hexToRgb(getColor(scope.row.popularity))}, 0.08)`,
                          border: '1px solid',
                          padding: '3px 6px',
                          borderRadius: '4px',
                          fontSize: '12px'
                        }"
                        >{{ scope.row.sales }}</span
                      >
                    </template>
                  </ElTableColumn>
                </ArtTable>
              </div>
            </div>
          </el-collapse-item>
          <el-collapse-item title="Basic Settings" name="2">
            <div class="art-card-sm">
              <!-- <h1 class="p-4 text-xl font-normal border-b border-g-300">Basic Settings</h1> -->

              <ElForm
                :model="form"
                class="box-border p-5 [&>.el-row_.el-form-item]:w-[calc(50%-10px)] [&>.el-row_.el-input]:w-full [&>.el-row_.el-select]:w-full"
                ref="ruleFormRef"
                :rules="rules"
                label-width="86px"
                label-position="top"
              >
                <ElRow>
                  <ElFormItem label="Name" prop="realName">
                    <ElInput v-model="form.realName" :disabled="!isEdit" />
                  </ElFormItem>
                  <ElFormItem label="Gender" prop="sex" class="ml-5">
                    <ElSelect v-model="form.sex" placeholder="Select" :disabled="!isEdit">
                      <ElOption
                        v-for="item in options"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                      />
                    </ElSelect>
                  </ElFormItem>
                </ElRow>

                <ElRow>
                  <ElFormItem label="Nickname" prop="nikeName">
                    <ElInput v-model="form.nikeName" :disabled="!isEdit" />
                  </ElFormItem>
                  <ElFormItem label="Email" prop="email" class="ml-5">
                    <ElInput v-model="form.email" :disabled="!isEdit" />
                  </ElFormItem>
                </ElRow>

                <ElRow>
                  <ElFormItem label="Mobile" prop="mobile">
                    <ElInput v-model="form.mobile" :disabled="!isEdit" />
                  </ElFormItem>
                  <ElFormItem label="Address" prop="address" class="ml-5">
                    <ElInput v-model="form.address" :disabled="!isEdit" />
                  </ElFormItem>
                </ElRow>

                <ElFormItem label="Personal Introduction" prop="des" class="h-32">
                  <ElInput type="textarea" :rows="4" v-model="form.des" :disabled="!isEdit" />
                </ElFormItem>

                <div class="flex-c justify-end [&_.el-button]:!w-27.5">
                  <ElButton type="primary" class="w-22.5" v-ripple @click="edit">
                    {{ isEdit ? 'Save' : 'Edit' }}
                  </ElButton>
                </div>
              </ElForm>
            </div>
          </el-collapse-item>
          <el-collapse-item title="Change Password" name="3">
            <div class="art-card-sm my-5">
              <!-- <h1 class="p-4 text-xl font-normal border-b border-g-300">Change Password</h1> -->

              <ElForm
                :model="pwdForm"
                class="box-border p-5"
                label-width="86px"
                label-position="top"
              >
                <ElFormItem label="Current Password" prop="password">
                  <ElInput
                    v-model="pwdForm.password"
                    type="password"
                    :disabled="!isEditPwd"
                    show-password
                  />
                </ElFormItem>

                <ElFormItem label="New Password" prop="newPassword">
                  <ElInput
                    v-model="pwdForm.newPassword"
                    type="password"
                    :disabled="!isEditPwd"
                    show-password
                  />
                </ElFormItem>

                <ElFormItem label="Confirm New Password" prop="confirmPassword">
                  <ElInput
                    v-model="pwdForm.confirmPassword"
                    type="password"
                    :disabled="!isEditPwd"
                    show-password
                  />
                </ElFormItem>

                <div class="flex-c justify-end [&_.el-button]:!w-27.5">
                  <ElButton type="primary" class="w-22.5" v-ripple @click="editPwd">
                    {{ isEditPwd ? 'Save' : 'Edit' }}
                  </ElButton>
                </div>
              </ElForm>
            </div>
          </el-collapse-item>
        </el-collapse>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { getUserDetails } from '@/api/client'
  import { useUserStore } from '@/store/modules/user'
  import type { FormInstance, FormRules } from 'element-plus'
  import { hexToRgb } from '@/utils/ui'

  defineOptions({ name: 'UserCenter' })
  const route = useRoute()

  const activeTab = ref('1')
  const userStore = useUserStore()
  const userInfo = computed(() => userStore.getUserDetailInfo)

  const isEdit = ref(false)
  const isEditPwd = ref(false)
  const date = ref('')
  const ruleFormRef = ref<FormInstance>()

  /**
   * User information form
   */
  const form = reactive({
    realName: 'John Snow',
    nikeName: 'Pikachu',
    email: '59301283@mall.com',
    mobile: '18888888888',
    address:
      "Building 201, Block 101, Xixiang Street, Bao'an District, Shenzhen, Guangdong Province",
    sex: '2',
    des: 'Art Design Pro is a backend system that combines design aesthetics with efficient development.'
  })

  /**
   * Password change form
   */
  const pwdForm = reactive({
    password: '123456',
    newPassword: '123456',
    confirmPassword: '123456'
  })

  /**
   * Form validation rules
   */
  const rules = reactive<FormRules>({
    realName: [
      { required: true, message: 'Please enter your name', trigger: 'blur' },
      { min: 2, max: 50, message: 'Length between 2 and 50 characters', trigger: 'blur' }
    ],
    nikeName: [
      { required: true, message: 'Please enter nickname', trigger: 'blur' },
      { min: 2, max: 50, message: 'Length between 2 and 50 characters', trigger: 'blur' }
    ],
    email: [{ required: true, message: 'Please enter email', trigger: 'blur' }],
    mobile: [{ required: true, message: 'Please enter mobile number', trigger: 'blur' }],
    address: [{ required: true, message: 'Please enter address', trigger: 'blur' }],
    sex: [{ required: true, message: 'Please select gender', trigger: 'blur' }]
  })

  /**
   * Gender options
   */
  const options = [
    { value: '1', label: 'Male' },
    { value: '2', label: 'Female' }
  ]

  /**
   * User label list
   */
  const lableList: Array<string> = [
    'Design Focused',
    'Creative Thinker',
    'Spicy~',
    'Long Legs',
    'Sichuan Girl',
    'Inclusive'
  ]
  interface Product {
    name: string
    popularity: number
    sales: string
  }

  const products = computed<Product[]>(() => [
    { name: 'Smartphone', popularity: 10, sales: '100' },
    { name: 'laptop', popularity: 29, sales: '100' },
    { name: 'tablet', popularity: 65, sales: '100' },
    { name: 'smart watch', popularity: 32, sales: '100' },
    { name: 'wireless headphones', popularity: 78, sales: '100' },
    { name: 'Smart Speaker', popularity: 41, sales: '100' }
  ])

  const COLOR_THRESHOLDS = {
    LOW: 25,
    MEDIUM: 50,
    HIGH: 75
  } as const
  const POPULARITY_COLORS = {
    LOW: '#00E096',
    MEDIUM: '#0095FF',
    HIGH: '#884CFF',
    VERY_HIGH: '#FE8F0E'
  } as const

  const getColor = (percentage: number): string => {
    if (percentage < COLOR_THRESHOLDS.LOW) return POPULARITY_COLORS.LOW
    if (percentage < COLOR_THRESHOLDS.MEDIUM) return POPULARITY_COLORS.MEDIUM
    if (percentage < COLOR_THRESHOLDS.HIGH) return POPULARITY_COLORS.HIGH
    return POPULARITY_COLORS.VERY_HIGH
  }
  onMounted(async () => {
    getDate()
    const userDetailInfo = await getUserDetails(route.params.id as string)
    userStore.setUserDetailInfo(userDetailInfo)
  })

  /**
   * Get greeting based on current time
   */
  const getDate = () => {
    const h = new Date().getHours()

    if (h >= 6 && h < 9) date.value = 'Good morning'
    else if (h >= 9 && h < 11) date.value = 'Good morning'
    else if (h >= 11 && h < 13) date.value = 'Good noon'
    else if (h >= 13 && h < 18) date.value = 'Good afternoon'
    else if (h >= 18 && h < 24) date.value = 'Good evening'
    else date.value = "It's getting late, get some rest"
  }

  /**
   * Toggle user information edit status
   */
  const edit = () => {
    isEdit.value = !isEdit.value
  }

  /**
   * Toggle password edit status
   */
  const editPwd = () => {
    isEditPwd.value = !isEditPwd.value
  }
</script>

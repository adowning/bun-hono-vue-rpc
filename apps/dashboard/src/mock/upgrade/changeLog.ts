import { ref } from 'vue'

interface UpgradeLog {
  version: string // Version number
  title: string // Update title
  date: string // Update date
  detail?: string[] // Update content
  requireReLogin?: boolean // Whether re-login is required
  remark?: string // Remarks
}

export const upgradeLogList = ref<UpgradeLog[]>([])

import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { getTransactions, getTransactionById } from '@/api/client' // Adjust path
import type { PaginationParams, TransactionType } from '../../../../shared/types'

// Pagination meta for responses
export interface PaginationMeta {
  page: number
  perPage: number
  total: number
  totalPages: number
}

export const useTransactionStore = defineStore('transactions', () => {
  // --- State ---
  const transactions = ref<TransactionType[]>([])
  const currentTransaction = ref<TransactionType | null>(null)
  const pagination = ref<PaginationMeta | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // --- Getters (as computed) ---
  const allTransactions = computed(() => transactions.value)
  const isLoading = computed(() => loading.value)
  const paginationInfo = computed(() => pagination.value)

  // --- Actions ---

  /**
   * Fetches the paginated list of transactions
   */
  async function fetchTransactions(params: PaginationParams) {
    loading.value = true
    error.value = null
    try {
      // This response is strongly typed: PaginatedResponse<TransactionType>
      const response = await getTransactions(params)
      transactions.value = response.data || []
      pagination.value = response.pagination || null
    } catch (e: any) {
      error.value = e.message || 'Failed to fetch transactions'
    } finally {
      loading.value = false
    }
  }

  /**
   * Fetches a single transaction by its ID
   */
  async function fetchTransaction(id: string) {
    loading.value = true
    error.value = null
    try {
      // This response is strongly typed: { data: TransactionType }
      const response = await getTransactionById(id)
      currentTransaction.value = response.data || null
    } catch (e: any) {
      error.value = e.message || 'Failed to fetch transaction'
    } finally {
      loading.value = false
    }
  }

  /**
   * Clears the currently viewed transaction
   */
  function clearCurrentTransaction() {
    currentTransaction.value = null
  }

  return {
    // State
    transactions,
    currentTransaction,
    pagination,
    loading,
    error,
    // Getters
    allTransactions,
    isLoading,
    paginationInfo,
    // Actions
    fetchTransactions,
    fetchTransaction,
    clearCurrentTransaction
  }
})

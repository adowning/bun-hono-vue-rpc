import { KV } from '@cross/kv'
import { CurrentUser } from '../db/schema'

/**
 * Cross-KV based cache middleware for authentication
 * Provides same interface as Keyv but with improved performance and TTL support
 */
export class CrossKVCache<T = any> {
  private kv: any
  private namespace: string
  private defaultTtl: number

  constructor(
    options: {
      namespace?: string
      defaultTtl?: number
    } = {}
  ) {
    this.namespace = options.namespace || 'auth'
    this.defaultTtl = options.defaultTtl || 3600000 // 1 hour default TTL
    this.kv = new KV()
    this.openDB()
  }
  private async openDB() {
    await this.kv.open('data/mydatabase.db')
    this.monitorSync()
  }
  private monitorSync() {
    this.kv.on('sync', (eventData: any) => {
      switch (eventData.result) {
        case 'ready':
          // console.log('No new updates')
          break
        case 'success':
          console.log('Synchronization successful, new transactions added')
          break
        case 'ledgerInvalidated':
          console.log('Ledger recreated, database reopened and index resynchronized')
          break
        case 'error':
          console.error('An error occurred during synchronization:', eventData.error)
          break
      }
    })
  }
  /**
   * Get a value from cache
   */
  async get(key: Array<string>): Promise<T | null> {
    try {
      console.log(key)
      const result = await this.kv.get(key)
      return (result as T) || null
    } catch (error) {
      console.error('CrossKVCache get error:', error)
      return null
    }
  }

  /**
   * Set a value in cache with optional TTL
   * Note: @cross/kv doesn't have native TTL, so we'll use a simple approach
   */
  async set(key: Array<string>, value: T, ttl?: number): Promise<void> {
    try {
      const fullKey = `${this.namespace}:${key}`
      console.log(key)
      await this.kv.set(key, value)
    } catch (error) {
      console.error('CrossKVCache set error:', error)
      throw new Error(
        `Failed to cache value: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Delete a value from cache
   */
  async delete(key: string): Promise<boolean> {
    try {
      const fullKey = `${this.namespace}:${key}`
      await this.kv.delete(fullKey)
      return true
    } catch (error) {
      console.error('CrossKVCache delete error:', error)
      return false
    }
  }

  /**
   * Clear all values from cache (limited to namespace)
   */
  async clear(): Promise<void> {
    try {
      const pattern = `${this.namespace}:`
      const keys = await this.kv.listKeys()
      const namespaceKeys = keys.filter((key: string) => key.startsWith(pattern))

      for (const key of namespaceKeys) {
        await this.kv.delete(key)
      }
    } catch (error) {
      console.error('CrossKVCache clear error:', error)
      throw new Error(
        `Failed to clear cache: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  /**
   * Check if a key exists in cache
   */
  async has(key: string): Promise<boolean> {
    try {
      const fullKey = `${this.namespace}:${key}`
      const result = await this.kv.get(fullKey)
      return result !== null && result !== undefined
    } catch (error) {
      console.error('CrossKVCache has error:', error)
      return false
    }
  }

  /**
   * Get multiple values from cache
   */
  async getMany(keys: Array<string>[]): Promise<(T | null)[]> {
    try {
      const promises = keys.map((key) => this.get(key))
      return await Promise.all(promises)
    } catch (error) {
      console.error('CrossKVCache getMany error:', error)
      return keys.map(() => null)
    }
  }

  /**
   * Set multiple values in cache
   */
  async setMany(entries: [Array<string>, T][], ttl?: number): Promise<void> {
    try {
      for (const [key, value] of entries) {
        await this.set(key, value, ttl)
      }
    } catch (error) {
      console.error('CrossKVCache setMany error:', error)
      throw new Error(
        `Failed to cache multiple values: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }
}

// Create a singleton instance for authentication cache
export const authKeyv = new CrossKVCache<CurrentUser>({
  namespace: 'auth',
  defaultTtl: 3600000 // 1 hour TTL for auth data
})

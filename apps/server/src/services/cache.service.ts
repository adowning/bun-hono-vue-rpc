import { KV } from '@cross/kv'
import type { User } from '@/db'
import { CurrentUser } from '@/shared'

/**
 * Cross-KV based cache
 */
export class CrossKVCache<T = any> {
  private kv: any
  private namespace: string

  constructor(
    options: {
      namespace?: string
    } = {}
  ) {
    this.namespace = options.namespace || 'cache'
    this.kv = new KV()
    this.openDB()
  }

  private async openDB() {
    await this.kv.open('data/cache.db') // Main cache DB
  }

  private getKey(key: string | string[]): string[] {
    const keyArray = Array.isArray(key) ? key : [key]
    return [this.namespace, ...keyArray]
  }

  async get(key: string | string[]): Promise<T | null> {
    try {
      const result = await this.kv.get(this.getKey(key))
      return (result as T) || null
    } catch (error) {
      console.error('CrossKVCache get error:', error)
      return null
    }
  }

  async set(key: string | string[], value: T, ttl?: number): Promise<void> {
    // TODO: Implement TTL logic if @cross/kv doesn't support it natively
    try {
      await this.kv.set(this.getKey(key), value)
    } catch (error) {
      console.error('CrossKVCache set error:', error)
    }
  }

  async delete(key: string | string[]): Promise<boolean> {
    try {
      await this.kv.delete(this.getKey(key))
      return true
    } catch (error) {
      console.error('CrossKVCache delete error:', error)
      return false
    }
  }
}

// --- Singleton Cache Instances ---

// Cache for lean User objects, used by auth middleware
// Keyed by refreshToken
export const authCache = new CrossKVCache<User>({
  namespace: 'auth-user'
})

// Cache for "fat" CurrentUser objects, used by user service
// Keyed by userId
export const userStateCache = new CrossKVCache<CurrentUser>({
  namespace: 'user-state'
})

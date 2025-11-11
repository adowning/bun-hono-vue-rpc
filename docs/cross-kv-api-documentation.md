# @cross/kv - Comprehensive API Documentation

*Fast, lightweight, powerful and cross-platform key-value database for Node.js, Deno, and Bun*

## Overview

The `@cross/kv` package provides a high-performance key-value database with ACID transactions, automatic synchronization, and cross-platform compatibility. This documentation covers all aspects needed to implement a cache middleware module.

---

## 1. Cache Instance Initialization with In-Memory Adapter

### Constructor

```typescript
const db = new KV(options?)
```

### Configuration Options

```typescript
const db = new KV({
  autoSync: true,              // Enable/disable automatic synchronization (default: true)
  syncIntervalMs: 1000,        // Synchronization interval in milliseconds (default: 1000)
  ledgerCacheSize: 100,        // Ledger cache size in megabytes (default: 100)
  disableIndex: false,         // Disable in-memory index (default: false)
});
```

### Option Details

- **`autoSync` (boolean)**:
  - `true` (default): Automatic synchronization of in-memory index with on-disk ledger
  - `false`: Manual synchronization required via `db.sync()`

- **`syncIntervalMs` (number)**: Interval between automatic syncs (shorter = more up-to-date but higher overhead)

- **`ledgerCacheSize` (number)**: Maximum memory cache in MB (larger = better read performance, more memory usage)

- **`disableIndex` (boolean)**:
  - `false` (default): In-memory index enabled (supports get, iterate, scan, list)
  - `true`: Faster loading but limited functionality

### Opening the Database

```typescript
async open(filepath: string, createIfMissing = true, ignoreReadErrors = false): Promise<void>
```

**Parameters:**
- `filepath`: Path to the database file
- `createIfMissing`: Create file if it doesn't exist (default: true)
- `ignoreReadErrors`: Ignore read errors during initialization (default: false)

---

## 2. Available Methods for Setting and Getting Cached Data

### Core Operations

#### Setting Data
```typescript
async set<T>(key: Key, value: T): Promise<void>
```

**Example:**
```typescript
await db.set(["users", 1, "profile"], { name: "Alice", age: 30 });
```

#### Getting Data
```typescript
async get<T>(key: Key): Promise<T | null>
```

**Example:**
```typescript
const profile = await db.get(["users", 1, "profile"]);
```

#### Deleting Data
```typescript
async delete(key: Key): Promise<void>
```

**Example:**
```typescript
await db.delete(["users", 1, "profile"]);
```

### Query Operations

#### Iterating Over Data
```typescript
async *iterate<T>(query: Query, limit?: number, reverse?: boolean): AsyncIterableIterator<KVEntry<T>>
```

**Example:**
```typescript
for await (const entry of db.iterate(["users"])) {
  console.log(entry.key, entry.value);
}
```

#### Listing All Matches
```typescript
async listAll<T>(query: Query, limit?: number, reverse?: boolean): Promise<KVEntry<T>[]>
```

**Example:**
```typescript
const users = await db.listAll(["users", { to: 10 }]);
```

#### Scanning Transaction History
```typescript
async *scan<T>(query: Query, limit?: number, reverse?: boolean, ignoreReadErrors = false): AsyncIterableIterator<KVEntry<T>>
```

#### Listing Keys Only
```typescript
listKeys(query: Query): Key[]
```

**Example:**
```typescript
const keys = db.listKeys(["users"]);
```

---

## 3. Configuring Expiration Times

**⚠️ Important Note:** The current `@cross/kv` implementation does not provide built-in expiration time configuration. The database is designed as a persistent key-value store without automatic data expiration.

**Alternative Approaches for Cache Expiration:**
1. **Application-level expiration**: Store expiration timestamps with your data and check them on retrieval
2. **Periodic cleanup**: Use `vacuum()` method to optimize storage and implement custom cleanup logic
3. **Transaction-based cleanup**: Create a maintenance routine that removes expired entries

**Example of application-level expiration:**
```typescript
// Store data with expiration
const cacheData = {
  value: yourData,
  expiresAt: Date.now() + (ttl * 1000) // ttl in seconds
};
await db.set(["cache", "yourKey"], cacheData);

// Check expiration on retrieval
const cached = await db.get(["cache", "yourKey"]);
if (cached && cached.expiresAt > Date.now()) {
  // Data is still valid
  return cached.value;
} else {
  // Data expired, delete it
  await db.delete(["cache", "yourKey"]);
  return null;
}
```

---

## 4. Specific Requirements for User Data Storage

### Key Structure Requirements

**Keys must be arrays containing:**
- **First element**: Must be a string
- **Subsequent elements**: Strings or numbers
- **String restrictions**: Only alphanumeric characters, hyphens, underscores, or "@"

**Valid Key Examples:**
```typescript
["users", 123]
["products", "category", { from: 10, to: 20 }]
["session", "user_123", "token"]
```

### Value Types Supported

**All JavaScript primitives and complex objects with CBOR-serializable types:**

- **Numbers**: `12345`
- **Strings**: `"Hello, world!"`
- **Booleans**: `true`
- **Arrays**: `[1, 2, 3]`
- **Objects**: `{ "name": "Alice", "age": 30 }`
- **Maps**: `new Map([["key1", "value1"]])`
- **Sets**: `new Set([1, 2, 3])`
- **Dates**: `new Date()`
- **Null**: `null`

### Query Patterns

**Query Examples:**
```typescript
// All users
["users"]

// Specific user with ID 123
["users", 123]

// All products in any category
["products", "category"]

// Products with ID up to 20
["products", "category", { to: 20 }]

// Sub-document "specifications" of products 10-20
["products", "category", { from: 10, to: 20 }, "specifications"]
```

---

## 5. Error Handling Patterns

### Transaction-Based Error Handling

```typescript
db.beginTransaction();
try {
  await db.set(["key1"], "value1");
  await db.set(["key2"], "value2");
  await db.endTransaction(); // Commit
} catch (error) {
  // Transaction automatically rolled back on error
  console.error("Transaction failed:", error);
}
```

### Read Error Handling

```typescript
// Methods support ignoreReadErrors parameter
const data = await db.iterate(["data"], 10, false, true); // ignoreReadErrors = true

await db.scan(["users"], 100, false, true); // ignoreReadErrors = true
```

### Promise Deferral

```typescript
// Defer promise resolution/rejection until close()
db.defer(promiseToHandle, errorHandler?, timeoutMs?)
```

### Event-Based Error Monitoring

```typescript
// Subscribe to events
db.on("sync", (eventData) => {
  console.log("Sync result:", eventData.result);
});

db.on("watchdogError", (error) => {
  console.error("Watchdog error:", error);
});

db.on("closing", () => {
  console.log("Database is closing");
});
```

### Status Checking

```typescript
// Check if database is ready
if (db.isOpen()) {
  // Database is ready for operations
}
```

---

## 6. Authentication and Connection Requirements

### **No Authentication Required**

The `@cross/kv` package **does not require authentication or connection credentials**. It operates as a **file-based database** with no network dependencies.

### **Connection Model**

- **File-based storage**: Data stored locally in a specified file path
- **No network connectivity**: Works entirely offline
- **File system permissions**: Access control handled by operating system file permissions
- **Cross-platform**: Works on Node.js, Deno, and Bun

### **Security Considerations**

Since there's no built-in authentication:

1. **File System Security**: Database file permissions control access
2. **Application-level Security**: Implement your own access controls
3. **Network Security**: If accessed over network, use file system-level encryption
4. **Process Isolation**: Multiple processes can access the same database file

### **Multi-Process Support**

The `autoSync` feature is designed for multi-process scenarios:

```typescript
// Enable auto-sync for multi-process environments
const db = new KV({
  autoSync: true,
  syncIntervalMs: 500 // More frequent sync for multi-process
});
```

---

## 7. Advanced Features

### Watch/Notify System

```typescript
// Watch for changes
db.watch(["users", {}, "interests"], (entry) => {
  console.log("New interest:", entry);
});

// Unregister watch
db.unwatch(["users", {}, "interests"], callback);
```

### Manual Synchronization

```typescript
// Force sync (when autoSync is disabled)
await db.sync(ignoreReadErrors);
```

### Database Maintenance

```typescript
// Optimize storage by removing redundant history
await db.vacuum(ignoreReadErrors);
```

### Database Lifecycle

```typescript
// Check if database is open
const isReady = db.isOpen();

// Close and cleanup
await db.close();
```

---

## 8. Implementation Recommendations for Cache Middleware

### 1. **Recommended Configuration for Cache Use**

```typescript
const cacheDb = new KV({
  autoSync: true,              // Essential for cache consistency
  syncIntervalMs: 1000,        // 1-second sync interval
  ledgerCacheSize: 50,         // 50MB cache (adjust based on needs)
  disableIndex: false          // Keep index enabled for performance
});
```

### 2. **Cache-Specific Key Naming Convention**

```typescript
// Recommended pattern: [cache_type, identifier, sub_key]
["cache", "user", userId, "profile"]
["cache", "session", sessionId, "data"]
["cache", "api", endpoint, "response"]
```

### 3. **Expiration Handling Implementation**

```typescript
class CacheEntry<T> {
  constructor(
    public data: T,
    public expiresAt: number
  ) {}

  isExpired(): boolean {
    return Date.now() > this.expiresAt;
  }
}

// Usage
const entry = new CacheEntry(yourData, Date.now() + 300000); // 5 minutes
await db.set(["cache", "key"], entry);
```

### 4. **Error Handling Strategy**

```typescript
class CacheError extends Error {
  constructor(message: string, public userData?: any) {
    super(message);
    this.name = 'CacheError';
  }
}

async function safeCacheOperation<T>(
  operation: () => Promise<T>
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null; // Cache miss
    }
    throw new CacheError('Cache operation failed', { error, operation: operation.toString() });
  }
}
```

---

## 9. Performance Considerations

### **Memory Usage**
- `ledgerCacheSize` directly impacts memory usage
- Monitor memory consumption in production

### **Sync Frequency**
- Lower `syncIntervalMs` = more memory usage, better consistency
- Higher values = less memory usage, potential data staleness

### **Index Performance**
- Keeping `disableIndex: false` provides better query performance
- Disabling index only recommended for write-heavy, read-light scenarios

### **Batch Operations**
- Use transactions for multiple related operations
- Group operations to reduce sync overhead

---

## 10. Example Cache Middleware Implementation

```typescript
import { KV } from '@cross/kv';

interface CacheConfig {
  path: string;
  ttl?: number; // Time to live in seconds
  maxMemoryCache?: number; // MB
}

class CacheMiddleware {
  private db: KV;
  private defaultTtl: number;

  constructor(config: CacheConfig) {
    this.db = new KV({
      autoSync: true,
      syncIntervalMs: 1000,
      ledgerCacheSize: config.maxMemoryCache || 50,
      disableIndex: false
    });
    this.defaultTtl = config.ttl || 300; // 5 minutes default
  }

  async initialize() {
    await this.db.open('./cache.db');
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const cacheEntry = {
      data: value,
      expiresAt: Date.now() + ((ttl || this.defaultTtl) * 1000)
    };
    await this.db.set(["cache", key], cacheEntry);
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const entry = await this.db.get<CacheEntry<T>>(["cache", key]);
      if (!entry) return null;
      
      if (entry.isExpired()) {
        await this.delete(key);
        return null;
      }
      
      return entry.data;
    } catch (error) {
      return null; // Treat as cache miss
    }
  }

  async delete(key: string): Promise<void> {
    await this.db.delete(["cache", key]);
  }

  async clear(): Promise<void> {
    for await (const entry of this.db.iterate(["cache"])) {
      await this.db.delete(entry.key);
    }
  }

  async close(): Promise<void> {
    await this.db.close();
  }
}
```

---

## Conclusion

The `@cross/kv` package provides a robust, file-based key-value storage solution ideal for cache implementations. While it lacks built-in expiration handling, its ACID transaction support, automatic synchronization, and cross-platform compatibility make it excellent for cache middleware development.

**Key Advantages for Cache Use:**
- No external dependencies or authentication required
- ACID transactions for data consistency
- Automatic synchronization for multi-process scenarios
- Cross-platform compatibility (Node.js, Deno, Bun)
- High performance with configurable memory caching

**Considerations:**
- Implement custom expiration handling
- Monitor memory usage with `ledgerCacheSize`
- Use transactions for batch operations
- Consider file system security for multi-user environments
#!/bin/bash

# This script assumes it's run from the root of 'bun-hono-vue-rpc'

echo "🚀 Integrating Drizzle, Zod, and drizzle-zod..."

# --- 1. Update Server Dependencies ---
echo "📦 Updating 'apps/server' dependencies..."
cd apps/server
bun add drizzle-orm drizzle-zod @drizzle-team/bun-sqlite
bun add -d drizzle-kit
cd ../..

# --- 2. Create Server Database Schema ---
echo "📝 Creating database schema 'apps/server/src/db/schema.ts'..."
mkdir -p apps/server/src/db
cat << 'EOF' > apps/server/src/db/schema.ts
import { sqliteTable, text, integer, serial } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { z } from 'zod';

// Drizzle Table
export const users = sqliteTable('users', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  age: integer('age').notNull(),
});

// Zod Schemas
export const insertUserSchema = createInsertSchema(users, {
  name: z.string().min(1, { message: 'Name is required' }),
  age: z.number().int().positive({ message: 'Age must be a positive number' }),
}).omit({ id: true }); // Omit id for insertion

export const selectUserSchema = createSelectSchema(users);

// Export types for the client to import!
export type User = z.infer<typeof selectUserSchema>;
export type NewUser = z.infer<typeof insertUserSchema>;
EOF

# --- 3. Create Drizzle Config ---
echo "⚙️  Creating 'apps/server/drizzle.config.ts'..."
cat << 'EOF' > apps/server/drizzle.config.ts
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'sqlite',
  driver: 'bun:sqlite',
  dbCredentials: {
    url: './sqlite.db', // This file will be created in apps/server
  },
} satisfies Config;
EOF

# --- 4. Create Migration Script ---
echo "📜 Creating migration script 'apps/server/src/db/migrate.ts'..."
cat << 'EOF' > apps/server/src/db/migrate.ts
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { migrate } from 'drizzle-orm/bun-sqlite/migrator';
import { Database } from 'bun:sqlite';
import { join } from 'path';

// Get the directory of the current file
const __dirname = new URL('.', import.meta.url).pathname;

// Go up one level (from src/db) to the 'server' root for the db file
const dbPath = join(__dirname, '..', '..', 'sqlite.db');
const sqlite = new Database(dbPath);
const db = drizzle(sqlite);

async function runMigrate() {
  try {
    console.log('Running migrations...');
    // Point to the drizzle folder in the 'server' root
    const migrationsPath = join(__dirname, '..', '..', 'drizzle');
    await migrate(db, { migrationsFolder: migrationsPath });
    console.log('Migrations completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrate();
EOF

# --- 5. Update Server Logic ---
echo "🔄 Updating 'apps/server/src/index.ts' to use Drizzle..."
cat << 'EOF' > apps/server/src/index.ts
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { z } from 'zod';
import { zValidator } from '@hono/zod-validator';
import { Database } from 'bun:sqlite';
import { drizzle } from 'drizzle-orm/bun-sqlite';
import { eq } from 'drizzle-orm';

// Import schema and schemas/types
import { users, insertUserSchema } from './db/schema';

// --- Database Setup ---
// This will create/use sqlite.db in the 'apps/server' directory
const sqlite = new Database('sqlite.db');
export const db = drizzle(sqlite);

// --- Hono Routes ---
const routes = new Hono()
  .get('/users', async (c) => {
    console.log('GET /users');
    const allUsers = await db.select().from(users).all();
    return c.json(allUsers);
  })
  .get('/user/:id', zValidator('param', z.object({ id: z.string().regex(/^\d+$/) })), async (c) => {
    const id = parseInt(c.req.param('id'));
    console.log(`GET /user/${id}`);
    
    const user = await db.select().from(users).where(eq(users.id, id)).get();

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    return c.json(user);
  })
  .post('/user', zValidator('json', insertUserSchema), async (c) => {
    const newUser = c.req.valid('json');
    console.log('POST /user', newUser);

    try {
      const [insertedUser] = await db.insert(users).values(newUser).returning();
      return c.json(insertedUser, 201);
    } catch (e: any) {
      return c.json({ error: 'Failed to create user', message: e.message }, 500);
    }
  });

// --- Main App ---
const app = new Hono().basePath('/api');

// CORS for client
app.use('*', cors({
  origin: 'http://localhost:5173',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
}));

// Mount RPC routes
app.route('/', routes);

console.log('Hono server with Drizzle running on http://localhost:3000');
console.log('Database file location: apps/server/sqlite.db');

export default {
  port: 3000,
  fetch: app.fetch,
};

// Export the *type* of the RPC routes for the client
export type AppType = typeof routes;
EOF

# --- 6. Update Client tsconfig.json ---
echo "🎨 Updating 'apps/client/tsconfig.json' for new type paths..."
# We replace the file from your context with this new one
cat << 'EOF' > apps/client/tsconfig.json
{
  "compilerOptions": {
    "target": "ESNext",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "jsx": "preserve",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "lib": ["ESNext", "DOM"],
    "skipLibCheck": true,
    "noEmit": true,

    // --- MONOREPO & VUE TYPING ---
    "types": ["vite/client"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      // This maps the RPC client type
      "server/src/index": ["../server/src/index.ts"],
      // This maps the Drizzle schema types
      "server/src/db/schema": ["../server/src/db/schema.ts"]
    }
    // --- END SECTION ---
  },
  "include": ["src/**/*.ts", "src/**/*.d.ts", "src/**/*.tsx", "src/**/*.vue"]
}
EOF

# --- 7. Update Client App.vue ---
echo "🎨 Updating 'apps/client/src/App.vue' to use new types..."
cat << 'EOF' > apps/client/src/App.vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { rpc } from './lib/rpc'
// --- Types from Server ---
// We now import our types *directly* from the server's single source of truth!
import type { User, NewUser } from 'server/src/db/schema'

// --- Component State ---
const users = ref<User[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

const newUserName = ref('Charlie')
const newUserAge = ref(30)

// --- API Functions ---
async function fetchUsers() {
  loading.value = true
  error.value = null
  try {
    const res = await rpc.users.$get()
    if (!res.ok) throw new Error('Failed to fetch users')
    // The response type is automatically validated against our `User[]` type
    users.value = await res.json()
  } catch (e: any) { error.value = e.message } 
  finally { loading.value = false }
}

async function fetchUserById() {
  loading.value = true
  error.value = null
  try {
    const res = await rpc.user[':id'].$get({
      param: { id: '1' },
    })
    
    if (res.status === 404) {
      alert('User 1 not found')
      throw new Error('User 1 not found')
    }
    if (!res.ok) throw new Error('Failed to fetch user 1')
    
    // This type is also known
    const user: User = await res.json()
    alert(`Fetched User 1: ${user.name}`)

  } catch (e: any) { error.value = e.message } 
  finally { loading.value = false }
}

async function createUser() {
  loading.value = true
  error.value = null
  try {
    // Our input type is imported directly from the server's Zod schema
    const newUser: NewUser = {
      name: newUserName.value,
      age: newUserAge.value,
    }

    const res = await rpc.user.$post({ json: newUser })

    if (res.status === 400) {
      // Zod validation errors will come back as 400
      const errData = await res.json()
      console.error('Validation Error:', errData)
      throw new Error(`Validation Error: Check console for details.`)
    }
    if (!res.ok) throw new Error('Failed to create user')
    
    await fetchUsers() // Refresh list
    newUserName.value = 'David'
    newUserAge.value = 40

  } catch (e: any) { error.value = e.message } 
  finally { loading.value = false }
}

onMounted(fetchUsers)
</script>

<template>
  <div class="app-container">
    <h1>Hono RPC + Vue 3 + Drizzle</h1>
    <p>Typesafe client connected to a Bun/SQLite server.</p>
    
    <div v-if="loading" class="status">Loading...</div>
    <div v-if="error" class="status error">Error: {{ error }}</div>
    
    <h2>Users</h2>
    <div class="controls">
      <button @click="fetchUsers">Refresh Users</button>
      <button @click="fetchUserById">Fetch User 1 (if exists)</button>
    </div>
    <ul v-if="users.length > 0">
      <li v-for="user in users" :key="user.id">
        {{ user.id }}: {{ user.name }} ({{ user.age }})
      </li>
    </ul>
    <p v-else>No users in the database.</p>

    <h2>Create User</h2>
    <form @submit.prevent="createUser">
      <div>
        <label>Name: </label>
        <input v-model="newUserName" />
      </div>
      <div>
        <label>Age: </label>
        <input v-model.number="newUserAge" type="number" />
      </div>
      <button type="submit">Create</button>
    </form>
  </div>
</template>

<style>
:root {
  font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;
  color-scheme: light dark;
  color: rgba(255, 255, 255, 0.87);
  background-color: #242424;
}
.app-container { max-width: 600px; margin: 20px auto; padding: 20px; }
h1, h2 { border-bottom: 1px solid #555; padding-bottom: 5px; }
ul { list-style: none; padding-left: 0; }
li { background: #333; padding: 8px; margin-bottom: 5px; border-radius: 4px; }
form { background: #2f2f2f; padding: 15px; border-radius: 8px; }
div { margin-bottom: 10px; }
input { margin-left: 5px; padding: 4px; border-radius: 4px; border: 1px solid #555; background: #444; color: #fff; }
button { margin-right: 10px; cursor: pointer; background: #4a67e8; color: white; border: none; padding: 8px 12px; border-radius: 4px; font-weight: bold; }
button:hover { background: #5a78f0; }
.status { padding: 10px; border-radius: 4px; }
.error { color: #ffc0c0; background: #5d2a2a; }
</style>
EOF

# --- 8. Update Root package.json ---
echo "📦 Updating root 'package.json' with database scripts..."
# We replace the file from your context with this new one
cat << 'EOF' > package.json
{
  "name": "bun-hono-vue-rpc",
  "private": true,
  "type": "module",
  "workspaces": [
    "apps/*"
  ],
  "scripts": {
    "dev:server": "bun --watch run apps/server/src/index.ts",
    "dev:client": "cd apps/client && bun run dev",
    "dev": "bun run dev:server & bun run dev:client",
    
    "build:client": "cd apps/client && bun run build",
    "build": "bun run build:client",

    "clean:modules": "find . -name \"node_modules\" -type d -prune -exec rm -rf '{}' +",
    "clean:dist": "find . -name \"dist\" -type d -prune -exec rm -rf '{}' +",
    "clean": "bun run clean:modules && bun run clean:dist && rm -f bun.lockb",

    "db:generate": "cd apps/server && bunx drizzle-kit generate",
    "db:migrate": "cd apps/server && bun run src/db/migrate.ts"
  }
}
EOF

# --- 9. Final Install ---
echo "🚚 Installing all workspace dependencies..."
bun install

echo ""
echo "-------------------------------------------------"
echo "✅ Drizzle Integration Complete!"
echo ""
echo "To run your app, you MUST run the database migrations first."
echo ""
echo "  1. Generate migration files:"
echo "     bun run db:generate"
echo ""
echo "  2. Apply migrations to the database:"
echo "     bun run db:migrate"
echo ""
echo "  3. Start the dev servers:"
echo "     bun run dev"
echo ""
echo "Open http://localhost:5173 in your browser."
echo "-------------------------------------------------"
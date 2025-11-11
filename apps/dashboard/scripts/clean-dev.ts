// scripts/clean-dev.ts
import fs from 'fs/promises'
import path from 'path'

// Modern color theme
const theme = {
  // Basic colors
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',

  // Foreground colors
  primary: '\x1b[38;5;75m', // Bright blue
  success: '\x1b[38;5;82m', // Bright green
  warning: '\x1b[38;5;220m', // Bright yellow
  error: '\x1b[38;5;196m', // Bright red
  info: '\x1b[38;5;159m', // Cyan
  purple: '\x1b[38;5;141m', // Purple
  orange: '\x1b[38;5;208m', // Orange
  gray: '\x1b[38;5;245m', // Gray
  white: '\x1b[38;5;255m', // White

  // Background colors
  bgDark: '\x1b[48;5;235m', // Dark gray background
  bgBlue: '\x1b[48;5;24m', // Blue background
  bgGreen: '\x1b[48;5;22m', // Green background
  bgRed: '\x1b[48;5;52m' // Red background
}

// Modern icon set
const icons = {
  rocket: '🚀',
  fire: '🔥',
  star: '⭐',
  gem: '💎',
  crown: '👑',
  magic: '✨',
  warning: '⚠️',
  success: '✅',
  error: '❌',
  info: 'ℹ️',
  folder: '📁',
  file: '📄',
  image: '🖼️',
  code: '💻',
  data: '📊',
  globe: '🌐',
  map: '🗺️',
  chat: '💬',
  bolt: '⚡',
  shield: '🛡️',
  key: '🔑',
  link: '🔗',
  clean: '🧹',
  trash: '🗑️',
  check: '✓',
  cross: '✗',
  arrow: '→',
  loading: '⏳'
}

// Formatting tools
const fmt = {
  title: (text: string) => `${theme.bold}${theme.primary}${text}${theme.reset}`,
  subtitle: (text: string) => `${theme.purple}${text}${theme.reset}`,
  success: (text: string) => `${theme.success}${text}${theme.reset}`,
  error: (text: string) => `${theme.error}${text}${theme.reset}`,
  warning: (text: string) => `${theme.warning}${text}${theme.reset}`,
  info: (text: string) => `${theme.info}${text}${theme.reset}`,
  highlight: (text: string) => `${theme.bold}${theme.white}${text}${theme.reset}`,
  dim: (text: string) => `${theme.dim}${theme.gray}${text}${theme.reset}`,
  orange: (text: string) => `${theme.orange}${text}${theme.reset}`,

  // Text with background
  badge: (text: string, bg: string = theme.bgBlue) =>
    `${bg}${theme.white}${theme.bold} ${text} ${theme.reset}`,

  // Gradient effect simulation
  gradient: (text: string) => {
    const colors = ['\x1b[38;5;75m', '\x1b[38;5;81m', '\x1b[38;5;87m', '\x1b[38;5;159m']
    const chars = text.split('')
    return chars.map((char, i) => `${colors[i % colors.length]}${char}`).join('') + theme.reset
  }
}

// Create modern title banner
function createModernBanner() {
  console.log()
  console.log(
    fmt.gradient('  ╔══════════════════════════════════════════════════════════════════╗')
  )
  console.log(
    fmt.gradient('  ║                                                                  ║')
  )
  console.log(
    `  ║               ${icons.rocket} ${fmt.title('ART DESIGN PRO')} ${fmt.subtitle('· Code Cleanup Program')} ${icons.magic}                ║`
  )
  console.log(
    `  ║               ${fmt.dim('Remove demo data from project, switch to development mode')}             ║`
  )
  console.log(
    fmt.gradient('  ║                                                                  ║')
  )
  console.log(
    fmt.gradient('  ╚══════════════════════════════════════════════════════════════════╝')
  )
  console.log()
}

// Create divider
function createDivider(char = '─', color = theme.primary) {
  console.log(`${color}${'  ' + char.repeat(66)}${theme.reset}`)
}

// Create card-style container
function createCard(title: string, content: string[]) {
  console.log(`  ${fmt.badge('', theme.bgBlue)} ${fmt.title(title)}`)
  console.log()
  content.forEach((line) => {
    console.log(`     ${line}`)
  })
  console.log()
}

// Progress bar animation
function createProgressBar(current: number, total: number, text: string, width = 40) {
  const percentage = Math.round((current / total) * 100)
  const filled = Math.round((current / total) * width)
  const empty = width - filled

  const filledBar = '█'.repeat(filled)
  const emptyBar = '░'.repeat(empty)

  process.stdout.write(
    `\r  ${fmt.info('Progress')} [${theme.success}${filledBar}${theme.gray}${emptyBar}${theme.reset}] ${fmt.highlight(percentage + '%')})}`
  )

  if (current === total) {
    console.log()
  }
}

// Statistics
const stats = {
  deletedFiles: 0,
  deletedPaths: 0,
  failedPaths: 0,
  startTime: Date.now(),
  totalFiles: 0
}

// Cleanup targets
const targets = [
  'README.md',
  'README.zh-CN.md',
  'src/views/change',
  // 'src/views/safeguard',
  'src/views/article',
  'src/views/examples',
  'src/views/system/nested',
  'src/views/widgets',
  'src/views/template',
  'src/views/dashboard/analysis',
  'src/views/dashboard/console',
  'src/mock/json',
  'src/mock/temp/articleList.ts',
  'src/mock/temp/commentDetail.ts',
  'src/mock/temp/commentList.ts',
  'src/assets/img/cover',
  // 'src/assets/img/safeguard',
  'src/assets/img/3d',
  'src/components/core/charts/art-map-chart',
  'src/components/custom/comment-widget'
]

// Recursively count files
async function countFiles(targetPath: string): Promise<number> {
  const fullPath = path.resolve(process.cwd(), targetPath)

  try {
    const stat = await fs.stat(fullPath)

    if (stat.isFile()) {
      return 1
    } else if (stat.isDirectory()) {
      const entries = await fs.readdir(fullPath)
      let count = 0

      for (const entry of entries) {
        const entryPath = path.join(targetPath, entry)
        count += await countFiles(entryPath)
      }

      return count
    }
  } catch {
    return 0
  }

  return 0
}

// Count files for all targets
async function countAllFiles(): Promise<number> {
  let totalCount = 0

  for (const target of targets) {
    const count = await countFiles(target)
    totalCount += count
  }

  return totalCount
}

// Delete files and directories
async function remove(targetPath: string, index: number) {
  const fullPath = path.resolve(process.cwd(), targetPath)

  createProgressBar(index + 1, targets.length, targetPath)

  try {
    const fileCount = await countFiles(targetPath)
    await fs.rm(fullPath, { recursive: true, force: true })
    stats.deletedFiles += fileCount
    stats.deletedPaths++
    await new Promise((resolve) => setTimeout(resolve, 50))
  } catch (err) {
    stats.failedPaths++
    console.log()
    console.log(`     ${icons.error} ${fmt.error('Deletion failed')}: ${fmt.highlight(targetPath)}`)
    console.log(`     ${fmt.dim('Error details: ' + err)}`)
  }
}

// Clean route modules
async function cleanRouteModules() {
  const modulesPath = path.resolve(process.cwd(), 'src/router/modules')

  try {
    // Remove demo-related route modules
    const modulesToRemove = [
      'template.ts',
      'widgets.ts',
      'examples.ts',
      'article.ts',
      // 'safeguard.ts',
      'help.ts'
    ]

    for (const module of modulesToRemove) {
      const modulePath = path.join(modulesPath, module)
      try {
        await fs.rm(modulePath, { force: true })
      } catch {
        // Ignore errors when file doesn't exist
      }
    }

    // Rewrite dashboard.ts - keep only console
    const dashboardContent = `import { AppRouteRecord } from '@/types/router'

export const dashboardRoutes: AppRouteRecord = {
  name: 'Dashboard',
  path: '/dashboard',
  component: '/index/index',
  meta: {
    title: 'menus.dashboard.title',
    icon: 'ri:shopping-bag-4-line',
    roles: ['USER', 'ADMIN']
  },
  children: [
    {
      path: 'ecommerce',
      name: 'Ecommerce',
      component: '/dashboard',
      meta: {
        title: 'menus.dashboard.ecommerce',
        keepAlive: false,
        fixedTab: true
      }
    }
  ]
}
`
    await fs.writeFile(path.join(modulesPath, 'dashboard.ts'), dashboardContent, 'utf-8')

    // Rewrite system.ts - remove nested menu
    const systemContent = `import { AppRouteRecord } from '@/types/router'

export const systemRoutes: AppRouteRecord = {
  path: '/system',
  name: 'System',
  component: '/index/index',
  meta: {
    title: 'menus.system.title',
    icon: 'ri:shopping-bag-4-line',
    roles: ['USER', 'ADMIN']
  },
  children: [
    {
      path: 'user',
      name: 'User',
      component: '/system/user',
      meta: {
        title: 'menus.system.user',
        keepAlive: true,
        roles: ['USER', 'ADMIN']
      }
    },
    {
      path: 'role',
      name: 'Role',
      component: '/system/role',
      meta: {
        title: 'menus.system.role',
        keepAlive: true,
        roles: ['USER']
      }
    },
    {
      path: 'user-center',
      name: 'UserCenter',
      component: '/system/user-center',
      meta: {
        title: 'menus.system.userCenter',
        isHide: true,
        keepAlive: true,
        isHideTab: true
      }
    },
    {
      path: 'menu',
      name: 'Menus',
      component: '/system/menu',
      meta: {
        title: 'menus.system.menu',
        keepAlive: true,
        roles: ['USER'],
        authList: [
          { title: 'Add', authMark: 'add' },
          { title: 'Edit', authMark: 'edit' },
          { title: 'Delete', authMark: 'delete' }
        ]
      }
    }
  ]
}
`
    await fs.writeFile(path.join(modulesPath, 'system.ts'), systemContent, 'utf-8')

    // Rewrite index.ts - only import retained modules
    const indexContent = `import { AppRouteRecord } from '@/types/router'
import { dashboardRoutes } from './dashboard'
import { systemRoutes } from './system'
import { resultRoutes } from './result'
import { exceptionRoutes } from './exception'

/**
 * Export all modular routes
 */
export const routeModules: AppRouteRecord[] = [
  dashboardRoutes,
  systemRoutes,
  resultRoutes,
  exceptionRoutes
]
`
    await fs.writeFile(path.join(modulesPath, 'index.ts'), indexContent, 'utf-8')

    console.log(`     ${icons.success} ${fmt.success('Route modules cleanup completed')}`)
  } catch (err) {
    console.log(`     ${icons.error} ${fmt.error('Route modules cleanup failed')}`)
    console.log(`     ${fmt.dim('Error details: ' + err)}`)
  }
}

// Clean route alias
async function cleanRoutesAlias() {
  const routesAliasPath = path.resolve(process.cwd(), 'src/router/routesAlias.ts')

  try {
    const cleanedAlias = `/**
 * Public route alias
 # Store system-level public route paths, such as layout container, login page, etc.   
 */
export enum RoutesAlias {
  Layout = '/index/index', // Layout container
  Login = '/auth/login' // Login page
}
`

    await fs.writeFile(routesAliasPath, cleanedAlias, 'utf-8')
    console.log(
      `     ${icons.success} ${fmt.success('Route alias configuration rewrite completed')}`
    )
  } catch (err) {
    console.log(`     ${icons.error} ${fmt.error('Route alias cleanup failed')}`)
    console.log(`     ${fmt.dim('Error details: ' + err)}`)
  }
}

// Clean changelog
async function cleanChangeLog() {
  const changeLogPath = path.resolve(process.cwd(), 'src/mock/upgrade/changeLog.ts')

  try {
    const cleanedChangeLog = `import { ref } from 'vue'

interface UpgradeLog {
  version: string // Version number
  title: string // Update title
  date: string // Update date
  detail?: string[] // Update content
  requireReLogin?: boolean // Whether re-login is required
  remark?: string // Remarks
}

export const upgradeLogList = ref<UpgradeLog[]>([])
`

    await fs.writeFile(changeLogPath, cleanedChangeLog, 'utf-8')
    console.log(`     ${icons.success} ${fmt.success('Changelog data cleared completed')}`)
  } catch (err) {
    console.log(`     ${icons.error} ${fmt.error('Changelog cleanup failed')}`)
    console.log(`     ${fmt.dim('Error details: ' + err)}`)
  }
}

// Clean language files
async function cleanLanguageFiles() {
  const languageFiles = [
    { path: 'src/locales/langs/zh.json', name: 'Chinese language file' },
    { path: 'src/locales/langs/en.json', name: 'English language file' }
  ]

  for (const { path: langPath, name } of languageFiles) {
    try {
      const fullPath = path.resolve(process.cwd(), langPath)
      const content = await fs.readFile(fullPath, 'utf-8')
      const langData = JSON.parse(content)

      const menusToRemove = [
        'widgets',
        'template',
        'article',
        'examples',
        // 'safeguard',
        'plan',
        'help'
      ]

      if (langData.menus) {
        menusToRemove.forEach((menuKey) => {
          if (langData.menus[menuKey]) {
            delete langData.menus[menuKey]
          }
        })

        if (langData.menus.dashboard) {
          if (langData.menus.dashboard.analysis) {
            delete langData.menus.dashboard.analysis
          }
          if (langData.menus.dashboard.console) {
            delete langData.menus.dashboard.console
          }
        }

        if (langData.menus.system) {
          const systemKeysToRemove = [
            'nested',
            'menu1',
            'menu2',
            'menu21',
            'menu3',
            'menu31',
            'menu32',
            'menu321'
          ]
          systemKeysToRemove.forEach((key) => {
            if (langData.menus.system[key]) {
              delete langData.menus.system[key]
            }
          })
        }
      }

      await fs.writeFile(fullPath, JSON.stringify(langData, null, 2), 'utf-8')
      console.log(`     ${icons.success} ${fmt.success(`${name} cleanup completed`)}`)
    } catch (err) {
      console.log(`     ${icons.error} ${fmt.error(`${name} cleanup failed`)}`)
      console.log(`     ${fmt.dim('Error details: ' + err)}`)
    }
  }
}

// Clean fast enter component
async function cleanFastEnterComponent() {
  const fastEnterPath = path.resolve(process.cwd(), 'src/config/fastEnter.ts')

  try {
    const cleanedFastEnter = `/**
 * Quick entry configuration
 * Contains: application list, quick links, etc.
 */
import { WEB_LINKS } from '@/utils/constants'
import type { FastEnterConfig } from '@/types/config'

const fastEnterConfig: FastEnterConfig = {
  // Display condition (screen width)
  minWidth: 1200,
  // Application list
  applications: [
    {
      name: 'Console',
      description: 'System overview and data statistics',
      icon: 'ri:pie-chart-line',
      iconColor: '#377dff',
      enabled: true,
      order: 1,
      routeName: 'Console'
    },
    {
      name: 'Official Documentation',
      description: 'User guide and development documentation',
      icon: 'ri:bill-line',
      iconColor: '#ffb100',
      enabled: true,
      order: 2,
      link: WEB_LINKS.DOCS
    },
    {
      name: 'Technical Support',
      description: 'Technical support and issue feedback',
      icon: 'ri:user-location-line',
      iconColor: '#ff6b6b',
      enabled: true,
      order: 3,
      link: WEB_LINKS.COMMUNITY
    },
    {
      name: 'Bilibili',
      description: 'Technical sharing and communication',
      icon: 'ri:bilibili-line',
      iconColor: '#FB7299',
      enabled: true,
      order: 4,
      link: WEB_LINKS.BILIBILI
    }
  ],
  // Quick links
  quickLinks: [
    {
      name: 'Login',
      enabled: true,
      order: 1,
      routeName: 'Login'
    },
    {
      name: 'Register',
      enabled: true,
      order: 2,
      routeName: 'Register'
    },
    {
      name: 'Forgot Password',
      enabled: true,
      order: 3,
      routeName: 'ForgetPassword'
    },
    {
      name: 'Profile',
      enabled: true,
      order: 4,
      routeName: 'UserCenter'
    }
  ]
}

export default Object.freeze(fastEnterConfig)
`

    await fs.writeFile(fastEnterPath, cleanedFastEnter, 'utf-8')
    console.log(
      `     ${icons.success} ${fmt.success('Quick entry configuration cleanup completed')}`
    )
  } catch (err) {
    console.log(`     ${icons.error} ${fmt.error('Quick entry configuration cleanup failed')}`)
    console.log(`     ${fmt.dim('Error details: ' + err)}`)
  }
}

// Update menu API
async function updateMenuApi() {
  const apiPath = path.resolve(process.cwd(), 'src/api/system-manage.ts')

  try {
    const content = await fs.readFile(apiPath, 'utf-8')
    const updatedContent = content.replace(
      "url: '/api/system/menus'",
      "url: '/api/system/menus/simple'"
    )

    await fs.writeFile(apiPath, updatedContent, 'utf-8')
    console.log(`     ${icons.success} ${fmt.success('Menu API update completed')}`)
  } catch (err) {
    console.log(`     ${icons.error} ${fmt.error('Menu API update failed')}`)
    console.log(`     ${fmt.dim('Error details: ' + err)}`)
  }
}

// User confirmation function
async function getUserConfirmation(): Promise<boolean> {
  const { createInterface } = await import('readline')

  return new Promise((resolve) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout
    })

    console.log(
      `  ${fmt.highlight('Please enter')} ${fmt.success('yes')} ${fmt.highlight('to confirm cleanup operation, or press Enter to cancel')}`
    )
    console.log()
    process.stdout.write(`  ${icons.arrow} `)

    rl.question('', (answer: string) => {
      rl.close()
      resolve(answer.toLowerCase().trim() === 'yes')
    })
  })
}

// Show cleanup warning
async function showCleanupWarning() {
  createCard('Security Warning', [
    `${fmt.warning('This operation will permanently delete the following demo content and cannot be restored!')}`,
    `${fmt.dim('Please read the cleanup list carefully and confirm before proceeding')}`
  ])

  const cleanupItems = [
    {
      icon: icons.image,
      name: 'Image Resources',
      desc: 'Demo cover images, 3D images, operation images, etc.',
      color: theme.orange
    },
    {
      icon: icons.file,
      name: 'Demo Pages',
      desc: 'widgets、template、article、examples pages, etc.',
      color: theme.purple
    },
    {
      icon: icons.code,
      name: 'Route Module Files',
      desc: 'Delete demo route modules, keep only core modules (dashboard、system、result、exception)',
      color: theme.primary
    },
    {
      icon: icons.link,
      name: 'Route Alias',
      desc: 'Rewrite routesAlias.ts, remove demo route aliases',
      color: theme.info
    },
    {
      icon: icons.data,
      name: 'Mock Data',
      desc: 'Demo JSON data, article lists, comment data, etc.',
      color: theme.success
    },
    {
      icon: icons.globe,
      name: 'Multi-language Files',
      desc: 'Clean demo menu items from Chinese and English language packs',
      color: theme.warning
    },
    {
      icon: icons.map,
      name: 'Map Component',
      desc: 'Remove art-map-chart map component',
      color: theme.error
    },
    {
      icon: icons.chat,
      name: 'Comment Component',
      desc: 'Remove comment-widget comment component',
      color: theme.orange
    },
    {
      icon: icons.bolt,
      name: 'Quick Entry',
      desc: 'Remove analysis page, fireworks effects, chat, changelog, pricing, message management and other invalid items',
      color: theme.purple
    }
  ]

  console.log(`  ${fmt.badge('', theme.bgRed)} ${fmt.title('Content to be cleaned')}`)
  console.log()

  cleanupItems.forEach((item, index) => {
    console.log(`     ${item.color}${theme.reset} ${fmt.highlight(`${index + 1}. ${item.name}`)}`)
    console.log(`        ${fmt.dim(item.desc)}`)
  })

  console.log()
  console.log(`  ${fmt.badge('', theme.bgGreen)} ${fmt.title('Preserved function modules')}`)
  console.log()

  const preservedModules = [
    { name: 'Dashboard', desc: 'Ecommerce page' },
    { name: 'System', desc: 'System management module' },
    { name: 'Result', desc: 'Result pages' },
    { name: 'Exception', desc: 'Exception pages' },
    { name: 'Auth', desc: 'Login registration function' },
    { name: 'Core Components', desc: 'Core component library' }
  ]

  preservedModules.forEach((module) => {
    console.log(`     ${icons.check} ${fmt.success(module.name)} ${fmt.dim(`- ${module.desc}`)}`)
  })

  console.log()
  createDivider()
  console.log()
}

// Show statistics
async function showStats() {
  const duration = Date.now() - stats.startTime
  const seconds = (duration / 1000).toFixed(2)

  console.log()
  createCard('Cleanup Statistics', [
    `${fmt.success('Successfully deleted')}: ${fmt.highlight(stats.deletedFiles.toString())} files`,
    `${fmt.info('Paths involved')}: ${fmt.highlight(stats.deletedPaths.toString())} directories/files`,
    ...(stats.failedPaths > 0
      ? [
          `${icons.error} ${fmt.error('Deletion failed')}: ${fmt.highlight(stats.failedPaths.toString())} paths`
        ]
      : []),
    `${fmt.info('Time taken')}: ${fmt.highlight(seconds)} seconds`
  ])
}

// Create success banner
function createSuccessBanner() {
  console.log()
  console.log(
    fmt.gradient('  ╔══════════════════════════════════════════════════════════════════╗')
  )
  console.log(
    fmt.gradient('  ║                                                                  ║')
  )
  console.log(
    `  ║                  ${icons.star} ${fmt.success('Cleanup completed! Project is ready')} ${icons.rocket}                  ║`
  )
  console.log(
    `  ║                    ${fmt.dim('You can now start your development journey!')}                  ║`
  )
  console.log(
    fmt.gradient('  ║                                                                  ║')
  )
  console.log(
    fmt.gradient('  ╚══════════════════════════════════════════════════════════════════╝')
  )
  console.log()
}

// Main function
async function main() {
  // Clear screen and show banner
  console.clear()
  createModernBanner()

  // Show cleanup warning
  await showCleanupWarning()

  // Count files
  console.log(`  ${fmt.info('Counting files...')}`)
  stats.totalFiles = await countAllFiles()

  console.log(
    `  ${fmt.info('About to clean')}: ${fmt.highlight(stats.totalFiles.toString())} files`
  )
  console.log(`  ${fmt.dim(`Involving ${targets.length} directory/file paths`)}`)
  console.log()

  // User confirmation
  const confirmed = await getUserConfirmation()

  if (!confirmed) {
    console.log(`  ${fmt.warning('Operation cancelled, cleanup aborted')}`)
    console.log()
    return
  }

  console.log()
  console.log(`  ${icons.check} ${fmt.success('Confirmation successful, starting cleanup...')}`)
  console.log()

  // Start cleanup process
  console.log(`  ${fmt.badge('Step 1/6', theme.bgBlue)} ${fmt.title('Delete demo files')}`)
  console.log()
  for (let i = 0; i < targets.length; i++) {
    await remove(targets[i], i)
  }
  console.log()

  console.log(`  ${fmt.badge('Step 2/6', theme.bgBlue)} ${fmt.title('Clean route modules')}`)
  console.log()
  await cleanRouteModules()
  console.log()

  console.log(`  ${fmt.badge('Step 3/6', theme.bgBlue)} ${fmt.title('Rewrite route alias')}`)
  console.log()
  await cleanRoutesAlias()
  console.log()

  console.log(`  ${fmt.badge('Step 4/6', theme.bgBlue)} ${fmt.title('Clear changelog')}`)
  console.log()
  await cleanChangeLog()
  console.log()

  console.log(`  ${fmt.badge('Step 5/6', theme.bgBlue)} ${fmt.title('Clean language files')}`)
  console.log()
  await cleanLanguageFiles()
  console.log()

  console.log(`  ${fmt.badge('Step 6/7', theme.bgBlue)} ${fmt.title('Clean quick entry')}`)
  console.log()
  await cleanFastEnterComponent()
  console.log()

  console.log(`  ${fmt.badge('Step 7/7', theme.bgBlue)} ${fmt.title('Update menu API')}`)
  console.log()
  await updateMenuApi()

  // Show statistics
  await showStats()

  // Show success banner
  createSuccessBanner()
}

main().catch((err) => {
  console.log()
  console.log(`  ${icons.error} ${fmt.error('Cleanup script execution error')}`)
  console.log(`  ${fmt.dim('Error details: ' + err)}`)
  console.log()
  process.exit(1)
})

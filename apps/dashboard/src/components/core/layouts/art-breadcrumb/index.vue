<!-- Breadcrumb navigation -->
<template>
  <nav class="ml-2.5 max-lg:!hidden" aria-label="breadcrumb">
    <ul class="flex-c h-full">
      <li
        v-for="(item, index) in breadcrumbItems"
        :key="item.path"
        class="box-border flex-c h-7 text-sm leading-7"
      >
        <div
          :class="
            isClickable(item, index)
              ? 'c-p rounded tad-200 hover:bg-g-200 hover:[&_span]:text-g-600'
              : ''
          "
          @click="handleBreadcrumbClick(item, index)"
        >
          <span
            class="block max-w-46 overflow-hidden text-ellipsis whitespace-nowrap px-1.5 text-sm text-g-600 dark:text-g-800"
            >{{ formatMenuTitle(item.meta?.title as string) }}</span
          >
        </div>
        <div
          v-if="!isLastItem(index) && item.meta?.title"
          class="mx-1 text-sm not-italic text-g-500"
          aria-hidden="true"
        >
          /
        </div>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useRouter, useRoute } from 'vue-router'
  import type { RouteLocationMatched, RouteRecordRaw } from 'vue-router'
  import { formatMenuTitle } from '@/router/utils/utils'

  defineOptions({ name: 'ArtBreadcrumb' })

  export interface BreadcrumbItem {
    path: string
    meta: RouteRecordRaw['meta']
  }

  const route = useRoute()
  const router = useRouter()

  // Use computed instead of watch for better performance
  const breadcrumbItems = computed<BreadcrumbItem[]>(() => {
    const { matched } = route
    const matchedLength = matched.length

    // Handle home page situation
    if (!matchedLength || isHomeRoute(matched[0]!)) {
      return []
    }

    // Handle first-level menu and normal routes
    const firstRoute = matched[0]
    const isFirstLevel = firstRoute!.meta?.isFirstLevel
    const lastIndex = matchedLength - 1
    const currentRoute = matched[lastIndex]
    const currentRouteMeta = currentRoute!.meta

    let items = isFirstLevel
      ? [createBreadcrumbItem(currentRoute!)]
      : matched.map(createBreadcrumbItem)

    // Filter wrapper container: if there are multiple items and the first is a container route (like /outside), remove it
    if (items.length > 1 && isWrapperContainer(items[0]!)) {
      items = items.slice(1)
    }

    // Special handling for IFrame pages: if after filtering only one iframe page remains, or all items are wrapper containers, only show current page
    if (currentRouteMeta?.isIframe && (items.length === 1 || items.every(isWrapperContainer))) {
      return [createBreadcrumbItem(currentRoute!)]
    }

    return items
  })

  // Helper function: determine if it's a wrapper container route
  const isWrapperContainer = (item: BreadcrumbItem): boolean =>
    item.path === '/outside' && !!item.meta?.isIframe

  // Helper function: create breadcrumb item
  const createBreadcrumbItem = (route: RouteLocationMatched): BreadcrumbItem => ({
    path: route.path,
    meta: route.meta
  })

  // Helper function: determine if it's home page
  const isHomeRoute = (route: RouteLocationMatched): boolean => route.name === '/'

  // Helper function: determine if it's the last item
  const isLastItem = (index: number): boolean => {
    const itemsLength = breadcrumbItems.value.length
    return index === itemsLength - 1
  }

  // Helper function: determine if clickable
  const isClickable = (item: BreadcrumbItem, index: number): boolean =>
    item.path !== '/outside' && !isLastItem(index)

  // Helper function: find first valid child route
  const findFirstValidChild = (route: RouteRecordRaw) =>
    route.children?.find((child) => !child.redirect && !child.meta?.isHide)

  // Helper function: build full path
  const buildFullPath = (childPath: string): string => `/${childPath}`.replace('//', '/')

  // Handle breadcrumb click event
  async function handleBreadcrumbClick(item: BreadcrumbItem, index: number): Promise<void> {
    // If it's the last item or external link, don't process
    if (isLastItem(index) || item.path === '/outside') {
      return
    }

    try {
      // Cache route table search result
      const routes = router.getRoutes()
      const targetRoute = routes.find((route) => route.path === item.path)

      if (!targetRoute?.children?.length) {
        await router.push(item.path)
        return
      }

      const firstValidChild = findFirstValidChild(targetRoute)
      if (firstValidChild) {
        await router.push(buildFullPath(firstValidChild.path))
      } else {
        await router.push(item.path)
      }
    } catch (error) {
      console.error('Navigation failed:', error)
    }
  }
</script>

/**
 * Top bar functionality management composable
 * Provides configuration management and state control for top bar features
 */

import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useSettingStore } from '@/store/modules/setting'
import { headerBarConfig } from '@/config/headerBar'
import { HeaderBarFeatureConfig } from '@/types'

/**
 * Top bar feature management
 * @returns States and methods related to top bar features
 */
export function useHeaderBar() {
  const settingStore = useSettingStore()

  // Get top bar configuration
  const headerBarConfigRef = computed<HeaderBarFeatureConfig>(() => headerBarConfig)

  // Get related states from store
  const { showMenuButton, showFastEnter, showRefreshButton, showCrumbs, showLanguage } =
    storeToRefs(settingStore)

  /**
   * Check if a specific feature is enabled
   * @param feature Feature name
   * @returns Whether enabled
   */
  const isFeatureEnabled = (feature: keyof HeaderBarFeatureConfig): boolean => {
    return headerBarConfigRef.value[feature]?.enabled ?? false
  }

  /**
   * Get feature configuration information
   * @param feature Feature name
   * @returns Feature configuration information
   */
  const getFeatureConfig = (feature: keyof HeaderBarFeatureConfig) => {
    return headerBarConfigRef.value[feature]
  }

  // Check if menu button should be shown
  const shouldShowMenuButton = computed(() => {
    return isFeatureEnabled('menuButton') && showMenuButton.value
  })

  // Check if refresh button should be shown
  const shouldShowRefreshButton = computed(() => {
    return isFeatureEnabled('refreshButton') && showRefreshButton.value
  })

  // Check if fast enter should be shown
  const shouldShowFastEnter = computed(() => {
    return isFeatureEnabled('fastEnter') && showFastEnter.value
  })

  // Check if breadcrumb should be shown
  const shouldShowBreadcrumb = computed(() => {
    return isFeatureEnabled('breadcrumb') && showCrumbs.value
  })

  // Check if global search should be shown
  const shouldShowGlobalSearch = computed(() => {
    return isFeatureEnabled('globalSearch')
  })

  // Check if fullscreen button should be shown
  const shouldShowFullscreen = computed(() => {
    return isFeatureEnabled('fullscreen')
  })

  // Check if notification center should be shown
  const shouldShowNotification = computed(() => {
    return isFeatureEnabled('notification')
  })

  // Check if chat feature should be shown
  const shouldShowChat = computed(() => {
    return isFeatureEnabled('chat')
  })

  // Check if language switch should be shown
  const shouldShowLanguage = computed(() => {
    return isFeatureEnabled('language') && showLanguage.value
  })

  // Check if settings panel should be shown
  const shouldShowSettings = computed(() => {
    return isFeatureEnabled('settings')
  })

  // Check if theme toggle should be shown
  const shouldShowThemeToggle = computed(() => {
    return isFeatureEnabled('themeToggle')
  })

  // Get minimum width for fast enter
  const fastEnterMinWidth = computed(() => {
    const config = getFeatureConfig('fastEnter')
    return (config as any)?.minWidth || 1200
  })

  /**
   * Check if feature is enabled (alias)
   * @param feature Feature name
   * @returns Whether enabled
   */
  const isFeatureActive = (feature: keyof HeaderBarFeatureConfig): boolean => {
    return isFeatureEnabled(feature)
  }

  /**
   * Get feature configuration (alias)
   * @param feature Feature name
   * @returns Feature configuration
   */
  const getFeatureInfo = (feature: keyof HeaderBarFeatureConfig) => {
    return getFeatureConfig(feature)
  }

  /**
   * Get all enabled features list
   * @returns Array of enabled feature names
   */
  const getEnabledFeatures = (): (keyof HeaderBarFeatureConfig)[] => {
    return Object.keys(headerBarConfigRef.value).filter(
      (key) => headerBarConfigRef.value[key as keyof HeaderBarFeatureConfig]?.enabled
    ) as (keyof HeaderBarFeatureConfig)[]
  }

  /**
   * Get all disabled features list
   * @returns Array of disabled feature names
   */
  const getDisabledFeatures = (): (keyof HeaderBarFeatureConfig)[] => {
    return Object.keys(headerBarConfigRef.value).filter(
      (key) => !headerBarConfigRef.value[key as keyof HeaderBarFeatureConfig]?.enabled
    ) as (keyof HeaderBarFeatureConfig)[]
  }

  /**
   * Get all enabled features (alias)
   * @returns Enabled features list
   */
  const getActiveFeatures = () => {
    return getEnabledFeatures()
  }

  /**
   * Get all disabled features (alias)
   * @returns Disabled features list
   */
  const getInactiveFeatures = () => {
    return getDisabledFeatures()
  }

  return {
    // Configuration
    headerBarConfig: headerBarConfigRef,

    // Display state computed properties
    shouldShowMenuButton, // Whether to show menu button
    shouldShowRefreshButton, // Whether to show refresh button
    shouldShowFastEnter, // Whether to show fast enter
    shouldShowBreadcrumb, // Whether to show breadcrumb
    shouldShowGlobalSearch, // Whether to show global search
    shouldShowFullscreen, // Whether to show fullscreen button
    shouldShowNotification, // Whether to show notification center
    shouldShowChat, // Whether to show chat feature
    shouldShowLanguage, // Whether to show language switch
    shouldShowSettings, // Whether to show settings panel
    shouldShowThemeToggle, // Whether to show theme toggle

    // Configuration related
    fastEnterMinWidth, // Fast enter minimum width

    // Methods
    isFeatureEnabled, // Check if feature is enabled
    isFeatureActive, // Check if feature is enabled (alias)
    getFeatureConfig, // Get feature configuration
    getFeatureInfo, // Get feature configuration (alias)
    getEnabledFeatures, // Get all enabled features
    getDisabledFeatures, // Get all disabled features
    getActiveFeatures, // Get all enabled features (alias)
    getInactiveFeatures // Get all disabled features (alias)
  }
}

/**
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

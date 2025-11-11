import { AppRouteRecord } from '@/types/router'
import { dashboardRoutes } from './dashboard'
import { systemRoutes } from './system'
import { resultRoutes } from './result'
import { exceptionRoutes } from './exception'
import { gameRoutes } from './game'
import { playerRoutes } from './player'
import { playerDetailRoutes } from './playerDetails'

/**
 * Export all modular routes
 */
export const routeModules: AppRouteRecord[] = [
  dashboardRoutes,
  systemRoutes,
  resultRoutes,
  exceptionRoutes,
  playerRoutes,
  gameRoutes,
  playerDetailRoutes
]

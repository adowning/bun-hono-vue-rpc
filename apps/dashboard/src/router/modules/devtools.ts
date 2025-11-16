import { AppRouteRecord } from '@/types/router'

export const devToolsRoutes: AppRouteRecord = {
    path: '/devtools',
    name: 'Devtools',
    component: '/devtools/index',
    // component: '/game/list',
    meta: {
        title: 'Devtools',
        icon: 'ri:tools-fill'
    }

}

export const playerRoutes = {
  name: 'Player',
  component: '/index/index',

  // component: '/player/list',
  roles: ['USER', 'OPERATOR'],
  meta: {
    title: 'Player Management',
    icon: 'User',
    order: 3
  },
  children: [
    {
      name: 'PlayerList',
      path: 'list',
      component: '/player/list',
      // component: () => import('@/views/player/index.vue'),
      meta: {
        title: 'Player List',
        icon: 'User'
      }
    },
    {
      name: 'PlayerDetail',
      path: 'detail/:id', // NEW: Dynamic route for player details
      // component: () => import('@/views/player/detail/index.vue'),
      component: '/player/detail',

      meta: {
        // title: 'Player Details',
        // icon: 'File',
        isHidden: true // Hide this from the sidebar menu
      }
    }
  ]
}

// export default playerRoutes

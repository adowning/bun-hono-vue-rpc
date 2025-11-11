export const playerDetailRoutes = {
  name: 'PlayerDetail',
  component: '/player/detail',
  path: 'player/detail/:id',
  isHidden: true,
  // component: '/player/list',
  // roles: ['USER', 'OPERATOR'],
  meta: {
    // title: 'Player Management',
    // icon: 'ri:account-box-2-line',
    isHidden: true
  }
}
//     path: 'detail/:id', // NEW: Dynamic route for player details
//     // component: () => import('@/views/player/detail/index.vue'),
//     component: '/player/detail',

//     meta: {
//       title: 'Player Details',
//       // icon: 'File',
//       isHidden: true // Hide this from the sidebar menu
//     }

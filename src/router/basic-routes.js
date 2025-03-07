export const basicRoutes = [
  {
    name: 'Login',
    path: '/login',
    component: () => import('@/views/login/index.vue'),
    meta: {
      title: '登录页',
      layout: 'empty',
    },
  },

  {
    name: 'Home',
    path: '/',
    component: () => import('@/views/home/index.vue'),
    meta: {
      title: '首页',
    },
  },

  {
    name: 'ReportManagement',
    path: '/report-management',
    component: () => import('@/views/report-management/index.vue'),
    meta: {
      title: '报表管理',
      requiresAuth: true
    },
  },

  {
    name: '404',
    path: '/404',
    component: () => import('@/views/error-page/404.vue'),
    meta: {
      title: '页面飞走了',
      layout: 'empty',
    },
  },

  {
    name: '403',
    path: '/403',
    component: () => import('@/views/error-page/403.vue'),
    meta: {
      title: '没有权限',
      layout: 'empty',
    },
  },
  // 游戏中心路由组
  {
    name: "GameCenter",
    path: '/games',
    children: [
      {
        name: 'Gomoku',
        path: 'gomoku',
        component: () => import('@/views/games/gomoku/index.vue'),
        meta: {
          title: '五子棋',
          requiresAuth: true
        },
      },
      {
        name: 'SnakeGame',
        path: 'snake',
        component: () => import('@/views/games/snake/index.vue'),
        meta: {
          title: '贪吃蛇',
          requiresAuth: true
        },
      },
      {
        name: 'FlappyBird',
        path: 'flappy',
        component: () => import('@/views/games/flappy/index.vue'),
        meta: {
          title: '飞鸟挑战',
          requiresAuth: true
        },
      }
    ]
  },
]

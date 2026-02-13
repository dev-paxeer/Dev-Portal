import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/pages/HomePage.vue'),
    },
    {
      path: '/network',
      name: 'network',
      component: () => import('@/pages/NetworkPage.vue'),
    },
    {
      path: '/contracts',
      name: 'contracts',
      component: () => import('@/pages/ContractsPage.vue'),
    },
    {
      path: '/contracts/:id',
      name: 'contract-detail',
      component: () => import('@/pages/ContractDetailPage.vue'),
    },
    {
      path: '/deploy',
      name: 'deploy',
      component: () => import('@/pages/DeployPage.vue'),
    },
    {
      path: '/scaffold',
      name: 'scaffold',
      component: () => import('@/pages/ScaffoldPage.vue'),
    },
    {
      path: '/rpc',
      name: 'rpc',
      component: () => import('@/pages/RpcPage.vue'),
    },
    {
      path: '/playground',
      name: 'playground',
      component: () => import('@/pages/PlaygroundPage.vue'),
    },
    {
      path: '/playground/:tool',
      name: 'playground-tool',
      component: () => import('@/pages/PlaygroundPage.vue'),
    },
    {
      path: '/getting-started',
      name: 'getting-started',
      component: () => import('@/pages/GettingStartedPage.vue'),
    },
  ],
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) return savedPosition
    return { top: 0 }
  },
})

export default router

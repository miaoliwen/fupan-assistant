import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomePage.vue'),
    },
    {
      path: '/reviews',
      name: 'reviews',
      component: () => import('@/views/ReviewsPage.vue'),
    },
    {
      path: '/reviews/new',
      name: 'new-review',
      component: () => import('@/views/NewReviewPage.vue'),
    },
    {
      path: '/reviews/:id',
      name: 'review-detail',
      component: () => import('@/views/ReviewDetailPage.vue'),
    },
    {
      path: '/stats',
      name: 'stats',
      component: () => import('@/views/StatsPage.vue'),
    },
    {
      path: '/insights',
      name: 'insights',
      component: () => import('@/views/InsightsPage.vue'),
    },
    {
      path: '/graph',
      name: 'graph',
      component: () => import('@/views/GraphPage.vue'),
    },
    {
      path: '/actions',
      name: 'actions',
      component: () => import('@/views/ActionsPage.vue'),
    },
  ],
})

export default router

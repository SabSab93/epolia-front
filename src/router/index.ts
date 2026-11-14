import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/inscription/choix-du-compte',
      name: 'choose-role',
      component: () => import('@/domains/auth/views/ChooseRoleView.vue'),
    },
    {
      path: '/inscription',
      name: 'register',
      component: () => import('@/domains/auth/views/RegisterView.vue'),
    },
    {
      path: '/connexion',
      name: 'login',
      component: () => import('@/domains/auth/views/LoginView.vue'),
    },
  ],
})

export default router

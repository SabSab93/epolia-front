import { createRouter, createWebHistory, type RouterHistory } from 'vue-router'
import HomeView from '@/HomeView.vue'
import { parseAccountRole } from '@/domains/auth/accountRole'

export function createAppRouter(history: RouterHistory) {
  const router = createRouter({
    history,
    routes: [
      {
        path: '/',
        name: 'home',
        component: HomeView,
      },
      {
        path: '/inscription/choix-du-compte',
        name: 'choose-role',
        meta: { title: 'Choisir un type de compte' },
        component: () => import('@/domains/auth/views/ChooseRoleView.vue'),
      },
      {
        path: '/inscription',
        name: 'register',
        meta: { title: 'Créer un compte' },
        component: () => import('@/domains/auth/views/RegisterView.vue'),
      },
      {
        path: '/connexion',
        name: 'login',
        meta: { title: 'Se connecter' },
        component: () => import('@/domains/auth/views/LoginView.vue'),
      },
    ],
  })

  router.beforeEach((to) => {
    if (to.name === 'register' && !parseAccountRole(to.query.role)) {
      return { name: 'choose-role' }
    }
  })

  router.afterEach((to, _from, failure) => {
    if (failure) return
    const title = to.meta.title
    document.title = typeof title === 'string' ? `${title} · Epolia` : 'Epolia'
  })

  return router
}

export default createAppRouter(createWebHistory(import.meta.env.BASE_URL))

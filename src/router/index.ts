import type { Pinia } from 'pinia'
import { createRouter, type RouterHistory } from 'vue-router'
import HomeView from '@/HomeView.vue'
import {
  studentSteps,
  stepDestination,
  firstStudentStepDestination,
} from '@/domains/onboarding/studentSteps'
import { parseAccountRole } from '@/domains/auth/accountRole'
import { AccountRoleEnum } from '@/domains/auth/models/enums/accountRole.enum'
import { useAuthStore } from '@/domains/auth/stores/authStore'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    studentOnly?: boolean
    studentStep?: string
  }
}

export function createAppRouter(history: RouterHistory, pinia?: Pinia) {
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
        component: () => import('@/domains/auth/views/AccountRoleSelection.vue'),
      },
      {
        path: '/inscription',
        name: 'register',
        meta: { title: 'Créer un compte' },
        component: () => import('@/domains/auth/views/RegisterView.vue'),
      },
      {
        path: '/compte/inscription/:role',
        name: 'additional-role',
        meta: { title: 'Ajouter un rôle', requiresAuth: true },
        props: (to) => ({ role: parseAccountRole(to.params.role) }),
        component: () => import('@/domains/auth/views/AdditionalRoleRegistration.vue'),
      },
      {
        path: '/compte/parcours-etudiant',
        component: () => import('@/domains/onboarding/views/StudentOnboarding.vue'),
        meta: { requiresAuth: true, studentOnly: true },
        children: [
          {
            path: '',
            name: 'student-onboarding',
            redirect: firstStudentStepDestination,
          },
          ...studentSteps.map((step) => ({
            path: step.id,
            ...stepDestination(step.id),
            meta: { title: step.title, studentStep: step.id },
            component: step.component,
          })),
        ],
      },
      { path: '/compte/etudes', redirect: { name: 'student-studies' } },
      {
        path: '/connexion',
        name: 'login',
        meta: { title: 'Se connecter' },
        component: () => import('@/domains/auth/views/LoginView.vue'),
      },
      {
        path: '/compte/confirmer-e-mail',
        name: 'email-verification',
        meta: { title: 'Confirmer votre adresse e-mail', requiresAuth: true },
        component: () => import('@/domains/auth/views/EmailVerificationView.vue'),
      },
    ],
  })

  router.beforeEach(async (to) => {
    if (to.name === 'register' && !parseAccountRole(to.query.role)) {
      return { name: 'choose-role' }
    }
    if (to.name === 'additional-role' && !parseAccountRole(to.params.role)) {
      return { name: 'home', replace: true }
    }
    if (to.matched.some(({ meta }) => meta.requiresAuth)) {
      const auth = useAuthStore(pinia)
      await auth.restore()
      if (!auth.isAuthenticated) return { name: 'login', replace: true }
      if (to.meta.studentOnly && !auth.user?.roles.includes(AccountRoleEnum.Student)) {
        return { name: 'home', replace: true }
      }
    }
  })

  router.afterEach((to, _from, failure) => {
    if (failure) return
    const title = to.meta.title
    document.title = typeof title === 'string' ? `${title} · Epolia` : 'Epolia'
  })

  return router
}

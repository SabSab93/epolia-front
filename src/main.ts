import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from '@/App.vue'
import { createWebHistory } from 'vue-router'
import { createAppRouter } from '@/router'
import '@/assets/main.css'

const themeColor = getComputedStyle(document.documentElement)
  .getPropertyValue('--color-epolia-page')
  .trim()

if (themeColor) {
  const themeMeta = document.createElement('meta')
  themeMeta.name = 'theme-color'
  themeMeta.content = themeColor
  document.head.append(themeMeta)
}

const pinia = createPinia()
const router = createAppRouter(createWebHistory(import.meta.env.BASE_URL), pinia)

createApp(App).use(pinia).use(router).mount('#app')

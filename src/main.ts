import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from '@/App.vue'
import router from '@/router'
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

createApp(App).use(createPinia()).use(router).mount('#app')

import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from '@/App.vue'
import router from '@/router'
import '@/assets/main.css'

const themeColor = getComputedStyle(document.documentElement)
  .getPropertyValue('--color-epolia-page')
  .trim()

if (themeColor) {
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColor)
}

createApp(App).use(createPinia()).use(router).mount('#app')

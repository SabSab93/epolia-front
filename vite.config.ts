import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import Icons from 'unplugin-icons/vite'
import { defineConfig, type Plugin } from 'vite'

// A production build must call the API over https. Plain http is only accepted for localhost,
// which never leaves the device: it lets the team run the build against a local API.
function checkApiUrl(apiUrl: string | undefined) {
  if (!apiUrl) {
    throw new Error('VITE_API_URL est obligatoire pour un build de production.')
  }

  const { protocol, hostname } = new URL(apiUrl)
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1'

  if (protocol !== 'https:' && !(protocol === 'http:' && isLocalhost)) {
    throw new Error('VITE_API_URL doit être en https pour un build de production.')
  }
}

const checkApiUrlPlugin: Plugin = {
  name: 'epolia:check-api-url',
  apply: 'build',
  configResolved(config) {
    // Storybook reuses this config but never calls the API.
    const isStorybook = process.env.STORYBOOK === 'true'

    if (config.mode === 'production' && !isStorybook) {
      checkApiUrl(config.env.VITE_API_URL)
    }
  },
}

export default defineConfig({
  plugins: [vue(), tailwindcss(), Icons({ compiler: 'vue3' }), checkApiUrlPlugin],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})

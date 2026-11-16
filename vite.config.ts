import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import Icons from 'unplugin-icons/vite'
import { defineConfig, type Plugin } from 'vite'

// A build must call the API over https. Plain http is only accepted for localhost,
// which never leaves the device: it lets the team run the build against a local API.
function checkApiUrl(apiUrl: string | undefined) {
  if (!apiUrl) {
    throw new Error("VITE_API_URL est obligatoire pour compiler l'application.")
  }

  let url: URL
  try {
    url = new URL(apiUrl)
  } catch {
    throw new Error(`VITE_API_URL n'est pas une URL valide : « ${apiUrl} ».`)
  }

  const { protocol, hostname } = url
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1'

  if (protocol !== 'https:' && !(protocol === 'http:' && isLocalhost)) {
    throw new Error('VITE_API_URL doit être en https (http accepté seulement pour localhost).')
  }
}

const checkApiUrlPlugin: Plugin = {
  name: 'epolia:check-api-url',
  apply: 'build',
  // Runs for every build, whatever the mode. Storybook removes it in .storybook/main.ts.
  configResolved(config) {
    checkApiUrl(config.env.VITE_API_URL)
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

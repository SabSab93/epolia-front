import type { StorybookConfig } from '@storybook/vue3-vite'
import { fileURLToPath, URL } from 'node:url'
import { mergeConfig } from 'vite'

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx|js|jsx|mjs)'],
  addons: ['@storybook/addon-docs'],
  framework: {
    name: '@storybook/vue3-vite',
    options: {
      docgen: 'vue-component-meta',
    },
  },
  viteFinal(config) {
    // Storybook never calls the API: drop the VITE_API_URL check of the app build.
    const plugins = (config.plugins ?? []).filter(
      (plugin) => !(plugin && 'name' in plugin && plugin.name === 'epolia:check-api-url'),
    )

    return mergeConfig(
      { ...config, plugins },
      {
        resolve: {
          alias: {
            '@': fileURLToPath(new URL('../src', import.meta.url)),
          },
        },
      },
    )
  },
}

export default config

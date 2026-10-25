import { setup, type Preview } from '@storybook/vue3'
import { configureStorybookApp } from '@/storybook/setup'
import '@/assets/main.css'

setup(configureStorybookApp)

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
}

export default preview

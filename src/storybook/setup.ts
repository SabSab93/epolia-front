import type { App } from 'vue'

// Docs renders several Vue applications in the same document.
let appId = 0

export function configureStorybookApp(app: App) {
  app.config.idPrefix = `storybook-${++appId}`
}

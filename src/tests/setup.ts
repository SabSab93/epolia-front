import '@testing-library/jest-dom/vitest'

// jsdom has no layout engine. Reka scrolls the highlighted dropdown option into view.
HTMLElement.prototype.scrollIntoView ??= () => {}

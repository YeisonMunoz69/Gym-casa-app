export function navigateToTab(tabId: 'dashboard' | 'routines' | 'session' | 'exercises' | 'settings') {
  window.dispatchEvent(new CustomEvent('app-navigate', { detail: tabId }))
}

import { ref, watchEffect } from 'vue'
import { useLocalStorage } from '@vueuse/core'

const theme = useLocalStorage<'dark' | 'light'>('paxeer-theme', 'dark')

export function useTheme() {
  const isDark = ref(theme.value === 'dark')

  watchEffect(() => {
    isDark.value = theme.value === 'dark'
    if (theme.value === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  })

  function toggle() {
    theme.value = theme.value === 'dark' ? 'light' : 'dark'
  }

  function setTheme(t: 'dark' | 'light') {
    theme.value = t
  }

  return { theme, isDark, toggle, setTheme }
}

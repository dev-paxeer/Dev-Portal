import { createApp } from 'vue'
import router from './router'
import './style.css'
import App from './App.vue'

const app = createApp(App)
app.use(router)
app.mount('#app')

// Apply dark mode on initial load
if (!localStorage.getItem('paxeer-theme') || localStorage.getItem('paxeer-theme') === '"dark"') {
  document.documentElement.classList.add('dark')
}

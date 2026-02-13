<script setup lang="ts">
import { ref } from 'vue'
import AppSidebar from './AppSidebar.vue'
import AppHeader from './AppHeader.vue'

const sidebarCollapsed = ref(true)

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
}
</script>

<template>
  <div class="min-h-screen bg-background">
    <AppSidebar :collapsed="sidebarCollapsed" />
    <div
      class="transition-all duration-300"
      :style="{ marginLeft: sidebarCollapsed ? '68px' : '220px' }"
    >
      <AppHeader
        :sidebar-collapsed="sidebarCollapsed"
        @toggle-sidebar="toggleSidebar"
      />
      <main class="min-h-[calc(100vh-4rem)]">
        <router-view />
      </main>
    </div>
  </div>
</template>

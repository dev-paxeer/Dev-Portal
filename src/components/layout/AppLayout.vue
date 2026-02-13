<script setup lang="ts">
import { ref } from 'vue'
import AppSidebar from './AppSidebar.vue'
import AppHeader from './AppHeader.vue'
import { Toaster } from '@/components/ui/sonner'

const sidebarCollapsed = ref(true)

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
}
</script>

<template>
  <div class="min-h-screen bg-background">
    <AppSidebar :collapsed="sidebarCollapsed" />
    <div
      class="transition-all duration-300 pb-16 sm:pb-0"
      :class="sidebarCollapsed ? 'sm:ml-[68px]' : 'sm:ml-[220px]'"
    >
      <AppHeader
        :sidebar-collapsed="sidebarCollapsed"
        @toggle-sidebar="toggleSidebar"
      />
      <div class="sm:hidden border-b border-border bg-muted/40 px-4 py-3">
        <div class="text-xs font-medium">Best on desktop</div>
        <div class="mt-1 text-xs text-muted-foreground">
          This portal is optimized for laptops/PCs. For the best experience, open it on a larger screen.
        </div>
      </div>
      <main class="min-h-[calc(100vh-4rem)]">
        <router-view />
      </main>
    </div>
    <Toaster />
  </div>
</template>

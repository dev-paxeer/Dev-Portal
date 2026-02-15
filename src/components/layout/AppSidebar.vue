<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const route = useRoute()

const navItems = [
  { path: '/', label: 'Home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1' },
  { path: '/network', label: 'Network', icon: 'M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9' },
  { path: '/contracts', label: 'Contracts', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { path: '/deploy', label: 'Deploy', icon: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12' },
  { path: '/scaffold', label: 'Scaffold', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
  { path: '/hackathon', label: 'Hackathon', icon: 'M8 21h8M12 17v4M7 4h10l-1 8H8L7 4zm3 0V3a2 2 0 114 0v1' },
  { path: '/rpc', label: 'RPC', icon: 'M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { path: '/playground', label: 'Playgrounds', icon: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664zM21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { path: '/getting-started', label: 'Get Started', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
]

const currentPath = computed(() => route.path)

defineProps<{
  collapsed?: boolean
}>()
</script>

<template>
  <aside
    :class="cn(
      'fixed z-40 flex bg-background shadow-lg transition-all duration-300',
      'bottom-0 left-0 right-0 h-16 flex-row border-t border-border sm:top-0 sm:right-auto sm:h-screen sm:flex-col sm:border-t-0',
      collapsed ? 'sm:w-[68px]' : 'sm:w-[220px]'
    )"
  >
    <div class="hidden sm:flex h-16 items-center gap-3 px-4">
      <div class="flex h-8 w-8 shrink-0 items-center justify-center">
        <img src="/paxeer_icon.svg" alt="Paxeer" class="h-7 w-7 brightness-0 dark:brightness-0 dark:invert" />
      </div>
      <div v-if="!collapsed" class="flex flex-col overflow-hidden">
        <span class="truncate text-sm font-semibold">Paxeer</span>
        <span class="truncate text-[11px] text-muted-foreground">Dev Portal</span>
      </div>
    </div>

    <nav class="flex-1 flex items-center justify-around gap-1 px-2 sm:block sm:space-y-1 sm:px-2 sm:py-3">
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="flex-1 sm:flex-none"
      >
        <Button
          :variant="(item.path === '/' ? currentPath === '/' : currentPath.startsWith(item.path)) ? 'secondary' : 'ghost'"
          size="sm"
          :class="cn(
            'w-full justify-center gap-3 px-0 sm:justify-start sm:px-3',
            collapsed && 'sm:justify-center sm:px-0'
          )"
        >
          <svg
            class="h-4 w-4 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="1.75"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path :d="item.icon" />
          </svg>
          <span v-if="!collapsed" class="hidden sm:inline">{{ item.label }}</span>
        </Button>
      </router-link>
    </nav>

    <div class="hidden sm:block p-3">
      <div
        :class="cn(
          'flex items-center gap-2 rounded-md bg-muted px-3 py-2',
          collapsed && 'justify-center px-2'
        )"
      >
        <span class="h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
        <div v-if="!collapsed" class="flex flex-col overflow-hidden">
          <span class="truncate text-xs font-medium">Mainnet</span>
          <span class="truncate text-[10px] text-muted-foreground">Chain 125</span>
        </div>
      </div>
    </div>
  </aside>
</template>

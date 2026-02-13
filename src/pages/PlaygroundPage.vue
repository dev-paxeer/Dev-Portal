<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { cn } from '@/lib/utils'

const route = useRoute()
const router = useRouter()

const playgrounds = [

  {
    slug: 'c10index',
    label: 'C10 Index',
    description: 'Crypto Top-10 Index Fund',
    url: 'https://c10index-typescript-client-production.up.railway.app',
    color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  },
  {
    slug: 'paxscan',
    label: 'Paxscan',
    description: 'Block Explorer API',
    url: 'https://paxscan-typescript-client-production.up.railway.app',
    color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  },
  {
    slug: 'stats',
    label: 'Stats',
    description: 'User & Protocol Statistics',
    url: 'https://stats-typescript-client-production.up.railway.app',
    color: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  },
  {
    slug: 'swap',
    label: 'Sidiora Swap',
    description: 'DEX Aggregator & Swap API',
    url: 'https://sidioraswap-typescript-client-production.up.railway.app',
    color: 'bg-pink-500/10 text-pink-400 border-pink-500/20',
  },
  {
    slug: 'graph',
    label: 'Sidiora Graph',
    description: 'On-chain Data & Analytics',
    url: 'https://sidioragraph-typescript-client-production.up.railway.app',
    color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  },
]

const activeSlug = computed(() => (route.params.tool as string) || '')
const activePlayground = computed(() => playgrounds.find(p => p.slug === activeSlug.value))
const iframeLoading = ref(true)

function selectPlayground(slug: string) {
  iframeLoading.value = true
  router.push(`/playground/${slug}`)
}

function onIframeLoad() {
  iframeLoading.value = false
}
</script>

<template>
  <div class="flex h-[calc(100vh-4rem)] flex-col">
    <!-- Tab bar -->
    <div class="flex items-center gap-1 border-b border-border bg-background/80 backdrop-blur-sm px-4 py-2 overflow-x-auto">
      <button
        v-for="pg in playgrounds"
        :key="pg.slug"
        :class="cn(
          'group relative flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm font-medium transition-all duration-200 whitespace-nowrap',
          activeSlug === pg.slug
            ? pg.color + ' border-current/20 shadow-sm'
            : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
        )"
        @click="selectPlayground(pg.slug)"
      >
        <span class="relative flex h-2 w-2">
          <span
            v-if="activeSlug === pg.slug"
            class="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-40"
          />
          <span
            :class="cn(
              'relative inline-flex h-2 w-2 rounded-full',
              activeSlug === pg.slug ? 'bg-current' : 'bg-muted-foreground/40'
            )"
          />
        </span>
        {{ pg.label }}
      </button>
    </div>

    <!-- Landing state (no playground selected) -->
    <div v-if="!activePlayground" class="flex-1 flex items-center justify-center p-8">
      <div class="max-w-3xl w-full">
        <div class="mb-8 text-center">
          <h1 class="text-2xl font-bold tracking-tight">API Playgrounds</h1>
          <p class="mt-2 text-muted-foreground">
            Interactive API explorers for all Paxeer protocol services. Select one to start making requests.
          </p>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            v-for="pg in playgrounds"
            :key="pg.slug"
            class="group flex flex-col items-start gap-3 rounded-xl border border-border bg-card p-5 text-left transition-all duration-200 hover:border-foreground/20 hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5"
            @click="selectPlayground(pg.slug)"
          >
            <div :class="cn('flex h-9 w-9 items-center justify-center rounded-lg border', pg.color)">
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                <path d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <div class="text-sm font-semibold group-hover:text-foreground">{{ pg.label }}</div>
              <div class="mt-0.5 text-xs text-muted-foreground">{{ pg.description }}</div>
            </div>
            <div class="mt-auto flex items-center gap-1 text-xs text-muted-foreground/60 group-hover:text-muted-foreground transition-colors">
              <span>Open playground</span>
              <svg class="h-3 w-3 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path d="M9 5l7 7-7 7"/></svg>
            </div>
          </button>
        </div>
      </div>
    </div>

    <!-- Iframe embed -->
    <div v-else class="relative flex-1">
      <!-- Loading overlay -->
      <div
        v-if="iframeLoading"
        class="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-sm"
      >
        <div class="flex flex-col items-center gap-3">
          <div class="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground/20 border-t-foreground" />
          <span class="text-sm text-muted-foreground">Loading {{ activePlayground.label }} playground...</span>
        </div>
      </div>
      <iframe
        :key="activePlayground.slug"
        :src="activePlayground.url"
        class="h-full w-full border-0"
        allow="clipboard-read; clipboard-write"
        @load="onIframeLoad"
      />
    </div>
  </div>
</template>

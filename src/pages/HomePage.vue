<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { getContractSummary } from '@/api/contracts'
import type { ContractSummary } from '@/api/contracts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

const summary = ref<ContractSummary | null>(null)
type NetworkStatusResponse = {
  timestamp: string
  summary: {
    validatorsTotal: number
    validatorsOnline: number
    validatorsOffline: number
    catchingUpCount: number
    maxHeight: number
    minHeight: number
    heightSkew: number
    avgRpcLatencyMs: number
  }
  validators: Array<{
    id: string
    ok: boolean
    net: { ok: boolean; peersCount: number } | null
  }>
}

type PaxscanStats = {
  coin_price: string | null
  coin_price_change_percentage: number | null
  market_cap: string | null
  tvl: string | null
  gas_prices?: {
    slow?: number
    average?: number
    fast?: number
  }
}

const status = ref<NetworkStatusResponse | null>(null)
const paxscan = ref<PaxscanStats | null>(null)
const animatedBlock = ref(0)
let pollTimer: ReturnType<typeof setInterval> | null = null

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { accept: 'application/json' } })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json() as Promise<T>
}

async function fetchData() {
  const [s, p, c] = await Promise.all([
    fetchJson<NetworkStatusResponse>('https://hyperpaxeer.com/api/network/status').catch(() => null),
    fetchJson<PaxscanStats>('https://paxscan.paxeer.app/api/v2/stats').catch(() => null),
    getContractSummary().catch(() => null),
  ])

  if (s) {
    status.value = s
    animateNumber(s.summary?.maxHeight ?? 0)
  }
  if (p) paxscan.value = p
  if (c) summary.value = c
}

function animateNumber(target: number) {
  const start = animatedBlock.value || Math.max(0, target - 200)
  const duration = 1500
  const startTime = performance.now()

  function step(now: number) {
    const elapsed = now - startTime
    const progress = Math.min(elapsed / duration, 1)
    const eased = 1 - Math.pow(1 - progress, 3)
    animatedBlock.value = Math.floor(start + (target - start) * eased)
    if (progress < 1) requestAnimationFrame(step)
  }
  requestAnimationFrame(step)
}

const formattedBlock = computed(() => animatedBlock.value.toLocaleString())

const totalPeers = computed(() => {
  const vals = status.value?.validators
  if (!vals?.length) return null
  let sum = 0
  let has = false
  for (const v of vals) {
    if (v.net?.ok && typeof v.net.peersCount === 'number') {
      sum += v.net.peersCount
      has = true
    }
  }
  return has ? sum : null
})

const gasPriceGwei = computed(() => {
  const avg = paxscan.value?.gas_prices?.average
  if (avg === null || avg === undefined) return null
  return avg
})



onMounted(() => {
  fetchData()
  pollTimer = setInterval(() => {
    fetchData().catch(() => {})
  }, 12_000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})

const features = [
  {
    title: 'Contract Registry',
    desc: '867+ verified smart contracts. Browse, search, and inspect Solidity source across 11 categories.',
    href: '/contracts',
    iconPath: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
  },
  {
    title: 'One-Click Deploy',
    desc: '15 production-ready contracts. Tokens, oracles, DEXes, vaults — deployed live in seconds.',
    href: '/deploy',
    iconPath: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12',
  },
  {
    title: 'Project Scaffold',
    desc: '17 starter templates. Contracts, dApps, and fullstack projects — generate, customize, ship.',
    href: '/scaffold',
    iconPath: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
  },
  {
    title: 'RPC Playground',
    desc: 'Interactive JSON-RPC console. 20 EVM methods against live mainnet — no setup required.',
    href: '/rpc',
    iconPath: 'M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
  },
]

const techStack = ['EVM Compatible', 'Cosmos SDK', 'Solidity ^0.8', 'ERC-20 / 721', 'JSON-RPC', 'Hardhat Ready']
</script>

<template>
  <div>
    <!-- ═══ HERO ═══ -->
    <section class="px-4 pb-10 pt-10 sm:px-6 sm:pb-16 sm:pt-16 lg:px-8 lg:pt-24">
      <div class="mx-auto w-full max-w-[1080px]">
        <div class="relative w-full overflow-hidden rounded-2xl bg-muted aspect-[4/5] sm:rounded-[32px] sm:aspect-[1080/500]">
          <video
            class="absolute inset-0 h-full w-full object-cover"
            autoplay
            muted
            loop
            playsinline
            preload="auto"
          >
            <source src="/silk-1770966821727.webm" type="video/webm" />
          </video>

          <div class="absolute inset-0 bg-background/40" />

          <div class="relative z-10 flex h-full flex-col items-center justify-center px-5 text-center sm:px-6">
            <Badge variant="secondary" class="mb-4 sm:mb-5">
              <span class="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Mainnet Live &mdash; Block #{{ formattedBlock }}
            </Badge>

            <h1 class="display-2 sm:display-1">
              Build on HyperPaxeer
            </h1>

            <p class="mx-auto mt-3 max-w-2xl body-default text-muted-foreground sm:mt-4">
              The developer platform for the next generation of decentralized applications.
              Deploy contracts, scaffold projects, and interact with the chain — all from one place.
            </p>

            <div class="mt-6 flex w-full flex-col gap-3 sm:mt-7 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:justify-center">
              <router-link to="/getting-started" class="w-full sm:w-auto">
                <Button size="lg" class="h-11 w-full sm:w-auto">
                  Get Started
                  <svg class="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </Button>
              </router-link>
              <router-link to="/deploy" class="w-full sm:w-auto">
                <Button variant="outline" size="lg" class="h-11 w-full sm:w-auto">
                  <svg class="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Deploy a Contract
                </Button>
              </router-link>
            </div>

            <div class="mt-6 flex flex-wrap items-center justify-center gap-2 sm:mt-8">
              <Badge v-for="t in techStack" :key="t" variant="secondary">{{ t }}</Badge>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ═══ LIVE STATS ═══ -->
    <section class="px-6 py-10 lg:px-8">
      <div class="mx-auto grid max-w-5xl grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-5">
        <Card class="text-center">
          <CardContent class="pt-6">
            <p class="font-mono text-2xl font-bold">{{ formattedBlock || '—' }}</p>
            <p class="mt-1 text-xs uppercase tracking-wider text-muted-foreground">Block Height</p>
          </CardContent>
        </Card>
        <Card class="text-center">
          <CardContent class="pt-6">
            <p class="font-mono text-2xl font-bold">
              {{ gasPriceGwei ?? '—' }}
              <span class="text-sm font-normal text-muted-foreground">gwei</span>
            </p>
            <p class="mt-1 text-xs uppercase tracking-wider text-muted-foreground">Gas Price</p>
          </CardContent>
        </Card>
        <Card class="text-center">
          <CardContent class="pt-6">
            <p class="font-mono text-2xl font-bold">{{ summary?.totalContracts?.toLocaleString() ?? '—' }}</p>
            <p class="mt-1 text-xs uppercase tracking-wider text-muted-foreground">SDK Contracts</p>
          </CardContent>
        </Card>
        <Card class="text-center">
          <CardContent class="pt-6">
            <p class="font-mono text-2xl font-bold">{{ totalPeers?.toLocaleString() ?? '—' }}</p>
            <p class="mt-1 text-xs uppercase tracking-wider text-muted-foreground">Peers</p>
          </CardContent>
        </Card>
        <Card class="text-center">
          <CardContent class="pt-6">
            <p class="font-mono text-2xl font-bold">125</p>
            <p class="mt-1 text-xs uppercase tracking-wider text-muted-foreground">Chain ID</p>
          </CardContent>
        </Card>
      </div>
    </section>

    <!-- ═══ FEATURES ═══ -->
    <section class="px-6 py-16 lg:px-8">
      <div class="mx-auto max-w-5xl">
        <div class="mb-12 text-center">
          <h2 class="heading-h2">Developer Tools</h2>
          <p class="mx-auto mt-3 max-w-xl body-default text-muted-foreground">
            From smart contract development to deployment — a complete toolkit designed for speed.
          </p>
        </div>

        <div class="grid gap-4 sm:grid-cols-2">
          <router-link
            v-for="feature in features"
            :key="feature.title"
            :to="feature.href"
            class="group"
          >
            <Card class="h-full transition-[transform,background-color,box-shadow] duration-200 ease-out hover:-translate-y-[2px] hover:bg-accent/50 hover:shadow-lg">
              <CardHeader>
                <div class="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <svg
                    class="h-5 w-5 text-foreground"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="1.5"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path :d="feature.iconPath" />
                  </svg>
                </div>
                <CardTitle>{{ feature.title }}</CardTitle>
                <CardDescription>{{ feature.desc }}</CardDescription>
              </CardHeader>
              <CardFooter>
                <span class="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                  Explore
                  <svg class="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </span>
              </CardFooter>
            </Card>
          </router-link>
        </div>
      </div>
    </section>

    <!-- ═══ QUICK START ═══ -->
    <section class="px-6 py-16 lg:px-8">
      <div class="mx-auto max-w-5xl">
        <div class="grid items-start gap-10 lg:grid-cols-2">
          <div>
            <Badge variant="secondary" class="mb-4">Quick Start</Badge>
            <h2 class="heading-h2">Connect in 30 seconds</h2>
            <p class="mt-4 body-default text-muted-foreground">
              Add HyperPaxeer to your project with a few lines of code.
              EVM-compatible — works with ethers.js, viem, wagmi, and Hardhat.
            </p>
            <div class="mt-6 flex flex-wrap gap-3">
              <router-link to="/getting-started">
                <Button>
                  <svg class="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Full Guide
                </Button>
              </router-link>
              <router-link to="/network">
                <Button variant="outline">Network Details</Button>
              </router-link>
            </div>
          </div>

          <Card class="overflow-hidden shadow-lg">
            <div class="flex items-center gap-2 px-4 py-3">
              <span class="h-3 w-3 rounded-full bg-destructive/60" />
              <span class="h-3 w-3 rounded-full bg-yellow-500/60" />
              <span class="h-3 w-3 rounded-full bg-emerald-500/60" />
              <span class="ml-2 text-xs text-muted-foreground">hardhat.config.ts</span>
            </div>
            <CardContent class="p-0">
              <pre class="overflow-x-auto p-5 text-sm leading-relaxed"><code class="text-foreground"><span class="text-muted-foreground">import</span> { HardhatUserConfig } <span class="text-muted-foreground">from</span> <span class="text-emerald-500">"hardhat/config"</span>;

<span class="text-muted-foreground">const</span> config: HardhatUserConfig = {
  networks: {
    hyperpaxeer: {
      url: <span class="text-emerald-500">"https://mainnet-beta.rpc.hyperpaxeer.com"</span>,
      chainId: <span class="text-amber-500">125</span>,
      accounts: [process.env.PRIVATE_KEY]
    }
  }
};</code></pre>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>

    <!-- ═══ CTA ═══ -->
    <section class="px-6 py-16 lg:px-8">
      <div class="mx-auto max-w-5xl">
        <Card class="shadow-xl">
          <CardHeader class="text-center">
            <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" class="text-foreground">
                <polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2" />
                <line x1="12" y1="22" x2="12" y2="15.5" />
                <polyline points="22 8.5 12 15.5 2 8.5" />
              </svg>
            </div>
            <CardTitle class="heading-h3">Ready to build?</CardTitle>
            <CardDescription class="mx-auto max-w-md body-small">
              HyperPaxeer combines Cosmos speed with full EVM compatibility.
              Build with Solidity, Hardhat, ethers.js — tools you already know.
            </CardDescription>
          </CardHeader>
          <CardFooter class="justify-center gap-3 pb-8">
            <router-link to="/scaffold">
              <Button size="lg">
                <svg class="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                Scaffold a Project
              </Button>
            </router-link>
            <a href="https://docs.hyperpaxeer.com" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="lg">
                Read the Docs
                <svg class="ml-1 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </Button>
            </a>
          </CardFooter>
        </Card>
      </div>
    </section>

    <!-- ═══ FOOTER ═══ -->
    <footer class="px-6 py-6">
      <div class="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
        <span class="text-sm text-muted-foreground">
          Paxeer Dev Portal &middot; HyperPaxeer Network
        </span>
        <div class="flex items-center gap-4">
          <a href="https://paxeer.app" target="_blank" rel="noopener noreferrer" class="text-xs text-muted-foreground transition-colors hover:text-foreground">Website</a>
          <a href="https://docs.hyperpaxeer.com" target="_blank" rel="noopener noreferrer" class="text-xs text-muted-foreground transition-colors hover:text-foreground">Docs</a>
          <a href="https://paxscan.paxeer.app" target="_blank" rel="noopener noreferrer" class="text-xs text-muted-foreground transition-colors hover:text-foreground">Explorer</a>
        </div>
      </div>
    </footer>
  </div>
</template>

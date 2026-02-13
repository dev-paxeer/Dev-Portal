<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { listContracts, getCategories, getProtocols, getContractSummary } from '@/api/contracts'
import type { ContractItem, ContractListResponse, ContractSummary } from '@/api/contracts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'

const router = useRouter()

const loading = ref(true)
const error = ref<string | null>(null)

const summary = ref<ContractSummary | null>(null)
const categories = ref<Array<{ name: string; id: number; count: number }>>([])
const protocols = ref<Array<{ name: string; count: number }>>([])

const response = ref<ContractListResponse | null>(null)
const items = computed<ContractItem[]>(() => response.value?.items ?? [])

const search = ref('')
const category = ref<string>('')
const protocol = ref<string>('')
const type = ref<string>('')
const page = ref(1)
const limit = ref(20)

const filtersOpen = ref(false)

const totalPages = computed(() => response.value?.totalPages ?? 1)

const activeFilterCount = computed(() => {
  let n = 0
  if (search.value.trim()) n++
  if (category.value) n++
  if (protocol.value) n++
  if (type.value) n++
  return n
})

function clearFilters() {
  search.value = ''
  category.value = ''
  protocol.value = ''
  type.value = ''
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // ignore
  }
}

function openContract(c: ContractItem) {
  router.push(`/contracts/${c.id}`)
}

async function fetchMeta() {
  const [s, cats, protos] = await Promise.all([
    getContractSummary().catch(() => null),
    getCategories().catch(() => []),
    getProtocols().catch(() => []),
  ])
  if (s) summary.value = s
  categories.value = cats
  protocols.value = protos
}

async function fetchList() {
  loading.value = true
  error.value = null
  try {
    response.value = await listContracts({
      search: search.value || undefined,
      category: category.value || undefined,
      protocol: protocol.value || undefined,
      type: type.value || undefined,
      page: page.value,
      limit: limit.value,
    })
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load contracts'
    response.value = null
  } finally {
    loading.value = false
  }
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null
watch([search, category, protocol, type, limit], () => {
  page.value = 1
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    fetchList()
  }, 250)
})

watch(page, () => {
  fetchList()
})

onMounted(async () => {
  await fetchMeta()
  await fetchList()
})

const showingRange = computed(() => {
  const p = response.value?.page ?? page.value
  const l = response.value?.limit ?? limit.value
  const t = response.value?.total ?? 0
  const start = t === 0 ? 0 : (p - 1) * l + 1
  const end = Math.min(t, (p - 1) * l + (response.value?.items.length ?? 0))
  return { start, end, total: t }
})

function fmtBytes(bytes: number) {
  if (!Number.isFinite(bytes)) return '—'
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  const mb = kb / 1024
  return `${mb.toFixed(2)} MB`
}
</script>

<template>
  <div class="px-6 py-12">
    <div class="mx-auto max-w-6xl">
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 class="heading-h1">Contract Registry</h1>
            <p class="mt-2 body-default text-muted-foreground">Verified source, fast filters, premium browsing.</p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{{ summary?.totalContracts?.toLocaleString() ?? '—' }} Total</Badge>
            <Badge variant="secondary">{{ summary?.protocols?.length ?? '—' }} Protocols</Badge>
            <Badge variant="secondary">{{ summary?.categories?.length ?? '—' }} Categories</Badge>
          </div>
        </div>

        <div class="sticky top-16 z-20 bg-background py-3">
          <Card class="shadow-xl">
            <CardContent class="pt-6">
              <!-- Mobile: single-row toolbar + expandable filters -->
              <div class="flex items-center gap-2 lg:hidden">
                <Input v-model="search" placeholder="Search contracts…" class="h-10 flex-1" />
                <Button
                  variant="secondary"
                  class="h-10"
                  @click="filtersOpen = !filtersOpen"
                >
                  Filters
                  <Badge v-if="activeFilterCount" variant="secondary" class="ml-2">{{ activeFilterCount }}</Badge>
                </Button>
              </div>

              <div v-if="filtersOpen" class="mt-3 space-y-3 lg:hidden">
                <Select v-model="category">
                  <SelectTrigger class="h-10 w-full">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All categories</SelectItem>
                    <SelectItem v-for="c in categories" :key="c.id" :value="c.name">
                      {{ c.name }} ({{ c.count }})
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select v-model="protocol">
                  <SelectTrigger class="h-10 w-full">
                    <SelectValue placeholder="All protocols" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All protocols</SelectItem>
                    <SelectItem v-for="p in protocols" :key="p.name" :value="p.name">
                      {{ p.name }} ({{ p.count }})
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select v-model="type">
                  <SelectTrigger class="h-10 w-full">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All types</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="interface">Interface</SelectItem>
                    <SelectItem value="library">Library</SelectItem>
                    <SelectItem value="abstract">Abstract</SelectItem>
                  </SelectContent>
                </Select>

                <div class="flex items-center gap-2">
                  <Button variant="secondary" class="h-10 flex-1" :disabled="activeFilterCount === 0" @click="clearFilters">Clear</Button>
                  <Button class="h-10 flex-1" :disabled="loading" @click="fetchList">Refresh</Button>
                </div>
              </div>

              <!-- Desktop: full toolbar -->
              <div class="hidden gap-3 lg:grid lg:grid-cols-[1fr_220px_220px_180px_auto]">
                <Input v-model="search" placeholder="Search contracts…" class="h-10" />

                <Select v-model="category">
                  <SelectTrigger class="h-10 w-full">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All categories</SelectItem>
                    <SelectItem v-for="c in categories" :key="c.id" :value="c.name">
                      {{ c.name }} ({{ c.count }})
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select v-model="protocol">
                  <SelectTrigger class="h-10 w-full">
                    <SelectValue placeholder="All protocols" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All protocols</SelectItem>
                    <SelectItem v-for="p in protocols" :key="p.name" :value="p.name">
                      {{ p.name }} ({{ p.count }})
                    </SelectItem>
                  </SelectContent>
                </Select>

                <Select v-model="type">
                  <SelectTrigger class="h-10 w-full">
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All types</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="interface">Interface</SelectItem>
                    <SelectItem value="library">Library</SelectItem>
                    <SelectItem value="abstract">Abstract</SelectItem>
                  </SelectContent>
                </Select>

                <div class="flex items-center justify-end gap-2">
                  <Button variant="secondary" class="h-10" :disabled="activeFilterCount === 0" @click="clearFilters">Clear</Button>
                  <Button class="h-10" :disabled="loading" @click="fetchList">Refresh</Button>
                </div>
              </div>

              <div class="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div class="text-xs text-muted-foreground">
                  Showing {{ showingRange.start }}–{{ showingRange.end }} of {{ showingRange.total.toLocaleString() }}
                </div>

                <div class="flex flex-wrap items-center gap-2">
                  <Select v-model="limit">
                    <SelectTrigger class="h-10 w-[120px]">
                      <SelectValue placeholder="Limit" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem :value="10">10</SelectItem>
                      <SelectItem :value="20">20</SelectItem>
                      <SelectItem :value="50">50</SelectItem>
                      <SelectItem :value="100">100</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button variant="secondary" class="h-10" :disabled="page <= 1 || loading" @click="page = Math.max(1, page - 1)">
                    Prev
                  </Button>
                  <Button variant="secondary" class="h-10" :disabled="page >= totalPages || loading" @click="page = Math.min(totalPages, page + 1)">
                    Next
                  </Button>
                  <Badge variant="secondary">{{ page }} / {{ totalPages }}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div v-if="error" class="py-6 text-sm text-muted-foreground">{{ error }}</div>

        <div v-else-if="loading" class="mt-2">
          <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card v-for="n in 9" :key="n" class="shadow-xl">
              <CardHeader class="pb-3">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0 flex-1">
                    <Skeleton class="h-5 w-3/4" />
                    <Skeleton class="mt-2 h-4 w-2/3" />
                  </div>
                  <Skeleton class="h-6 w-16 rounded-full" />
                </div>
              </CardHeader>
              <CardContent class="space-y-3">
                <div class="flex gap-2">
                  <Skeleton class="h-6 w-20 rounded-full" />
                  <Skeleton class="h-6 w-24 rounded-full" />
                </div>
                <div class="grid grid-cols-3 gap-3">
                  <Skeleton class="h-16 rounded-lg" />
                  <Skeleton class="h-16 rounded-lg" />
                  <Skeleton class="h-16 rounded-lg" />
                </div>
                <Skeleton class="h-4 w-1/2" />
              </CardContent>
            </Card>
          </div>
        </div>

        <div v-else>
          <ScrollArea class="h-[680px]">
            <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Card
                v-for="c in items"
                :key="c.id"
                class="group relative cursor-pointer shadow-xl transition-[transform,background-color,box-shadow] duration-200 ease-out hover:-translate-y-[2px] hover:bg-accent/30 hover:shadow-2xl"
                @click="openContract(c)"
              >
                <div class="absolute right-3 top-3 z-10 flex items-center gap-1 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                  <Button
                    variant="secondary"
                    size="icon-sm"
                    class="h-8 w-8"
                    @click.stop="copyText(c.id)"
                    title="Copy ID"
                  >
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M8 17H6a2 2 0 01-2-2V6a2 2 0 012-2h9a2 2 0 012 2v2" />
                      <rect x="8" y="8" width="14" height="14" rx="2" ry="2" />
                    </svg>
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon-sm"
                    class="h-8 w-8"
                    @click.stop="copyText(c.fileName)"
                    title="Copy file"
                  >
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <path d="M14 2v6h6" />
                    </svg>
                  </Button>
                  <Button
                    size="icon-sm"
                    class="h-8 w-8"
                    @click.stop="openContract(c)"
                    title="Open"
                  >
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M5 12h14" />
                      <path d="M13 5l7 7-7 7" />
                    </svg>
                  </Button>
                </div>

                <CardHeader class="pb-3">
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0 flex-1">
                      <CardTitle class="truncate">{{ c.name }}</CardTitle>
                      <CardDescription class="mt-1 truncate">{{ c.fileName }}</CardDescription>
                    </div>
                    <Badge variant="secondary" class="shrink-0">{{ c.type }}</Badge>
                  </div>
                </CardHeader>

                <CardContent class="space-y-3">
                  <div class="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{{ c.category }}</Badge>
                    <Badge variant="secondary">{{ c.protocol }}</Badge>
                  </div>

                  <div class="grid grid-cols-3 gap-3">
                    <div class="rounded-lg bg-muted p-3">
                      <div class="text-[10px] uppercase tracking-wider text-muted-foreground">Sol</div>
                      <div class="mt-1 font-mono text-xs">{{ c.solidityVersion }}</div>
                    </div>
                    <div class="rounded-lg bg-muted p-3">
                      <div class="text-[10px] uppercase tracking-wider text-muted-foreground">Lines</div>
                      <div class="mt-1 font-mono text-xs">{{ c.lines.toLocaleString() }}</div>
                    </div>
                    <div class="rounded-lg bg-muted p-3">
                      <div class="text-[10px] uppercase tracking-wider text-muted-foreground">Size</div>
                      <div class="mt-1 font-mono text-xs">{{ fmtBytes(c.size) }}</div>
                    </div>
                  </div>

                  <div class="flex items-center justify-between text-xs text-muted-foreground">
                    <span class="min-w-0 truncate font-mono">{{ c.id.slice(0, 10) }}…</span>
                    <span class="font-medium text-foreground">Open</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>

          <div v-if="items.length === 0" class="py-16 text-center text-sm text-muted-foreground">
            No contracts found.
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

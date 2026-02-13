<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type NetworkStatusSummary = {
  validatorsTotal: number
  validatorsOnline: number
  validatorsOffline: number
  catchingUpCount: number
  maxHeight: number
  minHeight: number
  heightSkew: number
  avgRpcLatencyMs: number
}

type ValidatorStatus = {
  id: string
  label: string
  ok: boolean
  endpoints: {
    rpc: string | null
    api: string | null
    grpc: string | null
    evmRpc: string | null
    evmWs: string | null
  }
  rpc: {
    ok: boolean
    latencyMs: number
    moniker: string
    nodeId: string
    network: string
    latestBlockHeight: number
    latestBlockTime: string
    catchingUp: boolean
  } | null
  api: {
    ok: boolean
    latencyMs: number
    appVersion: string
    moniker: string
  } | null
  evm: {
    ok: boolean
    latencyMs: number
    evmBlockNumber: number
    evmChainId: number
  } | null
  net: {
    ok: boolean
    latencyMs: number
    peersCount: number
  } | null
  errors: Record<string, string>
}

type NetworkStatusResponse = {
  timestamp: string
  summary: NetworkStatusSummary
  validators: ValidatorStatus[]
}

type PaxscanStats = {
  average_block_time: number
  coin_price: string | null
  coin_price_change_percentage: number | null
  market_cap: string | null
  tvl: string | null
  total_addresses: string | null
  total_transactions: string | null
  total_blocks: string | null
  transactions_today: string | null
  gas_prices?: {
    slow?: number
    average?: number
    fast?: number
  }
}

const status = ref<NetworkStatusResponse | null>(null)
const paxscan = ref<PaxscanStats | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)

let pollTimer: ReturnType<typeof setInterval> | null = null

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { accept: 'application/json' },
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json() as Promise<T>
}

async function fetchAll() {
  try {
    error.value = null
    const [s, p] = await Promise.all([
      fetchJson<NetworkStatusResponse>('https://hyperpaxeer.com/api/network/status'),
      fetchJson<PaxscanStats>('https://paxscan.paxeer.app/api/v2/stats'),
    ])
    status.value = s
    paxscan.value = p
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to fetch network status'
  } finally {
    loading.value = false
  }
}

const healthLabel = computed(() => {
  const s = status.value?.summary
  if (!s) return 'Unknown'
  if (s.validatorsOffline > 0) return 'Degraded'
  if (s.catchingUpCount > 0) return 'Catching Up'
  return 'Healthy'
})

const healthVariant = computed(() => {
  const s = status.value?.summary
  if (!s) return 'secondary'
  if (s.validatorsOffline > 0) return 'destructive'
  if (s.catchingUpCount > 0) return 'outline'
  return 'secondary'
})

function fmtNum(n: number | string | null | undefined) {
  if (n === null || n === undefined) return '—'
  const num = typeof n === 'string' ? Number(n) : n
  if (!Number.isFinite(num)) return String(n)
  return num.toLocaleString()
}

function fmtMoney(n: string | null | undefined) {
  if (!n) return '—'
  const num = Number(n)
  if (!Number.isFinite(num)) return n
  return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(num)
}

onMounted(() => {
  fetchAll()
  pollTimer = setInterval(fetchAll, 15_000)
})

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>

<template>
  <div class="px-6 py-12">
    <div class="mx-auto max-w-6xl">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 class="heading-h1">Network</h1>
          <p class="mt-2 body-default text-muted-foreground">
            Live validator health, RPC latency, and explorer metrics.
          </p>
        </div>
        <div class="flex items-center gap-2">
          <Badge :variant="healthVariant as any">{{ healthLabel }}</Badge>
          <Badge variant="secondary">Chain 125</Badge>
        </div>
      </div>

      <div v-if="error" class="mt-6">
        <Card class="shadow-lg">
          <CardHeader>
            <CardTitle>Network data unavailable</CardTitle>
            <CardDescription>{{ error }}</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card class="shadow-lg">
          <CardHeader>
            <CardDescription>Validators online</CardDescription>
            <CardTitle class="display-4">{{ status?.summary ? `${status.summary.validatorsOnline}/${status.summary.validatorsTotal}` : '—' }}</CardTitle>
          </CardHeader>
          <CardContent class="pt-0">
            <p class="body-small text-muted-foreground">Avg RPC latency {{ status?.summary ? `${status.summary.avgRpcLatencyMs}ms` : '—' }}</p>
          </CardContent>
        </Card>

        <Card class="shadow-lg">
          <CardHeader>
            <CardDescription>Block height</CardDescription>
            <CardTitle class="display-4">{{ fmtNum(status?.summary?.maxHeight) }}</CardTitle>
          </CardHeader>
          <CardContent class="pt-0">
            <p class="body-small text-muted-foreground">Height skew {{ fmtNum(status?.summary?.heightSkew) }}</p>
          </CardContent>
        </Card>

        <Card class="shadow-lg">
          <CardHeader>
            <CardDescription>PAX price</CardDescription>
            <CardTitle class="display-4">{{ fmtMoney(paxscan?.coin_price ?? null) }}</CardTitle>
          </CardHeader>
          <CardContent class="pt-0">
            <p class="body-small text-muted-foreground">
              24h {{ paxscan?.coin_price_change_percentage !== null && paxscan?.coin_price_change_percentage !== undefined ? `${paxscan.coin_price_change_percentage.toFixed(2)}%` : '—' }}
            </p>
          </CardContent>
        </Card>

        <Card class="shadow-lg">
          <CardHeader>
            <CardDescription>TVL</CardDescription>
            <CardTitle class="display-4">{{ fmtMoney(paxscan?.tvl ?? null) }}</CardTitle>
          </CardHeader>
          <CardContent class="pt-0">
            <p class="body-small text-muted-foreground">Market cap {{ fmtMoney(paxscan?.market_cap ?? null) }}</p>
          </CardContent>
        </Card>
      </div>

      <div class="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card class="shadow-lg">
          <CardHeader>
            <CardDescription>Total addresses</CardDescription>
            <CardTitle class="heading-h2">{{ fmtNum(paxscan?.total_addresses ?? null) }}</CardTitle>
          </CardHeader>
        </Card>
        <Card class="shadow-lg">
          <CardHeader>
            <CardDescription>Total transactions</CardDescription>
            <CardTitle class="heading-h2">{{ fmtNum(paxscan?.total_transactions ?? null) }}</CardTitle>
          </CardHeader>
        </Card>
        <Card class="shadow-lg">
          <CardHeader>
            <CardDescription>Transactions today</CardDescription>
            <CardTitle class="heading-h2">{{ fmtNum(paxscan?.transactions_today ?? null) }}</CardTitle>
          </CardHeader>
        </Card>
        <Card class="shadow-lg">
          <CardHeader>
            <CardDescription>Total blocks</CardDescription>
            <CardTitle class="heading-h2">{{ fmtNum(paxscan?.total_blocks ?? null) }}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <div class="mt-10">
        <div class="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 class="heading-h2">Validators</h2>
            <p class="mt-1 body-small text-muted-foreground">
              Updated {{ status?.timestamp ? new Date(status.timestamp).toLocaleString() : '—' }}
            </p>
          </div>
          <Badge variant="secondary">Polling 15s</Badge>
        </div>

        <Card class="shadow-xl">
          <CardContent class="pt-6">
            <Table>
              <TableHeader>
                <TableRow class="hover:bg-transparent">
                  <TableHead>Validator</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead class="text-right">RPC</TableHead>
                  <TableHead class="text-right">EVM</TableHead>
                  <TableHead class="text-right">Peers</TableHead>
                  <TableHead class="text-right">Height</TableHead>
                  <TableHead class="text-right">Catching up</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-if="loading" class="hover:bg-transparent">
                  <TableCell colspan="7" class="py-8 text-center text-muted-foreground">Loading…</TableCell>
                </TableRow>
                <TableRow v-for="v in status?.validators ?? []" :key="v.id">
                  <TableCell>
                    <div class="flex flex-col">
                      <span class="font-medium">{{ v.label }}</span>
                      <span class="text-xs text-muted-foreground">{{ v.rpc?.moniker ?? '—' }}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge :variant="v.ok ? 'secondary' : 'destructive'">{{ v.ok ? 'OK' : 'Down' }}</Badge>
                  </TableCell>
                  <TableCell class="text-right">
                    {{ v.rpc?.ok ? `${v.rpc.latencyMs}ms` : '—' }}
                  </TableCell>
                  <TableCell class="text-right">
                    {{ v.evm?.ok ? `${v.evm.latencyMs}ms` : '—' }}
                  </TableCell>
                  <TableCell class="text-right">
                    {{ v.net?.ok ? fmtNum(v.net.peersCount) : '—' }}
                  </TableCell>
                  <TableCell class="text-right">
                    {{ v.rpc?.latestBlockHeight ? fmtNum(v.rpc.latestBlockHeight) : '—' }}
                  </TableCell>
                  <TableCell class="text-right">
                    <Badge :variant="v.rpc?.catchingUp ? 'outline' : 'secondary'">
                      {{ v.rpc?.catchingUp ? 'Yes' : 'No' }}
                    </Badge>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { getHealthCheck, getNetworkInfo, type HealthCheck, type NetworkInfo } from '@/api/network'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

const router = useRouter()

const loading = ref(true)
const error = ref<string | null>(null)
const info = ref<NetworkInfo | null>(null)
const health = ref<HealthCheck | null>(null)

const evmChainId = computed(() => info.value?.evmChainId ?? null)
const rpcEvm = computed(() => info.value?.rpc.evmJsonRpc ?? '')
const rpcCosmos = computed(() => info.value?.rpc.cosmos ?? '')
const explorer = computed(() => info.value?.explorer.mainnet ?? '')

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // ignore
  }
}

async function fetchAll() {
  loading.value = true
  error.value = null
  try {
    const [i, h] = await Promise.all([getNetworkInfo(), getHealthCheck()])
    info.value = i
    health.value = h
  } catch (e: any) {
    error.value = e?.message ?? 'Failed to load network info'
  } finally {
    loading.value = false
  }
}

onMounted(fetchAll)
</script>

<template>
  <div class="px-6 py-12">
    <div class="mx-auto max-w-6xl">
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 class="heading-h1">Getting Started</h1>
            <p class="mt-2 body-default text-muted-foreground">Everything you need to ship on HyperPaxeer—fast.</p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">Onboarding</Badge>
            <Badge variant="secondary">Tooling</Badge>
            <Badge v-if="health" variant="secondary">{{ health.healthy ? 'RPC Healthy' : 'RPC Degraded' }}</Badge>
          </div>
        </div>

        <div v-if="error" class="text-sm text-muted-foreground">{{ error }}</div>

        <div class="grid gap-4 lg:grid-cols-3">
          <Card class="shadow-xl lg:col-span-2">
            <CardHeader>
              <CardTitle>Quickstart</CardTitle>
              <CardDescription>Pick a path: deploy a contract, scaffold a project, or call RPC.</CardDescription>
            </CardHeader>
            <CardContent class="space-y-4">
              <div class="grid gap-3 md:grid-cols-3">
                <Card class="shadow-xl">
                  <CardContent class="pt-6 space-y-2">
                    <div class="text-xs uppercase tracking-wider text-muted-foreground">Deploy</div>
                    <div class="text-sm text-muted-foreground">One-click deployment jobs with live status.</div>
                    <Button class="h-10 w-full" @click="router.push('/deploy')">Open Deploy</Button>
                  </CardContent>
                </Card>
                <Card class="shadow-xl">
                  <CardContent class="pt-6 space-y-2">
                    <div class="text-xs uppercase tracking-wider text-muted-foreground">Scaffold</div>
                    <div class="text-sm text-muted-foreground">Generate starter templates with preview + download.</div>
                    <Button class="h-10 w-full" @click="router.push('/scaffold')">Open Scaffold</Button>
                  </CardContent>
                </Card>
                <Card class="shadow-xl">
                  <CardContent class="pt-6 space-y-2">
                    <div class="text-xs uppercase tracking-wider text-muted-foreground">RPC</div>
                    <div class="text-sm text-muted-foreground">Allowlisted RPC console + curl exporter.</div>
                    <Button class="h-10 w-full" @click="router.push('/rpc')">Open RPC</Button>
                  </CardContent>
                </Card>
              </div>

              <Separator />

              <div class="space-y-3">
                <div class="text-sm font-medium">Step-by-step</div>

                <Card class="shadow-xl">
                  <CardContent class="pt-6 space-y-2">
                    <div class="flex items-center justify-between gap-3">
                      <div class="min-w-0">
                        <div class="font-medium">1) Browse verified contracts</div>
                        <div class="text-sm text-muted-foreground">Search by protocol/category and open full source.</div>
                      </div>
                      <Button variant="secondary" class="h-10" @click="router.push('/contracts')">Open</Button>
                    </div>
                  </CardContent>
                </Card>

                <Card class="shadow-xl">
                  <CardContent class="pt-6 space-y-2">
                    <div class="flex items-center justify-between gap-3">
                      <div class="min-w-0">
                        <div class="font-medium">2) Scaffold a project</div>
                        <div class="text-sm text-muted-foreground">Preview generated files before downloading.</div>
                      </div>
                      <Button variant="secondary" class="h-10" @click="router.push('/scaffold')">Open</Button>
                    </div>
                  </CardContent>
                </Card>

                <Card class="shadow-xl">
                  <CardContent class="pt-6 space-y-2">
                    <div class="flex items-center justify-between gap-3">
                      <div class="min-w-0">
                        <div class="font-medium">3) Deploy with status tracking</div>
                        <div class="text-sm text-muted-foreground">Submit a deployment job and watch it complete.</div>
                      </div>
                      <Button variant="secondary" class="h-10" @click="router.push('/deploy')">Open</Button>
                    </div>
                  </CardContent>
                </Card>

                <Card class="shadow-xl">
                  <CardContent class="pt-6 space-y-2">
                    <div class="flex items-center justify-between gap-3">
                      <div class="min-w-0">
                        <div class="font-medium">4) Use the RPC playground</div>
                        <div class="text-sm text-muted-foreground">Copy curl for automation and debugging.</div>
                      </div>
                      <Button variant="secondary" class="h-10" @click="router.push('/rpc')">Open</Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          <Card class="shadow-xl">
            <CardHeader>
              <div class="flex items-start justify-between gap-3">
                <div>
                  <CardTitle>Network</CardTitle>
                  <CardDescription>Live endpoints and chain IDs.</CardDescription>
                </div>
                <Button variant="secondary" class="h-10" :disabled="loading" @click="fetchAll">Refresh</Button>
              </div>
            </CardHeader>
            <CardContent class="space-y-3">
              <div class="rounded-xl bg-muted p-4">
                <div class="text-[10px] uppercase tracking-wider text-muted-foreground">EVM Chain ID</div>
                <div class="mt-2 font-mono text-sm">{{ evmChainId ?? '—' }}</div>
                <div class="mt-3">
                  <Button variant="secondary" class="h-9" :disabled="evmChainId == null" @click="copyText(String(evmChainId))">Copy</Button>
                </div>
              </div>

              <div class="rounded-xl bg-muted p-4">
                <div class="text-[10px] uppercase tracking-wider text-muted-foreground">EVM JSON-RPC</div>
                <div class="mt-2 break-all font-mono text-xs text-muted-foreground">{{ rpcEvm || '—' }}</div>
                <div class="mt-3 flex items-center gap-2">
                  <Button variant="secondary" class="h-9" :disabled="!rpcEvm" @click="copyText(rpcEvm)">Copy</Button>
                  <a v-if="rpcEvm" :href="rpcEvm" target="_blank" rel="noreferrer" class="text-sm text-muted-foreground hover:text-foreground">Open</a>
                </div>
              </div>

              <div class="rounded-xl bg-muted p-4">
                <div class="text-[10px] uppercase tracking-wider text-muted-foreground">Cosmos RPC</div>
                <div class="mt-2 break-all font-mono text-xs text-muted-foreground">{{ rpcCosmos || '—' }}</div>
                <div class="mt-3 flex items-center gap-2">
                  <Button variant="secondary" class="h-9" :disabled="!rpcCosmos" @click="copyText(rpcCosmos)">Copy</Button>
                  <a v-if="rpcCosmos" :href="rpcCosmos" target="_blank" rel="noreferrer" class="text-sm text-muted-foreground hover:text-foreground">Open</a>
                </div>
              </div>

              <div class="rounded-xl bg-muted p-4">
                <div class="text-[10px] uppercase tracking-wider text-muted-foreground">Explorer</div>
                <div class="mt-2 break-all font-mono text-xs text-muted-foreground">{{ explorer || '—' }}</div>
                <div class="mt-3 flex items-center gap-2">
                  <Button variant="secondary" class="h-9" :disabled="!explorer" @click="copyText(explorer)">Copy</Button>
                  <a v-if="explorer" :href="explorer" target="_blank" rel="noreferrer" class="text-sm text-muted-foreground hover:text-foreground">Open</a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>

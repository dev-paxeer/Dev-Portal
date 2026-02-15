<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import {
  getDeployHistory,
  getDeployStatus,
  getDeployableContract,
  listDeployableContracts,
  searchDeployableContracts,
  submitDeploy,
  type DeployJob,
  type DeployableContract,
} from '@/api/deploy'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

const router = useRouter()

const loading = ref(true)
const error = ref<string | null>(null)

const contracts = ref<DeployableContract[]>([])
const selectedId = ref<string>('')
const selected = ref<DeployableContract | null>(null)

const q = ref('')
const ownerAddress = ref('')
const constructorArgs = ref<Record<string, string>>({})

const submitting = ref(false)
const jobId = ref('')
const job = ref<DeployJob | null>(null)
const jobError = ref<string | null>(null)
const polling = ref(false)
let pollTimer: number | null = null

const didToastComplete = ref(false)
const didToastFailed = ref(false)

const historyLoading = ref(false)
const history = ref<DeployJob[]>([])
const historyError = ref<string | null>(null)

const canSubmit = computed(() => {
  if (!selected.value) return false
  if (!ownerAddress.value.trim()) return false
  return selected.value.constructorParams.every((p) => (constructorArgs.value[p.name] ?? '').trim() !== '')
})

function statusTone(s?: DeployJob['status']) {
  if (!s) return 'secondary'
  if (s === 'complete') return 'secondary'
  if (s === 'failed') return 'destructive'
  return 'secondary'
}

function fmtBytes(bytes: number) {
  if (!Number.isFinite(bytes)) return '—'
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  const mb = kb / 1024
  return `${mb.toFixed(2)} MB`
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // ignore
  }
}

async function fetchContracts() {
  loading.value = true
  error.value = null
  try {
    if (q.value.trim()) {
      const res = await searchDeployableContracts(q.value.trim())
      contracts.value = res.results
    } else {
      const res = await listDeployableContracts()
      contracts.value = res.contracts
    }

    if (!selectedId.value && contracts.value.length) selectedId.value = contracts.value[0]?.id ?? ''
  } catch (e: any) {
    error.value = e?.message ?? 'Failed to load deployable contracts'
  } finally {
    loading.value = false
  }
}

async function fetchSelected() {
  selected.value = null
  if (!selectedId.value) return
  try {
    const res = await getDeployableContract(selectedId.value)
    selected.value = res
    const nextArgs: Record<string, string> = {}
    for (const p of res.constructorParams) nextArgs[p.name] = constructorArgs.value[p.name] ?? ''
    constructorArgs.value = nextArgs
  } catch (e: any) {
    error.value = e?.message ?? 'Failed to load contract details'
  }
}

async function refreshHistory() {
  historyLoading.value = true
  historyError.value = null
  try {
    const res = await getDeployHistory(50)
    history.value = res.deployments
  } catch (e: any) {
    historyError.value = e?.message ?? 'Failed to load deployment history'
  } finally {
    historyLoading.value = false
  }
}

async function refreshJob() {
  if (!jobId.value.trim()) return
  polling.value = true
  jobError.value = null
  try {
    job.value = await getDeployStatus(jobId.value.trim())
  } catch (e: any) {
    jobError.value = e?.message ?? 'Failed to load job status'
  } finally {
    polling.value = false
  }
}

function startPolling() {
  if (pollTimer) window.clearInterval(pollTimer)
  pollTimer = window.setInterval(async () => {
    if (!jobId.value.trim()) return
    await refreshJob()
    if (job.value?.status === 'complete' || job.value?.status === 'failed') {
      stopPolling()
      refreshHistory()
    }
  }, 2500)
}

function stopPolling() {
  if (pollTimer) window.clearInterval(pollTimer)
  pollTimer = null
}

async function onSubmit() {
  if (!selected.value) return
  submitting.value = true
  jobError.value = null
  try {
    const args = selected.value.constructorParams.map((p) => constructorArgs.value[p.name] ?? '')
    const res = await submitDeploy(selected.value.id, args, ownerAddress.value.trim())
    jobId.value = res.jobId
    didToastComplete.value = false
    didToastFailed.value = false
    toast.success('Deployment job submitted', {
      description: `Job ${res.jobId.slice(0, 10)}… is now running. We'll keep updating the status automatically.`,
    })
    await refreshJob()
    startPolling()
  } catch (e: any) {
    jobError.value = e?.message ?? 'Failed to submit deployment'
    toast.error('Failed to submit deployment', {
      description: jobError.value ?? undefined,
    })
  } finally {
    submitting.value = false
  }
}

watch(
  () => job.value?.status,
  (status) => {
    if (!status) return
    if (status === 'complete' && !didToastComplete.value) {
      didToastComplete.value = true
      toast.success('Contract deployed', {
        description: job.value?.contractAddress
          ? `Deployed at ${job.value.contractAddress.slice(0, 10)}…`
          : 'Deployment completed successfully.',
      })
    }
    if (status === 'failed' && !didToastFailed.value) {
      didToastFailed.value = true
      toast.error('Deployment failed', {
        description: job.value?.error ? job.value.error.slice(0, 140) : 'The deployment job failed.',
      })
    }
  },
)

watch(
  () => q.value,
  () => {
    const t = window.setTimeout(fetchContracts, 250)
    return () => window.clearTimeout(t)
  },
)

watch(
  () => selectedId.value,
  async () => {
    await fetchSelected()
  },
)

onMounted(async () => {
  await fetchContracts()
  await fetchSelected()
  await refreshHistory()
})

onUnmounted(() => {
  stopPolling()
})
</script>

<template>
  <div class="px-6 py-12">
    <div class="mx-auto max-w-6xl">
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 class="heading-h1">Deploy</h1>
            <p class="mt-2 body-default text-muted-foreground">Submit a deployment job and track it live.</p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{{ contracts.length.toLocaleString() }} Contracts</Badge>
            <Badge v-if="job" :variant="statusTone(job.status)" class="uppercase">{{ job.status }}</Badge>
          </div>
        </div>

        <Tabs default-value="deploy" class="w-full">
          <TabsList class="w-full justify-start">
            <TabsTrigger value="deploy">Deploy</TabsTrigger>
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="deploy" class="mt-4">
            <div class="grid gap-4 lg:grid-cols-[420px_1fr]">
              <Card class="shadow-xl">
                <CardHeader>
                  <CardTitle>Contracts</CardTitle>
                  <CardDescription>Pick a contract and configure constructor parameters.</CardDescription>
                </CardHeader>
                <CardContent class="space-y-3">
                  <Input v-model="q" placeholder="Search deployable contracts…" class="h-10" />

                  <div v-if="error" class="text-sm text-muted-foreground">{{ error }}</div>

                  <ScrollArea class="h-[520px]">
                    <div class="space-y-2">
                      <Button
                        v-for="c in contracts"
                        :key="c.id"
                        variant="secondary"
                        class="h-auto w-full justify-between px-4 py-3 text-left"
                        :class="selectedId === c.id ? 'bg-accent/40' : ''"
                        @click="selectedId = c.id"
                      >
                        <div class="min-w-0">
                          <div class="truncate font-medium">{{ c.contractName }}</div>
                          <div class="mt-1 truncate text-xs text-muted-foreground">{{ c.sourceFile }}</div>
                        </div>
                        <Badge variant="secondary" class="shrink-0">{{ c.category }}</Badge>
                      </Button>

                      <div v-if="!loading && contracts.length === 0" class="py-10 text-center text-sm text-muted-foreground">
                        No contracts found.
                      </div>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              <Card class="shadow-xl">
                <CardHeader>
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0 flex-1">
                      <CardTitle class="truncate">{{ selected?.contractName ?? (loading ? 'Loading…' : 'Select a contract') }}</CardTitle>
                      <CardDescription class="mt-1 break-words line-clamp-3">{{ selected?.description ?? '' }}</CardDescription>
                    </div>
                    <div v-if="selected" class="flex min-w-0 flex-wrap items-center justify-end gap-2">
                      <Badge variant="secondary">ABI {{ selected.abiItemCount }}</Badge>
                      <Badge variant="secondary">{{ fmtBytes(selected.bytecodeSize) }}</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent v-if="selected" class="space-y-4">
                  <Card v-if="job?.status === 'complete'" class="shadow-xl">
                    <CardHeader>
                      <CardTitle class="text-base">What next?</CardTitle>
                      <CardDescription>
                        Your contract is deployed. Here are the most common next steps.
                      </CardDescription>
                    </CardHeader>
                    <CardContent class="space-y-4">
                      <div class="grid gap-3 sm:grid-cols-2">
                        <div class="rounded-xl bg-muted p-4">
                          <div class="text-[10px] uppercase tracking-wider text-muted-foreground">Contract Address</div>
                          <div class="mt-2 break-all font-mono text-sm">{{ job.contractAddress ?? '—' }}</div>
                          <div class="mt-3 flex flex-wrap items-center gap-2">
                            <Button
                              variant="secondary"
                              class="h-9"
                              :disabled="!job.contractAddress"
                              @click="copyText(job.contractAddress || ''); toast.success('Copied contract address')"
                            >
                              Copy
                            </Button>
                            <a
                              v-if="job.explorerUrl"
                              :href="job.explorerUrl"
                              target="_blank"
                              rel="noreferrer"
                              class="text-sm text-muted-foreground hover:text-foreground"
                            >
                              View on explorer
                            </a>
                          </div>
                        </div>

                        <div class="rounded-xl bg-muted p-4">
                          <div class="text-[10px] uppercase tracking-wider text-muted-foreground">Deploy Transaction</div>
                          <div class="mt-2 break-all font-mono text-sm">{{ job.txHash ?? '—' }}</div>
                          <div class="mt-3 flex flex-wrap items-center gap-2">
                            <Button
                              variant="secondary"
                              class="h-9"
                              :disabled="!job.txHash"
                              @click="copyText(job.txHash || ''); toast.success('Copied tx hash')"
                            >
                              Copy
                            </Button>
                          </div>
                        </div>
                      </div>

                      <div class="rounded-xl border border-border p-4">
                        <div class="text-sm font-medium">Recommended next steps</div>
                        <div class="mt-2 grid gap-2 text-sm text-muted-foreground">
                          <div>
                            1. Verify the contract in the registry (if applicable) so other tools can discover it.
                          </div>
                          <div>
                            2. Run a smoke test: call a read method (or do a small write) to confirm expected behavior.
                          </div>
                          <div>
                            3. Save the address in your app config / deployment notes.
                          </div>
                        </div>
                        <div class="mt-4 flex flex-wrap items-center gap-2">
                          <Button variant="secondary" class="h-9" @click="router.push('/rpc')">Open RPC tools</Button>
                          <Button variant="secondary" class="h-9" @click="router.push('/contracts')">Open Registry</Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div class="rounded-xl bg-muted p-4">
                    <div class="text-xs uppercase tracking-wider text-muted-foreground">Source</div>
                    <div class="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div class="min-w-0 flex-1 truncate font-mono text-sm text-muted-foreground">{{ selected.sourceFile }}</div>
                      <div class="flex items-center gap-2">
                        <Button variant="secondary" class="h-9" @click="copyText(selected.id)">Copy ID</Button>
                        <Button variant="secondary" class="h-9" @click="router.push('/contracts')">Open Registry</Button>
                      </div>
                    </div>
                  </div>

                  <div class="space-y-3">
                    <div class="flex items-center justify-between">
                      <div class="text-sm font-medium">Constructor</div>
                      <Badge variant="secondary">{{ selected.constructorParams.length }} args</Badge>
                    </div>

                    <div v-if="selected.constructorParams.length === 0" class="text-sm text-muted-foreground">
                      No constructor args.
                    </div>

                    <div v-else class="grid gap-3 md:grid-cols-2">
                      <div v-for="p in selected.constructorParams" :key="p.name" class="space-y-2">
                        <div class="flex min-w-0 items-center justify-between gap-2">
                          <div class="min-w-0 truncate text-sm font-medium">{{ p.label || p.name }}</div>
                          <Badge variant="secondary" class="font-mono text-xs">{{ p.type }}</Badge>
                        </div>
                        <Input
                          v-model="constructorArgs[p.name]"
                          class="h-10"
                          :placeholder="p.placeholder || p.description || ''"
                        />
                        <div v-if="p.description" class="text-xs text-muted-foreground">{{ p.description }}</div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div class="space-y-2">
                    <div class="flex items-center justify-between">
                      <div class="text-sm font-medium">Owner Address</div>
                      <Button variant="secondary" class="h-9" @click="copyText(ownerAddress)">Copy</Button>
                    </div>
                    <Input v-model="ownerAddress" class="h-10 font-mono" placeholder="0x…" />
                    <div class="text-xs text-muted-foreground">
                      Used for job metadata. The deployer wallet is managed server-side.
                    </div>
                  </div>

                  <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <Button class="h-11" :disabled="!canSubmit || submitting" @click="onSubmit">
                      {{ submitting ? 'Submitting…' : 'Submit Deploy Job' }}
                    </Button>
                    <div v-if="jobId" class="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary" class="max-w-full font-mono">{{ jobId.slice(0, 12) }}…</Badge>
                      <Button variant="secondary" class="h-11" @click="copyText(jobId)">Copy Job ID</Button>
                      <Button variant="secondary" class="h-11" @click="refreshJob" :disabled="polling">Refresh</Button>
                    </div>
                  </div>

                  <div v-if="jobError" class="text-sm text-muted-foreground">{{ jobError }}</div>
                </CardContent>

                <CardContent v-else class="text-sm text-muted-foreground">
                  Select a contract to configure and deploy.
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="status" class="mt-4">
            <Card class="shadow-xl">
              <CardHeader>
                <CardTitle>Job Status</CardTitle>
                <CardDescription>Paste a job id to fetch status. Submitted jobs auto-poll until completion.</CardDescription>
              </CardHeader>
              <CardContent class="space-y-4">
                <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
                  <div class="min-w-0 flex-1">
                    <Input v-model="jobId" class="h-10 w-full min-w-0 font-mono" placeholder="jobId" />
                  </div>
                  <div class="flex flex-wrap items-center gap-2">
                    <Button class="h-10" :disabled="polling || !jobId.trim()" @click="refreshJob">Fetch</Button>
                    <Button variant="secondary" class="h-10" :disabled="!jobId.trim()" @click="copyText(jobId)">Copy</Button>
                  </div>
                </div>

                <div v-if="jobError" class="text-sm text-muted-foreground">{{ jobError }}</div>

                <div v-if="job" class="grid gap-4 lg:grid-cols-3">
                  <Card class="shadow-xl">
                    <CardHeader>
                      <CardTitle class="text-base">Status</CardTitle>
                      <CardDescription class="font-mono">{{ job.id }}</CardDescription>
                    </CardHeader>
                    <CardContent class="space-y-2">
                      <div class="flex items-center justify-between">
                        <div class="text-xs uppercase tracking-wider text-muted-foreground">State</div>
                        <Badge :variant="statusTone(job.status)" class="uppercase">{{ job.status }}</Badge>
                      </div>
                      <div class="text-sm font-medium">{{ job.contractName }}</div>
                      <div class="text-xs text-muted-foreground break-all">{{ job.sourceFile }}</div>
                      <div class="text-xs text-muted-foreground">Owner: <span class="font-mono break-all">{{ job.ownerAddress }}</span></div>
                    </CardContent>
                  </Card>

                  <Card class="shadow-xl lg:col-span-2">
                    <CardHeader>
                      <CardTitle class="text-base">Result</CardTitle>
                      <CardDescription>Address, tx hash, and explorer links (when available).</CardDescription>
                    </CardHeader>
                    <CardContent class="space-y-3">
                      <div class="grid gap-3 sm:grid-cols-2">
                        <div class="rounded-xl bg-muted p-4">
                          <div class="text-[10px] uppercase tracking-wider text-muted-foreground">Contract</div>
                          <div class="mt-2 break-all font-mono text-sm">{{ job.contractAddress ?? '—' }}</div>
                          <div class="mt-3 flex items-center gap-2">
                            <Button variant="secondary" class="h-9" :disabled="!job.contractAddress" @click="copyText(job.contractAddress || '')">
                              Copy
                            </Button>
                          </div>
                        </div>
                        <div class="rounded-xl bg-muted p-4">
                          <div class="text-[10px] uppercase tracking-wider text-muted-foreground">Tx Hash</div>
                          <div class="mt-2 break-all font-mono text-sm">{{ job.txHash ?? '—' }}</div>
                          <div class="mt-3 flex items-center gap-2">
                            <Button variant="secondary" class="h-9" :disabled="!job.txHash" @click="copyText(job.txHash || '')">Copy</Button>
                            <a
                              v-if="job.explorerUrl"
                              :href="job.explorerUrl"
                              target="_blank"
                              rel="noreferrer"
                              class="text-sm text-muted-foreground hover:text-foreground"
                            >
                              Open explorer
                            </a>
                          </div>
                        </div>
                      </div>

                      <div v-if="job.error" class="rounded-xl bg-muted p-4">
                        <div class="text-[10px] uppercase tracking-wider text-muted-foreground">Error</div>
                        <Textarea class="mt-2 min-h-[120px] font-mono text-xs" :model-value="job.error" readonly />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" class="mt-4">
            <Card class="shadow-xl">
              <CardHeader>
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0 flex-1">
                    <CardTitle>History</CardTitle>
                    <CardDescription class="break-words">Latest deployments submitted via this portal.</CardDescription>
                  </div>
                  <Button variant="secondary" class="h-10" :disabled="historyLoading" @click="refreshHistory">
                    Refresh
                  </Button>
                </div>
              </CardHeader>
              <CardContent class="space-y-3">
                <div v-if="historyError" class="text-sm text-muted-foreground">{{ historyError }}</div>

                <div v-if="history.length === 0 && !historyLoading" class="py-12 text-center text-sm text-muted-foreground">
                  No deployments yet.
                </div>

                <div class="grid gap-3">
                  <Card v-for="d in history" :key="d.id" class="shadow-xl">
                    <CardContent class="pt-6">
                      <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div class="min-w-0 flex-1">
                          <div class="flex min-w-0 flex-wrap items-center gap-2">
                            <div class="min-w-0 flex-1 truncate font-medium">{{ d.contractName }}</div>
                            <Badge :variant="statusTone(d.status)" class="shrink-0 uppercase">{{ d.status }}</Badge>
                            <Badge v-if="d.verified" variant="secondary" class="shrink-0">Verified</Badge>
                          </div>
                          <div class="mt-1 break-all text-xs text-muted-foreground">{{ d.sourceFile }}</div>
                          <div class="mt-2 text-xs text-muted-foreground">
                            <span class="font-mono break-all">{{ d.id.slice(0, 10) }}…</span>
                            <span class="mx-2">·</span>
                            <span class="font-mono break-all">{{ d.ownerAddress.slice(0, 10) }}…</span>
                          </div>
                        </div>

                        <div class="flex flex-wrap items-center gap-2">
                          <Button variant="secondary" class="h-9" @click="copyText(d.id)">Copy Job</Button>
                          <Button variant="secondary" class="h-9" :disabled="!d.contractAddress" @click="copyText(d.contractAddress || '')">
                            Copy Address
                          </Button>
                          <Button class="h-9" @click="jobId = d.id; refreshJob(); startPolling()">Open</Button>
                        </div>
                      </div>

                      <div v-if="d.contractAddress" class="mt-4 rounded-xl bg-muted p-4">
                        <div class="text-[10px] uppercase tracking-wider text-muted-foreground">Contract Address</div>
                        <div class="mt-2 break-all font-mono text-sm">{{ d.contractAddress }}</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getContract } from '@/api/contracts'
import type { ContractDetail } from '@/api/contracts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

const route = useRoute()
const router = useRouter()

const loading = ref(true)
const error = ref<string | null>(null)
const contract = ref<ContractDetail | null>(null)

const id = computed(() => String(route.params.id || ''))

async function fetchDetail() {
  loading.value = true
  error.value = null
  contract.value = null
  try {
    contract.value = await getContract(id.value)
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'Failed to load contract'
  } finally {
    loading.value = false
  }
}

async function copy(text: string) {
  await navigator.clipboard.writeText(text)
}

function fmtBytes(bytes: number) {
  if (!Number.isFinite(bytes)) return '—'
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  const mb = kb / 1024
  return `${mb.toFixed(2)} MB`
}

onMounted(fetchDetail)
watch(id, fetchDetail)
</script>

<template>
  <div class="px-6 py-12">
    <div class="mx-auto max-w-6xl">
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div class="flex items-center gap-2">
              <Button variant="ghost" class="h-9 px-2" @click="router.push('/contracts')">
                <svg class="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
                Back
              </Button>
              <Badge v-if="contract" variant="secondary">{{ contract.category }}</Badge>
              <Badge v-if="contract" variant="secondary">{{ contract.type }}</Badge>
              <Badge v-if="contract" variant="secondary">Sol {{ contract.solidityVersion }}</Badge>
            </div>

            <h1 class="mt-4 heading-h1">
              {{ contract?.name ?? (loading ? 'Loading…' : 'Contract') }}
            </h1>
            <p class="mt-2 body-default text-muted-foreground">
              {{ contract?.protocol ?? '—' }}
              <span v-if="contract" class="break-all">· {{ contract.fileName }}</span>
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              class="h-10"
              :disabled="!contract"
              @click="contract && copy(contract.id)"
            >
              Copy ID
            </Button>
            <Button
              variant="secondary"
              class="h-10"
              :disabled="!contract"
              @click="contract && copy(contract.path)"
            >
              Copy Path
            </Button>
            <Button
              class="h-10"
              :disabled="!contract || !contract.source"
              @click="contract?.source && copy(contract.source)"
            >
              Copy Source
            </Button>
          </div>
        </div>

        <div v-if="error" class="mt-2">
          <Card class="shadow-xl">
            <CardHeader>
              <CardTitle>Failed to load</CardTitle>
              <CardDescription>{{ error }}</CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div class="grid gap-4 lg:grid-cols-[420px_1fr]">
          <Card class="shadow-xl">
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
              <CardDescription>Registry details and basic stats.</CardDescription>
            </CardHeader>
            <CardContent class="space-y-3">
              <div class="grid grid-cols-2 gap-3">
                <div class="rounded-lg bg-muted p-3">
                  <div class="text-xs text-muted-foreground">Lines</div>
                  <div class="mt-1 font-mono text-sm">{{ contract?.lines?.toLocaleString() ?? '—' }}</div>
                </div>
                <div class="rounded-lg bg-muted p-3">
                  <div class="text-xs text-muted-foreground">Size</div>
                  <div class="mt-1 font-mono text-sm">{{ contract ? fmtBytes(contract.size) : '—' }}</div>
                </div>
                <div class="rounded-lg bg-muted p-3">
                  <div class="text-xs text-muted-foreground">License</div>
                  <div class="mt-1 text-sm">{{ contract?.license ?? '—' }}</div>
                </div>
                <div class="rounded-lg bg-muted p-3">
                  <div class="text-xs text-muted-foreground">Sub-category</div>
                  <div class="mt-1 text-sm">{{ contract?.subCategory ?? '—' }}</div>
                </div>
              </div>

              <div class="rounded-lg bg-muted p-3">
                <div class="text-xs text-muted-foreground">File path</div>
                <div class="mt-1 break-all font-mono text-xs">{{ contract?.path ?? '—' }}</div>
              </div>

              <div class="rounded-lg bg-muted p-3">
                <div class="text-xs text-muted-foreground">Imports</div>
                <div class="mt-2 space-y-1">
                  <div v-if="loading" class="text-xs text-muted-foreground">Loading…</div>
                  <div v-else-if="(contract?.imports?.length ?? 0) === 0" class="text-xs text-muted-foreground">None</div>
                  <button
                    v-for="imp in contract?.imports ?? []"
                    :key="imp"
                    class="block w-full break-all text-left font-mono text-xs text-muted-foreground hover:text-foreground"
                    @click="copy(imp)"
                    type="button"
                  >
                    {{ imp }}
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card class="shadow-xl">
            <CardHeader>
              <CardTitle>Source</CardTitle>
              <CardDescription>
                {{ contract?.source ? 'Scroll to inspect the verified Solidity source.' : 'No source available for this entry.' }}
              </CardDescription>
            </CardHeader>
            <CardContent class="pt-0">
              <Tabs default-value="source">
                <TabsList>
                  <TabsTrigger value="source">Source</TabsTrigger>
                  <TabsTrigger value="raw">Raw</TabsTrigger>
                </TabsList>

                <TabsContent value="source" class="mt-3">
                  <ScrollArea class="h-[640px] rounded-lg bg-muted">
                    <pre class="p-5 text-xs leading-relaxed whitespace-pre-wrap break-words"><code class="font-mono text-foreground">{{ contract?.source ?? '—' }}</code></pre>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="raw" class="mt-3">
                  <ScrollArea class="h-[640px] rounded-lg bg-muted">
                    <pre class="p-5 text-xs leading-relaxed whitespace-pre-wrap break-words"><code class="font-mono text-muted-foreground">{{ contract?.source ?? '—' }}</code></pre>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>

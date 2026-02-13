<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { callRpc, listRpcMethods, type RpcMethodInfo } from '@/api/rpc'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'

const loading = ref(true)
const error = ref<string | null>(null)

const methods = ref<RpcMethodInfo[]>([])
const q = ref('')

const selectedMethod = ref<string>('')
const selected = computed(() => methods.value.find((m) => m.method === selectedMethod.value) ?? null)

const paramsText = ref('[]')
const callLoading = ref(false)
const callError = ref<string | null>(null)
const response = ref<any>(null)

const filtered = computed(() => {
  const s = q.value.trim().toLowerCase()
  if (!s) return methods.value
  return methods.value.filter((m) => {
    return (
      m.method.toLowerCase().includes(s) ||
      (m.description ?? '').toLowerCase().includes(s) ||
      (m.params ?? '').toLowerCase().includes(s)
    )
  })
})

const prettyResponse = computed(() => {
  if (response.value == null) return ''
  try {
    return JSON.stringify(response.value, null, 2)
  } catch {
    return String(response.value)
  }
})

function setParamsFromExample() {
  const ex = selected.value?.example
  if (!ex) return
  paramsText.value = JSON.stringify(ex, null, 2)
}

function safeParseParams(): { ok: true; value: unknown[] } | { ok: false; message: string } {
  try {
    const parsed = JSON.parse(paramsText.value || '[]')
    if (!Array.isArray(parsed)) return { ok: false, message: 'Params must be a JSON array (e.g. [])' }
    return { ok: true, value: parsed }
  } catch (e: any) {
    return { ok: false, message: e?.message ?? 'Invalid JSON' }
  }
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // ignore
  }
}

const curlCommand = computed(() => {
  if (!selectedMethod.value) return ''
  const parsed = safeParseParams()
  const params = parsed.ok ? parsed.value : []
  return `curl -s \
  -X POST \
  -H 'Content-Type: application/json' \
  -d '${JSON.stringify({ method: selectedMethod.value, params })}' \
  https://public-rpc.paxeer.app/rpc`
})

async function runCall() {
  callError.value = null
  response.value = null

  if (!selectedMethod.value) {
    callError.value = 'Select a method first.'
    return
  }

  const parsed = safeParseParams()
  if (!parsed.ok) {
    callError.value = parsed.message
    return
  }

  callLoading.value = true
  try {
    response.value = await callRpc(selectedMethod.value, parsed.value)
  } catch (e: any) {
    callError.value = e?.message ?? 'RPC call failed'
  } finally {
    callLoading.value = false
  }
}

async function fetchMethods() {
  loading.value = true
  error.value = null
  try {
    const res = await listRpcMethods()
    methods.value = res.methods
    if (!selectedMethod.value && res.methods.length) {
      const first = res.methods[0]
      if (first) {
        selectedMethod.value = first.method
        paramsText.value = JSON.stringify(first.example ?? [], null, 2)
      }
    }
  } catch (e: any) {
    error.value = e?.message ?? 'Failed to load RPC methods'
  } finally {
    loading.value = false
  }
}

watch(
  () => selectedMethod.value,
  () => {
    response.value = null
    callError.value = null
    const ex = selected.value?.example
    if (ex) paramsText.value = JSON.stringify(ex, null, 2)
  },
)

onMounted(fetchMethods)
</script>

<template>
  <div class="px-6 py-12">
    <div class="mx-auto max-w-6xl">
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 class="heading-h1">RPC Playground</h1>
            <p class="mt-2 body-default text-muted-foreground">Call allowlisted JSON-RPC methods safely through the portal.</p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{{ methods.length.toLocaleString() }} Methods</Badge>
            <Badge variant="secondary">Proxy</Badge>
          </div>
        </div>

        <div class="grid gap-4 lg:grid-cols-[420px_1fr]">
          <Card class="shadow-xl">
            <CardHeader>
              <CardTitle>Methods</CardTitle>
              <CardDescription>Search and pick a method.</CardDescription>
            </CardHeader>
            <CardContent class="space-y-3">
              <Input v-model="q" class="h-10" placeholder="Search methods…" />

              <div v-if="error" class="text-sm text-muted-foreground">{{ error }}</div>

              <ScrollArea class="h-[620px]">
                <div class="space-y-2">
                  <Button
                    v-for="m in filtered"
                    :key="m.method"
                    variant="secondary"
                    class="h-auto w-full justify-between px-4 py-3 text-left"
                    :class="selectedMethod === m.method ? 'bg-accent/40' : ''"
                    @click="selectedMethod = m.method"
                  >
                    <div class="min-w-0">
                      <div class="truncate font-mono text-sm">{{ m.method }}</div>
                      <div v-if="m.description" class="mt-1 line-clamp-2 text-xs text-muted-foreground">{{ m.description }}</div>
                    </div>
                    <Badge variant="secondary" class="shrink-0">Docs</Badge>
                  </Button>

                  <div v-if="!loading && filtered.length === 0" class="py-12 text-center text-sm text-muted-foreground">
                    No methods found.
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card class="shadow-xl">
            <CardHeader>
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <CardTitle class="truncate">{{ selected?.method ?? (loading ? 'Loading…' : 'Select a method') }}</CardTitle>
                  <CardDescription class="mt-1 line-clamp-2">{{ selected?.description ?? '' }}</CardDescription>
                </div>
                <div v-if="selected" class="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary" class="font-mono">POST /api/rpc</Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent v-if="selected" class="space-y-4">
              <div class="rounded-xl bg-muted p-4">
                <div class="text-[10px] uppercase tracking-wider text-muted-foreground">Params</div>
                <div v-if="selected.params" class="mt-2 text-xs text-muted-foreground">{{ selected.params }}</div>
              </div>

              <div class="space-y-2">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div class="text-sm font-medium">Request</div>
                  <div class="flex items-center gap-2">
                    <Button variant="secondary" class="h-9" @click="setParamsFromExample">Use example</Button>
                    <Button variant="secondary" class="h-9" @click="copyText(paramsText)">Copy params</Button>
                  </div>
                </div>
                <Textarea v-model="paramsText" class="min-h-[160px] font-mono text-xs" />
                <div class="text-xs text-muted-foreground">Params must be a JSON array (e.g. <span class="font-mono">[]</span>).</div>
              </div>

              <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Button class="h-11" :disabled="callLoading" @click="runCall">{{ callLoading ? 'Calling…' : 'Call' }}</Button>
                <Button variant="secondary" class="h-11" :disabled="!curlCommand" @click="copyText(curlCommand)">Copy curl</Button>
              </div>

              <div v-if="callError" class="text-sm text-muted-foreground">{{ callError }}</div>

              <Separator />

              <Tabs default-value="response" class="w-full">
                <TabsList class="w-full justify-start">
                  <TabsTrigger value="response">Response</TabsTrigger>
                  <TabsTrigger value="curl">Curl</TabsTrigger>
                </TabsList>

                <TabsContent value="response" class="mt-3">
                  <div class="flex items-center justify-between">
                    <div class="text-sm font-medium">Output</div>
                    <Button variant="secondary" class="h-9" :disabled="!prettyResponse" @click="copyText(prettyResponse)">Copy</Button>
                  </div>
                  <ScrollArea class="mt-3 h-[320px]">
                    <pre class="whitespace-pre-wrap break-words rounded-xl bg-muted p-4 font-mono text-xs text-muted-foreground">{{ prettyResponse || '—' }}</pre>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="curl" class="mt-3">
                  <div class="flex items-center justify-between">
                    <div class="text-sm font-medium">Command</div>
                    <Button variant="secondary" class="h-9" :disabled="!curlCommand" @click="copyText(curlCommand)">Copy</Button>
                  </div>
                  <ScrollArea class="mt-3 h-[320px]">
                    <pre class="whitespace-pre-wrap break-words rounded-xl bg-muted p-4 font-mono text-xs text-muted-foreground">{{ curlCommand || '—' }}</pre>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>

            <CardContent v-else class="text-sm text-muted-foreground">Select a method to begin.</CardContent>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>

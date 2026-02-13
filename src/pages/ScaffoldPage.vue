<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import {
  generateProject,
  listTemplates,
  previewProject,
  searchTemplates,
  type TemplateInfo,
} from '@/api/scaffold'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

type ScaffoldType = 'contract' | 'dapp' | 'fullstack'

const loading = ref(true)
const error = ref<string | null>(null)

const activeType = ref<ScaffoldType>('contract')
const q = ref('')

const grouped = ref<{ contract: TemplateInfo[]; dapp: TemplateInfo[]; fullstack: TemplateInfo[] }>({
  contract: [],
  dapp: [],
  fullstack: [],
})

const templates = computed(() => grouped.value[activeType.value] ?? [])

const selectedId = ref<string>('')
const selected = computed(() => templates.value.find((t) => t.id === selectedId.value) ?? null)

const projectName = ref('')
const variables = ref<Record<string, string>>({})

const mode = ref<'preview' | 'generate'>('preview')
const running = ref(false)
const runError = ref<string | null>(null)

const preview = ref<null | {
  fileCount: number
  totalSize: number
  files: { path: string; size: number; preview: string }[]
}>(null)

const generated = ref<null | {
  fileCount: number
  downloadUrl: string
  s3Key: string
  files: string[]
}>(null)

const selectedFilePath = ref<string>('')
const selectedFilePreview = computed(() => {
  if (!preview.value) return ''
  const f = preview.value.files.find((x) => x.path === selectedFilePath.value)
  return f?.preview ?? ''
})

const canRun = computed(() => {
  if (!selected.value) return false
  if (!projectName.value.trim()) return false
  for (const v of selected.value.variables) {
    if (v.required && !(variables.value[v.key] ?? '').trim()) return false
  }
  return true
})

function fmtBytes(bytes: number) {
  if (!Number.isFinite(bytes)) return '—'
  const kb = bytes / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  const mb = kb / 1024
  return `${mb.toFixed(2)} MB`
}

function difficultyTone(_d?: TemplateInfo['difficulty']): 'secondary' {
  return 'secondary'
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // ignore
  }
}

function resetRun() {
  runError.value = null
  preview.value = null
  generated.value = null
  selectedFilePath.value = ''
}

async function fetchTemplates() {
  loading.value = true
  error.value = null
  try {
    if (q.value.trim()) {
      const res = await searchTemplates(q.value.trim())
      grouped.value = {
        contract: res.templates.filter((t) => t.scaffoldType === 'contract'),
        dapp: res.templates.filter((t) => t.scaffoldType === 'dapp'),
        fullstack: res.templates.filter((t) => t.scaffoldType === 'fullstack'),
      }
    } else {
      const res = await listTemplates()
      grouped.value = { contract: res.contract, dapp: res.dapp, fullstack: res.fullstack }
    }

    if (!selectedId.value && templates.value.length) selectedId.value = templates.value[0]?.id ?? ''
    if (selectedId.value && !templates.value.some((t) => t.id === selectedId.value)) {
      selectedId.value = templates.value[0]?.id ?? ''
    }
  } catch (e: any) {
    error.value = e?.message ?? 'Failed to load templates'
  } finally {
    loading.value = false
  }
}

watch(
  () => q.value,
  () => {
    const t = window.setTimeout(fetchTemplates, 250)
    return () => window.clearTimeout(t)
  },
)

watch(
  () => activeType.value,
  () => {
    if (!templates.value.some((t) => t.id === selectedId.value)) {
      selectedId.value = templates.value[0]?.id ?? ''
    }
    resetRun()
  },
)

watch(
  () => selectedId.value,
  () => {
    resetRun()
    const t = selected.value
    if (!t) return
    const next: Record<string, string> = {}
    for (const v of t.variables) next[v.key] = variables.value[v.key] ?? v.default ?? ''
    variables.value = next
    if (!projectName.value.trim()) projectName.value = `${t.name}`.toLowerCase().replace(/\s+/g, '-')
  },
)

async function run() {
  if (!selected.value) return
  running.value = true
  runError.value = null
  preview.value = null
  generated.value = null
  selectedFilePath.value = ''

  const plainVariables: Record<string, string> = { ...variables.value }

  try {
    if (mode.value === 'preview') {
      const res = await previewProject({
        scaffoldType: selected.value.scaffoldType,
        template: selected.value.id,
        projectName: projectName.value.trim(),
        variables: plainVariables,
      })
      preview.value = { fileCount: res.fileCount, totalSize: res.totalSize, files: res.files }
      selectedFilePath.value = res.files[0]?.path ?? ''
    } else {
      const res = await generateProject({
        scaffoldType: selected.value.scaffoldType,
        template: selected.value.id,
        projectName: projectName.value.trim(),
        variables: plainVariables,
      })
      generated.value = { fileCount: res.fileCount, downloadUrl: res.downloadUrl, s3Key: res.s3Key, files: res.files }
    }
  } catch (e: any) {
    runError.value = e?.message ?? 'Request failed'
  } finally {
    running.value = false
  }
}

onMounted(fetchTemplates)
</script>

<template>
  <div class="px-6 py-12">
    <div class="mx-auto max-w-6xl">
      <div class="flex flex-col gap-4">
        <div class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 class="heading-h1">Scaffold</h1>
            <p class="mt-2 body-default text-muted-foreground">Generate contracts, dapps, or fullstack starters from curated templates.</p>
          </div>
          <div class="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{{ (grouped.contract.length + grouped.dapp.length + grouped.fullstack.length).toLocaleString() }} Templates</Badge>
            <Badge variant="secondary">Preview + Download</Badge>
          </div>
        </div>

        <div class="grid gap-4 lg:grid-cols-[420px_1fr]">
          <Card class="shadow-xl">
            <CardHeader>
              <CardTitle>Templates</CardTitle>
              <CardDescription>Search and pick a template.</CardDescription>
            </CardHeader>
            <CardContent class="space-y-3">
              <Input v-model="q" class="h-10" placeholder="Search templates…" />

              <Tabs v-model="activeType" class="w-full">
                <TabsList class="w-full justify-start">
                  <TabsTrigger value="contract">Contract</TabsTrigger>
                  <TabsTrigger value="dapp">Dapp</TabsTrigger>
                  <TabsTrigger value="fullstack">Fullstack</TabsTrigger>
                </TabsList>

                <TabsContent :value="activeType" class="mt-3">
                  <div v-if="error" class="text-sm text-muted-foreground">{{ error }}</div>

                  <ScrollArea class="h-[560px]">
                    <div class="space-y-2">
                      <Button
                        v-for="t in templates"
                        :key="t.id"
                        variant="secondary"
                        class="h-auto w-full justify-between px-4 py-3 text-left"
                        :class="selectedId === t.id ? 'bg-accent/40' : ''"
                        @click="selectedId = t.id"
                      >
                        <div class="min-w-0 flex-1">
                          <div class="truncate font-medium">{{ t.name }}</div>
                          <div class="mt-1 line-clamp-2 text-xs text-muted-foreground">{{ t.description }}</div>
                          <div class="mt-2 flex flex-wrap items-center gap-2">
                            <Badge variant="secondary">{{ t.category }}</Badge>
                            <Badge :variant="difficultyTone(t.difficulty)">{{ t.difficulty }}</Badge>
                            <Badge variant="secondary">{{ t.estimatedFiles }} files</Badge>
                          </div>
                        </div>
                        <Badge variant="secondary" class="shrink-0 font-mono">{{ t.id }}</Badge>
                      </Button>

                      <div v-if="!loading && templates.length === 0" class="py-12 text-center text-sm text-muted-foreground">
                        No templates found.
                      </div>
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          <Card class="shadow-xl">
            <CardHeader>
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <CardTitle class="truncate">{{ selected?.name ?? (loading ? 'Loading…' : 'Select a template') }}</CardTitle>
                  <CardDescription class="mt-1 line-clamp-2">{{ selected?.description ?? '' }}</CardDescription>
                </div>
                <div v-if="selected" class="flex items-center gap-2">
                  <Badge variant="secondary">{{ selected.scaffoldType }}</Badge>
                  <Badge variant="secondary">{{ selected.estimatedFiles }} files</Badge>
                </div>
              </div>
            </CardHeader>

            <CardContent v-if="selected" class="space-y-4">
              <div class="grid gap-3 md:grid-cols-2">
                <div class="space-y-2">
                  <div class="text-sm font-medium">Project name</div>
                  <Input v-model="projectName" class="h-10 font-mono" placeholder="my-hyperpaxeer-app" />
                </div>
                <div class="space-y-2">
                  <div class="text-sm font-medium">Mode</div>
                  <Select v-model="mode">
                    <SelectTrigger class="h-10 w-full">
                      <SelectValue placeholder="Mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="preview">Preview files</SelectItem>
                      <SelectItem value="generate">Generate download</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <div class="text-sm font-medium">Variables</div>
                  <Badge variant="secondary">{{ selected.variables.length }}</Badge>
                </div>

                <div v-if="selected.variables.length === 0" class="text-sm text-muted-foreground">No variables.</div>

                <div v-else class="grid gap-3 md:grid-cols-2">
                  <div v-for="v in selected.variables" :key="v.key" class="space-y-2">
                    <div class="flex items-center justify-between">
                      <div class="text-sm font-medium">{{ v.label }}</div>
                      <Badge variant="secondary" class="font-mono text-xs">{{ v.type }}</Badge>
                    </div>
                    <Input
                      v-model="variables[v.key]"
                      class="h-10"
                      :placeholder="v.description"
                    />
                    <div class="text-xs text-muted-foreground">
                      <span v-if="v.required" class="font-medium text-foreground">Required</span>
                      <span v-else>Optional</span>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <Button class="h-11" :disabled="!canRun || running" @click="run">
                  {{ running ? 'Working…' : (mode === 'preview' ? 'Preview' : 'Generate') }}
                </Button>
                <Button variant="secondary" class="h-11" :disabled="running" @click="resetRun">Reset output</Button>
              </div>

              <div v-if="runError" class="text-sm text-muted-foreground">{{ runError }}</div>

              <div v-if="preview" class="grid gap-4 lg:grid-cols-[320px_1fr]">
                <Card class="shadow-xl">
                  <CardHeader>
                    <CardTitle class="text-base">Files</CardTitle>
                    <CardDescription>{{ preview.fileCount }} files · {{ fmtBytes(preview.totalSize) }}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea class="h-[360px]">
                      <div class="space-y-1">
                        <Button
                          v-for="f in preview.files"
                          :key="f.path"
                          variant="secondary"
                          class="h-9 w-full justify-between px-3 font-mono text-xs"
                          :class="selectedFilePath === f.path ? 'bg-accent/40' : ''"
                          @click="selectedFilePath = f.path"
                        >
                          <span class="truncate">{{ f.path }}</span>
                          <span class="text-muted-foreground">{{ fmtBytes(f.size) }}</span>
                        </Button>
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>

                <Card class="shadow-xl">
                  <CardHeader>
                    <div class="flex items-start justify-between gap-3">
                      <div class="min-w-0">
                        <CardTitle class="text-base truncate">Preview</CardTitle>
                        <CardDescription class="font-mono truncate">{{ selectedFilePath || '—' }}</CardDescription>
                      </div>
                      <Button variant="secondary" class="h-9" :disabled="!selectedFilePath" @click="copyText(selectedFilePreview)">
                        Copy
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea class="h-[360px]">
                      <pre class="whitespace-pre-wrap break-words rounded-xl bg-muted p-4 font-mono text-xs text-muted-foreground">{{ selectedFilePreview || 'No preview available.' }}</pre>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              <div v-if="generated" class="space-y-3">
                <Card class="shadow-xl">
                  <CardHeader>
                    <CardTitle class="text-base">Download</CardTitle>
                    <CardDescription>{{ generated.fileCount }} files packaged</CardDescription>
                  </CardHeader>
                  <CardContent class="space-y-3">
                    <div class="rounded-xl bg-muted p-4">
                      <div class="text-[10px] uppercase tracking-wider text-muted-foreground">URL</div>
                      <div class="mt-2 break-all font-mono text-xs text-muted-foreground">{{ generated.downloadUrl }}</div>
                      <div class="mt-3 flex flex-wrap items-center gap-2">
                        <a
                          :href="generated.downloadUrl"
                          target="_blank"
                          rel="noreferrer"
                          class="text-sm font-medium text-foreground hover:text-foreground"
                        >
                          Open download
                        </a>
                        <Button variant="secondary" class="h-9" @click="copyText(generated.downloadUrl)">Copy URL</Button>
                        <Button variant="secondary" class="h-9" @click="copyText(generated.s3Key)">Copy key</Button>
                      </div>
                    </div>

                    <div class="text-xs text-muted-foreground">Generated files</div>
                    <ScrollArea class="h-[220px]">
                      <div class="space-y-1">
                        <Button
                          v-for="p in generated.files"
                          :key="p"
                          variant="secondary"
                          class="h-9 w-full justify-start px-3 font-mono text-xs"
                          @click="copyText(p)"
                        >
                          {{ p }}
                        </Button>
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>
            </CardContent>

            <CardContent v-else class="text-sm text-muted-foreground">
              Select a template to configure and generate.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  </div>
</template>

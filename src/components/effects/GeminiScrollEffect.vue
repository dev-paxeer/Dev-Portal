<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

type PathDef = {
  d: string
  opacity: number
  width: number
}

const props = withDefaults(
  defineProps<{
    /** Multipliers applied to scroll progress for each path. */
    multipliers?: number[]
    /** Height of the scroll section in viewport units. */
    heightVh?: number
  }>(),
  {
    multipliers: () => [1.2, 1.15, 1.1, 1.05, 1.0],
    heightVh: 320,
  },
)

const rootEl = ref<HTMLElement | null>(null)
const svgEl = ref<SVGSVGElement | null>(null)

const lengths = ref<number[]>([])
const dashOffsets = ref<number[]>([0, 0, 0, 0, 0])

const paths: PathDef[] = [
  {
    d: 'M 80 200 C 260 40, 540 40, 720 200 S 1180 360, 1360 200',
    opacity: 0.35,
    width: 2.25,
  },
  {
    d: 'M 80 260 C 280 120, 520 120, 720 260 S 1160 400, 1360 260',
    opacity: 0.25,
    width: 2.0,
  },
  {
    d: 'M 80 320 C 300 200, 520 200, 720 320 S 1140 440, 1360 320',
    opacity: 0.18,
    width: 1.75,
  },
  {
    d: 'M 80 380 C 320 280, 520 280, 720 380 S 1120 520, 1360 380',
    opacity: 0.14,
    width: 1.5,
  },
  {
    d: 'M 80 440 C 340 360, 520 360, 720 440 S 1100 600, 1360 440',
    opacity: 0.1,
    width: 1.25,
  },
]

function clamp01(n: number) {
  return Math.max(0, Math.min(1, n))
}

function computeProgress() {
  const el = rootEl.value
  if (!el) return 0

  const rect = el.getBoundingClientRect()
  const viewH = window.innerHeight || 1

  // 0 when top hits top, 1 when bottom hits top
  const total = rect.height || 1
  const scrolled = clamp01((0 - rect.top) / Math.max(1, total - viewH * 0.25))
  return scrolled
}

let rafId: number | null = null

function tick() {
  const p = computeProgress()

  // Update dash offsets
  const next = props.multipliers.map((m, idx) => {
    const L = lengths.value[idx] ?? 0
    const effective = clamp01(p * m)
    return L * (1 - effective)
  })

  dashOffsets.value = next
  rafId = window.requestAnimationFrame(tick)
}

onMounted(() => {
  // capture paths
  const svg = svgEl.value
  if (!svg) return

  const found = Array.from(svg.querySelectorAll('path')) as SVGPathElement[]

  lengths.value = found.map((p) => {
    try {
      return p.getTotalLength()
    } catch {
      return 0
    }
  })

  // initialize offsets
  dashOffsets.value = lengths.value.map((L) => L)

  rafId = window.requestAnimationFrame(tick)
})

onUnmounted(() => {
  if (rafId) window.cancelAnimationFrame(rafId)
})
</script>

<template>
  <section
    ref="rootEl"
    class="relative w-full overflow-hidden bg-background"
    :style="{ height: `${heightVh}vh` }"
  >
    <div class="sticky top-0 flex h-screen items-center justify-center">
      <div class="w-full max-w-6xl px-6">
        <div class="relative h-[560px] w-full">
          <svg
            ref="svgEl"
            class="absolute inset-0 h-full w-full text-foreground/80"
            viewBox="0 0 1440 640"
            fill="none"
            aria-hidden="true"
          >
            <path
              v-for="(p, idx) in paths"
              :key="idx"
              :d="p.d"
              stroke="currentColor"
              :stroke-opacity="p.opacity"
              :stroke-width="p.width"
              stroke-linecap="round"
              stroke-linejoin="round"
              :style="{
                strokeDasharray: String(lengths[idx] ?? 0),
                strokeDashoffset: String(dashOffsets[idx] ?? 0),
              }"
            />
          </svg>

          <div class="relative flex h-full flex-col items-center justify-center text-center">
            <h2 class="display-3">Paxeer Network</h2>
            <p class="mt-4 body-default text-muted-foreground">
              Smooth, scroll-driven motion. Premium by default.
            </p>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

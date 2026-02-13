import { ref, onMounted, onUnmounted } from 'vue'
import { getNetworkInfo, getNetworkStats, getHealthCheck } from '@/api/network'
import type { NetworkInfo, NetworkStats, HealthCheck } from '@/api/network'

const networkInfo = ref<NetworkInfo | null>(null)
const networkStats = ref<NetworkStats | null>(null)
const healthCheck = ref<HealthCheck | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

let pollInterval: ReturnType<typeof setInterval> | null = null

async function fetchInfo() {
  try {
    networkInfo.value = await getNetworkInfo()
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : 'Failed to load network info'
  }
}

async function fetchStats() {
  try {
    networkStats.value = await getNetworkStats()
  } catch {
    // silently fail on stats polling
  }
}

async function fetchHealth() {
  try {
    healthCheck.value = await getHealthCheck()
  } catch {
    // silently fail
  }
}

export function useNetwork() {
  onMounted(async () => {
    loading.value = true
    await Promise.all([fetchInfo(), fetchStats(), fetchHealth()])
    loading.value = false

    pollInterval = setInterval(() => {
      fetchStats()
      fetchHealth()
    }, 12_000)
  })

  onUnmounted(() => {
    if (pollInterval) {
      clearInterval(pollInterval)
      pollInterval = null
    }
  })

  return {
    networkInfo,
    networkStats,
    healthCheck,
    loading,
    error,
    refreshStats: fetchStats,
    refreshHealth: fetchHealth,
  }
}

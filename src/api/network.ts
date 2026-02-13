import { apiGet } from './client'

export interface NetworkInfo {
  name: string
  cosmosChainId: string
  evmChainId: number
  token: {
    name: string
    symbol: string
    baseDenom: string
    displayDenom: string
    decimals: number
  }
  bech32Prefix: string
  rpc: {
    cosmos: string
    evmJsonRpc: string
  }
  explorer: {
    mainnet: string
  }
  website: string
  docs: string
}

export interface NetworkStats {
  blockHeight: number | null
  gasPrice: string | null
  gasPriceGwei: string | null
  chainId: number | null
  peerCount: number | null
  timestamp: string
}

export interface HealthCheck {
  healthy: boolean
  blockHeight: number | null
  rpcEndpoint: string
  timestamp: string
}

export function getNetworkInfo() {
  return apiGet<NetworkInfo>('/api/network/info')
}

export function getNetworkStats() {
  return apiGet<NetworkStats>('/api/network/stats')
}

export function getHealthCheck() {
  return apiGet<HealthCheck>('/api/network/health')
}

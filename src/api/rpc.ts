import { apiGet, apiPost } from './client'

export interface RpcMethodInfo {
  method: string
  description: string
  params: string
  example: unknown[]
}

export function listRpcMethods() {
  return apiGet<{ total: number; methods: RpcMethodInfo[] }>('/api/rpc/methods')
}

export function callRpc(method: string, params: unknown[] = []) {
  return apiPost<{
    jsonrpc: string
    id: number
    result?: unknown
    error?: { code: number; message: string }
  }>('/api/rpc', { method, params })
}

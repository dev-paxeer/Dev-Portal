import { apiGet, apiPost } from './client'

export interface ConstructorParam {
  name: string
  type: string
  label: string
  description: string
  placeholder?: string
  isAddress?: boolean
}

export interface DeployableContract {
  id: string
  contractName: string
  sourceFile: string
  description: string
  category: string
  constructorParams: ConstructorParam[]
  dependencies: string[]
  postDeploySetup: string[]
  abiItemCount: number
  bytecodeSize: number
}

export interface DeployJob {
  id: string
  contractId: string
  contractName: string
  sourceFile: string
  constructorArgs: string[]
  ownerAddress: string
  status: 'queued' | 'compiling' | 'deploying' | 'verifying' | 'complete' | 'failed'
  contractAddress?: string
  txHash?: string
  explorerUrl?: string
  verified?: boolean
  abi?: unknown[]
  error?: string
  createdAt: number
  updatedAt: number
}

export function listDeployableContracts() {
  return apiGet<{ contracts: DeployableContract[]; count: number }>('/api/deploy/contracts')
}

export function getDeployableContract(id: string) {
  return apiGet<DeployableContract>('/api/deploy/contracts/' + id)
}

export function searchDeployableContracts(q: string) {
  return apiGet<{ results: DeployableContract[]; count: number }>('/api/deploy/contracts/search', { q })
}

export function submitDeploy(contractId: string, constructorArgs: string[], ownerAddress: string) {
  return apiPost<{ jobId: string; status: string; contractName: string; message: string }>('/api/deploy/submit', {
    contractId,
    constructorArgs,
    ownerAddress,
  })
}

export function getDeployStatus(jobId: string) {
  return apiGet<DeployJob>(`/api/deploy/status/${jobId}`)
}

export function getDeployHistory(limit = 50) {
  return apiGet<{ deployments: DeployJob[]; count: number }>('/api/deploy/history', { limit })
}

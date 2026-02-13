import { apiGet } from './client'

export interface ContractItem {
  id: string
  name: string
  fileName: string
  type: 'contract' | 'interface' | 'library' | 'abstract'
  category: string
  protocol: string
  solidityVersion: string
  lines: number
  size: number
}

export interface ContractListResponse {
  total: number
  page: number
  limit: number
  totalPages: number
  items: ContractItem[]
}

export interface ContractDetail extends ContractItem {
  path: string
  subCategory: string
  license: string
  imports: string[]
  source: string | null
}

export interface ContractSummary {
  version: string
  generatedAt: string
  totalContracts: number
  categories: { name: string; id: number; count: number }[]
  protocols: { name: string; count: number }[]
}

export function listContracts(params?: {
  category?: string
  protocol?: string
  type?: string
  search?: string
  page?: number
  limit?: number
}) {
  return apiGet<ContractListResponse>('/api/contracts', params)
}

export function getContractSummary() {
  return apiGet<ContractSummary>('/api/contracts/summary')
}

export function getContract(id: string) {
  return apiGet<ContractDetail>(`/api/contracts/${id}`)
}

export function getCategories() {
  return apiGet<{ name: string; id: number; count: number }[]>('/api/contracts/categories')
}

export function getProtocols() {
  return apiGet<{ name: string; count: number }[]>('/api/contracts/protocols')
}

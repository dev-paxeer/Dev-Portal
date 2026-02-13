import { apiGet, apiPost } from './client'

export interface TemplateVariable {
  key: string
  label: string
  description: string
  type: 'string' | 'number'
  required: boolean
  default?: string
}

export interface TemplateInfo {
  id: string
  scaffoldType: 'contract' | 'dapp' | 'fullstack'
  name: string
  description: string
  category: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  tags: string[]
  estimatedFiles: number
  variables: TemplateVariable[]
}

export interface TemplateListResponse {
  total: number
  contract: TemplateInfo[]
  dapp: TemplateInfo[]
  fullstack: TemplateInfo[]
}

export function listTemplates(type?: string) {
  return apiGet<TemplateListResponse>('/api/scaffold/templates', type ? { type } : undefined)
}

export function getTemplate(id: string) {
  return apiGet<TemplateInfo>(`/api/scaffold/templates/${id}`)
}

export function searchTemplates(q: string) {
  return apiGet<{ query: string; total: number; templates: TemplateInfo[] }>('/api/scaffold/templates/search', { q })
}

export function previewProject(opts: {
  scaffoldType: string
  template: string
  projectName: string
  variables?: Record<string, string>
}) {
  return apiPost<{
    scaffoldType: string
    template: string
    projectName: string
    fileCount: number
    totalSize: number
    files: { path: string; size: number; preview: string }[]
  }>('/api/scaffold/preview', opts)
}

export function generateProject(opts: {
  scaffoldType: string
  template: string
  projectName: string
  variables?: Record<string, string>
}) {
  return apiPost<{
    success: boolean
    scaffoldType: string
    template: string
    projectName: string
    fileCount: number
    downloadUrl: string
    s3Key: string
    files: string[]
  }>('/api/scaffold/generate', opts)
}

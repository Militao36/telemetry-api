'use client'

import { useState, useEffect } from 'react'
import useSWR from 'swr'
import { api, getProjectId, setProjectId } from '@/lib/api'
import { PageHeader } from '@/components/layout/header'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LoadingState } from '@/components/ui/spinner'
import { Check, Plus, FolderOpen } from 'lucide-react'

export default function SettingsPage() {
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null)
  const [newProjectName, setNewProjectName] = useState('')
  const [creating, setCreating] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')

  const { data: projects, isLoading, mutate } = useSWR('projects', () => api.projects.list())
  const { data: me } = useSWR('me', () => api.auth.me())

  useEffect(() => {
    setCurrentProjectId(getProjectId())
  }, [])

  function handleSelectProject(id: string) {
    setProjectId(id)
    setCurrentProjectId(id)
    setSuccessMsg('Projeto selecionado!')
    setTimeout(() => setSuccessMsg(''), 2000)
  }

  async function handleCreateProject() {
    if (!newProjectName.trim()) return
    setCreating(true)
    try {
      await api.projects.create({ name: newProjectName })
      setNewProjectName('')
      mutate()
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="flex flex-col min-h-full">
      <PageHeader title="Configurações" description="Gerencie seus projetos e preferências" />

      <div className="p-6 space-y-6 max-w-2xl">
        {/* User info */}
        {me && (
          <Card>
            <CardHeader>
              <CardTitle>Conta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[#888888]">Nome</span>
                <span className="text-[#ededed] font-medium">{me.name || '-'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#888888]">E-mail</span>
                <span className="text-[#ededed] font-mono">{me.email}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Projects */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-[#3b82f6]" />
              Projetos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-[#888888]">Selecione o projeto ativo para filtrar os dados no dashboard.</p>

            {successMsg && (
              <p className="text-xs text-[#22c55e] bg-[rgba(34,197,94,0.08)] border border-[rgba(34,197,94,0.15)] rounded px-3 py-2 flex items-center gap-2">
                <Check className="w-3.5 h-3.5" />
                {successMsg}
              </p>
            )}

            {isLoading && <LoadingState />}

            {projects && (
              <div className="space-y-2">
                {projects.map((p: any) => {
                  const isActive = p.id === currentProjectId
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleSelectProject(p.id)}
                      className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg border transition-colors text-left ${
                        isActive
                          ? 'border-[#3b82f6] bg-[rgba(59,130,246,0.08)]'
                          : 'border-[#222222] hover:border-[#333333] hover:bg-[#1a1a1a]'
                      }`}
                    >
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 ${isActive ? 'bg-[#3b82f6]' : 'bg-[#333333]'}`}
                      />
                      <div className="flex-1">
                        <p className="text-sm text-[#ededed] font-medium">{p.name}</p>
                        <p className="text-xs text-[#555555] font-mono">{p.id}</p>
                      </div>
                      {isActive && <Check className="w-4 h-4 text-[#3b82f6]" />}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Create project */}
            <div className="pt-3 border-t border-[#1a1a1a]">
              <p className="text-xs text-[#888888] mb-2">Novo projeto</p>
              <div className="flex gap-2">
                <input
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateProject()}
                  placeholder="Nome do projeto"
                  className="flex-1 bg-[#1a1a1a] border border-[#222222] text-[#ededed] text-sm rounded-md px-3 py-1.5 placeholder:text-[#555555] focus:outline-none focus:ring-1 focus:ring-[#3b82f6]"
                />
                <Button onClick={handleCreateProject} disabled={creating || !newProjectName.trim()} size="sm">
                  <Plus className="w-3.5 h-3.5" />
                  Criar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Info */}
        <Card>
          <CardHeader>
            <CardTitle>API Backend</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-[#888888]">Base URL</span>
              <span className="font-mono text-[#ededed]">/api/backend</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#888888]">Versão</span>
              <span className="font-mono text-[#ededed]">v1</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

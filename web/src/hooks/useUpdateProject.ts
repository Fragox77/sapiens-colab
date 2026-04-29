'use client'
import { useState } from 'react'
import { adminApi } from '@/lib/api'

export function useUpdateProject(id: string) {
  const [saving, setSaving] = useState(false)

  async function updateStatus(status: string, message?: string): Promise<void> {
    setSaving(true)
    try {
      await adminApi.updateStatus(id, status, message)
    } finally {
      setSaving(false)
    }
  }

  return { updateStatus, saving }
}

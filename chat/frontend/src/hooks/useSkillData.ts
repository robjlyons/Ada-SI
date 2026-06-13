import { useCallback, useEffect, useState } from 'react'
import { fetchSkillData, saveSkillData } from '../api/client'
import { useAppStore } from '../state/store'
import type { SkillDataDocument } from '../types/events'

export function useSkillData(skillName: string | null) {
  const skillDataRevision = useAppStore((s) => s.skillDataRevision)
  const [data, setData] = useState<SkillDataDocument>({ records: [] })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    if (!skillName) return
    setLoading(true)
    try {
      const doc = await fetchSkillData(skillName)
      setData(doc)
      setError(null)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [skillName])

  useEffect(() => {
    void reload()
  }, [reload, skillDataRevision])

  const persist = useCallback(
    async (next: SkillDataDocument) => {
      if (!skillName) return
      const saved = await saveSkillData(skillName, next)
      setData(saved)
      setError(null)
    },
    [skillName],
  )

  return { data, loading, error, reload, persist }
}

export function newRecordId(): string {
  return crypto.randomUUID()
}

import { useState } from 'react'
import { newRecordId, useSkillData } from '../../hooks/useSkillData'
import type { SkillUiConfig } from '../../types/events'

type ListAppProps = {
  skillName: string
  ui: SkillUiConfig
}

export function ListApp({ skillName, ui }: ListAppProps) {
  const titleField = ui.title_field || 'title'
  const doneField = ui.done_field || 'done'
  const { data, loading, error, persist } = useSkillData(skillName)
  const [draft, setDraft] = useState('')

  const handleAdd = async () => {
    if (!draft.trim()) return
    const record: Record<string, unknown> = {
      id: newRecordId(),
      [titleField]: draft.trim(),
      [doneField]: false,
    }
    await persist({ records: [...data.records, record] })
    setDraft('')
  }

  const toggleDone = async (id: string) => {
    await persist({
      records: data.records.map((record) =>
        record.id === id ? { ...record, [doneField]: !record[doneField] } : record,
      ),
    })
  }

  const handleDelete = async (id: string) => {
    await persist({ records: data.records.filter((r) => r.id !== id) })
  }

  if (loading && data.records.length === 0) {
    return <p className="skill-app-status">Loading list…</p>
  }

  return (
    <div className="skill-app-list-app">
      {error && <p className="skill-app-error">{error}</p>}

      <form
        className="skill-app-form"
        onSubmit={(e) => {
          e.preventDefault()
          void handleAdd()
        }}
      >
        <input
          type="text"
          placeholder="Add item…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <button type="submit" className="btn-primary btn-sm">
          Add
        </button>
      </form>

      <ul className="skill-app-checklist">
        {data.records.length === 0 ? (
          <li className="skill-app-empty">No items yet.</li>
        ) : (
          data.records.map((record) => {
            const id = String(record.id ?? '')
            const done = Boolean(record[doneField])
            return (
              <li key={id || JSON.stringify(record)} className={done ? 'done' : ''}>
                <label>
                  <input
                    type="checkbox"
                    checked={done}
                    onChange={() => id && void toggleDone(id)}
                  />
                  <span>{String(record[titleField] ?? 'Untitled')}</span>
                </label>
                {id && (
                  <button
                    type="button"
                    className="btn-secondary btn-sm"
                    onClick={() => void handleDelete(id)}
                  >
                    Delete
                  </button>
                )}
              </li>
            )
          })
        )}
      </ul>
    </div>
  )
}

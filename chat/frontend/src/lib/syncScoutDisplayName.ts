import { fetchPersona } from '../api/client'
import { useAppStore } from '../state/store'

export async function syncScoutDisplayName(): Promise<string> {
  try {
    const persona = await fetchPersona()
    const name = (persona.display_name || 'ADA').trim() || 'ADA'
    useAppStore.getState().setScoutDisplayName(name)
    return name
  } catch {
    return useAppStore.getState().scoutDisplayName
  }
}

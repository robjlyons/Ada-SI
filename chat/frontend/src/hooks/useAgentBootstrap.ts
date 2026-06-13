import { fetchConfig, fetchModels } from '../api/client'
import { THINKING_EFFORT_STORAGE_KEY } from '../constants'
import { useAppStore } from '../state/store'
import { isWildcardModel } from '../utils/models'
import { normalizeReasoningEffort } from '../utils/reasoningEffort'
import { loadPromptsIntoStore } from './usePromptsLoader'

export function useAgentBootstrap() {
  const loadAgents = async () => {
    const {
      chatModel,
      toolCreatorModel,
      setAppConfig,
      setModels,
      setChatModel,
      setToolCreatorModel,
      setThinkingEffort,
      setTools,
      setStatus,
    } = useAppStore.getState()

    setStatus('Loading agents...')
    try {
      const config = await fetchConfig()
      setAppConfig(config)
      try {
        await loadPromptsIntoStore()
      } catch {
        setStatus('Could not load prompts. Open Settings to retry.', true)
      }

      const modelList = (await fetchModels()).filter((id) => !isWildcardModel(id))

      if (modelList.length === 0) {
        setModels([])
        setStatus('No agents available. Add API keys to .env and restart.', true)
        return
      }

      setModels(modelList)

      const preferredChat =
        [chatModel, config.lite_model, config.chat_model].find(
          (v) => v && modelList.includes(v),
        ) || modelList[0]
      const preferredTool =
        [toolCreatorModel, config.tool_creator_model, config.second_model].find(
          (v) => v && modelList.includes(v),
        ) || modelList[0]

      setChatModel(preferredChat)
      setToolCreatorModel(preferredTool)
      if (!localStorage.getItem(THINKING_EFFORT_STORAGE_KEY) && config.lite_model_reasoning_effort) {
        setThinkingEffort(normalizeReasoningEffort(config.lite_model_reasoning_effort))
      }
      const { fetchTools } = await import('../api/client')
      const tools = await fetchTools()
      setTools(tools)
      const currentStatus = useAppStore.getState().status
      if (!currentStatus.startsWith('Could not load prompts')) {
        setStatus('')
      }
    } catch (error) {
      setModels([])
      setStatus(`Could not load agents: ${(error as Error).message}`, true)
    }
  }

  return { loadAgents }
}

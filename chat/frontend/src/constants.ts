export const PROGRESSION_STORAGE_KEY = 'ada-player-progress'

export const CHAT_MODEL_STORAGE_KEY = 'ada-si-chat-model'
export const SECOND_MODEL_STORAGE_KEY = 'ada-si-second-model'
export const SYSTEM_STORAGE_KEY = 'ada-si-system-instructions'
export const SCROLL_THRESHOLD = 80
export const MAX_TEXTAREA_ROWS = 6

export const BUILD_STEPS = [
  { step_id: 'generate_code', label: 'Generate skill code' },
  { step_id: 'validate_code', label: 'Validate module structure' },
  { step_id: 'sandbox_test', label: 'Run sandbox tests' },
  { step_id: 'pip_review', label: 'Review pip packages' },
  { step_id: 'runtime_verify', label: 'Verify in skill runtime' },
  { step_id: 'install_tool', label: 'Install skill' },
] as const

export const VIEWER_PHASES = [
  { id: 'generate_code', label: 'Generate' },
  { id: 'validate_code', label: 'Validate' },
  { id: 'sandbox_test', label: 'Sandbox' },
  { id: 'pip_review', label: 'Pip review' },
  { id: 'runtime_verify', label: 'Runtime' },
  { id: 'install_tool', label: 'Install' },
] as const

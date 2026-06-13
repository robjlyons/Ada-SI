import type { EffectivePrompts, PromptsConfig } from '../../types/events'

export type PromptSection = {
  key: keyof PromptsConfig
  label: string
  hint: string
  rows: number
  effectiveKey?: keyof EffectivePrompts
}

export type PromptGroup = {
  id: string
  title: string
  description: string
  sections: PromptSection[]
}

export const PROMPT_GROUPS: PromptGroup[] = [
  {
    id: 'scout',
    title: 'Scout agent',
    description: 'System prompt and tool routing for the chat orchestrator model.',
    sections: [
      {
        key: 'scout_orchestrator_prefix',
        label: 'Orchestrator intro & rules 1–5',
        hint: 'Opening identity and core routing rules sent to the Scout agent.',
        rows: 7,
        effectiveKey: 'scout_orchestrator',
      },
      {
        key: 'scout_orchestrator_suffix',
        label: 'Orchestrator closing rule',
        hint: 'Tool naming and description requirements after routing rules.',
        rows: 2,
        effectiveKey: 'scout_orchestrator',
      },
      {
        key: 'scout_additional_directives',
        label: 'Additional directives',
        hint: 'Optional extra instructions appended to the Scout system prompt.',
        rows: 3,
        effectiveKey: 'scout_orchestrator',
      },
      {
        key: 'tool_generate_new_description',
        label: 'generate_new_tool description',
        hint: 'Tool schema description shown to the Scout agent for new skills.',
        rows: 4,
      },
      {
        key: 'tool_edit_existing_description',
        label: 'edit_existing_tool description',
        hint: 'Tool schema description shown to the Scout agent for skill edits.',
        rows: 3,
      },
    ],
  },
  {
    id: 'forge-shared',
    title: 'Forge master — shared rules',
    description: 'Appended automatically to every Forge plan and code generation prompt.',
    sections: [
      {
        key: 'forge_runtime_context',
        label: 'Runtime context',
        hint: 'Sandbox constraints for forged Python skills.',
        rows: 4,
      },
    ],
  },
  {
    id: 'forge-plan',
    title: 'Forge master — planning',
    description: 'Prompts used when drafting or revising skill plans.',
    sections: [
      {
        key: 'forge_plan_prompt',
        label: 'New skill plan',
        hint: 'Base prompt before shared rules are appended.',
        rows: 5,
        effectiveKey: 'forge_plan',
      },
      {
        key: 'forge_revise_plan_prompt',
        label: 'Revise skill plan',
        hint: 'Used when the user rejects a plan and requests changes.',
        rows: 5,
        effectiveKey: 'forge_revise_plan',
      },
      {
        key: 'forge_edit_plan_prompt',
        label: 'Edit existing skill plan',
        hint: 'Used when modifying an installed skill.',
        rows: 5,
        effectiveKey: 'forge_edit_plan',
      },
    ],
  },
  {
    id: 'forge-code',
    title: 'Forge master — code generation',
    description: 'Prompts used when generating or updating skill source code.',
    sections: [
      {
        key: 'forge_code_prompt',
        label: 'Generate skill code',
        hint: 'Produces tool_code, test_code, and requirements JSON.',
        rows: 10,
        effectiveKey: 'forge_code',
      },
      {
        key: 'forge_edit_code_prompt',
        label: 'Edit skill code',
        hint: 'Updates an existing skill module.',
        rows: 8,
        effectiveKey: 'forge_edit_code',
      },
    ],
  },
  {
    id: 'forge-repair',
    title: 'Forge master — repair passes',
    description: 'Prompts used when auto-fixing failed builds, validation, or tests.',
    sections: [
      {
        key: 'forge_fix_codegen_prompt',
        label: 'Fix malformed JSON',
        hint: 'Repairs unparseable Forge master JSON responses.',
        rows: 5,
        effectiveKey: 'forge_fix_codegen',
      },
      {
        key: 'forge_fix_validation_prompt',
        label: 'Fix validation errors',
        hint: 'Repairs tool modules that fail static validation.',
        rows: 5,
        effectiveKey: 'forge_fix_validation',
      },
      {
        key: 'forge_fix_test_prompt',
        label: 'Fix sandbox tests',
        hint: 'Repairs test_code after sandbox failures.',
        rows: 5,
        effectiveKey: 'forge_fix_test',
      },
      {
        key: 'forge_fix_runtime_prompt',
        label: 'Fix runtime failures',
        hint: 'Repairs tool_code and test_code after runtime verification fails.',
        rows: 5,
        effectiveKey: 'forge_fix_runtime',
      },
    ],
  },
]

export const EMPTY_PROMPTS: PromptsConfig = {
  scout_orchestrator_prefix: '',
  scout_orchestrator_suffix: '',
  scout_additional_directives: '',
  forge_runtime_context: '',
  forge_plan_prompt: '',
  forge_revise_plan_prompt: '',
  forge_edit_plan_prompt: '',
  forge_code_prompt: '',
  forge_edit_code_prompt: '',
  forge_fix_test_prompt: '',
  forge_fix_codegen_prompt: '',
  forge_fix_validation_prompt: '',
  forge_fix_runtime_prompt: '',
  tool_generate_new_description: '',
  tool_edit_existing_description: '',
}

export function createEmptyEffectivePrompts(): EffectivePrompts {
  return {
    scout_orchestrator: '',
    forge_plan: '',
    forge_revise_plan: '',
    forge_edit_plan: '',
    forge_code: '',
    forge_edit_code: '',
    forge_fix_test: '',
    forge_fix_codegen: '',
    forge_fix_validation: '',
    forge_fix_runtime: '',
  }
}

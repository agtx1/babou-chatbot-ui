import { OPENAI_API_TYPE } from '../utils/app/const';

export interface OpenAIModel {
  id: string;
  name: string;
  maxLength: number; // maximum length of a message
  tokenLimit: number;
  provider: string;
}

export enum OpenAIModelID {
  GPT_3_5 = 'gpt-3.5-turbo',
  GPT_4 = 'gpt-4',
  GPT_3_5_16K = 'gpt-3.5-turbo-16k',
  GPT_4_TURBO = 'gpt-4-0125-preview',
  CLAUDE = 'claude-3-opus-20240229'
}

export enum AIProviderID{
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic'
}

// in case the `DEFAULT_MODEL` environment variable is not set or set to an unsupported model
export const fallbackModelID = OpenAIModelID.GPT_3_5;

export const OpenAIModels: Record<OpenAIModelID, OpenAIModel> = {
  [OpenAIModelID.GPT_3_5]: {
    id: OpenAIModelID.GPT_3_5,
    name: 'GPT-3.5',
    maxLength: 12000,
    tokenLimit: 4000,
    provider: AIProviderID.OPENAI,
  },
  [OpenAIModelID.GPT_3_5_16K]: {
    id: OpenAIModelID.GPT_3_5_16K,
    name: 'GPT-3.5-16K',
    maxLength: 48000,
    tokenLimit: 16000,
    provider: AIProviderID.OPENAI,
  },
  [OpenAIModelID.GPT_4]: {
    id: OpenAIModelID.GPT_4,
    name: 'GPT-4',
    maxLength: 24000,
    tokenLimit: 5000,
    provider: AIProviderID.OPENAI,
  },
  [OpenAIModelID.GPT_4_TURBO]: {
    id: OpenAIModelID.GPT_4_TURBO,
    name: 'gpt-4-0125-preview',
    maxLength: 110000,
    tokenLimit: 128000,
    provider: AIProviderID.OPENAI,
  },
  [OpenAIModelID.CLAUDE]: {
    id: OpenAIModelID.CLAUDE,
    name: 'claude-3-opus-20240229',
    maxLength: 110000,
    tokenLimit: 128000,
    provider: AIProviderID.ANTHROPIC,
  },
};

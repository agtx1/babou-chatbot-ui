import { Conversation } from './chat';
import { FolderInterface } from './folder';
import { PluginKey } from './plugin';
import { Prompt } from './prompt';
import { Settings } from './settings';
import { JSONSchemaType } from "ajv";

// keep track of local storage schema
export interface StorageSchema {
  apiKey: string;
  conversationHistory: Conversation[];
  selectedConversation: Conversation;
  theme: 'light' | 'dark';
  // added folders (3/23/23)
  folders: FolderInterface[];
  // added prompts (3/26/23)
  prompts: Prompt[];
  // added showChatbar and showPromptbar (3/26/23)
  showChatbar: boolean;
  showPromptbar: boolean;
  // added plugin keys (4/3/23)
  pluginKeys: PluginKey[];
  settings: Settings;
}

export enum RemoteStorageItems {
  ConversationHistory = 'conversationHistory',
  Folders = 'folders',
  Prompts = 'prompts',
  SelectedConversation = 'selectedConversation'
}

export interface StorageKey{
  id: string;
  item: RemoteStorageItems;
}

export interface EncryptedStoredObject {
  key: StorageKey;
  timestamp: number | null;
  data: string | null;
}

export const storageKeySchema: JSONSchemaType<StorageKey> = {
  type: "object",
  properties: {
    id: { type: "string" },
    item: { type: "string", enum: Object.values(RemoteStorageItems) },
  },
  required: ["id", "item"],
  additionalProperties: false,
};


export const encryptedStoredObjectSchema: JSONSchemaType<EncryptedStoredObject> = {
  type: "object",
  properties: {
    key: storageKeySchema,
    timestamp: { type: ["number", "null"] as any },
    data: { type: ["string", "null"] as any},
  },
  required: ["key", "timestamp", "data"],
  additionalProperties: false,
};


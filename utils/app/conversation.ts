import { Conversation } from '@/types/chat';
import { AppStorage } from './storage';

export const updateConversation = (
  updatedConversation: Conversation,
  allConversations: Conversation[],
) => {
  const updatedConversations = allConversations.map((c) => {
    if (c.id === updatedConversation.id) {
      return updatedConversation;
    }

    return c;
  });

  saveConversation(updatedConversation);
  saveConversations(updatedConversations);

  return {
    single: updatedConversation,
    all: updatedConversations,
  };
};
const encrypt= async (value: any): Promise<{ salt: string, iv: string, data: string }>  => {
  const password = 'password'; // Replace with your actual password
  const salt = crypto.getRandomValues(new Uint8Array(16)); // Generate a random salt
  const iv = crypto.getRandomValues(new Uint8Array(12)); // Generate a random initialization vector

  // Derive a cryptographic key from the password
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw', 
    passwordBuffer, 
    'PBKDF2', 
    false, 
    ['deriveKey', 'deriveBits']
  );
  const key = await window.crypto.subtle.deriveKey(
    {
      'name': 'PBKDF2',
      'salt': salt,
      'iterations': 100000,
      'hash': 'SHA-256'
    },
    keyMaterial,
    { 'name': 'AES-GCM', 'length': 256 },
    true,
    [ 'encrypt', 'decrypt' ]
  );

  // Convert the data to a Uint8Array
  const data = encoder.encode(JSON.stringify(value));

  // Encrypt the data
  const encrypted = await window.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    data
  );

  // Convert the ArrayBuffer to a base64 string

  const encryptedBuffer = Buffer.from(new Uint8Array(encrypted));
  const encryptedString = encryptedBuffer.toString('base64');  
  const saltBase64 = Buffer.from(salt).toString('base64');
  const ivBase64 = Buffer.from(iv).toString('base64');

  return { salt: saltBase64, iv: ivBase64, data: encryptedString };

}

const serializeConversations = (conversation: Conversation) => {
  const {name, messages, prompt , ... rest} = conversation;
  const output = {name: encrypt(name), messages: encrypt(messages), prompt: encrypt(prompt), ...rest};
  return JSON.stringify(output);
}


export const saveConversation = (conversation: Conversation) => {
  AppStorage.setItem('selectedConversation', JSON.stringify(conversation));
};

export const saveConversations = (conversations: Conversation[]) => {
  AppStorage.setItem('conversationHistory', JSON.stringify(conversations));
};

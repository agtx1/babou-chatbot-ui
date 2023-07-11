export const config = {
  runtime: 'edge',
};

import { DEFAULT_SYSTEM_PROMPT, DEFAULT_TEMPERATURE } from '@/utils/app/const';
import { OpenAIError, OpenAIStream } from '@/utils/server';

import { ChatBody, Message } from '@/types/chat';

// @ts-expect-error
import wasm from '../../node_modules/@dqbd/tiktoken/lite/tiktoken_bg.wasm?module';

import tiktokenModel from '@dqbd/tiktoken/encoders/cl100k_base.json';
import { Tiktoken, init } from '@dqbd/tiktoken/lite/init';

const handler = async (req: Request): Promise<Response> => {
  try {
    const { model, messages, key, prompt, temperature } = (await req.json()) as ChatBody;

    await init((imports) => WebAssembly.instantiate(wasm, imports));
    const encoding = new Tiktoken(
      tiktokenModel.bpe_ranks,
      tiktokenModel.special_tokens,
      tiktokenModel.pat_str,
    );

    let promptToSend = prompt;
    if (!promptToSend) {
      promptToSend = DEFAULT_SYSTEM_PROMPT;
    }

    let temperatureToUse = temperature;
    if (temperatureToUse == null) {
      temperatureToUse = DEFAULT_TEMPERATURE;
    }

    const prompt_tokens = encoding.encode(promptToSend);

    let tokenCount = prompt_tokens.length;
    let totalTokenCount = messages.reduce((count, message) => count + encoding.encode(message.content).length, 0) + tokenCount;

    let messagesToSend: Message[] = [];
    
    if (1===1) {
        // If total token count exceeds the limit, create an array of trimmed messages
        let trimmedMessages = await Promise.all(messages.map(async message => {
          const response = await fetch(`https://${req.headers.get('host')}/api/trim`, {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json'
              },
              credentials: 'include', // Include cookies
              body: JSON.stringify({ content: message.content })
          });
          const { trimmedText } = await response.json();
          message.content = trimmedText;
          return message;
      }));
    
        // Start adding messages from most recent, until adding more would exceed the limit
        for (let i = trimmedMessages.length - 1; i >= 0; i--) {
            let tokens = encoding.encode(trimmedMessages[i].content);
            if (tokenCount + tokens.length + 1000 > model.tokenLimit) {
                break;
            }
            tokenCount += tokens.length;
            messagesToSend = [trimmedMessages[i], ...messagesToSend];
        }
    } else {
        // If total token count doesn't exceed the limit, use the original messages
        messagesToSend = messages;
    }
    

    encoding.free();

    const stream = await OpenAIStream(model, promptToSend, temperatureToUse, key, messagesToSend);

    return new Response(stream);
  } catch (error) {
    console.error(error);
    if (error instanceof OpenAIError) {
      return new Response('Error', { status: 500, statusText: error.message });
    } else {
      return new Response('Error', { status: 500 });
    }
  }
};

export default handler;

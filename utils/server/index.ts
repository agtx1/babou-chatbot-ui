import { Message, AIStreamRequest } from '@/types/chat';
import { OpenAIModel, AIProviderID } from '@/types/openai';

import { AZURE_DEPLOYMENT_ID, OPENAI_API_HOST, OPENAI_API_TYPE, OPENAI_API_VERSION, OPENAI_ORGANIZATION, ANTHROPIC_API_KEY } from '../app/const';

import {
  ParsedEvent,
  ReconnectInterval,
  createParser,
} from 'eventsource-parser';


export class OpenAIError extends Error {
  type: string;
  param: string;
  code: string;

  constructor(message: string, type: string, param: string, code: string) {
    super(message);
    this.name = 'OpenAIError';
    this.type = type;
    this.param = param;
    this.code = code;
  }
}

export const OpenAIStream = async (
  streamRequest: AIStreamRequest
) => {
  if (streamRequest.model.provider === AIProviderID.OPENAI){
    return OpenAIStreamPromise(streamRequest)
  }
  else{
    return AnthropicAIStreamPromise(streamRequest)
  }
}

const AnthropicAIStreamPromise = async  (
  streamRequest: AIStreamRequest
) =>{
  const model = streamRequest.model;
  const systemPrompt = streamRequest.systemPrompt;
  const temperature = streamRequest.temperature;
  const key = streamRequest.key ? streamRequest.key : ANTHROPIC_API_KEY
  const messages = streamRequest.messages;

  const url = 'https://api.anthropic.com/v1/messages';

  const messagePayload = [];
  let nextRole = 'user';
  for (const message of messages) {
      if (message.content && (nextRole === message.role)){
          const objectToAdd = {role: message.role, content: message.content};
          if (!objectToAdd.content || !objectToAdd.content.trim()){
              objectToAdd.content = 'No message';
          }
          messagePayload.push(objectToAdd);
          if (nextRole === 'assistant'){
              nextRole = 'user';
          }
          else{
              nextRole = 'assistant'
          }
      }
  }

  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'accept': 'application/json',
      'anthropic-version': '2023-06-01'
    },
    method: 'POST',
    body: JSON.stringify({
      system: systemPrompt,
      model: model.id,
      messages: messagePayload,
      max_tokens: 4096,
      temperature: temperature,
      stream: true,
    }),
  });


  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  if (res.status !== 200) {
    const result = await res.json();
    if (result.error) {
      throw new OpenAIError(
        result.error.message,
        result.error.type,
        result.error.param,
        result.error.code,
      );
    } else {
      throw new Error(
        `Anthropic API returned an error: ${
          decoder.decode(result?.value) || result.statusText
        }`,
      );
    }
  }

  const stream = new ReadableStream({
    async start(controller) {
      const onParse = (event: ParsedEvent | ReconnectInterval) => {
        if (event.type === 'event' && event.data !== '[DONE]') {
          const data = event.data;
          try {
            const responseObject = JSON.parse(data);
            if (responseObject['type'] === 'message_stop'){
              controller.close();
              return;
            }
            if (responseObject['type'] === 'content_block_delta' && responseObject.hasOwnProperty('delta') && responseObject.delta['type'] === 'text_delta'){
              const text = responseObject.delta.text;
              const queue = encoder.encode(text);
              controller.enqueue(queue);
            }
          } catch (e) {
            controller.error(e);
          }
        }
      };

      const parser = createParser(onParse);

      for await (const chunk of res.body as any) {
        parser.feed(decoder.decode(chunk));
      }
    },
  });

  return stream;

}

const OpenAIStreamPromise = async  (
  streamRequest: AIStreamRequest
) =>{
  
  const model = streamRequest.model;
  const systemPrompt = streamRequest.systemPrompt;
  const temperature = streamRequest.temperature;
  const key = streamRequest.key;
  const messages = streamRequest.messages;
  let url = `${OPENAI_API_HOST}/v1/chat/completions`;
  if (OPENAI_API_TYPE === 'azure') {
    url = `${OPENAI_API_HOST}/openai/deployments/${AZURE_DEPLOYMENT_ID}/chat/completions?api-version=${OPENAI_API_VERSION}`;
  }
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...(OPENAI_API_TYPE === 'openai' && {
        Authorization: `Bearer ${key ? key : process.env.OPENAI_API_KEY}`
      }),
      ...(OPENAI_API_TYPE === 'azure' && {
        'api-key': `${key ? key : process.env.OPENAI_API_KEY}`
      }),
      ...((OPENAI_API_TYPE === 'openai' && OPENAI_ORGANIZATION) && {
        'OpenAI-Organization': OPENAI_ORGANIZATION,
      }),
    },
    method: 'POST',
    body: JSON.stringify({
      ...(OPENAI_API_TYPE === 'openai' && {model: model.id}),
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        ...messages,
      ],
      max_tokens: 1000,
      temperature: temperature,
      stream: true,
    }),
  });

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  if (res.status !== 200) {
    const result = await res.json();
    if (result.error) {
      throw new OpenAIError(
        result.error.message,
        result.error.type,
        result.error.param,
        result.error.code,
      );
    } else {
      throw new Error(
        `OpenAI API returned an error: ${
          decoder.decode(result?.value) || result.statusText
        }`,
      );
    }
  }

  const stream = new ReadableStream({
    async start(controller) {
      const onParse = (event: ParsedEvent | ReconnectInterval) => {
        if (event.type === 'event' && event.data !== '[DONE]') {
          const data = event.data;
          try {
            const json = JSON.parse(data);
            if (json.choices[0].finish_reason != null) {
              controller.close();
              return;
            }
            const text = json.choices[0].delta.content;
            const queue = encoder.encode(text);
            controller.enqueue(queue);
          } catch (e) {
            controller.error(e);
          }
        }
      };

      const parser = createParser(onParse);

      for await (const chunk of res.body as any) {
        parser.feed(decoder.decode(chunk));
      }
    },
  });

  return stream;
};

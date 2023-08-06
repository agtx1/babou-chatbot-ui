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
import { TokenPayload } from 'google-auth-library';

const handler = async (req: Request): Promise<Response> => {
  try {
    let { model, messages, prompt, key, temperature, compressionEnabled } = (await req.json()) as ChatBody;
    let jwtPayload: TokenPayload | null;
    let email: string;
    const iapJwt = req.headers.get('x-goog-iap-jwt-assertion');
    try{
      const jwtPayloadResp = await fetch(`http://localhost:3000/api/jwt`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        credentials: 'include', // Include cookies
        body: JSON.stringify({ iapJwt: iapJwt })
      });
      const jwtPayloadJson = await jwtPayloadResp.json();      
      if (!jwtPayloadJson || !jwtPayloadJson.hasOwnProperty('jwtPayload')){
        const error = new Error();
        error.name = "Unauthorized";
        throw error;
      }

      jwtPayload = jwtPayloadJson.jwtPayload;
      if (!jwtPayload){
        const e = new Error;
        e.name = "Unauthorized";
        e.message = "JWT payload null";
        throw e;
      }

      email = jwtPayload.email ? jwtPayload.email.toLowerCase() : '';

    }
    catch(err : any){
      console.error(JSON.stringify(err));
      if (err.name === "Unauthorized"){
        return new Response('Error', { status: 401, statusText: "Unauthorized" });
      }
      else{
        return new Response('Error', { status: 500, statusText: "Server error" });
      }
    }
    if (!key && jwtPayload && email.indexOf("@edelson.com") >-1 && process.env.EPC_OPENAI_API_KEY){
      console.info("Using EPC API key for " + email);
      key = process.env.EPC_OPENAI_API_KEY;
    }
    else{
      console.info("Using default API key for " + email);
    }
    
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

    let messagesToProcess: Message[] = [...messages];
    let messagesToSend: Message[] = [];
    if (messagesToProcess.length>0){

      if (compressionEnabled){
        let lastMessage = messagesToProcess.pop() as Message;
    
        try{
          // If total token count exceeds the limit, create an array of trimmed messages
          const trimmedMessages =    await Promise.all(messagesToProcess.map(async message => {
                const response = await fetch(`http://localhost:3000/api/trim`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    credentials: 'include', // Include cookies
                    body: JSON.stringify({ content: message.content, removeSpaces: false, stemmer: "porter" })
                });
                const responseData = await response.json();
                message.content = responseData.content;
                return message;
                
            }));
            messagesToProcess = [...trimmedMessages, lastMessage];
            promptToSend += "\n\nSome messages may be compressed, which should not affect the output.";
        }
        catch(err){
          console.warn("Trim API error");
          console.warn(err);
          messagesToProcess = [];
          messagesToProcess.push(...messages);
        }
      }


      // Start adding messages from most recent, until adding more would exceed the limit
      for (let i = messagesToProcess.length - 1; i >= 0; i--) {
          let tokens = encoding.encode(messagesToProcess[i].content);
          if (tokenCount + tokens.length + 1000 > model.tokenLimit) {
              break;
          }
          tokenCount += tokens.length;
          messagesToSend = [messagesToProcess[i], ...messagesToSend];
        }
  
    }

    encoding.free();

    const stream = await OpenAIStream(model, promptToSend, temperatureToUse, key, messagesToSend);

    return new Response(stream);
  } catch (error) {
    console.error(JSON.stringify(error));
    if (error instanceof OpenAIError) {
      return new Response('Error', { status: 500, statusText: error.message });
    } else {
      return new Response('Error', { status: 500 });
    }
  }
};

export default handler;

import { encryptedStoredObjectSchema, storageKeySchema } from '@/types/storage';
import { syncData } from '@/utils/server/storage';
import Ajv from 'ajv';
import { NextApiRequest, NextApiResponse } from 'next';
import { OAuth2Client } from 'google-auth-library';

const ajv = new Ajv();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        // Handle any case where the method is not POST
        res.status(405).send({ error: 'Method Not Allowed', method: req.method });
        return;
    }

    //Verify signed headers
    const iapJwt = req.headers['x-goog-iap-jwt-assertion'] ;
    if (!iapJwt || typeof iapJwt !== 'string'){
        res.status(401).end();
        return;
    }
    const oAuth2Client = new OAuth2Client();
    const iapKeys = await oAuth2Client.getIapPublicKeys();
    let ticket;
    try{
         ticket = await oAuth2Client.verifySignedJwtWithCertsAsync(
            iapJwt,
            iapKeys.pubkeys,
            ['/projects/770518757971/global/backendServices/4193308648746630573','/projects/770518757971/global/backendServices/1131294156959390611'],
            ['https://cloud.google.com/iap']
        );    
    }
    catch{
        res.status(401).end();
        return;
    }
  
  let userId : string;

  const ticketPayload = ticket.getPayload();
  if (ticketPayload){
    userId = ticketPayload.sub;
  }
  else{
    console.error("Error loading user id");
    res.status(500).end();
    return;
  }

  const {value} = req.body;
    
  const validateEncryptedStoredObject = ajv.compile(encryptedStoredObjectSchema);
  if (!validateEncryptedStoredObject(value)){
    const validateStorageKey = ajv.compile(storageKeySchema);
    if (!validateStorageKey(value)){
        res.status(400).end();
        return;
    }
  }


  const syncOutput = await syncData(userId,value);
  
  if (syncOutput.changed){
    res.status(200).json(syncOutput.value);
  }
  else{
    res.status(204).end();
  }

}
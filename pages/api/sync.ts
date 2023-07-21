import { RemoteStorageKeys } from '@/types/storage';
import { getData } from '@/utils/server/storage';
import { off } from 'firebase/database';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        // Handle any case where the method is not POST
        res.status(405).send({ error: 'Method Not Allowed', method: req.method });
        return;
    }

    const {key, data} = req.body;  
    
    // Check if keys are all in RemoteStorageKeys
    if(!RemoteStorageKeys.includes(key)){
        const err = 'Invalid data: should be a RemoteStorageKey';
        res.status(400).send({ error: err });
        throw err;
    }
  
    // Check if data is a string
    if (data && typeof data !== 'string') {
        const err = 'Invalid data: should be a string';
        res.status(400).send({ error: err });
        throw err;
    }

    const userId = '' //implement

    if (!data){
        const keysToGet = keys ?? RemoteStorageKeys;
        try{
            const data = await getData(userId,keysToGet);
            res.json(data);
        }
        catch(err){
            console.error(err);
            res.status(500);
        }
    }
    else{
        
    }

}
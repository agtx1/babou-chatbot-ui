import { getJwtPayload } from '@/utils/server/jwt';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        // Handle any case where the method is not POST
        res.status(405).send({ error: 'Method Not Allowed', method: req.method });
        return;
    }
    const iapJwt = req.headers['x-goog-iap-jwt-assertion'];
    let jwtPayload = null;
    if (typeof iapJwt === 'string'){
        try{
            jwtPayload = await getJwtPayload(iapJwt);
        }
        catch(err){
            console.error(JSON.stringify(err));
            return;
        }
    }
    
    res.status(200).json({ jwtPayload: jwtPayload });
    return;
}

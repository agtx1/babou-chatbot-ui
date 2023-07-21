import { RemoteStorageItems } from "@/types/storage";
import { getData } from "@/utils/server/storage";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        // Handle any case where the method is not POST
        res.status(405).send({ error: 'Method Not Allowed', method: req.method });
        return;
    }

    const userId = '' //implement

    try{
        const data = await getData(userId,RemoteStorageItems);
        res.json(data);
    }
    catch{
        res.send(null);
    }
    return;
}
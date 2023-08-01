import { OAuth2Client } from 'google-auth-library';

export const getJwtPayload = async (iapJwt: string) => {    
    //Verify signed headers
    
    if (!iapJwt || typeof iapJwt !== 'string'){
        const err = new Error("Invalid Jwt");
        err.name = 'Unauthorized'
        throw err;
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
    catch(err : any){
        console.error("Error verifying JWT");
        err.name = 'Unauthorized'
        throw err;
    }
  

  const ticketPayload = ticket.getPayload();

  return ticketPayload;

}

export const getUserId = async (iapJwt: string) => {    
  const ticketPayload = await getJwtPayload(iapJwt);
  let userId : string;
  if (ticketPayload){
    userId = ticketPayload.sub;
  }
  else{
    throw new Error("Error loading user id");
  }

  return userId;
}
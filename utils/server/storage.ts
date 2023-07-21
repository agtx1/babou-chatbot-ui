import {getDatabase} from 'firebase-admin/database';

import { initializeApp } from "firebase-admin/app";
import { EncryptedStoredObject, StorageKey, StorageSchema, encryptedStoredObjectSchema, storageKeySchema } from "@/types/storage";
import Ajv from 'ajv';


const ajv = new Ajv();
const firebaseApp = initializeApp();
const db = getDatabase(firebaseApp);


// Function to store data
const storeData = (userId: string, value: EncryptedStoredObject) => {

  const validateEncryptedStoredObject = ajv.compile(encryptedStoredObjectSchema);
  if (!validateEncryptedStoredObject(value)){
    console.error(JSON.stringify(validateEncryptedStoredObject.errors))
    throw new TypeError("Invalid value");
  }
  const ref = db.ref(userId);
  const updates = {
    [`metadata/${value.key.item}/${value.key.id}`]: {timestamp: value.timestamp ?? Date.now()},
    [`data/${value.key.item}/${value.key.id}`]: value.data,
  };
  
  return ref.update(updates);

};

const getMetadataSnapshot = (userId: string, oStorageKey: StorageKey) => {
  const ref = db.ref(userId);
  return ref.child(`metadata/${oStorageKey.item}/${oStorageKey.id}`).get();
}

const getDataSnapshot = (userId: string, oStorageKey: StorageKey) => {
  const ref = db.ref(userId);
  return ref.child(`data/${oStorageKey.item}/${oStorageKey.id}`).get();
}


export const syncData  = async (userId: string, value: EncryptedStoredObject | StorageKey) => {

  let output: {value: EncryptedStoredObject, changed: boolean};
  
  if ((value as EncryptedStoredObject).data === undefined) {
    const oStorageKey = value as StorageKey;
    const validateStorageKey = ajv.compile(storageKeySchema);
    if (!validateStorageKey(oStorageKey)){
      console.error(JSON.stringify(validateStorageKey.errors));
      throw new TypeError("Invalid value");
    }
    output = {value: {key: value as StorageKey, data: null, timestamp: null }, changed: true};
    const metadataSnapshot = await getMetadataSnapshot(userId,oStorageKey);
    const metadata = metadataSnapshot.val();
    const storedTimestamp = metadata && metadata.timestamp ? metadata.timestamp : null;
    if (storedTimestamp){
      output.value.timestamp = storedTimestamp;
      const dataSnapshot = await getDataSnapshot(userId,oStorageKey);
      output.value.data = dataSnapshot.exists() ? dataSnapshot.val() : null;
    }
  }
  else{
    const oStorageObject = value as EncryptedStoredObject
    const validateEncryptedStoredObject = ajv.compile(encryptedStoredObjectSchema);
    if (!validateEncryptedStoredObject(oStorageObject)){
      console.error(JSON.stringify(validateEncryptedStoredObject.errors));
      throw new TypeError("Invalid value");
    }
    oStorageObject.timestamp = oStorageObject.timestamp ?? Date.now();
    output = {value: oStorageObject, changed: false};

    const metadataSnapshot = await getMetadataSnapshot(userId,oStorageObject.key);
    const metadata = metadataSnapshot.val();
    const storedTimestamp = metadata && metadata.timestamp ? metadata.timestamp : null;
    if (typeof storedTimestamp !== 'number' || oStorageObject.timestamp > storedTimestamp){
        await storeData(userId, oStorageObject);
    }
    else if (oStorageObject.timestamp !== storedTimestamp){
      const dataSnapshot = await getDataSnapshot(userId,oStorageObject.key);
      const storedData = dataSnapshot.val();
      if (storedData === null || typeof storedData === 'string'){
        output.changed = true;
        oStorageObject.timestamp = storedTimestamp;
        oStorageObject.data = storedData;
      }
      else{
        await storeData(userId,oStorageObject);
      }
    }

  }

  return output;
} 

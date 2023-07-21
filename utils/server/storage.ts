import { getFirestore, doc, setDoc, collection, query, where  } from "firebase/firestore";

import { initializeApp } from "firebase/app";
import { StorageSchema } from "@/types/storage";
import crypto from 'crypto';
import { KeyValuePair } from "@/types/data";

const firebaseConfig = {
    //
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);


// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(app);
const userId = ""; // implement

const userDataRef = collection(db, `userData/${userId}`);

// Function to store data
export const storeData = (userId: string, key: keyof StorageSchema, data: string) => {
    const hash = crypto.createHash('sha256').update(data).digest('base64');

    return setDoc(doc(userDataRef,key), {hash, data});
};

export const dataIsChanged = async (userId: string, key: keyof StorageSchema, data: string) => {
    const hash = crypto.createHash('sha256').update(data).digest('base64');
    const snapshot = await get(ref(db, `${userId}/${key}/hash`));
    return snapshot.val() !== hash;
};

export const getData = async (userId: string, keys: Array<keyof StorageSchema>) => {


    const q = query(userDataRef, where("state", "==", "CA"));

    for (const key of keys) {
      const snapshot = await get(ref(db, `${userId}/${key}/data`));
      if (snapshot.exists()) {
        const data = snapshot.val();
        if (typeof data === 'string'){
            results.push({ [key]: data });
        }
      }
    }
    return results;
  };
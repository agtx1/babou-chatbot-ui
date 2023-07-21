import { StorageSchema, RemoteStorageKeys } from "@/types/storage";

class AppStorageClass {
    public getItem<K extends keyof StorageSchema>(key: K): string | null {
        if (RemoteStorageKeys.includes(key)){
            //check for update
        }
      return localStorage.getItem(key);
    }
  
    public setItem<K extends keyof StorageSchema>(key: K, value: string): void {
      localStorage.setItem(key, value);

      if (RemoteStorageKeys.includes(key)){
        //store remotely with api
      }
    }
  
    public removeItem<K extends keyof StorageSchema>(key: K): void {
      localStorage.removeItem(key);

      if (RemoteStorageKeys.includes(key)){
        //delete remotely with API
      }
    }
  }
  
  export const AppStorage = new AppStorageClass();
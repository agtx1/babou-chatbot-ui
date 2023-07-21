import { StorageSchema, RemoteStorageItems } from "@/types/storage";

class AppStorageClass {
    public getItem<K extends keyof StorageSchema>(key: K): string | null {

      const localItem = localStorage.getItem(key);
      let remoteItem = null;

        if (key in RemoteStorageItems){

            //check for update
        }
      
      return remoteItem ?? localItem;

    }
  
    public setItem<K extends keyof StorageSchema>(key: K, value: string): void {
      localStorage.setItem(key, value);

      if (key in RemoteStorageItems){
        //store remotely with api
      }
    }
  
    public removeItem<K extends keyof StorageSchema>(key: K): void {
      localStorage.removeItem(key);

      if (key in RemoteStorageItems){
        //delete remotely with API
      }
    }
  }
  
  export const AppStorage = new AppStorageClass();
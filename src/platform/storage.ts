const DATABASE_NAME = "adapt-os-platform";
const DATABASE_VERSION = 1;
const STORE_NAME = "workspace";
const openDatabase = (): Promise<IDBDatabase> => new Promise((resolve, reject) => {
  if (typeof indexedDB === "undefined") return reject(new Error("IndexedDB is unavailable."));
  const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
  request.onupgradeneeded = () => {
    if (!request.result.objectStoreNames.contains(STORE_NAME)) request.result.createObjectStore(STORE_NAME);
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error ?? new Error("Could not open local storage."));
});
export const localWorkspaceStorage = {
  async get<T>(key: string): Promise<T | null> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const request = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(key);
      request.onsuccess = () => { db.close(); resolve((request.result as T | undefined) ?? null); };
      request.onerror = () => { db.close(); reject(request.error ?? new Error("Could not read local data.")); };
    });
  },
  async set<T>(key: string, value: T): Promise<void> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).put(value, key);
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error ?? new Error("Could not save local data.")); };
      tx.onabort = () => { db.close(); reject(tx.error ?? new Error("Local save was cancelled.")); };
    });
  },
  async remove(key: string): Promise<void> {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      tx.objectStore(STORE_NAME).delete(key);
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); reject(tx.error ?? new Error("Could not remove local data.")); };
    });
  }
};

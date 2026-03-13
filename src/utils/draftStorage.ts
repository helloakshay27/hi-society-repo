
/**
 * IndexedDB-based draft storage for offer form data.
 * Replaces localStorage to avoid the ~5 MB quota limit when storing base64 images.
 */

const DB_NAME = "addOfferDraftDB";
const DB_VERSION = 1;
const STORE_NAME = "draftStore";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveDraftItem(key: string, data: any): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.put(data, key);
      tx.oncomplete = () => { db.close(); resolve(true); };
      tx.onerror = () => { db.close(); resolve(false); };
    });
  } catch (e) {
    console.error("Error saving to IndexedDB:", e);
    return false;
  }
}

export async function loadDraftItem(key: string): Promise<any> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => { db.close(); resolve(req.result ?? null); };
      req.onerror = () => { db.close(); resolve(null); };
    });
  } catch (e) {
    console.error("Error loading from IndexedDB:", e);
    return null;
  }
}

export async function clearAllDraftItems(keys: string[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    keys.forEach((k) => store.delete(k));
    return new Promise((resolve) => {
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onerror = () => { db.close(); resolve(); };
    });
  } catch (e) {
    console.error("Error clearing IndexedDB:", e);
  }
}

export async function draftExists(keys: string[]): Promise<boolean> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const checks = keys.map(
      (k) =>
        new Promise<boolean>((resolve) => {
          const req = store.count(IDBKeyRange.only(k));
          req.onsuccess = () => resolve(req.result > 0);
          req.onerror = () => resolve(false);
        })
    );
    const results = await Promise.all(checks);
    db.close();
    return results.some(Boolean);
  } catch {
    return false;
  }
}

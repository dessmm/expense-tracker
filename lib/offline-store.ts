const DB_NAME = 'ZenithLedgerOfflineDB';
const DB_VERSION = 1;

export interface PendingExpense {
  localId: string;
  amount: number;
  category: string;
  date: string;
  description: string | null;
  tags: string[] | null;
  status: 'pending' | 'failed';
  error?: string;
  created_at?: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('IndexedDB is only available in browser'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('cache')) {
        db.createObjectStore('cache');
      }
      if (!db.objectStoreNames.contains('queue')) {
        db.createObjectStore('queue', { keyPath: 'localId' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveCachedData(key: string, data: any): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction('cache', 'readwrite');
    const store = tx.objectStore('cache');
    store.put(data, key);
    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.error('Error saving to IndexedDB cache:', err);
  }
}

export async function getCachedData(key: string): Promise<any | null> {
  try {
    const db = await openDB();
    const tx = db.transaction('cache', 'readonly');
    const store = tx.objectStore('cache');
    const request = store.get(key);
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Error reading from IndexedDB cache:', err);
    return null;
  }
}

export async function queuePendingExpense(expense: Omit<PendingExpense, 'localId' | 'status'>): Promise<PendingExpense> {
  const db = await openDB();
  const tx = db.transaction('queue', 'readwrite');
  const store = tx.objectStore('queue');
  const pendingExpense: PendingExpense = {
    ...expense,
    localId: `pending_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    status: 'pending',
    created_at: new Date().toISOString()
  };
  store.put(pendingExpense);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve(pendingExpense);
    tx.onerror = () => reject(tx.error);
  });
}

export async function getPendingExpenses(): Promise<PendingExpense[]> {
  try {
    const db = await openDB();
    const tx = db.transaction('queue', 'readonly');
    const store = tx.objectStore('queue');
    const request = store.getAll();
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Error reading from IndexedDB queue:', err);
    return [];
  }
}

export async function removePendingExpense(localId: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction('queue', 'readwrite');
  const store = tx.objectStore('queue');
  store.delete(localId);
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function updatePendingExpenseStatus(localId: string, status: 'pending' | 'failed', error?: string): Promise<void> {
  const db = await openDB();
  const tx = db.transaction('queue', 'readwrite');
  const store = tx.objectStore('queue');
  const getReq = store.get(localId);
  
  return new Promise((resolve, reject) => {
    getReq.onsuccess = () => {
      const data = getReq.result;
      if (data) {
        data.status = status;
        if (error) {
          data.error = error;
        } else {
          delete data.error;
        }
        store.put(data);
      }
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

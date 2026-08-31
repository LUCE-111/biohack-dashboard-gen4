import type { RosterVersion } from '../types.ts';

const DB_NAME = 'biohack-roster-db';
const DB_VERSION = 1;
const STORE_NAME = 'rosterVersions';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('근무표 저장소를 열 수 없습니다.'));
  });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('근무표 저장 작업에 실패했습니다.'));
  });
}

export async function saveRosterVersion(version: RosterVersion): Promise<void> {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    await requestResult(tx.objectStore(STORE_NAME).put(version));
  } finally {
    db.close();
  }
}

export async function loadRosterVersion(id: string): Promise<RosterVersion | null> {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const value = await requestResult<RosterVersion | undefined>(tx.objectStore(STORE_NAME).get(id));
    return value ?? null;
  } finally {
    db.close();
  }
}

export async function listRosterVersions(): Promise<readonly RosterVersion[]> {
  const db = await openDb();
  try {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const values = await requestResult<RosterVersion[]>(tx.objectStore(STORE_NAME).getAll());
    return values.sort((a, b) => b.importedAt.localeCompare(a.importedAt));
  } finally {
    db.close();
  }
}

export async function pruneRosterVersions(keepIds: readonly string[], maxVersions = 3): Promise<void> {
  const versions = await listRosterVersions();
  const keep = new Set(keepIds);
  versions.slice(0, maxVersions).forEach((version) => keep.add(version.id));
  const remove = versions.filter((version) => !keep.has(version.id));
  if (remove.length === 0) {
    return;
  }
  const db = await openDb();
  try {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    remove.forEach((version) => tx.objectStore(STORE_NAME).delete(version.id));
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('이전 근무표 정리에 실패했습니다.'));
      tx.onabort = () => reject(tx.error ?? new Error('이전 근무표 정리에 실패했습니다.'));
    });
  } finally {
    db.close();
  }
}

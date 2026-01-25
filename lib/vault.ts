import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface PlutoDB extends DBSchema {
    checkups: {
        key: string;
        value: {
            id: string;
            timestamp: number;
            encryptedData: ArrayBuffer;
            iv: Uint8Array;
        };
        indexes: { 'by-timestamp': number };
    };
}

const DB_NAME = 'pluto-health-vault';
const STORE_NAME = 'checkups';

// --- Crypto Helpers ---

// Get or generate a local key.
// In a real app, this might be derived from a user password to prevent local snooping if unlocked.
// For this demo, we store the key in localStorage so it persists across reloads but never leaves the device.
async function getEncryptionKey(): Promise<CryptoKey> {
    const KEY_STORAGE_NAME = 'pluto-vault-key';
    if (typeof window === 'undefined') return null as any; // Server-side guard

    const existingKeyJwk = localStorage.getItem(KEY_STORAGE_NAME);

    if (existingKeyJwk) {
        return window.crypto.subtle.importKey(
            'jwk',
            JSON.parse(existingKeyJwk),
            { name: 'AES-GCM', length: 256 },
            true, // extractable
            ['encrypt', 'decrypt']
        );
    }

    const key = await window.crypto.subtle.generateKey(
        { name: 'AES-GCM', length: 256 },
        true,
        ['encrypt', 'decrypt']
    );

    const exported = await window.crypto.subtle.exportKey('jwk', key);
    localStorage.setItem(KEY_STORAGE_NAME, JSON.stringify(exported));
    return key;
}

async function encryptData(data: any, key: CryptoKey): Promise<{ cipherText: ArrayBuffer; iv: Uint8Array }> {
    const enc = new TextEncoder();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoded = enc.encode(JSON.stringify(data));

    const cipherText = await window.crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        encoded
    );

    return { cipherText, iv };
}

async function decryptData(cipherText: ArrayBuffer, iv: Uint8Array, key: CryptoKey): Promise<any> {
    const dec = new TextDecoder();
    const decrypted = await window.crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv as any },
        key,
        cipherText
    );
    return JSON.parse(dec.decode(decrypted));
}

// --- DB Operations ---

let dbPromise: Promise<IDBPDatabase<PlutoDB>>;

function getDB() {
    if (typeof window === 'undefined') return Promise.resolve(null as any);

    if (!dbPromise) {
        dbPromise = openDB<PlutoDB>(DB_NAME, 1, {
            upgrade(db) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('by-timestamp', 'timestamp');
            },
        });
    }
    return dbPromise;
}

export interface CheckupRecord {
    id: string;
    timestamp: number;
    symptoms: string;
    triageResult: any; // The JSON result from the triage API
    aiAnalysis?: string; // Optional AI response
}

export async function saveCheckup(symptoms: string, triageResult: any, aiAnalysis?: string) {
    const key = await getEncryptionKey();
    if (!key) throw new Error("Encryption key not available");

    const record: CheckupRecord = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        symptoms,
        triageResult, // Expecting { level, color, assessment }
        aiAnalysis
    };

    const { cipherText, iv } = await encryptData(record, key);

    const db = await getDB();
    await db.put(STORE_NAME, {
        id: record.id,
        timestamp: record.timestamp,
        encryptedData: cipherText,
        iv
    });

    return record;
}

export async function getHistory(): Promise<CheckupRecord[]> {
    const db = await getDB();
    if (!db) return [];

    const key = await getEncryptionKey();
    if (!key) return [];

    // Get all records sorted by timestamp
    const records = await db.getAllFromIndex(STORE_NAME, 'by-timestamp');

    const decryptedPromises = records.map(async (encryptedRecord: PlutoDB['checkups']['value']) => {
        try {
            const data = await decryptData(encryptedRecord.encryptedData, encryptedRecord.iv, key);
            return data as CheckupRecord;
        } catch (e) {
            console.error("Failed to decrypt record", encryptedRecord.id, e);
            return null;
        }
    });

    const results = await Promise.all(decryptedPromises);
    return results.filter((r): r is CheckupRecord => r !== null).reverse(); // Newest first
}

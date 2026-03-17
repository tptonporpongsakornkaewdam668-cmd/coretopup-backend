/**
 * Simple In-Memory Cache Service
 * ป้องกันการยิง API ภายนอก (wePAY, Peamsub) ซ้ำโดยไม่จำเป็น
 */

const store = new Map();

/**
 * ดึงข้อมูลจาก cache หรือ fetch ใหม่ถ้าหมดอายุ
 * @param {string} key - Cache key
 * @param {Function} fetcher - Async function ที่จะ call ถ้า cache miss
 * @param {number} ttlMs - อายุ cache เป็น ms (default 5 นาที)
 */
async function getCached(key, fetcher, ttlMs = 5 * 60 * 1000) {
    const cached = store.get(key);
    if (cached && Date.now() < cached.expiresAt) {
        return cached.data;
    }
    const data = await fetcher();
    store.set(key, { data, expiresAt: Date.now() + ttlMs });
    return data;
}

/**
 * ล้าง cache สำหรับ key ที่ระบุ (เช่นหลัง admin update)
 */
function invalidate(key) {
    store.delete(key);
}

/**
 * ล้าง cache ทั้งหมด
 */
function invalidateAll() {
    store.clear();
}

module.exports = { getCached, invalidate, invalidateAll };

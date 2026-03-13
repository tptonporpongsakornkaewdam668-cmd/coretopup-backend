# คู่มือการติดตั้งระบบตรวจสอบสลิปอัตโนมัติด้วย Slip2Go

คู่มือนี้แนะนำวิธีการติดตั้งระบบตรวจสอบสลิป (Slip Verification) สำหรับเว็บไซต์ เพื่อรองรับการเติมเงินอัตโนมัติ โดยใช้บริการของ **Slip2Go**

---

## 1. ผังการทำงานของระบบ (Architecture)

เพื่อให้ระบบมีความปลอดภัยสูงสุด เราจะไม่เรียก API ของ Slip2Go จากฝั่ง Browser โดยตรง (เพื่อป้องกันไม่ให้ Secret Key หลุด) แต่จะใช้โครงสร้างดังนี้:

`User UI` -> `Your Backend/Proxy (Server-side)` -> `Slip2Go API`

1. **Frontend**: รับรูปภาพสลิป หรือ Scan QR Code จากผู้ใช้
2. **Proxy API**: รับข้อมูลจาก Frontend -> แนบ Secret Key -> ส่งต่อให้ Slip2Go
3. **Slip2Go**: ตรวจเช็คข้อมูลกับธนาคาร -> ส่งผลลัพธ์กลับมา
4. **Backend**: ตรวจสอบความถูกต้องของยอดเงิน -> เพิ่มยอดเงิน (Balance) ในฐานข้อมูล

---

## 2. การเตรียมตัว (Prerequisites)

1. สมัครบัญชีที่ [Slip2Go Connect](https://connect.slip2go.com)
2. นำ **Secret Key** มาเก็บไว้ในระบบ (ห้ามเปิดเผยต่อสาธารณะ)
3. เตรียม Environment Variables ใน Server/Hosting ของคุณ:
   - `SLIP2GO_SECRET_KEY`: คีย์ที่ได้จาก Slip2Go
   - `SLIP2GO_API_URL`: `https://connect.slip2go.com`

---

## 3. ส่วนของ Backend (Proxy API)

สร้างไฟล์ API บน Server ของคุณ (ตัวอย่างสำหรับ Cloudflare Functions หรือ Node.js) เพื่อทำหน้าที่เป็นทางผ่านและรักษาความลับของคีย์

### ตัวอย่าง Node.js / Cloudflare Functions:
```typescript
// functions/api/verify-slip.ts
export const onRequest = async (context) => {
    const { request, env } = context;
    const body = await request.json();
    const { method, qrCode, base64Image } = body;

    const SLIP2GO_KEY = env.SLIP2GO_SECRET_KEY;
    const API_URL = "https://connect.slip2go.com";

    let endpoint = "";
    let payload = {};

    // เลือก Endpoint ตามประเภทข้อมูล
    if (method === "qr-code") {
        endpoint = `${API_URL}/api/verify-slip/qr-code/info`;
        payload = { payload: { qrCode } };
    } else if (method === "qr-base64") {
        endpoint = `${API_URL}/api/verify-slip/qr-base64/info`;
        payload = { payload: { imageBase64: base64Image } };
    }

    // เรียก Slip2Go
    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${SLIP2GO_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });

    const result = await response.json();
    return new Response(JSON.stringify(result));
};
```

---

## 4. ส่วนของ Frontend (API Client)

สร้างฟังก์ชันสำหรับเรียกใช้งานจากหน้าเว็บไซต์

```typescript
// src/lib/slipVerify.ts
export async function verifySlip(base64Image: string) {
    const response = await fetch('/api/verify-slip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            method: 'qr-base64',
            base64Image: base64Image
        })
    });

    const result = await response.json();
    
    // ตรวจสอบ Code ความสำเร็จของ Slip2Go (200000 หรือ 200200)
    if (result.code === '200000' || result.code === '200200') {
        return { success: true, data: result.data };
    }
    return { success: false, error: result.message };
}
```

---

## 5. การตรวจสอบความถูกต้อง (Business Logic)

เมื่อได้รับข้อมูล `data` จาก Slip2Go แล้ว คุณ **ต้อง** ตรวจสอบสิ่งเหล่านี้ก่อนเพิ่มเงินให้ลูกค้า:

1. **ยอดเงิน (Amount)**: ตรงกับที่ผู้ใช้แจ้ง หรือยอดที่ระบบกำหนดหรือไม่?
2. **ผู้รับเงิน (Receiver)**: เลขบัญชีผู้รับในสลิป ตรงกับเลขบัญชีของเว็บคุณหรือไม่?
3. **การใช้สลิปซ้ำ (Duplicate)**: นำ `transRef` หรือ `referenceId` ไปเช็คในฐานข้อมูลว่าเคยใช้เติมเงินไปแล้วหรือยัง?

---

## 6. คำแนะนำด้านความปลอดภัย

- **Rate Limiting**: จำกัดจำนวนครั้งในการตรวจสอบสลิปต่อต่อนาที เพื่อป้องกันการปั่น API (Bot Attack)
- **Log System**: บันทึกทุกรายการที่มีการตรวจสอบไว้ในฐานข้อมูล (Payload ที่ส่งไปและกลับ) เพื่อใช้ตรวจสอบย้อนหลังหากเกิดปัญหา
- **Firebase Auth**: หากใช้ Firebase ควรกำหนดให้เฉพาะผู้ที่ Login แล้วเท่านั้นที่สามารถเรียก API ตรวจสอบสลิปได้

---
จัดทำโดย: ระบบช่วยเหลือกาารพัฒนาเว็บไซต์

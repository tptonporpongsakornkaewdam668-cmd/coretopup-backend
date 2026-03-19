require("dotenv").config();
const { createClient } = require("@libsql/client");

const tursoUrl = process.env.TURSO_DATABASE_URL || "libsql://coinzonetopup-coinzone.aws-ap-northeast-1.turso.io";
const tursoToken = process.env.TURSO_AUTH_TOKEN || "eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3NzM5NDM1ODEsImlkIjoiMDE5ZDA3NDYtYzAwMS03YmZkLWI1MzQtZWU2ZTBiMzg3MTc2IiwicmlkIjoiYTA1MjQyOWItZGQ2NS00MzE0LTkyZjItZTZlOTYzZmM0NmIwIn0.3kIfeP_XKVZnlZUO_DdBitwosxx9IUgDQu9Y7b_nQlX4_QwifNFkSlwhfYxmgpdJANt-TcPqWEGxvz_qWBwBw";

const db = createClient({
    url: tursoUrl,
    authToken: tursoToken,
});

// ส่งออก db ในรูปแบบเดียวกับที่อื่นๆ เคยใช้ supabase (แต่โค้ดที่เรียกข้างนอกต้องแก้เป็น SQL ทั้งหมด)
module.exports = { supabase: db, db };

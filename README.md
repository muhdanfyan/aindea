# 🏛️ Aindea: Digitalizing Buton Heritage Through Intelligent AI

[![Vercel Deployment](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://aindea.vercel.app)
[![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20Vite%20%7C%20DeepSeek-blue?style=for-the-badge)](https://muhdanfyan.github.io)

**Aindea** (Asisten Digital Bahasa Wolio) adalah proyek inovatif yang menggabungkan pelestarian budaya tradisional dengan teknologi *Artificial Intelligence* (AI) terkini. Proyek ini dirancang untuk menjadi jembatan bagi generasi digital dalam mempelajari dan melestarikan **Bahasa Wolio**, bahasa ibu Kesultanan Buton yang kaya akan nilai sejarah namun menghadapi tantangan digitalisasi.

---

## 🚀 Visi & Harapan Proyek
Harapan utama dari pembuatan repositori ini adalah menciptakan ekosistem digital di mana Bahasa Wolio tidak hanya bertahan, tetapi juga berkembang secara dinamis. 
- **Digital Preservation**: Mengonversi literatur klasik (seperti Kamus Ungkapan Wolio 1985) ke dalam model data yang bisa dipahami AI.
- **Cultural Accessibility**: Mempermudah siapa pun, di mana pun, untuk mempelajari tata bahasa dan kosakata Wolio secara interaktif.
- **AI for Local Languages**: Menunjukkan bahwa teknologi AI global dapat "diajarkan" untuk memahami dialek lokal yang spesifik melalui teknik *contextual prompting*.

---

## 🛠️ Tech Stack: The Modern Foundation

Aindea dibangun dengan standar industri modern untuk memastikan kecepatan, keamanan, dan pengalaman pengguna yang premium:

### **Frontend: Sleek & Reactive**
- **Vite + React JS**: Framework ultra-cepat untuk performa antarmuka yang responsif.
- **Framer Motion**: Animasi mikro yang halus untuk memberikan kesan aplikasi yang "hidup".
- **Lucide React**: Library ikon modern untuk UI yang bersih dan intuitif.
- **Modern CSS**: Desain kustom dengan sentuhan *glassmorphism* dan *dark mode* yang elegan.

### **Backend: Robust & Secure**
- **Vercel Serverless Functions**: Menangani logika backend secara efisien tanpa perlu server fisik.
- **Security Proxy**: API Key disembunyikan di sisi server untuk mencegah kebocoran data (*anti-leak system*).
- **Hybrid AI Core**: 
  - **DeepSeek AI (Primary)**: Otak utama untuk penalaran (*reasoning*) bahasa yang superior.
  * **Google Gemini (Fallback)**: Sistem cadangan cerdas untuk menjamin ketersediaan layanan 100%.

---

## ⚙️ Sistem Kerja: Bagaimana Aindea Berpikir?

Aindea tidak hanya sekadar "menerjemahkan" kata-per-kata, melainkan memahami konteks budaya melalui tiga tahap:

1. **Context Loading**: Menyuntikkan konteks dari database kamus ungkapan dan aturan gramatika Wolio ke dalam prompt AI (RAG-Lite approach).
2. **Hybrid Proxying**: Frontend berkomunikasi dengan Vercel API `/api/ai`, yang melakukan negosiasi aman dengan DeepSeek/Gemini API.
3. **Grammar Evaluation**: AI mengevaluasi akhiran vokal (karakteristik unik Wolio) dan memberikan koreksi secara natural dalam sosok **La Ayi**.

---

## 🧔 Tentang Pembuat
**Muhdan Fyan Syah Sofian** adalah Full Stack Developer dengan pengalaman lebih dari 10 tahun, berdedikasi dalam pengembangan komunitas lokal di Buton dan institusi **Pondok Informatika**.

🔗 **Portofolio**: [muhdanfyan.github.io](https://muhdanfyan.github.io)

---
*Dibuat dengan semangat melestarikan warisan budaya Buton melalui baris kode.*

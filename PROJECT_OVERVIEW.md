# 🏛️ Aindea: Digitalizing Buton Heritage Through Intelligent AI

**Aindea** (Asisten Digital Bahasa Wolio) adalah proyek inovatif yang menggabungkan pelestarian budaya tradisional dengan teknologi *Artificial Intelligence* (AI) terkini. Proyek ini dirancang untuk menjadi jembatan bagi generasi digital dalam mempelajari dan melestarikan **Bahasa Wolio**, bahasa ibu Kesultanan Buton yang kaya akan nilai sejarah namun menghadapi tantangan digitalisasi.

---

## 🚀 Visi & Harapan Proyek
Harapan utama dari pembuatan repositori ini adalah menciptakan ekosistem digital di mana Bahasa Wolio tidak hanya bertahan, tetapi juga berkembang secara dinamis. 
- **Digital Preservation**: Mengonversi literatur klasik (seperti Kamus Ungkapan Wolio 1985) ke dalam model data yang bisa dipahami AI.
- **Cultural Accessibility**: Mempermudah siapa pun, di mana pun, untuk mempelajari tata bahasa dan kosakata Wolio secara interaktif.
- **AI for Local Languages**: Menunjukkan bahwa teknologi AI global (seperti DeepSeek & Gemini) dapat "diajarkan" untuk memahami dialek lokal yang spesifik melalui teknik *contextual prompting*.

---

## 🛠️ Tech Stack: The Modern Foundation

Aindea dibangun dengan standar industri modern untuk memastikan kecepatan, keamanan, dan pengalaman pengguna yang premium:

### **Frontend: Sleek & Reactive**
- **Vite + React JS**: Framework ultra-cepat untuk performa antarmuka yang responsif.
- **Framer Motion**: Digunakan untuk animasi mikro yang halus, memberikan kesan aplikasi yang "hidup" dan premium.
- **Lucide React**: Library ikon modern untuk UI yang bersih dan intuitif.
- **Vanilla CSS (Modern)**: Desain kustom dengan sentuhan *glassmorphism* dan *dark mode* yang elegan.

### **Backend: Robust & Secure**
- **Vercel Serverless Functions**: Menangani logika backend secara efisien tanpa perlu server fisik (Serverless Architecture).
- **Security Proxy**: API Key (DeepSeek & Gemini) disembunyikan di sisi server untuk mencegah kebocoran data (*anti-leak system*).
- **Vercel Edge/Serverless Runtime**: Memastikan respon AI diterima oleh pengguna dengan latensi minimal.

### **AI Core: Hybrid Intelligence**
- **DeepSeek AI (Primary)**: Digunakan sebagai otak utama karena kemampuan penalaran (*reasoning*) dan efisiensi bahasanya yang superior.
- **Google Gemini (Fallback)**: Berfungsi sebagai sistem cadangan cerdas untuk memastikan layanan tetap aktif 100% jika kuota engine utama tercapai.

---

## ⚙️ Sistem Kerja: Bagaimana Aindea Berpikir?

Aindea tidak hanya sekadar "menerjemahkan" kata-per-kata, melainkan memahami konteks budaya:

1. **Context Loading**: Setiap kali pengguna bertanya, sistem menyuntikkan (inject) konteks dari *database* kamus ungkapan dan aturan gramatika Wolio ke dalam prompt AI.
2. **Hybrid Proxying**: Frontend mengirim permintaan ke endpoint `/api/ai`. Backend Vercel kemudian melakukan negosiasi dengan DeepSeek API menggunakan kunci rahasia.
3. **Grammar Validation**: Dalam mode **Tutor**, AI mengevaluasi apakah akhiran vokal (karakteristik unik Bahasa Wolio) sudah tepat dan memberikan koreksi secara natural (seperti guru asli).
4. **Natural Response**: Hasil dikembalikan dalam format terstruktur yang mencakup teks Wolio, terjemahan Indonesia, dan tips gramatika.

---

## 💎 Mengapa Ini Menarik Untuk Portofolio?

Menghubungkan **Aindea** ke [muhdanfyan.github.io](https://muhdanfyan.github.io) akan menonjolkan profil Anda sebagai pengembang yang:
1. **Tech-Savvy**: Menguasai integrasi AI tingkat lanjut (DeepSeek/Gemini) dan arsitektur Serverless.
2. **Culturally Conscious**: Memiliki kepedulian sosial untuk menggunakan teknologi demi pelestarian budaya (Social Impact).
3. **Problem Solver**: Mampu mengatasi masalah teknis nyata, seperti manajemen API Key yang aman dan optimasi UX.
4. **Full-Stack Competence**: Menunjukkan kemampuan mengelola siklus hidup aplikasi dari desain UI, backend, hingga *cloud deployment*.

---

> **"Aindea adalah bukti bahwa teknologi masa depan bisa berjalan beriringan dengan kearifan masa lalu."**

# 🍱 Bento Dashboard - Sistem Tracking Kata Kasar

Aplikasi web untuk tracking dan ranking kata kasar dengan sistem denda.

## 🚀 Deployment ke Vercel

### Persiapan
1. Pastikan semua file sudah dalam struktur yang benar:
   ```
   ├── server.js          # Backend API
   ├── package.json       # Dependencies
   ├── vercel.json        # Konfigurasi Vercel
   └── public/            # Frontend files
       ├── index.html
       ├── style.css
       ├── script.js
       └── data.json
   ```

### Langkah Deploy
1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login ke Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy project:**
   ```bash
   vercel
   ```
   - Pilih "Y" untuk setup project
   - Pilih scope/team
   - Konfirmasi nama project
   - Pilih "N" untuk override settings (gunakan vercel.json)

4. **Deploy production:**
   ```bash
   vercel --prod
   ```

### Fitur Setelah Deploy
- ✅ Auto-save data ke file JSON
- ✅ Data persisten di server
- ✅ Akses dari mana saja
- ✅ Backup otomatis

## 🛠️ Development Lokal

### Setup
```bash
npm install
npm start
```

### Akses
- Frontend: `http://localhost:3001`
- API: `http://localhost:3001/api/`

## 📁 Struktur Project

- `server.js` - Express server dengan API endpoints
- `public/` - Static files (HTML, CSS, JS)
- `vercel.json` - Konfigurasi deployment Vercel
- `package.json` - Dependencies dan scripts

## 🔧 API Endpoints

- `POST /api/save-data` - Simpan data ke JSON file
- `GET /api/load-data` - Load data dari JSON file

## 💾 Sistem Penyimpanan

1. **Vercel/Server:** Auto-save ke file JSON
2. **Local HTML:** Hanya localStorage + manual backup
3. **Development:** Auto-save ke file lokal

## 🎯 Fitur Utama

- Dashboard ranking peserta
- Sistem denda otomatis
- Dark mode
- Export/import data
- Responsive design
- Real-time statistics
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_FILE_PATH = path.join(__dirname, 'public', 'data.json');
const IS_PRODUCTION = process.env.VERCEL || process.env.NODE_ENV === 'production';

// In-memory storage sebagai fallback untuk production
let memoryData = null;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Fungsi untuk menulis data ke file JSON atau memory
async function writeDataToFile(data) {
    // Selalu simpan ke memory sebagai backup
    memoryData = data;
    
    if (IS_PRODUCTION) {
        console.log('⚠️  PRODUCTION MODE: Data disimpan ke memory (sementara)');
        console.log('📝 SOLUSI PERMANEN: Gunakan database eksternal seperti:');
        console.log('   - Supabase (PostgreSQL) - GRATIS');
        console.log('   - MongoDB Atlas - GRATIS');
        console.log('   - PlanetScale (MySQL) - GRATIS');
        console.log('   - Vercel KV Storage');
        return true;
    }
    
    try {
        await fs.writeFile(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
        console.log('✅ Data berhasil disimpan ke data.json (development)');
        return true;
    } catch (error) {
        console.error('❌ Error writing to data.json:', error);
        console.log('📝 Menggunakan memory storage sebagai fallback');
        return true; // Tetap return true karena data tersimpan di memory
    }
}

// Fungsi untuk membaca data dari file JSON atau memory
async function readDataFromFile() {
    // Jika ada data di memory (production), gunakan itu
    if (memoryData && IS_PRODUCTION) {
        return memoryData;
    }
    
    try {
        const data = await fs.readFile(DATA_FILE_PATH, 'utf8');
        const parsedData = JSON.parse(data);
        // Simpan ke memory juga untuk backup
        memoryData = parsedData;
        return parsedData;
    } catch (error) {
        console.log('No data.json found, creating new file with default data');
        const defaultData = {
            participants: [],
            settings: {
                isDarkMode: false,
                lastUpdated: new Date().toISOString(),
                version: "1.0.0"
            },
            metadata: {
                created: new Date().toISOString(),
                totalSessions: 0,
                description: "Database untuk Dashboard Kata Kasar"
            }
        };
        await writeDataToFile(defaultData);
        return defaultData;
    }
}

// Endpoint untuk menyimpan data
app.post('/api/save-data', async (req, res) => {
    try {
        const data = req.body;
        await writeDataToFile(data);
        
        const message = IS_PRODUCTION 
            ? 'Data tersimpan sementara di memory. Untuk data permanen, gunakan database eksternal!' 
            : 'Data berhasil disimpan ke file JSON!';
        res.json({ success: true, message, isTemporary: IS_PRODUCTION });
    } catch (error) {
        console.error('Error saving data:', error);
        res.status(500).json({ success: false, message: 'Gagal menyimpan data!' });
    }
});

// Endpoint untuk membaca data
app.get('/api/load-data', async (req, res) => {
    try {
        const data = await readDataFromFile();
        res.json(data);
    } catch (error) {
        console.error('Error loading data:', error);
        res.status(500).json({ success: false, message: 'Gagal memuat data!' });
    }
});

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, async () => {
    console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
    
    if (IS_PRODUCTION) {
        console.log('🔧 MODE: Production (Vercel)');
        console.log('💾 STORAGE: In-memory (sementara)');
        console.log('⚠️  PERINGATAN: Data akan hilang saat server restart!');
        console.log('');
        console.log('📋 SOLUSI PERMANEN:');
        console.log('1. Supabase: https://supabase.com (PostgreSQL gratis)');
        console.log('2. MongoDB Atlas: https://mongodb.com/atlas (gratis)');
        console.log('3. PlanetScale: https://planetscale.com (MySQL gratis)');
        console.log('4. Vercel KV: https://vercel.com/storage/kv');
    } else {
        console.log('🔧 MODE: Development (Local)');
        console.log('💾 STORAGE: File-based (data.json)');
        console.log('✅ Data akan tersimpan permanen di file');
    }
    
    // Pastikan data tersedia
    try {
        await readDataFromFile();
        console.log('✅ Data storage siap digunakan');
    } catch (error) {
        console.error('❌ Error initializing data storage:', error);
    }
});
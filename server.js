const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// In-memory storage untuk Vercel (karena file system read-only)
let appData = null;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Load initial data dari file (hanya sekali saat startup)
async function loadInitialData() {
    try {
        const filePath = path.join(__dirname, 'public', 'data.json');
        const data = await fs.readFile(filePath, 'utf8');
        appData = JSON.parse(data);
        console.log('Initial data loaded from data.json');
    } catch (error) {
        console.log('No initial data.json found, starting with empty data');
        appData = {
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
    }
}

// Endpoint untuk menyimpan data (in-memory untuk Vercel)
app.post('/api/save-data', async (req, res) => {
    try {
        const data = req.body;
        
        // Simpan ke memory
        appData = data;
        
        // Untuk development lokal, coba tulis ke file
        if (process.env.NODE_ENV !== 'production') {
            try {
                const filePath = path.join(__dirname, 'public', 'data.json');
                await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
                console.log('Data berhasil disimpan ke data.json (local)');
            } catch (fileError) {
                console.log('File write failed (expected in production):', fileError.message);
            }
        }
        
        console.log('Data berhasil disimpan ke memory');
        res.json({ success: true, message: 'Data berhasil disimpan!' });
    } catch (error) {
        console.error('Error saving data:', error);
        res.status(500).json({ success: false, message: 'Gagal menyimpan data!' });
    }
});

// Endpoint untuk membaca data
app.get('/api/load-data', async (req, res) => {
    try {
        if (!appData) {
            await loadInitialData();
        }
        res.json(appData);
    } catch (error) {
        console.error('Error loading data:', error);
        res.status(500).json({ success: false, message: 'Gagal memuat data!' });
    }
});

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize data dan start server
async function startServer() {
    await loadInitialData();
    app.listen(PORT, () => {
        console.log(`Server berjalan di http://localhost:${PORT}`);
        console.log('Aplikasi siap digunakan dengan in-memory storage!');
        console.log('Data akan persisten selama server berjalan.');
    });
}

startServer().catch(console.error);
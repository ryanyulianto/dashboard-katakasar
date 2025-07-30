const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_FILE_PATH = path.join(__dirname, 'public', 'data.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Fungsi untuk membaca data dari file JSON
async function readDataFromFile() {
    try {
        const data = await fs.readFile(DATA_FILE_PATH, 'utf8');
        return JSON.parse(data);
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

// Fungsi untuk menulis data ke file JSON
async function writeDataToFile(data) {
    try {
        await fs.writeFile(DATA_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
        console.log('Data berhasil disimpan ke data.json');
        return true;
    } catch (error) {
        console.error('Error writing to data.json:', error);
        throw error;
    }
}

// Endpoint untuk menyimpan data langsung ke file JSON
app.post('/api/save-data', async (req, res) => {
    try {
        const data = req.body;
        
        // Validasi data
        if (!data || typeof data !== 'object') {
            return res.status(400).json({ success: false, message: 'Data tidak valid!' });
        }
        
        // Update timestamp
        if (data.settings) {
            data.settings.lastUpdated = new Date().toISOString();
        }
        
        // Simpan langsung ke file JSON
        await writeDataToFile(data);
        
        res.json({ success: true, message: 'Data berhasil disimpan ke file JSON!' });
    } catch (error) {
        console.error('Error saving data:', error);
        res.status(500).json({ success: false, message: 'Gagal menyimpan data: ' + error.message });
    }
});

// Endpoint untuk membaca data langsung dari file JSON
app.get('/api/load-data', async (req, res) => {
    try {
        const data = await readDataFromFile();
        res.json(data);
    } catch (error) {
        console.error('Error loading data:', error);
        res.status(500).json({ success: false, message: 'Gagal memuat data: ' + error.message });
    }
});

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, async () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
    console.log('Aplikasi siap digunakan dengan file-based storage!');
    console.log('Data akan tersimpan permanen di data.json');
    
    // Pastikan file data.json ada
    try {
        await readDataFromFile();
        console.log('File data.json siap digunakan');
    } catch (error) {
        console.error('Error initializing data file:', error);
    }
});
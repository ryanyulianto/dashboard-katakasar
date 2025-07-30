const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// Endpoint untuk menyimpan data ke data.json
app.post('/api/save-data', async (req, res) => {
    try {
        const data = req.body;
        const filePath = path.join(__dirname, 'data.json');
        
        // Tulis data ke file data.json
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
        
        console.log('Data berhasil disimpan ke data.json');
        res.json({ success: true, message: 'Data berhasil disimpan!' });
    } catch (error) {
        console.error('Error saving data:', error);
        res.status(500).json({ success: false, message: 'Gagal menyimpan data!' });
    }
});

// Endpoint untuk membaca data dari data.json
app.get('/api/load-data', async (req, res) => {
    try {
        const filePath = path.join(__dirname, 'data.json');
        const data = await fs.readFile(filePath, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('Error loading data:', error);
        res.status(500).json({ success: false, message: 'Gagal memuat data!' });
    }
});

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
    console.log('Aplikasi siap digunakan dengan auto-save ke data.json!');
});
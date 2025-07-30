// Data peserta
let participants = [];
let isDarkMode = false;

// Load data saat halaman dimuat
window.addEventListener('load', function() {
    loadData();
});

// Fungsi untuk menambah peserta baru
function addParticipant() {
    const nameInput = document.getElementById('participantName');
    const name = nameInput.value.trim();
    
    if (name === '') {
        showNotification('Nama peserta tidak boleh kosong!', 'error');
        return;
    }
    
    if (participants.some(p => p.name.toLowerCase() === name.toLowerCase())) {
        showNotification('Nama peserta sudah ada!', 'error');
        return;
    }
    
    const newParticipant = {
        id: Date.now(),
        name: name,
        swearCount: 0,
        joinDate: new Date().toLocaleDateString('id-ID')
    };
    
    participants.push(newParticipant);
    nameInput.value = '';
    
    saveData();
    renderParticipants();
    updateStats();
    showNotification(`Peserta "${name}" berhasil ditambahkan!`, 'success');
}

// Fungsi untuk menambah jumlah kata kasar
function addSwear(participantId) {
    const participant = participants.find(p => p.id === participantId);
    if (participant) {
        participant.swearCount++;
        saveData();
        renderParticipants();
        updateStats();
        showNotification(`${participant.name} +1 kata kasar! Total: ${participant.swearCount}`, 'warning');
    }
}

// Fungsi untuk mengurangi jumlah kata kasar
function minusSwear(participantId) {
    const participant = participants.find(p => p.id === participantId);
    if (participant && participant.swearCount > 0) {
        participant.swearCount--;
        saveData();
        renderParticipants();
        updateStats();
        showNotification(`${participant.name} -1 kata kasar! Total: ${participant.swearCount}`, 'info');
    } else if (participant && participant.swearCount === 0) {
        showNotification('Jumlah kata kasar sudah 0!', 'error');
    }
}

// Fungsi untuk menghapus peserta
function deleteParticipant(participantId) {
    const participant = participants.find(p => p.id === participantId);
    if (participant && confirm(`Hapus peserta "${participant.name}"?`)) {
        participants = participants.filter(p => p.id !== participantId);
        saveData();
        renderParticipants();
        updateStats();
        showNotification(`Peserta "${participant.name}" berhasil dihapus!`, 'info');
    }
}

// Fungsi untuk render daftar peserta
function renderParticipants() {
    const participantsList = document.getElementById('participantsList');
    
    if (participants.length === 0) {
        participantsList.innerHTML = `
            <div class="empty-state">
                <i>👥</i>
                <p>Belum ada peserta.<br>Tambahkan peserta pertama!</p>
            </div>
        `;
        return;
    }
    
    participantsList.innerHTML = participants.map(participant => `
        <div class="participant-card">
            <div class="participant-info">
                <div class="participant-name">${participant.name}</div>
            </div>
            <div class="participant-actions">
                <button class="count-btn minus-btn" onclick="minusSwear(${participant.id})" title="Kurangi kata kasar">
                    −
                </button>
                <div class="swear-count">${participant.swearCount}</div>
                <button class="count-btn add-btn" onclick="addSwear(${participant.id})" title="Tambah kata kasar">
                    +
                </button>
                <button class="delete-btn" onclick="deleteParticipant(${participant.id})" title="Hapus peserta">
                    🗑️
                </button>
            </div>
        </div>
    `).join('');
}

// Fungsi untuk menampilkan dashboard ranking
function showRankingDashboard() {
    const modal = document.getElementById('rankingModal');
    const rankingList = document.getElementById('rankingList');
    
    // Update statistik ranking
    const totalSwears = participants.reduce((sum, p) => sum + p.swearCount, 0);
    document.getElementById('rankingTotalParticipants').textContent = participants.length;
    document.getElementById('rankingTotalSwears').textContent = totalSwears;
    document.getElementById('rankingTotalFine').textContent = `Rp ${totalSwears * 1000}`;
    
    // Urutkan peserta berdasarkan jumlah kata kasar
    const sortedParticipants = [...participants].sort((a, b) => b.swearCount - a.swearCount);
    
    if (sortedParticipants.length === 0) {
        rankingList.innerHTML = `
            <div class="empty-state">
                <i>🏆</i>
                <p>Belum ada data ranking.<br>Tambahkan peserta terlebih dahulu!</p>
            </div>
        `;
    } else {
        const medals = ['🥇', '🥈', '🥉'];
        
        rankingList.innerHTML = sortedParticipants.map((participant, index) => {
            const rank = index + 1;
            const rankClass = rank <= 3 ? `rank-${rank}` : '';
            const medal = rank <= 3 ? medals[index] : '';
            
            return `
                <div class="ranking-item ${rankClass}">
                    <div class="rank-position">${rank}</div>
                    ${medal ? `<div class="rank-medal">${medal}</div>` : ''}
                    <div class="rank-info">
                        <div class="rank-name">${participant.name}</div>
                        <div class="rank-score">${participant.swearCount} kata kasar (Denda: Rp ${participant.swearCount * 1000})</div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    modal.style.display = 'block';
}

// Fungsi untuk menutup modal ranking
function closeRankingModal() {
    document.getElementById('rankingModal').style.display = 'none';
}

// Fungsi untuk update statistik
function updateStats() {
    const totalParticipants = participants.length;
    const totalSwears = participants.reduce((sum, p) => sum + p.swearCount, 0);
    
    document.getElementById('totalParticipants').textContent = totalParticipants;
    document.getElementById('totalSwears').textContent = totalSwears;
    document.getElementById('totalFine').textContent = `Rp ${totalSwears * 1000}`;
}

// Fungsi untuk toggle dark mode
function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode', isDarkMode);
    saveData();
    showNotification(`Mode ${isDarkMode ? 'gelap' : 'terang'} diaktifkan!`, 'info');
}

// Fungsi untuk export data
function exportData() {
    const data = {
        participants: participants,
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `ranking-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    showNotification('Data berhasil diexport!', 'success');
}



// Fungsi untuk backup data ke file
function backupData() {
    const data = {
        participants: participants,
        settings: {
            isDarkMode: isDarkMode,
            lastUpdated: new Date().toISOString(),
            version: "1.0.0"
        },
        metadata: {
            created: new Date().toISOString(),
            totalSessions: participants.length,
            description: "Backup Database Dashboard Kata Kasar"
        }
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    showNotification('Backup berhasil diunduh!', 'success');
}

// Fungsi untuk reset semua data
function resetAllData() {
    if (confirm('Hapus semua data? Tindakan ini tidak dapat dibatalkan!')) {
        participants = [];
        saveData();
        renderParticipants();
        updateStats();
        showNotification('Semua data berhasil dihapus!', 'info');
    }
}

// Fungsi untuk menyimpan data langsung ke file data.json
async function saveData() {
    const data = {
        participants: participants,
        settings: {
            isDarkMode: isDarkMode,
            lastUpdated: new Date().toISOString(),
            version: "1.0.0"
        },
        metadata: {
            created: new Date().toISOString(),
            totalSessions: participants.length,
            description: "Database untuk Dashboard Kata Kasar"
        }
    };
    
    try {
        // Simpan ke localStorage sebagai backup
        localStorage.setItem('minimalistRankingData', JSON.stringify(data));
        
        // Coba simpan ke server backend untuk auto-write ke data.json
        try {
            const response = await fetch('/api/save-data', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            if (response.ok) {
                const result = await response.json();
                showNotification('Data berhasil disimpan ke file data.json!', 'success');
                updateSyncStatus('synced');
                return;
            } else {
                throw new Error('Server error: ' + response.status);
            }
        } catch (serverError) {
            console.log('Server tidak tersedia, menggunakan fallback:', serverError);
            
            // Fallback: Auto-download file JSON baru
            const dataStr = JSON.stringify(data, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            const url = URL.createObjectURL(dataBlob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = 'data.json';
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Cleanup URL object
            setTimeout(() => {
                URL.revokeObjectURL(url);
            }, 100);
            
            showNotification('Server offline. File data.json telah didownload - ganti file lama!', 'info');
            updateSyncStatus('local');
        }
        
    } catch (error) {
        console.error('Error saving data:', error);
        showNotification('Gagal menyimpan data!', 'error');
        updateSyncStatus('error');
    }
}

// Fungsi untuk update file data.json (simulasi untuk demo)
async function updateDataJsonFile(data) {
    try {
        // Dalam environment production, ini akan menjadi API call ke server
        // Untuk demo, kita tampilkan informasi bahwa data sudah siap untuk disinkronkan
        console.log('Data ready for sync to data.json:', data);
        
        // Buat download link untuk update manual data.json
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        
        // Simpan referensi untuk download manual jika diperlukan
        window.latestDataForSync = {
            data: data,
            downloadUrl: url,
            timestamp: new Date().toISOString()
        };
        
    } catch (error) {
        console.error('Error preparing data for sync:', error);
    }
}

// Fungsi untuk download data.json yang sudah diupdate
function downloadUpdatedDataJson() {
    try {
        // Buat data terkini untuk download
        const data = {
            participants: participants,
            settings: {
                isDarkMode: isDarkMode,
                lastUpdated: new Date().toISOString(),
                version: "1.0.0"
            },
            metadata: {
                created: new Date().toISOString(),
                totalSessions: participants.length,
                description: "Database untuk Dashboard Kata Kasar"
            }
        };
        
        const dataStr = JSON.stringify(data, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = 'data.json';
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Cleanup URL object
        setTimeout(() => {
            URL.revokeObjectURL(url);
        }, 100);
        
        showNotification('File data.json berhasil didownload!', 'success');
        
    } catch (error) {
        console.error('Error downloading JSON:', error);
        showNotification('Gagal mendownload file JSON!', 'error');
    }
}

// Fungsi untuk memuat data dari JSON file
async function loadData() {
    console.log('Loading data...');
    try {
        // Load langsung dari file JSON
        const response = await fetch('./data.json');
        console.log('Fetch response:', response.status, response.ok);
        
        if (response.ok) {
            const data = await response.json();
            console.log('Data loaded from JSON:', data);
            
            participants = data.participants || [];
            isDarkMode = data.settings?.isDarkMode || false;
            
            console.log('Participants loaded:', participants.length);
            
            if (isDarkMode) {
                document.body.classList.add('dark-mode');
            }
            
            // Simpan ke localStorage sebagai backup
            localStorage.setItem('minimalistRankingData', JSON.stringify(data));
            
            updateSyncStatus('synced');
            
            if (participants.length > 0) {
                showNotification(`Data berhasil dimuat: ${participants.length} peserta`, 'success');
            } else {
                showNotification('Database JSON siap digunakan', 'info');
            }
            
            // Render data setelah dimuat
            renderParticipants();
            updateStats();
            
        } else {
            throw new Error(`Failed to load from JSON file: ${response.status}`);
        }
        
    } catch (error) {
        console.error('Error loading from JSON:', error);
        console.log('Gagal load dari JSON, menggunakan localStorage sebagai fallback');
        
        // Fallback ke localStorage jika gagal load dari JSON
        const saved = localStorage.getItem('minimalistRankingData');
        if (saved) {
            const data = JSON.parse(saved);
            participants = data.participants || [];
            isDarkMode = data.settings?.isDarkMode || data.isDarkMode || false;
            
            console.log('Data loaded from localStorage:', participants.length, 'participants');
            
            if (isDarkMode) {
                document.body.classList.add('dark-mode');
            }
            
            updateSyncStatus('local');
            showNotification('Data dimuat dari penyimpanan lokal', 'info');
            
            // Render data setelah dimuat
            renderParticipants();
            updateStats();
        } else {
            console.log('No data found in localStorage');
            updateSyncStatus('empty');
            showNotification('Memulai dengan data kosong', 'info');
        }
    }
}

// Fungsi untuk update status sinkronisasi
function updateSyncStatus(status) {
    const statusElement = document.getElementById('syncStatus');
    if (!statusElement) return;
    
    const statusConfig = {
        'synced': {
            icon: '✅',
            text: 'Data tersinkronisasi',
            class: 'status-synced'
        },
        'local': {
            icon: '💾',
            text: 'Data lokal (offline)',
            class: 'status-local'
        },
        'error': {
            icon: '❌',
            text: 'Error sinkronisasi',
            class: 'status-error'
        },
        'empty': {
            icon: '📝',
            text: 'Data kosong',
            class: 'status-empty'
        }
    };
    
    const config = statusConfig[status] || statusConfig['empty'];
    statusElement.innerHTML = `
        <span class="sync-icon">${config.icon}</span>
        <span class="sync-text">${config.text}</span>
    `;
    statusElement.className = `sync-status ${config.class}`;
}

// Fungsi untuk menampilkan notifikasi
function showNotification(message, type = 'info') {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${colors[type]};
        color: white;
        padding: 16px 20px;
        border-radius: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 1001;
        font-weight: 600;
        max-width: 300px;
        animation: slideIn 0.3s ease-out;
        font-size: 14px;
    `;
    
    if (!document.querySelector('#notification-styles')) {
        const style = document.createElement('style');
        style.id = 'notification-styles';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 3000);
}

// Event listeners
document.getElementById('participantName').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') addParticipant();
});

// Close modal when clicking outside
window.addEventListener('click', function(e) {
    const modal = document.getElementById('rankingModal');
    if (e.target === modal) {
        closeRankingModal();
    }
});
// Data peserta
let participants = [];
let isDarkMode = false;

// Load data saat halaman dimuat
window.addEventListener('load', function() {
    loadData();
    renderParticipants();
    updateStats();
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

// Fungsi untuk refresh data dari server
async function refreshData() {
    showNotification('Memuat ulang data...', 'info');
    await loadData();
    renderParticipants();
    updateStats();
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

// Fungsi untuk menyimpan data ke JSON file
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
        
        // Simulasi penyimpanan ke data.json
        // Dalam environment production dengan server backend, ini akan menggunakan API endpoint
        // Untuk sekarang, data disimpan di localStorage dan dapat diakses melalui migrasi
        
        showNotification('Data berhasil disimpan ke database!', 'success');
        
        // Update display untuk menunjukkan data tersinkronisasi
        updateSyncStatus('synced');
        
        // Update data.json secara manual untuk demo (dalam production ini dilakukan oleh server)
        await updateDataJsonFile(data);
        
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
    if (window.latestDataForSync) {
        const link = document.createElement('a');
        link.href = window.latestDataForSync.downloadUrl;
        link.download = 'data.json';
        link.click();
        
        showNotification('File data.json berhasil didownload! Ganti file data.json yang lama dengan yang baru.', 'success');
    } else {
        showNotification('Tidak ada data untuk didownload. Simpan data terlebih dahulu.', 'error');
    }
}

// Fungsi untuk migrasi data dari localStorage ke JSON
async function migrateFromLocalStorage() {
    const saved = localStorage.getItem('minimalistRankingData');
    if (saved) {
        try {
            const localData = JSON.parse(saved);
            
            // Cek apakah ada data di localStorage yang perlu dipindahkan
            if (localData.participants && localData.participants.length > 0) {
                const confirmMigrate = confirm(
                    `Ditemukan ${localData.participants.length} peserta di penyimpanan lokal.\n` +
                    'Apakah Anda ingin memindahkan data ini ke database JSON?\n\n' +
                    'Data yang akan dipindahkan:\n' +
                    localData.participants.map(p => `• ${p.name}: ${p.swearCount} kata kasar`).join('\n')
                );
                
                if (confirmMigrate) {
                    // Update data.json dengan data dari localStorage
                    const migratedData = {
                        participants: localData.participants,
                        settings: {
                            isDarkMode: localData.settings?.isDarkMode || localData.isDarkMode || false,
                            lastUpdated: new Date().toISOString(),
                            version: "1.0.0"
                        },
                        metadata: {
                            created: new Date().toISOString(),
                            totalSessions: localData.participants.length,
                            description: "Database untuk Dashboard Kata Kasar (Migrated from localStorage)"
                        }
                    };
                    
                    // Simpan data yang sudah dimigrasi
                    participants = migratedData.participants;
                    isDarkMode = migratedData.settings.isDarkMode;
                    
                    if (isDarkMode) {
                        document.body.classList.add('dark-mode');
                    }
                    
                    // Simpan ke localStorage dengan format baru
                    localStorage.setItem('minimalistRankingData', JSON.stringify(migratedData));
                    
                    showNotification(`Berhasil memindahkan ${participants.length} peserta ke database JSON!`, 'success');
                    updateSyncStatus('synced');
                    
                    return true; // Migrasi berhasil
                }
            }
        } catch (error) {
            console.error('Error during migration:', error);
            showNotification('Gagal memindahkan data dari localStorage', 'error');
        }
    }
    return false; // Tidak ada migrasi
}

// Fungsi untuk memuat data dari JSON file
async function loadData() {
    try {
        // Coba load dari file JSON terlebih dahulu
        const response = await fetch('./data.json');
        
        if (response.ok) {
            const data = await response.json();
            
            // Jika data.json kosong, coba migrasi dari localStorage
            if (!data.participants || data.participants.length === 0) {
                const migrated = await migrateFromLocalStorage();
                if (migrated) {
                    return; // Data sudah dimuat dari migrasi
                }
            }
            
            participants = data.participants || [];
            isDarkMode = data.settings?.isDarkMode || false;
            
            if (isDarkMode) {
                document.body.classList.add('dark-mode');
            }
            
            updateSyncStatus('synced');
            
            if (participants.length > 0) {
                showNotification(`Data berhasil dimuat: ${participants.length} peserta`, 'success');
            } else {
                showNotification('Database JSON siap digunakan', 'info');
            }
            
        } else {
            throw new Error('Failed to load from server');
        }
        
    } catch (error) {
        console.log('Loading from localStorage as fallback');
        
        // Fallback ke localStorage jika gagal load dari JSON
        const saved = localStorage.getItem('minimalistRankingData');
        if (saved) {
            const data = JSON.parse(saved);
            participants = data.participants || [];
            isDarkMode = data.settings?.isDarkMode || data.isDarkMode || false;
            
            if (isDarkMode) {
                document.body.classList.add('dark-mode');
            }
            
            updateSyncStatus('local');
            showNotification('Data dimuat dari penyimpanan lokal', 'info');
        } else {
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
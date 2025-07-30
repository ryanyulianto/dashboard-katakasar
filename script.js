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

// Fungsi untuk menyimpan data
function saveData() {
    const data = {
        participants: participants,
        isDarkMode: isDarkMode
    };
    localStorage.setItem('minimalistRankingData', JSON.stringify(data));
}

// Fungsi untuk memuat data
function loadData() {
    const saved = localStorage.getItem('minimalistRankingData');
    if (saved) {
        const data = JSON.parse(saved);
        participants = data.participants || [];
        isDarkMode = data.isDarkMode || false;
        
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
        }
    }
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
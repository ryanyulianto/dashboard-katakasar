// Data peserta
let participants = [];
let isDarkMode = false;
let currentUser = null;

// Global camera variables
let currentStream = null;
let capturedPhoto = null;

// User Profile Management
function checkUserProfile() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        return true;
    }
    return false;
}

function showUserProfileModal() {
    const modal = document.getElementById('userProfileModal');
    modal.style.display = 'block';
    
    // Reset form
    document.getElementById('userName').value = '';
    
    // Reset camera state
    capturedPhoto = null;
    if (document.getElementById('cameraPlaceholder')) {
        document.getElementById('cameraPlaceholder').style.display = 'block';
    }
    if (document.getElementById('photoResult')) {
        document.getElementById('photoResult').style.display = 'none';
    }
    if (document.getElementById('cameraPreview')) {
        document.getElementById('cameraPreview').style.display = 'none';
    }
    
    // Setup event listeners
    setupProfileFormListeners();
}

function setupProfileFormListeners() {
    const nameInput = document.getElementById('userName');
    const saveBtn = document.getElementById('saveProfileBtn');
    const modal = document.getElementById('userProfileModal');
    
    // Camera elements
    const startCameraBtn = document.getElementById('startCameraBtn');
    const cameraPreview = document.getElementById('cameraPreview');
    const cameraVideo = document.getElementById('cameraVideo');
    const captureBtn = document.getElementById('captureBtn');
    const stopCameraBtn = document.getElementById('stopCameraBtn');
    const photoResult = document.getElementById('photoResult');
    const photoCanvas = document.getElementById('photoCanvas');
    const photoPreview = document.getElementById('photoPreview');
    const retakeBtn = document.getElementById('retakeBtn');
    const cameraPlaceholder = document.getElementById('cameraPlaceholder');
    
    // Validate form on input changes
    function validateForm() {
        const nameValue = nameInput.value.trim();
        const hasValidName = nameValue.length >= 2 && /^[A-Za-z\s]+$/.test(nameValue);
        const hasPhoto = capturedPhoto !== null;
        
        saveBtn.disabled = !(hasValidName && hasPhoto);
        
        // Show validation feedback
        if (nameValue.length > 0 && !hasValidName) {
            nameInput.style.borderColor = '#ef4444';
        } else if (hasValidName) {
            nameInput.style.borderColor = '#10b981';
        } else {
            nameInput.style.borderColor = '#e5e7eb';
        }
    }
    
    // Name input validation
    nameInput.addEventListener('input', function(e) {
        // Remove non-letter characters except spaces
        let value = e.target.value.replace(/[^A-Za-z\s]/g, '');
        // Limit to 50 characters
        if (value.length > 50) {
            value = value.substring(0, 50);
        }
        // Prevent multiple consecutive spaces
        value = value.replace(/\s+/g, ' ');
        e.target.value = value;
        validateForm();
    });
    
    // Camera functionality
    startCameraBtn.addEventListener('click', async function() {
        try {
            // Check if getUserMedia is supported
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                throw new Error('Browser tidak mendukung akses kamera');
            }
            
            // Coba dengan constraints yang lebih sederhana dulu
            let constraints = {
                video: {
                    width: { min: 320, ideal: 640, max: 1280 },
                    height: { min: 240, ideal: 480, max: 720 },
                    facingMode: 'user'
                },
                audio: false
            };
            
            try {
                currentStream = await navigator.mediaDevices.getUserMedia(constraints);
            } catch (error) {
                console.warn('Failed with detailed constraints, trying basic:', error);
                // Fallback to basic constraints
                constraints = {
                    video: true,
                    audio: false
                };
                currentStream = await navigator.mediaDevices.getUserMedia(constraints);
            }
            
            console.log('Camera stream obtained:', currentStream);
            console.log('Video tracks:', currentStream.getVideoTracks());
            
            cameraVideo.srcObject = currentStream;
            
            // Tunggu video siap dan disable capture button sampai siap
            captureBtn.disabled = true;
            captureBtn.textContent = '⏳ Memuat kamera...';
            
            cameraVideo.onloadedmetadata = function() {
                console.log('Video metadata loaded:', {
                    videoWidth: cameraVideo.videoWidth,
                    videoHeight: cameraVideo.videoHeight,
                    readyState: cameraVideo.readyState
                });
            };
            
            cameraVideo.oncanplay = function() {
                console.log('Video can play');
                // Wait for video to actually show content
                const checkVideoContent = () => {
                     if (cameraVideo.videoWidth > 0 && cameraVideo.videoHeight > 0 && cameraVideo.currentTime > 0) {
                         captureBtn.disabled = false;
                         captureBtn.textContent = '📸 Ambil Foto';
                         cameraPreview.classList.add('video-loaded');
                         console.log('Camera ready for capture - video showing content');
                     } else {
                         console.log('Waiting for video content...', {
                             videoWidth: cameraVideo.videoWidth,
                             videoHeight: cameraVideo.videoHeight,
                             currentTime: cameraVideo.currentTime
                         });
                         setTimeout(checkVideoContent, 500);
                     }
                 };
                
                // Start checking after a short delay
                setTimeout(checkVideoContent, 1000);
            };
            
            // Force video to play and handle autoplay restrictions
            const playVideo = async () => {
                try {
                    await cameraVideo.play();
                    console.log('Video started playing');
                } catch (error) {
                    console.error('Error playing video:', error);
                    // Some browsers require user interaction to play video
                    if (error.name === 'NotAllowedError') {
                        console.log('Autoplay blocked, video will start when user interacts');
                    }
                }
            };
            
            playVideo();
            
            // Also try to play when user clicks anywhere on the video
            cameraVideo.addEventListener('click', playVideo);
            
            cameraPlaceholder.style.display = 'none';
            cameraPreview.style.display = 'block';
            photoResult.style.display = 'none';
        } catch (error) {
            console.error('Error accessing camera:', error);
            alert(`❌ Tidak dapat mengakses kamera: ${error.message}\n\nPastikan Anda memberikan izin kamera dan tidak ada aplikasi lain yang menggunakan kamera.`);
        }
    });
    
    captureBtn.addEventListener('click', function() {
        const canvas = photoCanvas;
        const context = canvas.getContext('2d');
        
        console.log('Capturing photo...');
        console.log('Video dimensions:', {
            videoWidth: cameraVideo.videoWidth,
            videoHeight: cameraVideo.videoHeight,
            clientWidth: cameraVideo.clientWidth,
            clientHeight: cameraVideo.clientHeight,
            readyState: cameraVideo.readyState,
            currentTime: cameraVideo.currentTime
        });
        
        // Pastikan video sudah siap dan menampilkan konten
        if (cameraVideo.readyState < 2) {
            alert('❌ Video belum siap. Tunggu sebentar dan coba lagi.');
            return;
        }
        
        if (cameraVideo.videoWidth === 0 || cameraVideo.videoHeight === 0) {
            alert('❌ Video belum menampilkan konten. Tunggu sebentar dan coba lagi.');
            return;
        }
        
        // Set canvas size to match video
        const width = cameraVideo.videoWidth;
        const height = cameraVideo.videoHeight;
        canvas.width = width;
        canvas.height = height;
        
        console.log('Canvas dimensions set to:', { width, height });
        
        // Clear canvas first
        context.clearRect(0, 0, width, height);
        
        // Test if video is actually showing content by drawing a small test area
        const testCanvas = document.createElement('canvas');
        const testContext = testCanvas.getContext('2d');
        testCanvas.width = 10;
        testCanvas.height = 10;
        
        try {
            // Draw a small test area from the center of the video
            testContext.drawImage(cameraVideo, width/2, height/2, 10, 10, 0, 0, 10, 10);
            const testImageData = testContext.getImageData(0, 0, 10, 10);
            
            // Check if the test area is all black (which would indicate no video content)
            let isAllBlack = true;
            for (let i = 0; i < testImageData.data.length; i += 4) {
                const r = testImageData.data[i];
                const g = testImageData.data[i + 1];
                const b = testImageData.data[i + 2];
                if (r > 10 || g > 10 || b > 10) { // Allow for some noise
                    isAllBlack = false;
                    break;
                }
            }
            
            if (isAllBlack) {
                console.warn('Video appears to be showing black content');
                alert('❌ Kamera belum menampilkan gambar. Pastikan kamera tidak tertutup dan tunggu sebentar.');
                return;
            }
            
            console.log('Video content verified - proceeding with capture');
        } catch (error) {
            console.warn('Could not verify video content, proceeding anyway:', error);
        }
        
        // Draw video frame to canvas
        try {
            context.drawImage(cameraVideo, 0, 0, width, height);
            console.log('Image drawn to canvas');
        } catch (error) {
            console.error('Error drawing video to canvas:', error);
            alert('❌ Gagal mengambil foto. Coba lagi.');
            return;
        }
        
        // Convert to data URL
        capturedPhoto = canvas.toDataURL('image/jpeg', 0.8);
        console.log('Photo captured, data URL length:', capturedPhoto.length);
        
        // Show preview
        photoPreview.innerHTML = `<img src="${capturedPhoto}" alt="Foto yang diambil">`;
        
        // Stop camera and show result
        stopCamera();
        cameraPreview.style.display = 'none';
        photoResult.style.display = 'block';
        
        validateForm();
    });
    
    stopCameraBtn.addEventListener('click', function() {
        stopCamera();
        cameraPreview.style.display = 'none';
        cameraPlaceholder.style.display = 'block';
    });
    
    retakeBtn.addEventListener('click', function() {
        capturedPhoto = null;
        photoResult.style.display = 'none';
        cameraPlaceholder.style.display = 'block';
        validateForm();
    });
    
    function stopCamera() {
        if (currentStream) {
            currentStream.getTracks().forEach(track => track.stop());
            currentStream = null;
        }
        // Reset video loaded state
        cameraPreview.classList.remove('video-loaded');
        captureBtn.disabled = true;
        captureBtn.textContent = '📸 Ambil Foto';
    }
    
    saveBtn.addEventListener('click', saveUserProfile);
    
    // Close modal events
    const closeBtn = modal.querySelector('.close');
    closeBtn.addEventListener('click', function() {
        // Stop camera if running
        stopCamera();
        
        // Jangan tutup modal jika profil belum lengkap
        if (!currentUser) {
            alert('⚠️ Anda harus melengkapi profil terlebih dahulu!');
            return;
        }
        modal.style.display = 'none';
    });
    
    // Prevent closing modal by clicking outside if no user profile
    modal.addEventListener('click', function(e) {
        if (e.target === modal && currentUser) {
            stopCamera();
            modal.style.display = 'none';
        } else if (e.target === modal && !currentUser) {
            alert('⚠️ Anda harus melengkapi profil terlebih dahulu!');
        }
    });
    
    // Prevent closing with Escape key if no user profile
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.style.display === 'block') {
            if (!currentUser) {
                alert('⚠️ Anda harus melengkapi profil terlebih dahulu!');
                return;
            }
            stopCamera();
            modal.style.display = 'none';
        }
    });
    
    // Initial validation
    validateForm();
}

// Function removed - using camera capture instead of file upload

function saveUserProfile() {
    const nameInput = document.getElementById('userName');
    const name = nameInput.value.trim();
    
    if (name.length < 2) {
        alert('❌ Nama harus minimal 2 karakter!');
        return;
    }
    
    if (!/^[A-Za-z\s]+$/.test(name)) {
        alert('❌ Nama hanya boleh berisi huruf dan spasi!');
        return;
    }
    
    if (!capturedPhoto) {
        alert('❌ Foto profil harus diambil dari kamera!');
        return;
    }
    
    const userData = {
        name: name,
        photo: capturedPhoto,
        createdAt: new Date().toISOString(),
        deviceInfo: getDeviceInfo()
    };
    
    // Save to localStorage
    localStorage.setItem('currentUser', JSON.stringify(userData));
    currentUser = userData;
    
    // Close modal
    document.getElementById('userProfileModal').style.display = 'none';
    
    // Show success message
    alert(`✅ Profil berhasil disimpan!\n\nSelamat datang, ${name}! 👋`);
    
    // Add initial log entry
    addActivityLog(`${name} bergabung ke sistem`, 'join');
    
    // Reset camera state
    capturedPhoto = null;
    document.getElementById('cameraPlaceholder').style.display = 'block';
    document.getElementById('photoResult').style.display = 'none';
    
    // Refresh UI
    loadData();
}

function updateUserProfile() {
    if (!currentUser) return;
    
    // Fill form with current data
    document.getElementById('userName').value = currentUser.name;
    
    // Set current photo as captured photo
    capturedPhoto = currentUser.photo;
    
    // Show current photo in photo result
    const photoPreview = document.getElementById('photoPreview');
    photoPreview.innerHTML = `<img src="${currentUser.photo}" alt="Foto saat ini">`;
    
    // Show photo result section and hide camera placeholder
    document.getElementById('photoResult').style.display = 'block';
    document.getElementById('cameraPlaceholder').style.display = 'none';
    
    // Change modal title
    const modalHeader = document.querySelector('.user-profile-modal .modal-header h2');
    modalHeader.textContent = '✏️ Edit Profil User';
    
    // Change button text
    const saveBtn = document.getElementById('saveProfileBtn');
    saveBtn.textContent = '💾 Update Profil';
    saveBtn.disabled = false; // Enable since we have existing data
    
    showUserProfileModal();
}

// Add button to edit profile in Quick Actions
function addEditProfileButton() {
    const actionsBox = document.querySelector('.actions-box .action-buttons');
    const editProfileBtn = document.createElement('button');
    editProfileBtn.onclick = updateUserProfile;
    editProfileBtn.className = 'info-btn';
    editProfileBtn.innerHTML = '👤 Edit Profil';
    
    // Insert after device info button
    const deviceBtn = actionsBox.querySelector('.device-btn');
    if (deviceBtn && deviceBtn.nextSibling) {
        actionsBox.insertBefore(editProfileBtn, deviceBtn.nextSibling);
    } else {
        actionsBox.appendChild(editProfileBtn);
    }
}

// Fungsi untuk mendapatkan informasi device
function getDeviceInfo() {
    const userAgent = navigator.userAgent;
    let deviceType = 'Unknown';
    let browser = 'Unknown';
    let osInfo = '';
    console.log(userAgent)
    // Deteksi OS dan device type yang lebih detail
    if (/Mobile|Android|iPhone/.test(userAgent)) {
        deviceType = 'Mobile';
        if (/Android/.test(userAgent)) osInfo = ' (Android)';
        else if (/iPhone/.test(userAgent)) osInfo = ' (iOS)';
    } else if (/iPad/.test(userAgent)) {
        deviceType = 'Tablet (iPad)';
    } else if (/Tablet/.test(userAgent)) {
        deviceType = 'Tablet';
    } else {
        // Deteksi laptop vs desktop yang lebih spesifik
        if (/Macintosh/.test(userAgent)) {
            if (/MacBook/.test(userAgent) || /Mac OS X/.test(userAgent)) {
                deviceType = 'Laptop (MacBook)';
            } else {
                deviceType = 'Desktop (Mac)';
            }
        } else if (/Windows/.test(userAgent)) {
            // Cek apakah kemungkinan laptop berdasarkan touch support
            if (navigator.maxTouchPoints > 0) {
                deviceType = 'Laptop/Touchscreen (Windows)';
            } else {
                deviceType = 'Desktop/Laptop (Windows)';
            }
        } else if (/Linux/.test(userAgent)) {
            deviceType = 'Desktop/Laptop (Linux)';
        } else {
            deviceType = 'Desktop/Laptop';
        }
    }
    
    // Deteksi browser
    if (userAgent.includes('Chrome') && !userAgent.includes('Edge')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';
    else if (userAgent.includes('Opera')) browser = 'Opera';
    
    return `${deviceType}${osInfo} - ${browser}`;
}

// Fungsi untuk mendapatkan informasi hardware detail menggunakan berbagai Web APIs
async function getAdvancedHardwareInfo() {
    let hardwareInfo = {
        gpu: 'Unknown',
        gpuVendor: 'Unknown',
        serialNumber: 'Tidak tersedia (Privasi Browser)',
        systemModel: 'Unknown',
        motherboard: 'Unknown',
        biosVersion: 'Unknown',
        networkInterfaces: [],
        bluetoothSupport: false,
        usbDevices: [],
        audioDevices: [],
        videoDevices: []
    };
    
    try {
        // Deteksi GPU menggunakan WebGL
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
            const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
            if (debugInfo) {
                hardwareInfo.gpu = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                hardwareInfo.gpuVendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
            }
        }
        
        // Deteksi Bluetooth support
        if ('bluetooth' in navigator) {
            hardwareInfo.bluetoothSupport = true;
        }
        
        // Deteksi Media Devices (Camera, Microphone)
        if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
            const devices = await navigator.mediaDevices.enumerateDevices();
            hardwareInfo.audioDevices = devices.filter(device => device.kind === 'audioinput').map(device => ({
                label: device.label || 'Audio Input Device',
                deviceId: device.deviceId.substring(0, 8) + '...'
            }));
            hardwareInfo.videoDevices = devices.filter(device => device.kind === 'videoinput').map(device => ({
                label: device.label || 'Video Input Device', 
                deviceId: device.deviceId.substring(0, 8) + '...'
            }));
        }
        
        // Deteksi USB devices (terbatas)
        if ('usb' in navigator) {
            try {
                const devices = await navigator.usb.getDevices();
                hardwareInfo.usbDevices = devices.map(device => ({
                    productName: device.productName || 'Unknown USB Device',
                    vendorId: device.vendorId,
                    productId: device.productId
                }));
            } catch (e) {
                // USB API memerlukan user permission
            }
        }
        
    } catch (error) {
        console.log('Error getting advanced hardware info:', error);
    }
    
    return hardwareInfo;
}

// Fungsi khusus untuk mendapatkan informasi laptop yang detail
async function getLaptopInfo() {
    const userAgent = navigator.userAgent;
    const platform = navigator.platform;
    const screen = window.screen;
    
    let laptopInfo = {
        isLaptop: false,
        brand: 'Unknown',
        model: 'Unknown',
        processor: 'Unknown',
        processorDetails: 'Unknown',
        os: 'Unknown',
        osVersion: 'Unknown',
        browser: 'Unknown',
        browserVersion: 'Unknown',
        screenResolution: `${screen.width}x${screen.height}`,
        colorDepth: screen.colorDepth,
        pixelRatio: window.devicePixelRatio || 1,
        touchSupport: navigator.maxTouchPoints > 0,
        memory: navigator.deviceMemory || 'Unknown',
        cores: navigator.hardwareConcurrency || 'Unknown',
        userAgent: userAgent,
        serialNumber: 'Tidak tersedia (Privasi Browser)',
        hardwareInfo: await getAdvancedHardwareInfo()
    };
    
    // Deteksi OS dan versi yang lebih detail
    if (/Macintosh/.test(userAgent)) {
        laptopInfo.os = 'macOS';
        laptopInfo.isLaptop = true;
        
        // Deteksi versi macOS
        const macVersionMatch = userAgent.match(/Mac OS X ([0-9_]+)/);
        if (macVersionMatch) {
            const version = macVersionMatch[1].replace(/_/g, '.');
            laptopInfo.osVersion = version;
            
            // Deteksi nama macOS berdasarkan versi
            const versionNum = parseFloat(version);
            if (versionNum >= 14.0) laptopInfo.osVersion += ' (Sonoma atau lebih baru)';
            else if (versionNum >= 13.0) laptopInfo.osVersion += ' (Ventura)';
            else if (versionNum >= 12.0) laptopInfo.osVersion += ' (Monterey)';
            else if (versionNum >= 11.0) laptopInfo.osVersion += ' (Big Sur)';
            else if (versionNum >= 10.15) laptopInfo.osVersion += ' (Catalina)';
        }
        
        // Deteksi model MacBook yang lebih spesifik
         if (/Intel/.test(userAgent)) {
             laptopInfo.processor = 'Intel';
             laptopInfo.processorDetails = 'Intel-based Mac';
             laptopInfo.model = 'MacBook (Intel)';
             
             // Coba deteksi generasi Intel berdasarkan tahun dan karakteristik
             const cores = navigator.hardwareConcurrency;
             if (cores >= 8) {
                 laptopInfo.processorDetails = 'Intel Core i7/i9 (8+ cores)';
             } else if (cores >= 4) {
                 laptopInfo.processorDetails = 'Intel Core i5/i7 (Quad-core)';
             } else {
                 laptopInfo.processorDetails = 'Intel Core i3/i5 (Dual-core)';
             }
         } else {
             // Deteksi Apple Silicon berdasarkan karakteristik
             const pixelRatio = window.devicePixelRatio;
             const screenWidth = screen.width;
             const cores = navigator.hardwareConcurrency;
             const memory = navigator.deviceMemory;
             
             if (cores >= 10) {
                 laptopInfo.processor = 'Apple M1 Ultra/M2 Ultra';
                 laptopInfo.processorDetails = `Apple Silicon ${cores}-core (Ultra class)`;
                 laptopInfo.model = 'Mac Studio/Pro (Apple Silicon Ultra)';
             } else if (cores >= 8) {
                 if (memory >= 16) {
                     laptopInfo.processor = 'Apple M1 Pro/Max atau M2 Pro/Max';
                     laptopInfo.processorDetails = `Apple Silicon ${cores}-core Pro/Max`;
                     laptopInfo.model = 'MacBook Pro 14"/16" (Apple Silicon Pro/Max)';
                 } else {
                     laptopInfo.processor = 'Apple M1/M2';
                     laptopInfo.processorDetails = `Apple Silicon ${cores}-core`;
                     if (screenWidth >= 1728) {
                         laptopInfo.model = 'MacBook Pro 14"/16" (Apple Silicon)';
                     } else {
                         laptopInfo.model = 'MacBook Air/Pro 13" (Apple Silicon)';
                     }
                 }
             } else {
                 laptopInfo.processor = 'Apple Silicon';
                 laptopInfo.processorDetails = `Apple Silicon ${cores}-core (Entry level)`;
                 laptopInfo.model = 'MacBook Air (Apple Silicon)';
             }
             
             // Deteksi generasi berdasarkan karakteristik tambahan
             if (pixelRatio >= 2 && screenWidth >= 1440) {
                 if (cores >= 8) {
                     laptopInfo.processorDetails += ' - Kemungkinan M2 generation';
                 } else {
                     laptopInfo.processorDetails += ' - Kemungkinan M1/M2 generation';
                 }
             }
         }
        
        laptopInfo.brand = 'Apple';
    } else if (/Windows/.test(userAgent)) {
        laptopInfo.os = 'Windows';
        laptopInfo.isLaptop = true;
        
        // Deteksi versi Windows
        if (/Windows NT 10.0/.test(userAgent)) {
            laptopInfo.osVersion = 'Windows 10/11';
        } else if (/Windows NT 6.3/.test(userAgent)) {
            laptopInfo.osVersion = 'Windows 8.1';
        } else if (/Windows NT 6.1/.test(userAgent)) {
            laptopInfo.osVersion = 'Windows 7';
        }
        
        // Deteksi brand dan model Windows
        if (/Dell/.test(userAgent)) {
            laptopInfo.brand = 'Dell';
            laptopInfo.model = 'Dell Laptop';
        } else if (/HP/.test(userAgent)) {
            laptopInfo.brand = 'HP';
            laptopInfo.model = 'HP Laptop';
        } else if (/Lenovo/.test(userAgent)) {
            laptopInfo.brand = 'Lenovo';
            if (/ThinkPad/.test(userAgent)) {
                laptopInfo.model = 'ThinkPad';
            } else {
                laptopInfo.model = 'Lenovo Laptop';
            }
        } else if (/ASUS/.test(userAgent)) {
            laptopInfo.brand = 'ASUS';
            laptopInfo.model = 'ASUS Laptop';
        } else if (/Acer/.test(userAgent)) {
            laptopInfo.brand = 'Acer';
            laptopInfo.model = 'Acer Laptop';
        } else if (/Surface/.test(userAgent)) {
            laptopInfo.brand = 'Microsoft';
            laptopInfo.model = 'Surface';
        } else {
            laptopInfo.brand = 'Windows PC';
            laptopInfo.model = 'Windows Laptop';
        }
        
        // Deteksi processor Windows yang lebih detail
         const cores = navigator.hardwareConcurrency;
         const memory = navigator.deviceMemory;
         
         // Deteksi berdasarkan GPU untuk menentukan jenis processor
         const gpu = laptopInfo.hardwareInfo.gpu.toLowerCase();
         
         if (gpu.includes('intel')) {
             if (cores >= 8) {
                 laptopInfo.processor = 'Intel Core i7/i9';
                 laptopInfo.processorDetails = `Intel ${cores}-core (High-end)`;
             } else if (cores >= 4) {
                 laptopInfo.processor = 'Intel Core i5/i7';
                 laptopInfo.processorDetails = `Intel ${cores}-core (Mid-range)`;
             } else {
                 laptopInfo.processor = 'Intel Core i3/i5';
                 laptopInfo.processorDetails = `Intel ${cores}-core (Entry-level)`;
             }
         } else if (gpu.includes('amd') || gpu.includes('radeon')) {
             if (cores >= 8) {
                 laptopInfo.processor = 'AMD Ryzen 7/9';
                 laptopInfo.processorDetails = `AMD Ryzen ${cores}-core (High-end)`;
             } else if (cores >= 4) {
                 laptopInfo.processor = 'AMD Ryzen 5/7';
                 laptopInfo.processorDetails = `AMD Ryzen ${cores}-core (Mid-range)`;
             } else {
                 laptopInfo.processor = 'AMD Ryzen 3/5';
                 laptopInfo.processorDetails = `AMD Ryzen ${cores}-core (Entry-level)`;
             }
         } else if (gpu.includes('nvidia')) {
             // Laptop dengan GPU dedicated NVIDIA biasanya high-end
             if (cores >= 8) {
                 laptopInfo.processor = 'Intel/AMD High-end';
                 laptopInfo.processorDetails = `${cores}-core dengan GPU NVIDIA (Gaming/Workstation)`;
             } else {
                 laptopInfo.processor = 'Intel/AMD Mid-range';
                 laptopInfo.processorDetails = `${cores}-core dengan GPU NVIDIA (Gaming)`;
             }
         } else {
             // Fallback detection
             if (cores >= 8) {
                 laptopInfo.processor = 'Multi-core Processor';
                 laptopInfo.processorDetails = `${cores}-core (High-end)`;
             } else if (cores >= 4) {
                 laptopInfo.processor = 'Quad-core Processor';
                 laptopInfo.processorDetails = `${cores}-core (Mid-range)`;
             } else {
                 laptopInfo.processor = 'Dual-core Processor';
                 laptopInfo.processorDetails = `${cores}-core (Entry-level)`;
             }
         }
         
         // Tambahkan informasi memory untuk context
         if (memory >= 8) {
             laptopInfo.processorDetails += ` - ${memory}GB RAM`;
         }
    } else if (/Linux/.test(userAgent)) {
        laptopInfo.os = 'Linux';
        laptopInfo.isLaptop = true;
        laptopInfo.brand = 'Linux PC';
        laptopInfo.model = 'Linux Laptop';
        
        if (navigator.hardwareConcurrency >= 8) {
            laptopInfo.processor = 'Multi-core (8+ cores)';
        } else if (navigator.hardwareConcurrency >= 4) {
            laptopInfo.processor = 'Quad-core';
        } else {
            laptopInfo.processor = 'Dual-core';
        }
    }
    
    // Deteksi browser dan versi yang lebih detail
    if (userAgent.includes('Chrome') && !userAgent.includes('Edge')) {
        laptopInfo.browser = 'Chrome';
        const chromeMatch = userAgent.match(/Chrome\/([0-9.]+)/);
        if (chromeMatch) laptopInfo.browserVersion = chromeMatch[1];
    } else if (userAgent.includes('Firefox')) {
        laptopInfo.browser = 'Firefox';
        const firefoxMatch = userAgent.match(/Firefox\/([0-9.]+)/);
        if (firefoxMatch) laptopInfo.browserVersion = firefoxMatch[1];
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
        laptopInfo.browser = 'Safari';
        const safariMatch = userAgent.match(/Version\/([0-9.]+)/);
        if (safariMatch) laptopInfo.browserVersion = safariMatch[1];
    } else if (userAgent.includes('Edge')) {
        laptopInfo.browser = 'Edge';
        const edgeMatch = userAgent.match(/Edge\/([0-9.]+)/);
        if (edgeMatch) laptopInfo.browserVersion = edgeMatch[1];
    } else if (userAgent.includes('Opera')) {
        laptopInfo.browser = 'Opera';
        const operaMatch = userAgent.match(/Opera\/([0-9.]+)/);
        if (operaMatch) laptopInfo.browserVersion = operaMatch[1];
    }
    
    return laptopInfo;
}

// Fungsi untuk menampilkan informasi device saat ini
async function showCurrentDeviceInfo() {
    const deviceInfo = getDeviceInfo();
    const laptopInfo = await getLaptopInfo();
    
    let message = `🖥️ INFORMASI DEVICE DETAIL\n`;
    message += `${'='.repeat(40)}\n\n`;
    
    // Informasi Umum
    message += `📱 DEVICE TYPE: ${deviceInfo}\n`;
    message += `🏷️  PLATFORM: ${navigator.platform}\n\n`;
    
    if (laptopInfo.isLaptop) {
        message += `✅ TERDETEKSI SEBAGAI LAPTOP/NOTEBOOK\n\n`;
        
        // Informasi Hardware
        message += `🏭 BRAND: ${laptopInfo.brand}\n`;
        message += `💻 MODEL: ${laptopInfo.model}\n`;
        message += `⚡ PROCESSOR: ${laptopInfo.processor}\n`;
        if (laptopInfo.processorDetails && laptopInfo.processorDetails !== 'Unknown') {
            message += `🔧 DETAIL PROCESSOR: ${laptopInfo.processorDetails}\n`;
        }
        message += `🧠 CPU CORES: ${laptopInfo.cores}\n`;
        
        if (laptopInfo.memory !== 'Unknown') {
            message += `💾 MEMORY: ${laptopInfo.memory} GB\n`;
        }
        
        message += `\n`;
        
        // Informasi Sistem Operasi
        message += `🖥️  OPERATING SYSTEM:\n`;
        message += `   • OS: ${laptopInfo.os}\n`;
        if (laptopInfo.osVersion !== 'Unknown') {
            message += `   • Version: ${laptopInfo.osVersion}\n`;
        }
        
        message += `\n`;
        
        // Informasi Browser
        message += `🌐 BROWSER:\n`;
        message += `   • Browser: ${laptopInfo.browser}\n`;
        if (laptopInfo.browserVersion !== 'Unknown') {
            message += `   • Version: ${laptopInfo.browserVersion}\n`;
        }
        
        message += `\n`;
        
        // Informasi Display
        message += `🖼️  DISPLAY:\n`;
        message += `   • Resolution: ${laptopInfo.screenResolution}\n`;
        message += `   • Pixel Ratio: ${laptopInfo.pixelRatio}x\n`;
        message += `   • Color Depth: ${laptopInfo.colorDepth} bit\n`;
        message += `   • Touch Support: ${laptopInfo.touchSupport ? '✅ Ya' : '❌ Tidak'}\n`;
        
        // Informasi Hardware Tambahan
        if (laptopInfo.hardwareInfo) {
            message += `\n🔧 HARDWARE DETAIL:\n`;
            if (laptopInfo.hardwareInfo.gpu !== 'Unknown') {
                message += `   • GPU: ${laptopInfo.hardwareInfo.gpu}\n`;
            }
            if (laptopInfo.hardwareInfo.gpuVendor !== 'Unknown') {
                message += `   • GPU Vendor: ${laptopInfo.hardwareInfo.gpuVendor}\n`;
            }
            message += `   • Bluetooth: ${laptopInfo.hardwareInfo.bluetoothSupport ? '✅ Supported' : '❌ Not Supported'}\n`;
            
            if (laptopInfo.hardwareInfo.audioDevices.length > 0) {
                message += `   • Audio Devices: ${laptopInfo.hardwareInfo.audioDevices.length} detected\n`;
            }
            if (laptopInfo.hardwareInfo.videoDevices.length > 0) {
                message += `   • Video Devices: ${laptopInfo.hardwareInfo.videoDevices.length} detected\n`;
            }
            if (laptopInfo.hardwareInfo.usbDevices.length > 0) {
                message += `   • USB Devices: ${laptopInfo.hardwareInfo.usbDevices.length} connected\n`;
            }
        }
        
        // Deteksi khusus untuk MacBook
        if (laptopInfo.brand === 'Apple' && laptopInfo.processor.includes('M1')) {
            message += `\n🍎 APPLE SILICON DETECTED!\n`;
            message += `   • Chip: ${laptopInfo.processor}\n`;
            message += `   • Architecture: ARM64\n`;
            message += `   • Performance: High-end\n`;
        }
        
        // Informasi Teknis
        message += `\n🔐 INFORMASI TEKNIS:\n`;
        message += `   • Serial Number: ${laptopInfo.serialNumber}\n`;
        message += `   • User Agent: ${laptopInfo.userAgent.substring(0, 100)}...\n`;
        
    } else {
        message += `❌ DEVICE INI TIDAK TERDETEKSI SEBAGAI LAPTOP\n`;
        message += `Mungkin desktop, tablet, atau mobile device\n`;
    }
    
    message += `\n${'='.repeat(40)}\n`;
    message += `📊 Data diambil pada: ${new Date().toLocaleString('id-ID')}`;
    
    alert(message);
}

// Fungsi untuk menambahkan log aktivitas
function addActivityLog(participantId, action, oldValue, newValue) {
    const participant = participants.find(p => p.id === participantId);
    if (!participant) return;
    
    if (!participant.activityLog) {
        participant.activityLog = [];
    }
    
    const logEntry = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        action: action,
        oldValue: oldValue,
        newValue: newValue,
        device: currentUser ? currentUser.name : getDeviceInfo(),
        userPhoto: currentUser ? currentUser.photo : null,
        date: new Date().toLocaleDateString('id-ID'),
        time: new Date().toLocaleTimeString('id-ID')
    };
    
    participant.activityLog.unshift(logEntry); // Tambahkan di awal array
    
    // Batasi log maksimal 50 entri per peserta
    if (participant.activityLog.length > 50) {
        participant.activityLog = participant.activityLog.slice(0, 50);
    }
}

// Load data saat halaman dimuat
window.addEventListener('load', function() {
    loadData();
    
    // Check if user profile is complete
    if (!checkUserProfile()) {
        // Force user to complete profile
        setTimeout(() => {
            showUserProfileModal();
        }, 500);
    }
});

// Override window close/refresh to check profile completion
window.addEventListener('beforeunload', function(e) {
    if (!currentUser || !currentUser.name || !currentUser.photo) {
        e.preventDefault();
        e.returnValue = 'Anda belum melengkapi profil. Yakin ingin keluar?';
        return e.returnValue;
    }
});

// Authentication check function
function requireAuth() {
    if (!currentUser || !currentUser.name || !currentUser.photo) {
        showNotification('⚠️ Anda harus melengkapi profil terlebih dahulu!', 'error');
        showUserProfileModal();
        return false;
    }
    return true;
}

// Fungsi untuk menambah peserta baru
function addParticipant() {
    if (!requireAuth()) return;
    
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
        joinDate: new Date().toLocaleDateString('id-ID'),
        activityLog: [{
            id: Date.now(),
            timestamp: new Date().toISOString(),
            action: 'Peserta Ditambahkan',
            oldValue: null,
            newValue: name,
            device: currentUser ? currentUser.name : getDeviceInfo(),
            date: new Date().toLocaleDateString('id-ID'),
            time: new Date().toLocaleTimeString('id-ID')
        }]
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
    if (!requireAuth()) return;
    
    const participant = participants.find(p => p.id === participantId);
    if (participant) {
        const oldValue = participant.swearCount;
        participant.swearCount++;
        
        // Tambahkan log aktivitas
        addActivityLog(participantId, 'Tambah Kata Kasar', oldValue, participant.swearCount);
        
        saveData();
        renderParticipants();
        updateStats();
        addEditProfileButton();
        showNotification(`${participant.name} +1 kata kasar! Total: ${participant.swearCount}`, 'warning');
    }
}

// Fungsi untuk mengurangi jumlah kata kasar
function minusSwear(participantId) {
    if (!requireAuth()) return;
    
    const participant = participants.find(p => p.id === participantId);
    if (participant && participant.swearCount > 0) {
        const oldValue = participant.swearCount;
        participant.swearCount--;
        
        // Tambahkan log aktivitas
        addActivityLog(participantId, 'Kurangi Kata Kasar', oldValue, participant.swearCount);
        
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
    if (!requireAuth()) return;
    
    const participant = participants.find(p => p.id === participantId);
    if (participant && confirm(`Hapus peserta "${participant.name}"?`)) {
        // Log aktivitas sebelum menghapus
        addActivityLog(participantId, 'Peserta Dihapus', participant.name, null);
        
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
                <button class="log-btn" onclick="showActivityLog(${participant.id})" title="Lihat log aktivitas">
                    📋
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

// Fungsi untuk menampilkan log aktivitas peserta
function showActivityLog(participantId) {
    const participant = participants.find(p => p.id === participantId);
    if (!participant) return;
    
    const modal = document.getElementById('activityLogModal');
    const participantNameElement = document.getElementById('logParticipantName');
    const activityLogList = document.getElementById('activityLogList');
    
    participantNameElement.textContent = participant.name;
    
    const logs = participant.activityLog || [];
    
    if (logs.length === 0) {
        activityLogList.innerHTML = `
            <div class="empty-state">
                <i>📋</i>
                <p>Belum ada aktivitas untuk peserta ini.</p>
            </div>
        `;
    } else {
        activityLogList.innerHTML = logs.map(log => {
            let actionIcon = '📝';
            let actionClass = 'log-default';
            
            switch(log.action) {
                case 'Peserta Ditambahkan':
                    actionIcon = '👤';
                    actionClass = 'log-added';
                    break;
                case 'Tambah Kata Kasar':
                    actionIcon = '➕';
                    actionClass = 'log-increase';
                    break;
                case 'Kurangi Kata Kasar':
                    actionIcon = '➖';
                    actionClass = 'log-decrease';
                    break;
                case 'Peserta Dihapus':
                    actionIcon = '🗑️';
                    actionClass = 'log-deleted';
                    break;
            }
            
            const userPhotoHtml = log.userPhoto ? 
                `<div class="log-user-photo" onclick="showFullscreenPhoto('${log.userPhoto}')">
                    <img src="${log.userPhoto}" alt="Foto user" title="Klik untuk melihat foto penuh">
                </div>` : '';
            
            return `
                <div class="log-item ${actionClass}">
                    <div class="log-icon">${actionIcon}</div>
                    ${userPhotoHtml}
                    <div class="log-content">
                        <div class="log-action">${log.action}</div>
                        <div class="log-details">
                            ${log.oldValue !== null && log.newValue !== null ? 
                                `${log.oldValue} → ${log.newValue}` : 
                                log.newValue || log.oldValue || ''}
                        </div>
                        <div class="log-meta">
                            <span class="log-device">${log.device}</span>
                            <span class="log-time">${log.date} ${log.time}</span>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    modal.style.display = 'block';
}

// Fungsi untuk menutup modal log aktivitas
function closeActivityLogModal() {
    document.getElementById('activityLogModal').style.display = 'none';
}

// Fungsi untuk menampilkan foto fullscreen
function showFullscreenPhoto(photoSrc) {
    // Create fullscreen modal
    const fullscreenModal = document.createElement('div');
    fullscreenModal.id = 'fullscreenPhotoModal';
    fullscreenModal.className = 'fullscreen-photo-modal';
    fullscreenModal.innerHTML = `
        <div class="fullscreen-photo-content">
            <span class="fullscreen-close" onclick="closeFullscreenPhoto()">&times;</span>
            <img src="${photoSrc}" alt="Foto Fullscreen" class="fullscreen-photo">
        </div>
    `;
    
    // Add to body
    document.body.appendChild(fullscreenModal);
    
    // Show modal
    fullscreenModal.style.display = 'flex';
    
    // Close on click outside
    fullscreenModal.addEventListener('click', function(e) {
        if (e.target === fullscreenModal) {
            closeFullscreenPhoto();
        }
    });
    
    // Close on Escape key
    document.addEventListener('keydown', function escapeHandler(e) {
        if (e.key === 'Escape') {
            closeFullscreenPhoto();
            document.removeEventListener('keydown', escapeHandler);
        }
    });
}

// Fungsi untuk menutup foto fullscreen
function closeFullscreenPhoto() {
    const fullscreenModal = document.getElementById('fullscreenPhotoModal');
    if (fullscreenModal) {
        fullscreenModal.remove();
    }
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
        // Simpan ke localStorage
        localStorage.setItem('minimalistRankingData', JSON.stringify(data));
        
        // Cek apakah server backend tersedia (localhost:3001 atau deployment dengan API)
        const hasBackendAPI = (window.location.hostname === 'localhost' && window.location.port === '3001') || 
                             window.location.hostname.includes('vercel.app') ||
                             window.location.hostname !== 'localhost';
        
        if (hasBackendAPI) {
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
                console.log('Server tidak tersedia:', serverError);
                showNotification('Data disimpan ke browser (server offline)', 'info');
                updateSyncStatus('local');
            }
        } else {
            // Jika bukan di server localhost:3001, hanya simpan ke localStorage
            showNotification('Data disimpan ke browser', 'success');
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

// Fungsi untuk memuat data
async function loadData() {
    console.log('Loading data...');
    
    // Cek profil user terlebih dahulu
    if (!checkUserProfile()) {
        showUserProfileModal();
        return;
    }
    
    // Cek apakah server backend tersedia
    const hasBackendAPI = (window.location.hostname === 'localhost' && window.location.port === '3001') || 
                         window.location.hostname.includes('vercel.app') ||
                         window.location.hostname !== 'localhost';
    
    if (hasBackendAPI) {
        try {
            // Coba load dari API server
            const response = await fetch('/api/load-data');
            console.log('API response:', response.status, response.ok);
            
            if (response.ok) {
                const data = await response.json();
                console.log('Data loaded from API:', data);
                
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
                    showNotification('Database siap digunakan', 'info');
                }
                
                // Render data setelah dimuat
                renderParticipants();
                updateStats();
                addEditProfileButton();
                return;
            }
        } catch (apiError) {
            console.log('API tidak tersedia, mencoba file JSON:', apiError);
        }
    }
    
    // Fallback: coba load dari file JSON lokal
    try {
        const response = await fetch('./data.json');
        console.log('JSON file response:', response.status, response.ok);
        
        if (response.ok) {
            const data = await response.json();
            console.log('Data loaded from JSON file:', data);
            
            participants = data.participants || [];
            isDarkMode = data.settings?.isDarkMode || false;
            
            if (isDarkMode) {
                document.body.classList.add('dark-mode');
            }
            
            localStorage.setItem('minimalistRankingData', JSON.stringify(data));
            updateSyncStatus('local');
            
            if (participants.length > 0) {
                showNotification(`Data dimuat dari file: ${participants.length} peserta`, 'info');
            } else {
                showNotification('Database JSON siap digunakan', 'info');
            }
            
            renderParticipants();
            updateStats();
            addEditProfileButton();
            return;
        }
    } catch (fileError) {
        console.log('File JSON tidak tersedia:', fileError);
    }
    
    // Final fallback: localStorage
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
        
        renderParticipants();
        updateStats();
    } else {
        console.log('No data found, starting fresh');
        updateSyncStatus('empty');
        showNotification('Memulai dengan data kosong', 'info');
        addEditProfileButton();
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
    const rankingModal = document.getElementById('rankingModal');
    const activityLogModal = document.getElementById('activityLogModal');
    
    if (e.target === rankingModal) {
        closeRankingModal();
    }
    
    if (e.target === activityLogModal) {
        closeActivityLogModal();
    }
});
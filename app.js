// Booking Web App - Main Application
let allBookings = [];
let currentMonth = 'Mar';
let currentUser = null;

// Permission definitions
const PERMISSIONS = {
    view_bookings: 'ดูรายการจอง',
    manage_bookings: 'จัดการจอง',
    manage_users: 'จัดการผู้ใช้',
    view_reports: 'ดูรายงาน'
};

// Role display names
const ROLE_NAMES = {
    owner: 'เจ้าของ',
    manager: 'ผู้จัดการ',
    external: 'บุคคลภายนอก'
};

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    checkAuth();
    await loadData();
    setupMonthButtons();
    renderBookings();
    setupLogout();
});

// Check authentication status
function checkAuth() {
    // Check localStorage first (Remember Me)
    let userData = localStorage.getItem('currentUser');
    const rememberMe = localStorage.getItem('rememberMe') === 'true';
    
    // If not in localStorage, check sessionStorage
    if (!userData) {
        userData = sessionStorage.getItem('currentUser');
    }
    
    if (userData) {
        currentUser = JSON.parse(userData);
        
        // If Remember Me is on, ensure it's in localStorage
        if (rememberMe && !localStorage.getItem('currentUser')) {
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
        }
        
        showUserSection();
    } else {
        showLoginSection();
    }
}

// Show user info section
function showUserSection() {
    document.getElementById('login-section').style.display = 'none';
    document.getElementById('user-section').style.display = 'flex';
    
    document.getElementById('user-name').textContent = '🔹 ' + currentUser.position;
    
    // Apply permissions
    applyPermissions();
}

// Show login link
function showLoginSection() {
    document.getElementById('user-section').style.display = 'none';
    document.getElementById('login-section').style.display = 'block';
}

// Apply permission-based UI
function applyPermissions() {
    // Show/hide elements based on permissions
    const permElements = document.querySelectorAll('[data-permission]');
    permElements.forEach(el => {
        const requiredPerm = el.dataset.permission;
        if (currentUser && currentUser.permissions && currentUser.permissions.includes(requiredPerm)) {
            el.style.display = '';
        } else {
            el.style.display = 'none';
        }
    });
}

// Setup logout button
function setupLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            // Clear both localStorage and sessionStorage
            localStorage.removeItem('currentUser');
            localStorage.removeItem('rememberMe');
            sessionStorage.removeItem('currentUser');
            window.location.href = 'login.html';
        });
    }
}

// Check if user has permission
function hasPermission(permission) {
    return currentUser && currentUser.permissions && currentUser.permissions.includes(permission);
}

async function loadData() {
    try {
        const response = await fetch('../data/bookings_2026.json');
        allBookings = await response.json();
        console.log('Loaded bookings:', allBookings.length);
    } catch (error) {
        console.error('Error loading data:', error);
        document.getElementById('bookings-container').innerHTML = 
            '<p class="no-data">ไม่สามารถโหลดข้อมูลได้</p>';
    }
}

function setupMonthButtons() {
    const buttons = document.querySelectorAll('.month-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Update current month and render
            currentMonth = btn.dataset.month;
            renderBookings();
        });
    });
}

function renderBookings() {
    const container = document.getElementById('bookings-container');
    
    // Filter bookings by month
    const monthBookings = allBookings.filter(b => b.month === currentMonth);
    
    // Remove empty entries (no booking)
    const validBookings = monthBookings.filter(b => b.name && b.name.trim() !== '');
    
    if (validBookings.length === 0) {
        container.innerHTML = '<p class="no-data">ไม่มีรายการจองในเดือนนี้</p>';
        return;
    }
    
    // Group by room type
    const grouped = groupByRoom(validBookings);
    
    // Generate HTML
    let html = '';
    
    for (const [roomType, bookings] of Object.entries(grouped)) {
        html += `<div class="room-group"><h3 class="room-type-title">${getRoomEmoji(roomType)} ${roomType}</h3>`;
        
        bookings.forEach(booking => {
            html += createBookingCard(booking);
        });
        
        html += '</div>';
    }
    
    container.innerHTML = html;
}

function groupByRoom(bookings) {
    const groups = {
        'บ้านพัก (A)': [],
        'ห้อง B': [],
        'ห้อง F': [],
        'ห้อง H': [],
        'ลานกางเต็นท์': []
    };
    
    bookings.forEach(b => {
        const room = b.room || '';
        if (room === 'A' || room.startsWith('A')) {
            groups['บ้านพัก (A)'].push(b);
        } else if (room.startsWith('B')) {
            groups['ห้อง B'].push(b);
        } else if (room.startsWith('F')) {
            groups['ห้อง F'].push(b);
        } else if (room.startsWith('H')) {
            groups['ห้อง H'].push(b);
        } else if (room.includes('ลาน') || room.includes('A') === false && room !== '') {
            groups['ลานกางเต็นท์'].push(b);
        }
    });
    
    // Remove empty groups
    return Object.fromEntries(
        Object.entries(groups).filter(([_, v]) => v.length > 0)
    );
}

function createRoomClass(room) {
    if (!room) return '';
    if (room.startsWith('A')) return 'room-A';
    if (room.startsWith('B')) return 'room-B';
    if (room.startsWith('C')) return 'room-C';
    if (room.startsWith('F')) return 'room-F';
    if (room.startsWith('H')) return 'room-H';
    if (room.includes('ลาน')) return 'room-ลาน';
    return '';
}

function getRoomEmoji(room) {
    if (!room) return '🏠';
    if (room.startsWith('A')) return '🏠';
    if (room.startsWith('B')) return '🛏️';
    if (room.startsWith('C')) return '🛏️';
    if (room.startsWith('F')) return '🛏️';
    if (room.startsWith('H')) return '🛏️';
    if (room.includes('ลาน')) return '⛺';
    return '🏠';
}

function createBookingCard(booking) {
    const roomClass = createRoomClass(booking.room);
    const roomDisplay = booking.room || '-';
    
    let html = `
        <div class="booking-card ${roomClass}">
            <div class="booking-header">
                <span class="room-badge">${roomDisplay}</span>
                <span class="booking-name">${booking.name || 'ไม่ระบุชื่อ'}</span>
            </div>
            <div class="booking-details">
    `;
    
    if (booking.people) {
        html += `
            <div class="detail-item">
                <span class="label">👥</span>
                <span class="value">${booking.people}</span>
            </div>
        `;
    }
    
    if (booking.province) {
        html += `
            <div class="detail-item">
                <span class="label">📍</span>
                <span class="value">${booking.province}</span>
            </div>
        `;
    }
    
    if (booking.phone) {
        html += `
            <div class="detail-item">
                <span class="label">📱</span>
                <a href="tel:${booking.phone}" class="phone-link">${booking.phone}</a>
            </div>
        `;
    }
    
    if (booking.deposit) {
        html += `
            <div class="detail-item">
                <span class="label">💰 มัดจำ</span>
                <span class="value">${booking.deposit} บาท</span>
            </div>
        `;
    }
    
    if (booking.price) {
        html += `
            <div class="detail-item">
                <span class="label">💵 ราคา</span>
                <span class="value">${booking.price} บาท</span>
            </div>
        `;
    }
    
    html += '</div>';
    
    if (booking.remark) {
        html += `<div class="remark">📝 ${booking.remark}</div>`;
    }
    
    html += '</div>';
    
    return html;
}

// Global variables
let currentUser = null;
let subjects = [];
let timetable = {};
let attendanceData = [];

// Handle user authentication and storage
class Auth {
    constructor() {
        this.users = JSON.parse(localStorage.getItem('users')) || [];
        this.currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    }

    signup(name, email, password) {
        if (this.users.find(u => u.email === email)) {
            throw new Error('Email already registered');
        }

        const user = {
            id: Date.now().toString(),
            name,
            email,
            password,
            createdAt: new Date().toISOString()
        };

        this.users.push(user);
        localStorage.setItem('users', JSON.stringify(this.users));
        
        // Automatically log in after signup
        this.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        return user;
    }

    login(email, password) {
        const user = this.users.find(u => u.email === email && u.password === password);
        if (!user) {
            throw new Error('Invalid credentials');
        }

        this.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        return user;
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        window.location.href = 'index.html';
    }

    isLoggedIn() {
        return !!this.currentUser;
    }
}

const auth = new Auth();

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    checkAuth();
    
    // Load user data
    loadUserData();
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize timetable
    initializeTimetable();
    
    // Update dashboard
    updateDashboard();
});

function checkAuth() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    currentUser = user;
}

function loadUserData() {
    // Load subjects
    subjects = JSON.parse(localStorage.getItem('subjects_' + currentUser.id)) || [];
    
    // Load timetable
    timetable = JSON.parse(localStorage.getItem('timetable_' + currentUser.id)) || {};
    
    // Load attendance
    attendanceData = JSON.parse(localStorage.getItem('attendance_' + currentUser.id)) || [];
}

function setupEventListeners() {
    // Add subject form
    document.getElementById('add-subject-form').addEventListener('submit', addSubject);
    
    // Add class to timetable
    document.getElementById('add-class-form').addEventListener('submit', addClass);
    
    // Mark attendance
    document.getElementById('mark-attendance-form').addEventListener('submit', markAttendance);
    
    // Theme toggle
    document.getElementById('theme-toggle').addEventListener('click', toggleTheme);
}

function addSubject(e) {
    e.preventDefault();
    const subjectName = document.getElementById('subject-name').value;
    const subjectCode = document.getElementById('subject-code').value;
    
    subjects.push({
        id: Date.now().toString(),
        name: subjectName,
        code: subjectCode
    });
    
    saveSubjects();
    updateSubjectsList();
}

function addClass(e) {
    e.preventDefault();
    const day = document.getElementById('class-day').value;
    const subject = document.getElementById('class-subject').value;
    const startTime = document.getElementById('start-time').value;
    const endTime = document.getElementById('end-time').value;
    
    if (!timetable[day]) {
        timetable[day] = [];
    }
    
    timetable[day].push({
        subject,
        startTime,
        endTime
    });
    
    saveTimetable();
    updateTimetableView();
}

function markAttendance(e) {
    e.preventDefault();
    const subject = document.getElementById('attendance-subject').value;
    const status = document.getElementById('attendance-status').value;
    const date = new Date().toISOString();
    
    attendanceData.push({
        subject,
        status,
        date
    });
    
    saveAttendance();
    updateAttendanceStats();
}

function saveSubjects() {
    localStorage.setItem('subjects_' + currentUser.id, JSON.stringify(subjects));
}

function saveTimetable() {
    localStorage.setItem('timetable_' + currentUser.id, JSON.stringify(timetable));
}

function saveAttendance() {
    localStorage.setItem('attendance_' + currentUser.id, JSON.stringify(attendanceData));
}

function updateDashboard() {
    updateSubjectsList();
    updateTimetableView();
    updateAttendanceStats();
}

// Handle login form
if (document.getElementById('login-form')) {
    const loginForm = document.getElementById('login-form');
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            await auth.login(email, password);
            
            // Show success animation
            const container = document.querySelector('.login-container');
            container.style.transform = 'scale(0.95)';
            container.style.opacity = '0';
            
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 500);
        } catch (error) {
            // Show error animation
            loginForm.classList.add('shake');
            setTimeout(() => loginForm.classList.remove('shake'), 500);
            
            // Show error message
            const errorMsg = document.createElement('div');
            errorMsg.className = 'error-message';
            errorMsg.textContent = error.message;
            loginForm.appendChild(errorMsg);
            
            setTimeout(() => {
                errorMsg.remove();
            }, 3000);
        }
    });
}

// Handle signup form
if (document.getElementById('signup-form')) {
    const signupForm = document.getElementById('signup-form');
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirm-password').value;

        if (password !== confirmPassword) {
            throw new Error('Passwords do not match');
        }

        try {
            await auth.signup(name, email, password);
            
            // Show success animation
            const container = document.querySelector('.login-container');
            container.style.transform = 'scale(0.95)';
            container.style.opacity = '0';
            
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 500);
        } catch (error) {
            // Show error animation
            signupForm.classList.add('shake');
            setTimeout(() => signupForm.classList.remove('shake'), 500);
            
            // Show error message
            const errorMsg = document.createElement('div');
            errorMsg.className = 'error-message';
            errorMsg.textContent = error.message;
            signupForm.appendChild(errorMsg);
            
            setTimeout(() => {
                errorMsg.remove();
            }, 3000);
        }
    });
}

// Only check authentication on protected pages
const protectedPages = ['manage_subjects.html', 'mark_attendance.html', 'view_schedule.html'];
if (protectedPages.some(page => window.location.pathname.includes(page))) {
    if (!auth.isLoggedIn()) {
        window.location.href = 'login.html';
    }
}

// Add more functions as needed...

// Check authentication on protected pages
async function checkAuth() {
    const user = await checkUser();
    if (!user) {
        window.location.href = 'login.html';
        return null;
    }
    return user;
}

// Get user data for the current page
async function initPage() {
    const user = await checkAuth();
    if (!user) return;
    
    // Set up logout button
    document.getElementById('logout').addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            await signOut();
            window.location.href = 'index.html';
        } catch (error) {
            console.error('Error signing out:', error);
        }
    });
    
    // Additional page initialization can go here
    return user;
}

// Call this at the beginning of each protected page
document.addEventListener('DOMContentLoaded', initPage);
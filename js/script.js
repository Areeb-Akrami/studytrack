import {
    auth, db, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged,
    doc, setDoc, getDoc, updateDoc, collection, addDoc, query, where, getDocs
} from './firebase-config.js';

// Global state
let currentUser = null;
let subjects = [];
let timetable = {};
let attendanceData = [];

// --- UI Helper Functions ---

function showMessage(message, type = 'info') {
    const container = document.getElementById('message-container');
    if (!container) {
        console.warn("Message container not found, falling back to alert:", message);
        alert(message);
        return;
    }

    // Check if css for message exists, if not, relying on existing page styles
    // The existing pages (login/signup) have CSS for .message, .success-message etc.

    const messageElement = document.createElement('div');
    messageElement.className = `message ${type}-message`;

    let icon = '';
    switch (type) {
        case 'success': icon = 'fa-check-circle'; break;
        case 'error': icon = 'fa-exclamation-circle'; break;
        case 'warning': icon = 'fa-exclamation-triangle'; break;
        default: icon = 'fa-info-circle';
    }

    messageElement.innerHTML = `
        <i class="fas ${icon}"></i>
        <span>${message}</span>
    `;

    container.appendChild(messageElement);

    setTimeout(() => {
        messageElement.style.opacity = '0';
        messageElement.style.transform = 'translateY(-10px)';
        messageElement.style.transition = 'all 0.3s ease';

        setTimeout(() => messageElement.remove(), 300);
    }, 4000);
}

// --- Authentication Functions ---

async function handleSignup(name, email, password) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Save additional user info to Firestore
        await setDoc(doc(db, "users", user.uid), {
            name: name,
            email: email,
            createdAt: new Date().toISOString()
        });

        return user;
    } catch (error) {
        console.error("Signup error:", error);
        throw error;
    }
}

async function handleLogin(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error) {
        console.error("Login error:", error);
        throw error;
    }
}

async function handleLogout() {
    try {
        // Show loading state if button exists
        const logoutBtn = document.getElementById('logout-btn') || document.getElementById('logout');
        if (logoutBtn) {
            const originalText = logoutBtn.innerHTML;
            logoutBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging out...';
            logoutBtn.disabled = true;
        }

        await signOut(auth);
        window.location.href = 'login.html?loggedout=true';
    } catch (error) {
        console.error("Logout error:", error);
        showMessage("Failed to logout", "error");
    }
}

// --- Data Management Functions ---

async function loadUserData(user) {
    if (!user) return;

    try {
        console.log("Loading data for user:", user.uid);

        // Load subjects
        const subjectsQuery = query(collection(db, "subjects"), where("userId", "==", user.uid));
        const subjectsSnapshot = await getDocs(subjectsQuery);
        subjects = [];
        subjectsSnapshot.forEach((doc) => {
            subjects.push({ id: doc.id, ...doc.data() });
        });

        // Load attendance
        const attendanceQuery = query(collection(db, "attendance"), where("userId", "==", user.uid));
        const attendanceSnapshot = await getDocs(attendanceQuery);
        attendanceData = [];
        attendanceSnapshot.forEach((doc) => {
            attendanceData.push({ id: doc.id, ...doc.data() });
        });

        // Load timetable
        const timetableQuery = query(collection(db, "timetable"), where("userId", "==", user.uid));
        const timetableSnapshot = await getDocs(timetableQuery);
        timetable = {};
        timetableSnapshot.forEach((doc) => {
            const data = doc.data();
            if (!timetable[data.day]) timetable[data.day] = [];
            timetable[data.day].push({
                subject: data.subject,
                startTime: data.startTime,
                endTime: data.endTime,
                id: doc.id
            });
        });

        // Refresh UI
        updateDashboard();

    } catch (error) {
        console.error("Error loading user data:", error);
        showMessage("Failed to load your data. Check console for details.", "error");
    }
}

async function addSubject(e) {
    e.preventDefault();
    const subjectName = document.getElementById('subject-name').value;
    const subjectCode = document.getElementById('subject-code').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');

    if (!currentUser) return;

    try {
        if (submitBtn) submitBtn.disabled = true;

        const docRef = await addDoc(collection(db, "subjects"), {
            userId: currentUser.uid,
            name: subjectName,
            code: subjectCode,
            createdAt: new Date().toISOString()
        });

        subjects.push({
            id: docRef.id,
            name: subjectName,
            code: subjectCode
        });

        updateSubjectsList();
        e.target.reset();
        showMessage("Subject added successfully", "success");
    } catch (error) {
        console.error("Error adding subject: ", error);
        showMessage("Failed to add subject: " + error.message, "error");
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
}

async function addClass(e) {
    e.preventDefault();
    const day = document.getElementById('class-day').value;
    const subject = document.getElementById('class-subject').value;
    const startTime = document.getElementById('start-time').value;
    const endTime = document.getElementById('end-time').value;
    const submitBtn = e.target.querySelector('button[type="submit"]');

    if (!currentUser) return;

    try {
        if (submitBtn) submitBtn.disabled = true;

        const docRef = await addDoc(collection(db, "timetable"), {
            userId: currentUser.uid,
            day,
            subject,
            startTime,
            endTime
        });

        if (!timetable[day]) timetable[day] = [];
        timetable[day].push({
            subject,
            startTime,
            endTime,
            id: docRef.id
        });

        updateTimetableView();
        e.target.reset();
        showMessage("Class added to timetable", "success");
    } catch (error) {
        console.error("Error adding class: ", error);
        showMessage("Failed to add class", "error");
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
}

async function markAttendance(e) {
    e.preventDefault();
    const subject = document.getElementById('attendance-subject').value;
    const status = document.getElementById('attendance-status').value;
    const date = new Date().toISOString();
    const submitBtn = e.target.querySelector('button[type="submit"]');

    if (!currentUser) return;

    try {
        if (submitBtn) submitBtn.disabled = true;

        const docRef = await addDoc(collection(db, "attendance"), {
            userId: currentUser.uid,
            subject,
            status,
            date
        });

        attendanceData.push({
            subject,
            status,
            date,
            id: docRef.id
        });

        updateAttendanceStats();
        e.target.reset();
        showMessage("Attendance marked", "success");
    } catch (error) {
        console.error("Error marking attendance: ", error);
        showMessage("Failed to mark attendance", "error");
    } finally {
        if (submitBtn) submitBtn.disabled = false;
    }
}

// --- UI Update Helpers ---

function updateSubjectsList() {
    const container = document.getElementById('subjects-list');
    if (!container) return;

    container.innerHTML = '';
    if (subjects.length === 0) {
        container.innerHTML = '<p class="no-data">No subjects added yet.</p>';
        return;
    }

    subjects.forEach(sub => {
        const div = document.createElement('div');
        div.className = 'subject-card';
        div.innerHTML = `
            <h3>${sub.name}</h3>
            <p>${sub.code}</p>
        `;
        container.appendChild(div);
    });
}

function updateTimetableView() {
    console.log("Timetable updated in memory", timetable);
    // TODO: Implement actual DOM update if view_schedule.html structures are known
}

function updateAttendanceStats() {
    console.log("Attendance stats updated in memory", attendanceData);
    // TODO: Implement actual DOM update
}

function updateDashboard() {
    updateSubjectsList();
    updateTimetableView();
    updateAttendanceStats();

    // Update welcome message if possible
    const welcomeMsg = document.getElementById('welcome-message');
    if (welcomeMsg && currentUser) {
        // Try to find name in users collection or use email
        // For now just use email part
        const name = currentUser.email.split('@')[0];
        welcomeMsg.textContent = `Welcome, ${name}`;
        welcomeMsg.style.display = 'block';
    }
}


// --- Initialization ---

document.addEventListener('DOMContentLoaded', function () {

    // Check for logged out query param
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('loggedout') === 'true') {
        showMessage('You have been logged out successfully.', 'success');
        // Clean URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Auth State Observer
    onAuthStateChanged(auth, (user) => {
        if (user) {
            currentUser = user;
            console.log("User is signed in:", user.email);

            // If on login/signup page, redirect to index
            if (window.location.pathname.includes('login.html') || window.location.pathname.includes('signup.html')) {
                console.log("Redirecting to dashboard...");
                window.location.href = 'index.html';
            } else {
                loadUserData(user);
            }
        } else {
            currentUser = null;
            console.log("No user signed in");

            // Protected routes check
            const protectedPages = ['manage_subjects.html', 'mark_attendance.html', 'view_schedule.html', 'subjects.html', 'attendance.html'];
            const isProtected = protectedPages.some(page => window.location.pathname.includes(page));

            if (isProtected) {
                console.log("Accessing protected page without auth, redirecting...");
                window.location.href = 'login.html';
            }
        }
    });

    // --- Event Listeners for Forms ---

    // Login Form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const btn = loginForm.querySelector('button[type="submit"]');

            try {
                if (btn) {
                    btn.disabled = true;
                    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
                }

                await handleLogin(email, password);
                showMessage("Login successful! Redirecting...", "success");
                // Redirect handled by onAuthStateChanged
            } catch (error) {
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = 'Login';
                }
                showMessage("Login Failed: " + error.message, "error");
            }
        });
    }

    // Signup Form
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
        signupForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const btn = signupForm.querySelector('button[type="submit"]');

            if (password !== confirmPassword) {
                showMessage("Passwords do not match", "error");
                return;
            }

            try {
                if (btn) {
                    btn.disabled = true;
                    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Account...';
                }

                await handleSignup(name, email, password);
                showMessage("Account created! Redirecting...", "success");
                // Redirect handled by onAuthStateChanged
            } catch (error) {
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = 'Sign Up';
                }
                showMessage("Signup Failed: " + error.message, "error");
            }
        });
    }

    // Data Forms
    const addSubjectForm = document.getElementById('add-subject-form');
    if (addSubjectForm) addSubjectForm.addEventListener('submit', addSubject);

    const addClassForm = document.getElementById('add-class-form');
    if (addClassForm) addClassForm.addEventListener('submit', addClass);

    const markAttendanceForm = document.getElementById('mark-attendance-form');
    if (markAttendanceForm) markAttendanceForm.addEventListener('submit', markAttendance);

    // Logout Button
    const logoutBtn = document.getElementById('logout-btn') || document.getElementById('logout');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            handleLogout();
        });
    }
});
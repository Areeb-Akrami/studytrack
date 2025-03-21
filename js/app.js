// Initialize Supabase
const supabaseUrl = 'https://iijzdoimduaulxtyfmwz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpanpkb2ltZHVhdWx4dHlmbXd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI0OTc5NTEsImV4cCI6MjA1ODA3Mzk1MX0.DQtCE2CZCIVw0wVCaaJs7G3XufVsASyZYaefgHv7pX0';
const supabase = window.supabase.createClient(supabaseUrl, supabaseKey);

// Global variables
let currentUser = null;
let subjects = [];
let classSchedule = {};
let studySchedule = {};
let attendanceData = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', async function() {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        
        // If we're on the login page, don't redirect
        if (window.location.pathname.includes('login.html')) {
            return;
        }
        
        // If not on login page and no user, redirect to login
        if (!user) {
            window.location.href = 'login.html';
            return;
        }
        
        // User is logged in, set up the app
        currentUser = {
            id: user.id,
            email: user.email,
            name: user.user_metadata?.name || user.email.split('@')[0]
        };
        
        // Update user name if element exists
        const userNameElement = document.getElementById('user-name');
        if (userNameElement) {
            userNameElement.textContent = `Welcome, ${currentUser.name}`;
        }
        
        // Load data and set up UI
        await loadUserDataFromSupabase();
        setupEventListeners();
        if (typeof updateDashboard === 'function') {
            updateDashboard();
        }
    } catch (error) {
        console.error('Error initializing app:', error);
    }
});

async function loadUserDataFromSupabase() {
    try {
        // Load subjects
        const { data: subjectsData, error: subjectsError } = await supabase
            .from('subjects')
            .select('*')
            .eq('user_id', currentUser.id);
        if (subjectsError) throw subjectsError;
        subjects = subjectsData || [];
        
        // Load attendance data
        const { data: attendanceDataResult, error: attendanceError } = await supabase
            .from('attendance')
            .select('*')
            .eq('user_id', currentUser.id);
        if (attendanceError) throw attendanceError;
        attendanceData = attendanceDataResult || [];
        
        // Load class schedule
        const { data: classScheduleData, error: classScheduleError } = await supabase
            .from('class_schedule')
            .select('*')
            .eq('user_id', currentUser.id);
        if (classScheduleError) throw classScheduleError;
        classSchedule = classScheduleData || {};
        
        // Load study schedule
        const { data: studyScheduleData, error: studyScheduleError } = await supabase
            .from('study_schedule')
            .select('*')
            .eq('user_id', currentUser.id);
        if (studyScheduleError) throw studyScheduleError;
        studySchedule = studyScheduleData || {};
        
        console.log('Data loaded successfully');
    } catch (error) {
        console.error('Error loading data from Supabase:', error);
    }
}

function setupEventListeners() {
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async function(e) {
            e.preventDefault();
            await supabase.auth.signOut();
            window.location.href = 'login.html';
        });
    }

    // Navigation event listeners
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const page = e.target.getAttribute('data-page');
            if (page) {
                handleNavigation(page);
            }
        });
    });

    // Tab switching
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', () => {
            document.querySelectorAll('.tab-button').forEach(b => b.classList.remove('active'));
            button.classList.add('active');
            
            document.querySelectorAll('.timetable-content > div').forEach(div => div.classList.remove('active'));
            document.getElementById(button.dataset.tab + '-schedule').classList.add('active');
        });
    });

    // Add schedule modal
    const modal = document.getElementById('add-schedule-modal');
    const btn = document.getElementById('add-schedule-btn');
    const span = document.getElementsByClassName('close')[0];

    btn.onclick = () => modal.style.display = 'block';
    span.onclick = () => modal.style.display = 'none';
    window.onclick = (e) => {
        if (e.target == modal) modal.style.display = 'none';
    }

    // Add schedule form
    document.getElementById('add-schedule-form').addEventListener('submit', addSchedule);

    // Mark attendance form
    document.getElementById('mark-attendance-form').addEventListener('submit', markAttendance);

    // Add subject form submission
    document.getElementById('add-subject-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const subject = {
            id: Date.now().toString(),
            name: document.getElementById('subject-name').value,
            code: document.getElementById('subject-code').value,
            totalClasses: parseInt(document.getElementById('total-classes').value),
            createdAt: new Date().toISOString()
        };

        await addSubject(subject);
        this.reset();
    });

    // Add this function to handle the study planner form submission
    document.getElementById('study-planner-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const numSubjects = parseInt(document.getElementById('num-subjects').value);
        const subjectNames = document.getElementById('subject-names').value.split(',').map(name => name.trim());
        const studyTimes = document.getElementById('study-times').value.split(',').map(time => time.trim());
        const holidays = document.getElementById('holidays').value.split(',').map(day => day.trim().toLowerCase());
        
        // Generate the timetable
        const timetable = generateWeeklyTimetable(numSubjects, subjectNames, studyTimes, holidays);
        displayTimetable(timetable);
    });
}

async function addSchedule(e) {
    e.preventDefault();
    
    const type = document.getElementById('schedule-type').value;
    const subject = document.getElementById('schedule-subject').value;
    const day = document.getElementById('schedule-day').value;
    const startTime = document.getElementById('start-time').value;
    const endTime = document.getElementById('end-time').value;
    
    const schedule = type === 'class' ? classSchedule : studySchedule;
    
    if (!schedule[day]) {
        schedule[day] = [];
    }
    
    schedule[day].push({
        subject,
        startTime,
        endTime,
        type
    });
    
    // Sort by start time
    schedule[day].sort((a, b) => a.startTime.localeCompare(b.startTime));
    
    // Save to Supabase
    await saveScheduleToSupabase(type, schedule);
    
    // Update display
    updateScheduleDisplay();
    
    // Close modal
    document.getElementById('add-schedule-modal').style.display = 'none';
    e.target.reset();
}

function updateScheduleDisplay() {
    const today = new Date().toLocaleLowerCase().split(',')[0];
    
    // Update class schedule
    const classContainer = document.getElementById('class-schedule');
    classContainer.innerHTML = '';
    
    if (classSchedule[today] && classSchedule[today].length > 0) {
        classSchedule[today].forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'class-slot fade-in-up';
            div.style.animationDelay = `${index * 0.1}s`;
            
            div.innerHTML = `
                <div class="time">${item.startTime} - ${item.endTime}</div>
                <div class="subject">${item.subject}</div>
                <button onclick="deleteScheduleItem('class', '${today}', ${index})" class="btn-small">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            
            classContainer.appendChild(div);
        });
    } else {
        classContainer.innerHTML = '<p class="no-schedule">No classes scheduled for today</p>';
    }
    
    // Update study schedule
    const studyContainer = document.getElementById('study-schedule');
    studyContainer.innerHTML = '';
    
    if (studySchedule[today] && studySchedule[today].length > 0) {
        studySchedule[today].forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'study-slot fade-in-up';
            div.style.animationDelay = `${index * 0.1}s`;
            
            div.innerHTML = `
                <div class="time">${item.startTime} - ${item.endTime}</div>
                <div class="subject">${item.subject}</div>
                <button onclick="deleteScheduleItem('study', '${today}', ${index})" class="btn-small">
                    <i class="fas fa-trash"></i>
                </button>
            `;
            
            studyContainer.appendChild(div);
        });
    } else {
        studyContainer.innerHTML = '<p class="no-schedule">No study sessions scheduled for today</p>';
    }
}

function deleteScheduleItem(type, day, index) {
    if (confirm('Are you sure you want to delete this schedule item?')) {
        const schedule = type === 'class' ? classSchedule : studySchedule;
        schedule[day].splice(index, 1);
        
        // Save to Supabase
        saveScheduleToSupabase(type, schedule);
        
        // Update display
        updateScheduleDisplay();
    }
}

async function markAttendance(e) {
    e.preventDefault();
    
    const subject = document.getElementById('attendance-subject').value;
    const status = document.getElementById('attendance-status').value;
    
    if (!subject) {
        alert('Please select a subject');
        return;
    }

    const record = {
        subject,
        status,
        date: new Date().toISOString(),
        userId: currentUser.id
    };

    attendanceData.push(record);
    await saveAttendanceToSupabase();
    updateAttendanceStats();

    // Show success message
    const btn = e.target.querySelector('button');
    const originalText = btn.textContent;
    btn.textContent = 'Marked!';
    btn.style.backgroundColor = '#4CAF50';
    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.backgroundColor = '';
    }, 2000);
}

function updateAttendanceStats() {
    const stats = attendanceData.reduce((acc, record) => {
        acc[record.status] = (acc[record.status] || 0) + 1;
        return acc;
    }, {});

    document.getElementById('present-count').textContent = stats.present || 0;
    document.getElementById('absent-count').textContent = stats.absent || 0;
    document.getElementById('late-count').textContent = stats.late || 0;

    // Add animation
    document.querySelectorAll('.stat-card').forEach(card => {
        card.classList.add('pop-in');
        setTimeout(() => card.classList.remove('pop-in'), 500);
    });
}

function updateDashboard() {
    updateScheduleDisplay();
    updateAttendanceStats();
}

async function logout() {
    try {
        // Clear all local storage and session storage
        localStorage.clear();
        sessionStorage.clear();
        
        // Sign out from Supabase
        await supabase.auth.signOut();
        
        // Redirect to login page
        window.location.href = 'login.html?loggedout=true';
    } catch (error) {
        console.error('Error signing out:', error);
        // Force redirect to login even if there's an error
        window.location.href = 'login.html?loggedout=true';
    }
}

async function saveSubjectsToSupabase() {
    await saveUserData(currentUser.id, 'subjects', subjects);
}

async function saveAttendanceToSupabase() {
    await saveUserData(currentUser.id, 'attendance', attendanceData);
}

async function saveScheduleToSupabase(type, data) {
    await saveUserData(currentUser.id, `${type}_schedule`, data);
}

// Function to display subjects
function displaySubjects() {
    const container = document.getElementById('subjects-list');
    if (!container) return;
    
    container.innerHTML = '';

    subjects.forEach((subject, index) => {
        const div = document.createElement('div');
        div.className = 'subject-item';
        
        div.innerHTML = `
            <div class="subject-info">
                <h3>${subject.name}</h3>
                <p>Code: ${subject.code} | Classes per week: ${subject.totalClasses}</p>
            </div>
            <div class="subject-actions">
                <button onclick="editSubject(${index})" class="btn-small btn-edit">
                    <i class="fas fa-edit"></i>
                </button>
                <button onclick="deleteSubject(${index})" class="btn-small btn-delete">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;

        container.appendChild(div);
    });
}

// Function to update the attendance dropdown
function updateAttendanceDropdown() {
    const attendanceSelect = document.getElementById('attendance-subject');
    attendanceSelect.innerHTML = '<option value="">Select Subject</option>'; // Clear previous options
    subjects.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject.name;
        option.textContent = subject.name;
        attendanceSelect.appendChild(option);
    });
}

// Function to edit a subject
function editSubject(index) {
    const subject = subjects[index];
    document.getElementById('subject-name').value = subject.name;
    document.getElementById('subject-code').value = subject.code;
    document.getElementById('total-classes').value = subject.totalClasses;

    // Remove the subject from the list for editing
    subjects.splice(index, 1);
    saveSubjectsToSupabase(); // Save the updated subjects list
    displaySubjects(); // Refresh the displayed subjects
    updateAttendanceDropdown(); // Update the attendance dropdown
}

// Function to delete a subject
function deleteSubject(index) {
    if (confirm('Are you sure you want to delete this subject?')) {
        subjects.splice(index, 1); // Remove the subject from the array
        saveSubjectsToSupabase(); // Save the updated subjects list
        displaySubjects(); // Refresh the displayed subjects
        updateAttendanceDropdown(); // Update the attendance dropdown
    }
}

// Function to generate the weekly timetable
function generateWeeklyTimetable(numSubjects, subjectNames, studyTimes, holidays) {
    const daysOfWeek = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const timetable = {};
    
    daysOfWeek.forEach(day => {
        if (!holidays.includes(day)) { // Only generate timetable for non-holiday days
            timetable[day] = {};
            studyTimes.forEach(time => {
                const [start, end] = time.split('-').map(t => t.trim());
                const startHour = parseInt(start.split(':')[0]);
                const endHour = parseInt(end.split(':')[0]);
                
                const slots = [];
                for (let hour = startHour; hour < endHour; hour++) {
                    const subjectIndex = Math.floor(Math.random() * numSubjects);
                    slots.push({
                        time: `${hour}:00 - ${hour + 1}:00`,
                        subject: subjectNames[subjectIndex % subjectNames.length] // Cycle through subjects
                    });
                }
                
                timetable[day][time] = slots;
            });
        }
    });
    
    return timetable;
}

// Function to display the generated timetable
function displayTimetable(timetable) {
    const container = document.getElementById('generated-timetable');
    container.innerHTML = ''; // Clear previous timetable
    
    for (const day in timetable) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'day-slot';
        dayDiv.innerHTML = `<h3>${day.charAt(0).toUpperCase() + day.slice(1)}</h3>`;
        
        for (const time in timetable[day]) {
            const timeDiv = document.createElement('div');
            timeDiv.className = 'time-slot';
            timeDiv.innerHTML = `<h4>${time}</h4>`;
            
            timetable[day][time].forEach(slot => {
                const slotDiv = document.createElement('div');
                slotDiv.className = 'slot';
                slotDiv.textContent = `${slot.time}: ${slot.subject}`;
                timeDiv.appendChild(slotDiv);
            });
            
            dayDiv.appendChild(timeDiv);
        }
        
        container.appendChild(dayDiv);
    }
}

async function addSubject(subject) {
    try {
        const { error } = await supabase
            .from('subjects')
            .insert([{ ...subject, user_id: currentUser.id }]);
        if (error) throw error;
        console.log('Subject added successfully');
        await loadUserDataFromSupabase();
        displaySubjects();
    } catch (error) {
        console.error('Error adding subject:', error);
    }
}

function displaySubjects() {
    const subjectsGrid = document.getElementById('subjects-grid');
    
    // Clear previous content
    subjectsGrid.innerHTML = '';
    
    if (!subjects || subjects.length === 0) {
        // Display empty state
        subjectsGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-check"></i>
                <h3>No subjects found</h3>
                <p>You haven't added any subjects yet. Add subjects to start tracking your attendance.</p>
                <a href="subjects.html" class="btn btn-present">
                    <i class="fas fa-plus"></i> Add Subjects
                </a>
            </div>
        `;
        return;
    }
    
    // Display each subject
    subjects.forEach((subject, index) => {
        const stats = calculateAttendanceStats(subject);
        const subjectCard = createSubjectCard(subject, stats, index);
        subjectsGrid.appendChild(subjectCard);
    });
}

function calculateAttendanceStats(subject) {
    // Find attendance records for this subject
    const subjectAttendance = attendanceData.filter(record => record.subject === subject.name);
    
    const totalClasses = subjectAttendance.length;
    const presentClasses = subjectAttendance.filter(record => record.status === 'present').length;
    const absentClasses = totalClasses - presentClasses;
    
    // Calculate percentage
    const percentage = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;
    
    // Determine status
    let status = 'Good';
    let progressClass = 'progress-good';
    
    if (percentage < 75 && percentage >= 60) {
        status = 'Warning';
        progressClass = 'progress-warning';
    } else if (percentage < 60) {
        status = 'Critical';
        progressClass = 'progress-danger';
    }
    
    return {
        totalClasses,
        presentClasses,
        absentClasses,
        percentage,
        status,
        progressClass
    };
}

function createSubjectCard(subject, stats, index) {
    const card = document.createElement('div');
    card.className = 'subject-card fade-in';
    card.style.animationDelay = `${index * 0.1}s`;
    
    card.innerHTML = `
        <div class="subject-header">
            <h3 class="subject-name">${subject.name}</h3>
            <p class="subject-code">${subject.code}</p>
        </div>
        <div class="subject-body">
            <div class="attendance-stats">
                <h2 class="attendance-percentage">${stats.percentage}%</h2>
                <p class="attendance-status">Attendance Status: <strong>${stats.status}</strong></p>
                <div class="progress-bar">
                    <div class="progress ${stats.progressClass}" style="width: ${stats.percentage}%"></div>
                </div>
            </div>
            
            <div class="attendance-details">
                <div class="detail-item">
                    <div class="detail-value">${stats.totalClasses}</div>
                    <div class="detail-label">Total Classes</div>
                </div>
                <div class="detail-item">
                    <div class="detail-value">${stats.presentClasses}</div>
                    <div class="detail-label">Present</div>
                </div>
                <div class="detail-item">
                    <div class="detail-value">${stats.absentClasses}</div>
                    <div class="detail-label">Absent</div>
                </div>
            </div>
            
            <div class="attendance-actions">
                <button class="btn btn-present" onclick="markAttendance('${subject.name}', 'present')">
                    <i class="fas fa-check"></i> Present
                </button>
                <button class="btn btn-absent" onclick="markAttendance('${subject.name}', 'absent')">
                    <i class="fas fa-times"></i> Absent
                </button>
            </div>
        </div>
    `;
    
    return card;
}

function markAttendance(subjectId, status) {
    const record = {
        subject: subjectId,
        status,
        date: new Date().toISOString(),
        userId: currentUser.id
    };
    attendanceData.push(record);
    saveUserData(currentUser.id, 'attendance', attendanceData);
    displaySubjects();
}

async function saveUserData(userId, tableName, data) {
    try {
        // Save data to Supabase
        const { error } = await supabase
            .from(tableName)
            .upsert(data, { onConflict: ['id'] });
        if (error) throw error;
        console.log(`${tableName} data saved successfully`);
    } catch (error) {
        console.error(`Error saving data to ${tableName}:`, error);
    }
}

async function loadUserData(userId, tableName) {
    try {
        // Load data from Supabase
        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .eq('user_id', userId);
        
        if (error) {
            console.error('Error loading user data:', error);
            return null;
        }
        
        if (data && data.length > 0) {
            return data[0];
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error loading user data:', error);
        return null;
    }
}
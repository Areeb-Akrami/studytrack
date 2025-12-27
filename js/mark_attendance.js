// Global variables
let currentUser = JSON.parse(localStorage.getItem('currentUser'));
let subjects = JSON.parse(localStorage.getItem('subjects_' + currentUser.id)) || [];
let attendanceData = JSON.parse(localStorage.getItem('attendance_' + currentUser.id)) || [];

// Load subjects on page load
document.addEventListener('DOMContentLoaded', function() {
    updateAttendanceDropdown();
    displayAttendance();
});

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

// Mark attendance form submission
document.getElementById('mark-attendance-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const subject = document.getElementById('attendance-subject').value;
    const status = document.getElementById('attendance-status').value;
    const date = document.getElementById('attendance-date').value;
    
    if (!subject || !date) {
        alert('Please select a subject and a date');
        return;
    }

    const record = {
        subject,
        status,
        date: new Date(date).toISOString(), // Store date in ISO format
        userId: currentUser.id
    };

    attendanceData.push(record);
    saveAttendance();
    displayAttendance();

    // Show success message
    const btn = e.target.querySelector('button');
    const originalText = btn.textContent;
    btn.textContent = 'Marked!';
    btn.style.backgroundColor = '#4CAF50';
    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.backgroundColor = '';
    }, 2000);
});

// Function to save attendance
function saveAttendance() {
    localStorage.setItem('attendance_' + currentUser.id, JSON.stringify(attendanceData));
}

// Function to display attendance records
function displayAttendance() {
    const attendanceList = document.getElementById('attendance-list');
    attendanceList.innerHTML = ''; // Clear previous records

    attendanceData.forEach((record, index) => {
        const div = document.createElement('div');
        div.className = 'attendance-item';
        div.innerHTML = `
            <p>${record.date}: ${record.subject} - ${record.status}</p>
            <button onclick="editAttendance(${index})">Edit</button>
            <button onclick="deleteAttendance(${index})">Delete</button>
        `;
        attendanceList.appendChild(div);
    });
}

// Function to edit attendance
function editAttendance(index) {
    const record = attendanceData[index];
    document.getElementById('attendance-subject').value = record.subject;
    document.getElementById('attendance-status').value = record.status;
    document.getElementById('attendance-date').value = new Date(record.date).toISOString().split('T')[0]; // Format date

    // Remove the record for editing
    attendanceData.splice(index, 1);
    saveAttendance(); // Save the updated attendance list
    displayAttendance(); // Refresh the displayed attendance
}

// Function to delete attendance
function deleteAttendance(index) {
    if (confirm('Are you sure you want to delete this attendance record?')) {
        attendanceData.splice(index, 1); // Remove the record from the array
        saveAttendance(); // Save the updated attendance list
        displayAttendance(); // Refresh the displayed attendance
    }
}

// Function to update attendance stats
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
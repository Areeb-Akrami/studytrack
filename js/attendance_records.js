// Global variables
let currentUser = JSON.parse(localStorage.getItem('currentUser'));
let attendanceData = JSON.parse(localStorage.getItem('attendance_' + currentUser.id)) || [];

// Load attendance data on page load
document.addEventListener('DOMContentLoaded', function() {
    displayAttendance();
    updateStats();
    populateMonthOptions();
    populateSubjectOptions();
});

// Function to display attendance records
function displayAttendance() {
    const attendanceList = document.getElementById('attendance-list');
    attendanceList.innerHTML = ''; // Clear previous records

    attendanceData.forEach((record, index) => {
        const div = document.createElement('tr');
        div.innerHTML = `
            <td>${new Date(record.date).toLocaleDateString()}</td>
            <td>${record.subject}</td>
            <td>${record.status}</td>
            <td>-</td>
            <td class="actions">
                <button onclick="editAttendance(${index})">Edit</button>
                <button onclick="deleteAttendance(${index})">Delete</button>
            </td>
        `;
        attendanceList.appendChild(div);
    });
}

// Function to update attendance stats
function updateStats() {
    const presentCount = attendanceData.filter(record => record.status === 'present').length;
    const absentCount = attendanceData.filter(record => record.status === 'absent').length;
    const lateCount = attendanceData.filter(record => record.status === 'late').length;

    document.getElementById('present-count').textContent = presentCount;
    document.getElementById('absent-count').textContent = absentCount;
    document.getElementById('late-count').textContent = lateCount;

    const total = presentCount + absentCount + lateCount;
    const attendanceRate = total > 0 ? ((presentCount / total) * 100).toFixed(2) : 0;
    document.getElementById('attendance-rate').textContent = `${attendanceRate}%`;
}

// Function to populate month options
function populateMonthOptions() {
    const monthSelect = document.getElementById('month');
    const months = ["All Months", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    months.forEach(month => {
        const option = document.createElement('option');
        option.value = month;
        option.textContent = month;
        monthSelect.appendChild(option);
    });
}

// Function to populate subject options
function populateSubjectOptions() {
    const subjectSelect = document.getElementById('subject');
    const subjects = Array.from(new Set(attendanceData.map(record => record.subject))); // Unique subjects
    subjects.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject;
        option.textContent = subject;
        subjectSelect.appendChild(option);
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

// Function to save attendance
function saveAttendance() {
    localStorage.setItem('attendance_' + currentUser.id, JSON.stringify(attendanceData));
} 
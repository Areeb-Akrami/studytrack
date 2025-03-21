let currentUser = null;
let attendanceData = [];

document.addEventListener('DOMContentLoaded', function() {
    checkAuth();
    loadData();
    setupFilters();
    displayAttendance();
});

function checkAuth() {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    currentUser = user;
}

function loadData() {
    attendanceData = JSON.parse(localStorage.getItem('attendance_' + currentUser.id)) || [];
    
    // Sort by date (newest first)
    attendanceData.sort((a, b) => new Date(b.date) - new Date(a.date));
}

function setupFilters() {
    document.getElementById('filter-month').addEventListener('change', filterAttendance);
}

function filterAttendance() {
    const monthFilter = document.getElementById('filter-month').value;
    let filteredData = [...attendanceData];

    if (monthFilter !== 'all') {
        filteredData = filteredData.filter(record => {
            const recordDate = new Date(record.date);
            return recordDate.getMonth() === parseInt(monthFilter);
        });
    }

    displayAttendance(filteredData);
}

function displayAttendance(data = attendanceData) {
    const tbody = document.getElementById('attendance-list');
    tbody.innerHTML = '';

    data.forEach((record) => {
        const tr = document.createElement('tr');
        const date = new Date(record.date).toLocaleDateString();

        tr.innerHTML = `
            <td>${date}</td>
            <td>${record.subject}</td>
            <td><span class="status-badge status-${record.status}">${record.status}</span></td>
            <td>
                <button class="btn-edit" onclick="editRecord(${record.id})">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn-delete" onclick="deleteRecord(${record.id})">
                    <i class="fas fa-trash"></i>
                </button>
            </td>
        `;

        tbody.appendChild(tr);
    });
}

function editRecord(id) {
    // Implement edit functionality
}

function deleteRecord(id) {
    // Implement delete functionality
}
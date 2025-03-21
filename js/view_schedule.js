// Global variables
let currentUser = JSON.parse(localStorage.getItem('currentUser'));
let classSchedule = JSON.parse(localStorage.getItem('class_schedule_' + currentUser.id)) || {};
let studySchedule = JSON.parse(localStorage.getItem('study_schedule_' + currentUser.id)) || {};

// Load schedules on page load
document.addEventListener('DOMContentLoaded', function() {
    updateScheduleDisplay();
});

// Function to update the schedule display
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

// Function to delete a schedule item
function deleteScheduleItem(type, day, index) {
    if (confirm('Are you sure you want to delete this schedule item?')) {
        const schedule = type === 'class' ? classSchedule : studySchedule;
        schedule[day].splice(index, 1);
        
        // Save to localStorage
        localStorage.setItem(`${type}_schedule_` + currentUser.id, JSON.stringify(schedule));
        
        // Update display
        updateScheduleDisplay();
    }
} 
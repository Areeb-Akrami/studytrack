document.getElementById('timetable-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const numSubjects = parseInt(document.getElementById('num-subjects').value);
    const studyTimes = document.getElementById('study-times').value.split(',').map(time => time.trim());
    
    const timetable = generateTimetable(numSubjects, studyTimes);
    displayTimetable(timetable);
});

function generateTimetable(numSubjects, studyTimes) {
    const subjects = Array.from({ length: numSubjects }, (_, i) => `Subject ${i + 1}`);
    const timetable = {};
    
    studyTimes.forEach(time => {
        timetable[time] = subjects.map(subject => ({
            time,
            subject: subject
        }));
    });
    
    return timetable;
}

function displayTimetable(timetable) {
    const timetableDiv = document.getElementById('timetable');
    timetableDiv.innerHTML = ''; // Clear previous timetable
    
    for (const time in timetable) {
        const timeDiv = document.createElement('div');
        timeDiv.className = 'time-slot';
        timeDiv.innerHTML = `<h4>${time}</h4>`;
        
        timetable[time].forEach(slot => {
            const slotDiv = document.createElement('div');
            slotDiv.className = 'slot';
            slotDiv.textContent = `${slot.time}: ${slot.subject}`;
            timeDiv.appendChild(slotDiv);
        });
        
        timetableDiv.appendChild(timeDiv);
    }
} 
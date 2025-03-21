// Global variables
let currentUser = JSON.parse(localStorage.getItem('currentUser'));
let subjects = JSON.parse(localStorage.getItem('subjects_' + currentUser.id)) || [];

// Load subjects on page load
document.addEventListener('DOMContentLoaded', function() {
    displaySubjects();
});

// Function to display subjects
function displaySubjects() {
    const container = document.getElementById('subjects-list');
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

// Function to add a subject
document.getElementById('add-subject-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const subject = {
        id: Date.now().toString(),
        name: document.getElementById('subject-name').value,
        code: document.getElementById('subject-code').value,
        totalClasses: parseInt(document.getElementById('total-classes').value),
        createdAt: new Date().toISOString()
    };

    subjects.push(subject);
    saveSubjects();
    this.reset();
    displaySubjects();
});

// Function to save subjects to localStorage
function saveSubjects() {
    localStorage.setItem('subjects_' + currentUser.id, JSON.stringify(subjects));
}

// Function to edit a subject
function editSubject(index) {
    const subject = subjects[index];
    document.getElementById('subject-name').value = subject.name;
    document.getElementById('subject-code').value = subject.code;
    document.getElementById('total-classes').value = subject.totalClasses;

    // Remove the subject from the list for editing
    subjects.splice(index, 1);
    saveSubjects(); // Save the updated subjects list
    displaySubjects(); // Refresh the displayed subjects
}

// Function to delete a subject
function deleteSubject(index) {
    if (confirm('Are you sure you want to delete this subject?')) {
        subjects.splice(index, 1); // Remove the subject from the array
        saveSubjects(); // Save the updated subjects list
        displaySubjects(); // Refresh the displayed subjects
    }
} 
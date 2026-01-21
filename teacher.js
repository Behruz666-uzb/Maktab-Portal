// O'qituvchi sahifasi funksiyalari
let currentQuestions = [];
let attendanceData = {};
let currentVideoLesson = null;

document.addEventListener('DOMContentLoaded', function () {
    const user = getCurrentUser();
    if (!user || user.role !== 'teacher') {
        window.location.href = 'index.html';
        return;
    }

    loadTeacherData();
    loadStudents();
    loadHomework();
    loadTests();
    loadVideoLessons();
    showTab('students');
});

function loadTeacherData() {
    const user = getCurrentUser();

    // Locked Subject for Grade Form
    const subjectName = getSubjectName(user.subject);
    const subjectTitle = subjectName.charAt(0).toUpperCase() + subjectName.slice(1);

    // Profil ma'lumotlari
    document.getElementById('profileName').value = user.name;
    document.getElementById('profileUsername').value = user.username;
    document.getElementById('profileClass').value = getClassName(user.class);
    document.getElementById('profileSubject').value = getSubjectName(user.subject);
    document.getElementById('profileCoins').value = user.coins;

    if (user.avatar) {
        document.getElementById('userAvatar').src = user.avatar;
        document.getElementById('profileAvatar').src = user.avatar;
    } else {
        document.getElementById('userAvatar').style.display = 'none';
        document.getElementById('profileAvatar').style.display = 'none';
    }

    calculateTeacherStats();
}

function calculateTeacherStats() {
    const user = getCurrentUser();
    const students = getClassStudents(user.class);

    document.getElementById('studentCount').textContent = students.length;

    // O'rtacha davomat
    let totalAttendance = 0;
    let attendanceCount = 0;
    students.forEach(student => {
        if (student.attendance && student.attendance.length > 0) {
            const presentDays = student.attendance.filter(a => a === 'present').length;
            totalAttendance += (presentDays / student.attendance.length) * 100;
            attendanceCount++;
        }
    });
    const avgAttendance = attendanceCount > 0 ? Math.round(totalAttendance / attendanceCount) : 0;
    document.getElementById('avgAttendance').textContent = avgAttendance + '%';

    // O'rtacha baho
    let totalGrade = 0;
    let gradeCount = 0;
    students.forEach(student => {
        if (student.grades) {
            Object.values(student.grades).forEach(grades => {
                grades.forEach(grade => {
                    const value = typeof grade === 'object' ? grade.value : grade;
                    totalGrade += value;
                    gradeCount++;
                });
            });
        }
    });
    const avgGrade = gradeCount > 0 ? (totalGrade / gradeCount).toFixed(1) : '0';
    document.getElementById('avgGrade').textContent = avgGrade;
}

function getClassStudents(classId) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    return users.filter(u => u.role === 'student' && u.class === classId);
}

function loadStudents() {
    const user = getCurrentUser();
    const students = getClassStudents(user.class);
    const container = document.getElementById('studentsList');
    container.innerHTML = '';

    if (students.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-center py-4">Hozircha o\'quvchilar mavjud emas</p>';
        return;
    }

    students.forEach(student => {
        // O'rtacha bahoni hisoblash
        let averageGrade = 0;
        let gradeCount = 0;
        if (student.grades) {
            Object.values(student.grades).forEach(grades => {
                grades.forEach(grade => {
                    const value = typeof grade === 'object' ? grade.value : grade;
                    averageGrade += value;
                    gradeCount++;
                });
            });
            averageGrade = gradeCount > 0 ? (averageGrade / gradeCount).toFixed(1) : 0;
        }

        // Davomatni hisoblash
        const attendanceRate = student.attendance && student.attendance.length > 0 ?
            Math.round((student.attendance.filter(a => a === 'present').length / student.attendance.length) * 100) : 0;

        const studentCard = `
            <div class="flex items-center justify-between p-4 bg-card border border-themed rounded-lg shadow-sm">
                <div class="flex items-center space-x-4">
                    ${student.avatar ?
                `<img src="${student.avatar}" class="w-12 h-12 rounded-full">` :
                '<div class="w-12 h-12 rounded-full bg-themed-hover flex items-center justify-center">👤</div>'
            }
                    <div>
                        <h4 class="font-semibold">${student.name}</h4>
                        <p class="text-sm text-gray-500 dark:text-gray-400">Login: ${student.username}</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="font-semibold">O'rtacha: ${averageGrade}</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">Davomat: ${attendanceRate}%</p>
                </div>
            </div>
        `;

        container.innerHTML += studentCard;
    });

    // Baholash uchun o'quvchilar ro'yxatini yangilash
    const gradeStudentSelect = document.getElementById('gradeStudent');
    gradeStudentSelect.innerHTML = '';
    students.forEach(student => {
        const option = document.createElement('option');
        option.value = student.id;
        option.textContent = student.name;
        gradeStudentSelect.appendChild(option);
    });
}

function loadAttendance() {
    const user = getCurrentUser();
    const students = getClassStudents(user.class);
    const container = document.getElementById('attendanceList');
    container.innerHTML = '';

    // Bugungi sana
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('attendanceDate').value = today;

    if (students.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-center py-4">Hozircha o\'quvchilar mavjud emas</p>';
        return;
    }

    students.forEach(student => {
        // O'quvchining bugungi davomat holatini tekshirish
        const todayAttendance = student.attendance && student.attendance.length > 0 ?
            student.attendance[student.attendance.length - 1] : null;

        const attendanceCard = `
            <div class="flex items-center justify-between p-4 bg-card border border-themed rounded-lg shadow-sm">
                <div class="flex items-center space-x-4">
                    ${student.avatar ?
                `<img src="${student.avatar}" class="w-10 h-10 rounded-full">` :
                '<div class="w-10 h-10 rounded-full bg-themed-hover flex items-center justify-center">👤</div>'
            }
                    <span class="font-medium">${student.name}</span>
                </div>
                <div class="flex space-x-2">
                    <button onclick="setAttendance(${student.id}, 'present')" 
                            class="px-4 py-2 rounded-lg transition-colors ${todayAttendance === 'present' ? 'attendance-present text-white' : 'bg-themed-hover hover:bg-green-600 text-gray-500 dark:text-gray-400'
            }">
                        ✅
                    </button>
                    <button onclick="setAttendance(${student.id}, 'absent')" 
                            class="px-4 py-2 rounded-lg transition-colors ${todayAttendance === 'absent' ? 'attendance-absent text-white' : 'bg-themed-hover hover:bg-red-600 text-gray-500 dark:text-gray-400'
            }">
                        ❌
                    </button>
                    <button onclick="setAttendance(${student.id}, 'late')" 
                            class="px-4 py-2 rounded-lg transition-colors ${todayAttendance === 'late' ? 'attendance-late text-white' : 'bg-themed-hover hover:bg-yellow-600 text-gray-500 dark:text-gray-400'
            }">
                        ⏰
                    </button>
                </div>
            </div>
        `;

        container.innerHTML += attendanceCard;

        // Agar oldin belgilangan bo'lsa, attendanceData ga qo'shish
        if (todayAttendance) {
            attendanceData[student.id] = todayAttendance;
        }
    });
}

function setAttendance(studentId, status) {
    attendanceData[studentId] = status;

    // Tugma ranglarini yangilash
    const buttons = event.target.parentElement.querySelectorAll('button');
    buttons.forEach(btn => {
        btn.classList.remove('attendance-present', 'attendance-absent', 'attendance-late', 'text-white');
        btn.classList.add('bg-gray-600', 'hover:bg-gray-700');
    });

    // Tanlangan tugmani belgilash
    event.target.classList.remove('bg-gray-600');
    if (status === 'present') {
        event.target.classList.add('attendance-present', 'text-white');
    } else if (status === 'absent') {
        event.target.classList.add('attendance-absent', 'text-white');
    } else {
        event.target.classList.add('attendance-late', 'text-white');
    }
}

function saveAttendance() {
    const date = document.getElementById('attendanceDate').value;
    if (!date) {
        showNotification('Sana tanlang!', 'error');
        return;
    }

    if (Object.keys(attendanceData).length === 0) {
        showNotification('Kamida bitta o\'quvchi uchun davomat belgilang!', 'warning');
        return;
    }

    const users = JSON.parse(localStorage.getItem('users')) || [];
    let updatedCount = 0;

    Object.entries(attendanceData).forEach(([studentId, status]) => {
        const user = users.find(u => u.id === parseInt(studentId));
        if (user) {
            if (!user.attendance) user.attendance = [];

            // Bugungi kun uchun davomatni yangilash yoki qo'shish
            const today = new Date().toISOString().split('T')[0];
            const attendanceIndex = user.attendance.findIndex(a => a.date === today);

            if (attendanceIndex !== -1) {
                user.attendance[attendanceIndex].status = status;
            } else {
                user.attendance.push({
                    date: today,
                    status: status
                });
            }
            updatedCount++;
        }
    });

    localStorage.setItem('users', JSON.stringify(users));
    showNotification(`${updatedCount} ta o'quvchi uchun davomat saqlandi!`, 'success');
    attendanceData = {};
}

// ----------------------------------------------------------------------
// GRADING SYSTEM LOGIC (Card-Based)
// ----------------------------------------------------------------------

function loadGradingData() {
    const user = getCurrentUser();

    // 1. Load Classes for Selector
    loadClassesForGrading(user.class);

    // 2. Load Journal filters
    loadJournalFilters(user.class);

    // 3. Initial Journal Load
    loadJournal();
}

function loadClassesForGrading(mainClass) {
    const classSelect = document.getElementById('gradeClassSelector');
    const filterClassSelect = document.getElementById('journalFilterClass');

    const predefinedClasses = ['5-A', '5-B', '6-A', '6-B', '7-A', '8-A', '9-A', '10-A', '11-A'];
    const teacherClassName = getClassName(mainClass);
    if (!predefinedClasses.includes(teacherClassName)) {
        predefinedClasses.unshift(teacherClassName);
    }

    // Populate Grid Class Selector
    classSelect.innerHTML = '<option value="">Sinfni tanlang...</option>';
    predefinedClasses.forEach(cls => {
        classSelect.innerHTML += `<option value="${cls}">${cls}</option>`;
    });
}

function loadJournalFilters(mainClass) {
    const filterClassSelect = document.getElementById('journalFilterClass');
    const predefinedClasses = ['5-A', '5-B', '6-A', '6-B', '7-A', '8-A', '9-A', '10-A', '11-A'];
    const teacherClassName = getClassName(mainClass);
    if (!predefinedClasses.includes(teacherClassName)) {
        predefinedClasses.unshift(teacherClassName);
    }

    filterClassSelect.innerHTML = '<option value="all">Barcha Sinflar</option>';
    predefinedClasses.forEach(cls => {
        filterClassSelect.innerHTML += `<option value="${cls}">${cls}</option>`;
    });
}

function loadStudentCards() {
    const selectedClass = document.getElementById('gradeClassSelector').value;
    const container = document.getElementById('studentCardsGrid');
    const countDisplay = document.getElementById('studentCountDisplay');

    if (!selectedClass) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12 text-gray-400">
                <i class="fas fa-users text-5xl mb-4 opacity-50"></i>
                <p class="text-lg">Sinfni tanlang</p>
            </div>
        `;
        countDisplay.textContent = '0';
        return;
    }

    const users = JSON.parse(localStorage.getItem('users')) || [];
    const students = users.filter(u => u.role === 'student' && getClassName(u.class) === selectedClass);
    const teacherSubject = getCurrentUser().subject;

    countDisplay.textContent = students.length;

    if (students.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12 text-gray-400">
                <i class="fas fa-user-slash text-5xl mb-4 opacity-50"></i>
                <p class="text-lg">Bu sinfda o'quvchilar topilmadi</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';

    students.forEach(student => {
        // Calculate average for teacher's subject
        let average = 0;
        let gradeCount = 0;

        if (student.grades && student.grades[teacherSubject]) {
            student.grades[teacherSubject].forEach(grade => {
                const value = typeof grade === 'object' ? grade.value : grade;
                average += value;
                gradeCount++;
            });
            average = gradeCount > 0 ? (average / gradeCount).toFixed(1) : 0;
        }

        let avgColor = 'text-gray-400';
        if (average >= 4.5) avgColor = 'text-green-500';
        else if (average >= 3.5) avgColor = 'text-blue-500';
        else if (average >= 2.5) avgColor = 'text-yellow-500';
        else if (average > 0) avgColor = 'text-red-500';

        const card = `
            <div class="bg-white dark:bg-[#1a2332] border border-gray-200 dark:border-blue-900/30 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all transform hover:scale-105 group">
                <div class="flex flex-col items-center text-center space-y-4">
                    <!-- Avatar -->
                    <div class="relative">
                        ${student.avatar ?
                `<img src="${student.avatar}" class="w-20 h-20 rounded-full object-cover border-4 border-blue-500/20">` :
                `<div class="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                                ${student.name.charAt(0)}
                            </div>`
            }
                        <div class="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                            ${gradeCount}
                        </div>
                    </div>
                    
                    <!-- Name -->
                    <div>
                        <h3 class="text-lg font-bold text-gray-800 dark:text-white">${student.name}</h3>
                        <p class="text-sm text-gray-500 dark:text-gray-400">ID: ${student.id}</p>
                    </div>
                    
                    <!-- Average Grade -->
                    <div class="w-full py-4 bg-gray-50 dark:bg-[#0f172a] rounded-xl">
                        <div class="text-xs text-gray-500 dark:text-gray-400 mb-1">O'rtacha baho</div>
                        <div class="text-3xl font-bold ${avgColor}">${average || '-'}</div>
                    </div>
                    
                    <!-- Grade Button -->
                    <button onclick="openGradeModal(${student.id}, '${student.name}')"
                        class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-blue-500/30 transition-all transform group-hover:scale-105">
                        <i class="fas fa-star mr-2"></i>Baho Qo'yish
                    </button>
                </div>
            </div>
        `;
        container.innerHTML += card;
    });
}

function switchGradingView(view) {
    const gridView = document.getElementById('gridView');
    const journalView = document.getElementById('journalView');
    const gridBtn = document.getElementById('gridViewBtn');
    const journalBtn = document.getElementById('journalViewBtn');

    if (view === 'grid') {
        gridView.classList.remove('hidden');
        journalView.classList.add('hidden');

        gridBtn.classList.add('bg-blue-600', 'text-white');
        gridBtn.classList.remove('text-gray-600', 'dark:text-gray-400', 'hover:bg-gray-100', 'dark:hover:bg-[#0f172a]');

        journalBtn.classList.remove('bg-blue-600', 'text-white');
        journalBtn.classList.add('text-gray-600', 'dark:text-gray-400', 'hover:bg-gray-100', 'dark:hover:bg-[#0f172a]');
    } else {
        gridView.classList.add('hidden');
        journalView.classList.remove('hidden');

        journalBtn.classList.add('bg-blue-600', 'text-white');
        journalBtn.classList.remove('text-gray-600', 'dark:text-gray-400', 'hover:bg-gray-100', 'dark:hover:bg-[#0f172a]');

        gridBtn.classList.remove('bg-blue-600', 'text-white');
        gridBtn.classList.add('text-gray-600', 'dark:text-gray-400', 'hover:bg-gray-100', 'dark:hover:bg-[#0f172a]');

        loadJournal();
    }
}

function openGradeModal(studentId, studentName) {
    const modal = document.getElementById('gradeModal');
    const modalContent = document.getElementById('gradeModalContent');

    document.getElementById('modalStudentId').value = studentId;
    document.getElementById('modalStudentName').textContent = studentName;
    document.getElementById('modalGradeDate').valueAsDate = new Date();
    document.getElementById('modalSelectedGrade').value = '';
    document.getElementById('modalGradeComment').value = '';

    // Reset grade buttons
    document.querySelectorAll('.modal-grade-btn').forEach(btn => {
        btn.classList.remove('ring-4', 'ring-blue-500', 'bg-blue-50', 'dark:bg-blue-900/40');
    });

    modal.classList.remove('hidden');
    setTimeout(() => {
        modalContent.classList.remove('scale-95', 'opacity-0');
        modalContent.classList.add('scale-100', 'opacity-100');
    }, 10);
}

function closeGradeModal() {
    const modal = document.getElementById('gradeModal');
    const modalContent = document.getElementById('gradeModalContent');

    modalContent.classList.add('scale-95', 'opacity-0');
    modalContent.classList.remove('scale-100', 'opacity-100');

    setTimeout(() => {
        modal.classList.add('hidden');
    }, 200);
}

function selectModalGrade(value) {
    document.getElementById('modalSelectedGrade').value = value;

    document.querySelectorAll('.modal-grade-btn').forEach(btn => {
        const btnValue = parseInt(btn.dataset.value);

        if (btnValue === value) {
            btn.classList.add('ring-4', 'ring-blue-500', 'bg-blue-50', 'dark:bg-blue-900/40');
        } else {
            btn.classList.remove('ring-4', 'ring-blue-500', 'bg-blue-50', 'dark:bg-blue-900/40');
        }
    });
}

function saveGradeFromModal() {
    const studentId = parseInt(document.getElementById('modalStudentId').value);
    const dateVal = document.getElementById('modalGradeDate').value;
    const gradeValue = parseInt(document.getElementById('modalSelectedGrade').value);
    const comment = document.getElementById('modalGradeComment').value;

    const user = getCurrentUser();
    const subject = user.subject;

    if (!gradeValue) {
        showNotification('Bahoni tanlang!', 'error');
        return;
    }
    if (!dateVal) {
        showNotification('Sanani tanlang!', 'error');
        return;
    }

    const users = JSON.parse(localStorage.getItem('users')) || [];
    const student = users.find(u => u.id === studentId);

    if (student) {
        if (!student.grades) student.grades = {};
        if (!student.grades[subject]) student.grades[subject] = [];

        const newGrade = {
            value: gradeValue,
            date: new Date(dateVal).toISOString(),
            topic: comment || '',
            teacherId: user.id,
            teacherName: user.name
        };

        student.grades[subject].push(newGrade);
        localStorage.setItem('users', JSON.stringify(users));

        showNotification('Baho muvaffaqiyatli saqlandi!', 'success');
        closeGradeModal();

        // Refresh both views
        loadStudentCards();
        loadJournal();
        calculateTeacherStats();
    }
}

function selectGrade(value) {
    // Input qiymatini yangilash
    document.getElementById('selectedGradeInput').value = value;

    // Button stillarini yangilash
    document.querySelectorAll('.grade-btn').forEach(btn => {
        const btnValue = parseInt(btn.dataset.value);
        const ring = btn.querySelector('.selection-ring');

        if (btnValue === value) {
            // Selected state
            ring.classList.remove('opacity-0', 'scale-95');
            ring.classList.add('opacity-100', 'scale-100');

            // Toggle active/inactive classes
            btn.classList.add('ring-2', 'ring-blue-500', 'bg-blue-50', 'dark:bg-blue-900/40');
            btn.classList.remove('bg-gray-50', 'dark:bg-[#0f172a]');
        } else {
            // Unselected state
            ring.classList.add('opacity-0', 'scale-95');
            ring.classList.remove('opacity-100', 'scale-100');

            // Toggle active/inactive classes
            btn.classList.remove('ring-2', 'ring-blue-500', 'bg-blue-50', 'dark:bg-blue-900/40');
            btn.classList.add('bg-gray-50', 'dark:bg-[#0f172a]');
        }
    });
}

function addGrade() {
    const classVal = document.getElementById('gradeClass').value;
    const studentId = parseInt(document.getElementById('gradeStudent').value);
    const dateVal = document.getElementById('gradeDate').value; // YYYY-MM-DD
    const gradeValue = parseInt(document.getElementById('selectedGradeInput').value);
    const comment = document.getElementById('gradeComment').value;

    const user = getCurrentUser(); // Teacher
    const subject = user.subject; // Teacher's subject key

    if (!classVal) {
        showNotification('Sinfni tanlang!', 'error');
        return;
    }
    if (!studentId) {
        showNotification('O\'quvchi tanlang!', 'error');
        return;
    }
    if (!gradeValue) {
        showNotification('Bahoni tanlang!', 'error');
        return;
    }
    if (!dateVal) {
        showNotification('Sanani tanlang!', 'error');
        return;
    }

    const users = JSON.parse(localStorage.getItem('users')) || [];
    const student = users.find(u => u.id === studentId);

    if (student) {
        if (!student.grades) student.grades = {};
        if (!student.grades[subject]) student.grades[subject] = [];

        // Yangi baho obyekti
        const newGrade = {
            value: gradeValue,
            date: new Date(dateVal).toISOString(), // Utilize the selected date
            topic: comment || '',
            teacherId: user.id,
            teacherName: user.name
        };

        student.grades[subject].push(newGrade);

        localStorage.setItem('users', JSON.stringify(users));
        showNotification('Baho muvaffaqiyatli saqlandi!', 'success');

        // Reset Form
        document.getElementById('selectedGradeInput').value = '';
        document.getElementById('gradeComment').value = '';
        selectGrade(0); // Reset UI selection

        // Refresh Journal
        loadJournal();

        // Update stats if needed
        calculateTeacherStats();
    }
}

function loadJournal() {
    const filterClass = document.getElementById('journalFilterClass').value;
    const filterDate = document.getElementById('journalFilterDate').value; // YYYY-MM-DD

    const user = getCurrentUser();
    const mySubject = user.subject;

    const tableBody = document.getElementById('journalTableBody');
    tableBody.innerHTML = '';

    const users = JSON.parse(localStorage.getItem('users')) || [];
    let allGrades = [];

    // 1. Collect all grades for ONLY this teacher's subject
    users.forEach(student => {
        if (student.role === 'student' && student.grades && student.grades[mySubject]) {
            // Apply Class Filter if not 'all'
            const studentClass = getClassName(student.class);
            if (filterClass !== 'all' && studentClass !== filterClass) return;

            student.grades[mySubject].forEach(grade => {
                // Handle legacy grade format (number) vs new object
                const gradeObj = typeof grade === 'object' ? grade : { value: grade, date: new Date().toISOString() };

                // Apply Date Filter if selected
                if (filterDate) {
                    const gradeDate = new Date(gradeObj.date).toISOString().split('T')[0];
                    if (gradeDate !== filterDate) return;
                }

                allGrades.push({
                    studentName: student.name,
                    studentClass: studentClass,
                    value: gradeObj.value,
                    date: gradeObj.date,
                    topic: gradeObj.topic || '-'
                });
            });
        }
    });

    // 2. Sort by Date Descending
    allGrades.sort((a, b) => new Date(b.date) - new Date(a.date));

    // 3. Render
    if (allGrades.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-8 text-center text-gray-400">
                    Ma'lumot topilmadi
                </td>
            </tr>
        `;
        return;
    }

    allGrades.forEach(item => {
        const dateObj = new Date(item.date);
        const dateStr = dateObj.toLocaleDateString();
        const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        let badgeColor = '';
        if (item.value == 5) badgeColor = 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
        else if (item.value == 4) badgeColor = 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
        else if (item.value == 3) badgeColor = 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
        else badgeColor = 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';

        const row = `
            <tr class="bg-white dark:bg-[#1a2332] border-b dark:border-blue-900/30 hover:bg-gray-50 dark:hover:bg-[#1e293b] transition-colors">
                <td class="px-6 py-4 whitespace-nowrap text-gray-500 dark:text-gray-400">
                    <div class="text-sm font-medium text-gray-900 dark:text-white">${dateStr}</div>
                    <div class="text-xs text-gray-500">${timeStr}</div>
                </td>
                <td class="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                    ${item.studentName}
                </td>
                <td class="px-6 py-4 text-gray-500 dark:text-gray-400">
                    ${item.studentClass}
                </td>
                <td class="px-6 py-4 text-center">
                    <span class="${badgeColor} text-xs font-bold px-2.5 py-0.5 rounded border border-opacity-20">
                        ${item.value}
                    </span>
                </td>
                <td class="px-6 py-4 text-gray-500 dark:text-gray-400 italic text-sm truncate max-w-xs">
                    ${item.topic}
                </td>
            </tr>
        `;
        tableBody.innerHTML += row;
    });
}

function filterJournal() {
    loadJournal();
}

function loadHomework() {
    const homework = JSON.parse(localStorage.getItem('homework')) || [];
    const classHomework = homework.filter(h => h.class === user.class && h.createdBy === user.id);
    const container = document.getElementById('homeworkList');
    container.innerHTML = '';

    if (classHomework.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-center py-4">Hozircha uy vazifalari mavjud emas</p>';
        return;
    }

    classHomework.forEach(hw => {
        const homeworkCard = `
            <div class="bg-card border border-themed rounded-lg p-6 shadow-sm card-hover">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h4 class="text-lg font-semibold">${hw.title}</h4>
                        <p class="text-sm text-gray-500 dark:text-gray-400">${getSubjectName(hw.subject)}</p>
                    </div>
                    <span class="bg-blue-600 px-3 py-1 rounded-full text-sm text-white">
                        ${new Date(hw.deadline).toLocaleDateString()}
                    </span>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-300 mb-4">${hw.description}</p>
                <div class="flex justify-between items-center">
                    <span class="text-xs text-gray-500 dark:text-gray-400">
                        ${hw.completed || 0}/${hw.totalStudents || 0} ta bajargan
                    </span>
                    <button onclick="deleteHomework(${hw.id})" 
                            class="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm transition-colors text-white">
                        O'chirish
                    </button>
                </div>
            </div>
        `;

        container.innerHTML += homeworkCard;
    });
}

function loadTests() {
    const tests = JSON.parse(localStorage.getItem('tests')) || [];
    const user = getCurrentUser();
    const teacherTests = tests.filter(t => t.createdBy === user.id);
    const container = document.getElementById('testsList');
    container.innerHTML = '';

    if (teacherTests.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-center py-4">Hozircha testlar mavjud emas</p>';
        return;
    }

    teacherTests.forEach(test => {
        const testCard = `
            <div class="bg-card border border-themed rounded-lg p-6 shadow-sm card-hover">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h4 class="text-lg font-semibold">${test.title}</h4>
                        <p class="text-sm text-gray-500 dark:text-gray-400">${getSubjectName(test.subject)}</p>
                    </div>
                    <span class="bg-green-600 px-3 py-1 rounded-full text-sm text-white">
                        ${test.questions.length} savol
                    </span>
                </div>
                <div class="flex justify-between items-center">
                    <span class="text-xs text-gray-500 dark:text-gray-400">
                        Maksimal coin: ${test.questions.reduce((sum, q) => sum + q.coins, 0)}
                    </span>
                    <div class="flex space-x-2">
                        <button onclick="editTest(${test.id})" 
                                class="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm transition-colors text-white">
                            Tahrirlash
                        </button>
                        <button onclick="deleteTest(${test.id})" 
                                class="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm transition-colors text-white">
                            O'chirish
                        </button>
                    </div>
                </div>
            </div>
        `;

        container.innerHTML += testCard;
    });
}
function getSubjectName(subjectCode) {
    const subjects = {
        'algebra': 'Algebra',
        'geometry': 'Geometriya',
        'physics': 'Fizika',
        'chemistry': 'Kimyo',
        'biology': 'Biologiya',
        'history': 'Tarix'
    };
    return subjects[subjectCode] || subjectCode;
}
function loadVideoLessons() {
    const videoLessons = JSON.parse(localStorage.getItem('videoLessons')) || [];
    const user = getCurrentUser();
    const activeLesson = videoLessons.find(v => v.teacherId === user.id && v.isActive);

    if (activeLesson) {
        currentVideoLesson = activeLesson;
        document.getElementById('meetLink').value = activeLesson.link;
        document.getElementById('currentLessonInfo').classList.remove('hidden');
        document.getElementById('lessonTitle').textContent = activeLesson.title;
        document.getElementById('lessonSubject').textContent = getSubjectName(activeLesson.subject);
    } else {
        document.getElementById('currentLessonInfo').classList.add('hidden');
    }
}

function startVideoLesson() {
    const user = getCurrentUser();
    const title = document.getElementById('lessonTitleInput').value;
    const subject = document.getElementById('lessonSubject').value;

    if (!title) {
        showNotification('Dars sarlavhasini kiriting!', 'error');
        return;
    }

    const videoLessons = JSON.parse(localStorage.getItem('videoLessons')) || [];

    // Avvalgi aktiv darslarni yopish
    videoLessons.forEach(lesson => {
        if (lesson.teacherId === user.id) {
            lesson.isActive = false;
        }
    });

    // Yangi video dars yaratish
    const lessonId = Date.now();
    const meetLink = `https://meet.jit.si/Maktab-${user.class}-${lessonId}`;

    const newLesson = {
        id: lessonId,
        title: title,
        subject: subject,
        class: user.class,
        teacherId: user.id,
        teacherName: user.name,
        link: meetLink,
        isActive: true,
        startTime: new Date().toISOString(),
        participants: []
    };

    videoLessons.push(newLesson);
    localStorage.setItem('videoLessons', JSON.stringify(videoLessons));

    currentVideoLesson = newLesson;
    document.getElementById('meetLink').value = meetLink;
    document.getElementById('currentLessonInfo').classList.remove('hidden');
    document.getElementById('lessonTitle').textContent = title;
    document.getElementById('lessonSubject').textContent = getSubjectName(subject);

    showNotification('Video dars muvaffaqiyatli boshlandi!', 'success');
}

function stopVideoLesson() {
    if (!currentVideoLesson) return;

    const videoLessons = JSON.parse(localStorage.getItem('videoLessons')) || [];
    const lessonIndex = videoLessons.findIndex(v => v.id === currentVideoLesson.id);

    if (lessonIndex !== -1) {
        videoLessons[lessonIndex].isActive = false;
        videoLessons[lessonIndex].endTime = new Date().toISOString();
        localStorage.setItem('videoLessons', JSON.stringify(videoLessons));
    }

    currentVideoLesson = null;
    document.getElementById('currentLessonInfo').classList.add('hidden');
    document.getElementById('lessonTitleInput').value = '';

    showNotification('Video dars yakunlandi!', 'success');
}

function copyMeetLink() {
    const meetLink = document.getElementById('meetLink');
    meetLink.select();
    document.execCommand('copy');
    showNotification('Link nusxalandi! O\'quvchilar bilan ulashing', 'success');
}

// Modal funksiyalari
document.getElementById('addStudentForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const name = document.getElementById('newStudentName').value;
    const username = document.getElementById('newStudentUsername').value;
    const password = document.getElementById('newStudentPassword').value;
    const user = getCurrentUser();

    // Login bandligini tekshirish
    const users = JSON.parse(localStorage.getItem('users')) || [];
    if (users.find(u => u.username === username)) {
        showNotification('Bu login band!', 'error');
        return;
    }

    // Yangi o'quvchi yaratish
    const newStudent = {
        id: Date.now(),
        name,
        username,
        password,
        role: 'student',
        coins: 100,
        class: user.class,
        avatar: null,
        grades: {},
        attendance: [],
        createdAt: new Date().toISOString()
    };

    users.push(newStudent);
    localStorage.setItem('users', JSON.stringify(users));

    showNotification('O\'quvchi muvaffaqiyatli qo\'shildi!', 'success');
    closeModal('addStudentModal');
    loadStudents();
    this.reset();
});

document.getElementById('addHomeworkForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const title = document.getElementById('homeworkTitle').value;
    const subject = document.getElementById('homeworkSubject').value;
    const description = document.getElementById('homeworkDescription').value;
    const deadline = document.getElementById('homeworkDeadline').value;
    const user = getCurrentUser();

    const homework = JSON.parse(localStorage.getItem('homework')) || [];

    const newHomework = {
        id: Date.now(),
        title,
        subject,
        description,
        deadline,
        class: user.class,
        createdBy: user.id,
        createdAt: new Date().toISOString(),
        completed: 0,
        totalStudents: getClassStudents(user.class).length
    };

    homework.push(newHomework);
    localStorage.setItem('homework', JSON.stringify(homework));

    showNotification('Uy vazifasi muvaffaqiyatli yaratildi!', 'success');
    closeModal('addHomeworkModal');
    loadHomework();
    this.reset();
});

function addQuestion() {
    const questionId = Date.now();
    const questionHtml = `
        <div class="bg-secondary-themed border border-themed rounded-lg p-4 question-item" data-id="${questionId}">
            <div class="flex justify-between items-center mb-4">
                <h4 class="font-semibold">Yangi Savol</h4>
                <button type="button" onclick="removeQuestion(${questionId})" 
                        class="bg-red-600 hover:bg-red-700 px-2 py-1 rounded text-sm transition-colors text-white">
                    ✕
                </button>
            </div>
            <div class="space-y-3">
                <div>
                    <label class="block text-sm text-gray-500 dark:text-gray-300 mb-2">Savol Matni</label>
                    <input type="text" 
                           class="w-full bg-themed-hover border border-themed rounded-lg px-3 py-2 text-main question-text"
                           placeholder="Savolni kiriting" required>
                </div>
                <div>
                    <label class="block text-sm text-gray-500 dark:text-gray-300 mb-2">Variantlar</label>
                    <div class="space-y-2 options-container">
                        <div class="flex items-center space-x-2">
                            <input type="radio" name="correct-${questionId}" value="0" class="correct-answer">
                            <input type="text" 
                                   class="flex-1 bg-themed-hover border border-themed rounded-lg px-3 py-2 text-main option-text"
                                   placeholder="Variant A" required>
                        </div>
                        <div class="flex items-center space-x-2">
                            <input type="radio" name="correct-${questionId}" value="1" class="correct-answer">
                            <input type="text" 
                                   class="flex-1 bg-themed-hover border border-themed rounded-lg px-3 py-2 text-main option-text"
                                   placeholder="Variant B" required>
                        </div>
                        <div class="flex items-center space-x-2">
                            <input type="radio" name="correct-${questionId}" value="2" class="correct-answer">
                            <input type="text" 
                                   class="flex-1 bg-themed-hover border border-themed rounded-lg px-3 py-2 text-main option-text"
                                   placeholder="Variant C" required>
                        </div>
                        <div class="flex items-center space-x-2">
                            <input type="radio" name="correct-${questionId}" value="3" class="correct-answer">
                            <input type="text" 
                                   class="flex-1 bg-themed-hover border border-themed rounded-lg px-3 py-2 text-main option-text"
                                   placeholder="Variant D" required>
                        </div>
                    </div>
                </div>
                <div>
                    <label class="block text-sm text-gray-500 dark:text-gray-300 mb-2">Coin (5-20)</label>
                    <input type="number" min="5" max="20" value="10"
                           class="w-24 bg-themed-hover border border-themed rounded-lg px-3 py-2 text-main question-coins">
                </div>
            </div>
        </div>
    `;


    document.getElementById('testQuestionsContainer').insertAdjacentHTML('beforeend', questionHtml);
}

function removeQuestion(questionId) {
    const questionElement = document.querySelector(`.question-item[data-id="${questionId}"]`);
    if (questionElement) {
        questionElement.remove();
    }
}

document.getElementById('createTestForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const title = document.getElementById('testTitle').value;
    const subject = document.getElementById('testSubject').value;
    const user = getCurrentUser();

    // Savollarni yig'ish
    const questions = [];
    const questionElements = document.querySelectorAll('.question-item');

    let hasErrors = false;

    questionElements.forEach((element, index) => {
        const questionText = element.querySelector('.question-text').value;
        const options = Array.from(element.querySelectorAll('.option-text')).map(input => input.value);
        const correctAnswer = element.querySelector('.correct-answer:checked');
        const coins = parseInt(element.querySelector('.question-coins').value) || 10;

        if (!questionText || options.some(opt => !opt) || !correctAnswer) {
            hasErrors = true;
            showNotification(`${index + 1}-savolda xatolik! Barcha maydonlarni to'ldiring.`, 'error');
            return;
        }

        questions.push({
            question: questionText,
            options: options,
            correct: parseInt(correctAnswer.value),
            coins: coins
        });
    });

    if (hasErrors || questions.length === 0) {
        if (questions.length === 0) {
            showNotification('Kamida bitta savol qo\'shing!', 'error');
        }
        return;
    }

    // Testni saqlash
    const tests = JSON.parse(localStorage.getItem('tests')) || [];
    const newTest = {
        id: Date.now(),
        title,
        subject,
        questions,
        createdBy: user.id,
        createdAt: new Date().toISOString()
    };

    tests.push(newTest);
    localStorage.setItem('tests', JSON.stringify(tests));

    showNotification('Test muvaffaqiyatli yaratildi!', 'success');
    closeModal('createTestModal');
    loadTests();
    this.reset();

    // Savollarni tozalash
    document.getElementById('testQuestionsContainer').innerHTML = '';
});

function deleteHomework(homeworkId) {
    if (!confirm('Uy vazifasini o\'chirishni xohlaysizmi?')) return;

    const homework = JSON.parse(localStorage.getItem('homework')) || [];
    const updatedHomework = homework.filter(h => h.id !== homeworkId);
    localStorage.setItem('homework', JSON.stringify(updatedHomework));

    showNotification('Uy vazifasi o\'chirildi!', 'success');
    loadHomework();
}

function deleteTest(testId) {
    if (!confirm('Testni o\'chirishni xohlaysizmi?')) return;

    const tests = JSON.parse(localStorage.getItem('tests')) || [];
    const updatedTests = tests.filter(t => t.id !== testId);
    localStorage.setItem('tests', JSON.stringify(updatedTests));

    showNotification('Test o\'chirildi!', 'success');
    loadTests();
}

function updateProfile() {
    const user = getCurrentUser();
    const newName = document.getElementById('profileName').value;

    if (newName && newName !== user.name) {
        user.name = newName;
        updateCurrentUser(user);
        showNotification('Profil muvaffaqiyatli yangilandi!', 'success');
        loadTeacherData();
    }
}

// Avatar yuklash
document.getElementById('avatarUpload').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const user = getCurrentUser();
            user.avatar = e.target.result;
            updateCurrentUser(user);
            loadTeacherData();
            showNotification('Profil rasmi yangilandi!', 'success');
        };
        reader.readAsDataURL(file);
    }
});

// Tab funksiyalari
function showTab(tabName) {
    // Barcha tab tugmalaridan aktivlikni olib tashlash
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('bg-green-600', 'text-white');
        btn.classList.add('text-gray-500', 'dark:text-gray-400', 'hover:text-main');
    });

    // Tanlangan tab tugmasiga aktivlik qo'shish
    let targetBtn = null;
    if (window.event && window.event.target && window.event.target.classList.contains('tab-btn')) {
        targetBtn = window.event.target;
    } else {
        // Find button by matching the onclick call (simple heuristic)
        targetBtn = Array.from(document.querySelectorAll('.tab-btn')).find(btn =>
            btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(`'${tabName}'`)
        );
    }

    if (targetBtn) {
        targetBtn.classList.add('bg-green-600', 'text-white');
        targetBtn.classList.remove('text-gray-500', 'dark:text-gray-400', 'hover:text-main');
    }


    // Barcha tab kontentlarini yashirish
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });

    // Tanlangan tab kontentini ko'rsatish
    document.getElementById(tabName).classList.remove('hidden');

    // Ma'lumotlarni yangilash
    if (tabName === 'attendance') {
        loadAttendance();
    } else if (tabName === 'grades') {
        loadGradingData();
    } else if (tabName === 'videoLesson') {
        loadVideoLessons();
    }
}

function joinVideoLesson() {
    const user = getCurrentUser();

    // Check if there's an active video lesson
    if (currentVideoLesson && currentVideoLesson.isActive) {
        // Open the existing lesson's meeting link
        window.open(currentVideoLesson.link, '_blank');
        showNotification('Video darsga qo\'shildingiz!', 'success');
    } else {
        // No active lesson; prompt to start a new one
        const title = document.getElementById('lessonTitleInput').value;
        const subject = document.getElementById('lessonSubject').value;

        if (!title) {
            showNotification('Dars sarlavhasini kiriting!', 'error');
            return;
        }

        // Start a new video lesson
        startVideoLesson();

        // Open the newly created lesson's meeting link
        if (currentVideoLesson) {
            window.open(currentVideoLesson.link, '_blank');
            showNotification('Yangi video dars boshlandi va qo\'shildingiz!', 'success');
        } else {
            showNotification('Video darsni boshlashda xatolik yuz berdi!', 'error');
        }
    }
}

// Schedule Functions for Teacher
function openSchedule(event) {
    if (event) {
        event.stopPropagation();
    }
    loadWeeklySchedule();
    openModal('scheduleModal');
}

function loadWeeklySchedule() {
    const container = document.getElementById('weeklyScheduleContent');
    const days = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
    const timeSlots = [
        '08:00 - 08:45',
        '08:55 - 09:40',
        '10:00 - 10:45',
        '10:55 - 11:40',
        '12:00 - 12:45',
        '12:55 - 13:40'
    ];

    const user = getCurrentUser();
    const mySubject = getSubjectName(user.subject);
    const classes = ['9-A', '9-B', '10-A', '10-B', '11-A', '11-V'];
    const rooms = ['201', '204', '302', '305', '401', 'Labb-1'];

    let html = `
        <table class="responsive-table w-full">
            <thead>
                <tr>
                    <th class="p-4 text-left">Vaqt</th>
                    ${days.map(day => `<th class="p-4 text-left">${day}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
    `;

    timeSlots.forEach((slot, timeIndex) => {
        html += `
            <tr class="border-b border-themed hover:bg-themed-hover transition-colors">
                <td class="p-4 font-bold text-blue-400 whitespace-nowrap">${slot}</td>
                ${days.map(() => {
            const hasLesson = Math.random() > 0.3;
            if (hasLesson) {
                const randomClass = classes[Math.floor(Math.random() * classes.length)];
                const randomRoom = rooms[Math.floor(Math.random() * rooms.length)];
                return `
                            <td class="p-4">
                                <div class="font-bold text-main">${mySubject}</div>
                                <div class="text-xs text-muted mt-1">
                                    <span class="mr-2"><i class="fas fa-users mr-1"></i>${randomClass}</span>
                                    <span><i class="fas fa-door-open mr-1"></i>${randomRoom}-hona</span>
                                </div>
                            </td>
                        `;
            }
            return `<td class="p-4 text-muted text-xs italic">Bo'sh vaqt</td>`;
        }).join('')}
            </tr>
        `;
    });

    html += `
            </tbody>
        </table>
    `;

    container.innerHTML = html;
}

function updateDashboardSchedule() {
    const user = getCurrentUser();
    const mySubject = getSubjectName(user.subject);
    const classes = ['10-A', '9-B', '11-V'];
    const rooms = ['302', '204', '405'];
    const times = ['10:00 - 10:45', '11:55 - 12:40', '13:00 - 13:45'];

    const elements = {
        num: document.getElementById('nextLessonNum'),
        subject: document.getElementById('nextLessonSubject'),
        time: document.getElementById('nextLessonTime'),
        class: document.getElementById('nextLessonClass'),
        room: document.getElementById('nextLessonRoom'),
        progress: document.getElementById('todayProgress'),
        progressBar: document.getElementById('todayProgressBar')
    };

    if (elements.subject) {
        const randIdx = Math.floor(Math.random() * classes.length);
        elements.num.textContent = Math.floor(Math.random() * 4) + 1;
        elements.subject.textContent = mySubject;
        elements.time.innerHTML = `<i class="far fa-clock mr-1"></i> ${times[randIdx]}`;
        elements.class.innerHTML = `<i class="fas fa-users mr-1"></i> ${classes[randIdx]}`;
        elements.room.innerHTML = `<i class="fas fa-door-open mr-1"></i> ${rooms[randIdx]}-hona`;

        const done = 2;
        const total = 6;
        elements.progress.textContent = `${done} / ${total}`;
        elements.progressBar.style.width = `${(done / total) * 100}%`;
    }
}

// Add to loadTeacherData
const originalLoadTeacherData = loadTeacherData;
loadTeacherData = function () {
    originalLoadTeacherData();
    updateDashboardSchedule();
}
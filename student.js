// O'quvchi sahifasi funksiyalari
let currentTest = null;
let testAnswers = [];

document.addEventListener('DOMContentLoaded', function () {
    console.log('DOMContentLoaded triggered'); // Debug log
    const user = getCurrentUser();
    if (!user || user.role !== 'student') {
        window.location.href = 'index.html';
        return;
    }

    loadStudentData();
    filterVideos('all'); // Ensure videos load initially
    loadTests();
    loadShopItems();
    loadHomework();
    loadVideoLessons();
    showTab('videos'); // Set initial tab
    console.log('Initial setup completed'); // Debug log
});

function loadStudentData() {
    const user = getCurrentUser();

    // Foydalanuvchi ma'lumotlarini yangilash
    document.getElementById('userName').textContent = user.name || 'No Name';
    document.getElementById('coinBalance').textContent = user.coins || 0;
    document.getElementById('coinBalanceCard').textContent = user.coins || 0;

    // Profile Header Sections
    const headerName = document.getElementById('profileHeaderName');
    const headerClass = document.getElementById('profileHeaderClass');
    const headerCoins = document.getElementById('profileHeaderCoins');

    if (headerName) headerName.textContent = user.name || '';
    if (headerClass) headerClass.textContent = getClassName(user.class) || '';
    if (headerCoins) headerCoins.textContent = user.coins || 0;

    // Profil ma'lumotlari (Inputs & Info)
    document.getElementById('profileName').value = user.name || '';
    document.getElementById('profileUsername').value = user.username || '';
    document.getElementById('profileClass').value = getClassName(user.class) || '';
    document.getElementById('profileCoins').value = user.coins || 0;

    if (user.avatar) {
        document.getElementById('userAvatar').src = user.avatar;
        document.getElementById('profileAvatar').src = user.avatar;
    } else {
        document.getElementById('userAvatar').style.display = 'none';
        document.getElementById('profileAvatar').src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.name) + '&background=3b82f6&color=fff';
    }

    // Statistikalarni hisoblash
    calculateStats(user);
    loadRankings();
    loadDiary(user);
}

function calculateStats(user) {
    // O'rtacha baho
    let totalGrade = 0;
    let count = 0;

    if (user.grades) {
        Object.values(user.grades).forEach(subjectGrades => {
            subjectGrades.forEach(grade => {
                totalGrade += grade;
                count++;
            });
        });
    }

    const averageGrade = count > 0 ? (totalGrade / count).toFixed(1) : '0';
    document.getElementById('averageGrade').textContent = averageGrade;
    const profileAvgGrade = document.getElementById('profileAvgGrade');
    if (profileAvgGrade) profileAvgGrade.textContent = averageGrade;

    // Davomat
    const attendanceRate = user.attendance && user.attendance.length > 0 ?
        Math.round((user.attendance.filter(a => a.status === 'present').length / user.attendance.length) * 100) : 0;
    document.getElementById('attendanceRate').textContent = attendanceRate + '%';
    const profileAvgAttendance = document.getElementById('profileAvgAttendance');
    if (profileAvgAttendance) profileAvgAttendance.textContent = attendanceRate + '%';

    // Reyting
    const rankings = calculateRankings();
    const rank = rankings.findIndex(r => r.id === user.id) + 1 || 1;
    document.getElementById('studentRank').textContent = '#' + rank;
    const headerRank = document.getElementById('profileHeaderRank');
    if (headerRank) headerRank.textContent = `Reyting: #${rank}`;
}

function loadTests() {
    const tests = JSON.parse(localStorage.getItem('tests')) || [];
    const container = document.getElementById('testsContainer');
    container.innerHTML = '';

    if (tests.length === 0) {
        container.innerHTML = `
            <div class="col-span-2 text-center py-8">
                <p class="text-gray-400 text-lg">Hozircha testlar mavjud emas</p>
            </div>
        `;
        return;
    }

    tests.forEach(test => {
        const testCard = `
            <div class="bg-card border border-themed rounded-xl p-6 shadow-sm card-hover">
                <h3 class="text-lg font-semibold mb-2">${test.title}</h3>
                <div class="text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <p>Fan: ${getSubjectName(test.subject)}</p>
                    <p>Savollar: ${test.questions.length} ta</p>
                    <p>Maksimal coin: ${test.questions.reduce((sum, q) => sum + q.coins, 0)}</p>
                </div>
                <button onclick="startTest(${test.id})" 
                        class="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-lg transition-colors text-white">
                    Testni Boshlash
                </button>
            </div>
        `;
        container.innerHTML += testCard;
    });

}

function loadHomework() {
    const homework = JSON.parse(localStorage.getItem('homework')) || [];
    const user = getCurrentUser();
    const classHomework = homework.filter(h => h.class === user.class);
    const container = document.getElementById('homeworkContainer');
    container.innerHTML = '';

    if (classHomework.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8">
                <p class="text-gray-500 dark:text-gray-400 text-lg">Hozircha uy vazifalari mavjud emas</p>
            </div>
        `;
        return;
    }

    classHomework.forEach(hw => {
        const isCompleted = user.completedHomework && user.completedHomework.includes(hw.id);
        const homeworkCard = `
            <div class="bg-card border ${isCompleted ? 'border-green-500' : 'border-themed'} rounded-xl p-6 shadow-sm card-hover">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="text-lg font-semibold">${hw.title}</h3>
                        <p class="text-sm text-gray-500 dark:text-gray-300">${getSubjectName(hw.subject)}</p>
                    </div>
                    <div class="text-right">
                        <span class="bg-blue-600 px-3 py-1 rounded-full text-sm text-white">
                            ${new Date(hw.deadline).toLocaleDateString()}
                        </span>
                        ${isCompleted ? `
                            <span class="bg-green-600 px-3 py-1 rounded-full text-sm mt-1 block text-white">
                                ✅ Bajarilgan
                            </span>
                        ` : ''}
                    </div>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-300 mb-4">${hw.description}</p>
                <div class="flex justify-between items-center">
                    <span class="text-xs text-gray-500 dark:text-gray-400">
                        Berilgan: ${new Date(hw.createdAt).toLocaleDateString()}
                    </span>
                    ${!isCompleted ? `
                        <button onclick="completeHomework(${hw.id})" 
                                class="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors text-white">
                            Bajarildi deb belgilash
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
        container.innerHTML += homeworkCard;
    });

}

function completeHomework(homeworkId) {
    const user = getCurrentUser();

    if (!user.completedHomework) {
        user.completedHomework = [];
    }

    if (!user.completedHomework.includes(homeworkId)) {
        user.completedHomework.push(homeworkId);
        updateCurrentUser(user);

        // Uy vazifasini yangilash
        const homework = JSON.parse(localStorage.getItem('homework')) || [];
        const hwIndex = homework.findIndex(h => h.id === homeworkId);
        if (hwIndex !== -1) {
            homework[hwIndex].completed = (homework[hwIndex].completed || 0) + 1;
            localStorage.setItem('homework', JSON.stringify(homework));
        }

        showNotification('Uy vazifasi bajarildi deb belgilandi!', 'success');
        loadHomework();
    }
}

function loadVideoLessons() {
    const videoLessons = JSON.parse(localStorage.getItem('videoLessons')) || [];
    const user = getCurrentUser();
    const activeLessons = videoLessons.filter(v => v.class === user.class && v.isActive);
    const historyLessons = videoLessons.filter(v => v.class === user.class && !v.isActive).sort((a, b) => new Date(b.startTime) - new Date(a.startTime));

    const activeContainer = document.getElementById('activeLessonContainer');
    const historyContainer = document.getElementById('videoLessonsHistoryContainer');
    const liveBadge = document.getElementById('liveBadge');

    if (!activeContainer || !historyContainer) return;

    activeContainer.innerHTML = '';
    historyContainer.innerHTML = '';

    // Active Badge handling
    if (activeLessons.length > 0) {
        liveBadge.classList.remove('hidden');
        liveBadge.classList.add('flex');
    } else {
        liveBadge.classList.add('hidden');
        liveBadge.classList.remove('flex');
    }

    // Render Active Lessons
    if (activeLessons.length === 0) {
        activeContainer.innerHTML = `
            <div class="bg-blue-50/50 dark:bg-blue-900/10 border-2 border-dashed border-blue-200 dark:border-blue-800/50 rounded-[2rem] p-12 text-center">
                <div class="w-16 h-16 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                    <i class="fas fa-video-slash text-blue-400 text-2xl"></i>
                </div>
                <h3 class="text-xl font-bold text-gray-900 dark:text-white mb-2">Hozircha dars yo'q</h3>
                <p class="text-gray-500 dark:text-gray-400">O'qituvchingiz dars boshlashi bilan bu yerda paydo bo'ladi</p>
            </div>
        `;
    } else {
        activeLessons.forEach(lesson => {
            const card = `
                <div class="relative group bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2rem] p-8 md:p-10 shadow-2xl overflow-hidden">
                    <div class="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
                    <div class="relative flex flex-col md:flex-row items-center gap-8 justify-between">
                        <div class="text-center md:text-left text-white">
                            <div class="flex items-center justify-center md:justify-start gap-2 mb-4">
                                <span class="bg-red-500 text-[10px] font-black uppercase tracking-tighter px-2.5 py-1 rounded-lg">LIVE</span>
                                <span class="text-blue-100 text-sm font-medium">Boshlangan: ${new Date(lesson.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <h3 class="text-3xl md:text-4xl font-black mb-2">${lesson.title}</h3>
                            <div class="flex flex-wrap justify-center md:justify-start gap-4 mt-6">
                                <div class="bg-black/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2">
                                    <i class="fas fa-book-reader text-blue-300"></i>
                                    <span class="text-sm font-extrabold text-white">${getSubjectName(lesson.subject)}</span>
                                </div>
                                <div class="bg-black/20 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10 flex items-center gap-2">
                                    <i class="fas fa-user-tie text-blue-300"></i>
                                    <span class="text-sm font-extrabold text-white">${lesson.teacherName}</span>
                                </div>
                            </div>
                        </div>
                        <button onclick="joinVideoLesson('${lesson.link}')" 
                                class="w-full md:w-auto bg-white text-blue-600 px-10 py-5 rounded-2xl font-black shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 group">
                            <i class="fas fa-play"></i>
                            Darsga Qo'shilish
                        </button>
                    </div>
                </div>
            `;
            activeContainer.innerHTML += card;
        });
    }

    // Render History Lessons
    if (historyLessons.length === 0) {
        historyContainer.innerHTML = '<div class="col-span-full py-10 text-center text-gray-400">Darslar tarixi mavjud emas</div>';
    } else {
        historyLessons.forEach(lesson => {
            const date = new Date(lesson.startTime);
            const duration = lesson.endTime ? Math.round((new Date(lesson.endTime) - date) / 60000) : '?';
            const historyItem = `
                <div class="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 rounded-2xl p-4 hover:shadow-lg transition-all flex items-center justify-between group">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 transition-colors group-hover:bg-blue-600 group-hover:text-white">
                            <i class="fas fa-play-circle text-xl"></i>
                        </div>
                        <div>
                            <h4 class="font-bold text-gray-800 dark:text-white">${lesson.title}</h4>
                            <div class="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                <span><i class="far fa-calendar-alt mr-1"></i>${date.toLocaleDateString()}</span>
                                <span><i class="far fa-clock mr-1"></i>${duration} daqiqa</span>
                            </div>
                        </div>
                    </div>
                    <div class="flex flex-col items-end gap-1">
                        <span class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">${getSubjectName(lesson.subject)}</span>
                        <div class="flex items-center gap-1 text-[10px] text-gray-500">
                             <i class="fas fa-users"></i>
                             <span>${lesson.participants ? lesson.participants.length : 0}</span>
                        </div>
                    </div>
                </div>
            `;
            historyContainer.innerHTML += historyItem;
        });
    }
}

function copyLessonLink(link) {
    navigator.clipboard.writeText(link).then(() => {
        showNotification('Link nusxalandi! Endi video darsga qo\'shilishingiz mumkin', 'success');
    });
}

function joinVideoLesson(link) {
    // Video darsga qo'shilish
    window.open(link, '_blank');

    // Qatnashchilar ro'yxatini yangilash
    const user = getCurrentUser();
    const videoLessons = JSON.parse(localStorage.getItem('videoLessons')) || [];
    const lessonIndex = videoLessons.findIndex(v => v.link === link);

    if (lessonIndex !== -1) {
        if (!videoLessons[lessonIndex].participants) {
            videoLessons[lessonIndex].participants = [];
        }

        if (!videoLessons[lessonIndex].participants.find(p => p.id === user.id)) {
            videoLessons[lessonIndex].participants.push({
                id: user.id,
                name: user.name,
                joinTime: new Date().toISOString()
            });

            localStorage.setItem('videoLessons', JSON.stringify(videoLessons));
            showNotification('Video darsga muvaffaqiyatli qo\'shildingiz!', 'success');
        }
    }
}

function startTest(testId) {
    const tests = JSON.parse(localStorage.getItem('tests')) || [];
    currentTest = tests.find(t => t.id === testId);

    if (!currentTest) return;

    testAnswers = [];
    document.getElementById('testTitle').textContent = currentTest.title;

    const questionsContainer = document.getElementById('testQuestions');
    questionsContainer.innerHTML = '';

    currentTest.questions.forEach((question, index) => {
        const questionHtml = `
            <div class="bg-secondary-themed border border-themed rounded-lg p-6 mb-4">
                <h4 class="text-lg font-semibold mb-4 text-main">${index + 1}. ${question.question}</h4>
                <div class="space-y-3" data-question-index="${index}">
                    ${question.options.map((option, optIndex) => `
                        <div class="test-option p-4 rounded-lg cursor-pointer border border-themed hover:bg-themed-hover transition-all flex items-center justify-between bg-card"
                             data-option-index="${optIndex}"
                             onclick="selectAnswer(${index}, ${optIndex})">
                            <span class="text-main">${option}</span>
                            <span class="answer-indicator hidden">✅</span>
                        </div>
                    `).join('')}
                </div>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-3">Coin: ${question.coins}</p>
            </div>
        `;
        questionsContainer.innerHTML += questionHtml;
    });


    openModal('testModal');
}

function selectAnswer(questionIndex, answerIndex) {
    // Get the current question container
    const questionElement = document.getElementById('testQuestions').children[questionIndex];
    if (!questionElement) return;

    // Get all options for the current question
    const options = questionElement.querySelectorAll('.test-option');
    if (!options.length) return;

    // Update the answer state
    testAnswers[questionIndex] = answerIndex;

    // Remove selected state from all options
    options.forEach(option => {
        option.classList.remove('selected');
        option.querySelector('.answer-indicator').classList.add('hidden');
    });

    // Mark the selected option with enhanced visual state
    const selectedOption = options[answerIndex];
    selectedOption.classList.add('selected');
    selectedOption.querySelector('.answer-indicator').classList.remove('hidden');

    console.log(`Selected answer for question ${questionIndex}: ${answerIndex}`); // Debug log
}

function submitTest() {
    if (testAnswers.length !== currentTest.questions.length) {
        showNotification('Barcha savollarga javob bering!', 'warning');
        return;
    }

    const result = calculateTestResult(currentTest.questions, testAnswers);
    const user = getCurrentUser();

    // Coinlarni yangilash
    user.coins += result.coins;
    updateCurrentUser(user);

    showNotification(`Test yakunlandi! ${result.correct}/${result.total} to'g'ri. ${result.coins} coin qo'shildi!`, 'success');

    closeModal('testModal');
    loadStudentData(); // Ma'lumotlarni yangilash
}

function loadDiary(user) {
    // Summary Stats
    const summaryAvg = document.getElementById('diaryAvgGrade');
    const summaryAttendance = document.getElementById('diaryAttendance');
    const summaryRank = document.getElementById('diaryRank');

    // Calculate generic stats if not passed (though loadStudentData should have it)
    let totalGrade = 0;
    let count = 0;
    if (user.grades) {
        Object.values(user.grades).forEach(sg => {
            sg.forEach(g => {
                totalGrade += g;
                count++;
            });
        });
    }
    const avg = count > 0 ? (totalGrade / count).toFixed(1) : '0';
    const attRate = user.attendance && user.attendance.length > 0 ?
        Math.round((user.attendance.filter(a => a.status === 'present').length / user.attendance.length) * 100) : 0;

    const rankings = calculateRankings();
    const rank = rankings.findIndex(r => r.id === user.id) + 1 || 1;

    if (summaryAvg) summaryAvg.textContent = avg;
    if (summaryAttendance) summaryAttendance.textContent = attRate + '%';
    if (summaryRank) summaryRank.textContent = '#' + rank;

    // Subjects & Grades List
    const gradesContainer = document.getElementById('gradesTable');
    if (user.grades && Object.keys(user.grades).length > 0) {
        let html = '';
        Object.entries(user.grades).forEach(([subject, grades]) => {
            const subjectAvg = (grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(1);
            const subjectIcons = {
                algebra: 'fa-calculator',
                geometry: 'fa-shapes',
                physics: 'fa-atom',
                chemistry: 'fa-flask',
                biology: 'fa-leaf',
                history: 'fa-monument'
            };
            const icon = subjectIcons[subject] || 'fa-book';

            html += `
                <div class="group bg-themed-hover p-5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all hover:ring-2 hover:ring-blue-500/20">
                    <div class="flex items-center gap-4">
                        <div class="w-12 h-12 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center text-blue-500 shadow-sm transition-transform group-hover:rotate-12">
                            <i class="fas ${icon} text-lg"></i>
                        </div>
                        <div>
                            <h4 class="font-black text-main text-lg">${getSubjectName(subject)}</h4>
                            <div class="flex flex-wrap gap-1.5 mt-2">
                                ${grades.map(g => `<span class="w-7 h-7 flex items-center justify-center rounded-lg text-[10px] font-black border border-themed bg-card grade-${getGradeClass(g)}">${g}</span>`).join('')}
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center gap-4 border-t md:border-t-0 md:border-l border-themed pt-4 md:pt-0 md:pl-6 text-right">
                         <div>
                            <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">O'rtacha</p>
                            <span class="text-2xl font-black text-gray-900 dark:text-white">${subjectAvg}</span>
                         </div>
                    </div>
                </div>
            `;
        });
        gradesContainer.innerHTML = html;
    } else {
        gradesContainer.innerHTML = '<p class="text-gray-500 dark:text-gray-400 text-center py-8">Hozircha baholar mavjud emas</p>';
    }


    // Attendance Calendar
    const attendanceCalendar = document.getElementById('attendanceCalendar');
    attendanceCalendar.innerHTML = '';

    if (user.attendance && user.attendance.length > 0) {
        user.attendance.forEach((att, index) => {
            const day = document.createElement('div');
            let colorClass = 'bg-themed-hover';
            if (att.status === 'present') colorClass = 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20';
            else if (att.status === 'absent') colorClass = 'bg-rose-500 text-white shadow-lg shadow-rose-500/20';
            else if (att.status === 'late') colorClass = 'bg-amber-500 text-white shadow-lg shadow-amber-500/20';

            day.className = `aspect-square rounded-xl flex items-center justify-center text-[10px] font-black transition-transform hover:scale-110 cursor-help ${colorClass}`;
            day.textContent = index + 1;
            day.title = `${att.date}: ${getAttendanceStatus(att.status)}`;
            attendanceCalendar.appendChild(day);
        });
    } else {
        attendanceCalendar.innerHTML = '<div class="col-span-full py-8 text-center text-gray-400">Ma\'lumot yo\'q</div>';
    }

}

function loadRankings() {
    const rankings = calculateRankings();
    const user = getCurrentUser();
    const userClass = user.class;

    // Filter students by current user's class
    const classRankings = rankings.filter(r => r.class === userClass);
    const podiumContainer = document.getElementById('podiumContainer');
    const rankingList = document.getElementById('rankingList');
    const classLabel = document.getElementById('rankingClassLabel');

    if (!podiumContainer || !rankingList) return;
    if (classLabel) classLabel.textContent = getClassName(userClass) + ' Sinf';

    podiumContainer.innerHTML = '';
    rankingList.innerHTML = '';

    if (classRankings.length === 0) {
        rankingList.innerHTML = '<p class="text-gray-400 text-center py-12">Hali reyting ma\'lumotlari mavjud emas</p>';
        return;
    }

    // Identify Top 3 for Podium
    const top3 = classRankings.slice(0, 3);
    const others = classRankings.slice(3);

    // Render Podium
    const podiumOrder = [1, 0, 2]; // 2nd, 1st, 3rd positions visually
    podiumOrder.forEach(idx => {
        const student = top3[idx];
        if (!student) return;

        const isFirst = idx === 0;
        const rankColors = isFirst ? 'from-yellow-400 to-amber-600' : (idx === 1 ? 'from-slate-300 to-slate-500' : 'from-orange-400 to-amber-800');
        const borderColor = isFirst ? 'border-yellow-400' : (idx === 1 ? 'border-slate-300' : 'border-orange-500');
        const height = isFirst ? 'h-72 md:h-80' : 'h-60 md:h-64';
        const crown = isFirst ? '<div class="absolute -top-6 left-1/2 -translate-x-1/2 text-3xl animate-bounce">👑</div>' : '';

        const podiumCard = `
            <div class="relative w-full md:w-64 ${height} bg-gradient-to-b ${rankColors} rounded-[2.5rem] p-6 text-white shadow-2xl flex flex-col items-center justify-end transition-transform hover:scale-105 group">
                ${crown}
                <div class="absolute top-8 flex flex-col items-center">
                    <div class="w-20 h-20 rounded-full border-4 border-white/30 overflow-hidden mb-3 shadow-xl">
                        <img src="${student.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(student.name) + '&background=random'}" class="w-full h-full object-cover">
                    </div>
                    <h4 class="font-black text-center line-clamp-1 px-2">${student.name}</h4>
                    <span class="text-[10px] font-black uppercase tracking-widest opacity-80">${student.score.toFixed(1)} Bal</span>
                </div>
                <div class="mt-auto w-full py-4 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-center">
                    <span class="text-3xl font-black">${idx + 1}</span>
                    <p class="text-[10px] uppercase font-bold tracking-widest opacity-70">O'rin</p>
                </div>
            </div>
        `;
        podiumContainer.innerHTML += podiumCard;
    });

    // Render Others
    const renderStudentRow = (student, index) => {
        const isCurrentUser = student.id === user.id;
        const rank = index + 1;
        return `
            <div class="group relative bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/50 rounded-2xl p-4 flex items-center justify-between transition-all hover:shadow-xl ${isCurrentUser ? 'ring-2 ring-blue-500 shadow-lg shadow-blue-500/10' : ''}">
                <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-xl bg-themed-hover flex items-center justify-center font-black text-muted text-sm border border-themed transition-colors group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600">
                        ${rank}
                    </div>
                    <div>
                        <p class="font-bold text-gray-800 dark:text-white flex items-center gap-2">
                            ${student.name}
                            ${isCurrentUser ? '<span class="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-600 px-2 py-0.5 rounded-md">SIZ</span>' : ''}
                        </p>
                        <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest">${student.averageGrade.toFixed(1)} O'rtacha Baho</p>
                    </div>
                </div>
                <div class="text-right">
                    <div class="text-lg font-black text-gray-900 dark:text-white">${student.score.toFixed(1)}</div>
                    <div class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">${Math.round(student.attendanceRate)}% Davomat</div>
                </div>
            </div>
        `;
    };

    classRankings.forEach((student, index) => {
        if (index >= 3 || classRankings.length <= 3) {
            rankingList.innerHTML += renderStudentRow(student, index);
        }
    });
}

function loadShopItems() {
    const shopItems = JSON.parse(localStorage.getItem('shopItems')) || [];
    const user = getCurrentUser();
    const container = document.getElementById('shopItems');
    container.innerHTML = '';

    shopItems.forEach(item => {
        const canAfford = user.coins >= item.price;
        const isOwned = user.purchasedItems && user.purchasedItems.find(p => p.itemId === item.id);
        const shopItem = `
            <div class="shop-item bg-card border ${isOwned ? 'border-green-500' : 'border-themed'} rounded-xl p-6 text-center shadow-sm card-hover ${!isOwned && !canAfford ? 'opacity-50' : ''}">
                <div class="text-6xl mb-4">${item.image}</div>
                <h3 class="text-lg font-semibold mb-2 text-main">${item.name}</h3>
                <p class="text-yellow-600 dark:text-yellow-400 font-bold mb-4 text-xl">${item.price} 🪙</p>
                ${isOwned ? `
                    <button class="w-full bg-green-600 py-2 rounded-lg cursor-default text-white">
                        ✅ Sotib Olingan
                    </button>
                ` : `
                    <button onclick="buyItem(${item.id})" 
                            class="w-full bg-green-600 hover:bg-green-700 py-2 rounded-lg transition-colors text-white ${!canAfford ? 'opacity-50 cursor-not-allowed' : ''
            }"
                            ${!canAfford ? 'disabled' : ''}>
                        Sotib Olish
                    </button>
                `}
            </div>
        `;
        container.innerHTML += shopItem;
    });

}

function buyItem(itemId) {
    const user = getCurrentUser();
    const shopItems = JSON.parse(localStorage.getItem('shopItems')) || [];
    const item = shopItems.find(i => i.id === itemId);

    if (!item) return;

    if (user.coins < item.price) {
        showNotification('Coinlar yetarli emas!', 'error');
        return;
    }

    if (!confirm(`${item.name} ni ${item.price} coin evaziga sotib olishni xohlaysizmi?`)) {
        return;
    }

    // Coinlarni ayirish
    user.coins -= item.price;

    // Sotib olingan mahsulotlarni saqlash
    if (!user.purchasedItems) {
        user.purchasedItems = [];
    }
    user.purchasedItems.push({
        itemId: item.id,
        itemName: item.name,
        purchaseDate: new Date().toISOString(),
        price: item.price
    });

    updateCurrentUser(user);
    showNotification(`${item.name} muvaffaqiyatli sotib olindi!`, 'success');
    loadStudentData();
    loadShopItems();
}

function updateProfile() {
    const user = getCurrentUser();
    const newName = document.getElementById('profileName').value;

    if (newName && newName !== user.name) {
        user.name = newName;
        updateCurrentUser(user);
        showNotification('Profil muvaffaqiyatli yangilandi!', 'success');
        loadStudentData();
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
            loadStudentData();
            showNotification('Profil rasmi yangilandi!', 'success');
        };
        reader.readAsDataURL(file);
    }
});

function showTab(tabName) {
    console.log('Switching to tab:', tabName); // Debug log
    // Barcha tab tugmalaridan aktivlikni olib tashlash
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('bg-blue-600', 'text-white');
        btn.classList.add('text-gray-500', 'dark:text-gray-400', 'hover:text-main');
    });

    // Tanlangan tab tugmasiga aktivlik qo'shish
    event.target.classList.add('bg-blue-600', 'text-white');
    event.target.classList.remove('text-gray-500', 'dark:text-gray-400', 'hover:text-main');

    // Barcha tab kontentlarini yashirish
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });

    // Tanlangan tab kontentini ko'rsatish
    const tabContent = document.getElementById(tabName);
    if (tabContent) {
        tabContent.classList.remove('hidden');
    } else {
        console.error('Tab content not found:', tabName);
    }

    // Ma'lumotlarni yangilash
    if (tabName === 'homework') {
        loadHomework();
    } else if (tabName === 'videoLessons') {
        loadVideoLessons();
    } else if (tabName === 'videos') {
        filterVideos('all'); // Load all videos when switching to the videos tab
    }
}

function filterVideos(subject) {
    console.log('Filtering videos for subject:', subject);

    // Video ma'lumotlari bazasi (Premium Thumbnails)
    const videos = [
        {
            id: 1,
            title: 'Algebra - Chiziqli tenglamalar',
            subject: 'algebra',
            thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&q=80&w=800',
            url: 'https://www.youtube.com/embed/KXwSAWVErjM',
            duration: '15:30',
            views: 1240,
            author: 'Xon Academy'
        },
        {
            id: 2,
            title: 'Geometriya - Uchburchaklar',
            subject: 'geometry',
            thumbnail: 'https://images.unsplash.com/photo-1596495578065-6e0763fa1178?auto=format&fit=crop&q=80&w=800',
            url: 'https://www.youtube.com/embed/2z-OL8Uzwuw',
            duration: '20:15',
            views: 850,
            author: 'Numberphile'
        },
        {
            id: 3,
            title: 'Tarix - O\'rta asrlar',
            subject: 'history',
            thumbnail: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&q=80&w=800',
            url: 'https://www.youtube.com/embed/v2t1K1a4uGg',
            duration: '18:45',
            views: 2100,
            author: 'Tarix TV'
        },
        {
            id: 4,
            title: 'Biologiya - Hujayra tuzilishi',
            subject: 'biology',
            thumbnail: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?auto=format&fit=crop&q=80&w=800',
            url: 'https://www.youtube.com/embed/1h7KV2sjUWY',
            duration: '22:10',
            views: 1560,
            author: 'CrashCourse'
        },
        {
            id: 5,
            title: 'Kimyo - Elementlar davriy jadvali',
            subject: 'chemistry',
            thumbnail: 'https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?auto=format&fit=crop&q=80&w=800',
            url: 'https://www.youtube.com/embed/W7V2u6S0a5s',
            duration: '17:30',
            views: 1890,
            author: 'SciShow'
        },
        {
            id: 6,
            title: 'Fizika - Mexanika asoslari',
            subject: 'physics',
            thumbnail: 'https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&q=80&w=800',
            url: 'https://www.youtube.com/embed/xZ6X2v0k5x8',
            duration: '19:45',
            views: 940,
            author: 'Physics Girl'
        }
    ];

    const container = document.getElementById('videosContainer');
    if (!container) return;

    container.innerHTML = '';
    const filteredVideos = subject === 'all' ? videos : videos.filter(v => v.subject === subject);

    if (filteredVideos.length === 0) {
        container.innerHTML = `
            <div class="col-span-full flex flex-col items-center justify-center py-12 text-center">
                <div class="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 text-3xl">
                    🎥
                </div>
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">Video darslar topilmadi</h3>
                <p class="text-gray-500 dark:text-gray-400 max-w-sm">
                    Tanlangan fan bo'yicha hozircha video darsliklar yuklanmagan. Boshqa fanni tanlab ko'ring.
                </p>
            </div>
        `;
        return;
    }

    filteredVideos.forEach(video => {
        const subjectColors = {
            algebra: 'bg-blue-100/80 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300',
            geometry: 'bg-indigo-100/80 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300',
            physics: 'bg-purple-100/80 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300',
            chemistry: 'bg-teal-100/80 text-teal-700 dark:bg-teal-900/50 dark:text-teal-300',
            biology: 'bg-green-100/80 text-green-700 dark:bg-green-900/50 dark:text-green-300',
            history: 'bg-orange-100/80 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300'
        };

        const subjectClass = subjectColors[video.subject] || 'bg-gray-100 text-gray-700';

        const card = `
            <div class="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-700 flex flex-col h-full transform hover:-translate-y-1 relative"
                 onclick="playVideo(this, '${video.url}')">
                
                <!-- Thumbnail -->
                <div class="relative w-full aspect-video bg-gray-900 overflow-hidden cursor-pointer">
                    <img src="${video.thumbnail}" alt="${video.title}" class="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500">
                    
                    <!-- Gradient Overlay -->
                    <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60 group-hover:opacity-40 transition-opacity"></div>
                    
                    <!-- Play Button -->
                    <div class="absolute inset-0 flex items-center justify-center">
                        <div class="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30 group-hover:scale-110 group-hover:bg-white/30 transition-all duration-300 shadow-lg">
                            <i class="fas fa-play text-white ml-1 text-lg drop-shadow-md"></i>
                        </div>
                    </div>
                    
                    <!-- Duration Badge -->
                    <div class="absolute bottom-3 right-3 bg-black/70 backdrop-blur-md px-2 py-1 rounded text-xs font-medium text-white shadow-sm border border-white/10">
                        ${video.duration}
                    </div>
                </div>

                <!-- Content -->
                <div class="p-5 flex flex-col flex-1 relative z-10">
                    <div class="flex items-start justify-between mb-3">
                        <span class="px-2.5 py-1 rounded-lg text-[10px] uppercase font-bold tracking-wider ${subjectClass}">
                            ${getSubjectName(video.subject)}
                        </span>
                        <div class="flex items-center space-x-1 text-xs text-gray-400">
                            <i class="fas fa-eye text-xs"></i>
                            <span>${video.views.toLocaleString()}</span>
                        </div>
                    </div>

                    <h3 class="text-lg font-bold text-gray-800 dark:text-white mb-2 leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                        ${video.title}
                    </h3>
                    
                    <div class="mt-auto pt-3 flex items-center justify-between border-t border-gray-100 dark:border-gray-700/50">
                        <p class="text-sm text-gray-500 dark:text-gray-400 font-medium">
                            ${video.author}
                        </p>
                        <button class="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium transition-colors">
                            Ko'rish &rarr;
                        </button>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += card;
    });

    // Update Filter Buttons state
    document.querySelectorAll('.filter-btn').forEach(btn => {
        const isActive = btn.getAttribute('onclick').includes(`'${subject}'`);

        // Base classes
        btn.className = `filter-btn px-6 py-3 rounded-2xl text-sm font-extrabold whitespace-nowrap transition-all duration-300 flex items-center gap-2`;

        if (isActive) {
            btn.classList.add(
                'bg-blue-600',
                'text-white',
                'shadow-lg',
                'shadow-blue-500/30',
                'active-filter'
            );
        } else {
            btn.classList.add(
                'bg-gray-100/50',
                'dark:bg-gray-800/50',
                'text-gray-600',
                'dark:text-gray-400',
                'hover:bg-gray-200',
                'dark:hover:bg-gray-700'
            );
        }
    });
}

function searchVideos(query) {
    const q = query.toLowerCase().trim();
    const container = document.getElementById('videosContainer');
    if (!container) return;

    // We need to re-filter everything if icons are needed for cards.
    // Instead of duplicating the entire videos list, we can call filterVideos('all')
    // but that would reset the search.
    // Optimal: The videos list should be outside for easy access.
    // Since it's inside filterVideos, let's just use the current DOM or trigger filter logic.

    const cards = container.querySelectorAll('.group');
    cards.forEach(card => {
        const title = card.querySelector('h3').textContent.toLowerCase();
        if (title.includes(q)) {
            card.style.display = 'flex';
        } else {
            card.style.display = 'none';
        }
    });
}

function playVideo(cardElement, videoUrl) {
    const thumbnailContainer = cardElement.querySelector('.relative.w-full.aspect-video');
    if (!thumbnailContainer) return;

    // Replace thumbnail with iframe
    thumbnailContainer.innerHTML = `
        <iframe 
            src="${videoUrl}?autoplay=1" 
            title="Video Player"
            class="absolute inset-0 w-full h-full object-cover rounded-t-2xl" 
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen>
        </iframe>
    `;

    // Remove pointer events from card to allow interacting with iframe
    cardElement.removeAttribute('onclick');
    cardElement.classList.remove('cursor-pointer');
}

// Supporting Functions (Placeholders)
function getCurrentUser() {
    // Placeholder: Should retrieve the current user from localStorage or session
    return JSON.parse(localStorage.getItem('currentUser')) || {};
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

function getClassName(classId) {
    const classes = {
        '1': '1-sinf',
        '2': '2-sinf',
        // Add more classes as needed
    };
    return classes[classId] || `Sinf-${classId}`;
}

function showNotification(message, type) {
    // Placeholder: Replace with your notification system (e.g., alert or custom UI)
    alert(`${type === 'error' ? 'Xatolik: ' : ''}${message}`);
}

function updateCurrentUser(user) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userIndex = users.findIndex(u => u.id === user.id);
    if (userIndex !== -1) {
        users[userIndex] = user;
    } else {
        users.push(user);
    }
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('currentUser', JSON.stringify(user)); // Update current user
}

function calculateTestResult(questions, answers) {
    // Placeholder: Calculate test results
    let correct = 0;
    let totalCoins = 0;
    questions.forEach((q, index) => {
        if (answers[index] === q.correct) {
            correct++;
            totalCoins += q.coins;
        }
    });
    return {
        correct: correct,
        total: questions.length,
        coins: totalCoins
    };
}

function calculateRankings() {
    // Placeholder: Calculate rankings based on user data
    const users = JSON.parse(localStorage.getItem('users')) || [];
    return users.filter(u => u.role === 'student').map(u => ({
        id: u.id,
        name: u.name,
        class: u.class,
        averageGrade: calculateAverageGrade(u.grades),
        attendanceRate: calculateAttendanceRate(u.attendance),
        score: calculateScore(u)
    })).sort((a, b) => b.score - a.score);
}

function calculateAverageGrade(grades) {
    if (!grades || Object.keys(grades).length === 0) return 0;
    let total = 0, count = 0;
    Object.values(grades).forEach(subjectGrades => {
        subjectGrades.forEach(grade => {
            total += grade;
            count++;
        });
    });
    return count > 0 ? total / count : 0;
}

function calculateAttendanceRate(attendance) {
    if (!attendance || attendance.length === 0) return 0;
    return (attendance.filter(a => a.status === 'present').length / attendance.length) * 100;
}

function calculateScore(user) {
    // Placeholder: Define scoring logic (e.g., based on grades and attendance)
    return calculateAverageGrade(user.grades) * 0.7 + calculateAttendanceRate(user.attendance) * 0.3;
}

function getGradeClass(grade) {
    // Placeholder: Define grade classes (e.g., based on thresholds)
    if (grade >= 4) return 'grade-a';
    if (grade >= 3) return 'grade-b';
    return 'grade-c';
}

function getAttendanceStatus(status) {
    // Placeholder: Map attendance status to text
    const statusMap = {
        'present': 'Keldi',
        'absent': 'Kelmadi',
        'late': 'Kechikdi'
    };
    return statusMap[status] || status;
}

function openModal(modalId) {
    // Placeholder: Show the modal (e.g., remove 'hidden' class)
    document.getElementById(modalId).classList.remove('hidden');
}

function closeModal(modalId) {
    // Placeholder: Hide the modal (e.g., add 'hidden' class)
    document.getElementById(modalId).classList.add('hidden');
}

function logout() {
    // Placeholder: Clear current user and redirect
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// Schedule Functions
function openSchedule() {
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
    const subjects = ['Algebra', 'Geometriya', 'Fizika', 'Kimyo', 'Biologiya', 'Tarix', 'Ingliz tili', 'Ona tili', 'Informatika', 'Adabiyot'];

    let html = `
        <table class="responsive-table w-full">
            <thead>
                <tr>
                    <th class="p-3 text-left">Vaqt</th>
                    ${days.map(day => `<th class="p-3 text-left">${day}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
    `;

    timeSlots.forEach((slot, timeIndex) => {
        html += `
            <tr class="border-b border-themed hover:bg-themed-hover transition-colors">
                <td class="p-3 font-medium text-blue-400 whitespace-nowrap">${slot}</td>
                ${days.map(() => {
            const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];
            return `<td class="p-3 text-sm text-main">${randomSubject}</td>`;
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

// Update dashboard with realistic next lesson info
function updateNextLessonInfo() {
    const subjects = ['Algebra', 'Geometriya', 'Fizika', 'Kimyo', 'Biologiya', 'Tarix'];
    const times = ['08:00 - 08:45', '08:55 - 09:40', '10:00 - 10:45'];

    const infoElement = document.getElementById('nextLessonInfo');
    if (infoElement) {
        const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];
        const randomTime = times[Math.floor(Math.random() * times.length)];
        infoElement.innerHTML = `${Math.floor(Math.random() * 3) + 1}. ${randomSubject}`;
        infoElement.nextElementSibling.textContent = randomTime;
    }
}

// Call updateNextLessonInfo on load
const originalLoadStudentData = loadStudentData;
loadStudentData = function () {
    originalLoadStudentData();
    updateNextLessonInfo();
};

// Tab switching functionality
function showTab(tabName) {
    // Hide all tabs
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.add('hidden'));

    // Show selected tab
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.classList.remove('hidden');
    }

    // Update active button state
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => {
        // Simple heuristic: check if button text or onclick matches
        if (btn.getAttribute('onclick').includes(tabName)) {
            btn.classList.add('bg-blue-600', 'text-white');
            btn.classList.remove('text-gray-300');
        } else {
            btn.classList.remove('bg-blue-600', 'text-white');
            btn.classList.add('text-gray-300');
        }
    });

    // Specific logic for tabs
    if (tabName === 'events') {
        loadEventsForStudent();
    } else if (tabName === 'videos') {
        // filterVideos('all'); // Optional: refresh videos
    }
}

function loadEventsForStudent() {
    const events = JSON.parse(localStorage.getItem('weekendEvents')) || [];

    console.log('Student: Loading events from localStorage:', events);
    const container = document.getElementById('studentEventsGrid');
    if (!container) {
        console.error('Student: studentEventsGrid container not found!');
        return;
    }

    container.innerHTML = '';

    if (events.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-center py-4 col-span-full">Hozircha tadbirlar mavjud emas</p>';
        return;
    }

    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const icons = {
        movie: '🎬',
        concert: '🎵',
        park: '🌳',
        mountain: '🏔️',
        other: '✨'
    };

    events.forEach(event => {
        const isJoined = event.participants && event.participants.includes(currentUser.id);
        const eventCard = `
            <div class="card-hover p-4 flex flex-col h-full bg-card border border-themed rounded-xl">
                <div class="flex items-center space-x-3 mb-3">
                    <span class="text-3xl">${icons[event.category] || '✨'}</span>
                    <div class="flex-1">
                        <h3 class="font-bold text-main">${event.title}</h3>
                        <p class="text-[10px] text-muted">${new Date(event.date).toLocaleDateString('uz-UZ', { month: 'long', day: 'numeric', weekday: 'long' })}</p>
                    </div>
                </div>
                <p class="text-[11px] text-muted mb-4 flex-1 line-clamp-2">${event.description || 'Batafsil ma\'lumot yo\'q'}</p>
                <div class="flex justify-between items-center mt-auto pt-4 border-t border-themed">
                    <span class="text-[10px] font-medium px-2 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
                        ${event.participants ? event.participants.length : 0} kishi bormoqda
                    </span>
                    <button onclick="joinEvent(${event.id})" 
                            class="px-3 py-1.5 text-[10px] rounded-lg transition-all ${isJoined ? 'bg-gray-600 cursor-default grayscale opacity-70' : 'primary hover:scale-105'}">
                        ${isJoined ? "✅ Ro'yxatdan o'tdingiz" : "Bormoqchiman →"}
                    </button>
                </div>
            </div>
            `;
        container.innerHTML += eventCard;
    });
}


function joinEvent(eventId) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    const events = JSON.parse(localStorage.getItem('weekendEvents')) || [];
    const eventIndex = events.findIndex(e => e.id === eventId);


    if (eventIndex === -1) return;

    if (!events[eventIndex].participants) events[eventIndex].participants = [];

    if (events[eventIndex].participants.includes(currentUser.id)) {
        showNotification('Siz allaqachon ro\'yxatdan o\'tgansiz!', 'info');
        return;
    }

    events[eventIndex].participants.push(currentUser.id);
    localStorage.setItem('weekendEvents', JSON.stringify(events));
    if (typeof weekendEvents !== 'undefined') weekendEvents = events;

    showNotification('Siz muvaffaqiyatli ro\'yxatdan o\'tdingiz!', 'success');
    loadEventsForStudent();
}

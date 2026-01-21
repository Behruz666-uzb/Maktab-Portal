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

    // Profil ma'lumotlari
    document.getElementById('profileName').value = user.name || '';
    document.getElementById('profileUsername').value = user.username || '';
    document.getElementById('profileClass').value = getClassName(user.class) || '';
    document.getElementById('profileCoins').value = user.coins || 0;

    if (user.avatar) {
        document.getElementById('userAvatar').src = user.avatar;
        document.getElementById('profileAvatar').src = user.avatar;
    } else {
        document.getElementById('userAvatar').style.display = 'none';
        document.getElementById('profileAvatar').style.display = 'none';
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

    // Davomat
    const attendanceRate = user.attendance && user.attendance.length > 0 ?
        Math.round((user.attendance.filter(a => a.status === 'present').length / user.attendance.length) * 100) : 0;
    document.getElementById('attendanceRate').textContent = attendanceRate + '%';

    // Reyting
    const rankings = calculateRankings();
    const rank = rankings.findIndex(r => r.id === user.id) + 1 || 1;
    document.getElementById('studentRank').textContent = '#' + rank;
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
    const container = document.getElementById('videoLessonsContainer');
    container.innerHTML = '';

    if (activeLessons.length === 0) {
        container.innerHTML = `
            <div class="text-center py-8">
                <p class="text-gray-400 text-lg">Hozircha aktiv video darslar mavjud emas</p>
                <p class="text-gray-500 text-sm mt-2">O'qituvchi video dars boshlaganda bu yerda paydo bo'ladi</p>
            </div>
        `;
        return;
    }

    activeLessons.forEach(lesson => {
        const videoLessonCard = `
            <div class="bg-card border-2 border-green-500 rounded-xl p-6 shadow-lg card-hover">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="text-xl font-semibold text-green-600 dark:text-green-400">🎥 ${lesson.title}</h3>
                        <p class="text-sm text-gray-500 dark:text-gray-300">${getSubjectName(lesson.subject)} | ${lesson.teacherName}</p>
                    </div>
                    <span class="bg-green-600 px-3 py-1 rounded-full text-sm text-white">
                        🔴 Jonli
                    </span>
                </div>
                
                <div class="mb-4">
                    <p class="text-sm text-gray-500 dark:text-gray-300 mb-2">Dars linki:</p>
                    <div class="flex space-x-2">
                        <input type="text" value="${lesson.link}" 
                               class="flex-1 bg-themed-hover border border-themed rounded-lg px-4 py-2 text-main" readonly>
                        <button onclick="copyLessonLink('${lesson.link}')" 
                                class="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors text-white">
                            Nusxalash
                        </button>
                    </div>
                </div>

                <div class="grid grid-cols-2 gap-4 text-xs text-gray-500 dark:text-gray-300 mb-4">
                    <div>
                        <p>📅 Boshlangan: ${new Date(lesson.startTime).toLocaleString()}</p>
                        <p>👥 Qatnashchilar: ${lesson.participants ? lesson.participants.length : 0}</p>
                    </div>
                    <div>
                        <p>🏫 Sinf: ${getClassName(lesson.class)}</p>
                        <p>👨‍🏫 O'qituvchi: ${lesson.teacherName}</p>
                    </div>
                </div>

                <button onclick="joinVideoLesson('${lesson.link}')" 
                        class="w-full bg-green-600 hover:bg-green-700 py-3 rounded-lg font-semibold transition-colors text-white flex items-center justify-center space-x-2">
                    <span>🎥 Video Darsga Qo'shilish</span>
                </button>
            </div>
        `;
        container.innerHTML += videoLessonCard;
    });

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
    // Baholar jadvali
    const gradesTable = document.getElementById('gradesTable');
    if (user.grades && Object.keys(user.grades).length > 0) {
        let tableHtml = `
            <table class="responsive-table w-full">
                <thead>
                    <tr class="bg-card border-b border-themed">
                        <th class="p-3 text-main">Fan</th>
                        <th class="p-3 text-main">Baholar</th>
                        <th class="p-3 text-main">O'rtacha</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-themed">
        `;

        Object.entries(user.grades).forEach(([subject, grades]) => {
            const average = (grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(1);
            tableHtml += `
                <tr class="bg-themed-hover transition-colors">
                    <td class="p-3 text-main">${getSubjectName(subject)}</td>
                    <td class="p-3 text-gray-600 dark:text-gray-300">${grades.join(', ')}</td>
                    <td class="p-3 font-semibold grade-${getGradeClass(average)}">${average}</td>
                </tr>
            `;
        });

        tableHtml += '</tbody></table>';
        gradesTable.innerHTML = tableHtml;
    } else {
        gradesTable.innerHTML = '<p class="text-gray-500 dark:text-gray-400 text-center py-4">Hali baholar mavjud emas</p>';
    }


    // Davomat kalendari
    const attendanceCalendar = document.getElementById('attendanceCalendar');
    attendanceCalendar.innerHTML = '';

    if (user.attendance && user.attendance.length > 0) {
        user.attendance.forEach((attendance, index) => {
            const dayElement = document.createElement('div');
            // Simplified class assignment for theme support
            let bgClass = 'bg-themed-hover text-gray-500 dark:text-gray-400';
            if (attendance.status === 'present') bgClass = 'attendance-present text-white';
            else if (attendance.status === 'absent') bgClass = 'attendance-absent text-white';
            else if (attendance.status === 'late') bgClass = 'attendance-late text-white';

            dayElement.className = `w-8 h-8 rounded flex items-center justify-center text-xs transition-colors shadow-sm ${bgClass}`;
            dayElement.textContent = index + 1;
            dayElement.title = `${attendance.date}: ${getAttendanceStatus(attendance.status)}`;
            attendanceCalendar.appendChild(dayElement);
        });
    } else {
        attendanceCalendar.innerHTML = '<p class="text-gray-500 dark:text-gray-400 text-center py-4">Hali davomat ma\'lumotlari mavjud emas</p>';
    }

}

function loadRankings() {
    const rankings = calculateRankings();
    const user = getCurrentUser();
    const userClass = user.class;

    // Faqat o'quvchining sinfidagilarni filtrlash
    const classRankings = rankings.filter(r => r.class === userClass);

    const rankingList = document.getElementById('rankingList');
    rankingList.innerHTML = '';

    if (classRankings.length === 0) {
        rankingList.innerHTML = '<p class="text-gray-400 text-center py-4">Hali reyting ma\'lumotlari mavjud emas</p>';
        return;
    }

    classRankings.forEach((student, index) => {
        const isCurrentUser = student.id === user.id;
        const rankCard = `
            <div class="flex items-center justify-between p-4 rounded-lg border border-themed shadow-sm ${isCurrentUser ? 'bg-blue-600 text-white' : 'bg-card text-main'
            }">
                <div class="flex items-center space-x-4">
                    <div class="w-8 h-8 rounded-full bg-themed-hover flex items-center justify-center font-semibold text-main">
                        ${index + 1}
                    </div>
                    <div>
                        <p class="font-semibold">${student.name}</p>
                        <p class="text-sm ${isCurrentUser ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}">O'rtacha: ${student.averageGrade.toFixed(1)}</p>
                    </div>
                </div>
                <div class="text-right">
                    <p class="font-semibold">${student.score.toFixed(1)} ball</p>
                    <p class="text-sm ${isCurrentUser ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}">${Math.round(student.attendanceRate)}% davomat</p>
                </div>
            </div>
        `;
        rankingList.innerHTML += rankCard;
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
        btn.className = `filter-btn px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 flex items-center space-x-2`;

        if (isActive) {
            btn.classList.add(
                'bg-blue-600',
                'text-white',
                'shadow-lg',
                'shadow-blue-500/30',
                'transform',
                'scale-105',
                'font-semibold',
                'ring-2',
                'ring-blue-600',
                'ring-offset-2',
                'ring-offset-gray-50',
                'dark:ring-offset-gray-900'
            );
        } else {
            btn.classList.add(
                'bg-gray-100',
                'dark:bg-gray-800',
                'text-gray-600',
                'dark:text-gray-400',
                'hover:bg-gray-200',
                'dark:hover:bg-gray-700',
                'hover:text-gray-900',
                'dark:hover:text-white'
            );
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

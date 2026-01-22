// Global o'zgaruvchilar
var currentUser = null;
var users = JSON.parse(localStorage.getItem('users')) || [];
var classes = JSON.parse(localStorage.getItem('classes')) || [];
var tests = JSON.parse(localStorage.getItem('tests')) || [];
var shopItems = JSON.parse(localStorage.getItem('shopItems')) || [];
var messages = JSON.parse(localStorage.getItem('messages')) || [];
var homework = JSON.parse(localStorage.getItem('homework')) || [];
var videoLessons = JSON.parse(localStorage.getItem('videoLessons')) || [];
var weekendEvents = JSON.parse(localStorage.getItem('weekendEvents')) || [];

// Dastlabki ma'lumotlarni yuklash
function initializeData() {
    // Admin hisobini yaratish
    if (!users.find(u => u.username === 'Behruz')) {
        users.push({
            id: 1,
            name: 'Behruz Admin',
            username: 'Behruz',
            password: 'b2009019',
            role: 'admin',
            coins: 1000,
            class: null,
            avatar: null,
            createdAt: new Date().toISOString()
        });
    }

    // Demo o'quvchi
    if (!users.find(u => u.username === 'ali')) {
        users.push({
            id: 2,
            name: 'Ali Valiyev',
            username: 'ali',
            password: '123456',
            role: 'student',
            coins: 500,
            class: '5a',
            avatar: null,
            grades: {
                algebra: [5, 4, 5, 5],
                geometry: [4, 4, 5, 4],
                history: [5, 5, 4, 5]
            },
            attendance: [
                { date: '2024-01-15', status: 'present' },
                { date: '2024-01-16', status: 'present' },
                { date: '2024-01-17', status: 'absent' },
                { date: '2024-01-18', status: 'present' },
                { date: '2024-01-19', status: 'late' }
            ],
            completedHomework: [],
            createdAt: new Date().toISOString()
        });
    }

    // Demo o'qituvchi
    if (!users.find(u => u.username === 'teacher')) {
        users.push({
            id: 3,
            name: 'Dilshod O\'qituvchi',
            username: 'teacher',
            password: '123456',
            role: 'teacher',
            coins: 800,
            class: '5a',
            avatar: null,
            subject: 'algebra',
            createdAt: new Date().toISOString()
        });
    }

    // Sinflarni yaratish
    if (classes.length === 0) {
        classes = [
            { id: '5a', name: '5-A', capacity: 25, students: [2], teacher: 3 },
            { id: '5b', name: '5-B', capacity: 25, students: [], teacher: null },
            { id: '6a', name: '6-A', capacity: 25, students: [], teacher: null },
            { id: '6b', name: '6-B', capacity: 25, students: [], teacher: null },
            { id: '7a', name: '7-A', capacity: 25, students: [], teacher: null },
            { id: '7b', name: '7-B', capacity: 25, students: [], teacher: null }
        ];
    }

    // Testlarni yaratish
    if (tests.length === 0) {
        tests = [
            {
                id: 1,
                subject: 'algebra',
                title: 'Algebra - 1-mavzu',
                questions: [
                    {
                        question: "2x + 5 = 15 bo'lsa, x ning qiymati qanchaga teng?",
                        options: ["5", "10", "7.5", "8"],
                        correct: 0,
                        coins: 10
                    },
                    {
                        question: "(a + b)² ifodasini oching",
                        options: ["a² + b²", "a² + 2ab + b²", "a² - 2ab + b²", "a² + ab + b²"],
                        correct: 1,
                        coins: 15
                    },
                    {
                        question: "3x - 7 = 8 bo'lsa, x ning qiymati qancha?",
                        options: ["5", "3", "4", "6"],
                        correct: 0,
                        coins: 12
                    }
                ],
                createdBy: 3
            },
            {
                id: 2,
                subject: 'geometry',
                title: 'Geometriya - Uchburchaklar',
                questions: [
                    {
                        question: "To'g'ri burchakli uchburchakning gipotenuzasi qaysi tomondir?",
                        options: ["Eng katta tomondir", "Eng kichik tomondir", "O'rtacha tomondir", "Barcha tomondir"],
                        correct: 0,
                        coins: 8
                    },
                    {
                        question: "Teng yonli uchburchakda nechta teng tomon bor?",
                        options: ["1 ta", "2 ta", "3 ta", "4 ta"],
                        correct: 1,
                        coins: 10
                    }
                ],
                createdBy: 3
            }
        ];
    }

    // Do'kon mahsulotlari
    if (shopItems.length === 0) {
        shopItems = [
            { id: 1, name: 'AirPods Max', price: 2450, image: '🎧', category: 'electronics' },
            { id: 2, name: 'Kitob', price: 150, image: '📚', category: 'education' },
            { id: 3, name: 'Qalam', price: 50, image: '✏️', category: 'education' },
            { id: 4, name: 'Bloknot', price: 80, image: '📓', category: 'education' },
            { id: 5, name: 'Kalkulyator', price: 300, image: '🧮', category: 'education' },
            { id: 6, name: 'Telefon', price: 5000, image: '📱', category: 'electronics' },
            { id: 7, name: 'Sumka', price: 400, image: '🎒', category: 'accessories' },
            { id: 8, name: 'Soat', price: 800, image: '⌚', category: 'accessories' }
        ];
    }

    // Uy vazifalari
    if (homework.length === 0) {
        homework = [
            {
                id: 1,
                title: 'Algebra - Chiziqli tenglamalar',
                subject: 'algebra',
                description: 'Darslikdagi 45-47 betlardagi barcha misollarni yeching. Qog\'oz varag\'iga yechimlarni yozib, ertaga darsga olib keling.',
                deadline: '2024-01-20',
                class: '5a',
                createdBy: 3,
                createdAt: new Date().toISOString(),
                completed: 1,
                totalStudents: 1
            },
            {
                id: 2,
                title: 'Geometriya - Uchburchaklar',
                subject: 'geometry',
                description: 'Turli xil uchburchak turlarini o\'rganing va ularning xossalari haqida qisqacha ma\'lumot tayyorlang.',
                deadline: '2024-01-22',
                class: '5a',
                createdBy: 3,
                createdAt: new Date().toISOString(),
                completed: 0,
                totalStudents: 1
            }
        ];
    }

    // Weekend Events (Tadbirlar)
    if (weekendEvents.length === 0) {
        weekendEvents = [
            {
                id: 1,
                title: 'Cinema Day - Kung Fu Panda 4',
                date: '2024-01-20',
                category: 'movie',
                description: 'Barcha sinflar uchun kinoteatrga sayohat. Kung Fu Panda 4 filmini tomosha qilamiz.',
                participants: [2],
                createdAt: new Date().toISOString()
            },
            {
                id: 2,
                title: 'Football League',
                date: '2024-01-21',
                category: 'other',
                description: '5 va 6-sinflar o\'rtasida futbol musobaqasi.',
                participants: [],
                createdAt: new Date().toISOString()
            }
        ];
    }

    // Ma'lumotlarni saqlash
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('classes', JSON.stringify(classes));
    localStorage.setItem('tests', JSON.stringify(tests));
    localStorage.setItem('shopItems', JSON.stringify(shopItems));
    localStorage.setItem('messages', JSON.stringify(messages));
    localStorage.setItem('homework', JSON.stringify(homework));
    localStorage.setItem('videoLessons', JSON.stringify(videoLessons));
    localStorage.setItem('weekendEvents', JSON.stringify(weekendEvents));
}

// Multi-step Registration Functions
let selectedRegRole = null;

function selectRole(role) {
    selectedRegRole = role;
    document.getElementById('regRole').value = role;

    // UI Update
    document.querySelectorAll('.identity-card').forEach(card => card.classList.remove('selected'));
    const targetCard = role === 'student' ? document.getElementById('roleStudent') : document.getElementById('roleTeacher');
    if (targetCard) targetCard.classList.add('selected');

    // Enable button
    const nextBtn = document.getElementById('regNextBtn');
    if (nextBtn) {
        nextBtn.disabled = false;
        nextBtn.classList.remove('bg-gray-700', 'text-gray-400');
        nextBtn.classList.add('bg-blue-600', 'text-white', 'shadow-lg', 'shadow-blue-500/20');
    }
}

function nextRegStep() {
    if (!selectedRegRole) return;

    const s1 = document.getElementById('regStep1');
    const s2 = document.getElementById('regStep2');

    // Content update
    const subText = document.getElementById('regStep2Sub');
    if (subText) {
        subText.textContent = selectedRegRole === 'student' ? 'O\'quvchi sifatida ma\'lumotlaringizni kiriting' : 'O\'qituvchi sifatida ma\'lumotlaringizni kiriting';
    }

    // Role-specific field toggle
    const classSelection = document.getElementById('classSelection');
    const subjectSelection = document.getElementById('subjectSelection');

    if (classSelection) {
        if (selectedRegRole === 'student') {
            classSelection.classList.remove('hidden');
        } else {
            classSelection.classList.add('hidden');
        }
    }

    if (subjectSelection) {
        if (selectedRegRole === 'teacher') {
            subjectSelection.classList.remove('hidden');
        } else {
            subjectSelection.classList.add('hidden');
        }
    }

    // Animation Step 1 Exit
    s1.classList.add('fade-out');

    setTimeout(() => {
        s1.classList.add('hidden');
        s2.classList.remove('hidden');

        // Prepare Step 2 elements for cascade
        const header = document.getElementById('regStep2Header');
        const fields = document.querySelectorAll('.reg-field-item');

        // Reset states
        header.classList.remove('animate-slide-subtle', 'animate-pulse');
        header.style.opacity = '0';
        fields.forEach(f => {
            f.classList.remove('animate-slit', 'stagger-1', 'stagger-2', 'stagger-3', 'stagger-4', 'stagger-5');
            f.style.opacity = '0';
        });

        // Trigger Cascade
        setTimeout(() => {
            s2.classList.remove('opacity-0');
            header.classList.add('animate-slide-subtle');

            // Subtitle Pulse (Subtle)
            setTimeout(() => subText.classList.add('animate-pulse'), 800);

            // Staggered Fields (Geometric Slit)
            fields.forEach((field, index) => {
                field.classList.add('animate-slit', `stagger-${index + 1}`);
            });
        }, 50);
    }, 500);
}

function prevRegStep() {
    const s1 = document.getElementById('regStep1');
    const s2 = document.getElementById('regStep2');

    // Reverse Animation
    s2.classList.add('opacity-0');

    setTimeout(() => {
        s2.classList.add('hidden');
        s1.classList.remove('hidden', 'fade-out');

        // Re-trigger Step 1 Stagger
        const header = s1.querySelector('.text-center');
        const card1 = document.getElementById('roleStudent');
        const card2 = document.getElementById('roleTeacher');
        const nextBtn = document.getElementById('regNextBtn');
        const footer = s1.querySelector('.mt-6');

        [header, card1, card2, nextBtn, footer].forEach(el => {
            el.classList.remove('animate-quantum', 'animate-slide-subtle', 'stagger-1', 'stagger-2', 'stagger-3');
            el.style.opacity = '0';
        });

        setTimeout(() => {
            header.classList.add('animate-slide-subtle');
            card1.classList.add('animate-quantum', 'stagger-1');
            card2.classList.add('animate-quantum', 'stagger-2');
            nextBtn.classList.add('animate-slide-subtle', 'stagger-3');
            footer.classList.add('animate-slide-subtle', 'stagger-3');
        }, 50);
    }, 500);
}

// Form ko'rsatish funksiyalari
function showRegister() {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    // Zoom out the login form
    loginForm.classList.add('zoom-exit');

    setTimeout(() => {
        loginForm.classList.add('hidden');
        loginForm.classList.remove('zoom-exit');
        registerForm.classList.remove('hidden');

        // Reset to step 1
        const s1 = document.getElementById('regStep1');
        const s2 = document.getElementById('regStep2');
        s1.classList.remove('hidden', 'fade-out');
        s2.classList.add('hidden', 'opacity-0');

        // Apply Staggered Cinematic Entry
        const header = s1.querySelector('.text-center');
        const card1 = document.getElementById('roleStudent');
        const card2 = document.getElementById('roleTeacher');
        const nextBtn = document.getElementById('regNextBtn');
        const footer = s1.querySelector('.mt-6');

        // Clear previous animations if any
        [header, card1, card2, nextBtn, footer].forEach(el => {
            el.classList.remove('animate-quantum', 'animate-slide-subtle', 'stagger-1', 'stagger-2', 'stagger-3');
            el.style.opacity = '0';
        });

        // Trigger Animations
        setTimeout(() => {
            header.classList.add('animate-slide-subtle');
            card1.classList.add('animate-quantum', 'stagger-1');
            card2.classList.add('animate-quantum', 'stagger-2');
            nextBtn.classList.add('animate-slide-subtle', 'stagger-3');
            footer.classList.add('animate-slide-subtle', 'stagger-3');
        }, 50);

    }, 400);
}

function showLogin() {
    document.getElementById('registerForm').classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');
}

// Xabarlarni ko'rsatish
function showNotification(message, type = 'success') {
    // Eski xabarlarni olib tashlash
    const oldNotifications = document.querySelectorAll('.notification');
    oldNotifications.forEach(notification => notification.remove());

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Login funksiyasi
const loginForm = document.getElementById('loginFormElement');
if (loginForm) {
    loginForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;

        const user = users.find(u => u.username === username && u.password === password);

        if (user) {
            currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));

            showNotification('Muvaffaqiyatli kirish!', 'success');

            setTimeout(() => {
                if (user.role === 'admin') {
                    window.location.href = 'admin.html';
                } else if (user.role === 'teacher') {
                    window.location.href = 'teacher.html';
                } else {
                    window.location.href = 'student.html';
                }
            }, 1000);
        } else {
            showNotification('Login yoki parol xato!', 'error');
        }
    });
}

// Registratsiya funksiyasi
const registerForm = document.getElementById('registerFormElement');
if (registerForm) {
    registerForm.addEventListener('submit', function (e) {
        e.preventDefault();

        const name = document.getElementById('regName').value;
        const username = document.getElementById('regUsername').value;
        const password = document.getElementById('regPassword').value;
        const role = document.getElementById('regRole').value;
        const userClass = role === 'student' ? document.getElementById('regClass').value : null;
        const userSubject = role === 'teacher' ? document.getElementById('regSubject').value : null;

        // Login bandligini tekshirish
        if (users.find(u => u.username === username)) {
            showNotification('Bu login band!', 'error');
            return;
        }

        // Sinf sig'imini tekshirish
        if (role === 'student' && userClass) {
            const classStudents = users.filter(u => u.role === 'student' && u.class === userClass).length;
            const classCapacity = classes.find(c => c.id === userClass)?.capacity || 25;

            if (classStudents >= classCapacity) {
                showNotification(`Kechirasiz, ${getClassName(userClass)} sinfi to'lib ketgan! Boshqa sinf tanlang.`, 'error');
                return;
            }
        }

        // Yangi foydalanuvchi yaratish
        const newUser = {
            id: Date.now(),
            name,
            username,
            password,
            role,
            coins: role === 'teacher' ? 500 : 100,
            class: userClass,
            subject: userSubject,
            avatar: null,
            grades: {},
            attendance: [],
            completedHomework: [],
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));

        showNotification('Muvaffaqiyatli ro\'yxatdan o\'tdingiz!', 'success');

        setTimeout(() => {
            showLogin();
        }, 1500);
    });
}

// Sahifalar o'rtasida foydalanuvchi ma'lumotlarini uzatish
function getCurrentUser() {
    return JSON.parse(localStorage.getItem('currentUser'));
}

function updateCurrentUser(user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
    // users massividagi foydalanuvchini yangilash
    const index = users.findIndex(u => u.id === user.id);
    if (index !== -1) {
        users[index] = user;
        localStorage.setItem('users', JSON.stringify(users));
    }
}

// Chiqish funksiyasi
function logout() {
    localStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

// Modal funksiyalari
function openModal(modalId) {

    const modal = document.getElementById(modalId);

    if (modal) {
        modal.classList.remove('hidden');
        // document.body.style.overflow = 'hidden'; // Scroll ni to'xtatish
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto'; // Scroll ni qayta yoqish
    }
}

// Modal tashqarisiga bosganda yopish
document.addEventListener('click', function (e) {
    if (e.target.classList.contains('modal-overlay')) {
        e.target.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }
});

// Test natijalarini hisoblash
function calculateTestResult(questions, answers) {
    let correct = 0;
    let totalCoins = 0;

    questions.forEach((question, index) => {
        if (answers[index] === question.correct) {
            correct++;
            totalCoins += question.coins;
        }
    });

    return {
        correct,
        total: questions.length,
        coins: totalCoins,
        percentage: (correct / questions.length) * 100
    };
}

// O'quvchilar reytingini hisoblash
function calculateRankings() {
    const students = users.filter(u => u.role === 'student');

    return students.map(student => {
        let totalGrade = 0;
        let count = 0;

        // Baholarni hisoblash
        if (student.grades) {
            Object.values(student.grades).forEach(subjectGrades => {
                subjectGrades.forEach(grade => {
                    totalGrade += grade;
                    count++;
                });
            });
        }

        // Davomatni hisoblash
        let attendanceRate = 0;
        if (student.attendance && student.attendance.length > 0) {
            const presentDays = student.attendance.filter(a => a.status === 'present').length;
            attendanceRate = (presentDays / student.attendance.length) * 100;
        }

        const averageGrade = count > 0 ? totalGrade / count : 0;

        // Uy vazifalarini hisoblash
        const homeworkRate = student.completedHomework && homework.length > 0 ?
            (student.completedHomework.length / homework.filter(h => h.class === student.class).length) * 100 : 0;

        return {
            ...student,
            averageGrade,
            attendanceRate,
            homeworkRate,
            score: (averageGrade * 0.6) + (attendanceRate * 0.3) + (homeworkRate * 0.1)
        };
    }).sort((a, b) => b.score - a.score);
}

// Sinf nomini olish
function getClassName(classId) {
    const classNames = {
        '5a': '5-A', '5b': '5-B',
        '6a': '6-A', '6b': '6-B',
        '7a': '7-A', '7b': '7-B',
        '8a': '8-A', '8b': '8-B',
        '9a': '9-A', '9b': '9-B',
        '10a': '10-A', '10b': '10-B',
        '11a': '11-A', '11b': '11-B'
    };
    return classNames[classId] || classId;
}

// Fan nomini olish
function getSubjectName(subject) {
    const subjects = {
        'algebra': 'Algebra',
        'geometry': 'Geometriya',
        'history': 'Tarix',
        'biology': 'Biologiya',
        'chemistry': 'Kimyo',
        'physics': 'Fizika',
        'english': 'Ingliz tili',
        'russian': 'Rus tili',
        'literature': 'Adabiyot',
        'informatics': 'Informatika'
    };
    return subjects[subject] || subject;
}

// Baho rangini olish
function getGradeClass(grade) {
    if (grade >= 4.5) return 'excellent';
    if (grade >= 3.5) return 'good';
    if (grade >= 2.5) return 'satisfactory';
    return 'poor';
}

// Davomat holatini olish
function getAttendanceStatus(status) {
    const statuses = {
        'present': 'Keldi',
        'absent': 'Kelmadi',
        'late': 'Kechikdi'
    };
    return statuses[status] || status;
}

// Vaqtni formatlash
function formatTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString('uz-UZ', {
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Sana formatlash
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('uz-UZ', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Qolgan vaqtni hisoblash
function getTimeRemaining(deadline) {
    const now = new Date();
    const target = new Date(deadline);
    const diff = target - now;

    if (diff <= 0) return 'Muddat o\'tgan';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days} kun ${hours} soat`;
    return `${hours} soat`;
}

// Progress bar yaratish
function createProgressBar(percent, color = 'blue') {
    const colors = {
        blue: 'bg-blue-600',
        green: 'bg-green-600',
        red: 'bg-red-600',
        yellow: 'bg-yellow-600',
        purple: 'bg-purple-600'
    };

    return `
        <div class="w-full bg-gray-600 rounded-full h-2">
            <div class="${colors[color]} h-2 rounded-full transition-all duration-500" 
                 style="width: ${Math.min(percent, 100)}%"></div>
        </div>
    `;
}

// Ma'lumotlarni yangilash
function refreshData() {
    users = JSON.parse(localStorage.getItem('users')) || [];
    classes = JSON.parse(localStorage.getItem('classes')) || [];
    tests = JSON.parse(localStorage.getItem('tests')) || [];
    homework = JSON.parse(localStorage.getItem('homework')) || [];
    videoLessons = JSON.parse(localStorage.getItem('videoLessons')) || [];
    weekendEvents = JSON.parse(localStorage.getItem('weekendEvents')) || [];
}

// Auto-save funksiyasi
function autoSave() {
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('classes', JSON.stringify(classes));
    localStorage.setItem('tests', JSON.stringify(tests));
    localStorage.setItem('homework', JSON.stringify(homework));
    localStorage.setItem('videoLessons', JSON.stringify(videoLessons));
    localStorage.setItem('weekendEvents', JSON.stringify(weekendEvents));
}

// Har 30 soniyada ma'lumotlarni saqlash
setInterval(autoSave, 30000);

// Theme Management
const themeManager = {
    init() {
        if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
            if (!localStorage.getItem('theme')) {
                if (e.matches) {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            }
        });
    },

    toggle() {
        const isDark = document.documentElement.classList.toggle('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }
};

// Global toggle function for HTML buttons
window.toggleDarkMode = () => themeManager.toggle();

// Dastlabki ma'lumotlarni yuklash
document.addEventListener('DOMContentLoaded', function () {
    themeManager.init();
    initializeData();
    refreshData();

    // Agar foydalanuvchi allaqachon kiritilgan bo'lsa, uni sahifaga yo'naltirish
    const currentUser = getCurrentUser();
    if (currentUser && window.location.pathname.endsWith('index.html')) {
        if (currentUser.role === 'admin') {
            window.location.href = 'admin.html';
        } else if (currentUser.role === 'teacher') {
            window.location.href = 'teacher.html';
        } else {
            window.location.href = 'student.html';
        }
    }

    // Video darslarni avtomatik yangilash
    setInterval(() => {
        if (window.location.pathname.includes('admin.html') ||
            window.location.pathname.includes('student.html') ||
            window.location.pathname.includes('teacher.html')) {
            refreshData();
        }
    }, 10000); // Har 10 soniyada yangilash
});
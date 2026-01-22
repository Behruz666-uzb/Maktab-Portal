// Admin sahifasi funksiyalari
let currentEditingUser = null;

// Modal va bildirishnoma funksiyalari
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('modal-overlay');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = '';
    }
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type === 'success' ? 'success' : type === 'error' ? 'error' : 'info'}`;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000); // Remove after 3 seconds
}

// Helper functions (assuming these exist)
function getCurrentUser() {
    return JSON.parse(localStorage.getItem('currentUser')) || {};
}

function getSubjectName(subject) {
    const subjects = {
        algebra: "Algebra", geometry: "Geometriya", history: "Tarix",
        biology: "Biologiya", chemistry: "Kimyo", physics: "Fizika"
    };
    return subjects[subject] || "Noma'lum";
}

function getClassName(classId) {
    const classes = JSON.parse(localStorage.getItem('classes')) || [];
    const cls = classes.find(c => c.id === classId);
    return cls ? cls.name : "Noma'lum";
}

function updateCurrentUser(user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
}

// Page load
document.addEventListener('DOMContentLoaded', function () {
    const user = getCurrentUser();
    if (!user || user.role !== 'admin') {
        window.location.href = 'index.html';
        return;
    }

    loadAdminData();
    loadUsers();
    loadTeachers();
    loadEvents(); // Changed from loadClasses
    loadAnalytics();
    showTab('users');
});

function loadAdminData() {
    const user = getCurrentUser();

    document.getElementById('userName').textContent = user.name;
    // Coin balance removed for admin - admins don't have personal coins

    if (user.avatar) {
        document.getElementById('userAvatar').src = user.avatar;
    } else {
        document.getElementById('userAvatar').style.display = 'none';
    }

    // Umumiy statistika
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const classes = JSON.parse(localStorage.getItem('classes')) || [];

    document.getElementById('totalUsers').textContent = users.length;
    document.getElementById('totalStudents').textContent = users.filter(u => u.role === 'student').length;
    document.getElementById('totalTeachers').textContent = users.filter(u => u.role === 'teacher').length;
    document.getElementById('totalClasses').textContent = classes.length;
}

function loadUsers() {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const container = document.getElementById('usersTable');
    container.innerHTML = '';

    if (users.length === 0) {
        container.innerHTML = `
            <tr>
                <td colspan="7" class="p-4 text-center text-gray-400">
                    Hozircha foydalanuvchilar mavjud emas
                </td>
            </tr>
        `;
        return;
    }

    users.forEach(user => {
        const userRow = `
            <tr class="border-b border-themed bg-themed-hover transition-colors">

                <td class="p-3">${user.id}</td>
                <td class="p-3">
                    <div class="flex items-center space-x-3">
                        ${user.avatar ?
                `<img src="${user.avatar}" class="w-8 h-8 rounded-full">` :
                '<div class="w-8 h-8 rounded-full bg-themed-hover flex items-center justify-center">👤</div>'
            }
                        <span>${user.name}</span>
                    </div>
                </td>
                <td class="p-3">${user.username}</td>
                <td class="p-3">
                    <span class="px-2 py-1 rounded-full text-xs ${user.role === 'admin' ? 'bg-red-600' :
                user.role === 'teacher' ? 'bg-green-600' : 'bg-blue-600'
            }">
                        ${user.role}
                    </span>
                </td>
                <td class="p-3">${user.class ? getClassName(user.class) : '-'}</td>
                <td class="p-3">
                    ${user.role === 'admin' ?
                '<span class="text-gray-400">-</span>' :
                `<div class="flex items-center space-x-1">
                            <span>🪙</span>
                            <span>${user.coins || 0}</span>
                        </div>`
            }
                </td>
                <td class="p-3">
                    <div class="flex space-x-2">
                        <button onclick="editUser(${user.id})" 
                                class="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm transition-colors">
                            Tahrirlash
                        </button>
                        <button onclick="deleteUser(${user.id})" 
                                class="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm transition-colors">
                            O'chirish
                        </button>
                        ${user.role !== 'admin' ? `
                        <button onclick="impersonateUser(${user.id})" 
                                class="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-sm transition-colors">
                            Kirish
                        </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
        container.innerHTML += userRow;
    });

    document.getElementById('userSearch').addEventListener('input', function (e) {
        const searchTerm = e.target.value.toLowerCase();
        const rows = container.querySelectorAll('tr');

        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(searchTerm) ? '' : 'none';
        });
    });
}

// [Rest of the functions (loadTeachers, loadClasses, loadAnalytics, etc.) remain the same as provided]
function copyLessonLink(link) {
    navigator.clipboard.writeText(link).then(() => {
        showNotification('Link nusxalandi!', 'success');
    });
}

function joinVideoLesson(link) {
    // Video darsga qo'shilish
    window.open(link, '_blank');
    showNotification('Video darsga qo\'shildingiz!', 'success');
}

function stopVideoLesson(lessonId) {
    if (!confirm('Bu video darsni to\'xtatmoqchimisiz? Barcha qatnashchilar chiqarib yuboriladi.')) return;

    const videoLessons = JSON.parse(localStorage.getItem('videoLessons')) || [];
    const lessonIndex = videoLessons.findIndex(v => v.id === lessonId);

    if (lessonIndex !== -1) {
        videoLessons[lessonIndex].isActive = false;
        videoLessons[lessonIndex].endTime = new Date().toISOString();
        videoLessons[lessonIndex].stoppedByAdmin = true;
        localStorage.setItem('videoLessons', JSON.stringify(videoLessons));

        showNotification('Video dars to\'xtatildi!', 'success');
        loadVideoLessons();
    }
}

function showParticipants(lessonId) {
    const videoLessons = JSON.parse(localStorage.getItem('videoLessons')) || [];
    const lesson = videoLessons.find(v => v.id === lessonId);

    if (!lesson || !lesson.participants) {
        showNotification('Qatnashchilar mavjud emas', 'info');
        return;
    }

    const participantsList = lesson.participants.map(p =>
        `• ${p.name} (${new Date(p.joinTime).toLocaleTimeString()})`
    ).join('\n');

    alert(`Dars qatnashchilari:\n\n${participantsList}`);
}


function loadTeachers() {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const classes = JSON.parse(localStorage.getItem('classes')) || [];
    const videoLessons = JSON.parse(localStorage.getItem('videoLessons')) || [];
    const teachers = users.filter(u => u.role === 'teacher');

    // Header Stats
    const dirTotal = document.getElementById('dirTotalTeachers');
    const dirLive = document.getElementById('dirActiveLessons');
    const container = document.getElementById('teachersList');

    if (dirTotal) dirTotal.textContent = teachers.length;
    if (dirLive) dirLive.textContent = videoLessons.filter(v => v.isActive).length;
    if (!container) return;

    container.innerHTML = '';

    if (teachers.length === 0) {
        container.innerHTML = `
            <div class="col-span-full py-20 bg-card border border-dashed border-themed rounded-[2.5rem] flex flex-col items-center justify-center text-center px-6">
                <div class="w-24 h-24 bg-gray-50 dark:bg-gray-800 rounded-[2rem] flex items-center justify-center text-4xl mb-6 grayscale opacity-30">
                    <i class="fas fa-chalkboard-teacher"></i>
                </div>
                <h4 class="text-2xl font-black text-gray-800 dark:text-white mb-2">Hozircha Ustozlar Yo'q</h4>
                <p class="text-gray-500 text-sm max-w-sm">Maktab tizimiga yangi ustozlarni qo'shish uchun "Ustoz Qo'shish" tugmasini bosing.</p>
            </div>
        `;
        return;
    }

    const subjectConfig = {
        algebra: { icon: 'fa-calculator', color: 'text-indigo-500', bg: 'bg-indigo-500/10', glow: 'shadow-indigo-500/20' },
        geometry: { icon: 'fa-drafting-compass', color: 'text-rose-500', bg: 'bg-rose-500/10', glow: 'shadow-rose-500/20' },
        history: { icon: 'fa-landmark', color: 'text-amber-600', bg: 'bg-amber-600/10', glow: 'shadow-amber-500/20' },
        biology: { icon: 'fa-dna', color: 'text-emerald-500', bg: 'bg-emerald-500/10', glow: 'shadow-emerald-500/20' },
        chemistry: { icon: 'fa-flask', color: 'text-purple-500', bg: 'bg-purple-500/10', glow: 'shadow-purple-500/20' },
        physics: { icon: 'fa-atom', color: 'text-blue-500', bg: 'bg-blue-500/10', glow: 'shadow-blue-500/20' }
    };

    teachers.forEach(teacher => {
        const config = subjectConfig[teacher.subject] || subjectConfig.algebra;
        const isLive = videoLessons.some(v => v.isActive && v.teacherId === teacher.id);
        const teacherClass = classes.find(c => c.id === teacher.class);

        const teacherCard = `
            <div class="group relative bg-card border border-themed rounded-[2.5rem] p-8 transition-all duration-300 hover:shadow-2xl ${config.glow} flex flex-col h-full border-t-4 ${isLive ? 'border-t-emerald-500' : 'border-t-blue-500'}">
                <!-- Status Badge -->
                <div class="absolute top-4 right-8">
                    <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white dark:bg-gray-800 border border-themed shadow-xl">
                        <div class="w-2 h-2 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}"></div>
                        <span class="text-[8px] font-black uppercase tracking-widest ${isLive ? 'text-emerald-500' : 'text-gray-400'}">
                            ${isLive ? 'Jonli Darsda' : 'Oflayn'}
                        </span>
                    </div>
                </div>

                <!-- Profile Header -->
                <div class="flex items-center gap-6 mb-8">
                    <div class="relative">
                        <div class="w-20 h-20 rounded-[2rem] border-4 border-white dark:border-gray-800 overflow-hidden shadow-2xl transition-transform group-hover:scale-110">
                            <img src="${teacher.avatar || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(teacher.name) + '&background=random'}" 
                                 class="w-full h-full object-cover">
                        </div>
                        <div class="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl ${config.bg} ${config.color} flex items-center justify-center shadow-lg backdrop-blur-md border border-white/20">
                            <i class="fas ${config.icon} text-sm"></i>
                        </div>
                    </div>
                    <div class="flex-1">
                        <h4 class="text-xl font-black text-gray-800 dark:text-white line-clamp-1 group-hover:text-blue-600 transition-colors">${teacher.name}</h4>
                        <div class="flex items-center gap-2 mt-1">
                            <span class="text-[10px] font-black uppercase tracking-widest text-gray-400">${getSubjectName(teacher.subject)} Mutaxassisi</span>
                        </div>
                    </div>
                </div>

                <!-- Info Grid -->
                <div class="grid grid-cols-2 gap-4 mb-8">
                    <div class="p-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-2xl border border-themed">
                        <span class="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Biriktirilgan Sinf</span>
                        <span class="text-sm font-black text-gray-700 dark:text-gray-200">${teacherClass ? teacherClass.name : 'Mavjud emas'}</span>
                    </div>
                    <div class="p-4 bg-gray-50/50 dark:bg-gray-800/50 rounded-2xl border border-themed">
                        <span class="block text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1">Id Raqami</span>
                        <span class="text-sm font-black text-gray-700 dark:text-gray-200">#${teacher.id.toString().slice(-4)}</span>
                    </div>
                </div>

                <!-- Quick Actions -->
                <div class="flex gap-3 mt-auto">
                    <button onclick="editUser(${teacher.id})" 
                            class="flex-1 py-4 px-4 bg-white dark:bg-gray-800 border border-themed rounded-2xl font-black text-[10px] uppercase tracking-widest text-gray-600 dark:text-gray-300 hover:bg-gray-50 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-sm">
                        <i class="fas fa-edit text-blue-500"></i> Tahrirlash
                    </button>
                    <button onclick="deleteUser(${teacher.id})" 
                            class="flex-1 py-4 px-4 bg-white dark:bg-gray-800 border border-themed rounded-2xl font-black text-[10px] uppercase tracking-widest text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-all flex items-center justify-center gap-2 active:scale-95 shadow-sm">
                        <i class="fas fa-trash"></i> O'chirish
                    </button>
                </div>
            </div>
        `;

        container.innerHTML += teacherCard;
    });

    // Modal sinflar ro'yxatini to'ldirish (agar mavjud bo'lsa)
    const classSelect = document.getElementById('newTeacherClass');
    if (classSelect) {
        classSelect.innerHTML = '<option value="">Sinf tanlanmagan</option>';
        classes.forEach(cls => {
            const option = document.createElement('option');
            option.value = cls.id;
            option.textContent = cls.name;
            classSelect.appendChild(option);
        });
    }
}

// function loadClasses() is no longer used since 'Darajalar' was replaced by 'Eventlar'

function loadAnalytics() {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const classes = JSON.parse(localStorage.getItem('classes')) || [];
    const videoLessons = JSON.parse(localStorage.getItem('videoLessons')) || [];

    // 1. Role Distribution (Role Tahlili)
    const activeUsersChart = document.getElementById('activeUsersChart');
    if (activeUsersChart) {
        const studentCount = users.filter(u => u.role === 'student').length;
        const teacherCount = users.filter(u => u.role === 'teacher').length;
        const adminCount = users.filter(u => u.role === 'admin').length;
        const total = users.length || 1;

        const roles = [
            { label: 'O\'quvchilar', count: studentCount, color: 'from-blue-500 to-indigo-600', icon: 'fa-user-graduate', bgColor: 'bg-blue-500/10' },
            { label: 'O\'qituvchilar', count: teacherCount, color: 'from-emerald-500 to-teal-600', icon: 'fa-chalkboard-teacher', bgColor: 'bg-emerald-500/10' },
            { label: 'Adminlar', count: adminCount, color: 'from-rose-500 to-pink-600', icon: 'fa-user-shield', bgColor: 'bg-rose-500/10' }
        ];

        activeUsersChart.innerHTML = roles.map(role => `
            <div class="group">
                <div class="flex justify-between items-center mb-2">
                    <div class="flex items-center gap-2">
                        <div class="w-6 h-6 rounded-lg ${role.bgColor} text-[10px] flex items-center justify-center text-current opacity-70 group-hover:opacity-100 transition-opacity">
                            <i class="fas ${role.icon}"></i>
                        </div>
                        <span class="text-xs font-black text-gray-500 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white transition-colors uppercase tracking-widest">${role.label}</span>
                    </div>
                    <span class="text-sm font-black text-gray-900 dark:text-white">${role.count}</span>
                </div>
                <div class="h-2.5 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden shadow-inner">
                    <div class="h-full bg-gradient-to-r ${role.color} rounded-full transition-all duration-1000" 
                         style="width: ${(role.count / total) * 100}%"></div>
                </div>
            </div>
        `).join('');
    }

    // 2. Class Performance (Sinfiy Ko'rsatkichlar)
    const classesChart = document.getElementById('classesChart');
    if (classesChart) {
        classesChart.innerHTML = '';
        classes.forEach(cls => {
            const classStudents = users.filter(u => u.role === 'student' && u.class === cls.id);
            const percent = Math.min(((classStudents.length / cls.capacity) * 100), 100).toFixed(0);

            classesChart.innerHTML += `
                <div class="bg-gray-50/50 dark:bg-gray-800/50 border border-themed border-dashed rounded-3xl p-5 hover:border-emerald-500/50 transition-all">
                    <div class="flex justify-between items-start mb-6">
                        <div>
                            <span class="block text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1">Sinf</span>
                            <h4 class="text-xl font-black text-gray-900 dark:text-white">${cls.name}</h4>
                        </div>
                        <div class="w-10 h-10 rounded-full border-2 border-emerald-500/20 flex items-center justify-center text-[10px] font-black text-emerald-500">
                            ${percent}%
                        </div>
                    </div>
                    <div class="flex items-center justify-between text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">
                        <span>Sig'im: ${cls.capacity}</span>
                        <span class="text-emerald-500">${classStudents.length} o'quvchi</span>
                    </div>
                </div>
            `;
        });
    }

    // 3. School Pulse (Oxirgi Faollik Timeline)
    const recentActivity = document.getElementById('recentActivity');
    if (recentActivity) {
        const activities = [];

        // Live Lessons
        videoLessons.filter(v => v.isActive).slice(-5).forEach(lesson => {
            activities.push({
                title: 'Jonli Dars Boshlandi',
                desc: `${lesson.title} fani bo'yicha dars hozirda faol`,
                time: new Date(lesson.startTime).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' }),
                icon: 'fa-video',
                color: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400',
                meta: 'Live Now'
            });
        });

        // Add dummy data if needed to populate the pulse
        activities.push(
            { title: 'Yangi Test Yaratildi', desc: 'Algebra fani bo\'yicha yakuniy nazorat testi sistemaning markaziga yuklandi.', time: '10:45', icon: 'fa-file-invoice', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400', meta: 'Homework' },
            { title: 'Reyting Yangilandi', desc: 'Haftalik o\'quvchilar reytingi avtomatik tarzda qayta hisoblandi va e\'lon qilindi.', time: '09:30', icon: 'fa-trophy', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400', meta: 'Updates' },
            { title: 'Tizimga Kirish', desc: 'Administrator tomonidan tizimga yangi o\'qituvchi profil qo\'shildi va tasdiqlandi.', time: '08:15', icon: 'fa-user-plus', color: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400', meta: 'Security' }
        );

        recentActivity.innerHTML = `
            <div class="absolute left-[7px] top-2 bottom-6 w-0.5 bg-themed"></div>
            ${activities.map(activity => `
                <div class="relative pl-8 group">
                    <div class="absolute left-[-4px] top-1 w-4 h-4 rounded-full border-4 border-white dark:border-gray-900 bg-themed group-hover:scale-125 group-hover:bg-purple-500 transition-all z-10"></div>
                    <div class="bg-gray-50/50 dark:bg-gray-800/50 border border-themed rounded-2xl p-4 group-hover:shadow-lg transition-all">
                        <div class="flex justify-between items-start mb-2">
                            <div class="flex items-center gap-3">
                                <div class="w-8 h-8 rounded-lg ${activity.color} flex items-center justify-center text-xs">
                                    <i class="fas ${activity.icon}"></i>
                                </div>
                                <div>
                                    <h5 class="text-sm font-black text-gray-900 dark:text-white">${activity.title}</h5>
                                    <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">${activity.meta}</p>
                                </div>
                            </div>
                            <span class="text-[10px] font-black text-gray-400">${activity.time}</span>
                        </div>
                        <p class="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">${activity.desc}</p>
                    </div>
                </div>
            `).join('')}
        `;
    }
}

// Modal funksiyalari
document.getElementById('addTeacherForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const name = document.getElementById('newTeacherName').value;
    const username = document.getElementById('newTeacherUsername').value;
    const password = document.getElementById('newTeacherPassword').value;
    const subject = document.getElementById('newTeacherSubject').value;
    const classId = document.getElementById('newTeacherClass').value;

    // Login bandligini tekshirish
    const users = JSON.parse(localStorage.getItem('users')) || [];
    if (users.find(u => u.username === username)) {
        showNotification('Bu login band!', 'error');
        return;
    }

    // Yangi o'qituvchi yaratish
    const newTeacher = {
        id: Date.now(),
        name,
        username,
        password,
        role: 'teacher',
        coins: 500,
        class: classId || null,
        subject: subject,
        avatar: null,
        createdAt: new Date().toISOString()
    };

    users.push(newTeacher);
    localStorage.setItem('users', JSON.stringify(users));

    // Agar sinf tanlangan bo'lsa, sinfni yangilash
    if (classId) {
        const classes = JSON.parse(localStorage.getItem('classes')) || [];
        const classIndex = classes.findIndex(c => c.id === classId);
        if (classIndex !== -1) {
            classes[classIndex].teacher = newTeacher.id;
            localStorage.setItem('classes', JSON.stringify(classes));
        }
    }

    showNotification('O\'qituvchi muvaffaqiyatli qo\'shildi!', 'success');
    closeModal('addTeacherModal');
    loadTeachers();
    this.reset();
});


// addClassForm listener removed as the modal no longer exists

// addClassForm listener removed as the modal no longer exists

function editUser(userId) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.id === userId);

    if (!user) return;

    currentEditingUser = user;

    document.getElementById('editUserId').value = user.id;
    document.getElementById('editUserName').value = user.name;
    document.getElementById('editUserUsername').value = user.username;
    document.getElementById('editUserRole').value = user.role;
    document.getElementById('editUserCoins').value = user.coins || 0;

    // Sinf tanlovini sozlash
    const classContainer = document.getElementById('editUserClassContainer');
    const classSelect = document.getElementById('editUserClass');

    if (user.role === 'student' || user.role === 'teacher') {
        classContainer.style.display = 'block';

        // Sinflar ro'yxatini to'ldirish
        const classes = JSON.parse(localStorage.getItem('classes')) || [];
        classSelect.innerHTML = '<option value="">Sinf tanlanmagan</option>';
        classes.forEach(cls => {
            const option = document.createElement('option');
            option.value = cls.id;
            option.textContent = cls.name;
            if (user.class === cls.id) option.selected = true;
            classSelect.appendChild(option);
        });
    } else {
        classContainer.style.display = 'none';
    }

    openModal('editUserModal');
}

// Rollar o'zgarganda sinf maydonini ko'rsatish/yashirish
document.addEventListener('DOMContentLoaded', function () {
    const editUserRole = document.getElementById('editUserRole');
    if (editUserRole) {
        editUserRole.addEventListener('change', function () {
            const classContainer = document.getElementById('editUserClassContainer');
            if (this.value === 'student' || this.value === 'teacher') {
                classContainer.style.display = 'block';
                // Agar sinflar ro'yxati bo'sh bo'lsa (masalan birinchi marta o'zgartirilayotgan bo'lsa)
                const classSelect = document.getElementById('editUserClass');
                if (classSelect.options.length <= 1) {
                    const classes = JSON.parse(localStorage.getItem('classes')) || [];
                    classSelect.innerHTML = '<option value="">Sinf tanlanmagan</option>';
                    classes.forEach(cls => {
                        const option = document.createElement('option');
                        option.value = cls.id;
                        option.textContent = cls.name;
                        classSelect.appendChild(option);
                    });
                }
            } else {
                classContainer.style.display = 'none';
            }
        });
    }
});

document.getElementById('editUserForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const userId = parseInt(document.getElementById('editUserId').value);
    const name = document.getElementById('editUserName').value;
    const username = document.getElementById('editUserUsername').value;
    const role = document.getElementById('editUserRole').value;
    const coins = parseInt(document.getElementById('editUserCoins').value);
    const userClass = document.getElementById('editUserClass').value;

    const users = JSON.parse(localStorage.getItem('users')) || [];
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex === -1) return;

    // Login bandligini tekshirish (o'zidan boshqalar bilan)
    const existingUser = users.find(u => u.username === username && u.id !== userId);
    if (existingUser) {
        showNotification('Bu login band!', 'error');
        return;
    }

    // Foydalanuvchini yangilash
    users[userIndex].name = name;
    users[userIndex].username = username;
    users[userIndex].role = role;
    users[userIndex].coins = coins;

    if (role === 'student' || role === 'teacher') {
        users[userIndex].class = userClass;
    } else {
        users[userIndex].class = null;
    }

    localStorage.setItem('users', JSON.stringify(users));

    // Agar joriy foydalanuvchi o'zini yangilagan bo'lsa
    const currentUser = getCurrentUser();
    if (currentUser.id === userId) {
        updateCurrentUser(users[userIndex]);
        loadAdminData();
    }

    showNotification('Foydalanuvchi muvaffaqiyatli yangilandi!', 'success');
    closeModal('editUserModal');
    loadUsers();
    loadTeachers();
    loadClasses();
});

function deleteUser(userId) {
    if (!confirm('Foydalanuvchini o\'chirishni xohlaysizmi?')) return;

    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.id === userId);

    if (user.role === 'admin') {
        showNotification('Admin foydalanuvchini o\'chirib bo\'lmaydi!', 'error');
        return;
    }

    const updatedUsers = users.filter(u => u.id !== userId);
    localStorage.setItem('users', JSON.stringify(updatedUsers));

    // Agar o'qituvchi o'chirilgan bo'lsa, sinflardan ham o'chirish
    if (user.role === 'teacher') {
        const classes = JSON.parse(localStorage.getItem('classes')) || [];
        classes.forEach(cls => {
            if (cls.teacher === userId) {
                cls.teacher = null;
            }
        });
        localStorage.setItem('classes', JSON.stringify(classes));
    }

    showNotification('Foydalanuvchi o\'chirildi!', 'success');
    loadUsers();
    loadTeachers();
    loadClasses();
    loadAnalytics();
}

function impersonateUser(userId) {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const user = users.find(u => u.id === userId);

    if (!user) return;

    if (confirm(`${user.name} hisobiga kirishni xohlaysizmi?`)) {
        localStorage.setItem('currentUser', JSON.stringify(user));

        if (user.role === 'teacher') {
            window.location.href = 'teacher.html';
        } else if (user.role === 'student') {
            window.location.href = 'student.html';
        }
    }
}

function deleteClass(classId) {
    if (!confirm('Sinfni o\'chirishni xohlaysizmi? Sinfdagi barcha o\'quvchilar sinfsiz qoladi!')) return;

    const classes = JSON.parse(localStorage.getItem('classes')) || [];
    const updatedClasses = classes.filter(c => c.id !== classId);
    localStorage.setItem('classes', JSON.stringify(updatedClasses));

    // Sinf o'quvchilarini sinfsiz qilish
    const users = JSON.parse(localStorage.getItem('users')) || [];
    users.forEach(user => {
        if (user.class === classId) {
            user.class = null;
        }
    });
    localStorage.setItem('users', JSON.stringify(users));

    showNotification('Sinf o\'chirildi!', 'success');
    loadClasses();
    loadUsers();
    loadAnalytics();
}

function exportUsers() {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const csvContent = "data:text/csv;charset=utf-8,"
        + "ID,Ism,Login,Rol,Sinf,Coin,Yaratilgan\n"
        + users.map(user =>
            `${user.id},"${user.name}","${user.username}","${user.role}","${user.class || ''}",${user.coins || 0},"${user.createdAt}"`
        ).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "foydalanuvchilar.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification('Foydalanuvchilar ro\'yxati yuklab olindi!', 'success');
}

function openCommandPanel(panelName) {
    // Hide grid
    const grid = document.getElementById('settings-grid');
    if (grid) grid.classList.add('hidden');

    // Show detail view
    const detailView = document.getElementById('command-detail-view');
    if (detailView) detailView.classList.remove('hidden');

    // Show specific panel
    document.querySelectorAll('.settings-panel').forEach(p => p.classList.add('hidden'));
    const targetPanel = document.getElementById(`panel-${panelName}`);
    if (targetPanel) targetPanel.classList.remove('hidden');

    // Initialize dirty check if not already done
    initSettingsDirtyCheck();
}

function closeCommandPanel() {
    // Hide detail view
    const detailView = document.getElementById('command-detail-view');
    if (detailView) detailView.classList.add('hidden');

    // Show grid
    const grid = document.getElementById('settings-grid');
    if (grid) grid.classList.remove('hidden');
}

function initSettingsDirtyCheck() {
    const inputs = document.querySelectorAll('#settings input, #settings select');
    inputs.forEach(input => {
        if (!input.dataset.listener) {
            input.addEventListener('input', () => {
                showFloatingSaveBar(true);
            });
            input.dataset.listener = "true";
        }
    });
}

function showFloatingSaveBar(show) {
    const bar = document.getElementById('floating-save-bar');
    if (!bar) return;

    if (show) {
        bar.classList.remove('translate-y-32', 'opacity-0');
        bar.classList.add('translate-y-0', 'opacity-100');
    } else {
        bar.classList.add('translate-y-32', 'opacity-0');
        bar.classList.remove('translate-y-0', 'opacity-100');
    }
}

function saveAllSettings() {
    const settings = {
        siteName: document.getElementById('siteName').value,
        timezone: document.getElementById('timezone').value,
        allowRegistrations: document.getElementById('allowRegistrations').checked,
        requireTeacherApproval: document.getElementById('requireTeacherApproval').checked,
        maxLessonCoins: parseInt(document.getElementById('maxLessonCoins').value),
        homeworkCoins: parseInt(document.getElementById('homeworkCoins').value)
    };

    localStorage.setItem('settings', JSON.stringify(settings));
    showNotification('Tizim parametrlari muvaffaqiyatli yangilandi!', 'success');

    // Hide bar
    showFloatingSaveBar(false);
}

function loadAllSettings() {
    const settings = JSON.parse(localStorage.getItem('settings')) || {
        siteName: 'Maktab Portali V2',
        timezone: 'Asia/Tashkent',
        allowRegistrations: true,
        requireTeacherApproval: false,
        maxLessonCoins: 10,
        homeworkCoins: 5
    };

    if (document.getElementById('siteName')) document.getElementById('siteName').value = settings.siteName;
    if (document.getElementById('timezone')) document.getElementById('timezone').value = settings.timezone;
    if (document.getElementById('allowRegistrations')) document.getElementById('allowRegistrations').checked = settings.allowRegistrations;
    if (document.getElementById('requireTeacherApproval')) document.getElementById('requireTeacherApproval').checked = settings.requireTeacherApproval;
    if (document.getElementById('maxLessonCoins')) document.getElementById('maxLessonCoins').value = settings.maxLessonCoins;
    if (document.getElementById('homeworkCoins')) document.getElementById('homeworkCoins').value = settings.homeworkCoins;
}

function revertAllSettings() {
    if (confirm('Barcha o\'zgarishlarni bekor qilmoqchimisiz?')) {
        loadAllSettings();
        showFloatingSaveBar(false);
    }
}

function resetSystem() {
    if (confirm('HAQIQATDAN HAM TIZIMNI QAYTA O\'RNATMOQCHIMISIZ? Barcha ma\'lumotlar o\'chib ketadi!')) {
        localStorage.clear();
        showNotification('Tizim qayta o\'rnatildi!', 'success');
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    }
}

// Tab funksiyalari
function showTab(tabName) {
    // Barcha tab tugmalaridan aktivlikni olib tashlash
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('bg-blue-600', 'text-white');
        btn.classList.add('text-blue-600', 'hover:text-blue-800', 'dark:text-gray-300', 'dark:hover:text-white');
    });

    // Tanlangan tab tugmasiga aktivlik qo'shish
    let targetBtn = null;
    if (window.event && window.event.target && window.event.target.classList.contains('tab-btn')) {
        targetBtn = window.event.target;
    } else {
        targetBtn = Array.from(document.querySelectorAll('.tab-btn')).find(btn =>
            btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(`'${tabName}'`)
        );
    }

    if (targetBtn) {
        targetBtn.classList.add('bg-blue-600', 'text-white');
        targetBtn.classList.remove('text-blue-600', 'hover:text-blue-800', 'dark:text-gray-300', 'dark:hover:text-white');
    }

    // Barcha tab kontentlarini yashirish
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });

    // Tanlangan tab kontentini ko'rsatish
    const selectedContent = document.getElementById(tabName);
    if (selectedContent) {
        selectedContent.classList.remove('hidden');
    }

    // Ma'lumotlarni yangilash
    if (tabName === 'analytics') {
        loadAnalytics();
    } else if (tabName === 'full-schedule') {
        loadGeneralSchedule();
    } else if (tabName === 'events') {
        loadEvents();
    } else if (tabName === 'settings') {
        loadAllSettings();
    }
}

function loadEvents() {
    const events = JSON.parse(localStorage.getItem('weekendEvents')) || [];
    const container = document.getElementById('eventsGrid');

    // Header Stats
    const statTotal = document.getElementById('statTotalEvents');
    const statUpcoming = document.getElementById('statUpcomingEvents');

    if (statTotal) statTotal.textContent = events.length;
    if (statUpcoming) {
        const today = new Date().toISOString().split('T')[0];
        statUpcoming.textContent = events.filter(e => e.date >= today).length;
    }

    if (!container) return;
    container.innerHTML = '';

    if (events.length === 0) {
        container.innerHTML = `
            <div class="col-span-full py-20 bg-card border border-dashed border-themed rounded-[2.5rem] flex flex-col items-center justify-center text-center px-6">
                <div class="w-24 h-24 bg-purple-50 dark:bg-purple-900/10 rounded-[2rem] flex items-center justify-center text-4xl mb-6 grayscale opacity-30">
                    <i class="fas fa-calendar-alt text-purple-600"></i>
                </div>
                <h4 class="text-2xl font-black text-gray-800 dark:text-white mb-2">Tadbirlar Mavjud Emas</h4>
                <p class="text-gray-500 text-sm max-w-sm">Maktab hayotini qiziqarli qilish uchun birinchi tadbirni e'lon qiling!</p>
            </div>
        `;
        return;
    }

    const categoryConfig = {
        movie: { icon: 'fa-film', label: 'Kino', color: 'from-blue-500 to-indigo-600', glow: 'shadow-blue-500/20' },
        concert: { icon: 'fa-music', label: 'Konsert', color: 'from-purple-500 to-pink-600', glow: 'shadow-purple-500/20' },
        park: { icon: 'fa-tree', label: 'Sayohat', color: 'from-emerald-500 to-teal-600', glow: 'shadow-emerald-500/20' },
        mountain: { icon: 'fa-mountain', label: 'Tog\'', color: 'from-orange-500 to-amber-600', glow: 'shadow-orange-500/20' },
        other: { icon: 'fa-star', label: 'Boshqa', color: 'from-slate-500 to-slate-700', glow: 'shadow-slate-500/20' }
    };

    // Sort events by date (newest first)
    events.sort((a, b) => new Date(a.date) - new Date(b.date));

    events.forEach(event => {
        const config = categoryConfig[event.category] || categoryConfig.other;
        const participantCount = event.participants ? event.participants.length : 0;
        const eventDate = new Date(event.date);
        const day = eventDate.getDate();
        const month = eventDate.toLocaleDateString('uz-UZ', { month: 'short' }).toUpperCase();

        const eventCard = `
            <div class="group relative bg-card border border-themed rounded-[2.5rem] p-8 transition-all duration-300 hover:shadow-2xl ${config.glow} flex flex-col h-full overflow-hidden">
                <!-- Background Decoration -->
                <div class="absolute -top-12 -right-12 w-32 h-32 bg-gradient-to-br ${config.color} opacity-[0.03] group-hover:opacity-10 rounded-full transition-opacity"></div>
                
                <!-- Category & Actions -->
                <div class="flex justify-between items-start mb-8 relative z-10">
                    <div class="flex items-center gap-3">
                        <div class="w-12 h-12 rounded-2xl bg-gradient-to-br ${config.color} text-white flex items-center justify-center shadow-lg transform group-hover:rotate-12 transition-transform">
                            <i class="fas ${config.icon} text-lg"></i>
                        </div>
                        <div>
                            <span class="block text-[8px] font-black uppercase tracking-widest text-gray-400">Yo'nalish</span>
                            <span class="text-xs font-black text-gray-800 dark:text-white uppercase tracking-wider">${config.label}</span>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="editEvent(${event.id})" class="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 border border-themed text-gray-400 hover:text-blue-500 hover:border-blue-500/30 transition-all">
                            <i class="fas fa-edit text-xs"></i>
                        </button>
                        <button onclick="deleteEvent(${event.id})" class="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 border border-themed text-gray-400 hover:text-rose-500 hover:border-rose-500/30 transition-all">
                            <i class="fas fa-trash text-xs"></i>
                        </button>
                    </div>
                </div>

                <!-- Date Ribbon Overlay -->
                <div class="absolute top-24 right-0 transform translate-x-2">
                    <div class="bg-card border border-themed rounded-l-2xl py-3 px-4 shadow-xl flex flex-col items-center min-w-[60px]">
                        <span class="text-2xl font-black text-gray-800 dark:text-white leading-none">${day}</span>
                        <span class="text-[9px] font-black text-blue-500 uppercase tracking-widest mt-1">${month}</span>
                    </div>
                </div>

                <!-- Content -->
                <div class="relative z-10 mb-8 pr-12">
                    <h3 class="text-xl font-black text-gray-900 dark:text-white mb-3 group-hover:text-purple-600 transition-colors line-clamp-2">${event.title}</h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 leading-relaxed">
                        ${event.description || 'Tadbir haqida batafsil ma\'lumot berilmagan. Qatnashish uchun ro\'yxatdan o\'ting.'}
                    </p>
                </div>

                <!-- Social Proof Footer -->
                <div class="mt-auto pt-6 border-t border-themed flex items-center justify-between relative z-10">
                    <div class="flex flex-col">
                        <span class="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Ishtirokchilar</span>
                        <div class="flex items-center gap-2">
                            <div class="flex -space-x-3">
                                ${Array(Math.min(3, participantCount)).fill(0).map((_, i) => `
                                    <div class="w-7 h-7 rounded-full border-2 border-white dark:border-gray-800 bg-gray-100 dark:bg-gray-700 overflow-hidden">
                                        <img src="https://ui-avatars.com/api/?name=P${i}&background=random" class="w-full h-full object-cover">
                                    </div>
                                `).join('')}
                                ${participantCount > 3 ? `<div class="w-7 h-7 rounded-full border-2 border-white dark:border-gray-800 bg-gray-50 flex items-center justify-center text-[8px] font-black text-gray-500">+${participantCount - 3}</div>` : ''}
                                ${participantCount === 0 ? '<div class="text-[10px] font-bold text-gray-300 italic">Hali hech kim yo\'q</div>' : ''}
                            </div>
                            ${participantCount > 0 ? `<span class="text-xs font-black text-purple-600 dark:text-purple-400 ml-1">${participantCount} kishi</span>` : ''}
                        </div>
                    </div>
                    ${participantCount > 10 ? `
                        <div class="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-500 animate-pulse">
                            <i class="fas fa-fire-alt text-sm"></i>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        container.innerHTML += eventCard;
    });
}

function editEvent(eventId) {
    const events = JSON.parse(localStorage.getItem('weekendEvents')) || [];
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    document.getElementById('editEventId').value = event.id;
    document.getElementById('editEventTitle').value = event.title;
    document.getElementById('editEventDate').value = event.date;
    document.getElementById('editEventCategory').value = event.category;
    document.getElementById('editEventDescription').value = event.description || '';

    openModal('editEventModal');
}

// Event form listenerini bog'lash
function initEventListeners() {
    // Add Event Form
    const addEventForm = document.getElementById('addEventForm');
    if (addEventForm) {
        // Remove existing listeners by cloning (optional but safe) or just ensure this function runs once
        const newForm = addEventForm.cloneNode(true);
        addEventForm.parentNode.replaceChild(newForm, addEventForm);

        newForm.addEventListener('submit', function (e) {
            e.preventDefault();

            const title = document.getElementById('eventTitle').value;
            const date = document.getElementById('eventDate').value;
            const category = document.getElementById('eventCategory').value;
            const description = document.getElementById('eventDescription').value;

            const events = JSON.parse(localStorage.getItem('weekendEvents')) || [];
            const newEvent = {
                id: Date.now(),
                title,
                date,
                category,
                description,
                participants: [],
                createdAt: new Date().toISOString()
            };

            events.push(newEvent);
            localStorage.setItem('weekendEvents', JSON.stringify(events));

            // Global o'zgaruvchini yangilash (agar mavjud bo'lsa)
            if (window.weekendEvents) window.weekendEvents = events;

            console.log('Admin: Event saved to localStorage:', newEvent);

            showNotification('Yangi tadbir muvaffaqiyatli yaratildi!', 'success');
            closeModal('addEventModal');
            loadEvents();
            this.reset();
        });
    }

    // Edit Event Form
    const editEventForm = document.getElementById('editEventForm');
    if (editEventForm) {
        const newEditForm = editEventForm.cloneNode(true);
        editEventForm.parentNode.replaceChild(newEditForm, editEventForm);

        newEditForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const eventId = parseInt(document.getElementById('editEventId').value);
            const events = JSON.parse(localStorage.getItem('weekendEvents')) || [];
            const index = events.findIndex(e => e.id === eventId);

            if (index !== -1) {
                events[index].title = document.getElementById('editEventTitle').value;
                events[index].date = document.getElementById('editEventDate').value;
                events[index].category = document.getElementById('editEventCategory').value;
                events[index].description = document.getElementById('editEventDescription').value;

                localStorage.setItem('weekendEvents', JSON.stringify(events));
                if (window.weekendEvents) window.weekendEvents = events;

                showNotification('Tadbir muvaffaqiyatli yangilandi!', 'success');
                closeModal('editEventModal');
                loadEvents();
            }
        });
    }
}

// Sahifa yuklanganda listenerlarni ishga tushirish
document.addEventListener('DOMContentLoaded', initEventListeners);

function deleteEvent(eventId) {
    if (!confirm('Ushbu tadbirni o\'chirishni xohlaysizmi?')) return;

    weekendEvents = weekendEvents.filter(e => e.id !== eventId);
    localStorage.setItem('weekendEvents', JSON.stringify(weekendEvents));

    showNotification('Tadbir o\'chirildi!', 'success');
    loadEvents();
}

function loadGeneralSchedule() {
    const container = document.getElementById('schoolScheduleGrid');
    if (!container) return;

    const classes = JSON.parse(localStorage.getItem('classes')) || [];
    const timeSlots = [
        '08:00 - 08:45',
        '08:55 - 09:40',
        '10:00 - 10:45',
        '10:55 - 11:40',
        '12:00 - 12:45',
        '12:55 - 13:40'
    ];

    const subjects = ['Algebra', 'Geometriya', 'Tarix', 'Biologiya', 'Kimyo', 'Fizika', 'Ingliz tili', 'Ona tili', 'Adabiyot', 'Informatika'];

    if (classes.length === 0) {
        container.innerHTML = '<p class="text-center text-muted py-8">Hozircha sinflar mavjud emas</p>';
        return;
    }

    let html = `
        <table class="responsive-table w-full">
            <thead>
                <tr>
                    <th class="p-4 text-left">Vaqt</th>
                    ${classes.map(cls => `<th class="p-4 text-left">${cls.name}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
    `;

    timeSlots.forEach(slot => {
        html += `
            <tr class="border-b border-themed hover:bg-themed-hover transition-colors">
                <td class="p-4 font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">${slot}</td>
                ${classes.map(() => {
            const subject = subjects[Math.floor(Math.random() * subjects.length)];
            return `
                        <td class="p-4">
                            <div class="font-medium text-main">${subject}</div>
                        </td>
                    `;
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

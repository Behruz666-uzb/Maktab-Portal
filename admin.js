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
    document.getElementById('coinBalance').textContent = user.coins;

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
                    <div class="flex items-center space-x-1">
                        <span>🪙</span>
                        <span>${user.coins || 0}</span>
                    </div>
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
                                class="bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded text-sm transition-colors">
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
    const teachers = users.filter(u => u.role === 'teacher');
    const container = document.getElementById('teachersList');
    container.innerHTML = '';

    if (teachers.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-center py-4">Hozircha o\'qituvchilar mavjud emas</p>';
        return;
    }

    // O'qituvchilar ro'yxatini yangilash
    const teacherSelect = document.getElementById('newClassTeacher');
    if (teacherSelect) {
        teacherSelect.innerHTML = '<option value="">Sinf rahbarisiz</option>';
    }

    teachers.forEach(teacher => {
        const teacherCard = `
            <div class="flex items-center justify-between p-4 bg-card border border-themed rounded-lg shadow-sm">
                <div class="flex items-center space-x-4">
                    ${teacher.avatar ?
                `<img src="${teacher.avatar}" class="w-12 h-12 rounded-full">` :
                '<div class="w-12 h-12 rounded-full bg-themed-hover flex items-center justify-center">👤</div>'
            }
                    <div>
                        <h4 class="font-semibold">${teacher.name}</h4>
                        <p class="text-sm text-gray-500 dark:text-gray-400">
                            ${teacher.subject ? getSubjectName(teacher.subject) : 'Fan belgilanmagan'} | 
                            ${teacher.class ? getClassName(teacher.class) : 'Sinf belgilanmagan'}
                        </p>
                    </div>
                </div>
                <div class="flex space-x-2">
                    <button onclick="editUser(${teacher.id})" 
                            class="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm transition-colors text-white">
                        Tahrirlash
                    </button>
                    <button onclick="deleteUser(${teacher.id})" 
                            class="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm transition-colors text-white">
                        O'chirish
                    </button>
                </div>
            </div>
        `;

        container.innerHTML += teacherCard;

        container.innerHTML += teacherCard;

        // Select uchun option qo'shish (agar mavjud bo'lsa)
        if (teacherSelect) {
            const option = document.createElement('option');
            option.value = teacher.id;
            option.textContent = `${teacher.name} (${teacher.subject ? getSubjectName(teacher.subject) : 'Noma\'lum'})`;
            teacherSelect.appendChild(option);
        }
    });

    // O'qituvchi qo'shish modal uchun sinflar ro'yxati
    const classSelect = document.getElementById('newTeacherClass');
    const classes = JSON.parse(localStorage.getItem('classes')) || [];
    classSelect.innerHTML = '<option value="">Sinf tanlanmagan</option>';
    classes.forEach(cls => {
        const option = document.createElement('option');
        option.value = cls.id;
        option.textContent = cls.name;
        classSelect.appendChild(option);
    });
}

// function loadClasses() is no longer used since 'Darajalar' was replaced by 'Eventlar'

function loadAnalytics() {
    const users = JSON.parse(localStorage.getItem('users')) || [];
    const classes = JSON.parse(localStorage.getItem('classes')) || [];
    const videoLessons = JSON.parse(localStorage.getItem('videoLessons')) || [];

    // Faol foydalanuvchilar chart
    const activeUsersChart = document.getElementById('activeUsersChart');
    const studentCount = users.filter(u => u.role === 'student').length;
    const teacherCount = users.filter(u => u.role === 'teacher').length;
    const adminCount = users.filter(u => u.role === 'admin').length;

    activeUsersChart.innerHTML = `
        <div class="space-y-3">
            <div class="flex justify-between items-center">
                <span class="text-gray-500 dark:text-gray-400">O'quvchilar</span>
                <div class="flex items-center space-x-2">
                    <div class="w-20 bg-themed-hover rounded-full h-3">
                        <div class="bg-blue-600 h-3 rounded-full" 
                             style="width: ${(studentCount / users.length) * 100}%"></div>
                    </div>
                    <span class="text-sm text-gray-500 dark:text-gray-400">${studentCount}</span>
                </div>
            </div>
            <div class="flex justify-between items-center">
                <span class="text-gray-500 dark:text-gray-400">O'qituvchilar</span>
                <div class="flex items-center space-x-2">
                    <div class="w-20 bg-themed-hover rounded-full h-3">
                        <div class="bg-green-600 h-3 rounded-full" 
                             style="width: ${(teacherCount / users.length) * 100}%"></div>
                    </div>
                    <span class="text-sm text-gray-500 dark:text-gray-400">${teacherCount}</span>
                </div>
            </div>
            <div class="flex justify-between items-center">
                <span class="text-gray-500 dark:text-gray-400">Adminlar</span>
                <div class="flex items-center space-x-2">
                    <div class="w-20 bg-themed-hover rounded-full h-3">
                        <div class="bg-red-600 h-3 rounded-full" 
                             style="width: ${(adminCount / users.length) * 100}%"></div>
                    </div>
                    <span class="text-sm text-gray-500 dark:text-gray-400">${adminCount}</span>
                </div>
            </div>
        </div>
    `;


    // Sinflar chart
    const classesChart = document.getElementById('classesChart');
    let classesHtml = '<div class="space-y-3">';

    classes.forEach(cls => {
        const classStudents = users.filter(u => u.role === 'student' && u.class === cls.id);
        const percent = (classStudents.length / cls.capacity) * 100;

        classesHtml += `
            <div class="flex justify-between items-center">
                <span class="text-gray-500 dark:text-gray-400">${cls.name}</span>
                <div class="flex items-center space-x-2">
                    <div class="w-16 bg-themed-hover rounded-full h-3">
                        <div class="bg-purple-600 h-3 rounded-full" 
                             style="width: ${percent}%"></div>
                    </div>
                    <span class="text-sm text-gray-500 dark:text-gray-400">${classStudents.length}</span>
                </div>
            </div>

        `;
    });

    classesHtml += '</div>';
    classesChart.innerHTML = classesHtml;

    // Oxirgi faollik
    const recentActivity = document.getElementById('recentActivity');
    const activities = [];

    // Video darslar faolligi
    const recentVideoLessons = videoLessons
        .filter(v => v.isActive)
        .slice(-3)
        .map(lesson => ({
            action: `Video dars: ${lesson.title}`,
            time: new Date(lesson.startTime).toLocaleTimeString(),
            type: 'video'
        }));

    activities.push(...recentVideoLessons);

    // Qo'shimcha faolliklar
    activities.push(
        { action: 'Yangi foydalanuvchi qo\'shildi', time: '5 daqiqa oldin', type: 'user' },
        { action: 'Test yaratildi', time: '1 soat oldin', type: 'test' },
        { action: 'Davomat saqlandi', time: '2 soat oldin', type: 'attendance' }
    );

    recentActivity.innerHTML = activities.map(activity => `
        <div class="flex items-center justify-between p-3 bg-card border border-themed rounded-lg shadow-sm">
            <div class="flex items-center space-x-3">
                <div class="w-8 h-8 rounded-full flex items-center justify-center text-white ${activity.type === 'user' ? 'bg-blue-600' :
            activity.type === 'video' ? 'bg-purple-600' : 'bg-themed-hover'
        }">
                    ${activity.type === 'user' ? '👤' :
            activity.type === 'test' ? '🧪' :
                activity.type === 'attendance' ? '✅' :
                    activity.type === 'video' ? '🎥' : '📊'}
                </div>
                <div>
                    <p class="font-medium">${activity.action}</p>
                    <p class="text-sm text-gray-500 dark:text-gray-400">${activity.time}</p>
                </div>
            </div>
        </div>
    `).join('');

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

function saveSettings() {
    const settings = {
        siteName: document.getElementById('siteName').value,
        maxClassSize: parseInt(document.getElementById('maxClassSize').value),
        allowRegistrations: document.getElementById('allowRegistrations').checked,
        maxTestCoins: parseInt(document.getElementById('maxTestCoins').value),
        attendanceCoins: parseInt(document.getElementById('attendanceCoins').value),
        initialCoins: parseInt(document.getElementById('initialCoins').value)
    };

    localStorage.setItem('settings', JSON.stringify(settings));
    showNotification('Sozlamalar saqlandi!', 'success');
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
    }
}

function loadEvents() {
    const events = JSON.parse(localStorage.getItem('weekendEvents')) || [];
    console.log('Admin: Loading events from localStorage:', events);
    const container = document.getElementById('eventsGrid');
    if (!container) {
        console.error('Admin: eventsGrid container not found!');
        return;
    }

    container.innerHTML = '';

    if (events.length === 0) {
        container.innerHTML = '<p class="text-gray-400 text-center py-4 col-span-full">Hozircha tadbirlar mavjud emas</p>';
        return;
    }

    const icons = {
        movie: '🎬',
        concert: '🎵',
        park: '🌳',
        mountain: '🏔️',
        other: '✨'
    };

    events.forEach(event => {
        const eventCard = `
            <div class="bg-card border border-themed rounded-xl p-6 shadow-sm card-hover">
                <div class="flex justify-between items-start mb-4">
                    <div class="flex items-center space-x-3">
                        <span class="text-3xl">${icons[event.category] || '✨'}</span>
                        <div>
                            <h3 class="text-xl font-semibold">${event.title}</h3>
                            <p class="text-sm text-muted">${new Date(event.date).toLocaleDateString('uz-UZ', { month: 'long', day: 'numeric', weekday: 'long' })}</p>
                        </div>
                    </div>
                </div>
                <p class="text-sm text-muted mb-4 line-clamp-2">${event.description || 'Tavsif yo\'q'}</p>
                <div class="flex justify-between items-center">
                    <span class="text-xs font-medium px-2 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
                        ${event.participants ? event.participants.length : 0} kishi qatnashmoqda
                    </span>
                    <div class="flex space-x-1">
                        <button onclick="editEvent(${event.id})" 
                                class="text-blue-500 hover:text-blue-700 transition-colors p-2">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="deleteEvent(${event.id})" 
                                class="text-red-500 hover:text-red-700 transition-colors p-2">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
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

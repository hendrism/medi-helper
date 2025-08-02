let medicines = [];
let currentMedicine = null;

function saveMedicines() {
    localStorage.setItem('medicines', JSON.stringify(medicines));
}

function loadMedicines() {
    const stored = localStorage.getItem('medicines');
    medicines = stored ? JSON.parse(stored) : [];
}

function getProgress(med) {
    let total = 0, completed = 0;
    med.schedule.forEach(day => {
        total += day.doses.length;
        completed += day.doses.filter(d => d.completed).length;
    });
    return { total, completed };
}

if (typeof document !== 'undefined') {
    document.getElementById('startDate').valueAsDate = new Date();
}

function generateDoseTimes(dosesPerDay, firstDoseTime) {
    const times = [];
    if (dosesPerDay === 1) {
        times.push(firstDoseTime || '08:00');
    } else if (dosesPerDay === 2) {
        times.push('08:00', '20:00');
    } else if (dosesPerDay === 3) {
        times.push('08:00', '14:00', '20:00');
    } else if (dosesPerDay === 4) {
        times.push('08:00', '12:00', '16:00', '20:00');
    } else if (dosesPerDay === 6) {
        times.push('08:00', '10:00', '12:00', '14:00', '16:00', '18:00');
    }
    return times;
}

function formatDate(date) {
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
    });
}

function createSchedule(id, startDate, dosesPerDay, totalDays, firstDoseTime) {
    const startDateObj = new Date(startDate);
    const doseTimes = generateDoseTimes(dosesPerDay, firstDoseTime);
    const totalDoses = dosesPerDay * totalDays;
    const schedule = [];
    let created = 0;
    let day = 0;

    while (created < totalDoses) {
        const currentDate = new Date(startDateObj);
        currentDate.setDate(startDateObj.getDate() + day);
        const daySchedule = { date: currentDate.toISOString(), doses: [] };
        for (let index = 0; index < doseTimes.length && created < totalDoses; index++) {
            const time = doseTimes[index];
            if (day === 0 && time < firstDoseTime) continue;
            daySchedule.doses.push({
                id: `${id}_day${day}_dose${daySchedule.doses.length}`,
                time,
                completed: false
            });
            created++;
        }
        schedule.push(daySchedule);
        day++;
    }
    return schedule;
}

function startTracking() {
    const name = document.getElementById('medicineName').value.trim();
    const startDate = document.getElementById('startDate').value;
    const dosesPerDay = parseInt(document.getElementById('dosesPerDay').value);
    const totalDays = parseInt(document.getElementById('totalDays').value);
    const firstDoseTime = document.getElementById('firstDoseTime').value || '08:00';

    if (!name || !startDate || !totalDays) {
        alert('Please fill in all fields');
        return;
    }

    const id = Date.now().toString();
    const schedule = createSchedule(id, startDate, dosesPerDay, totalDays, firstDoseTime);

    currentMedicine = { id, name, startDate, dosesPerDay, totalDays, firstDoseTime, schedule };
    medicines.push(currentMedicine);
    saveMedicines();
    renderHome();
    openMedicine(id);
}

function renderHome() {
    const list = document.getElementById('medicineList');
    list.innerHTML = '';
    if (medicines.length === 0) {
        list.innerHTML = '<p style="color:#6b7280;">No medicines added yet.</p>';
        return;
    }
    medicines.forEach(med => {
        const progress = getProgress(med);
        const item = document.createElement('div');
        item.className = 'medicine-item';
        item.innerHTML = `
            <div style="flex:1;">
                <strong>${med.name}</strong><br>
                <small>${progress.completed}/${progress.total} doses</small>
            </div>
            <button class="btn btn-secondary" style="width:auto;padding:8px 12px;font-size:14px;" onclick="openMedicine('${med.id}')">Checklist</button>
            <button class="btn btn-secondary" style="width:auto;padding:8px 12px;font-size:14px;" onclick="deleteMedicine('${med.id}')">Delete</button>
        `;
        list.appendChild(item);
    });
}

function openMedicine(id) {
    currentMedicine = medicines.find(m => m.id === id);
    renderTracker();
    showScreen('tracker');
}

function renderTracker() {
    if (!currentMedicine) return;
    document.getElementById('medicineTitle').textContent = currentMedicine.name;
    const scheduleContainer = document.getElementById('doseSchedule');
    scheduleContainer.innerHTML = '';
    currentMedicine.schedule.forEach(day => {
        const dayElement = document.createElement('div');
        dayElement.className = 'day-section';
        const completedDoses = day.doses.filter(d => d.completed).length;
        const totalDoses = day.doses.length;
        dayElement.innerHTML = `
            <div class="day-header">
                <span>${formatDate(new Date(day.date))}</span>
                <span class="day-progress">${completedDoses}/${totalDoses}</span>
            </div>
        `;
        day.doses.forEach(dose => {
            const doseElement = document.createElement('div');
            doseElement.className = `dose-item ${dose.completed ? 'completed' : ''}`;
            doseElement.innerHTML = `
                <input type="checkbox" class="dose-checkbox" ${dose.completed ? 'checked' : ''} onchange="toggleDose('${dose.id}')">
                <span class="dose-time">${dose.time}</span>
            `;
            dayElement.appendChild(doseElement);
        });
        scheduleContainer.appendChild(dayElement);
    });
    updateProgress();
}

function toggleDose(doseId) {
    if (!currentMedicine) return;
    for (let day of currentMedicine.schedule) {
        for (let dose of day.doses) {
            if (dose.id === doseId) {
                dose.completed = !dose.completed;
                break;
            }
        }
    }
    saveMedicines();
    renderTracker();
}

function updateProgress() {
    if (!currentMedicine) return;
    const progress = getProgress(currentMedicine);
    const percentage = progress.total > 0 ? (progress.completed / progress.total) * 100 : 0;
    document.getElementById('progressText').textContent = `${progress.completed} of ${progress.total} doses taken`;
    document.getElementById('progressFill').style.width = `${percentage}%`;
}

function deleteMedicine(id) {
    medicines = medicines.filter(m => m.id !== id);
    saveMedicines();
    if (currentMedicine && currentMedicine.id === id) {
        currentMedicine = null;
        showScreen('home');
    } else {
        renderHome();
    }
}

function prepareSetup() {
    document.getElementById('medicineName').value = '';
    document.getElementById('totalDays').value = '';
    document.getElementById('startDate').valueAsDate = new Date();
    document.getElementById('dosesPerDay').value = '1';
    document.getElementById('firstDoseTime').value = '08:00';
}

function showScreen(screen) {
    document.getElementById('homeScreen').classList.add('hidden');
    document.getElementById('setupScreen').classList.add('hidden');
    document.getElementById('trackerScreen').classList.add('hidden');
    if (screen === 'home') {
        renderHome();
        document.getElementById('homeScreen').classList.remove('hidden');
    } else if (screen === 'setup') {
        prepareSetup();
        document.getElementById('setupScreen').classList.remove('hidden');
    } else if (screen === 'tracker') {
        document.getElementById('trackerScreen').classList.remove('hidden');
    }
}

if (typeof window !== 'undefined') {
    loadMedicines();
    renderHome();
    showScreen('home');

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js');
        });
    }
    console.log('Medicine Tracker PWA ready!');
}

if (typeof module !== 'undefined') {
    module.exports = { createSchedule };
}

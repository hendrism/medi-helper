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

function generateDoseTimes(dosesPerDay, firstDoseTime, scheduleType, labels) {
    if (scheduleType === 'label') {
        return labels;
    }
    const times = [];
    const [hours, minutes] = firstDoseTime.split(':').map(Number);
    const interval = Math.floor((24 * 60) / dosesPerDay);
    for (let i = 0; i < dosesPerDay; i++) {
        const total = (hours * 60 + minutes + interval * i) % (24 * 60);
        const h = Math.floor(total / 60).toString().padStart(2, '0');
        const m = (total % 60).toString().padStart(2, '0');
        times.push(`${h}:${m}`);
    }
    return times.sort();
}

function formatDate(date) {
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric'
    });
}

function createSchedule(id, startDate, dosesPerDay, totalDays, firstDoseTime = '08:00', scheduleType = 'timed', labels = [], startLabel = 'AM') {
    const [year, month, dayNumber] = startDate.split('-').map(Number);
    const startDateObj = new Date(year, month - 1, dayNumber);
    const doseTimes = generateDoseTimes(dosesPerDay, firstDoseTime, scheduleType, labels);
    let startIndex = 0;
    if (scheduleType === 'label') {
        startIndex = doseTimes.indexOf(startLabel);
        if (startIndex === -1) startIndex = 0;
    }
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
            if (scheduleType === 'timed' && day === 0 && time < firstDoseTime) continue;
            if (scheduleType === 'label' && day === 0 && index < startIndex) continue;
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
    const scheduleType = document.getElementById('scheduleType').value;
    const firstDoseTime = document.getElementById('firstDoseTime').value || '08:00';
    const startLabel = document.getElementById('startLabel').value || 'AM';
    let labels = [];
    if (scheduleType === 'label') {
        labels = Array.from(document.querySelectorAll('.dose-label')).map((input, index) =>
            input.value.trim() || `Dose ${index + 1}`
        );
    }

    if (!name || !startDate || !totalDays) {
        alert('Please fill in all fields');
        return;
    }

    const id = Date.now().toString();
    const schedule = createSchedule(id, startDate, dosesPerDay, totalDays, firstDoseTime, scheduleType, labels, startLabel);

    currentMedicine = { id, name, startDate, dosesPerDay, totalDays, firstDoseTime, scheduleType, labels, startLabel, schedule };
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
    document.getElementById('startLabel').value = 'AM';
    document.getElementById('scheduleType').value = 'timed';
    updateScheduleMode();
}

function updateLabelInputs() {
    const type = document.getElementById('scheduleType').value;
    const doses = parseInt(document.getElementById('dosesPerDay').value);
    const container = document.getElementById('labelInputs');
    if (type !== 'label') return;
    container.innerHTML = '';
    for (let i = 0; i < doses; i++) {
        let defaultLabel;
        if (doses === 1) {
            defaultLabel = 'AM';
        } else if (doses === 2) {
            defaultLabel = i === 0 ? 'AM' : 'PM';
        } else {
            const half = Math.ceil(doses / 2);
            const period = i < half ? 'AM' : 'PM';
            const num = i < half ? i + 1 : i - half + 1;
            defaultLabel = `${period}${num}`;
        }
        const group = document.createElement('div');
        group.className = 'form-group';
        group.innerHTML = `<label>Dose ${i + 1} Label</label><input type="text" class="dose-label" value="${defaultLabel}">`;
        container.appendChild(group);
    }
}

function updateScheduleMode() {
    const type = document.getElementById('scheduleType').value;
    const labelContainer = document.getElementById('labelInputs');
    const firstDoseGroup = document.getElementById('firstDoseGroup');
    const startLabelGroup = document.getElementById('startLabelGroup');
    if (type === 'label') {
        firstDoseGroup.classList.add('hidden');
        startLabelGroup.classList.remove('hidden');
        labelContainer.classList.remove('hidden');
        updateLabelInputs();
    } else {
        firstDoseGroup.classList.remove('hidden');
        startLabelGroup.classList.add('hidden');
        labelContainer.classList.add('hidden');
        labelContainer.innerHTML = '';
    }
}

function confirmExit() {
    if (confirm('Go back home? Medication will not be saved.')) {
        showScreen('home');
    }
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

    document.getElementById('scheduleType').addEventListener('change', updateScheduleMode);
    document.getElementById('dosesPerDay').addEventListener('change', () => {
        if (document.getElementById('scheduleType').value === 'label') {
            updateLabelInputs();
        }
    });

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker
                .register('/service-worker.js')
                .then(() => {
                    // Reload the page when the service worker signals an update
                    navigator.serviceWorker.addEventListener('message', event => {
                        if (event.data && event.data.type === 'SW_UPDATED') {
                            // A new service worker has activated, so reload to get the latest version
                            window.location.reload();
                        }
                    });
                })
                .catch(err => console.error('Service worker registration failed:', err));
        });
    }
    console.log('Medicine Tracker PWA ready!');
}

if (typeof module !== 'undefined') {
    module.exports = { createSchedule };
}

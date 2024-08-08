// calendarView.js
import { attendanceData, allPersons } from './dataLoader.js';

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

function changeMonth(delta) {
    currentMonth += delta;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear -= 1;
    } else if (currentMonth > 11) {
        currentMonth = 0;
        currentYear += 1;
    }
    generateCalendarView(attendanceData);
}

function generateCalendarView(data) {
    const calendarDiv = document.getElementById('calendar');
    calendarDiv.innerHTML = '';

    const monthYearLabel = document.getElementById('currentMonthYear');
    if (monthYearLabel) {
        monthYearLabel.textContent = new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long', year: 'numeric' });
    }

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        calendarDiv.appendChild(document.createElement('div')).classList.add('empty');
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = new Date(currentYear, currentMonth, day).toISOString().split('T')[0];
        const dayData = data.filter(entry => entry.date === dateStr);
        const attendedCount = dayData.filter(entry => entry.attendance === 'Attended').length;

        const dayDiv = document.createElement('div');
        dayDiv.innerHTML = `<span class="day-number">${day}</span>`;

        if (attendedCount > 0) {
            const missingNames = allPersons.filter(name => !dayData.some(entry => entry.name === name));
            missingNames.forEach(name => {
                dayData.push({
                    name: name,
                    date: dateStr,
                    attendance: 'Absent',
                    description: 'Auto-generated'
                });
            });

            dayDiv.innerHTML += `<br><br>Attended: ${attendedCount}<br><div class="names">${dayData.map(entry => `<span class="${entry.description === 'Auto-generated' ? 'auto-generated' : ''}">${entry.name}</span>`).join('<br>')}</div>`;
            dayDiv.classList.add('attended');
        } else {
            dayDiv.innerHTML += `Attended: 0<br><div class="names">${dayData.map(entry => `<span class="${entry.description === 'Auto-generated' ? 'auto-generated' : ''}">${entry.name}</span>`).join('<br>')}</div>`;
            dayDiv.classList.add('not-attended');
        }

        calendarDiv.appendChild(dayDiv);
    }
}

function setSwipeEvents(element) {
    let touchstartX = 0;
    let touchendX = 0;

    element.addEventListener('touchstart', function(event) {
        touchstartX = event.changedTouches[0].screenX;
    });

    element.addEventListener('touchend', function(event) {
        touchendX = event.changedTouches[0].screenX;
        handleSwipeGesture();
    });

    function handleSwipeGesture() {
        if (touchendX < touchstartX && element.scrollWidth === element.scrollLeft + element.clientWidth) {
            changeMonth(1);
        }
        if (touchendX > touchstartX && element.scrollLeft === 0) {
            changeMonth(-1);
        }
    }
}

export { changeMonth, generateCalendarView, setSwipeEvents };

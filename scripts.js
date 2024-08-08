const db = firebase.firestore();
let attendanceData = [];
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let editRecordId = null;

document.addEventListener('DOMContentLoaded', function() {
    loadData();
    setSwipeEvents();

    // Initialize Choices.js for the multi-select dropdown
    const filterNameSelect = document.getElementById('filterName');
    const filterNameChoices = new Choices(filterNameSelect, {
        removeItemButton: true,
        searchResultLimit: 5,
        position: 'bottom',
        shouldSort: false,
        itemSelectText: ''
    });

    window.filterNameChoices = filterNameChoices; // Expose filterNameChoices for debugging
});

function loadData() {
    db.collection("attendance").get().then((querySnapshot) => {
        attendanceData = [];
        let nameSet = new Set();
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            data.id = doc.id;
            data.date = new Date(data.date.seconds * 1000).toISOString().split('T')[0];
            attendanceData.push(data);
            nameSet.add(data.name);
        });
        console.log("Loaded Data: ", attendanceData); // Debug log
        populateAttendanceTable(attendanceData);
        populateNameDropdown(nameSet);
        generateCalendarView(attendanceData);
    }).catch((error) => {
        console.error("Error loading data: ", error); // Error handling
    });
}

function populateAttendanceTable(data) {
    let tableContent = '';
    data.forEach((entry) => {
        const attendanceClass = entry.attendance.toLowerCase();
        tableContent += `<tr class="${attendanceClass}">
            <td>${entry.name}</td>
            <td>${entry.date}</td>
            <td>${entry.attendance}</td>
            <td>${entry.description || ''}</td>
            <td>
                <button onclick="openEditRecordForm('${entry.id}')">Edit</button>
            </td>
        </tr>`;
    });
    document.getElementById('attendanceTable').innerHTML = tableContent;
}

function populateNameDropdown(nameSet) {
    let options = [];
    nameSet.forEach((name) => {
        options.push({ value: name, label: name });
    });
    console.log("Name Options: ", options); // Debug log
    const filterNameChoices = window.filterNameChoices;
    filterNameChoices.clearStore(); // Clear any previous choices
    filterNameChoices.setChoices(options, 'value', 'label', true); // Set new choices
}

function filterByName() {
    const nameFilter = document.getElementById('nameSearch').value.toLowerCase();
    const filteredData = attendanceData.filter(entry => entry.name.toLowerCase().includes(nameFilter));
    populateAttendanceTable(filteredData);
    generateCalendarView(filteredData);
}

function filterByDropdownName() {
    const selectedNames = Array.from(document.getElementById('filterName').selectedOptions).map(option => option.value);
    console.log("Selected Names: ", selectedNames); // Debug log
    const filteredData = selectedNames.length ? attendanceData.filter(entry => selectedNames.includes(entry.name)) : attendanceData;
    console.log("Filtered Data: ", filteredData); // Debug log
    populateAttendanceTable(filteredData);
    generateCalendarView(filteredData);
}

function filterByDate() {
    const selectedDate = document.getElementById('filterDate').value;
    const filteredData = selectedDate ? attendanceData.filter(entry => entry.date === selectedDate) : attendanceData;
    populateAttendanceTable(filteredData);
    generateCalendarView(filteredData);
}

function updateAttendance(id, attendance) {
    const description = attendance !== 'Attended' ? prompt('Enter description:') : '';
    db.collection("attendance").doc(id).update({ attendance, description }).then(() => {
        loadData();
    });
}

function toggleView(view) {
    document.getElementById('calendarView').classList.toggle('hidden', view !== 'calendar');
    document.getElementById('tableView').classList.toggle('hidden', view !== 'table');
}

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
    monthYearLabel.textContent = new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long', year: 'numeric' });

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.classList.add('empty');
        calendarDiv.appendChild(emptyDiv);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = new Date(currentYear, currentMonth, day).toISOString().split('T')[0];
        const dayData = data.filter(entry => entry.date === dateStr);
        const attendanceCount = dayData.length;

        const dayDiv = document.createElement('div');
        dayDiv.innerHTML = `<span class="day-number">${day}</span> <span class="day-month">${monthYearLabel.textContent.split(' ')[0]}</span><br>`;
        if (attendanceCount > 0) {
            dayDiv.innerHTML += `Attended: ${attendanceCount}<br><div class="names">${dayData.map(entry => entry.name).join('<br>')}</div>`;
            dayDiv.classList.add('attended');
            dayDiv.innerHTML += `<button class="download-button" onclick="downloadExcel('${dateStr}')">Download</button>`;
        } else {
            dayDiv.innerHTML += `Attended: 0`;
            dayDiv.classList.add('not-attended');
        }
        calendarDiv.appendChild(dayDiv);
    }
}

function downloadExcel(date) {
    const dayData = attendanceData.filter(entry => entry.date === date);
    const worksheetData = [['الاسم', 'التاريخ', 'الحالة', 'الوصف']];

    dayData.forEach(entry => {
        worksheetData.push([entry.name, entry.date, entry.attendance, entry.description || '']);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');

    XLSX.writeFile(workbook, `Attendance_${date}.xlsx`);
}

function openForm(formId) {
    document.getElementById(formId).classList.add('show');
}

function closeForm(formId) {
    document.getElementById(formId).classList.remove('show');
}

function openEditRecordForm(id) {
    editRecordId = id;
    const record = attendanceData.find(entry => entry.id === id);
    document.getElementById('editRecordName').value = record.name;
    document.getElementById('editRecordDate').value = record.date;
    document.getElementById('editRecordAttendance').value = record.attendance;
    document.getElementById('editRecordDescription').value = record.description || '';
    openForm('editRecordForm');
}

function closeModal(event) {
    if (event.target.classList.contains('modal')) {
        closeForm(event.target.id);
    }
}

function addRecord() {
    const name = document.getElementById('recordName').value;
    const date = document.getElementById('recordDate').value;
    const attendance = document.getElementById('recordAttendance').value;
    const description = document.getElementById('recordDescription').value;

    const newRecord = {
        name,
        date: new Date(date),
        attendance,
        description: attendance !== 'Attended' ? description : ''
    };

    db.collection("attendance").add(newRecord).then((docRef) => {
        newRecord.id = docRef.id;
        attendanceData.push(newRecord);
        appendRecordToTable(newRecord);
        closeForm('addRecordForm');
    });
}

function appendRecordToTable(entry) {
    const table = document.getElementById('attendanceTable');
    const attendanceClass = entry.attendance.toLowerCase();
    const row = document.createElement('tr');
    row.className = attendanceClass;
    row.innerHTML = `<td>${entry.name}</td>
        <td>${entry.date.toISOString().split('T')[0]}</td>
        <td>${entry.attendance}</td>
        <td>${entry.description || ''}</td>
        <td>
            <button onclick="openEditRecordForm('${entry.id}')">Edit</button>
        </td>`;
    table.appendChild(row);
}

function addPerson() {
    const name = document.getElementById('personName').value;
    const firstAttendance = document.getElementById('personFirstAttendance').value;

    const newPerson = {
        name,
        firstAttendance: new Date(firstAttendance)
    };

    db.collection("persons").add(newPerson).then(() => {
        const newRecord = {
            name,
            date: new Date(firstAttendance),
            attendance: 'Attended',
            description: ''
        };
        db.collection("attendance").add(newRecord).then((docRef) => {
            newRecord.id = docRef.id;
            attendanceData.push(newRecord);
            appendRecordToTable(newRecord);
            const nameSet = new Set(Array.from(document.getElementById('filterName').options).map(option => option.value));
            nameSet.add(newPerson.name);
            populateNameDropdown(nameSet);
            closeForm('addPersonForm');
        });
    });
}

function updateRecord() {
    const name = document.getElementById('editRecordName').value;
    const date = document.getElementById('editRecordDate').value;
    const attendance = document.getElementById('editRecordAttendance').value;
    const description = document.getElementById('editRecordDescription').value;

    const updatedRecord = {
        name,
        date: new Date(date),
        attendance,
        description
    };

    db.collection("attendance").doc(editRecordId).update(updatedRecord).then(() => {
        const index = attendanceData.findIndex(entry => entry.id === editRecordId);
        updatedRecord.id = editRecordId;
        attendanceData[index] = updatedRecord;
        populateAttendanceTable(attendanceData);
        closeForm('editRecordForm');
    });
}

function toggleDescription() {
    const attendance = document.getElementById('recordAttendance').value;
    const descriptionLabel = document.getElementById('descriptionLabel');
    const descriptionInput = document.getElementById('recordDescription');
    if (attendance !== 'Attended') {
        descriptionLabel.classList.remove('hidden');
        descriptionInput.classList.remove('hidden');
    } else {
        descriptionLabel.classList.add('hidden');
        descriptionInput.classList.add('hidden');
    }
}

function toggleEditDescription() {
    const attendance = document.getElementById('editRecordAttendance').value;
    const descriptionInput = document.getElementById('editRecordDescription');
    descriptionInput.disabled = attendance === 'Attended';
}

function toggleHamburgerMenu() {
    const hamburgerMenu = document.getElementById('hamburgerMenu');
    const manageTools = document.getElementById('manageTools');
    hamburgerMenu.classList.toggle('open');
    manageTools.style.display = manageTools.style.display === 'flex' ? 'none' : 'flex';
}

function toggleFilterDropdown() {
    const filterDropdown = document.getElementById('filterDropdownContent');
    filterDropdown.classList.toggle('hidden');
    filterDropdown.classList.toggle('show');
}

function applyFilters() {
    filterByDropdownName();
    filterByDate();
    toggleFilterDropdown();
}

function setSwipeEvents() {
    const calendarView = document.getElementById('calendarView');
    let touchstartX = 0;
    let touchendX = 0;

    calendarView.addEventListener('touchstart', function(event) {
        touchstartX = event.changedTouches[0].screenX;
    });

    calendarView.addEventListener('touchend', function(event) {
        touchendX = event.changedTouches[0].screenX;
        handleSwipeGesture();
    });

    function handleSwipeGesture() {
        if (touchendX < touchstartX) changeMonth(1);
        if (touchendX > touchstartX) changeMonth(-1);
    }
}

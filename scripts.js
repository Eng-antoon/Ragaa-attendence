const db = firebase.firestore();
let attendanceData = [];
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let editRecordId = null;
let allPersons = [];

document.addEventListener('DOMContentLoaded', function() {
    loadPersons();
    loadData();
    setSwipeEvents();
    initializeChoices();
});

function initializeChoices() {
    const filterNameSelect = document.getElementById('filterName');
    window.filterNameChoices = new Choices(filterNameSelect, {
        removeItemButton: true,
        searchResultLimit: 5,
        position: 'bottom',
        shouldSort: false,
        itemSelectText: ''
    });
}

async function loadPersons() {
    try {
        const querySnapshot = await db.collection("persons").get();
        allPersons = [];
        const options = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            data.id = doc.id;
            allPersons.push(data.name.trim());
            options.push({ value: data.name.trim(), label: data.name.trim() });
        });
        console.log("Loaded Persons: ", allPersons);

        // Populate viewPersonSelect dropdown directly
        const viewPersonSelect = document.getElementById('viewPersonSelect');
        viewPersonSelect.innerHTML = options.map(option => `<option value="${option.value}">${option.label}</option>`).join('');

        // Update filterNameChoices
        const filterNameChoices = window.filterNameChoices;
        filterNameChoices.clearStore();
        filterNameChoices.setChoices(options, 'value', 'label', true);

        // Populate other dropdowns
        const recordNameSelect = document.getElementById('recordName');
        recordNameSelect.innerHTML = options.map(option => `<option value="${option.value}">${option.label}</option>`).join('');

        const editRecordNameSelect = document.getElementById('editRecordName');
        editRecordNameSelect.innerHTML = options.map(option => `<option value="${option.value}">${option.label}</option>`).join('');

    } catch (error) {
        console.error("Error loading persons: ", error);
    }
}

async function loadData() {
    try {
        const querySnapshot = await db.collection("attendance").get();
        attendanceData = [];
        let nameSet = new Set();
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            data.id = doc.id;
            data.date = new Date(data.date.seconds * 1000).toISOString().split('T')[0];
            attendanceData.push(data);
            nameSet.add(data.name.trim());
        });
        console.log("Loaded Data: ", attendanceData);
        populateAttendanceTable(attendanceData);
        populateNameDropdowns(nameSet);
        generateCalendarView(attendanceData);
    } catch (error) {
        console.error("Error loading data: ", error);
    }
}

function populateAttendanceTable(data) {
    const tableContent = data.map((entry) => {
        const attendanceClass = entry.attendance.toLowerCase();
        return `
            <tr class="${attendanceClass}">
                <td>${entry.name}</td>
                <td>${entry.date}</td>
                <td>${entry.attendance}</td>
                <td>${entry.description || ''}</td>
                <td>
                    <button onclick="openEditRecordForm('${entry.id}')">Edit</button>
                </td>
            </tr>
        `;
    }).join('');

    const allNamesSet = new Set(allPersons);
    const dataNamesSet = new Set(data.map(entry => entry.name.trim()));
    const missingNames = Array.from(allNamesSet).filter(name => !dataNamesSet.has(name));
    const missingRows = missingNames.map(name => `
        <tr class="not-attended auto-generated">
            <td>${name}</td>
            <td>N/A</td>
            <td>Absent</td>
            <td>Auto-generated</td>
            <td></td>
        </tr>
    `).join('');

    document.getElementById('attendanceTable').innerHTML = tableContent + missingRows;
}

function populateNameDropdowns(nameSet) {
    const options = Array.from(nameSet).map(name => ({ value: name, label: name }));
    console.log("Name Options: ", options);

    const filterNameChoices = window.filterNameChoices;
    filterNameChoices.clearStore();
    filterNameChoices.setChoices(options, 'value', 'label', true);

    const recordNameSelect = document.getElementById('recordName');
    recordNameSelect.innerHTML = options.map(option => `<option value="${option.value}">${option.label}</option>`).join('');

    const editRecordNameSelect = document.getElementById('editRecordName');
    editRecordNameSelect.innerHTML = options.map(option => `<option value="${option.value}">${option.label}</option>`).join('');
}

function filterByName() {
    const nameFilter = document.getElementById('nameSearch').value.toLowerCase().trim();
    const filteredData = attendanceData.filter(entry => entry.name.toLowerCase().includes(nameFilter));
    console.log("Filter by Name: ", nameFilter, "Filtered Data: ", filteredData);
    return filteredData;
}

function filterByDropdownName() {
    const selectedNames = Array.from(document.getElementById('filterName').selectedOptions).map(option => option.value.trim());
    console.log("Selected Names: ", selectedNames);
    const filteredData = selectedNames.length ? attendanceData.filter(entry => selectedNames.includes(entry.name.trim())) : attendanceData;
    console.log("Filtered Data: ", filteredData);
    return filteredData;
}

function filterByDate() {
    const selectedDate = document.getElementById('filterDate').value;
    const filteredData = selectedDate ? attendanceData.filter(entry => entry.date === selectedDate) : attendanceData;
    console.log("Filter by Date: ", selectedDate, "Filtered Data: ", filteredData);
    return filteredData;
}

function updateViews(filteredData) {
    console.log("Updating Views with Data: ", filteredData);
    populateAttendanceTable(filteredData);
    generateCalendarView(filteredData);
}

function applyFilters() {
    const filteredByName = filterByName();
    const filteredByDropdownName = filterByDropdownName();
    const filteredByDate = filterByDate();
    
    // Combine all filters
    const finalFilteredData = filteredByName.filter(entry => 
        filteredByDropdownName.includes(entry) && filteredByDate.includes(entry)
    );
    
    console.log("Combined Filtered Data: ", finalFilteredData);
    updateViews(finalFilteredData);
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

    // Add day headers
    const dayHeaders = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const headerRow = document.createElement('div');
    headerRow.classList.add('calendar-header-row');
    dayHeaders.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.classList.add('calendar-day-header');
        dayHeader.textContent = day.charAt(0);  // Display the first letter of the day
        headerRow.appendChild(dayHeader);
    });
    calendarDiv.appendChild(headerRow);

    for (let i = 0; i < firstDay; i++) {
        const emptyDiv = document.createElement('div');
        emptyDiv.classList.add('empty');
        calendarDiv.appendChild(emptyDiv);
    }

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = new Date(currentYear, currentMonth, day).toISOString().split('T')[0];
        const dayData = data.filter(entry => entry.date === dateStr);
        const attendedCount = dayData.filter(entry => entry.attendance === 'Attended').length;

        const dayDiv = document.createElement('div');
        dayDiv.innerHTML = `<span class="day-number">${day}</span> <span class="day-month">${monthYearLabel.textContent.split(' ')[0]}</span><br>`;

        if (attendedCount > 0) {
            const allNamesSet = new Set(allPersons);
            const dayNamesSet = new Set(dayData.map(entry => entry.name.trim()));
            const missingNames = Array.from(allNamesSet).filter(name => !dayNamesSet.has(name));

            missingNames.forEach(name => {
                dayData.push({
                    name: name,
                    date: dateStr,
                    attendance: 'Absent',
                    description: 'Auto-generated'
                });
            });

            dayDiv.innerHTML += `Attended: ${attendedCount}<br><div class="names">${dayData.map(entry => `<span class="${entry.description === 'Auto-generated' ? 'auto-generated' : ''}">${entry.name}</span>`).join('<br>')}</div>`;
            dayDiv.classList.add('attended');
        } else {
            dayDiv.innerHTML += `Attended: 0<br><div class="names">${dayData.map(entry => `<span class="${entry.description === 'Auto-generated' ? 'auto-generated' : ''}">${entry.name}</span>`).join('<br>')}</div>`;
            dayDiv.classList.add('not-attended');
        }

        calendarDiv.appendChild(dayDiv);
    }
}


function downloadExcel(date) {
    const dayData = attendanceData.filter(entry => entry.date === date);
    const worksheetData = [['Name', 'Date', 'Attendance', 'Description']];

    dayData.forEach(entry => {
        worksheetData.push([entry.name, entry.date, entry.attendance, entry.description || '']);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance');

    // Autofit columns
    const maxLengths = worksheetData.reduce((max, row) => row.map((cell, i) => Math.max(max[i] || 0, cell.toString().length)), []);
    worksheet['!cols'] = maxLengths.map(len => ({ wch: len + 2 }));

    // Add table borders and styling
    Object.keys(worksheet).forEach(cell => {
        if (cell[0] === '!') return; // Skip special keys
        worksheet[cell].s = {
            border: {
                top: { style: "thin", color: { auto: 1 } },
                right: { style: "thin", color: { auto: 1 } },
                bottom: { style: "thin", color: { auto: 1 } },
                left: { style: "thin", color: { auto: 1 } }
            }
        };
    });

    // Style headers
    ['A1', 'B1', 'C1', 'D1'].forEach(cell => {
        worksheet[cell].s = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "007bff" } },
            border: {
                top: { style: "thin", color: { auto: 1 } },
                right: { style: "thin", color: { auto: 1 } },
                bottom: { style: "thin", color: { auto: 1 } },
                left: { style: "thin", color: { auto: 1 } }
            }
        };
    });

    // Apply alternating row colors
    worksheetData.forEach((row, rowIndex) => {
        if (rowIndex > 0) { // Skip header row
            const color = rowIndex % 2 === 0 ? "f0f0f0" : "ffffff";
            row.forEach((_, colIndex) => {
                const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
                worksheet[cellAddress].s = {
                    fill: { fgColor: { rgb: color } },
                    border: {
                        top: { style: "thin", color: { auto: 1 } },
                        right: { style: "thin", color: { auto: 1 } },
                        bottom: { style: "thin", color: { auto: 1 } },
                        left: { style: "thin", color: { auto: 1 } }
                    }
                };
            });
        }
    });

    XLSX.writeFile(workbook, `Attendance_${date}.xlsx`);
}

function downloadMonthlyData() {
    const monthData = attendanceData.filter(entry => new Date(entry.date).getMonth() === currentMonth && new Date(entry.date).getFullYear() === currentYear);
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    const worksheetData = [['Name']];
    for (let day = 1; day <= daysInMonth; day++) {
        worksheetData[0].push(new Date(currentYear, currentMonth, day).toISOString().split('T')[0]);
    }

    const nameSet = new Set(monthData.map(entry => entry.name));
    nameSet.forEach(name => {
        const row = [name];
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = new Date(currentYear, currentMonth, day).toISOString().split('T')[0];
            const entry = monthData.find(e => e.name === name && e.date === dateStr);
            row.push(entry ? entry.attendance : 'Absent');
        }
        worksheetData.push(row);
    });

    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Monthly Attendance');

    // Autofit columns
    const maxLengths = worksheetData.reduce((max, row) => row.map((cell, i) => Math.max(max[i] || 0, cell.toString().length)), []);
    worksheet['!cols'] = maxLengths.map(len => ({ wch: len + 2 }));

    // Add table borders and styling
    Object.keys(worksheet).forEach(cell => {
        if (cell[0] === '!') return;
        worksheet[cell].s = {
            border: {
                top: { style: "thin", color: { auto: 1 } },
                right: { style: "thin", color: { auto: 1 } },
                bottom: { style: "thin", color: { auto: 1 } },
                left: { style: "thin", color: { auto: 1 } }
            }
        };
    });

    // Style headers
    const headerRange = XLSX.utils.decode_range(worksheet['!ref']);
    for (let C = headerRange.s.c; C <= headerRange.e.c; ++C) {
        const address = XLSX.utils.encode_col(C) + "1";
        if (!worksheet[address]) continue;
        worksheet[address].s = {
            font: { bold: true, color: { rgb: "FFFFFF" } },
            fill: { fgColor: { rgb: "007bff" } },
            border: {
                top: { style: "thin", color: { auto: 1 } },
                right: { style: "thin", color: { auto: 1 } },
                bottom: { style: "thin", color: { auto: 1 } },
                left: { style: "thin", color: { auto: 1 } }
            }
        };
    }

    // Apply alternating row colors
    worksheetData.forEach((row, rowIndex) => {
        if (rowIndex > 0) {
            const color = rowIndex % 2 === 0 ? "f0f0f0" : "ffffff";
            row.forEach((_, colIndex) => {
                const cellAddress = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
                worksheet[cellAddress].s = {
                    fill: { fgColor: { rgb: color } },
                    border: {
                        top: { style: "thin", color: { auto: 1 } },
                        right: { style: "thin", color: { auto: 1 } },
                        bottom: { style: "thin", color: { auto: 1 } },
                        left: { style: "thin", color: { auto: 1 } }
                    }
                };
            });
        }
    });

    XLSX.writeFile(workbook, `Monthly_Attendance_${new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long', year: 'numeric' })}.xlsx`);
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
    const date = new Date(document.getElementById('recordDate').value);
    date.setHours(0, 0, 0, 0); // Ensure time is set to the start of the day
    const attendance = document.getElementById('recordAttendance').value;
    const description = document.getElementById('recordDescription').value;

    const newRecord = {
        name,
        date,
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
    const firstAttendance = new Date(document.getElementById('personFirstAttendance').value);
    firstAttendance.setHours(0, 0, 0, 0); // Ensure time is set to the start of the day

    const mobile = document.getElementById('personMobile').value;
    const address = document.getElementById('personAddress').value;
    const lat = document.getElementById('personLat').value;
    const lon = document.getElementById('personLon').value;
    const activities = document.getElementById('personActivities').value;
    const description = document.getElementById('personDescription').value;

    const newPerson = {
        name,
        firstAttendance,
        mobile,
        address,
        lat,
        lon,
        activities,
        description
    };

    db.collection("persons").add(newPerson).then(() => {
        const newRecord = {
            name,
            date: firstAttendance,
            attendance: 'Attended',
            description: ''
        };
        db.collection("attendance").add(newRecord).then((docRef) => {
            newRecord.id = docRef.id;
            attendanceData.push(newRecord);
            appendRecordToTable(newRecord);
            const nameSet = new Set(Array.from(document.getElementById('filterName').options).map(option => option.value));
            nameSet.add(newPerson.name);
            populateNameDropdowns(nameSet);
            closeForm('addPersonForm');
        });
    });
}

function updateRecord() {
    const name = document.getElementById('editRecordName').value;
    const date = new Date(document.getElementById('editRecordDate').value);
    date.setHours(0, 0, 0, 0); // Ensure time is set to the start of the day
    const attendance = document.getElementById('editRecordAttendance').value;
    const description = document.getElementById('editRecordDescription').value;

    const updatedRecord = {
        name,
        date,
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

function loadPersonData() {
    const selectedPerson = document.getElementById('viewPersonSelect').value;
    db.collection("persons").where("name", "==", selectedPerson).get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            document.getElementById('viewPersonMobile').value = data.mobile || '';
            document.getElementById('viewPersonAddress').value = data.address || '';
            document.getElementById('viewPersonLat').value = data.lat || '';
            document.getElementById('viewPersonLon').value = data.lon || '';
            document.getElementById('viewPersonActivities').value = data.activities || '';
            document.getElementById('viewPersonDescription').value = data.description || '';
            document.getElementById('personData').classList.remove('hidden');
        });
    });
}

function editPersonData() {
    const selectedPerson = document.getElementById('viewPersonSelect').value;
    const mobile = document.getElementById('viewPersonMobile').value;
    const address = document.getElementById('viewPersonAddress').value;
    const lat = document.getElementById('viewPersonLat').value;
    const lon = document.getElementById('viewPersonLon').value;
    const activities = document.getElementById('viewPersonActivities').value;
    const description = document.getElementById('viewPersonDescription').value;

    db.collection("persons").where("name", "==", selectedPerson).get().then((querySnapshot) => {
        querySnapshot.forEach((doc) => {
            db.collection("persons").doc(doc.id).update({
                mobile,
                address,
                lat,
                lon,
                activities,
                description
            }).then(() => {
                alert("Person data updated successfully!");
            }).catch((error) => {
                console.error("Error updating person data: ", error);
            });
        });
    });
}

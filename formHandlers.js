// formHandlers.js
import db from './firebaseConfig.js';
import { attendanceData, loadData, loadPersons } from './dataLoader.js';
import { populateAttendanceTable } from './tableView.js';

let editRecordId = null;

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

function addRecord() {
    const name = document.getElementById('recordName').value;
    const date = new Date(document.getElementById('recordDate').value);
    date.setHours(0, 0, 0, 0);
    const attendance = document.getElementById('recordAttendance').value;
    const description = document.getElementById('recordDescription').value;

    const newRecord = { name, date, attendance, description: attendance !== 'Attended' ? description : '' };

    db.collection("attendance").add(newRecord).then(docRef => {
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
        <td>${entry.date}</td>
        <td>${entry.attendance}</td>
        <td>${entry.description || ''}</td>
        <td><button onclick="openEditRecordForm('${entry.id}')">Edit</button></td>`;
    table.appendChild(row);
}

function addPerson() {
    const name = document.getElementById('personName').value;
    const firstAttendance = new Date(document.getElementById('personFirstAttendance').value);
    firstAttendance.setHours(0, 0, 0, 0);

    const mobile = document.getElementById('personMobile').value;
    const address = document.getElementById('personAddress').value;
    const lat = document.getElementById('personLat').value;
    const lon = document.getElementById('personLon').value;
    const activities = document.getElementById('personActivities').value;
    const description = document.getElementById('personDescription').value;

    const newPerson = { name, firstAttendance, mobile, address, lat, lon, activities, description };

    db.collection("persons").add(newPerson).then(() => {
        const newRecord = { name, date: firstAttendance, attendance: 'Attended', description: '' };
        db.collection("attendance").add(newRecord).then(docRef => {
            newRecord.id = docRef.id;
            attendanceData.push(newRecord);
            appendRecordToTable(newRecord);
            closeForm('addPersonForm');
        });
    });
}

function updateRecord() {
    const name = document.getElementById('editRecordName').value;
    const date = new Date(document.getElementById('editRecordDate').value);
    date.setHours(0, 0, 0, 0);
    const attendance = document.getElementById('editRecordAttendance').value;
    const description = document.getElementById('editRecordDescription').value;

    const updatedRecord = { name, date, attendance, description };

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

export { openForm, closeForm, openEditRecordForm, addRecord, addPerson, updateRecord, toggleDescription, toggleEditDescription };

// tableView.js
import { attendanceData, allPersons } from './dataLoader.js';

function populateAttendanceTable(data) {
    const tableContent = data.map(entry => {
        const attendanceClass = entry.attendance.toLowerCase();
        return `
            <tr class="${attendanceClass}">
                <td>${entry.name}</td>
                <td>${entry.date}</td>
                <td>${entry.attendance}</td>
                <td>${entry.description || ''}</td>
                <td><button onclick="openEditRecordForm('${entry.id}')">Edit</button></td>
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

export { populateAttendanceTable };

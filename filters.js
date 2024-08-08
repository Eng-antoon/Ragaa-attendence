// filters.js
import { attendanceData } from './dataLoader.js';
import { populateAttendanceTable } from './tableView.js';
import { generateCalendarView } from './calendarView.js';

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

function applyFilters() {
    const filteredByName = filterByName();
    const filteredByDropdownName = filterByDropdownName();
    const filteredByDate = filterByDate();
    
    const finalFilteredData = filteredByName.filter(entry => 
        filteredByDropdownName.includes(entry) && filteredByDate.includes(entry)
    );
    
    console.log("Combined Filtered Data: ", finalFilteredData);
    updateViews(finalFilteredData);
}

function updateViews(filteredData) {
    console.log("Updating Views with Data: ", filteredData);
    populateAttendanceTable(filteredData);
    generateCalendarView(filteredData);
}

export { applyFilters };

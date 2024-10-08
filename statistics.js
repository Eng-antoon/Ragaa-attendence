const db = firebase.firestore();

document.addEventListener('DOMContentLoaded', function() {
    loadAttendanceData();
});

async function loadAttendanceData() {
    try {
        const querySnapshot = await db.collection("attendance").get();
        const attendanceData = [];
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            data.date = new Date(data.date.seconds * 1000).toISOString().split('T')[0];
            attendanceData.push(data);
        });
        console.log("Loaded Attendance Data: ", attendanceData);
        generateAttendanceChart(attendanceData);
        generateMonthlyAttendanceChart(attendanceData);
    } catch (error) {
        console.error("Error loading attendance data: ", error);
    }
}

function generateAttendanceChart(data) {
    const attendanceCounts = data.reduce((counts, entry) => {
        if (!counts[entry.name]) {
            counts[entry.name] = { Attended: 0, Absent: 0, Excused: 0 };
        }
        counts[entry.name][entry.attendance]++;
        return counts;
    }, {});

    const labels = Object.keys(attendanceCounts);
    const attendedData = labels.map(name => attendanceCounts[name].Attended);
    const absentData = labels.map(name => attendanceCounts[name].Absent);
    const excusedData = labels.map(name => attendanceCounts[name].Excused);

    const ctx = document.getElementById('attendanceChart').getContext('2d');
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Attended',
                    data: attendedData,
                    backgroundColor: '#d4edda',
                    borderColor: '#d4edda'
                },
                {
                    label: 'Absent',
                    data: absentData,
                    backgroundColor: '#f8d7da',
                    borderColor: '#f8d7da'
                },
                {
                    label: 'Excused',
                    data: excusedData,
                    backgroundColor: '#fff3cd',
                    borderColor: '#fff3cd'
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    title: {
                        display: true,
                        text: 'Person'
                    }
                },
                y: {
                    stacked: true,
                    title: {
                        display: true,
                        text: 'Count'
                    }
                }
            }
        }
    });
}


function generateMonthlyAttendanceChart(data) {
    const monthlyData = {};

    data.forEach(entry => {
        const month = entry.date.slice(0, 7); // Extract the month in YYYY-MM format
        if (!monthlyData[month]) {
            monthlyData[month] = { Attended: 0, Absent: 0, Excused: 0 };
        }
        if (monthlyData[month][entry.attendance] !== undefined) {
            monthlyData[month][entry.attendance]++;
        }
    });

    const labels = Object.keys(monthlyData);
    const attendedData = labels.map(month => monthlyData[month].Attended);
    const absentData = labels.map(month => monthlyData[month].Absent);
    const excusedData = labels.map(month => monthlyData[month].Excused);

    const ctx = document.getElementById('monthlyAttendanceChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Attended',
                    data: attendedData,
                    backgroundColor: '#d4edda',
                    borderColor: '#d4edda',
                    fill: false
                },
                {
                    label: 'Absent',
                    data: absentData,
                    backgroundColor: '#f8d7da',
                    borderColor: '#f8d7da',
                    fill: false
                },
                {
                    label: 'Excused',
                    data: excusedData,
                    backgroundColor: '#fff3cd',
                    borderColor: '#fff3cd',
                    fill: false
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Month'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Count'
                    }
                }
            }
        }
    });
}

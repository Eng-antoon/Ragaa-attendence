// dataLoader.js
import db from './firebaseConfig.js';

let attendanceData = [];
let allPersons = [];

async function loadPersons() {
    try {
        const querySnapshot = await db.collection("persons").get();
        allPersons = querySnapshot.docs.map(doc => doc.data().name.trim());
        console.log("Loaded Persons: ", allPersons);
        return allPersons;
    } catch (error) {
        console.error("Error loading persons: ", error);
        return [];
    }
}

async function loadData() {
    try {
        const querySnapshot = await db.collection("attendance").get();
        attendanceData = querySnapshot.docs.map(doc => {
            const data = doc.data();
            data.id = doc.id;
            data.date = new Date(data.date.seconds * 1000).toISOString().split('T')[0];
            return data;
        });
        console.log("Loaded Data: ", attendanceData);
        return attendanceData;
    } catch (error) {
        console.error("Error loading data: ", error);
        return [];
    }
}

export { loadPersons, loadData, attendanceData, allPersons };

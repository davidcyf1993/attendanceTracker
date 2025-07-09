// downloadTemplateManager.js - Handles template generation and download functionality

const DownloadTemplateManager = {
    init() {
        this.bindEvents();
    },

    bindEvents() {
        const downloadTemplateBtn = document.getElementById('downloadTemplateBtn');
        if (downloadTemplateBtn) {
            downloadTemplateBtn.addEventListener('click', () => {
                this.downloadTemplate();
            });
        }
    },

    generateTemplateExcel() {
        const wb = XLSX.utils.book_new();
        // Use meaningful names for attendees
        const firstNames = [
            "John", "Jane", "Michael", "Emily", "David", "Sarah", "Chris", "Jessica", "Daniel", "Laura",
            "James", "Olivia", "Matthew", "Sophia", "Andrew", "Emma", "Joshua", "Ava", "Ryan", "Mia",
            "Ethan", "Charlotte", "Alexander", "Amelia", "William", "Harper", "Benjamin", "Abigail", "Samuel", "Ella",
            "Joseph", "Grace", "Logan", "Chloe", "Anthony", "Lily", "Gabriel", "Sofia", "Lucas", "Avery",
            "Jack", "Scarlett", "Henry", "Aria", "Jackson", "Penelope", "Sebastian", "Layla", "Carter", "Riley"
        ];
        const lastNames = [
            "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
            "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
            "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson",
            "Walker", "Young", "Allen", "King", "Wright", "Scott", "Torres", "Nguyen", "Hill", "Flores",
            "Green", "AdAMS", "Nelson", "Baker", "Hall", "Rivera", "Campbell", "Mitchell", "Carter", "Roberts"
        ];
        const attendeeData = [["ID", "Full Name", "Nick Name"]];
        for (let i = 1; i <= 100; ++i) {
            const first = firstNames[(i - 1) % firstNames.length];
            const last = lastNames[(i - 1) % lastNames.length];
            attendeeData.push([
                `A${String(i).padStart(3, '0')}`,
                `${first} ${last}`,
                `${first}`
            ]);
        }
        const ws1 = XLSX.utils.aoa_to_sheet(attendeeData);
        XLSX.utils.book_append_sheet(wb, ws1, "attendee");

        // Use meaningful names for events
        const eventTypes = ["Seminar", "Workshop", "Meeting", "Conference", "Webinar"];
        const eventData = [["ID", "Event Name", "Event Type", "Datetime From", "Datetime To"]];
        for (let i = 1; i <= 100; ++i) {
            const eventType = eventTypes[(i - 1) % eventTypes.length];
            eventData.push([
                `E${String(i).padStart(3, '0')}`,
                `${eventType} ${i}`,
                eventType,
                `2025-07-${String((i % 28) + 1).padStart(2, '0')}T09:00`,
                `2025-07-${String((i % 28) + 1).padStart(2, '0')}T10:00`
            ]);
        }
        const ws2 = XLSX.utils.aoa_to_sheet(eventData);
        XLSX.utils.book_append_sheet(wb, ws2, "event");

        // Attendance sheet: attendee ID, then event IDs as columns
        const attendanceHeader = ["Attendee ID"];
        for (let i = 1; i <= 100; ++i) {
            attendanceHeader.push(`E${String(i).padStart(3, '0')}`);
        }
        const attendanceData = [attendanceHeader];
        // Make attendance more realistic: some 100%, some 0%, some random, some with random rates
        for (let i = 1; i <= 100; ++i) {
            const row = [`A${String(i).padStart(3, '0')}`];
            let pattern;
            if (i <= 10) {
                // 100% attendance
                pattern = () => "Yes";
            } else if (i <= 20) {
                // 0% attendance
                pattern = () => "No";
            } else if (i <= 40) {
                // 75% attendance
                pattern = (j) => (j % 4 !== 0 ? "Yes" : "No");
            } else if (i <= 60) {
                // 50% attendance
                pattern = (j) => (j % 2 === 0 ? "Yes" : "No");
            } else if (i <= 80) {
                // 25% attendance
                pattern = (j) => (j % 4 === 0 ? "Yes" : "No");
            } else if (i <= 90) {
                // More random: each attendee gets a random attendance rate between 10% and 90%
                const rate = Math.random() * 0.8 + 0.1; // 0.1 to 0.9
                pattern = () => (Math.random() < rate ? "Yes" : "No");
            } else {
                // Fully random for each event
                pattern = () => (Math.random() < 0.5 ? "Yes" : "No");
            }
            for (let j = 1; j <= 100; ++j) {
                row.push(pattern(j));
            }
            attendanceData.push(row);
        }
        const ws3 = XLSX.utils.aoa_to_sheet(attendanceData);
        XLSX.utils.book_append_sheet(wb, ws3, "attendance");

        // Add Attendance Calculation sheet
        // Header: Attendee ID, Full Name, Nick Name, Total Events, Attended Events, Attendance %
        // Date From, Date To, Event Type will be in a single row at the top (B1, C1, D1)
        const calcHeader = [
            "Attendee ID", "Full Name", "Nick Name", "Total Events", "Attended Events", "Attendance %"
        ];
        // Row 1: leave A1 empty, B1: Date From, C1: Date To, D1: Event Type
        const filterRow = [
            '', 'Date From', 'Date To', 'Event Type', '', '', ''
        ];
        // Row 2: user input cells for filters (B2, C2, D2)
        const filterInputRow = [
            '', '', '', '', '', '', ''
        ];
        

        const wbout = XLSX.write(wb, {bookType:'xlsx', type:'array'});
        return new Blob([wbout], {type: "application/octet-stream"});
    },

    downloadTemplate() {
        const blob = this.generateTemplateExcel();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'attendance_template.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Show success message
        showNotification('Template downloaded successfully!', 'success');
    }
};
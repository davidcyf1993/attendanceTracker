// attendanceTickingManager.js - Handles file upload and attendance management

const AttendanceTickingManager = {
    attendeeSheet: [],
    eventSheet: [],
    attMatrix: [],

    init() {
        this.bindEvents();
        // Remove Add Event form rendering from here
    },

    bindEvents() {
        // Home tab upload button
        const uploadBtn = document.getElementById('uploadBtn');
        const fileInput = document.getElementById('excelFile');
        if (uploadBtn && fileInput) {
            // Upload button click: if no file, trigger file input; else, handle upload
            uploadBtn.addEventListener('click', (e) => {
                if (!fileInput.files || fileInput.files.length === 0) {
                    // No file chosen: trigger file dialog, do not show error
                    fileInput.click();
                } else {
                    // File already chosen: proceed as before
                    this.handleFileUpload('excelFile', 'fileStatus', 'attendanceSection');
                }
            });
            // When file is chosen, auto trigger upload
            fileInput.addEventListener('change', () => {
                if (fileInput.files && fileInput.files.length > 0) {
                    this.handleFileUpload('excelFile', 'fileStatus', 'attendanceSection');
                }
            });
        }
    },

    showFileStatus(message, type, statusElementId) {
        const fileStatus = document.getElementById(statusElementId);
        if (fileStatus) {
            fileStatus.textContent = message;
            fileStatus.className = type === 'success' ? 'success' : 'error';
        }
    },

    handleFileUpload(fileInputId, statusElementId, sectionElementId) {
        const fileInput = document.getElementById(fileInputId);
        const file = fileInput.files[0];
        
        if (!file) {
            this.showFileStatus('Please select an Excel file.', 'error', statusElementId);
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            // ...existing code to parse workbook...
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            DataHelper.init(workbook);
            // Enable Tick Attendance tab
            const tickTab = document.getElementById('tick-tab');
            if (tickTab) {
                tickTab.removeAttribute('disabled');
                tickTab.tabIndex = 0;
            }
            // Enable Add Event tab
            const addEventTab = document.getElementById('add-event-tab');
            if (addEventTab) {
                addEventTab.removeAttribute('disabled');
                addEventTab.tabIndex = 0;
            }
            // Enable Calculate Attendance tab
            const calcAttendanceTab = document.getElementById('calc-attendance-tab');
            if (calcAttendanceTab) {
                calcAttendanceTab.removeAttribute('disabled');
                calcAttendanceTab.tabIndex = 0;
                // Show Calculate Attendance tab content when tab is clicked
                calcAttendanceTab.addEventListener('click', () => {
                    if (typeof CalcAttendanceManager !== 'undefined') {
                        CalcAttendanceManager.showCalcAttendance('calcAttendanceSection');
                    }
                });
            }
            // Enable Manage Attendees tab
            const crudAttendeeTab = document.getElementById('crud-attendee-tab');
            if (crudAttendeeTab) {
                crudAttendeeTab.removeAttribute('disabled');
                crudAttendeeTab.removeAttribute('aria-disabled');
                crudAttendeeTab.tabIndex = 0;
                crudAttendeeTab.classList.remove('disabled');
                crudAttendeeTab.addEventListener('click', () => {
                    if (typeof CrudAttendeeManager !== 'undefined') {
                        CrudAttendeeManager.init();
                    }
                });
            }
            // Enable Manage Events tab
            const crudEventTab = document.getElementById('crud-event-tab');
            if (crudEventTab) {
                crudEventTab.removeAttribute('disabled');
                crudEventTab.removeAttribute('aria-disabled');
                crudEventTab.tabIndex = 0;
                crudEventTab.classList.remove('disabled');
                crudEventTab.addEventListener('click', () => {
                    if (typeof CrudEventManager !== 'undefined') {
                        CrudEventManager.init();
                    }
                });
            }
            // Show ticking UI in Tick tab, not Home tab
            this.showAttendanceTicking('attendanceSectionTick');
            // Optionally, clear Home tab's attendanceSection
            const homeAttSection = document.getElementById('attendanceSection');
            if (homeAttSection) homeAttSection.style.display = 'none';
            // Initialize AddEventManager with current workbook, eventSheet, attMatrix
            if (typeof AddEventManager !== 'undefined') {
                AddEventManager.init();
            }
            // Switch to Tick Attendance tab automatically
            if (typeof bootstrap !== 'undefined') {
                const tab = new bootstrap.Tab(document.querySelector('#tick-tab'));
                tab.show();
            }
        };
        reader.readAsArrayBuffer(file);
    },

    // Utility to get sorted events by start datetime desc
    getSortedEvents() {
        return DataHelper.getEvents().slice().sort((a, b) => {
            const aTime = new Date(a['Datetime From'] || a['Datetime from'] || a['Start'] || 0).getTime();
            const bTime = new Date(b['Datetime From'] || b['Datetime from'] || b['Start'] || 0).getTime();
            return bTime - aTime;
        });
    },

    showAttendanceTicking(sectionElementId) {
        this.attendeeSheet = DataHelper.getAttendees();
        this.eventSheet = DataHelper.getEvents();
        if (!this.attendeeSheet.length) {
            document.getElementById(sectionElementId).innerHTML = '<div class="alert alert-warning">No attendees found in the attendee sheet.</div>';
            return;
        }
        this.attMatrix = DataHelper.getAttendanceMatrix();
        // Two-stage UI: Stage 1 = select/create event, Stage 2 = tick attendance
        let selectedEventId = localStorage.getItem('tickAttendanceSelectedEventId') || null;
        const section = document.getElementById(sectionElementId);
        section.style.display = '';
        if (!selectedEventId) {
            // Stage 1: Select or create event
            let sortedEvents = this.getSortedEvents();
            let eventOptions = sortedEvents.map(ev => `<option value="${ev['ID']}">${ev['Event Name']} (${ev['ID']})</option>`).join('');
            let eventSelect = `
                <div class="mb-3">
                    <label for="eventSelect" class="form-label">Select Event:</label>
                    <select id="eventSelect" class="form-select">
                        <option value="">-- Select an event --</option>
                        ${eventOptions}
                    </select>
                </div>
                <div class="mb-3">
                    <button class="btn btn-success" id="createNewEventBtn"><i class="bi bi-plus-circle"></i> Create New Event</button>
                </div>
                <div id="createEventFormContainer"></div>
            `;
            section.innerHTML = eventSelect;
            document.getElementById('eventSelect').addEventListener('change', function() {
                if (this.value) {
                    localStorage.setItem('tickAttendanceSelectedEventId', this.value);
                    AttendanceTickingManager.showAttendanceTicking(sectionElementId);
                }
            });
            document.getElementById('createNewEventBtn').addEventListener('click', function(e) {
                e.preventDefault();
                AttendanceTickingManager.renderCreateEventForm(sectionElementId);
            });
        } else {
            // Stage 2: Tick attendance for selected event
            section.innerHTML = `<div class="mb-3 text-end"><button class="btn btn-secondary" id="changeEventBtn"><i class="bi bi-arrow-left-circle"></i> Change Event</button></div><div id="attendanceTick"></div><div id="saveStatus"></div>`;
            document.getElementById('changeEventBtn').addEventListener('click', function() {
                localStorage.removeItem('tickAttendanceSelectedEventId');
                AttendanceTickingManager.showAttendanceTicking(sectionElementId);
            });
            this.renderTicking(selectedEventId);
        }
    },

    renderCreateEventForm(sectionElementId) {
        // Simple create event form (reuse AddEventManager if available)
        const container = document.getElementById('createEventFormContainer');
        if (!container) return;
        // If AddEventManager exists, use its form rendering
        if (typeof AddEventManager !== 'undefined') {
            // Render AddEventManager form and hook into its addNewEvent
            AddEventManager.renderAddEventForm();
            // After event is added, refresh event list and auto-select new event
            const origAddNewEvent = AddEventManager.addNewEvent.bind(AddEventManager);
            AddEventManager.addNewEvent = () => {
                origAddNewEvent();
                // Find the latest event (by max ID)
                let events = DataHelper.getEvents();
                let maxId = events.reduce((max, ev) => {
                    let num = parseInt((ev.ID||'').replace('E',''));
                    return (!isNaN(num) && num > max) ? num : max;
                }, 0);
                let newId = 'E' + String(maxId).padStart(3, '0');
                localStorage.setItem('tickAttendanceSelectedEventId', newId);
                // Refresh UI to stage 2
                AttendanceTickingManager.showAttendanceTicking(sectionElementId);
            };
            // Move AddEventManager form into our container
            const addEventSection = document.getElementById('addEventSection');
            if (addEventSection) {
                container.innerHTML = '';
                container.appendChild(addEventSection.firstElementChild.cloneNode(true));
            }
        } else {
            // Fallback: simple inline form
            container.innerHTML = `
                <form id="inlineCreateEventForm">
                    <div class="mb-2"><input type="text" class="form-control" id="newEventName" placeholder="Event Name" required></div>
                    <div class="mb-2"><input type="text" class="form-control" id="newEventType" placeholder="Event Type" required></div>
                    <div class="mb-2"><input type="datetime-local" class="form-control" id="newEventFrom" required></div>
                    <div class="mb-2"><input type="datetime-local" class="form-control" id="newEventTo" required></div>
                    <button type="submit" class="btn btn-primary">Create Event</button>
                </form>
            `;
            document.getElementById('inlineCreateEventForm').addEventListener('submit', function(e) {
                e.preventDefault();
                // Add event logic (similar to AddEventManager)
                const name = document.getElementById('newEventName').value.trim();
                const type = document.getElementById('newEventType').value.trim();
                const from = document.getElementById('newEventFrom').value;
                const to = document.getElementById('newEventTo').value;
                if (!name || !type || !from || !to) {
                    showNotification('Please fill in all event fields.', 'danger');
                    return;
                }
                let events = DataHelper.getEvents();
                let maxId = 0;
                events.forEach(ev => {
                    const num = parseInt((ev.ID||'').replace('E',''));
                    if (!isNaN(num) && num > maxId) maxId = num;
                });
                const newId = 'E' + String(maxId + 1).padStart(3, '0');
                events.push({ ID: newId, 'Event Name': name, 'Event Type': type, 'Datetime From': from, 'Datetime To': to });
                // Update event sheet
                DataHelper.updateEvents(events);
                // Add new event column to attendance if not present
                let attMatrix = DataHelper.getAttendanceMatrix();
                let header = attMatrix[0] || ["Attendee ID"];
                if (!header.includes(newId)) {
                    header.push(newId);
                    for (let i = 1; i < attMatrix.length; ++i) {
                        attMatrix[i].push("");
                    }
                }
                // Update workbook attendance
                DataHelper.updateAttendanceMatrix(attMatrix);
                showNotification('Event added successfully!', 'success');
                localStorage.setItem('tickAttendanceSelectedEventId', newId);
                AttendanceTickingManager.showAttendanceTicking(sectionElementId);
            });
        }
    },

    // Utility to get sorted events by start datetime desc
    getSortedEvents() {
        return DataHelper.getEvents().slice().sort((a, b) => {
            const aTime = new Date(a['Datetime From'] || a['Datetime from'] || a['Start'] || 0).getTime();
            const bTime = new Date(b['Datetime From'] || b['Datetime from'] || b['Start'] || 0).getTime();
            return bTime - aTime;
        });
    },

    showAttendanceTicking(sectionElementId) {
        this.attendeeSheet = DataHelper.getAttendees();
        this.eventSheet = DataHelper.getEvents();
        if (!this.attendeeSheet.length) {
            document.getElementById(sectionElementId).innerHTML = '<div class="alert alert-warning">No attendees found in the attendee sheet.</div>';
            return;
        }
        this.attMatrix = DataHelper.getAttendanceMatrix();
        // Two-stage UI: Stage 1 = select/create event, Stage 2 = tick attendance
        let selectedEventId = localStorage.getItem('tickAttendanceSelectedEventId') || null;
        const section = document.getElementById(sectionElementId);
        section.style.display = '';
        if (!selectedEventId) {
            // Stage 1: Select or create event
            let sortedEvents = this.getSortedEvents();
            let eventOptions = sortedEvents.map(ev => `<option value="${ev['ID']}">${ev['Event Name']} (${ev['ID']})</option>`).join('');
            let eventSelect = `
                <div class="mb-3">
                    <label for="eventSelect" class="form-label">Select Event:</label>
                    <select id="eventSelect" class="form-select">
                        <option value="">-- Select an event --</option>
                        ${eventOptions}
                    </select>
                </div>
                <div class="mb-3">
                    <button class="btn btn-success" id="createNewEventBtn"><i class="bi bi-plus-circle"></i> Create New Event</button>
                </div>
                <div id="createEventFormContainer"></div>
            `;
            section.innerHTML = eventSelect;
            document.getElementById('eventSelect').addEventListener('change', function() {
                if (this.value) {
                    localStorage.setItem('tickAttendanceSelectedEventId', this.value);
                    AttendanceTickingManager.showAttendanceTicking(sectionElementId);
                }
            });
            document.getElementById('createNewEventBtn').addEventListener('click', function(e) {
                e.preventDefault();
                AttendanceTickingManager.renderCreateEventForm(sectionElementId);
            });
        } else {
            // Stage 2: Tick attendance for selected event
            section.innerHTML = `<div class="mb-3 text-end"><button class="btn btn-secondary" id="changeEventBtn"><i class="bi bi-arrow-left-circle"></i> Change Event</button></div><div id="attendanceTick"></div><div id="saveStatus"></div>`;
            document.getElementById('changeEventBtn').addEventListener('click', function() {
                localStorage.removeItem('tickAttendanceSelectedEventId');
                AttendanceTickingManager.showAttendanceTicking(sectionElementId);
            });
            this.renderTicking(selectedEventId);
        }
    },

    renderCreateEventForm(sectionElementId) {
        // Simple create event form (reuse AddEventManager if available)
        const container = document.getElementById('createEventFormContainer');
        if (!container) return;
        // If AddEventManager exists, use its form rendering
        if (typeof AddEventManager !== 'undefined') {
            // Render AddEventManager form and hook into its addNewEvent
            AddEventManager.renderAddEventForm();
            // After event is added, refresh event list and auto-select new event
            const origAddNewEvent = AddEventManager.addNewEvent.bind(AddEventManager);
            AddEventManager.addNewEvent = () => {
                origAddNewEvent();
                // Find the latest event (by max ID)
                let events = DataHelper.getEvents();
                let maxId = events.reduce((max, ev) => {
                    let num = parseInt((ev.ID||'').replace('E',''));
                    return (!isNaN(num) && num > max) ? num : max;
                }, 0);
                let newId = 'E' + String(maxId).padStart(3, '0');
                localStorage.setItem('tickAttendanceSelectedEventId', newId);
                // Refresh UI to stage 2
                AttendanceTickingManager.showAttendanceTicking(sectionElementId);
            };
            // Move AddEventManager form into our container
            const addEventSection = document.getElementById('addEventSection');
            if (addEventSection) {
                container.innerHTML = '';
                container.appendChild(addEventSection.firstElementChild.cloneNode(true));
            }
        } else {
            // Fallback: simple inline form
            container.innerHTML = `
                <form id="inlineCreateEventForm">
                    <div class="mb-2"><input type="text" class="form-control" id="newEventName" placeholder="Event Name" required></div>
                    <div class="mb-2"><input type="text" class="form-control" id="newEventType" placeholder="Event Type" required></div>
                    <div class="mb-2"><input type="datetime-local" class="form-control" id="newEventFrom" required></div>
                    <div class="mb-2"><input type="datetime-local" class="form-control" id="newEventTo" required></div>
                    <button type="submit" class="btn btn-primary">Create Event</button>
                </form>
            `;
            document.getElementById('inlineCreateEventForm').addEventListener('submit', function(e) {
                e.preventDefault();
                // Add event logic (similar to AddEventManager)
                const name = document.getElementById('newEventName').value.trim();
                const type = document.getElementById('newEventType').value.trim();
                const from = document.getElementById('newEventFrom').value;
                const to = document.getElementById('newEventTo').value;
                if (!name || !type || !from || !to) {
                    showNotification('Please fill in all event fields.', 'danger');
                    return;
                }
                let events = DataHelper.getEvents();
                let maxId = 0;
                events.forEach(ev => {
                    const num = parseInt((ev.ID||'').replace('E',''));
                    if (!isNaN(num) && num > maxId) maxId = num;
                });
                const newId = 'E' + String(maxId + 1).padStart(3, '0');
                events.push({ ID: newId, 'Event Name': name, 'Event Type': type, 'Datetime From': from, 'Datetime To': to });
                // Update event sheet
                DataHelper.updateEvents(events);
                // Add new event column to attendance if not present
                let attMatrix = DataHelper.getAttendanceMatrix();
                let header = attMatrix[0] || ["Attendee ID"];
                if (!header.includes(newId)) {
                    header.push(newId);
                    for (let i = 1; i < attMatrix.length; ++i) {
                        attMatrix[i].push("");
                    }
                }
                // Update workbook attendance
                DataHelper.updateAttendanceMatrix(attMatrix);
                showNotification('Event added successfully!', 'success');
                localStorage.setItem('tickAttendanceSelectedEventId', newId);
                AttendanceTickingManager.showAttendanceTicking(sectionElementId);
            });
        }
    },

    renderTicking(eventId) {
        // Find event
        const event = this.eventSheet.find(ev => ev['ID'] === eventId);
        // Attendance table for this event
        let header = this.attMatrix[0] || ["Attendee ID"];
        let eventColIdx = header.indexOf(eventId);
        if (eventColIdx === -1) {
            // Add event column if missing
            header.push(eventId);
            this.attMatrix[0] = header;
            for (let i=1; i<this.attMatrix.length; ++i) this.attMatrix[i].push("");
            eventColIdx = header.length-1;
        }
        // Build attendee map
        let attMap = {};
        for (let i=1; i<this.attMatrix.length; ++i) {
            attMap[this.attMatrix[i][0]] = this.attMatrix[i];
        }
        // Search box
        let searchBox = `
            <div class="mb-3">
                <input type="text" id="attendeeSearch" class="form-control" placeholder="Search by name or nickname...">
            </div>
        `;
        // Build table
        let table = `
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">Tick attendance for ${event ? event['Event Name'] : eventId}</h5>
                </div>
                <div class="card-body">
                    <form id="attendanceForm">
                        <div class="table-responsive">
                            ${searchBox}
                            <table id="attendanceTable" class="table table-hover">
                                <thead class="table-light">
                                    <tr>
                                        <th>Full Name</th>
                                        <th>Nick Name</th>
                                        <th>Present</th>
                                    </tr>
                                </thead>
                                <tbody id="attendanceTableBody">
        `;
        this.attendeeSheet.forEach(row => {
            let checked = (attMap[row['ID']] && attMap[row['ID']][eventColIdx] === 'Yes') ? 'checked' : '';
            table += `
                <tr>
                    <td class="text-break">${row['Full Name']||''}</td>
                    <td class="text-break">${row['Nick Name']||''}</td>
                    <td class="text-center">
                        <div class="form-check d-flex justify-content-center">
                            <input class="form-check-input" type="checkbox" name="present" value="${row['ID']}" ${checked}>
                        </div>
                    </td>
                </tr>
            `;
        });
        table += `
                                </tbody>
                            </table>
                        </div>
                    </form>
                </div>
            </div>
        `;
        document.getElementById('attendanceTick').innerHTML = table;
        // Search/filter logic
        const attendeeRows = this.attendeeSheet.map(row => {
            let checked = (attMap[row['ID']] && attMap[row['ID']][eventColIdx] === 'Yes') ? 'checked' : '';
            return {
                html: `<tr><td class=\"text-break\">${row['Full Name']||''}</td><td class=\"text-break\">${row['Nick Name']||''}</td><td class=\"text-center\"><div class=\"form-check d-flex justify-content-center\"><input class=\"form-check-input\" type=\"checkbox\" name=\"present\" value=\"${row['ID']}\" ${checked}></div></td></tr>`,
                fullName: (row['Full Name']||'').toLowerCase(),
                nickName: (row['Nick Name']||'').toLowerCase(),
            };
        });
        document.getElementById('attendeeSearch').addEventListener('input', function() {
            const val = this.value.trim().toLowerCase();
            const tbody = document.getElementById('attendanceTableBody');
            tbody.innerHTML = attendeeRows.filter(r =>
                r.fullName.includes(val) || r.nickName.includes(val)
            ).map(r => r.html).join('');
        });
        document.getElementById('attendanceForm').addEventListener('submit', (ev) => {
            ev.preventDefault();
            this.saveAttendance(eventId, eventColIdx, attMap, header);
        });
    },

    saveAttendance(eventId, eventColIdx, attMap, header) {
        const checked = Array.from(document.querySelectorAll('input[name="present"]:checked')).map(cb => cb.value);
        
        // Update attMatrix for this event
        this.attendeeSheet.forEach(row => {
            let arr = attMap[row['ID']];
            if (!arr) {
                arr = Array(header.length).fill("");
                arr[0] = row['ID'];
                this.attMatrix.push(arr);
                attMap[row['ID']] = arr;
            }
            arr[eventColIdx] = checked.includes(row['ID']) ? 'Yes' : 'No';
        });
        
        // Write back to workbook
        DataHelper.updateAttendanceMatrix(this.attMatrix);
        
        // Download updated file
        const wbout = XLSX.write(DataHelper.getWorkbook(), {bookType:'xlsx', type:'array'});
        const blob = new Blob([wbout], {type: "application/octet-stream"});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'attendance_updated.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Show success message
        showNotification('Attendance saved and file downloaded!', 'success');
        document.getElementById('saveStatus').innerHTML = '<div class="alert alert-success">Attendance saved and file downloaded!</div>';
    },
};
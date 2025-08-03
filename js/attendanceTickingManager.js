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

    /**
     * Enable all tabs and show the Tick Attendance UI after workbook is loaded (from upload or restore)
     */
    enableAppUIAfterWorkbookLoad() {
        // Enable Tick Attendance tab
        const tickTab = document.getElementById('tick-tab');
        if (tickTab) {
            tickTab.removeAttribute('disabled');
            tickTab.tabIndex = 0;
        }
        // Enable Add Event tab (if present)
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

        // Switch to Tick Attendance tab automatically
        if (typeof bootstrap !== 'undefined') {
            const tab = new bootstrap.Tab(document.querySelector('#tick-tab'));
            tab.show();
        }

        // Show Save Attendance icon button here
        const saveBtn = document.getElementById('saveAttendanceTabBtn');
        if (saveBtn) {

            saveBtn.classList.remove('d-none');
            // Avoid multiple event listeners
            saveBtn.onclick = function () {
                console.log('save button clicked');
                DataHelper.downloadWorkbook();

            };
        }
    },

    handleFileUpload(fileInputId, statusElementId, sectionElementId) {
        const fileInput = document.getElementById(fileInputId);
        const file = fileInput.files[0];

        if (!file) {
            this.showFileStatus('選擇試算表', 'error', statusElementId);
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            // ...existing code to parse workbook...
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            DataHelper.init(workbook, true);
            this.enableAppUIAfterWorkbookLoad();
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
            document.getElementById(sectionElementId).innerHTML = '<div class="alert alert-warning">沒有參加者匯入</div>';
            return;
        }
        this.attMatrix = DataHelper.getAttendanceMatrix();
        // Two-stage UI: Stage 1 = select/create event, Stage 2 = tick attendance
        let selectedEventId = localStorage.getItem('tickAttendanceSelectedEventId') || null;
        const section = document.getElementById(sectionElementId);
        section.style.display = '';
        if (!selectedEventId) { // 
            // Stage 1: Select or create event
            let sortedEvents = this.getSortedEvents();
            let eventOptions = sortedEvents.map(ev => `<option value="${ev['ID']}">${ev['Event Name']} (${ev['ID']})</option>`).join('');
            let eventSelect = `
                <div class="mb-3">
                    <label for="eventSelect" class="form-label">選擇聚會:</label>
                    <select id="eventSelect" class="form-select">
                        <option value="">-- 選擇聚會 --</option>
                        ${eventOptions}
                    </select>
                </div>
                <div class="mb-3">
                    <button class="btn btn-success" id="createNewEventBtn"><i class="bi bi-plus-circle"></i>建立新聚會</button>
                </div>
                <div id="createEventFormContainer"></div>
            `;
            section.innerHTML = eventSelect;
            document.getElementById('eventSelect').addEventListener('change', function () {
                if (this.value) {
                    localStorage.setItem('tickAttendanceSelectedEventId', this.value);
                    AttendanceTickingManager.showAttendanceTicking(sectionElementId);
                }
            });
            document.getElementById('createNewEventBtn').addEventListener('click', function (e) {
                e.preventDefault();
                AttendanceTickingManager.renderCreateEventForm(sectionElementId);
            });
        } else {
            // Stage 2: Tick attendance for selected event

            section.innerHTML = `<div class="mb-3 text-end"><button class="btn btn-secondary" id="changeEventBtn"><i class="bi bi-arrow-left-circle"></i>更改聚會</button></div><div id="attendanceTick"></div><div id="saveStatus"></div>`;
            document.getElementById('changeEventBtn').addEventListener('click', function() {
                localStorage.removeItem('tickAttendanceSelectedEventId');
                AttendanceTickingManager.showAttendanceTicking(sectionElementId);
            });
            this.renderTicking(selectedEventId);
        }
    },

    renderCreateEventForm(sectionElementId) {
        const container = document.getElementById('createEventFormContainer');
        if (!container) return;

        // Get existing event types for typeahead
        const existingEventTypes = [...new Set(DataHelper.getEvents().map(e => e['Event Type']).filter(type => type && type.trim()))];

        // Simple inline form
        container.innerHTML = `
            <form id="inlineCreateEventForm">
                <div class="mb-2"><input type="text" class="form-control" id="newEventName" placeholder="選擇聚會" required></div>
                <div class="mb-2 position-relative">
                    <input type="text" class="form-control" id="newEventType" placeholder="聚會類別" required list="newEventTypeSuggestions" autocomplete="off">
                    <datalist id="newEventTypeSuggestions">
                        ${existingEventTypes.map(type => `<option value="${type}">`).join('')}
                    </datalist>
                </div>
                <div class="mb-2"><input type="datetime-local" class="form-control" id="newEventFrom" required></div>
                <div class="mb-2"><input type="datetime-local" class="form-control" id="newEventTo" required></div>
                <button type="submit" class="btn btn-primary">建立新聚會</button>
            </form>
        `;
        document.getElementById('inlineCreateEventForm').addEventListener('submit', function (e) {
            e.preventDefault();
            const name = document.getElementById('newEventName').value.trim();
            const type = document.getElementById('newEventType').value.trim();
            const from = document.getElementById('newEventFrom').value;
            const to = document.getElementById('newEventTo').value;
            if (!name || !type || !from || !to) {
                showNotification('必需填寫全部欄位', 'danger');
                return;
            }
            let events = DataHelper.getEvents();
            let maxId = 0;
            events.forEach(ev => {
                const num = parseInt((ev.ID || '').replace('E', ''));
                if (!isNaN(num) && num > maxId) maxId = num;
            });
            const newId = 'E' + String(maxId + 1).padStart(3, '0');
            const newEvent = { ID: newId, 'Event Name': name, 'Event Type': type, 'Datetime From': from, 'Datetime To': to };
            // Update event sheet
            DataHelper.addEvent(newEvent);
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
            DataHelper.setAttendanceMatrix(attMatrix);
            showNotification('成功建立新聚會', 'success');
            localStorage.setItem('tickAttendanceSelectedEventId', newId);
            AttendanceTickingManager.showAttendanceTicking(sectionElementId);
        });

        // Initialize typeahead functionality for newEventType
        this.initNewEventTypeTypeahead();
    },

    renderTicking(eventId) {
        // Find event
        const event = this.eventSheet.find(ev => String(ev['ID']) === String(eventId));
        // Attendance table for this event
        let header = this.attMatrix[0] || ["Attendee ID"];
        let eventColIdx = header.indexOf(eventId);
        if (eventColIdx === -1) {
            // Add event column if missing
            header.push(eventId);
            this.attMatrix[0] = header;
            for (let i = 1; i < this.attMatrix.length; ++i) this.attMatrix[i].push("");
            eventColIdx = header.length - 1;
        }
        // Build attendee map
        let attMap = {};
        for (let i = 1; i < this.attMatrix.length; ++i) {
            attMap[this.attMatrix[i][0]] = this.attMatrix[i];
        }
        // Search box
        let searchBox = `
            <div class="mb-3">
                <input type="text" id="attendeeSearch" class="form-control" placeholder="尋找姓名 / 別名">
            </div>
        `;
        // Build table
        let table = `
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h5 class="mb-0">填寫出席率 ${event ? event['Event Name'] : eventId}</h5>
                </div>
                <div class="card-body">
                    <form id="attendanceForm">
                        <div class="table-responsive">
                            ${searchBox}
                            <table id="attendanceTable" class="table table-hover">
                                <thead class="table-light">
                                    <tr>
                                        <th class="name">姓名</th>
                                        <th class="checkAttendance">簽到</th>
                                    </tr>
                                </thead>
                                <tbody id="attendanceTableBody">
        `;
        this.attendeeSheet.forEach(row => {
            let checked = (attMap[row['ID']] && attMap[row['ID']][eventColIdx] === '是') ? 'checked' : '';
            const fullName = row['Full Name'] || '';
            const nickName = row['Nick Name'] || '';
            const displayName = nickName ? `${fullName}, ${nickName}` : fullName;
            table += `
                <tr>
                    <td class="text-break name">${displayName}</td>
                    <td class="text-center checkAttendance">
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
            let checked = (attMap[row['ID']] && attMap[row['ID']][eventColIdx] === '是') ? 'checked' : '';
            const fullName = row['Full Name'] || '';
            const nickName = row['Nick Name'] || '';
            const displayName = nickName ? `${fullName}, ${nickName}` : fullName;
            return {
                html: `<tr><td class=\"text-break name\">${displayName}</td><td class=\"text-center checkAttendance\"><div class=\"form-check d-flex justify-content-center\"><input class=\"form-check-input\" type=\"checkbox\" name=\"present\" value=\"${row['ID']}\" ${checked}></div></td></tr>`,
                fullName: (row['Full Name'] || '').toString().toLowerCase(),
                nickName: (row['Nick Name'] || '').toString().toLowerCase(),
            };
        });
        document.getElementById('attendeeSearch').addEventListener('input', function () {
            const val = this.value.trim().toLowerCase();
            const tbody = document.getElementById('attendanceTableBody');
            tbody.innerHTML = attendeeRows.filter(r =>
                r.fullName.includes(val) || r.nickName.includes(val)
            ).map(r => r.html).join('');
        });

        // Add immediate save to workbook on checkbox change
        const checkboxes = document.querySelectorAll('input[name="present"]');
        checkboxes.forEach(cb => {
            cb.addEventListener('change', (e) => {
                const attendeeId = cb.value;
                let arr = attMap[attendeeId];
                if (!arr) {
                    arr = Array(header.length).fill("");
                    arr[0] = attendeeId;
                    this.attMatrix.push(arr);
                    attMap[attendeeId] = arr;
                }
                arr[eventColIdx] = cb.checked ? '是' : '否';
                // Save updated matrix to workbook immediately
                DataHelper.setAttendanceMatrix(this.attMatrix);
            });
        });
    },



    initNewEventTypeTypeahead() {
        const input = document.getElementById('newEventType');
        if (!input) return;

        // Get existing event types
        const existingEventTypes = [...new Set(DataHelper.getEvents().map(e => e['Event Type']).filter(type => type && type.trim()))];

        // Create dropdown container
        const dropdownContainer = document.createElement('div');
        dropdownContainer.className = 'position-absolute w-100 bg-white border rounded shadow-sm';
        dropdownContainer.style.cssText = 'top: 100%; left: 0; z-index: 1000; max-height: 200px; overflow-y: auto; display: none;';
        dropdownContainer.id = 'newEventTypeDropdown';

        // Insert dropdown after input
        input.parentNode.appendChild(dropdownContainer);

        // Function to show suggestions
        const showSuggestions = (query) => {
            let filteredTypes;

            if (!query.trim()) {
                // Show all options when input is empty
                filteredTypes = existingEventTypes;
            } else {
                // Filter based on query
                filteredTypes = existingEventTypes.filter(type =>
                    type.toLowerCase().includes(query.toLowerCase())
                );
            }

            if (filteredTypes.length === 0) {
                dropdownContainer.style.display = 'none';
                return;
            }

            dropdownContainer.innerHTML = filteredTypes.map(type =>
                `<div class="dropdown-item p-2 cursor-pointer" data-value="${type}">${type}</div>`
            ).join('');

            dropdownContainer.style.display = 'block';

            // Add hover effects
            dropdownContainer.querySelectorAll('.dropdown-item').forEach(item => {
                item.addEventListener('mouseenter', () => {
                    item.style.backgroundColor = '#f8f9fa';
                });
                item.addEventListener('mouseleave', () => {
                    item.style.backgroundColor = '';
                });
                item.addEventListener('click', () => {
                    input.value = item.dataset.value;
                    dropdownContainer.style.display = 'none';
                    input.focus();
                });
            });
        };

        // Event listeners
        input.addEventListener('input', (e) => {
            showSuggestions(e.target.value);
        });

        input.addEventListener('focus', () => {
            showSuggestions(input.value);
        });

        // Hide dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!input.contains(e.target) && !dropdownContainer.contains(e.target)) {
                dropdownContainer.style.display = 'none';
            }
        });

        // Keyboard navigation
        input.addEventListener('keydown', (e) => {
            const visibleItems = dropdownContainer.querySelectorAll('.dropdown-item');
            const currentIndex = Array.from(visibleItems).findIndex(item =>
                item.style.backgroundColor === 'rgb(248, 249, 250)'
            );

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (visibleItems.length > 0) {
                    const nextIndex = currentIndex < visibleItems.length - 1 ? currentIndex + 1 : 0;
                    visibleItems.forEach(item => item.style.backgroundColor = '');
                    visibleItems[nextIndex].style.backgroundColor = '#f8f9fa';
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (visibleItems.length > 0) {
                    const prevIndex = currentIndex > 0 ? currentIndex - 1 : visibleItems.length - 1;
                    visibleItems.forEach(item => item.style.backgroundColor = '');
                    visibleItems[prevIndex].style.backgroundColor = '#f8f9fa';
                }
            } else if (e.key === 'Enter') {
                e.preventDefault();
                const selectedItem = dropdownContainer.querySelector('.dropdown-item[style*="background-color: rgb(248, 249, 250)"]');
                if (selectedItem) {
                    input.value = selectedItem.dataset.value;
                    dropdownContainer.style.display = 'none';
                }
            } else if (e.key === 'Escape') {
                dropdownContainer.style.display = 'none';
            }
        });
    }
};
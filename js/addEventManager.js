// addEventManager.js - Handles Add New Event functionality

const AddEventManager = {
    workbook: null,
    eventSheet: [],
    attMatrix: [],

    init(workbook, eventSheet, attMatrix) {
        this.workbook = workbook;
        this.eventSheet = eventSheet;
        this.attMatrix = attMatrix;
        this.renderAddEventForm();
    },

    renderAddEventForm() {
        const addEventSection = document.getElementById('addEventSection');
        if (!addEventSection) return;
        // Collect unique event types from eventSheet, sorted by latest event start datetime
        const sortedEvents = [...this.eventSheet]
            .filter(ev => ev['Event Type'] && ev['Datetime From'])
            .sort((a, b) => new Date(b['Datetime From']) - new Date(a['Datetime From']));
        const eventTypes = Array.from(new Set(sortedEvents.map(ev => ev['Event Type'])));
        const datalistOptions = eventTypes.map(type => `<option value="${type}"></option>`).join('');
        addEventSection.innerHTML = `
            <form id="addEventForm">
                <div class="mb-3">
                    <label for="newEventName" class="form-label">尋找事件名稱 / 類別 / 編號:</label>
                    <input type="text" class="form-control" id="newEventName" required />
                </div>
                <div class="mb-3">
                    <label for="newEventType" class="form-label">Event Type:</label>
                    <input type="text" class="form-control" id="newEventType" list="eventTypeList" required />
                    <datalist id="eventTypeList">
                        ${datalistOptions}
                    </datalist>
                </div>
                <div class="mb-3">
                    <label for="newEventFrom" class="form-label">Datetime From:</label>
                    <input type="datetime-local" class="form-control" id="newEventFrom" required />
                </div>
                <div class="mb-3">
                    <label for="newEventTo" class="form-label">Datetime To:</label>
                    <input type="datetime-local" class="form-control" id="newEventTo" required />
                </div>
                <button type="submit" class="btn btn-primary">
                    <i class="bi bi-calendar-plus"></i>建立新事件
                </button>
            </form>
        `;
        document.getElementById('addEventForm').addEventListener('submit', (ev) => {
            ev.preventDefault();
            this.addNewEvent();
        });
    },

    addNewEvent() {
        const name = document.getElementById('newEventName').value.trim();
        const type = document.getElementById('newEventType').value.trim();
        const from = document.getElementById('newEventFrom').value;
        const to = document.getElementById('newEventTo').value;
        if (!name || !type || !from || !to) {
            showNotification('必需填寫全部欄位', 'danger');
            return;
        }
        if (!this.workbook) {
            showNotification('請匯入試算表', 'danger');
            return;
        }
        // Generate new event ID
        let maxId = 0;
        this.eventSheet.forEach(ev => {
            const num = parseInt(ev.ID.replace('E', ''));
            if (!isNaN(num) && num > maxId) maxId = num;
        });
        const newId = 'E' + String(maxId + 1).padStart(3, '0');
        this.eventSheet.push({ ID: newId, 'Event Name': name, 'Event Type': type, 'Datetime From': from, 'Datetime To': to });
        // Update event sheet
        const wsEvent = XLSX.utils.json_to_sheet(this.eventSheet, { header: ["ID", "Event Name", "Event Type", "Datetime From", "Datetime To"] });
        this.workbook.Sheets['event'] = wsEvent;
        // Add new event column to attendance if not present
        let header = this.attMatrix[0] || ["Attendee ID"];
        if (!header.includes(newId)) {
            header.push(newId);
            for (let i = 1; i < this.attMatrix.length; ++i) {
                this.attMatrix[i].push("");
            }
        }
        // Update workbook attendance
        const wsAtt = XLSX.utils.aoa_to_sheet(this.attMatrix);
        this.workbook.Sheets['attendance'] = wsAtt;
        showNotification('成功建位新事件', 'success');
        this.renderAddEventForm();
        // Refresh event list in Tick Attendance tab if visible
        if (typeof AttendanceTickingManager !== 'undefined') {
            AttendanceTickingManager.showAttendanceTicking(this.workbook, 'attendanceSectionTick');
        }
    }
};


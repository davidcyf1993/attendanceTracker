// addEventManager.js - Handles Add New Event functionality

const AddEventManager = {
    eventSheet: [],
    attMatrix: [],

    init() {
        this.eventSheet = DataHelper.getEvents();
        this.attMatrix = DataHelper.getAttendanceMatrix();
        this.renderAddEventForm();
    },

    renderAddEventForm() {
        const addEventSection = document.getElementById('addEventSection');
        if (!addEventSection) return;
        const sortedEvents = [...DataHelper.getEvents()]
            .filter(ev => ev['Event Type'] && ev['Datetime From'])
            .sort((a, b) => new Date(b['Datetime From']) - new Date(a['Datetime From']));
        const eventTypes = Array.from(new Set(sortedEvents.map(ev => ev['Event Type'])));
        const datalistOptions = eventTypes.map(type => `<option value="${type}"></option>`).join('');
        addEventSection.innerHTML = `
            <form id="addEventForm">
                <div class="mb-3">
                    <label for="newEventName" class="form-label">Event Name:</label>
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
                    <i class="bi bi-calendar-plus"></i> Add Event
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
            showNotification('Please fill in all event fields.', 'danger');
            return;
        }
        // Generate new event ID using DataHelper.getNewId
        const eventIds = DataHelper.getEvents().map(ev => ev.ID);
        const newId = DataHelper.getNewId(eventIds);
        DataHelper.addEvent({ ID: newId, 'Event Name': name, 'Event Type': type, 'Datetime From': from, 'Datetime To': to });
        // Add new event column to attendance if not present
        let matrix = DataHelper.getAttendanceMatrix();
        let header = matrix[0] || ["Attendee ID"];
        if (!header.includes(newId)) {
            header.push(newId);
            for (let i = 1; i < matrix.length; ++i) {
                matrix[i].push("");
            }
        }
        DataHelper.setAttendanceMatrix(matrix);
        showNotification('Event added successfully!', 'success');
        this.renderAddEventForm();
        // Refresh event list in Tick Attendance tab if visible
        if (typeof AttendanceTickingManager !== 'undefined') {
            AttendanceTickingManager.showAttendanceTicking('attendanceSectionTick');
        }
    }
};

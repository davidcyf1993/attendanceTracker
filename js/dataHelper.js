// dataHelper.js - Centralized helper for all workbook (XLSX) CRUD/data logic
// Handles all attendee, event, and attendance CRUD for the attendance tracker
// No UI/DOM logic here. Only data manipulation.

// Assumes XLSX is loaded globally (from xlsx.full.min.js)

/**
 * DataHelper: Centralized helper for all workbook (XLSX) CRUD/data logic.
 * Methods for attendee, event, and attendance CRUD.
 * No UI/DOM logic here. Only data manipulation.
 *
 * Usage:
 *   DataHelper.init(workbook);
 *   DataHelper.addAttendee({ ... });
 *   const attendees = DataHelper.getAttendees();
 */
const DataHelper = {
    /**
     * The current workbook object
     * @type {Object|null}
     */
    workbook: null,

    /**
     * Initialize the helper with a workbook
     * @param {Object} workbook
     */
    init(workbook) {
        this.workbook = workbook;
    },

    /**
     * Get the current workbook
     * @returns {Object|null}
     */
    getWorkbook() {
        return this.workbook;
    },

    /**
     * Get all attendees from workbook
     * @returns {Array}
     */
    getAttendees() {
        return XLSX.utils.sheet_to_json(this.workbook?.Sheets['attendee'] || {});
    },

    /**
     * Add a new attendee
     * @param {Object} attendee - {ID, 'Full Name', 'Nick Name'}
     */
    addAttendee(attendee) {
        const attendees = this.getAttendees();
        attendees.push(attendee);
        this.workbook.Sheets['attendee'] = XLSX.utils.json_to_sheet(attendees, { header: ['ID', 'Full Name', 'Nick Name'] });
    },

    /**
     * Update an attendee by ID
     * @param {string} id
     * @param {Object} updatedFields
     */
    updateAttendee(id, updatedFields) {
        const attendees = this.getAttendees().map(a => a.ID === id ? { ...a, ...updatedFields } : a);
        this.workbook.Sheets['attendee'] = XLSX.utils.json_to_sheet(attendees, { header: ['ID', 'Full Name', 'Nick Name'] });
    },

    /**
     * Delete an attendee by ID
     * @param {string} id
     */
    deleteAttendee(id) {
        const attendees = this.getAttendees().filter(a => a.ID !== id);
        this.workbook.Sheets['attendee'] = XLSX.utils.json_to_sheet(attendees, { header: ['ID', 'Full Name', 'Nick Name'] });
    },

    /**
     * Get all events from workbook
     * @returns {Array}
     */
    getEvents() {
        return XLSX.utils.sheet_to_json(this.workbook?.Sheets['event'] || {});
    },

    /**
     * Add a new event
     * @param {Object} event - {ID, 'Event Name', 'Event Type', 'Datetime From', 'Datetime To'}
     */
    addEvent(event) {
        const events = this.getEvents();
        events.push(event);
        this.workbook.Sheets['event'] = XLSX.utils.json_to_sheet(events, { header: ['ID', 'Event Name', 'Event Type', 'Datetime From', 'Datetime To'] });
    },

    /**
     * Update an event by ID
     * @param {string} id
     * @param {Object} updatedFields
     */
    updateEvent(id, updatedFields) {
        const events = this.getEvents().map(e => e.ID === id ? { ...e, ...updatedFields } : e);
        this.workbook.Sheets['event'] = XLSX.utils.json_to_sheet(events, { header: ['ID', 'Event Name', 'Event Type', 'Datetime From', 'Datetime To'] });
    },

    /**
     * Delete an event by ID
     * @param {string} id
     */
    deleteEvent(id) {
        const events = this.getEvents().filter(e => e.ID !== id);
        this.workbook.Sheets['event'] = XLSX.utils.json_to_sheet(events, { header: ['ID', 'Event Name', 'Event Type', 'Datetime From', 'Datetime To'] });
    },

    /**
     * Get attendance matrix (array of arrays)
     * @returns {Array}
     */
    getAttendanceMatrix() {
        return XLSX.utils.sheet_to_json(this.workbook?.Sheets['attendance'] || {}, { header: 1 });
    },

    /**
     * Set attendance matrix (array of arrays)
     * @param {Array} matrix
     */
    setAttendanceMatrix(matrix) {
        this.workbook.Sheets['attendance'] = XLSX.utils.aoa_to_sheet(matrix);
    },

    /**
     * Mark attendance for an attendee/event
     * @param {string} attendeeId
     * @param {string} eventId
     * @param {string} value - e.g. 'Yes' or 'No'
     */
    markAttendance(attendeeId, eventId, value) {
        const matrix = this.getAttendanceMatrix();
        const header = matrix[0];
        const eventIdx = header.indexOf(eventId);
        if (eventIdx === -1) return;
        for (let i = 1; i < matrix.length; ++i) {
            if (matrix[i][0] === attendeeId) {
                matrix[i][eventIdx] = value;
                break;
            }
        }
        this.setAttendanceMatrix(matrix);
    }
};


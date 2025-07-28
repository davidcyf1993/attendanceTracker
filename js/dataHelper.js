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
     * Initialize the helper with a workbook.
     * If isNew is true, always use the provided workbook and overwrite localStorage.
     * If isNew is false, try to load from localStorage; if not found, use the provided workbook and save it.
     * If no workbook is provided, try to load from localStorage; if not found, return false.
     * @param {Object} workbook
     * @param {boolean} isNew
     * @returns {boolean} true if initialized, false otherwise
     */
    init(workbook, isNew = false) {
        if (!workbook) {
            // No workbook provided, try to load from localStorage
            const loaded = this.loadFromLocalStorage();
            if (loaded) {
                this.workbook = loaded;
                return true;
            }
            return false;
        }
        if (!isNew) {
            // Try to load from localStorage first
            const loaded = this.loadFromLocalStorage();
            if (loaded) {
                this.workbook = loaded;
                return true;
            }
        }
        // Use provided workbook and save to localStorage
        this.workbook = workbook;
        this.saveToLocalStorage();
        return true;
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
        this.saveToLocalStorage();
    },

    /**
     * Update an attendee by ID
     * @param {string} id
     * @param {Object} updatedFields
     */
    updateAttendee(id, updatedFields) {
        const attendees = this.getAttendees();
        let oldId = id;
        let newId = updatedFields.ID !== undefined ? updatedFields.ID : id;
        // Update attendees list
        const updatedAttendees = attendees.map(a => String(a.ID) === String(id) ? { ...a, ...updatedFields } : a);
        this.workbook.Sheets['attendee'] = XLSX.utils.json_to_sheet(updatedAttendees, { header: ['ID', 'Full Name', 'Nick Name'] });
        // Always update attendance matrix and localStorage
        let matrix = this.getAttendanceMatrix();
        if (String(oldId) !== String(newId)) {
            for (let i = 1; i < matrix.length; ++i) {
                if (String(matrix[i][0]) === String(oldId)) {
                    matrix[i][0] = newId;
                }
            }
        }
        // Save matrix (even if not changed, to ensure localStorage is always up to date)
        this.setAttendanceMatrix(matrix);
    },

    /**
     * Delete an attendee by ID
     * @param {string} id
     */
    deleteAttendee(id) {
        const attendees = this.getAttendees().filter(a => a.ID !== id);
        this.workbook.Sheets['attendee'] = XLSX.utils.json_to_sheet(attendees, { header: ['ID', 'Full Name', 'Nick Name'] });
        this.saveToLocalStorage();
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
        this.saveToLocalStorage();
    },

    /**
     * Update an event by ID
     * @param {string} id
     * @param {Object} updatedFields
     */
    updateEvent(id, updatedFields) {
        const events = this.getEvents().map(e => e.ID === id ? { ...e, ...updatedFields } : e);
        this.workbook.Sheets['event'] = XLSX.utils.json_to_sheet(events, { header: ['ID', 'Event Name', 'Event Type', 'Datetime From', 'Datetime To'] });
        this.saveToLocalStorage();
    },

    /**
     * Delete an event by ID
     * @param {string} id
     */
    deleteEvent(id) {
        const events = this.getEvents().filter(e => e.ID !== id);
        this.workbook.Sheets['event'] = XLSX.utils.json_to_sheet(events, { header: ['ID', 'Event Name', 'Event Type', 'Datetime From', 'Datetime To'] });
        this.saveToLocalStorage();
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
        // Remove empty rows (all cells except ID are empty/falsy)
        if (Array.isArray(matrix) && matrix.length > 1) {
            matrix = [matrix[0]].concat(matrix.slice(1).filter(row => row[0] && row.slice(1).some(cell => cell && cell.toString().trim() !== '')));
        }
        this.workbook.Sheets['attendance'] = XLSX.utils.aoa_to_sheet(matrix);
        this.saveToLocalStorage();
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
        this.setAttendanceMatrix(matrix); // setAttendanceMatrix will save to localStorage
    },

    /**
     * Save the current workbook to localStorage
     */
    saveToLocalStorage() {
        if (!this.workbook) return;
        // Write workbook to base64 string
        const wbout = XLSX.write(this.workbook, { bookType: 'xlsx', type: 'base64' });
        localStorage.setItem('attendanceWorkbook', wbout);
    },

    /**
     * Load workbook from localStorage (if exists)
     * @returns {Object|null}
     */
    loadFromLocalStorage() {
        const wbout = localStorage.getItem('attendanceWorkbook');
        if (!wbout) return null;
        // Read workbook from base64 string
        return XLSX.read(wbout, { type: 'base64' });
    },

    //add a method to save the workbook to a file
    downloadWorkbook(filename = 'attendance_updated.xlsx') {
        if (!this.workbook) return;
        const wbout = XLSX.write(this.workbook, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([wbout], { type: 'application/octet-stream' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },


    getNewId(ids) {
        if (!ids || ids.length === 0) {
            return '1';
        }
        
        // Find the maximum ID by comparing as strings
        let maxId = ids[0];
        for (let i = 1; i < ids.length; i++) {
            if (String(ids[i]) > String(maxId)) {
                maxId = ids[i];
            }
        }
        
        // Check if the ID is just a number
        if (/^\d+$/.test(String(maxId))) {
            // ID is just a number, increment it
            return String(parseInt(maxId) + 1);
        }
        
        // Check if the ID ends with a number
        const match = String(maxId).match(/^(.+?)(\d+)$/);
        if (match) {
            // ID ends with a number, increment the number
            const prefix = match[1];
            const number = parseInt(match[2]);
            return prefix + (number + 1);
        } else {
            // ID doesn't end with a number, add 1 to the entire ID
            return String(maxId) + '1';
        }
    }

};


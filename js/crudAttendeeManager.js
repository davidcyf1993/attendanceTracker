// crudAttendeeManager.js - Handles CRUD for Attendees

const CrudAttendeeManager = {
    workbook: null,
    attendeeSheet: [],

    init(workbook) {
        this.workbook = workbook;
        this.attendeeSheet = XLSX.utils.sheet_to_json(workbook.Sheets['attendee']);
        this.renderCrudAttendee();
    },

    renderCrudAttendee() {
        const section = document.getElementById('crudAttendeeSection');
        if (!section) return;
        let sortKey = this._sortKey || 'ID';
        let sortDir = this._sortDir || 1;
        let filter = (this._searchText || '').toLowerCase();
        let filteredSheet = [...this.attendeeSheet];
        if (filter) {
            filteredSheet = filteredSheet.filter(a =>
                (a['Full Name'] || '').toLowerCase().includes(filter) ||
                (a['Nick Name'] || '').toLowerCase().includes(filter) ||
                (a['ID'] || '').toLowerCase().includes(filter)
            );
        }
        let sortedSheet = filteredSheet.sort((a, b) => {
            let av = (a[sortKey] || '').toLowerCase();
            let bv = (b[sortKey] || '').toLowerCase();
            if (av < bv) return -1 * sortDir;
            if (av > bv) return 1 * sortDir;
            return 0;
        });
        // Arrow icons
        const upArrow = ' <i class="bi bi-caret-up-fill"></i>';
        const downArrow = ' <i class="bi bi-caret-down-fill"></i>';
        const greyUpArrow = ' <i class="bi bi-caret-up text-secondary"></i>';
        const greyDownArrow = ' <i class="bi bi-caret-down text-secondary"></i>';
        function thLabel(label, key) {
            if (sortKey === key) {
                return label + (sortDir === 1 ? upArrow : downArrow);
            }
            return label + greyUpArrow + greyDownArrow;
        }
        let table = `<div class="mb-3 text-end">
            <button class="btn btn-success" id="addAttendeeBtn"><i class="bi bi-plus-circle"></i> Add Attendee</button>
        </div>`;
        table += `<div class="table-responsive"><table class="table table-hover"><thead><tr>
            <th class="sortable" data-key="ID">${thLabel('ID', 'ID')}</th>
            <th class="sortable" data-key="Full Name">${thLabel('Full Name', 'Full Name')}</th>
            <th class="sortable" data-key="Nick Name">${thLabel('Nick Name', 'Nick Name')}</th>
            <th>Actions</th></tr></thead><tbody id="crudAttendeeTableBody">`;
        sortedSheet.forEach(att => {
            table += `<tr>
                <td>${att['ID']}</td>
                <td>${att['Full Name']}</td>
                <td>${att['Nick Name']}</td>
                <td>
                    <button class="btn btn-sm btn-primary edit-attendee" data-id="${att['ID']}"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-danger delete-attendee" data-id="${att['ID']}"><i class="bi bi-trash"></i></button>
                </td>
            </tr>`;
        });
        table += '</tbody></table></div>';
        section.innerHTML = table;
        // Add event listeners
        document.getElementById('addAttendeeBtn').onclick = () => this.showAttendeeForm();
        section.querySelectorAll('.edit-attendee').forEach(btn => {
            btn.onclick = () => this.showAttendeeForm(btn.dataset.id);
        });
        section.querySelectorAll('.delete-attendee').forEach(btn => {
            btn.onclick = () => this.deleteAttendee(btn.dataset.id);
        });
        // Sort event listeners
        section.querySelectorAll('th.sortable').forEach(th => {
            th.style.cursor = 'pointer';
            th.onclick = () => {
                const key = th.dataset.key;
                if (this._sortKey === key) {
                    this._sortDir = -this._sortDir;
                } else {
                    this._sortKey = key;
                    this._sortDir = 1;
                }
                this.renderCrudAttendee();
            };
        });
        // Search event listener
        const searchInput = document.getElementById('attendeeSearchBox');
        if (searchInput) {
            searchInput.value = this._searchText || '';
            searchInput.oninput = (e) => {
                this._searchText = e.target.value;
                this.renderCrudAttendee();
            };
        }
    },

    showAttendeeForm(id) {
        const section = document.getElementById('crudAttendeeSection');
        let att = id ? this.attendeeSheet.find(a => a['ID'] === id) : { 'ID': '', 'Full Name': '', 'Nick Name': '' };
        let isEdit = !!id;
        section.innerHTML = `<form id="attendeeForm">
            <div class="mb-3">
                <label class="form-label">ID</label>
                <input type="text" class="form-control" id="attendeeId" value="${att['ID'] || ''}" ${isEdit ? 'readonly' : ''} required />
            </div>
            <div class="mb-3">
                <label class="form-label">Full Name</label>
                <input type="text" class="form-control" id="attendeeFullName" value="${att['Full Name'] || ''}" required />
            </div>
            <div class="mb-3">
                <label class="form-label">Nick Name</label>
                <input type="text" class="form-control" id="attendeeNickName" value="${att['Nick Name'] || ''}" />
            </div>
            <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Add'} Attendee</button>
            <button type="button" class="btn btn-secondary ms-2" id="cancelAttendeeBtn">Cancel</button>
        </form>`;
        document.getElementById('attendeeForm').onsubmit = (e) => {
            e.preventDefault();
            this.saveAttendee(isEdit);
        };
        document.getElementById('cancelAttendeeBtn').onclick = () => this.renderCrudAttendee();
    },

    saveAttendee(isEdit) {
        const id = document.getElementById('attendeeId').value.trim();
        const fullName = document.getElementById('attendeeFullName').value.trim();
        const nickName = document.getElementById('attendeeNickName').value.trim();
        if (!id || !fullName) {
            showNotification('ID and Full Name are required.', 'danger');
            return;
        }
        if (isEdit) {
            let att = this.attendeeSheet.find(a => a['ID'] === id);
            att['Full Name'] = fullName;
            att['Nick Name'] = nickName;
        } else {
            if (this.attendeeSheet.some(a => a['ID'] === id)) {
                showNotification('ID already exists.', 'danger');
                return;
            }
            this.attendeeSheet.push({ 'ID': id, 'Full Name': fullName, 'Nick Name': nickName });
        }
        // Update workbook
        const ws = XLSX.utils.json_to_sheet(this.attendeeSheet, { header: ['ID', 'Full Name', 'Nick Name'] });
        this.workbook.Sheets['attendee'] = ws;
        showNotification('Attendee saved.', 'success');
        this.renderCrudAttendee();
    },

    deleteAttendee(id) {
        if (!confirm('Delete this attendee?')) return;
        this.attendeeSheet = this.attendeeSheet.filter(a => a['ID'] !== id);
        const ws = XLSX.utils.json_to_sheet(this.attendeeSheet, { header: ['ID', 'Full Name', 'Nick Name'] });
        this.workbook.Sheets['attendee'] = ws;
        showNotification('Attendee deleted.', 'success');
        this.renderCrudAttendee();
    }
};

// crudAttendeeManager.js - Handles CRUD for Attendees

const CrudAttendeeManager = {
    attendeeSheet: [],

    init() {
        this.attendeeSheet = DataHelper.getAttendees();
        this.renderCrudAttendee();
    },

    renderCrudAttendee() {
        const section = document.getElementById('crudAttendeeSection');
        if (!section) return;
        let sortKey = this._sortKey || 'ID';
        let sortDir = this._sortDir || 1;
        let filter = String(this._searchText || '').toLowerCase();
        let filteredSheet = [...DataHelper.getAttendees()];
        if (filter) {
            filteredSheet = filteredSheet.filter(a =>
                (a['Full Name'] || '').toString().toLowerCase().includes(filter) ||
                (a['Nick Name'] || '').toString().toLowerCase().includes(filter) ||
                (a['ID'] || '').toString().toLowerCase().includes(filter)
            );
        }
        let sortedSheet = filteredSheet.sort((a, b) => {
            let av = (a[sortKey] || '').toString().toLowerCase();
            let bv = (b[sortKey] || '').toString().toLowerCase();
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
            <button class="btn btn-success" id="addAttendeeBtn"><i class="bi bi-plus-circle"></i>新增參加者</button>
        </div>`;
        table += `<div class="table-responsive"><table class="table table-hover"><thead><tr>
            <th class="sortable" data-key="ID">${thLabel('編號', 'ID')}</th>
            <th class="sortable" data-key="Full Name">${thLabel('姓名', 'Full Name')}</th>
            <th class="sortable" data-key="Nick Name">${thLabel('別名', 'Nick Name')}</th>
            <th>動作</th></tr></thead><tbody id="crudAttendeeTableBody">`;
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
        let att = id ? DataHelper.getAttendees().find(a => String(a['ID']) === String(id)) : { 'ID': '', 'Full Name': '', 'Nick Name': '' };
        let isEdit = !!id;
        
        // Generate new ID if creating new attendee
        let newId = '';
        if (!isEdit) {
            const attendeeIds = DataHelper.getAttendees().map(a => a['ID']);
            newId = DataHelper.getNewId(attendeeIds);
        }
        
        section.innerHTML = `<form id="attendeeForm">
            <div class="mb-3">
                <label class="form-label">ID</label>
                <input type="text" class="form-control" id="attendeeId" value="${att['ID'] || newId}" ${isEdit ? 'readonly' : ''} required />
            </div>
            <div class="mb-3">
                <label class="form-label">Full Name</label>
                <input type="text" class="form-control" id="attendeeFullName" value="${att['Full Name'] || ''}" required />
            </div>
            <div class="mb-3">
                <label class="form-label">Nick Name</label>
                <input type="text" class="form-control" id="attendeeNickName" value="${att['Nick Name'] || ''}" />
            </div>
            <button type="submit" class="btn btn-primary">${isEdit ? '更改' : '新增'}參加者</button>
            <button type="button" class="btn btn-secondary ms-2" id="cancelAttendeeBtn">取消</button>
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
            showNotification('必需填寫編號及姓名', 'danger');
            return;
        }
        if (isEdit) {
            DataHelper.updateAttendee(id, { 'Full Name': fullName, 'Nick Name': nickName });
        } else {
            if (DataHelper.getAttendees().some(a => String(a['ID']) === String(id))) {
                showNotification('編號重復', 'danger');
                return;
            }
            DataHelper.addAttendee({ 'ID': id, 'Full Name': fullName, 'Nick Name': nickName });
        }
        showNotification('參加者資料已儲存', 'success');
        this.renderCrudAttendee();
    },

    deleteAttendee(id) {
        var currentAttendee = DataHelper.getAttendees().filter(a => String(a['ID']) === String(id))[0];
        if (!confirm('刪除參加者資料?\n編號: ' + currentAttendee['ID'] + '\n事件名稱: ' + currentAttendee['Full Name'])) return;

        DataHelper.deleteAttendee(id);
        showNotification('參加者資料已刪除', 'success');
        this.renderCrudAttendee();
    }
};

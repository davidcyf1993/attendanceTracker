// crudEventManager.js - Handles CRUD for Events

const CrudEventManager = {
    eventSheet: [],

    init() {
        this.eventSheet = DataHelper.getEvents();
        this.renderCrudEvent();
    },

    renderCrudEvent() {
        const section = document.getElementById('crudEventSection');
        if (!section) return;
        // Remove searchBox from JS, assume it is in HTML
        // Calculate attendance % for each event
        let attMatrix = DataHelper.getAttendanceMatrix();
        let header = attMatrix[0] || [];
        let rows = attMatrix.slice(1);
        let eventIdToPercent = {};
        for (let i = 1; i < header.length; ++i) {
            let eventId = header[i];
            let present = 0, total = 0;
            rows.forEach(row => {
                let val = row[i];
                if (val && (val.toString().trim().toLowerCase() === 'yes' || val.toString().trim().toLowerCase() === 'no')) {
                    total++;
                    if (val.toString().trim().toLowerCase() === 'yes') present++;
                }
            });
            eventIdToPercent[eventId] = total ? Math.round((present / total) * 100) : null;
        }
        // Sorting
        let sortKey = this._sortKey || 'ID';
        let sortDir = this._sortDir || 1;
        // Use filteredSheet if search is active
        let filter = String(this._searchText || '').toLowerCase();
        let filteredSheet = [...DataHelper.getEvents()];
        if (filter) {
            filteredSheet = filteredSheet.filter(e =>
                (e['Event Name'] || '').toString().toLowerCase().includes(filter) ||
                (e['Event Type'] || '').toString().toLowerCase().includes(filter) ||
                (e['ID'] || '').toString().toLowerCase().includes(filter)
            );
        }
        let sortedSheet = filteredSheet.sort((a, b) => {
            let av, bv;
            if (sortKey === 'Attendance %') {
                av = eventIdToPercent[a['ID']];
                bv = eventIdToPercent[b['ID']];
                av = av === null ? -1 : av;
                bv = bv === null ? -1 : bv;
            } else {
                av = (a[sortKey] || '').toString().toLowerCase();
                bv = (b[sortKey] || '').toString().toLowerCase();
            }
            if (av < bv) return -1 * sortDir;
            if (av > bv) return 1 * sortDir;
            return 0;
        });
        // Arrow icons
        const upArrow = ' <i class="bi bi-caret-up-fill"></i>';
        const downArrow = ' <i class=\"bi bi-caret-down-fill\""></i>';
        const greyUpArrow = ' <i class="bi bi-caret-up text-secondary"></i>';
        const greyDownArrow = ' <i class="bi bi-caret-down text-secondary"></i>';
        function thLabel(label, key) {
            if (sortKey === key) {
                return label + (sortDir === 1 ? upArrow : downArrow);
            }
            return label + greyUpArrow + greyDownArrow;
        }
        let table = `<div class="mb-3 text-end">
            <button class="btn btn-success" id="addEventBtn"><i class="bi bi-plus-circle"></i> Add Event</button>
        </div>`;
        // searchBox is now in HTML, do not add here
        table += `<div class="table-responsive"><table class="table table-hover"><thead><tr>
            <th class="sortable" data-key="ID">${thLabel('ID', 'ID')}</th>
            <th class="sortable" data-key="Event Name">${thLabel('Event Name', 'Event Name')}</th>
            <th class="sortable" data-key="Event Type">${thLabel('Event Type', 'Event Type')}</th>
            <th class="sortable" data-key="Datetime From">${thLabel('Datetime From', 'Datetime From')}</th>
            <th class="sortable" data-key="Datetime To">${thLabel('Datetime To', 'Datetime To')}</th>
            <th class="sortable" data-key="Attendance %">${thLabel('Attendance %', 'Attendance %')}</th>
            <th>Actions</th></tr></thead><tbody id="crudEventTableBody">`;
        sortedSheet.forEach(ev => {
            let percent = eventIdToPercent[ev['ID']];
            table += `<tr>
                <td>${ev['ID']}</td>
                <td>${ev['Event Name']}</td>
                <td>${ev['Event Type']}</td>
                <td>${ev['Datetime From']}</td>
                <td>${ev['Datetime To']}</td>
                <td>${percent !== null ? percent + '%' : '-'}</td>
                <td>
                    <button class="btn btn-sm btn-primary edit-event" data-id="${ev['ID']}"><i class="bi bi-pencil"></i></button>
                    <button class="btn btn-sm btn-danger delete-event" data-id="${ev['ID']}"><i class="bi bi-trash"></i></button>
                </td>
            </tr>`;
        });
        table += '</tbody></table></div>';
        section.innerHTML = table;
        // Add event listeners
        document.getElementById('addEventBtn').onclick = () => this.showEventForm();
        section.querySelectorAll('.edit-event').forEach(btn => {
            btn.onclick = () => this.showEventForm(btn.dataset.id);
        });
        section.querySelectorAll('.delete-event').forEach(btn => {
            btn.onclick = () => this.deleteEvent(btn.dataset.id);
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
                this.renderCrudEvent();
            };
        });
        // Search event listener
        const searchInput = document.getElementById('eventSearchBox');
        if (searchInput) {
            searchInput.value = this._searchText || '';
            searchInput.oninput = (e) => {
                this._searchText = e.target.value;
                this.renderCrudEvent();
            };
        }
    },

    showEventForm(id) {
        const section = document.getElementById('crudEventSection');
        let ev = id ? DataHelper.getEvents().find(e => String(e['ID']) === String(id)) : { 'ID': '', 'Event Name': '', 'Event Type': '', 'Datetime From': '', 'Datetime To': '' };
        let isEdit = !!id;
        
        // Generate new ID if creating new event
        let newId = '';
        if (!isEdit) {
            const eventIds = DataHelper.getEvents().map(e => e['ID']);
            newId = DataHelper.getNewId(eventIds);
        }
        
        // Get existing event types for typeahead
        const existingEventTypes = [...new Set(DataHelper.getEvents().map(e => e['Event Type']).filter(type => type && type.trim()))];
        
        section.innerHTML = `<form id="eventForm">
            <div class="mb-3">
                <label class="form-label">ID</label>
                <input type="text" class="form-control" id="eventId" value="${ev['ID'] || newId}" ${isEdit ? 'readonly' : ''} required />
            </div>
            <div class="mb-3">
                <label class="form-label">Event Name</label>
                <input type="text" class="form-control" id="eventName" value="${ev['Event Name'] || ''}" required />
            </div>
            <div class="mb-3">
                <label class="form-label">Event Type</label>
                <div class="position-relative">
                    <input type="text" class="form-control" id="eventType" value="${ev['Event Type'] || ''}" required list="eventTypeSuggestions" autocomplete="off" />
                    <datalist id="eventTypeSuggestions">
                        ${existingEventTypes.map(type => `<option value="${type}">`).join('')}
                    </datalist>
                </div>
            </div>
            <div class="mb-3">
                <label class="form-label">Datetime From</label>
                <input type="datetime-local" class="form-control" id="eventFrom" value="${ev['Datetime From'] || ''}" required />
            </div>
            <div class="mb-3">
                <label class="form-label">Datetime To</label>
                <input type="datetime-local" class="form-control" id="eventTo" value="${ev['Datetime To'] || ''}" required />
            </div>
            <button type="submit" class="btn btn-primary">${isEdit ? 'Update' : 'Add'} Event</button>
            <button type="button" class="btn btn-secondary ms-2" id="cancelEventBtn">Cancel</button>
        </form>`;
        document.getElementById('eventForm').onsubmit = (e) => {
            e.preventDefault();
            this.saveEvent(isEdit);
        };
        document.getElementById('cancelEventBtn').onclick = () => this.renderCrudEvent();
        
        // Initialize typeahead functionality
        this.initEventTypeTypeahead();
    },

    saveEvent(isEdit) {
        const id = document.getElementById('eventId').value.trim();
        const name = document.getElementById('eventName').value.trim();
        const type = document.getElementById('eventType').value.trim();
        const from = document.getElementById('eventFrom').value;
        const to = document.getElementById('eventTo').value;
        if (!id || !name || !type || !from || !to) {
            showNotification('All fields are required.', 'danger');
            return;
        }
        if (isEdit) {
            DataHelper.updateEvent(id, { 'Event Name': name, 'Event Type': type, 'Datetime From': from, 'Datetime To': to });
        } else {
            if (DataHelper.getEvents().some(e => String(e['ID']) === String(id))) {
                showNotification('ID already exists.', 'danger');
                return;
            }
            DataHelper.addEvent({ 'ID': id, 'Event Name': name, 'Event Type': type, 'Datetime From': from, 'Datetime To': to });
        }
        showNotification('Event saved.', 'success');
        this.renderCrudEvent();
    },

    deleteEvent(id) {
        if (!confirm('Delete this event?')) return;
        DataHelper.deleteEvent(id);
        showNotification('Event deleted.', 'success');
        this.renderCrudEvent();
    },

    initEventTypeTypeahead() {
        const input = document.getElementById('eventType');
        if (!input) return;

        // Get existing event types
        const existingEventTypes = [...new Set(DataHelper.getEvents().map(e => e['Event Type']).filter(type => type && type.trim()))];
        
        // Create dropdown container
        const dropdownContainer = document.createElement('div');
        dropdownContainer.className = 'position-absolute w-100 bg-white border rounded shadow-sm';
        dropdownContainer.style.cssText = 'top: 100%; left: 0; z-index: 1000; max-height: 200px; overflow-y: auto; display: none;';
        dropdownContainer.id = 'eventTypeDropdown';
        
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

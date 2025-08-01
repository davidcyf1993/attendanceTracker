// calcAttendanceManager.js - Handles Calculate Attendance tab functionality

const CalcAttendanceManager = {
    attendeeSheet: [],
    eventSheet: [],
    attMatrix: [],

    init() {
        // Nothing to do on load
    },

    showCalcAttendance(sectionElementId) {
        this.attendeeSheet = DataHelper.getAttendees();
        this.eventSheet = DataHelper.getEvents();
        this.attMatrix = DataHelper.getAttendanceMatrix();
        if (!this.attendeeSheet.length || !this.eventSheet.length || !this.attMatrix.length) {
            document.getElementById(sectionElementId).innerHTML = '<div class="alert alert-danger">沒有點名資料</div>';
            return;
        }
        // Calculate attendance summary for each attendee
        let header = this.attMatrix[0];
        let eventCols = header.slice(1); // skip Attendee ID
        let rows = this.attMatrix.slice(1);
        let summary = this.attendeeSheet.map(att => {
            let attRow = rows.find(r => r[0] == att['ID']);
            let presentCount = 0;
            if (attRow) {
                for (let i = 1; i < attRow.length; ++i) {
                    if (attRow[i] && attRow[i].toString().trim().toLowerCase() === 'yes') presentCount++;
                }
            }
            return {
                name: att['Full Name'],
                nickname: att['Nick Name'],
                total: eventCols.length,
                present: presentCount,
                percent: eventCols.length ? Math.round((presentCount / eventCols.length) * 100) : 0
            };
        });
        // Add filter controls for event type, event name, and date range
        // Collect unique event types and names
        const eventTypes = Array.from(new Set(this.eventSheet.map(ev => ev['Event Type'] || ''))).filter(Boolean);
        const eventNames = Array.from(new Set(this.eventSheet.map(ev => ev['Event Name'] || ''))).filter(Boolean);
        // Build filter UI with event name as typeahead (datalist)
        let filterControls = `
            <div class="row mb-3">
                <div class="col-md-3 mb-2">
                    <label class="form-label">事件類別</label>
                    <select id="filterEventType" class="form-select">
                        <option value="">全部</option>
                        ${eventTypes.map(type => `<option value="${type}">${type}</option>`).join('')}
                    </select>
                </div>
                <div class="col-md-3 mb-2">
                    <label class="form-label">事件名稱</label>
                    <input type="text" id="filterEventName" class="form-control" list="eventNameList" placeholder="選擇事件名稱 / 類別" autocomplete="off" />
                    <datalist id="eventNameList">
                        ${eventNames.map(name => `<option value="${name}"></option>`).join('')}
                    </datalist>
                </div>
                <div class="col-md-3 mb-2">
                    <label class="form-label">開始日期</label>
                    <input type="date" id="filterDateFrom" class="form-control" />
                </div>
                <div class="col-md-3 mb-2">
                    <label class="form-label">結束日期</label>
                    <input type="date" id="filterDateTo" class="form-control" />
                </div>
            </div>
        `;
        // Add search box for filtering
        let searchBox = `
            <div class="mb-3">
                <input type="text" id="calcAttendeeSearch" class="form-control" placeholder="尋找姓名">
            </div>
        `;
        // Build table
        let table = `<div class="card"><div class="card-header"><h5 class="mb-0">出席率彙整</h5></div><div class="card-body"><div class="table-responsive">${filterControls}${searchBox}<table class="table table-hover"><thead class="table-light"><tr><th>姓名</th><th>別名</th><th>事件</th><th>Present</th><th>出席率 %</th></tr></thead><tbody id="calcAttendanceTableBody">`;
        summary.forEach(row => {
            table += `<tr><td>${row.name}</td><td>${row.nickname}</td><td>${row.total}</td><td>${row.present}</td><td>${row.percent}%</td></tr>`;
        });
        table += '</tbody></table></div></div></div>';
        document.getElementById(sectionElementId).style.display = '';
        document.getElementById(sectionElementId).innerHTML = table;

        // Filtering logic
        function filterEvents() {
            // Get filter values
            const typeVal = document.getElementById('filterEventType').value;
            const nameVal = document.getElementById('filterEventName').value;
            const dateFromVal = document.getElementById('filterDateFrom').value;
            const dateToVal = document.getElementById('filterDateTo').value;
            // Filter events
            let filteredEvents = CalcAttendanceManager.eventSheet.filter(ev => {
                let match = true;
                if (typeVal && ev['Event Type'] !== typeVal) match = false;
                if (nameVal && ev['Event Name'] !== nameVal) match = false;
                if (dateFromVal && ev['Datetime From']) {
                    match = match && (new Date(ev['Datetime From']) >= new Date(dateFromVal));
                }
                if (dateToVal && ev['Datetime From']) {
                    match = match && (new Date(ev['Datetime From']) <= new Date(dateToVal));
                }
                return match;
            });
            // Get event IDs in filtered set
            const filteredEventIds = filteredEvents.map(ev => ev['ID']);
            // Recalculate summary
            let header = CalcAttendanceManager.attMatrix[0];
            let rows = CalcAttendanceManager.attMatrix.slice(1);
            let summary = CalcAttendanceManager.attendeeSheet.map(att => {
                let attRow = rows.find(r => r[0] == att['ID']);
                let presentCount = 0;
                let total = 0;
                if (attRow) {
                    for (let i = 1; i < header.length; ++i) {
                        if (filteredEventIds.includes(header[i])) {
                            total++;
                            if (attRow[i] && attRow[i].toString().trim().toLowerCase() === '是') presentCount++;
                        }
                    }
                }
                return {
                    name: att['Full Name'],
                    nickname: att['Nick Name'],
                    total: total,
                    present: presentCount,
                    percent: total ? Math.round((presentCount / total) * 100) : 0
                };
            });
            // Update table
            const tbody = document.getElementById('calcAttendanceTableBody');
            const searchVal = document.getElementById('calcAttendeeSearch').value.trim().toLowerCase();
            tbody.innerHTML = summary.filter(row =>
                row.name.toString().toLowerCase().includes(searchVal) || row.nickname.toString().toLowerCase().includes(searchVal)
            ).map(row => `<tr><td>${row.name}</td><td>${row.nickname}</td><td>${row.total}</td><td>${row.present}</td><td>${row.percent}%</td></tr>`).join('');
        }
        // Attach filter events
        ['filterEventType','filterEventName','filterDateFrom','filterDateTo','calcAttendeeSearch'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.addEventListener('input', filterEvents);
        });
    }
};

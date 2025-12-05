"""Database Studio - Visual Database Browser (like Drizzle Studio/Prisma Studio)."""
from app.core.database import get_session_maker
from app.core.dependencies import get_current_user_from_token, require_role_from_user
from app.models.user import UserRole
from sqlalchemy import text, inspect
from sqlalchemy.ext.asyncio import AsyncSession

config = {
    "name": "DatabaseStudio",
    "type": "api",
    "path": "/api/db/studio",
    "method": "GET"
}

async def handler(req, context):
    """Handle database studio request."""
    # Always return the HTML - authentication will be handled client-side
    html = _generate_studio_html()
    return {
        "status": 200,
        "body": html,
        "headers": {"Content-Type": "text/html"}
    }


def _generate_studio_html():
    """Generate Database Studio HTML interface."""
    return """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Database Studio - CEE Validation System</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            background: #0f172a;
            color: #e2e8f0;
            height: 100vh;
            overflow: hidden;
        }
        
        .container {
            display: flex;
            height: 100vh;
        }
        
        /* Sidebar */
        .sidebar {
            width: 280px;
            background: #1e293b;
            border-right: 1px solid #334155;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        
        .sidebar-header {
            padding: 20px;
            border-bottom: 1px solid #334155;
            background: #0f172a;
        }
        
        .sidebar-header h1 {
            font-size: 18px;
            font-weight: 600;
            color: #60a5fa;
            margin-bottom: 5px;
        }
        
        .sidebar-header p {
            font-size: 12px;
            color: #94a3b8;
        }
        
        .search-box {
            padding: 15px;
            border-bottom: 1px solid #334155;
        }
        
        .search-box input {
            width: 100%;
            padding: 8px 12px;
            background: #0f172a;
            border: 1px solid #334155;
            border-radius: 6px;
            color: #e2e8f0;
            font-size: 14px;
        }
        
        .search-box input:focus {
            outline: none;
            border-color: #60a5fa;
        }
        
        .tables-list {
            flex: 1;
            overflow-y: auto;
            padding: 10px;
        }
        
        .table-item {
            padding: 10px 12px;
            margin-bottom: 4px;
            border-radius: 6px;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .table-item:hover {
            background: #334155;
        }
        
        .table-item.active {
            background: #1e40af;
            color: #fff;
        }
        
        .table-icon {
            width: 16px;
            height: 16px;
            opacity: 0.7;
        }
        
        /* Main Content */
        .main-content {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        
        .toolbar {
            padding: 15px 20px;
            background: #1e293b;
            border-bottom: 1px solid #334155;
            display: flex;
            align-items: center;
            gap: 15px;
        }
        
        .toolbar button {
            padding: 8px 16px;
            background: #3b82f6;
            border: none;
            border-radius: 6px;
            color: white;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
            transition: background 0.2s;
        }
        
        .toolbar button:hover {
            background: #2563eb;
        }
        
        .toolbar button.secondary {
            background: #475569;
        }
        
        .toolbar button.secondary:hover {
            background: #64748b;
        }
        
        .table-name-display {
            font-size: 18px;
            font-weight: 600;
            color: #e2e8f0;
        }
        
        .content-area {
            flex: 1;
            overflow: auto;
            padding: 20px;
        }
        
        .table-view {
            background: #1e293b;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid #334155;
        }
        
        .table-header {
            background: #0f172a;
            padding: 15px 20px;
            border-bottom: 1px solid #334155;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .table-header h2 {
            font-size: 16px;
            font-weight: 600;
        }
        
        .table-stats {
            font-size: 12px;
            color: #94a3b8;
        }
        
        .data-table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .data-table th {
            background: #0f172a;
            padding: 12px 15px;
            text-align: left;
            font-size: 12px;
            font-weight: 600;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border-bottom: 1px solid #334155;
            position: sticky;
            top: 0;
            z-index: 10;
        }
        
        .data-table td {
            padding: 12px 15px;
            border-bottom: 1px solid #334155;
            font-size: 14px;
            color: #e2e8f0;
        }
        
        .data-table tr:hover {
            background: #334155;
        }
        
        .data-table tr:last-child td {
            border-bottom: none;
        }
        
        .empty-state {
            text-align: center;
            padding: 60px 20px;
            color: #94a3b8;
        }
        
        .empty-state svg {
            width: 64px;
            height: 64px;
            margin: 0 auto 20px;
            opacity: 0.5;
        }
        
        .loading {
            text-align: center;
            padding: 40px;
            color: #94a3b8;
        }
        
        .spinner {
            border: 3px solid #334155;
            border-top: 3px solid #60a5fa;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: 600;
            margin-left: 8px;
        }
        
        .badge-pk {
            background: #f59e0b;
            color: #000;
        }
        
        .badge-fk {
            background: #8b5cf6;
            color: #fff;
        }
        
        .badge-null {
            background: #475569;
            color: #fff;
        }
        
        .cell-value {
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 13px;
        }
        
        .cell-null {
            color: #64748b;
            font-style: italic;
        }
        
        .pagination {
            padding: 15px 20px;
            background: #0f172a;
            border-top: 1px solid #334155;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        
        .pagination button {
            padding: 6px 12px;
            background: #334155;
            border: 1px solid #475569;
            border-radius: 4px;
            color: #e2e8f0;
            cursor: pointer;
            font-size: 13px;
        }
        
        .pagination button:hover:not(:disabled) {
            background: #475569;
        }
        
        .pagination button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .pagination-info {
            font-size: 13px;
            color: #94a3b8;
        }
        
        /* Auth Modal */
        .auth-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(15, 23, 42, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        }
        
        .auth-modal.hidden {
            display: none;
        }
        
        .auth-box {
            background: #1e293b;
            border: 1px solid #334155;
            border-radius: 12px;
            padding: 30px;
            width: 90%;
            max-width: 400px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
        }
        
        .auth-box h2 {
            font-size: 20px;
            margin-bottom: 10px;
            color: #e2e8f0;
        }
        
        .auth-box p {
            font-size: 14px;
            color: #94a3b8;
            margin-bottom: 20px;
        }
        
        .auth-box input {
            width: 100%;
            padding: 12px;
            background: #0f172a;
            border: 1px solid #334155;
            border-radius: 6px;
            color: #e2e8f0;
            font-size: 14px;
            margin-bottom: 15px;
        }
        
        .auth-box input:focus {
            outline: none;
            border-color: #60a5fa;
        }
        
        .auth-box button {
            width: 100%;
            padding: 12px;
            background: #3b82f6;
            border: none;
            border-radius: 6px;
            color: white;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: background 0.2s;
        }
        
        .auth-box button:hover {
            background: #2563eb;
        }
        
        .auth-error {
            color: #ef4444;
            font-size: 13px;
            margin-top: 10px;
            display: none;
        }
        
        .auth-error.show {
            display: block;
        }
    </style>
</head>
<body>
    <!-- Auth Modal -->
    <div class="auth-modal" id="authModal">
        <div class="auth-box">
            <h2>🔐 Authentication Required</h2>
            <p>Please enter your Bearer token to access Database Studio</p>
            <input type="password" id="tokenInput" placeholder="Enter Bearer token..." autofocus>
            <button onclick="authenticate()">Connect</button>
            <div class="auth-error" id="authError">Invalid token. Please try again.</div>
        </div>
    </div>
    
    <div class="container" id="mainContainer" style="display: none;">
        <!-- Sidebar -->
        <div class="sidebar">
            <div class="sidebar-header">
                <h1>🗄️ Database Studio</h1>
                <p>CEE Validation System</p>
            </div>
            <div class="search-box">
                <input type="text" id="tableSearch" placeholder="Search tables...">
            </div>
            <div class="tables-list" id="tablesList">
                <div class="loading">
                    <div class="spinner"></div>
                    <p>Loading tables...</p>
                </div>
            </div>
        </div>
        
        <!-- Main Content -->
        <div class="main-content">
            <div class="toolbar">
                <div class="table-name-display" id="tableNameDisplay">Select a table</div>
                <div style="flex: 1;"></div>
                <button onclick="refreshTable()">🔄 Refresh</button>
                <button class="secondary" onclick="showSchema()">📋 Schema</button>
            </div>
            <div class="content-area" id="contentArea">
                <div class="empty-state">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <h3>Select a table from the sidebar to view data</h3>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        let currentTable = null;
        let currentPage = 1;
        const pageSize = 50;
        let allTables = [];
        
        // Search functionality
        document.addEventListener('DOMContentLoaded', () => {
            // Search is initialized in the auth check above
            const searchInput = document.getElementById('tableSearch');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    filterTables(e.target.value);
                });
            }
        });
        
        async function loadTables() {
            try {
                const response = await fetch('/api/docs/database-schema', {
                    headers: {
                        'Authorization': `Bearer ${getAuthToken()}`
                    }
                });
                
                if (!response.ok) {
                    throw new Error('Failed to load tables');
                }
                
                const data = await response.json();
                allTables = data.tables || [];
                renderTables(allTables);
            } catch (error) {
                document.getElementById('tablesList').innerHTML = 
                    '<div class="empty-state"><p>Error loading tables: ' + error.message + '</p></div>';
            }
        }
        
        function renderTables(tables) {
            const container = document.getElementById('tablesList');
            if (tables.length === 0) {
                container.innerHTML = '<div class="empty-state"><p>No tables found</p></div>';
                return;
            }
            
            container.innerHTML = tables.map(table => `
                <div class="table-item" onclick="loadTable('${table.name}')">
                    <svg class="table-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v18m0 0h10a2 2 0 002-2V9M9 21H5a2 2 0 01-2-2V9m0 0h18"></path>
                    </svg>
                    <span>${table.name}</span>
                    <span style="margin-left: auto; font-size: 11px; color: #64748b;">${table.column_count}</span>
                </div>
            `).join('');
        }
        
        function filterTables(query) {
            const filtered = allTables.filter(table => 
                table.name.toLowerCase().includes(query.toLowerCase())
            );
            renderTables(filtered);
        }
        
        async function loadTable(tableName) {
            currentTable = tableName;
            currentPage = 1;
            
            // Update active state
            document.querySelectorAll('.table-item').forEach(item => {
                item.classList.remove('active');
                if (item.textContent.includes(tableName)) {
                    item.classList.add('active');
                }
            });
            
            document.getElementById('tableNameDisplay').textContent = tableName;
            document.getElementById('contentArea').innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading data...</p></div>';
            
            try {
                const response = await fetch(`/api/db/studio/table/${tableName}?page=${currentPage}&page_size=${pageSize}`, {
                    headers: {
                        'Authorization': `Bearer ${getAuthToken()}`
                    }
                });
                
                if (!response.ok) {
                    throw new Error('Failed to load table data');
                }
                
                const data = await response.json();
                renderTableData(data);
            } catch (error) {
                document.getElementById('contentArea').innerHTML = 
                    '<div class="empty-state"><p>Error loading table: ' + error.message + '</p></div>';
            }
        }
        
        function renderTableData(data) {
            const { columns, rows, total, page, total_pages } = data;
            
            let html = `
                <div class="table-view">
                    <div class="table-header">
                        <h2>${currentTable}</h2>
                        <div class="table-stats">${total} rows</div>
                    </div>
                    <div style="overflow-x: auto;">
                        <table class="data-table">
                            <thead>
                                <tr>
                                    ${columns.map(col => `<th>${col.name}${col.is_pk ? '<span class="badge badge-pk">PK</span>' : ''}${col.is_fk ? '<span class="badge badge-fk">FK</span>' : ''}</th>`).join('')}
                                </tr>
                            </thead>
                            <tbody>
                                ${rows.length > 0 ? rows.map(row => `
                                    <tr>
                                        ${columns.map((col, idx) => {
                                            const value = row[col.name];
                                            const displayValue = value === null ? '<span class="cell-null">NULL</span>' : 
                                                typeof value === 'object' ? JSON.stringify(value) : 
                                                String(value);
                                            return `<td class="cell-value">${displayValue}</td>`;
                                        }).join('')}
                                    </tr>
                                `).join('') : '<tr><td colspan="' + columns.length + '" style="text-align: center; padding: 40px; color: #94a3b8;">No data</td></tr>'}
                            </tbody>
                        </table>
                    </div>
                    ${total_pages > 1 ? `
                        <div class="pagination">
                            <div>
                                <button onclick="changePage(${page - 1})" ${page <= 1 ? 'disabled' : ''}>← Previous</button>
                                <button onclick="changePage(${page + 1})" ${page >= total_pages ? 'disabled' : ''} style="margin-left: 10px;">Next →</button>
                            </div>
                            <div class="pagination-info">Page ${page} of ${total_pages}</div>
                        </div>
                    ` : ''}
                </div>
            `;
            
            document.getElementById('contentArea').innerHTML = html;
        }
        
        function changePage(newPage) {
            if (currentTable) {
                currentPage = newPage;
                loadTable(currentTable);
            }
        }
        
        function refreshTable() {
            if (currentTable) {
                loadTable(currentTable);
            }
        }
        
        function showSchema() {
            if (currentTable) {
                window.open(`/api/docs/database-schema?format=html&table=${currentTable}`, '_blank');
            }
        }
        
        function getAuthToken() {
            return localStorage.getItem('db_studio_token') || '';
        }
        
        function authenticate() {
            const token = document.getElementById('tokenInput').value.trim();
            if (!token) {
                document.getElementById('authError').textContent = 'Please enter a token';
                document.getElementById('authError').classList.add('show');
                return;
            }
            
            // Test token by trying to load tables
            fetch('/api/docs/database-schema', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            .then(response => {
                if (response.ok) {
                    // Token is valid
                    localStorage.setItem('db_studio_token', token);
                    document.getElementById('authModal').classList.add('hidden');
                    document.getElementById('mainContainer').style.display = 'flex';
                    loadTables();
                } else {
                    // Token is invalid
                    document.getElementById('authError').textContent = 'Invalid token. Please try again.';
                    document.getElementById('authError').classList.add('show');
                    document.getElementById('tokenInput').value = '';
                }
            })
            .catch(error => {
                document.getElementById('authError').textContent = 'Error: ' + error.message;
                document.getElementById('authError').classList.add('show');
            });
        }
        
        // Check auth on load
        window.addEventListener('DOMContentLoaded', () => {
            const token = getAuthToken();
            if (token) {
                // Test token
                fetch('/api/docs/database-schema', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                })
                .then(response => {
                    if (response.ok) {
                        document.getElementById('authModal').classList.add('hidden');
                        document.getElementById('mainContainer').style.display = 'flex';
                        loadTables();
                    } else {
                        // Token expired or invalid
                        localStorage.removeItem('db_studio_token');
                        document.getElementById('authModal').classList.remove('hidden');
                    }
                })
                .catch(() => {
                    localStorage.removeItem('db_studio_token');
                    document.getElementById('authModal').classList.remove('hidden');
                });
            } else {
                // No token, show modal
                document.getElementById('authModal').classList.remove('hidden');
            }
            
            // Allow Enter key to submit
            document.getElementById('tokenInput').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    authenticate();
                }
            });
        });
    </script>
</body>
</html>"""


// SSE connection management
let evtSource = null;
let retryCount = 0;
const MAX_RETRIES = 5;
const RETRY_DELAY = 3000;

function connectSSE() {
    if (evtSource) {
        evtSource.close();
    }

    evtSource = new EventSource('/admin/dashboard/events');

    // Update stats when receiving SSE updates
    evtSource.onmessage = function(event) {
        retryCount = 0; // Reset retry count on successful message
        const data = JSON.parse(event.data);
        updateDashboard(data.stats);
        updateGamesTable(data.games);
        updateUsersTable(data.users);
        updateLastUpdated(data.timestamp);
    };

    // Handle SSE connection open
    evtSource.onopen = function() {
        retryCount = 0; // Reset retry count on successful connection
        console.log('Dashboard SSE connection established');
    };

    // Handle SSE connection errors
    evtSource.onerror = function(err) {
        if (evtSource.readyState === EventSource.CLOSED) {
            handleDisconnect();
        }
    };
}

function handleDisconnect() {
    if (retryCount < MAX_RETRIES) {
        retryCount++;
        console.log(`Attempting to reconnect (${retryCount}/${MAX_RETRIES})...`);
        setTimeout(connectSSE, RETRY_DELAY);
    } else {
        console.log('Max retry attempts reached. Reloading page...');
        window.location.reload();
    }
}

// Initialize connection
connectSSE();

// Update dashboard statistics
function updateDashboard(stats) {
    if (!stats) return;

    const elements = {
        totalUsers: document.getElementById('totalUsers'),
        totalGames: document.getElementById('totalGames'),
        activeGames: document.getElementById('activeGames'),
        totalPlayers: document.getElementById('totalPlayers'),
        avgPlayers: document.getElementById('avgPlayers'),
        mostActiveCreator: document.getElementById('mostActiveCreator')
    };

    // Safely update elements
    if (elements.totalUsers) elements.totalUsers.textContent = stats.totalUsers;
    if (elements.totalGames) elements.totalGames.textContent = stats.totalGames;
    if (elements.activeGames) elements.activeGames.textContent = stats.activeGames;
    if (elements.totalPlayers) elements.totalPlayers.textContent = stats.totalPlayers;
    if (elements.avgPlayers) elements.avgPlayers.textContent = stats.averagePlayersPerGame;
    
    if (elements.mostActiveCreator) {
        elements.mostActiveCreator.textContent = stats.mostActiveCreator
            ? `${stats.mostActiveCreator.nickname} (${stats.mostActiveCreator.games} games)`
            : 'None';
    }
}

function updateGamesTable(games) {
    if (!games) return;

    const tbody = document.querySelector('.games-section tbody');
    if (!tbody) return;

    tbody.innerHTML = games.map(game => `
        <tr>
            <td>${escapeHtml(game.name)}</td>
            <td>${escapeHtml(game.creatorNickname)}</td>
            <td>
                ${game.players.length}/${game.maxPlayers}
                <div class="player-list">
                    ${game.players.map(player => 
                        `<div class="player-item">${escapeHtml(player.nickname)}</div>`
                    ).join('')}
                </div>
            </td>
            <td>${game.password ? '🔒' : '🔓'}</td>
            <td>${new Date(game.created).toLocaleString()}</td>
        </tr>
    `).join('');
}

function updateUsersTable(users) {
    if (!users) return;

    const tbody = document.querySelector('.users-section tbody');
    if (!tbody) return;

    tbody.innerHTML = users.map(user => `
        <tr>
            <td>${escapeHtml(user.username)}</td>
            <td>${escapeHtml(user.nickname)}</td>
            <td>${user.deleted ? '❌ Deleted' : '✅ Active'}</td>
            <td>${new Date(user.createdAt).toLocaleString()}</td>
        </tr>
    `).join('');
}

function updateLastUpdated(timestamp) {
    if (!timestamp) return;

    const element = document.getElementById('lastUpdated');
    if (!element) return;

    const date = new Date(timestamp);
    element.textContent = `Last updated: ${date.toLocaleTimeString()}`;
}

// Utility function to prevent XSS
function escapeHtml(unsafe) {
    if (typeof unsafe !== 'string') return '';
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (evtSource) {
        evtSource.close();
    }
});
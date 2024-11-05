import { showModal } from './modal.js'

// This code is how we switch screens.  We actually hide
// and unhide one of the 4 divs in the index.html
export function showScreen(screens, screenName) {

    const screenList = [
      { key: "login",    divName: "loginScreen",    focus: "username" },
      { key: "register", divName: "registerScreen", focus: "registerUsername" },
      { key: "lobby",    divName: "lobbyScreen",    focus: "lobbyChatInput" },
      { key: "settings", divName: "settingsScreen", focus: "currentNickname" },
      { key: "game",     divName: "gameScreen",     focus: "gameChatInput" }
    ];
  
    clearAllErrors();

    // Loop through all the screens
    for (const screen of screenList) {

        // Find the <div>
        let div = document.getElementById(screen.divName);

        // Hide it
        div.classList.add('hidden');
      
        // If it's match ...
        if (screen.key === screenName) {

            // Unhide it and ...
            div.classList.remove('hidden');

            // Set the focus to the first input textbox control we find
            div.querySelector('input[type="text"]')?.focus();

            // Then attempt to set the focus to the specified input element
            document.getElementById(screen.focus)?.focus();
        }
    }
}

// Error code goes here
const errorContainers = {
    login: document.getElementById('loginError'),
    register: document.getElementById('registerError'),
    lobby: document.getElementById('lobbyError'),
    game: document.getElementById('gameError'),
    settings: document.getElementById('settingsError')
};

export function clearAllErrors() {
    Object.keys(errorContainers).forEach(key => {
        showError('', key);
    });
}

export function showError(message, screenName = 'login') {
    const errorDiv = errorContainers[screenName];
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = message ? 'block' : 'none';
        errorDiv.classList.remove('fade-out');
        
        if (message) {
            // Start fade after 7 seconds (total 10s with animation)
            setTimeout(() => {
                errorDiv.classList.add('fade-out');
                // Hide completely after fade animation
                setTimeout(() => {
                    errorDiv.style.display = 'none';
                    errorDiv.classList.remove('fade-out');
                }, 3000);
            }, 7000);
        }
    }
}

export function renderGamesList(games, onDelete, onJoin) {
    const gamesListDiv = document.getElementById('gamesList');
    if (!gamesListDiv) return;

    gamesListDiv.innerHTML = games.length ? '' : '  No games available';

    games.forEach(game => {
        const gameElement = document.createElement('div');
        gameElement.className = 'game-item';

        const gameInfo = document.createElement('div');
        gameInfo.className = 'game-info';

        const creatorNickname = game.creatorNickname || 'Unknown User';

        gameInfo.innerHTML = `
            <div class="game-header">
                <h3>${game.name} ${game.password ? '<span class="game-lock">🔒</span>' : ''}</h3>
            </div>
            <div class="game-details">
                <span class="creator">Created by: ${creatorNickname}</span>
                <span class="players-list">Players (${game.players.length}/${game.maxPlayers})</span>
            </div>
        `;

        const buttonsDiv = document.createElement('div');
        buttonsDiv.className = 'game-buttons';

        if (game.players.length < game.maxPlayers) {
            const joinButton = document.createElement('button');
            joinButton.textContent = 'Join';
            joinButton.className = 'join-btn';
            joinButton.onclick = async () => onJoin(game.id);
            buttonsDiv.appendChild(joinButton);
        }
        
        if (game.creator === window.globalUserId) {
            const deleteButton = document.createElement('button');
            deleteButton.textContent = '🗑️';
            deleteButton.className = 'delete-btn';
            deleteButton.onclick = () => onDelete(game.id);
            buttonsDiv.appendChild(deleteButton);
        }

        gameElement.appendChild(gameInfo);
        gameElement.appendChild(buttonsDiv);
        gamesListDiv.appendChild(gameElement);
    });
}

export function updateRefreshTimer(timeLeft) {
    const timerElement = document.getElementById('refreshTimer');
    if (timerElement) {
        timerElement.textContent = `Next refresh in ${timeLeft} second${timeLeft !== 1 ? 's' : ''}`;
    }
}

export function showCreateGameModal(onCreateGame) {
const content = `
    <div class="form-group">
        <label class="textBoxLabel" for="modalGameName">Game Name</label>
        <input type="text" id="modalGameName" placeholder="">
        <label class="textBoxLabel" for="modalGamePassword">Password</label>
        <div class="combinedTextBox">
            <div class="textBoxIcon">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
                </svg>
            </div>
            <input type="text" id="modalGamePassword" placeholder="Optional">
            <div class="textBoxIcon clipboard-icon" onclick="navigator.clipboard.writeText(document.getElementById('modalGamePassword').value)">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                </svg>
            </div>
        </div>
        <label class="textBoxLabel" for="modalMaxPlayers">Players</label>
        <select id="modalMaxPlayers">
            <option value="2">2 Players</option>
            <option value="3">3 Players</option>
            <option value="4">4 Players</option>
        </select>
    </div>
`;

    showModal('Create Game', content, 
        () => {
            const name = document.getElementById('modalGameName').value.trim();
            const password = document.getElementById('modalGamePassword').value.trim();
            const maxPlayers = parseInt(document.getElementById('modalMaxPlayers').value);
            
            if (!name) {
                showError('Game name is required', 'lobby');
                return;
            }
            
            onCreateGame(name, password, maxPlayers);
        }
    );

    // Set the focus to the name of the game
    document.getElementById('modalGameName')?.focus();
}

export function showGetGamePasswordModal() {
    return new Promise((resolve) => {
        const content = `
            <div class="form-group">
                <label class="textBoxLabel" for="modalGamePassword">Password</label>
                <div class="combinedTextBox">
                    <div class="textBoxIcon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
                        </svg>
                    </div>
                    <input type="text" id="modalGamePassword" placeholder="">
                    <div class="textBoxIcon">.</div>
                </div>
                <div id="modalPasswordError" class="error" style="display: none;"></div>
            </div>
        `;

        showModal('Join Private Game', content,
            () => {
                const password = document.getElementById('modalGamePassword').value.trim();
                if (!password) {
                    const errorDiv = document.getElementById('modalPasswordError');
                    errorDiv.textContent = 'Password is required';
                    errorDiv.style.display = 'block';
                    return;
                }
                resolve(password);
            },
            () => resolve(null)
        );

        // If the password input field exists, Set Focus to password field
        document.getElementById('modalGamePassword')?.focus();
    });
}
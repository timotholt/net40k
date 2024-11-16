import { GameStateBase } from './mGameState.base.js';
import { WebSocketClient } from '../../frontend/services/WebSocketClient.js';

export class GameStateClient extends GameStateBase {
    constructor(data = {}) {
        super(data);
        this.ws = new WebSocketClient();
        this.setupWebSocket();
    }

    setupWebSocket() {
        // Game state updates
        this.ws.on('game:updated', ({ gameUuid, data }) => {
            if (gameUuid === this.gameUuid) {
                Object.assign(this, data);
            }
        });

        // Game deletion
        this.ws.on('game:deleted', ({ gameUuid }) => {
            if (gameUuid === this.gameUuid) {
                this.onGameDeleted?.();
            }
        });

        // Player events
        this.ws.on('game:player:joined', ({ gameUuid, playerUuid }) => {
            if (gameUuid === this.gameUuid) {
                this.onPlayerJoined?.(playerUuid);
            }
        });

        this.ws.on('game:player:left', ({ gameUuid, playerUuid }) => {
            if (gameUuid === this.gameUuid) {
                this.onPlayerLeft?.(playerUuid);
            }
        });

        // Spectator events
        this.ws.on('game:spectator:joined', ({ gameUuid, spectatorUuid }) => {
            if (gameUuid === this.gameUuid) {
                this.onSpectatorJoined?.(spectatorUuid);
            }
        });

        this.ws.on('game:spectator:left', ({ gameUuid, spectatorUuid }) => {
            if (gameUuid === this.gameUuid) {
                this.onSpectatorLeft?.(spectatorUuid);
            }
        });

        // Phase changes
        this.ws.on('game:phase:changed', ({ gameUuid, oldPhase, newPhase }) => {
            if (gameUuid === this.gameUuid) {
                this.onPhaseChanged?.(oldPhase, newPhase);
            }
        });

        // Turn changes
        this.ws.on('game:turn:changed', ({ gameUuid, oldPlayerUuid, newPlayerUuid, currentTurn }) => {
            if (gameUuid === this.gameUuid) {
                this.onTurnChanged?.(oldPlayerUuid, newPlayerUuid, currentTurn);
            }
        });
    }

    // Event handlers that can be overridden by the UI layer
    onGameDeleted() {}
    onPlayerJoined(playerUuid) {}
    onPlayerLeft(playerUuid) {}
    onSpectatorJoined(spectatorUuid) {}
    onSpectatorLeft(spectatorUuid) {}
    onPhaseChanged(oldPhase, newPhase) {}
    onTurnChanged(oldPlayerUuid, newPlayerUuid, currentTurn) {}

    // Server communication methods
    async join(playerUuid) {
        await this.ws.emit('game:join', { gameUuid: this.gameUuid, playerUuid });
    }

    async leave(playerUuid) {
        await this.ws.emit('game:leave', { gameUuid: this.gameUuid, playerUuid });
    }

    async spectate(spectatorUuid) {
        await this.ws.emit('game:spectate', { gameUuid: this.gameUuid, spectatorUuid });
    }

    async stopSpectating(spectatorUuid) {
        await this.ws.emit('game:stop-spectating', { gameUuid: this.gameUuid, spectatorUuid });
    }

    static async findByUuid(gameUuid) {
        const ws = new WebSocketClient();
        const data = await ws.emit('game:find', { gameUuid });
        return data ? new GameStateClient(data) : null;
    }

    static async findActive() {
        const ws = new WebSocketClient();
        const games = await ws.emit('game:find-active');
        return games.map(data => new GameStateClient(data));
    }
}
import { createGameUuid } from '../constants/GameUuids.js';
import DateService from '../../backend/services/DateService.js';

// Game-specific constants
export const GAME_PHASES = {
    PHASE_WAITING_FOR_PLAYERS: 'PHASE_WAITING_FOR_PLAYERS',
    PHASE_CHARACTER_CREATION: 'PHASE_CHARACTER_CREATION',
    PHASE_WAITING_FOR_SYNC_START: 'PHASE_WAITING_FOR_SYNC_START',
    PHASE_GAME_PAUSED: 'PHASE_GAME_PAUSED',
    PHASE_WAITING_FOR_RECONNECT: 'PHASE_WAITING_FOR_RECONNECT',
    PHASE_WAITING_FOR_VOTE: 'PHASE_WAITING_FOR_VOTE',
    PHASE_WAITING_FOR_PLAYER_INPUT: 'PHASE_WAITING_FOR_PLAYER_INPUT',
    PHASE_WAITING_FOR_PLAYER_COMPLEX_ACTION: 'PHASE_WAITING_FOR_PLAYER_COMPLEX_ACTION',
    PHASE_PROCESSING_ACTIONS: 'PHASE_PROCESSING_ACTIONS',
    PHASE_UPDATING_GAME_STATE: 'PHASE_UPDATING_GAME_STATE',
    PHASE_WAITING_FOR_CLIENT_ANIMATION: 'PHASE_WAITING_FOR_CLIENT_ANIMATION',
    PHASE_CHECK_VICTORY_CONDITIONS: 'PHASE_CHECK_VICTORY_CONDITIONS',
    PHASE_GAME_ENDED: 'PHASE_GAME_ENDED'
};

export const VALID_PHASE_TRANSITIONS = {
    [GAME_PHASES.PHASE_WAITING_FOR_PLAYERS]: [GAME_PHASES.PHASE_CHARACTER_CREATION],
    [GAME_PHASES.PHASE_CHARACTER_CREATION]: [GAME_PHASES.PHASE_WAITING_FOR_SYNC_START, GAME_PHASES.PHASE_GAME_PAUSED],
    [GAME_PHASES.PHASE_WAITING_FOR_SYNC_START]: [GAME_PHASES.PHASE_WAITING_FOR_PLAYER_INPUT, GAME_PHASES.PHASE_GAME_PAUSED],
    [GAME_PHASES.PHASE_GAME_PAUSED]: [GAME_PHASES.PHASE_WAITING_FOR_PLAYER_INPUT],
    [GAME_PHASES.PHASE_WAITING_FOR_RECONNECT]: [GAME_PHASES.PHASE_WAITING_FOR_PLAYER_INPUT, GAME_PHASES.PHASE_GAME_ENDED],
    [GAME_PHASES.PHASE_WAITING_FOR_VOTE]: [GAME_PHASES.PHASE_WAITING_FOR_PLAYER_INPUT, GAME_PHASES.PHASE_PROCESSING_ACTIONS],
    [GAME_PHASES.PHASE_WAITING_FOR_PLAYER_INPUT]: [
        GAME_PHASES.PHASE_PROCESSING_ACTIONS,
        GAME_PHASES.PHASE_WAITING_FOR_PLAYER_COMPLEX_ACTION,
        GAME_PHASES.PHASE_GAME_PAUSED,
        GAME_PHASES.PHASE_WAITING_FOR_RECONNECT
    ],
    [GAME_PHASES.PHASE_WAITING_FOR_PLAYER_COMPLEX_ACTION]: [GAME_PHASES.PHASE_PROCESSING_ACTIONS, GAME_PHASES.PHASE_GAME_PAUSED],
    [GAME_PHASES.PHASE_PROCESSING_ACTIONS]: [GAME_PHASES.PHASE_UPDATING_GAME_STATE],
    [GAME_PHASES.PHASE_UPDATING_GAME_STATE]: [GAME_PHASES.PHASE_WAITING_FOR_CLIENT_ANIMATION],
    [GAME_PHASES.PHASE_WAITING_FOR_CLIENT_ANIMATION]: [GAME_PHASES.PHASE_CHECK_VICTORY_CONDITIONS],
    [GAME_PHASES.PHASE_CHECK_VICTORY_CONDITIONS]: [GAME_PHASES.PHASE_WAITING_FOR_PLAYER_INPUT, GAME_PHASES.PHASE_GAME_ENDED],
    [GAME_PHASES.PHASE_GAME_ENDED]: []
};

export const MIN_TURN_LENGTH = 100;
export const DEFAULT_MAX_PLAYERS = 4;
export const VALID_PLAYER_COUNTS = [1, 2, 3, 4];

export class GameStateBase {
    static schema = {
        gameUuid: { type: 'string', required: true },
        name: { type: 'string', required: true },
        description: { type: 'string', required: false },
        password: { type: 'string', required: false },
        creatorUuid: { type: 'string', required: true },
        createdAt: { type: 'date', required: true },
        turnLength: { type: 'number', required: true },
        maxPlayers: { type: 'number', required: true },
        playersUuid: { type: 'array', required: true },
        spectatorsUuid: { type: 'array', required: true },
        currentTurn: { type: 'number', required: true },
        nextPlayerUuid: { type: 'string', required: false },
        phase: { type: 'string', required: true }
    };

    constructor(data = {}) {
        // Required fields validation
        if (!data.creatorUuid) {
            throw new Error('Creator UUID is required');
        }

        // Validate phase if provided
        if (data.phase && !Object.values(GAME_PHASES).includes(data.phase)) {
            throw new Error('Invalid game phase');
        }

        // Core game identifiers
        this.gameUuid = data.gameUuid || createGameUuid();
        this.name = data.name || 'New Game';
        this.creatorUuid = data.creatorUuid;
        this.createdAt = data.createdAt || DateService.now();
        this.turnLength = Math.max(data.turnLength || 1000, MIN_TURN_LENGTH);

        // Game configuration
        this.description = data.description || '';
        this.password = data.password || null;
        this.maxPlayers = VALID_PLAYER_COUNTS.includes(data.maxPlayers) ? data.maxPlayers : DEFAULT_MAX_PLAYERS;

        // Player management
        this.playersUuid = [...(Array.isArray(data.playersUuid) ? data.playersUuid : [])];
        this.spectatorsUuid = [...(Array.isArray(data.spectatorsUuid) ? data.spectatorsUuid : [])];
        
        // Game state
        this.currentTurn = Math.max(data.currentTurn || 0, 0);
        this.nextPlayerUuid = data.nextPlayerUuid || null;
        this.phase = data.phase || GAME_PHASES.PHASE_WAITING_FOR_PLAYERS;
    }

    getCurrentPlayerCount() {
        return this.playersUuid.length;
    }

    isFull() {
        return this.getCurrentPlayerCount() >= this.maxPlayers;
    }

    canTransitionTo(newPhase) {
        const validNextPhases = VALID_PHASE_TRANSITIONS[this.phase] || [];
        return validNextPhases.includes(newPhase);
    }

    toJSON() {
        const data = {
            gameUuid: this.gameUuid,
            name: this.name,
            description: this.description,
            password: this.password,
            creatorUuid: this.creatorUuid,
            createdAt: this.createdAt,
            turnLength: this.turnLength,
            maxPlayers: this.maxPlayers,
            playersUuid: this.playersUuid,
            spectatorsUuid: this.spectatorsUuid,
            currentTurn: this.currentTurn,
            nextPlayerUuid: this.nextPlayerUuid,
            phase: this.phase
        };

        // Convert undefined values to null
        Object.keys(data).forEach(key => {
            if (data[key] === undefined) {
                data[key] = null;
            }
        });

        return data;
    }
}
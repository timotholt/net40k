import { db } from '../database/database.js';
import { createGameUuid } from '../constants/GameUuids.js';
import DateService from '../services/DateService.js';
import { Lock } from './Lock.js';

// Valid game phases
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

// Valid phase transitions
const VALID_PHASE_TRANSITIONS = {
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

class GameState {
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
        this.turnLength = Math.max(data.turnLength || 1000, 100); // Minimum 100ms

        // Game configuration
        this.description = data.description || '';
        this.password = data.password || null;
        const validPlayerCounts = [1, 2, 3, 4];
        this.maxPlayers = validPlayerCounts.includes(data.maxPlayers) ? data.maxPlayers : 4; // Default 4 players

        // Player management
        this.playersUuid = [...(Array.isArray(data.playersUuid) ? data.playersUuid : [])];
        this.spectatorsUuid = [...(Array.isArray(data.spectatorsUuid) ? data.spectatorsUuid : [])];
        
        // Game state
        this.currentTurn = Math.max(data.currentTurn || 0, 0);
        this.nextPlayerUuid = data.nextPlayerUuid || null;
        this.phase = data.phase || GAME_PHASES.PHASE_WAITING_FOR_PLAYERS;
    }

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

export const GameStateDB = {
    collection: 'gamestate',

    async create(gameStateData) {
        const gameState = new GameState(gameStateData);
        const result = await db.getEngine().create(this.collection, gameState.toJSON());
        return new GameState(result);
    },

    async findAll() {
        const results = await db.getEngine().find(this.collection, {});
        return results.map(result => new GameState(result));
    },

    async findOne(query) {
        const result = await db.getEngine().findOne(this.collection, query);
        return result ? new GameState(result) : null;
    },

    async findById(gameUuid) {
        const result = await db.getEngine().findOne(this.collection, { gameUuid });
        return result ? new GameState(result) : null;
    },

    async update(query, updateData) {
        const result = await db.getEngine().update(this.collection, query, updateData);
        return result ? new GameState(result) : null;
    },

    async delete(query) {
        return await db.getEngine().delete(this.collection, query);
    },

    async addPlayer(gameUuid, playerUuid) {
        const releaseLock = await Lock.acquire(`game:${gameUuid}`);
        try {
            const game = await this.findById(gameUuid);
            if (!game) {
                throw new Error('Game not found');
            }
            if (game.playersUuid.includes(playerUuid)) {
                return game;
            }
            if (game.isFull()) {
                throw new Error('Game is full');
            }
            game.playersUuid.push(playerUuid);
            return await this.update({ gameUuid }, { playersUuid: game.playersUuid });
        } finally {
            releaseLock();
        }
    },

    async removePlayer(gameUuid, playerUuid) {
        const releaseLock = await Lock.acquire(`game:${gameUuid}`);
        try {
            const game = await this.findById(gameUuid);
            if (!game) {
                throw new Error('Game not found');
            }
            game.playersUuid = game.playersUuid.filter(uuid => uuid !== playerUuid);
            return await this.update({ gameUuid }, { playersUuid: game.playersUuid });
        } finally {
            releaseLock();
        }
    },

    async addSpectator(gameUuid, spectatorUuid) {
        const releaseLock = await Lock.acquire(`game:${gameUuid}`);
        try {
            const game = await this.findById(gameUuid);
            if (!game) {
                throw new Error('Game not found');
            }
            if (game.spectatorsUuid.includes(spectatorUuid)) {
                return game;
            }
            game.spectatorsUuid.push(spectatorUuid);
            return await this.update({ gameUuid }, { spectatorsUuid: game.spectatorsUuid });
        } finally {
            releaseLock();
        }
    },

    async removeSpectator(gameUuid, spectatorUuid) {
        const releaseLock = await Lock.acquire(`game:${gameUuid}`);
        try {
            const game = await this.findById(gameUuid);
            if (!game) {
                throw new Error('Game not found');
            }
            game.spectatorsUuid = game.spectatorsUuid.filter(uuid => uuid !== spectatorUuid);
            return await this.update({ gameUuid }, { spectatorsUuid: game.spectatorsUuid });
        } finally {
            releaseLock();
        }
    },

    async setPhase(gameUuid, newPhase) {
        const releaseLock = await Lock.acquire(`game:${gameUuid}`);
        try {
            const game = await this.findById(gameUuid);
            if (!game) {
                throw new Error('Game not found');
            }
            if (!Object.values(GAME_PHASES).includes(newPhase)) {
                throw new Error('Invalid game phase');
            }
            if (!game.canTransitionTo(newPhase)) {
                throw new Error(`Invalid phase transition from ${game.phase} to ${newPhase}`);
            }
            return await this.update({ gameUuid }, { phase: newPhase });
        } finally {
            releaseLock();
        }
    },

    async setNextPlayer(gameUuid, nextPlayerUuid) {
        const releaseLock = await Lock.acquire(`game:${gameUuid}`);
        try {
            const game = await this.findById(gameUuid);
            if (!game) {
                throw new Error('Game not found');
            }
            if (!game.playersUuid.includes(nextPlayerUuid)) {
                throw new Error('Player not in game');
            }
            return await this.update({ gameUuid }, { nextPlayerUuid });
        } finally {
            releaseLock();
        }
    },

    async updateGameDetails(gameUuid, { name, description }) {
        const releaseLock = await Lock.acquire(`game:${gameUuid}`);
        try {
            const game = await this.findById(gameUuid);
            if (!game) {
                throw new Error('Game not found');
            }
            const updates = {};
            if (name !== undefined) updates.name = name;
            if (description !== undefined) updates.description = description;
            return await this.update({ gameUuid }, updates);
        } finally {
            releaseLock();
        }
    }
};

export default GameState;
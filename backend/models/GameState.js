import { db } from '../database/database.js';
import { createGameUuid } from '../constants/GameUuids.js';
import DateService from '../services/DateService.js';

export const GAME_PHASES = {
    SETUP: 'setup',
    DEPLOYMENT: 'deployment',
    CHARACTER_CREATION: 'characterCreation',
    WAITING_TO_START: 'waitingToStart',
    AWAITING_PLAYER_ACTIONS: 'awaitingPlayerActions',
    PROCESSING_PLAYER_ACTIONS: 'processingPlayerActions',
    PLAYER_PAUSED: 'playerPaused',
    PLAYER_IN_MENU: 'playerInMenu',
    PLAYER_DISCONNECTED: 'playerDisconnected',
    PLAYER_JOINING: 'playerJoining',
    PROCESSING_TURN: 'processingTurn',
    RENDERING_TURN: 'renderingTurn',
    UPDATING_CLIENTS: 'updatingClients',
    SAVING_GAME_STATE: 'savingGameState'
};

class GameState {
    constructor(data = {}) {
        this.gameUuid = data.gameUuid || createGameUuid();
        this.name = data.name || `Game ${this.gameUuid}`;
        this.description = data.description;
        this.password = data.password || null;;
        this.creatorUuid = data.creatorUuid;
        this.createdAt = data.createdAt || DateService.now();
        this.turnLength = data.turnLength || 1000; // default 1s
        this.maxPlayers = Math.min(Math.max(data.maxPlayers || 2, 1), 4);
        this.playersUuid = Array.isArray(data.playersUuid) ? data.playersUuid : [];
        this.spectatorsUuid = Array.isArray(data.spectatorsUuid) ? data.spectatorsUuid : [];
        this.currentTurn = data.currentTurn || 0;
        this.nextPlayerUuid = data.nextPlayerUuid || null;
        this.phase = data.phase || GAME_PHASES.SETUP;
        this.gamePhase = data.gamePhase || GAME_PHASES.CHARACTER_CREATION;
    }

    static schema = {
        gameUuid: { type: 'string', required: true },
        name: { type: 'string', required: true },
        creatorUuid: { type: 'string', required: true },
        createdAt: { type: 'date', required: true },
        turnLength: { type: 'number', required: true },
        maxPlayers: { type: 'number', required: true },
        playersUuid: { type: 'array', required: true },
        spectatorsUuid: { type: 'array', required: true },
        currentTurn: { type: 'number', required: true },
        nextPlayerUuid: { type: 'string', required: false },
        phase: { type: 'string', required: true },
        gamePhase: { type: 'string', required: true }
    };

    toJSON() {
        const data = {
            gameUuid: this.gameUuid,
            name: this.name,
            creatorUuid: this.creatorUuid,
            createdAt: this.createdAt,
            turnLength: this.turnLength,
            maxPlayers: this.maxPlayers,
            playersUuid: this.playersUuid,
            spectatorsUuid: this.spectatorsUuid,
            currentTurn: this.currentTurn,
            nextPlayerUuid: this.nextPlayerUuid,
            phase: this.phase,
            gamePhase: this.gamePhase
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
    collection: { modelName: 'gameStates', schema: GameState.schema },

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

    async updatePhase(gameUuid, phase) {
        if (!Object.values(GAME_PHASES).includes(phase)) {
            throw new Error('Invalid game phase');
        }
        return await this.update({ gameUuid }, { phase });
    },

    async delete(query) {
        return await db.getEngine().delete(this.collection, query);
    },

    async addPlayer(gameUuid, playerUuid) {
        const game = await this.findById(gameUuid);
        if (!game) {
            throw new Error('Game not found');
        }
        if (game.playersUuid.includes(playerUuid)) {
            return game;
        }
        if (game.playersUuid.length >= game.maxPlayers) {
            throw new Error('Game is full');
        }
        game.playersUuid.push(playerUuid);
        return await this.update({ gameUuid }, { playersUuid: game.playersUuid });
    },

    async removePlayer(gameUuid, playerUuid) {
        const game = await this.findById(gameUuid);
        if (!game) {
            throw new Error('Game not found');
        }
        game.playersUuid = game.playersUuid.filter(uuid => uuid !== playerUuid);
        return await this.update({ gameUuid }, { playersUuid: game.playersUuid });
    },

    async addSpectator(gameUuid, spectatorUuid) {
        const game = await this.findById(gameUuid);
        if (!game) {
            throw new Error('Game not found');
        }
        if (game.spectatorsUuid.includes(spectatorUuid)) {
            return game;
        }
        game.spectatorsUuid.push(spectatorUuid);
        return await this.update({ gameUuid }, { spectatorsUuid: game.spectatorsUuid });
    },

    async removeSpectator(gameUuid, spectatorUuid) {
        const game = await this.findById(gameUuid);
        if (!game) {
            throw new Error('Game not found');
        }
        game.spectatorsUuid = game.spectatorsUuid.filter(uuid => uuid !== spectatorUuid);
        return await this.update({ gameUuid }, { spectatorsUuid: game.spectatorsUuid });
    },

    async setPhase(gameUuid, gamePhase) {
        if (!Object.values(GAME_PHASES).includes(gamePhase)) {
            throw new Error('Invalid game phase');
        }
        return await this.update({ gameUuid }, { gamePhase });
    },

    async setNextPlayer(gameUuid, nextPlayerUuid) {
        const game = await this.findById(gameUuid);
        if (!game) {
            throw new Error('Game not found');
        }
        if (!game.playersUuid.includes(nextPlayerUuid)) {
            throw new Error('Player not in game');
        }
        return await this.update({ gameUuid }, { nextPlayerUuid });
    }
};

export default GameState;
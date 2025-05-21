import { db } from '../database/database.js';
import { createGameUuid } from '@net40k/shared';
import DateService from '../services/DateService.js';
import { Lock } from './Lock.js';

// Game phases - core states only
export const GAME_PHASES = {
    LOBBY: 'LOBBY',                 // Initial state, waiting for players
    SETUP: 'SETUP',                // Character creation and loadout selection
    PLAYING: 'PLAYING',            // Active gameplay
    PAUSED: 'PAUSED',              // Game temporarily stopped
    ENDED: 'ENDED'                 // Game completed
};

// Player Game States - Required progression states that affect game flow
// These represent the core setup and play states each player must go through
export const PLAYER_STATES = {
    NOT_READY: 'NOT_READY',           // Initial state when joining
    SELECTING_CHARACTER: 'SELECTING_CHARACTER', // Must pick character first
    SELECTING_LOADOUT: 'SELECTING_LOADOUT',     // Must pick loadout second
    READY: 'READY',                   // Ready to begin game
    PLAYING: 'PLAYING',               // In active gameplay
    DISCONNECTED: 'DISCONNECTED',     // Temporarily disconnected
    DEAD: 'DEAD',                     // Player has died - permanent state change
    ABANDONED: 'ABANDONED',           // Disconnected and vote passed to remove
    
    // Voting states - when player is participating in a vote
    // Admin actions (game creator only)
    ADMIN_KICKING: 'ADMIN_KICKING',             // Creator is removing player
    BEING_ADMIN_KICKED: 'BEING_ADMIN_KICKED',   // Player is being removed by creator
    
    // Kick vote states (for regular players)
    KICK_VOTE_INITIATOR: 'KICK_VOTE_INITIATOR',   // Player started kick vote
    KICK_VOTE_PENDING: 'KICK_VOTE_PENDING',       // Player needs to vote on kick
    KICK_VOTE_COMPLETE: 'KICK_VOTE_COMPLETE',     // Player has voted on kick
    BEING_KICKED: 'BEING_KICKED',                 // Player might get kicked by vote
    KICK_VOTE_ABANDONED: 'KICK_VOTE_ABANDONED',   // Vote cancelled due to disconnects
    
    // Quit vote states (available in-game only)
    QUIT_VOTE_INITIATOR: 'QUIT_VOTE_INITIATOR',   // Player who started quit vote
    QUIT_VOTE_PENDING: 'QUIT_VOTE_PENDING',       // Player needs to vote on quit
    QUIT_VOTE_COMPLETE: 'QUIT_VOTE_COMPLETE',     // Player has voted on quit
    QUIT_VOTE_ABANDONED: 'QUIT_VOTE_ABANDONED',   // Vote cancelled due to disconnects
    
    // Time extension vote states (with autosave)
    TIME_VOTE_INITIATOR: 'TIME_VOTE_INITIATOR',   // Player asking for more time
    TIME_VOTE_PENDING: 'TIME_VOTE_PENDING',       // Player needs to vote on time
    TIME_VOTE_COMPLETE: 'TIME_VOTE_COMPLETE',     // Player has voted on time
    TIME_VOTE_ABANDONED: 'TIME_VOTE_ABANDONED',   // Time vote cancelled
    
    // Vote interruption states
    VOTE_TARGET_DISCONNECTED: 'VOTE_TARGET_DISCONNECTED',   // Being kicked & disconnected
    VOTE_INITIATOR_DISCONNECTED: 'VOTE_INITIATOR_DISCONNECTED', // Started vote & left
    VOTE_INVALIDATED: 'VOTE_INVALIDATED'          // Too many voters disconnected
};

// Player UI States - Optional interaction states during gameplay
// States marked [BLOCKING] halt gameplay until resolved
// States marked [NON-BLOCKING] allow gameplay to continue
// States marked [MODAL] show a popup but others can still play
export const PLAYER_UI_STATES = {
    IDLE: 'IDLE',                     // Not doing anything [NON-BLOCKING]
    // Equipment management - All [MODAL] for this player only
    SELECTING_EQUIP: 'SELECTING_EQUIP',       // Choosing gear to equip
    SELECTING_UNEQUIP: 'SELECTING_UNEQUIP',   // Choosing gear to unequip
    
    // Combat actions - All [MODAL] for this player only
    SELECTING_WEAPON: 'SELECTING_WEAPON',     // Choosing weapon to attack with
    SELECTING_SKILL: 'SELECTING_SKILL',       // Choosing skill to use
    SELECTING_POWER: 'SELECTING_POWER',       // Choosing power to activate
    
    // Level up choices - All [MODAL] with pending notification
    LEVEL_UP_SELECT_POWER: 'LEVEL_UP_SELECT_POWER',   // New power unlocked
    LEVEL_UP_SELECT_SKILL: 'LEVEL_UP_SELECT_SKILL',   // New skill point
    LEVEL_UP_SELECT_SPELL: 'LEVEL_UP_SELECT_SPELL',   // New spell slot
    LEVEL_UP_SELECT_TRAIT: 'LEVEL_UP_SELECT_TRAIT',   // New character trait
    
    // Consumables and items - All [MODAL] for this player only
    SELECTING_FOOD: 'SELECTING_FOOD',           // Choosing food to eat
    SELECTING_POTION: 'SELECTING_POTION',       // Choosing potion to drink/quaff
    SELECTING_SCROLL: 'SELECTING_SCROLL',       // Choosing scroll to read
    SELECTING_WAND: 'SELECTING_WAND',           // Choosing wand to zap/wave
    SELECTING_RING: 'SELECTING_RING',           // Choosing ring to put on/remove
    SELECTING_AMULET: 'SELECTING_AMULET',       // Choosing amulet to put on/remove
    SELECTING_TOOL: 'SELECTING_TOOL',           // Choosing tool to apply/use
    SELECTING_SPELLBOOK: 'SELECTING_SPELLBOOK', // Choosing spellbook to read
    
    // Death handling - [BLOCKING] for all players (team coordination required)
    VIEWING_DEATH_RECAP: 'VIEWING_DEATH_RECAP',   // Team sees how character died
    SELECTING_REVIVAL: 'SELECTING_REVIVAL',       // Team decides on resurrection
    SELECTING_REINFORCEMENT: 'SELECTING_REINFORCEMENT', // Team plans replacement strategy
    
    // Vote UI - Mostly blocking (votes need immediate team attention)
    INITIATING_VOTE: 'INITIATING_VOTE',         // Opening vote menu [BLOCKING]
    SELECTING_VOTE_TYPE: 'SELECTING_VOTE_TYPE',  // Choosing vote type [BLOCKING]
    SELECTING_KICK_TARGET: 'SELECTING_KICK_TARGET', // Target selection [BLOCKING]
    ADMIN_SELECTING_KICK: 'ADMIN_SELECTING_KICK',   // Admin kick [BLOCKING]
    ENTERING_QUIT_REASON: 'ENTERING_QUIT_REASON',  // Quit reason [BLOCKING]
    SELECTING_TIME: 'SELECTING_TIME',            // Time extension [BLOCKING]
    CASTING_VOTE: 'CASTING_VOTE',                // Yes/No choice [BLOCKING]
    VIEWING_VOTE_RESULTS: 'VIEWING_VOTE_RESULTS',  // Vote outcome [BLOCKING]
    AUTOSAVING: 'AUTOSAVING',                    // Quick save [NON-BLOCKING]
    VIEWING_VOTE_HISTORY: 'VIEWING_VOTE_HISTORY',  // Past votes [NON-BLOCKING]
    
    // Game over states - All [NON-BLOCKING], can view in any order
    VIEWING_MISSION_REPORT: 'VIEWING_MISSION_REPORT',   // Overall mission outcome
    VIEWING_ACHIEVEMENTS: 'VIEWING_ACHIEVEMENTS',       // What the team accomplished
    VIEWING_FINAL_SCORE: 'VIEWING_FINAL_SCORE',        // Team's final score
    VIEWING_CASUALTIES: 'VIEWING_CASUALTIES',           // List of fallen warriors
    VIEWING_LOOT_RECOVERED: 'VIEWING_LOOT_RECOVERED',   // Equipment and items found
    VIEWING_OBJECTIVES: 'VIEWING_OBJECTIVES',           // Primary/secondary goals completed
    VIEWING_BATTLE_REPLAY: 'VIEWING_BATTLE_REPLAY',     // Replay key moments
    VIEWING_KILL_COUNT: 'VIEWING_KILL_COUNT',           // Enemies defeated by type
    VIEWING_BATTLE_HONORS: 'VIEWING_BATTLE_HONORS',      // Special achievements/medals
    
    // Status checking - All [NON-BLOCKING]
    VIEWING_STATS: 'VIEWING_STATS',           // Looking at character stats
    VIEWING_INVENTORY: 'VIEWING_INVENTORY',    // Looking at inventory
    VIEWING_NOTIFICATIONS: 'VIEWING_NOTIFICATIONS',  // Checking pending choices
    
    // Notification actions - All [MODAL] with persistent queue
    ROLLING_FOR_LOOT: 'ROLLING_FOR_LOOT',      // Need/Greed/Pass on item
    ACCEPTING_REVIVE: 'ACCEPTING_REVIVE',       // Someone trying to res you
    ACCEPTING_BUFF: 'ACCEPTING_BUFF',          // Someone casting buff on you
    ACCEPTING_TELEPORT: 'ACCEPTING_TELEPORT',   // Someone portaling you
    PENDING_LEVEL_UP: 'PENDING_LEVEL_UP',        // Level up choices waiting
    
    // Notifications (non-modal, informative)
    SHOWING_ADMIN_ACTION: 'SHOWING_ADMIN_ACTION',   // Creator did something important
    SHOWING_PLAYER_LEFT: 'SHOWING_PLAYER_LEFT',     // Player was removed/quit
    SHOWING_TEAM_CHANGE: 'SHOWING_TEAM_CHANGE'      // Team composition changed
};

// Game phase transitions
// Any phase can transition to ENDED (mission abort, team wipe, victory, etc)
// except ENDED itself which is final
// Game phase transitions - Overall game state flow
const VALID_PHASE_TRANSITIONS = {
    [GAME_PHASES.LOBBY]: [
        GAME_PHASES.SETUP,    // Normal flow: team is ready
        GAME_PHASES.ENDED     // Abort: team disbanded
    ],
    [GAME_PHASES.SETUP]: [
        GAME_PHASES.PLAYING,  // Normal flow: start mission
        GAME_PHASES.PAUSED,   // Pause: team needs break
        GAME_PHASES.ENDED     // Abort: team not viable
    ],
    [GAME_PHASES.PLAYING]: [
        GAME_PHASES.PAUSED,   // Tactical pause
        GAME_PHASES.ENDED     // Mission complete/failed
    ],
    [GAME_PHASES.PAUSED]: [
        GAME_PHASES.PLAYING,  // Resume mission
        GAME_PHASES.ENDED     // Abort mission
    ],
    [GAME_PHASES.ENDED]: []   // No transitions out of end state
};

// Vote flow transitions - How players move through different vote types
const VALID_VOTE_TRANSITIONS = {
    // Kick vote flow (available in all phases)
    [PLAYER_STATES.PLAYING]: [
        PLAYER_STATES.KICK_VOTE_INITIATOR,
        PLAYER_STATES.KICK_VOTE_PENDING,
        PLAYER_STATES.BEING_KICKED
    ],
    [PLAYER_STATES.KICK_VOTE_INITIATOR]: [
        PLAYER_STATES.KICK_VOTE_COMPLETE,
        PLAYER_STATES.VOTE_INITIATOR_DISCONNECTED
    ],
    [PLAYER_STATES.KICK_VOTE_PENDING]: [
        PLAYER_STATES.KICK_VOTE_COMPLETE,
        PLAYER_STATES.VOTE_INVALIDATED
    ],
    [PLAYER_STATES.BEING_KICKED]: [
        PLAYER_STATES.ABANDONED,
        PLAYER_STATES.PLAYING,  // If vote fails
        PLAYER_STATES.VOTE_TARGET_DISCONNECTED
    ],

    // Time extension flow (in-game only)
    [PLAYER_STATES.TIME_VOTE_INITIATOR]: [
        PLAYER_STATES.TIME_VOTE_COMPLETE,
        PLAYER_STATES.TIME_VOTE_ABANDONED
    ],
    [PLAYER_STATES.TIME_VOTE_PENDING]: [
        PLAYER_STATES.TIME_VOTE_COMPLETE,
        PLAYER_STATES.TIME_VOTE_ABANDONED
    ],

    // Quit vote flow (in-game only)
    [PLAYER_STATES.QUIT_VOTE_INITIATOR]: [
        PLAYER_STATES.QUIT_VOTE_COMPLETE,
        PLAYER_STATES.QUIT_VOTE_ABANDONED
    ],
    [PLAYER_STATES.QUIT_VOTE_PENDING]: [
        PLAYER_STATES.QUIT_VOTE_COMPLETE,
        PLAYER_STATES.QUIT_VOTE_ABANDONED
    ],

    // Admin actions (available in all phases)
    [PLAYER_STATES.ADMIN_KICKING]: [
        PLAYER_STATES.PLAYING  // After kick is done
    ],
    [PLAYER_STATES.BEING_ADMIN_KICKED]: [
        PLAYER_STATES.ABANDONED
    ]
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
        this.phase = data.phase || GAME_PHASES.LOBBY;
        
        // Initialize player states
        this.playerStates = {};
        this.playerUiStates = {};
        this.playersUuid.forEach(uuid => {
            this.playerStates[uuid] = data.playerStates?.[uuid] || PLAYER_STATES.NOT_READY;
            this.playerUiStates[uuid] = data.playerUiStates?.[uuid] || PLAYER_UI_STATES.IDLE;
        });
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
        phase: { type: 'string', required: true },
        playerStates: { type: 'object', required: true },
        playerUiStates: { type: 'object', required: true }
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
export class GameStateServer extends GameStateBase {
    static collection = 'gamestate';

    constructor(data = {}) {
        super(data);
        this.db = new Database();
        this.events = new EventEmitter();
    }

    async save() {
        const data = this.toJSON();
        const engine = this.db.getEngine();
        const existing = await engine.findOne(GameStateServer.collection, { gameUuid: this.gameUuid });
        
        if (existing) {
            await engine.update(GameStateServer.collection, { gameUuid: this.gameUuid }, data);
        } else {
            await engine.create(GameStateServer.collection, data);
        }
        
        this.events.emit('game:updated', { gameUuid: this.gameUuid });
        return this;
    }

    async delete() {
        await this.db.getEngine().delete(GameStateServer.collection, { gameUuid: this.gameUuid });
        this.events.emit('game:deleted', { gameUuid: this.gameUuid });
    }

    async addPlayer(playerUuid) {
        const releaseLock = await Lock.acquire(`game:${this.gameUuid}`);
        try {
            if (this.isFull()) {
                throw new Error('Game is full');
            }
            if (this.playersUuid.includes(playerUuid)) {
                throw new Error('Player already in game');
            }
            if (this.phase !== GAME_PHASES.PHASE_WAITING_FOR_PLAYERS) {
                throw new Error('Cannot join game in current phase');
            }

            this.playersUuid.push(playerUuid);
            await this.save();
            this.events.emit('game:player:joined', { gameUuid: this.gameUuid, playerUuid });
            return this;
        } finally {
            releaseLock();
        }
    }

    async removePlayer(playerUuid) {
        const releaseLock = await Lock.acquire(`game:${this.gameUuid}`);
        try {
            const playerIndex = this.playersUuid.indexOf(playerUuid);
            if (playerIndex === -1) {
                throw new Error('Player not in game');
            }

            this.playersUuid.splice(playerIndex, 1);
            
            // If game is empty, delete it
            if (this.playersUuid.length === 0) {
                await this.delete();
                return null;
            }

            // If creator leaves, assign new creator
            if (playerUuid === this.creatorUuid && this.playersUuid.length > 0) {
                this.creatorUuid = this.playersUuid[0];
            }

            await this.save();
            this.events.emit('game:player:left', { gameUuid: this.gameUuid, playerUuid });
            return this;
        } finally {
            releaseLock();
        }
    }

    async addSpectator(spectatorUuid) {
        const releaseLock = await Lock.acquire(`game:${this.gameUuid}`);
        try {
            if (this.spectatorsUuid.includes(spectatorUuid)) {
                throw new Error('Already spectating game');
            }

            this.spectatorsUuid.push(spectatorUuid);
            await this.save();
            this.events.emit('game:spectator:joined', { gameUuid: this.gameUuid, spectatorUuid });
            return this;
        } finally {
            releaseLock();
        }
    }

    async removeSpectator(spectatorUuid) {
        const releaseLock = await Lock.acquire(`game:${this.gameUuid}`);
        try {
            const spectatorIndex = this.spectatorsUuid.indexOf(spectatorUuid);
            if (spectatorIndex === -1) {
                throw new Error('Not spectating game');
            }

            this.spectatorsUuid.splice(spectatorIndex, 1);
            await this.save();
            this.events.emit('game:spectator:left', { gameUuid: this.gameUuid, spectatorUuid });
            return this;
        } finally {
            releaseLock();
        }
    }

    async setPhase(newPhase) {
        const releaseLock = await Lock.acquire(`game:${this.gameUuid}`);
        try {
            if (!this.canTransitionTo(newPhase)) {
                throw new Error(`Invalid phase transition from ${this.phase} to ${newPhase}`);
            }

            const oldPhase = this.phase;
            this.phase = newPhase;
            await this.save();
            this.events.emit('game:phase:changed', { 
                gameUuid: this.gameUuid, 
                oldPhase,
                newPhase 
            });
            return this;
        } finally {
            releaseLock();
        }
    }

    async setNextPlayer(playerUuid) {
        const releaseLock = await Lock.acquire(`game:${this.gameUuid}`);
        try {
            if (!this.playersUuid.includes(playerUuid)) {
                throw new Error('Player not in game');
            }

            const oldPlayerUuid = this.nextPlayerUuid;
            this.nextPlayerUuid = playerUuid;
            this.currentTurn++;
            await this.save();
            this.events.emit('game:turn:changed', {
                gameUuid: this.gameUuid,
                oldPlayerUuid,
                newPlayerUuid: playerUuid,
                currentTurn: this.currentTurn
            });
            return this;
        } finally {
            releaseLock();
        }
    }

    async updateGameDetails({ name, description }) {
        const releaseLock = await Lock.acquire(`game:${this.gameUuid}`);
        try {
            if (name !== undefined) this.name = name;
            if (description !== undefined) this.description = description;
            await this.save();
            return this;
        } finally {
            releaseLock();
        }
    }

    static async findByUuid(gameUuid) {
        const db = new Database();
        const data = await db.getEngine().findOne(GameStateServer.collection, { uuid: gameUuid });
        return data ? new GameStateServer(data) : null;
    }

    static async findActive() {
        const db = new Database();
        const games = await db.getEngine().find(GameStateServer.collection, {
            phase: { $ne: GAME_PHASES.PHASE_GAME_ENDED }
        });
        return games.map(data => new GameStateServer(data));
    }
}
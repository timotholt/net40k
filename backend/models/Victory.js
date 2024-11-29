import { db } from '../database/database.js';
import { ValidationError } from '../utils/errors.js';
import { generateSchema } from '../utils/schemaGenerator.js';
import logger from '../utils/logger.js';

class Victory {
    constructor(data = {}) {
        this.gameUuid = data.gameUuid;
        this.players = data.players || [];
        this.nickname = data.nickname;
        this.faction = data.faction;
        this.type = data.type;
        this.description = data.description || '';
        this.turnCount = data.turnCount;
        this.timestamp = data.timestamp || new Date();
    }

    static schema = generateSchema(new Victory(), {
        gameUuid: { type: 'string', required: true },
        players: { type: 'array', required: true },
        nickname: { type: 'string', required: true },
        faction: { type: 'string', required: true },
        type: { type: 'string', required: true },
        description: { type: 'string' },
        turnCount: { type: 'number', required: true },
        timestamp: { type: 'date', required: true }
    });

    validate() {
        if (!this.gameUuid) throw new ValidationError('gameUuid is required');
        if (!this.players.length) throw new ValidationError('At least one player is required');
        if (!this.nickname) throw new ValidationError('nickname is required');
        if (!this.faction) throw new ValidationError('faction is required');
        if (!this.type) throw new ValidationError('type is required');
        if (typeof this.turnCount !== 'number') throw new ValidationError('turnCount must be a number');
    }

    toJSON() {
        return {
            gameUuid: this.gameUuid,
            players: this.players,
            nickname: this.nickname,
            faction: this.faction,
            type: this.type,
            description: this.description,
            turnCount: this.turnCount,
            timestamp: this.timestamp
        };
    }
}

export const VictoryDB = {
    collection: 'victory',

    async init() {
        const schema = generateSchema({
            gameUuid: { type: 'string', required: true },
            players: { type: 'array', required: true },
            nickname: { type: 'string', required: true },
            faction: { type: 'string', required: true },
            type: { type: 'string', required: true },
            description: { type: 'string' },
            turnCount: { type: 'number', required: true },
            timestamp: { type: 'date', required: true }
        });

        await db.createCollection(this.collection, { schema });
        await db.createIndex(this.collection, { gameUuid: 1 });
        await db.createIndex(this.collection, { players: 1 });
        await db.createIndex(this.collection, { timestamp: -1 });
        logger.info('Victory collection initialized');
    },

    async create(victoryData) {
        try {
            const victory = new Victory(victoryData);
            victory.validate();
            
            logger.debug('VictoryDB.create - Creating victory:', victory.toJSON());
            const result = await db.create(this.collection, victory.toJSON());
            logger.info(`Victory created successfully for game: ${victory.gameUuid}`);
            
            return this._toVictoryInstance(result);
        } catch (error) {
            logger.error(`Failed to create victory: ${error.message}`);
            throw error;
        }
    },

    async findOne(query) {
        const result = await db.findOne(this.collection, query);
        return result ? this._toVictoryInstance(result) : null;
    },

    async find(query = {}, options = {}) {
        const results = await db.find(this.collection, query, options);
        return results.map(result => this._toVictoryInstance(result));
    },

    async getLatest(limit = 10) {
        return await this.find({}, { 
            sort: { timestamp: -1 }, 
            limit 
        });
    },

    async getStats() {
        const pipeline = [
            {
                $group: {
                    _id: null,
                    totalVictories: { $sum: 1 },
                    averageTurnCount: { $avg: '$turnCount' },
                    factionStats: {
                        $push: {
                            faction: '$faction',
                            count: 1
                        }
                    }
                }
            }
        ];
        
        const results = await db.aggregate(this.collection, pipeline);
        return results[0] || { totalVictories: 0, averageTurnCount: 0, factionStats: [] };
    },

    _toVictoryInstance(dbObject) {
        return new Victory(dbObject);
    }
};

export default Victory;

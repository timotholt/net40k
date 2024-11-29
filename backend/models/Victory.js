import { db } from '../database/database.js';
import { ValidationError } from '../utils/errors.js';
import { generateSchema } from '../utils/schemaGenerator.js';
import logger from '../utils/logger.js';
import { isFeatureEnabled } from '../config/features.js';

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
        if (!this.nickname) throw new ValidationError('Nickname is required');
        if (!this.faction) throw new ValidationError('Faction is required');
        if (!this.type) throw new ValidationError('Victory type is required');
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
        await db.createCollection(this.collection);
        await db.createIndex(this.collection, { gameUuid: 1 });
        await db.createIndex(this.collection, { players: 1 });
        await db.createIndex(this.collection, { timestamp: -1 });
        logger.info('Victory collection initialized');

        // Check if collection is empty and add mock data
        const existingVictories = await this.find({}, { limit: 1 });
        if (existingVictories.length === 0) {
            await this.addMockData();
        }
    },

    async addMockData() {
        const mockVictories = [
            {
                gameUuid: 'game-001',
                players: ['player-001', 'player-002'],
                nickname: 'Admiral Spock',
                faction: 'Federation',
                type: 'Tactical Superiority',
                description: 'Decisive victory through strategic positioning',
                turnCount: 12,
                timestamp: new Date('2024-01-15T10:30:00Z')
            },
            {
                gameUuid: 'game-002',
                players: ['player-003', 'player-004'],
                nickname: 'Darth Vader',
                faction: 'Empire',
                type: 'Total Annihilation',
                description: 'Complete destruction of enemy forces',
                turnCount: 15,
                timestamp: new Date('2024-01-16T14:45:00Z')
            },
            {
                gameUuid: 'game-003',
                players: ['player-005', 'player-006'],
                nickname: 'Captain Picard',
                faction: 'Federation',
                type: 'Diplomatic Resolution',
                description: 'Victory through negotiation and diplomacy',
                turnCount: 8,
                timestamp: new Date('2024-01-17T09:15:00Z')
            },
            {
                gameUuid: 'game-004',
                players: ['player-007', 'player-008'],
                nickname: 'Thrawn',
                faction: 'Imperial Remnant',
                type: 'Strategic Maneuver',
                description: 'Outmaneuvering opponents through calculated strategy',
                turnCount: 20,
                timestamp: new Date('2024-01-18T16:20:00Z')
            },
            {
                gameUuid: 'game-005',
                players: ['player-009', 'player-010'],
                nickname: 'Jean-Luc Sisko',
                faction: 'Federation',
                type: 'Defensive Victory',
                description: 'Successful defense against overwhelming odds',
                turnCount: 18,
                timestamp: new Date('2024-01-19T11:55:00Z')
            }
        ];

        try {
            for (const victoryData of mockVictories) {
                const victory = new Victory(victoryData);
                await this.create(victory);
            }
            logger.info(`Added ${mockVictories.length} mock victory records`);
        } catch (error) {
            logger.error('Failed to add mock victory data:', error);
            throw error;
        }
    },

    async ensureMockData() {
        const existingVictories = await this.find({}, { limit: 1 });
        if (existingVictories.length === 0) {
            return await this.addMockData();
        }
        return 0;
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
        logger.info('VictoryDB.find - Query:', query);
        logger.info('VictoryDB.find - Options:', options);
        const results = await db.find(this.collection, query, options);
        logger.info('VictoryDB.find - Results count:', results.length);
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

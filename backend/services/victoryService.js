const Victory = require('../models/Victory');
const { ValidationError } = require('../utils/errors');

class VictoryService {
    async createVictory(victoryData) {
        try {
            const victory = new Victory(victoryData);
            await victory.save();
            return victory;
        } catch (error) {
            throw new ValidationError('Failed to create victory record: ' + error.message);
        }
    }

    async getVictories(filters = {}, limit = 50, skip = 0) {
        try {
            const query = {};
            
            if (filters.gameUuid) query.gameUuid = filters.gameUuid;
            if (filters.players) query.players = { $in: Array.isArray(filters.players) ? filters.players : [filters.players] };
            if (filters.faction) query.faction = filters.faction;
            if (filters.type) query.type = filters.type;
            
            const victories = await Victory.find(query)
                .sort({ timestamp: -1 })
                .skip(skip)
                .limit(limit)
                .lean();
                
            return victories;
        } catch (error) {
            throw new Error('Failed to fetch victories: ' + error.message);
        }
    }

    async getVictoryById(id) {
        try {
            const victory = await Victory.findById(id).lean();
            if (!victory) {
                throw new ValidationError('Victory not found');
            }
            return victory;
        } catch (error) {
            throw new Error('Failed to fetch victory: ' + error.message);
        }
    }

    async getLatestVictories(limit = 10) {
        try {
            return await Victory.find()
                .sort({ timestamp: -1 })
                .limit(limit)
                .lean();
        } catch (error) {
            throw new Error('Failed to fetch latest victories: ' + error.message);
        }
    }

    async getVictoryStats() {
        try {
            const stats = await Victory.aggregate([
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
            ]);

            return stats[0] || { totalVictories: 0, averageTurnCount: 0, factionStats: [] };
        } catch (error) {
            throw new Error('Failed to fetch victory statistics: ' + error.message);
        }
    }
}

module.exports = new VictoryService();

import { UserDB } from '../models/User.js';
import { SYSTEM_USERS, createUserUuid } from '../../shared/constants/GameUuids.js';
import logger from '../utils/logger.js';
import crypto from 'crypto';
import DateService from '../services/DateService.js';

class SystemUserService {
    static SYSTEM_USER_CONFIGS = [
        {
            uuid: SYSTEM_USERS.SYSTEM,
            username: 'system',
            nickname: 'System',
            email: 'system@net40k.com',
            isAdmin: true
        },
        {
            uuid: SYSTEM_USERS.GM,
            username: 'gamemaster',
            nickname: 'Game Master',
            email: 'gamemaster@net40k.com',
            isAdmin: true
        },
        {
            uuid: SYSTEM_USERS.NEWS,
            username: 'news',
            nickname: 'News',
            email: 'news@net40k.com',
            isAdmin: false
        }
    ];

    static async initializeSystemUsers() {
        try {
            for (const userConfig of this.SYSTEM_USER_CONFIGS) {
                await this.createOrGetSystemUser(userConfig);
            }
            logger.info('All system users initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize system users:', error);
            throw error;
        }
    }

    static async createOrGetSystemUser(userConfig) {
        // Check if system user already exists
        const existingUser = await UserDB.findOne({ 
            username: userConfig.username, 
            userUuid: userConfig.uuid 
        });

        if (!existingUser) {
            const systemUser = await UserDB.create({
                userUuid: userConfig.uuid,
                username: userConfig.username,
                nickname: userConfig.nickname,
                email: userConfig.email,
                password: crypto.randomBytes(32).toString('hex'), // Secure, unusable password
                createdAt: DateService.now().date,
                isAdmin: userConfig.isAdmin,
                isActive: true,
                isVerified: true
            });

            logger.info(`System user created: ${userConfig.username}`);
            return systemUser;
        }

        return existingUser;
    }
}

export default SystemUserService;

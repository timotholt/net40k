// services/ChatCommandService.js
import { chatService } from './ChatService.js';
import { UserDB } from '../models/User.js';
import { APIError } from '../middleware/errorHandling.js';
import logger from '../utils/logger.js';

class ChatCommandService {
    constructor() {
        if (ChatCommandService.instance) {
            return ChatCommandService.instance;
        }
        
        // Initialize commands map
        this.commands = new Map([
            ['help', {
                execute: this.helpCommand.bind(this),
                permission: 'all',
                help: 'Show available commands'
            }],
            ['nick', {
                execute: this.nickCommand.bind(this),
                permission: 'all',
                help: 'Change nickname: /nick <new_nickname>'
            }],
            ['w', {
                execute: this.whisperCommand.bind(this),
                permission: 'all',
                help: 'Send private message: /w <userUuid> <message>'
            }],
            ['whisper', {
                execute: this.whisperCommand.bind(this),
                permission: 'all',
                help: 'Send private message: /whisper <userUuid> <message>'
            }],
            ['kick', {
                execute: this.kickCommand.bind(this),
                permission: 'creator',
                help: 'Kick user from game: /kick <userUuid>'
            }]
        ]);

        ChatCommandService.instance = this;
    }

    async initialize() {
        logger.info('Initializing ChatCommandService...');
        // Add any initialization logic here
        return this;
    }

    static getInstance() {
        if (!ChatCommandService.instance) {
            ChatCommandService.instance = new ChatCommandService();
        }
        return ChatCommandService.instance;
    }

    async processCommand(type, userUuid, message, gameId = null) {
        if (!message.startsWith('/')) {
            return false;
        }

        const [command, ...args] = message.slice(1).split(' ');
        const cmd = this.commands.get(command.toLowerCase());

        if (!cmd) {
            throw new APIError('Unknown command', 400);
        }

        await cmd.execute(type, userUuid, args, gameId);
        return true;
    }

    // Command implementations
    async helpCommand(type, userUuid, args, gameId) {
        const helpText = Array.from(this.commands.entries())
            .map(([name, cmd]) => `/${name} - ${cmd.help}`)
            .join('\n');
        
        await chatService.createMessage(
            type,
            userUuid,
            `Available commands:\n${helpText}`,
            gameId
        );
    }

    async nickCommand(type, userUuid, args, gameId) {
        const newNick = args[0];
        if (!newNick) {
            throw new APIError('New nickname required', 400);
        }

        const user = await UserDB.findOne({ userUuid });
        if (!user) {
            throw new APIError('User not found', 404);
        }

        await UserDB.update({ userUuid }, { nickname: newNick });
        await chatService.updateUserNickname(userUuid, newNick);
    }

    async whisperCommand(type, userUuid, args, gameId) {
        if (args.length < 2) {
            throw new APIError('Usage: /w <userUuid> <message>', 400);
        }

        const targetUserUuid = args[0];
        const message = args.slice(1).join(' ');

        const user = await UserDB.findOne({ userUuid: targetUserUuid });
        if (!user) {
            throw new APIError('User not found', 404);
        }

        await chatService.createPrivateMessage(userUuid, targetUserUuid, message);
    }

    async kickCommand(type, userUuid, args, gameId) {
        if (!gameId) {
            throw new APIError('This command can only be used in a game', 400);
        }

        if (args.length < 1) {
            throw new APIError('Usage: /kick <userUuid>', 400);
        }

        const targetUserUuid = args[0];
        const user = await UserDB.findOne({ userUuid: targetUserUuid });
        if (!user) {
            throw new APIError('User not found', 404);
        }

        // Verify user has permission to kick
        const game = await chatService.getGame(gameId);
        if (game.creatorUuid !== userUuid) {
            throw new APIError('Only the game creator can kick users', 403);
        }

        await chatService.removeUserFromGame(targetUserUuid, gameId);
        await chatService.createMessage(
            'system',
            userUuid,
            `${user.nickname} has been kicked from the game`,
            gameId
        );
    }
}

export const chatCommandService = ChatCommandService.getInstance();

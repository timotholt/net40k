// routes/chat.js
import express from 'express';
import { chatService } from '../services/ChatService.js';
import dotenv from 'dotenv';
import { validateUuid, validateMultipleUuids } from '../middleware/uuidValidation.js';

dotenv.config();
const router = express.Router();

// GET /chat?type=lobby
// GET /chat?type=game&gameId=
router.get('/', validateMultipleUuids(['userId']), async (req, res, next) => {
    const { type, gameId, userId } = req.query;
    
    try {
        const messages = await chatService.getMessages(type, gameId, userId);
        res.json(messages);
    } catch (error) {
        next(error);
    }
});

// POST /chat
router.post('/', validateMultipleUuids(['userId']), async (req, res, next) => {
    const { type, gameId, userId, message } = req.body;

    try {
        const chatMessage = await chatService.createMessage(type, userId, message, gameId);
        res.json({
            success: true,
            message: chatMessage
        });
    } catch (error) {
        next(error);
    }
});

// DELETE /chat/game/:gameId
router.delete('/game/:gameId', validateMultipleUuids(['userId']), async (req, res, next) => {
    const { gameId } = req.params;
    const userId = req.query.userId;

    try {
        await chatService.deleteGameChat(gameId, userId);
        res.json({
            success: true,
            message: 'Chat history deleted'
        });
    } catch (error) {
        next(error);
    }
});

export { router };

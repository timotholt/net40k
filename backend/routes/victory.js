import express from 'express';
import { VictoryDB } from '../models/Victory.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

// Get all victories with optional filtering
router.get('/', authenticateUser, asyncHandler(async (req, res) => {
    const { limit = 50, skip = 0, ...filters } = req.query;
    const victories = await VictoryDB.find(filters, { 
        limit: parseInt(limit), 
        skip: parseInt(skip),
        sort: { timestamp: -1 }
    });
    res.json(victories);
}));

// Get latest victories
router.get('/latest', authenticateUser, asyncHandler(async (req, res) => {
    const { limit = 10 } = req.query;
    const victories = await VictoryDB.getLatest(parseInt(limit));
    res.json(victories);
}));

// Get victory statistics
router.get('/stats', authenticateUser, asyncHandler(async (req, res) => {
    const stats = await VictoryDB.getStats();
    res.json(stats);
}));

// Get specific victory
router.get('/:id', authenticateUser, asyncHandler(async (req, res) => {
    const victory = await VictoryDB.findOne({ _id: req.params.id });
    if (!victory) {
        res.status(404).json({ error: 'Victory not found' });
        return;
    }
    res.json(victory);
}));

// Create new victory record
router.post('/', authenticateUser, asyncHandler(async (req, res) => {
    const victory = await VictoryDB.create(req.body);
    res.status(201).json(victory);
}));

export default router;

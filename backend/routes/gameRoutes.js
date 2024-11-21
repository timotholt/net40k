import express from 'express';
import GameService from '../services/GameService.js';
import { authenticateUser, authenticateAdmin } from '../middleware/auth.js';

const router = express.Router();

// Wrap async middleware to handle errors
const asyncMiddleware = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Middleware to apply authentication to all routes
router.use(asyncMiddleware(authenticateUser));

// Create a new game
router.post('/', asyncMiddleware(async (req, res) => {
  try {
    const { name, description, maxPlayers, password } = req.body;
    const creatorUuid = req.user.userUuid;
    
    const newGame = await GameService.createGame(
      name, 
      description, 
      creatorUuid, 
      maxPlayers, 
      password
    );
    
    res.status(201).json(newGame);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

// List games
router.get('/', asyncMiddleware(async (req, res) => {
  try {
    // Build query object, removing undefined values
    const filters = {};
    if (req.query.status) filters.status = req.query.status;
    if (req.query.maxPlayers) filters.maxPlayers = parseInt(req.query.maxPlayers);

    const games = await GameService.listGames(
      filters, 
      req.user?.userUuid
    );
    res.json(games);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}));

// Get specific game
router.get('/:gameUuid', asyncMiddleware(async (req, res) => {
  try {
    const game = await GameService.getGame(req.params.gameUuid);
    res.json(game);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
}));

// Update game
router.patch('/:gameUuid', asyncMiddleware(async (req, res) => {
  try {
    const updatedGame = await GameService.updateGame(
      req.params.gameUuid, 
      req.body
    );
    res.json(updatedGame);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

// Join game
router.post('/:gameUuid/join', asyncMiddleware(async (req, res) => {
  try {
    const game = await GameService.joinGame(
      req.params.gameUuid, 
      req.user.userUuid
    );
    res.json(game);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

// Leave game
router.post('/:gameUuid/leave', asyncMiddleware(async (req, res) => {
  try {
    const game = await GameService.leaveGame(
      req.params.gameUuid, 
      req.user.userUuid
    );
    res.json(game);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

// Get game settings
router.get('/:gameUuid/settings', asyncMiddleware(async (req, res) => {
  try {
    const { gameUuid } = req.params;
    const userUuid = req.user.userUuid;

    const gameSettings = await GameService.getGameSettings(gameUuid, userUuid);
    res.json(gameSettings);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

// Update game settings
router.put('/:gameUuid/settings', asyncMiddleware(async (req, res) => {
  try {
    const { gameUuid } = req.params;
    const { name, description, maxPlayers, turnLength, password } = req.body;
    const userUuid = req.user.userUuid;

    const updatedGame = await GameService.updateGameSettings(
      gameUuid, 
      userUuid, 
      { name, description, maxPlayers, turnLength, password }
    );
    
    res.json(updatedGame);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

// Delete game
// Two routes: one for regular users, one for admins
router.delete('/:gameUuid', authenticateUser, asyncMiddleware(async (req, res) => {
  try {
    await GameService.deleteGame(
      req.params.gameUuid, 
      req.user.userUuid  // Pass authenticated user's UUID
    );
    res.status(204).send(); // No content on successful deletion
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

// Admin delete route with fewer restrictions
router.delete('/admin/:gameUuid', authenticateAdmin, asyncMiddleware(async (req, res) => {
  try {
    await GameService.deleteGame(
      req.params.gameUuid, 
      req.user.userUuid,  // Pass authenticated admin's UUID
      true  // Indicate admin deletion
    );
    res.status(204).send(); // No content on successful deletion
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

export { router };

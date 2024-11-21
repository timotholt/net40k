import express from 'express';
import RoomService from '../services/RoomService.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

// Wrap async middleware to handle errors
const asyncMiddleware = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Middleware to apply authentication to all routes
router.use(asyncMiddleware(authenticateUser));

// Create a new room
router.post('/', asyncMiddleware(async (req, res) => {
  try {
    const { name, description, maxPlayers, password } = req.body;
    const creatorUuid = req.user.userUuid;
    
    const newRoom = await RoomService.createRoom(
      name, 
      description, 
      creatorUuid, 
      maxPlayers, 
      password
    );
    
    res.status(201).json(newRoom);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

// List rooms
router.get('/', asyncMiddleware(async (req, res) => {
  try {
    const { status, maxPlayers } = req.query;
    const rooms = await RoomService.listRooms({ status, maxPlayers });
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}));

// Get specific room
router.get('/:roomUuid', asyncMiddleware(async (req, res) => {
  try {
    const room = await RoomService.getRoom(req.params.roomUuid);
    res.json(room);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
}));

// Update room
router.patch('/:roomUuid', asyncMiddleware(async (req, res) => {
  try {
    const updatedRoom = await RoomService.updateRoom(
      req.params.roomUuid, 
      req.body
    );
    res.json(updatedRoom);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

// Join room
router.post('/:roomUuid/join', asyncMiddleware(async (req, res) => {
  try {
    const room = await RoomService.joinRoom(
      req.params.roomUuid, 
      req.user.userUuid
    );
    res.json(room);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

// Leave room
router.post('/:roomUuid/leave', asyncMiddleware(async (req, res) => {
  try {
    const room = await RoomService.leaveRoom(
      req.params.roomUuid, 
      req.user.userUuid
    );
    res.json(room);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}));

// Delete room
router.delete('/:roomUuid', asyncMiddleware(async (req, res) => {
  try {
    await RoomService.deleteRoom(req.params.roomUuid);
    res.status(204).send();
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
}));

export { router };

import express from 'express';
import RoomService from '../services/RoomService.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Create a new room
router.post('/', authMiddleware, (req, res) => {
  try {
    const { name, description, maxPlayers, password } = req.body;
    const creatorUuid = req.user.uuid;
    
    const newRoom = RoomService.createRoom(
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
});

// List rooms
router.get('/', (req, res) => {
  try {
    const { status, maxPlayers } = req.query;
    const rooms = RoomService.listRooms({ status, maxPlayers });
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get specific room
router.get('/:roomUuid', (req, res) => {
  try {
    const room = RoomService.getRoom(req.params.roomUuid);
    res.json(room);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// Update room
router.patch('/:roomUuid', authMiddleware, (req, res) => {
  try {
    const updatedRoom = RoomService.updateRoom(
      req.params.roomUuid, 
      req.body
    );
    res.json(updatedRoom);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Join room
router.post('/:roomUuid/join', authMiddleware, (req, res) => {
  try {
    const room = RoomService.joinRoom(
      req.params.roomUuid, 
      req.user.uuid
    );
    res.json(room);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Leave room
router.post('/:roomUuid/leave', authMiddleware, (req, res) => {
  try {
    const room = RoomService.leaveRoom(
      req.params.roomUuid, 
      req.user.uuid
    );
    res.json(room);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete room
router.delete('/:roomUuid', authMiddleware, (req, res) => {
  try {
    RoomService.deleteRoom(req.params.roomUuid);
    res.status(204).send();
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

export default router;

import { 
  createGameRoomUuid, 
  COUNTRY, 
  DATACENTER, 
  ROOM_TYPE 
} from '../../shared/constants/GameUuids.js';
import { RoomDB } from '../models/Room.js';
import { UserDB } from '../models/User.js';
import logger from '../utils/logger.js';
import { ValidationError } from '../utils/errors.js';

class RoomService {
  constructor() {
    // Initialization if needed
  }

  async createRoom(name, description, creatorUuid, maxPlayers, password = '') {
    try {
      const roomData = {
        name,
        description,
        creatorUuid,
        maxPlayers,
        password: password.trim(),  // Trim password to handle empty strings
        hasPassword: !!password.trim(),  // Set hasPassword based on password existence
        country: COUNTRY.US,
        roomType: ROOM_TYPE.LOBBY,
        datacenter: DATACENTER.US_WEST
      };

      const room = await RoomDB.create(roomData);
      logger.info(`Room created: ${room.roomUuid}`);
      return room.toPublicRoom();
    } catch (error) {
      logger.error(`Room creation failed: ${error.message}`);
      throw error;
    }
  }

  async getRoom(roomUuid) {
    try {
      const room = await RoomDB.findOne({ roomUuid });
      if (!room) {
        throw new ValidationError(`Room with UUID ${roomUuid} not found`);
      }
      return room.toFullRoom();
    } catch (error) {
      logger.error(`Get room failed: ${error.message}`);
      throw error;
    }
  }

  async listRooms(filters = {}) {
    try {
      const rooms = await RoomDB.find(filters);
      
      // Get all unique creator UUIDs
      const creatorUuids = [...new Set(rooms.map(room => room.creatorUuid))];
      
      // Fetch all creators in one query
      const creators = await Promise.all(
        creatorUuids.map(uuid => UserDB.findOne({ userUuid: uuid }))
      );
      
      // Create a map of UUID to nickname
      const creatorMap = new Map(
        creators.filter(Boolean).map(user => [user.userUuid, user.nickname])
      );

      // Map rooms and populate creator info
      return rooms.map(room => {
        const publicRoom = room.toPublicRoom();
        publicRoom.createdBy = {
          uuid: room.creatorUuid,
          nickname: creatorMap.get(room.creatorUuid) || 'Unknown'
        };
        return publicRoom;
      });
    } catch (error) {
      logger.error(`List rooms failed: ${error.message}`);
      throw error;
    }
  }

  async updateRoom(roomUuid, updates) {
    try {
      // Prevent modification of critical fields
      const safeUpdates = { ...updates };
      delete safeUpdates.roomUuid;
      delete safeUpdates.creatorUuid;
      delete safeUpdates.createdAt;

      const updatedRoom = await RoomDB.update({ roomUuid }, safeUpdates);
      return updatedRoom.toFullRoom();
    } catch (error) {
      logger.error(`Update room failed: ${error.message}`);
      throw error;
    }
  }

  async joinRoom(roomUuid, playerUuid) {
    try {
      const room = await RoomDB.findOne({ roomUuid });
      if (!room) {
        throw new ValidationError(`Room with UUID ${roomUuid} not found`);
      }

      // Check if player is already in the room
      if (room.playerUuids.includes(playerUuid)) {
        return room.toFullRoom();
      }

      // Check max players
      if (room.playerUuids.length >= room.maxPlayers) {
        throw new ValidationError('Room is full');
      }

      // Add player
      const updatedRoom = await RoomDB.update(
        { roomUuid }, 
        { 
          $push: { playerUuids: playerUuid },
          status: room.playerUuids.length + 1 === room.maxPlayers ? 'IN_PROGRESS' : 'WAITING'
        }
      );

      return updatedRoom.toFullRoom();
    } catch (error) {
      logger.error(`Join room failed: ${error.message}`);
      throw error;
    }
  }

  async leaveRoom(roomUuid, playerUuid) {
    try {
      const room = await RoomDB.findOne({ roomUuid });
      if (!room) {
        throw new ValidationError(`Room with UUID ${roomUuid} not found`);
      }

      // Determine new status
      let newStatus = room.status;
      if (playerUuid === room.creatorUuid) {
        newStatus = 'CLOSED';
      } else if (room.status === 'IN_PROGRESS' && room.playerUuids.length <= room.maxPlayers) {
        newStatus = 'WAITING';
      }

      // Update room
      const updatedRoom = await RoomDB.update(
        { roomUuid },
        { 
          $pull: { playerUuids: playerUuid },
          status: newStatus
        }
      );

      return updatedRoom.toFullRoom();
    } catch (error) {
      logger.error(`Leave room failed: ${error.message}`);
      throw error;
    }
  }

  async deleteRoom(roomUuid) {
    try {
      await RoomDB.delete({ roomUuid });
      return true;
    } catch (error) {
      logger.error(`Delete room failed: ${error.message}`);
      throw error;
    }
  }
}

export default new RoomService();

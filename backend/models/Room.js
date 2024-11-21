import { 
  createGameRoomUuid, 
  COUNTRY, 
  DATACENTER, 
  ROOM_TYPE 
} from '../../shared/constants/GameUuids.js';
import DateService from '../services/DateService.js';
import logger from '../utils/logger.js';
import { ValidationError } from '../utils/errors.js';
import { generateSchema } from '../utils/schemaGenerator.js';
import { db } from '../database/database.js';
import { Lock } from './Lock.js';

class Room {
  constructor(data = {}) {
    // Sanitize and validate input data
    this.roomUuid = data.roomUuid || createGameRoomUuid(
      data.country || COUNTRY.US,
      data.roomType || ROOM_TYPE.LOBBY,
      data.datacenter || DATACENTER.US_WEST
    );
    
    this.name = data.name;
    this.description = data.description || '';
    this.creatorUuid = data.creatorUuid;
    
    // Secure password handling
    this.hasPassword = !!data.password;
    this.password = data.password ? this.hashPassword(data.password) : null;
    
    this.playerUuids = data.playerUuids || [data.creatorUuid].filter(Boolean);
    this.viewerUuids = data.viewerUuids || [];
    
    this.maxPlayers = data.maxPlayers || 4;
    this.status = data.status || 'WAITING';
    
    this.turn = {
      number: data.turn?.number || 0,
      startTime: data.turn?.startTime || DateService.now().date,
      endTime: data.turn?.endTime || null,
      playerTurns: data.turn?.playerTurns || []
    };
    
    this.createdAt = data.createdAt || DateService.now().date;
    this.updatedAt = data.updatedAt || DateService.now().date;
    
    // Additional metadata
    this.metadata = data.metadata || {};
    this.isPrivate = data.isPrivate || false;
  }

  // Password hashing method (similar to user password handling)
  hashPassword(password) {
    // Implement a secure password hashing mechanism
    // This is a placeholder - replace with actual hashing
    return password ? Buffer.from(password).toString('base64') : null;
  }

  validate() {
    if (!this.name || this.name.length < 3) {
      throw new ValidationError('Room name must be at least 3 characters long');
    }

    if (!this.creatorUuid) {
      throw new ValidationError('Room must have a creator');
    }

    if (this.playerUuids.length > this.maxPlayers) {
      throw new ValidationError('Too many players in the room');
    }
  }

  // Schema for database validation
  static schema = generateSchema(new Room(), {
    name: { type: 'string', required: true, minLength: 3 },
    creatorUuid: { type: 'string', required: true },
    status: { type: 'string', enum: ['WAITING', 'IN_PROGRESS', 'CLOSED'] },
    maxPlayers: { type: 'number', min: 2, max: 10 }
  });

  // Serialization methods
  toJSON() {
    return this.toFullRoom();
  }

  toFullRoom() {
    return {
      roomUuid: this.roomUuid,
      name: this.name,
      description: this.description,
      creatorUuid: this.creatorUuid,
      playerUuids: this.playerUuids,
      viewerUuids: this.viewerUuids,
      maxPlayers: this.maxPlayers,
      status: this.status,
      hasPassword: this.hasPassword,
      turn: this.turn,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      metadata: this.metadata,
      isPrivate: this.isPrivate
    };
  }

  toPublicRoom() {
    return {
      roomUuid: this.roomUuid,
      name: this.name,
      description: this.description,
      playerCount: this.playerUuids.length,
      maxPlayers: this.maxPlayers,
      status: this.status,
      hasPassword: this.hasPassword,
      isPrivate: this.isPrivate
    };
  }
}

export const RoomDB = {
  collection: 'room',

  async init() {
    await db.createCollection(this.collection);
    
    if (db.supportsExplicitIndexes) {
      await db.createIndex(this.collection, { roomUuid: 1 }, { unique: true });
      await db.createIndex(this.collection, { creatorUuid: 1 });
      await db.createIndex(this.collection, { status: 1 });
    } else {
      logger.info('Database engine does not support explicit indexes');
    }
  },

  async create(roomData) {
    const lockId = `room-create-${roomData.name}-${roomData.creatorUuid}`;
    
    try {
      await Lock.acquire(lockId, 1000);
      
      const room = new Room(roomData);
      room.validate();

      // Check for existing room with same name (optional)
      const existingRoom = await this.findOne({ 
        name: room.name, 
        creatorUuid: room.creatorUuid 
      });

      if (existingRoom) {
        throw new ValidationError('Room with this name already exists');
      }

      const result = await db.create(this.collection, room.toJSON());
      logger.info(`Room created successfully: ${room.name}`);
      
      return this._toRoomInstance(result);
    } catch (error) {
      logger.error(`Failed to create room: ${error.message}`);
      throw error;
    } finally {
      await Lock.release(lockId);
    }
  },

  async findOne(query) {
    const result = await db.findOne(this.collection, query);
    return result ? this._toRoomInstance(result) : null;
  },

  async find(query = {}, options = {}) {
    const results = await db.find(this.collection, query, options);
    return results.map(result => this._toRoomInstance(result));
  },

  async update(query, updateData) {
    const result = await db.update(this.collection, query, updateData);
    return this._toRoomInstance(result);
  },

  async delete(query) {
    await db.delete(this.collection, query);
    return true;
  },

  _toRoomInstance(dbObject) {
    return dbObject ? new Room(dbObject) : null;
  }
};

export default Room;

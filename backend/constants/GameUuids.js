/**
 * Enhanced UUID system for Net40k that provides:
 * 1. Chronological sorting (timestamp-first like UUID7)
 * 2. Resource type identification
 * 3. Country and room type classification
 * 4. Datacenter/worker identification
 * 
 * Format (based on UUID7 with custom variant):
 * ttttttt-tttt-7TCC-LSRR-NNNNNNNNNNNN
 * where:
 * ttttttt-tttt: Unix timestamp (48 bits)
 * 7: Version 7
 * T: Resource Type (4 bits)
 * CC: Country Code (8 bits, supports 256 countries)
 * L: Location/Datacenter ID (4 bits)
 * S: Sequence number (4 bits)
 * RR: Room type (8 bits)
 * NNNN: Random identifier (48 bits)
 */

import { v7 as uuidv7 } from 'uuid';
import crypto from 'crypto';

// Sequence counter for UUID generation (4 bits = 0-15)
const MAX_SEQUENCE = 0xF;  // 15 in decimal
let sequence = 0;

// Resource type identifiers (4 bits = 16 types)
export const RESOURCE_TYPE = {
    USER: '0',      // User accounts (including system users)
    ROOM: '1',      // Chat rooms and channels
    MESSAGE: '2',   // Chat messages
    ENTITY: '3',    // Game entities (actors, monsters, items, etc)
    // 4-F reserved for future use
};

// Entity subtypes (using RR bits - 8 bits = 256 types)
export const ENTITY_TYPE = {
    // Characters/NPCs (0x00-0x1F)
    PLAYER: '00',
    NPC: '01',
    MONSTER: '02',
    BOSS: '03',
    
    // Items (0x20-0x3F)
    WEAPON: '20',
    ARMOR: '21',
    CONSUMABLE: '22',
    TREASURE: '23',
    KEY_ITEM: '24',
    
    // Environment (0x40-0x5F)
    DOOR: '40',
    CHEST: '41',
    TRAP: '42',
    TRIGGER: '43',
    SPAWN_POINT: '44',
    
    // Effects (0x60-0x7F)
    SPELL: '60',
    BUFF: '61',
    DEBUFF: '62',
    AREA_EFFECT: '63',

    // Game Events (0x80-0x9F)
    QUEST: '80',
    EVENT: '81',
    VOTE: '82',
    TIMER: '83',
    CHECKPOINT: '84',
    
    // Reserved ranges for future use:
    // 0xA0-0xBF: Structures/Buildings
    // 0xC0-0xDF: Quest/Mission items
    // 0xE0-0xFF: Special/System entities
};

// Country codes (8 bits = 256 countries)
// Using ISO 3166-1 numeric codes converted to hex
export const COUNTRY = {
    // North America
    US: '01',   // United States (840 -> 01)
    CA: '02',   // Canada (124 -> 02)
    MX: '03',   // Mexico (484 -> 03)
    
    // Europe
    GB: '10',   // United Kingdom (826 -> 10)
    DE: '11',   // Germany (276 -> 11)
    FR: '12',   // France (250 -> 12)
    IT: '13',   // Italy (380 -> 13)
    ES: '14',   // Spain (724 -> 14)
    NL: '15',   // Netherlands (528 -> 15)
    PL: '16',   // Poland (616 -> 16)
    SE: '17',   // Sweden (752 -> 17)
    
    // Asia
    JP: '20',   // Japan (392 -> 20)
    CN: '21',   // China (156 -> 21)
    KR: '22',   // South Korea (410 -> 22)
    IN: '23',   // India (356 -> 23)
    SG: '24',   // Singapore (702 -> 24)
    
    // Oceania
    AU: '30',   // Australia (036 -> 30)
    NZ: '31',   // New Zealand (554 -> 31)
    
    // South America
    BR: '40',   // Brazil (076 -> 40)
    AR: '41',   // Argentina (032 -> 41)
    
    // Africa
    ZA: '50',   // South Africa (710 -> 50)
    EG: '51',   // Egypt (818 -> 51)
    NG: '52',   // Nigeria (566 -> 52)
};

// Room types (8 bits = 256 room types)
export const ROOM_TYPE = {
    // System Rooms (0x range)
    SYSTEM: '00',      // System-wide announcements
    NEWS: '01',        // News and updates
    LOBBY: '02',       // Main lobby
    WHISPER: '03',     // Private messages
    GAME: '04',        // Game instance rooms
    GAMEMASTER: '05',  // Game master/admin room
    // 06-FF reserved for future use
};

// Datacenter/Location IDs (4 bits = 16 locations)
export const DATACENTER = {
    US_WEST: '0',    // Los Angeles
    // 1-F reserved for future expansion
};

// Special system users - these are global users that exist across all regions
export const SYSTEM_USERS = {
    // System core user - handles system-wide announcements
    SYSTEM: '00000000-0000-7000-0000-000000000001',
    
    // News system user - handles game updates and announcements
    NEWS: '00000000-0000-7000-0000-000000000002',
    
    // Game Manager user - handles game state and administrative functions
    GM: '00000000-0000-7000-0000-000000000003'
};

// Special system rooms - these are global rooms that exist across all regions
export const SYSTEM_ROOMS = {
    // System room for important system-wide announcements
    SYSTEM: '00000000-0000-7100-0000-000000000001',
    
    // News room for game updates and announcements
    NEWS: '00000000-0000-7100-0000-000000000002',
    
    // Global lobby room
    LOBBY: '00000000-0000-7100-0000-000000000003',
    
    // Game Master room for administrative functions
    GAMEMASTER: '00000000-0000-7100-0000-000000000004',
    
    // Template for whisper rooms (actual whisper rooms will use timestamps)
    WHISPER_TEMPLATE: '{{timestamp}}-7100-0003-{{random}}'
};

// Example lobby UUIDs for different countries
// Note: All using US_WEST datacenter for now
export const LOBBY = {
    // North America
    US: createChatRoomUuid(COUNTRY.US, ROOM_TYPE.LOBBY, DATACENTER.US_WEST),     // US Lobby
    CA: createChatRoomUuid(COUNTRY.CA, ROOM_TYPE.LOBBY, DATACENTER.US_WEST),     // Canadian Lobby
    MX: createChatRoomUuid(COUNTRY.MX, ROOM_TYPE.LOBBY, DATACENTER.US_WEST),     // Mexican Lobby
    
    // Europe
    GB: createChatRoomUuid(COUNTRY.GB, ROOM_TYPE.LOBBY, DATACENTER.US_WEST),     // UK Lobby
    DE: createChatRoomUuid(COUNTRY.DE, ROOM_TYPE.LOBBY, DATACENTER.US_WEST),     // German Lobby
    FR: createChatRoomUuid(COUNTRY.FR, ROOM_TYPE.LOBBY, DATACENTER.US_WEST),     // French Lobby
    
    // Asia
    JP: createChatRoomUuid(COUNTRY.JP, ROOM_TYPE.LOBBY, DATACENTER.US_WEST),     // Japan Lobby
    KR: createChatRoomUuid(COUNTRY.KR, ROOM_TYPE.LOBBY, DATACENTER.US_WEST),     // Korea Lobby
    SG: createChatRoomUuid(COUNTRY.SG, ROOM_TYPE.LOBBY, DATACENTER.US_WEST),     // Singapore Lobby
    
    // Oceania
    AU: createChatRoomUuid(COUNTRY.AU, ROOM_TYPE.LOBBY, DATACENTER.US_WEST),     // Australian Lobby
    NZ: createChatRoomUuid(COUNTRY.NZ, ROOM_TYPE.LOBBY, DATACENTER.US_WEST),     // New Zealand Lobby
    
    // South America
    BR: createChatRoomUuid(COUNTRY.BR, ROOM_TYPE.LOBBY, DATACENTER.US_WEST),     // Brazilian Lobby
};

// Example game room UUIDs
export const EXAMPLE_GAME_ROOMS = {
    // Examples of game rooms from different regions, all using US_WEST datacenter
    US_GAME: createGameRoomUuid(COUNTRY.US, ROOM_TYPE.GAME, DATACENTER.US_WEST),
    EU_GAME: createGameRoomUuid(COUNTRY.GB, ROOM_TYPE.GAME, DATACENTER.US_WEST),
    ASIA_GAME: createGameRoomUuid(COUNTRY.JP, ROOM_TYPE.GAME, DATACENTER.US_WEST)
};

/**
 * UUID Parser Functions
 * Format: timestamp-7TCC-LSRR-NNNNNNNNNNNN
 * - timestamp: Current time (48 bits)
 * - 7: Version 7
 * - T: Resource Type (4 bits)
 * - CC: Country Code (8 bits)
 * - L: Datacenter Location (4 bits)
 * - S: Sequence Number (4 bits)
 * - RR: Room Type (8 bits)
 * - N: Random Identifier (48 bits)
 */

export function parseUuid(uuid) {
    const parts = uuid.split('-');
    if (parts.length !== 4) throw new Error('Invalid UUID format');

    const [timestamp, version7AndType, locationAndRoom, random] = parts;
    
    return {
        timestamp: new Date(parseInt(timestamp, 16)),
        resourceType: version7AndType.charAt(1),
        countryCode: version7AndType.substring(2),
        datacenter: locationAndRoom.charAt(0),
        sequence: parseInt(locationAndRoom.charAt(1), 16),
        roomType: locationAndRoom.substring(2),
        randomId: random
    };
}

export function getResourceType(uuid) {
    return uuid.split('-')[1].charAt(1);
}

export function getCountryCode(uuid) {
    return uuid.split('-')[1].substring(2);
}

// Using regex-based implementation for more robust parsing
export function getDatacenter(uuid) {
    const match = uuid.match(/-7\d{3}-(\d)/);
    return match ? match[1] : null;
}

// Using regex-based implementation for more robust parsing
export function getRoomType(uuid) {
    const match = uuid.match(/-\d\d(\d{2})-/);
    return match ? match[1] : null;
}

export function getTimestamp(uuid) {
    return new Date(parseInt(uuid.split('-')[0], 16));
}

export function getSequence(uuid) {
    return parseInt(uuid.split('-')[2].charAt(1), 16);
}

export function isSystemUser(uuid) {
    return uuid === SYSTEM_USERS.SYSTEM || uuid === SYSTEM_USERS.NEWS || uuid === SYSTEM_USERS.GM;
}

export function isSystemRoom(uuid) {
    return getRoomType(uuid) === ROOM_TYPE.SYSTEM;
}

export function validateUuid(uuid) {
    try {
        const parts = uuid.split('-');
        if (parts.length !== 4) return false;
        
        const resourceType = getResourceType(uuid);
        const datacenter = getDatacenter(uuid);
        const roomType = getRoomType(uuid);
        
        // Verify resource type exists
        if (!Object.values(RESOURCE_TYPE).includes(resourceType)) return false;
        
        // Verify datacenter exists
        if (!Object.values(DATACENTER).includes(datacenter)) return false;
        
        // If it's a room, verify room type exists
        if (resourceType === RESOURCE_TYPE.ROOM && 
            !Object.values(ROOM_TYPE).includes(roomType)) return false;
            
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Generates a new UUID for a chat room with specific country
 * @param {string} countryCode - Country code from COUNTRY enum
 * @param {string} roomType - Room type from ROOM_TYPE enum
 * @param {string} datacenterId - Datacenter ID from DATACENTER enum
 * @returns {string} - Generated UUID
 */
export function createChatRoomUuid(countryCode, roomType, datacenterId) {
    // Get UUID7 for timestamp bits
    const uuid7 = uuidv7();
    
    // Extract timestamp portion (first 48 bits)
    const timestamp = uuid7.substring(0, 13);
    
    // Increment and wrap sequence
    sequence = (sequence + 1) & MAX_SEQUENCE;
    
    // Generate random bits
    const random = crypto.getRandomValues(new Uint8Array(6))
        .reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');
    
    // Build UUID with country code and room type
    return `${timestamp}-7${RESOURCE_TYPE.ROOM}${countryCode}-${datacenterId}${sequence.toString(16).padStart(2, '0')}${roomType}-${random}`;
}

/**
 * Creates a new UUID for a game room
 * @param {string} countryCode - Country code from COUNTRY enum
 * @param {string} roomType - Game room type from ROOM_TYPE enum
 * @param {string} datacenterId - Datacenter ID from DATACENTER enum
 * @returns {string} - Generated UUID
 */
export function createGameRoomUuid(countryCode, roomType, datacenterId) {
    const timestamp = uuidv7().split('-')[0]; // Get timestamp portion
    sequence = (sequence + 1) % MAX_SEQUENCE;
    const random = Math.random().toString(16).slice(2, 14).padEnd(12, '0');
    
    // For game rooms, we use the full format to support thousands of concurrent games:
    // timestamp-7TCC-LSRR-NNNNNNNNNNNN
    // where T=GAME_ROOM resource type, CC=country, L=datacenter, S=sequence, RR=room type
    return `${timestamp}-7${RESOURCE_TYPE.ROOM}${countryCode}-${datacenterId}${sequence.toString(16).padStart(2, '0')}${roomType}-${random}`;
}

/**
 * Creates a new UUID for a game entity
 * @param {string} entityType - Entity type from ENTITY_TYPE enum
 * @param {string} countryCode - Country code from COUNTRY enum
 * @param {string} datacenterId - Datacenter ID from DATACENTER enum
 * @returns {string} - Generated UUID
 */
export function createEntityUuid(entityType, countryCode = COUNTRY.US, datacenterId = DATACENTER.US_WEST) {
    const baseUuid = uuidv7();
    const resourceType = RESOURCE_TYPE.ENTITY;
    
    return baseUuid.substring(0, 8) + '-' + 
           baseUuid.substring(9, 13) + '-' +
           '7' + resourceType + countryCode + '-' +
           datacenterId + '0' + entityType + '-' +
           baseUuid.substring(24);
}

/**
 * Creates a new UUID for a quest/event/vote entity
 * @param {string} entityType - Entity type from ENTITY_TYPE enum
 * @param {string} countryCode - Country code from COUNTRY enum
 * @param {string} datacenterId - Datacenter ID from DATACENTER enum
 * @returns {string} - Generated UUID
 */
export function createGameEventUuid(entityType, countryCode = COUNTRY.US, datacenterId = DATACENTER.US_WEST) {
    return createEntityUuid(entityType, countryCode, datacenterId);
}

/**
 * Creates a new UUID for a user
 * @param {string} countryCode - Country code from COUNTRY enum
 * @param {string} datacenterId - Datacenter ID from DATACENTER enum
 * @returns {string} - Generated UUID
 */
export function createUserUuid(countryCode = COUNTRY.US, datacenterId = DATACENTER.US_WEST) {
    const baseUuid = uuidv7();
    const resourceType = RESOURCE_TYPE.USER;
    const sequence = Math.floor(Math.random() * 16).toString(16); // 4-bit sequence
    
    return baseUuid.substring(0, 8) + '-' + 
           baseUuid.substring(9, 13) + '-' +
           '7' + resourceType + countryCode + '-' +
           datacenterId + sequence + '00' + '-' + // '00' for user type (could be used for roles later)
           baseUuid.substring(24);
}

/**
 * Creates a new UUID for a chat message
 * @param {string} countryCode - Country code from COUNTRY enum
 * @param {string} datacenterId - Datacenter ID from DATACENTER enum
 * @returns {string} - Generated UUID
 */
export function createMessageUuid(countryCode = COUNTRY.US, datacenterId = DATACENTER.US_WEST) {
    const baseUuid = uuidv7();
    const resourceType = RESOURCE_TYPE.MESSAGE;
    const sequence = Math.floor(Math.random() * 16).toString(16); // 4-bit sequence
    
    return baseUuid.substring(0, 8) + '-' + 
           baseUuid.substring(9, 13) + '-' +
           '7' + resourceType + countryCode + '-' +
           datacenterId + sequence + '00' + '-' + // '00' for message type (could be used for message types later)
           baseUuid.substring(24);
}

/**
 * Creates a new UUID for a game
 * @param {string} countryCode - Country code from COUNTRY enum
 * @param {string} datacenterId - Datacenter ID from DATACENTER enum
 * @returns {string} - Generated UUID
 */
export function createGameUuid(countryCode = COUNTRY.US, datacenterId = DATACENTER.US_WEST) {
    const baseUuid = uuidv7();
    const resourceType = RESOURCE_TYPE.ROOM;
    const sequence = Math.floor(Math.random() * 16).toString(16); // 4-bit sequence
    
    return baseUuid.substring(0, 8) + '-' + 
           baseUuid.substring(9, 13) + '-' +
           '7' + resourceType + countryCode + '-' +
           datacenterId + sequence + '00' + '-' + // '00' for game type (could be used for game modes later)
           baseUuid.substring(24);
}

// Helper functions for extracting information from UUIDs
export function getCountry(uuid) {
    const match = uuid.match(/-7\d(\d{2})-/);
    return match ? match[1] : null;
}

// Example usage:
//console.log('Example UUIDs for different country lobbies:');
//console.log('US Lobby:', LOBBY.US);
//console.log('UK Lobby:', LOBBY.GB);
//console.log('Japan Lobby:', LOBBY.JP);
//console.log('Australia Lobby:', LOBBY.AU);
//console.log('Brazil Lobby:', LOBBY.BR);
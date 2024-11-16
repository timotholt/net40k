import { v7 as uuidv7 } from 'uuid';
import { validate as uuidValidate, version as uuidVersion } from 'uuid';

class UuidService {
    static generate() {
        return uuidv7();
    }

    // For your system messages - these should match your existing UUIDs
    static get SYSTEM_USER_ID() { return '00000000-0000-0000-0000-000000000000'; }
    static get GAMEMASTER_USER_ID() { return '00000000-0000-0000-0010-000000000000'; }
    static get NEWS_USER_ID() { return '00000000-0000-0000-0020-000000000000'; }
    
    static get SYSTEM_GAME_ID() { return '00000000-0000-0000-0000-000000000100'; }
    static get LOBBY_GAME_ID() { return '00000000-0000-0000-0000-000000000200'; }
    static get NEWS_GAME_ID() { return '00000000-0000-0000-0000-000000000300'; }
    static get WHISPER_GAME_ID() { return '00000000-0000-0000-0000-000000000400'; }

    // Validate UUID format and version
    static validate(uuid) {
        // Check if the UUID is a valid string and matches UUID v7 format
        if (!uuid || typeof uuid !== 'string') {
            return false;
        }

        // Validate UUID format and version 
        return uuidValidate(uuid) && uuidVersion(uuid) === 7;
    }

    // Generate UUID with optional prefix for specific types
    static generateWithPrefix(prefix = '') {
        const uuid = uuidv7();
        return prefix ? `${prefix}-${uuid}` : uuid;
    }

    // Validate system-specific UUIDs
    static isSystemUuid(uuid) {
        const systemUuids = [
            this.SYSTEM_USER_ID, 
            this.GAMEMASTER_USER_ID, 
            this.NEWS_USER_ID,
            this.SYSTEM_GAME_ID,
            this.LOBBY_GAME_ID,
            this.NEWS_GAME_ID,
            this.WHISPER_GAME_ID
        ];
        return systemUuids.includes(uuid);
    }
}

export { UuidService };

import { uuidv7 } from 'uuidv7';

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

    // Validate UUID format
    static isValid(uuid) {
        const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return regex.test(uuid);
    }
}

export { UuidService };

import { createRoomUuid, COUNTRY, ROOM_TYPE, DATACENTER } from '../constants/GameUuids.js';

// Create lobby UUIDs for different countries
const lobbies = {
    US: createRoomUuid(COUNTRY.US, ROOM_TYPE.LOBBY, DATACENTER.US_EAST),
    UK: createRoomUuid(COUNTRY.GB, ROOM_TYPE.LOBBY, DATACENTER.EU_WEST),
    JP: createRoomUuid(COUNTRY.JP, ROOM_TYPE.LOBBY, DATACENTER.ASIA_NE),
    AU: createRoomUuid(COUNTRY.AU, ROOM_TYPE.LOBBY, DATACENTER.AU_EAST),
    BR: createRoomUuid(COUNTRY.BR, ROOM_TYPE.LOBBY, DATACENTER.BR_SOUTH),
};

console.log('Example Lobby UUIDs:\n');
Object.entries(lobbies).forEach(([country, uuid]) => {
    console.log(`${country} Lobby UUID: ${uuid}`);
    console.log(`Format breakdown:`);
    console.log(`- Timestamp: ${uuid.substring(0, 13)}`);
    console.log(`- Version: 7`);
    console.log(`- Entity Type: Room (1)`);
    console.log(`- Country Code: ${uuid.substring(15, 17)} (${country})`);
    console.log(`- Datacenter: ${uuid.substring(18, 19)}`);
    console.log(`- Sequence: ${uuid.substring(19, 20)}`);
    console.log(`- Room Type: ${uuid.substring(20, 22)} (LOBBY)`);
    console.log(`- Random: ${uuid.substring(23)}\n`);
});

# Net40K State Machine Documentation

## Overview

Net40K uses three distinct but interconnected state machines:
1. Logical Game State - The conceptual game state
2. Server State Machine - The authoritative implementation
3. Client State Machine - The local player view

## 1. Logical Game State

This represents the conceptual state of the game, independent of implementation.

```mermaid
stateDiagram-v2
    [*] --> LOBBY
    
    state LOBBY {
        [*] --> WAITING_FOR_CLASS_SELECTION
        WAITING_FOR_CLASS_SELECTION --> WAITING_FOR_LOADOUT: Class Selected
        WAITING_FOR_LOADOUT --> WAITING_FOR_CLASS_SELECTION: Change Class
        WAITING_FOR_LOADOUT --> READY_TO_START: Loadout Selected & Ready
        READY_TO_START --> WAITING_FOR_LOADOUT: Unready/Change Equipment
        READY_TO_START --> [*]: All Ready & Host Starts
    }
    
    LOBBY --> ACTIVE_GAMEPLAY: Game Start
    ACTIVE_GAMEPLAY --> PAUSED: Menu/Disconnect
    PAUSED --> ACTIVE_GAMEPLAY: Resume
    ACTIVE_GAMEPLAY --> GAME_OVER: Mission End
    GAME_OVER --> LOBBY: Restart
```

## 2. Server State Machine

The authoritative implementation that manages all player states.

```mermaid
stateDiagram-v2
    [*] --> SERVER_INIT
    SERVER_INIT --> WAITING_FOR_PLAYERS
    
    state LOBBY_MANAGEMENT {
        [*] --> ACCEPTING_CONNECTIONS
        ACCEPTING_CONNECTIONS --> PLAYER_SYNC: New Player
        PLAYER_SYNC --> ACCEPTING_CONNECTIONS: Sync Complete
        ACCEPTING_CONNECTIONS --> PREPARING_GAME: All Ready
        PREPARING_GAME --> ACCEPTING_CONNECTIONS: Not All Ready
    }
    
    WAITING_FOR_PLAYERS --> LOBBY_MANAGEMENT
    
    state GAME_LOOP {
        [*] --> TICK_START
        TICK_START --> PROCESSING_ACTIONS
        PROCESSING_ACTIONS --> UPDATING_GAME_STATE
        UPDATING_GAME_STATE --> BROADCASTING_UPDATES
        BROADCASTING_UPDATES --> TICK_START: Next Tick
    }
    
    LOBBY_MANAGEMENT --> GAME_LOOP: Game Start
    GAME_LOOP --> PAUSED: Pause Trigger
    PAUSED --> GAME_LOOP: Resume
    GAME_LOOP --> GAME_OVER: Mission End
    
    state SYNC_MANAGEMENT {
        [*] --> DETECTING_DESYNC
        DETECTING_DESYNC --> PREPARING_SYNC_DATA
        PREPARING_SYNC_DATA --> BROADCASTING_SYNC
        BROADCASTING_SYNC --> WAITING_CONFIRMATIONS
        WAITING_CONFIRMATIONS --> [*]: All Confirmed
    }
```

## 3. Client State Machine

The local player's view of the game, including UI states.

```mermaid
stateDiagram-v2
    [*] --> INITIALIZING
    INITIALIZING --> CONNECTING: Init Complete
    
    state CONNECTION_FLOW {
        [*] --> ATTEMPTING_CONNECTION
        ATTEMPTING_CONNECTION --> SYNCING_WITH_SERVER
        SYNCING_WITH_SERVER --> CONNECTED
        CONNECTED --> ATTEMPTING_CONNECTION: Connection Lost
    }
    
    CONNECTING --> CONNECTION_FLOW
    
    state UI_STATES {
        [*] --> MAIN_MENU
        MAIN_MENU --> LOBBY_UI
        LOBBY_UI --> MAIN_MENU: BACK
        LOBBY_UI --> LOBBY_UI_CHARACTER_SELECT_UI
        LOBBY_UI_CHARACTER_SELECT_UI --> LOBBY_UI_LOADOUT_UI
        LOBBY_UI_CHARACTER_SELECT_UI --> LOBBY_UI: BACK
        LOBBY_UI_LOADOUT_UI --> LOBBY_UI_READY_SCREEN
        LOBBY_UI_LOADOUT_UI --> LOBBY_UI_CHARACTER_SELECT_UI: BACK
        LOBBY_UI_READY_SCREEN --> LOBBY_UI_LOADOUT_UI: BACK

        --
        state SYNC_STATE <<fork>>
        [*] --> SYNC_STATE
        SYNC_STATE --> IN_SYNC
        SYNC_STATE --> DESYNCED
        DESYNCED --> SYNCING
        SYNCING --> IN_SYNC
    }
    
    CONNECTION_FLOW --> UI_STATES: Connected
    
    state GAMEPLAY_UI {
        [*] --> LOADING_ASSETS
        LOADING_ASSETS --> RENDERING_GAME
        RENDERING_GAME --> MENU_OVERLAY: Open Menu
        MENU_OVERLAY --> RENDERING_GAME: Close Menu
    }
    
    UI_STATES --> GAMEPLAY_UI: Game Start
    GAMEPLAY_UI --> UI_STATES: Game End
    
    state SYNC_STATES {
        [*] --> CHECKING_SYNC
        CHECKING_SYNC --> REQUESTING_SYNC: Desync Detected
        REQUESTING_SYNC --> APPLYING_SYNC
        APPLYING_SYNC --> [*]: Sync Complete
    }
```

## Detailed State Descriptions

### 1. Logical Game States

#### LOBBY States
- `WAITING_FOR_CLASS_SELECTION`: Initial player setup phase
- `WAITING_FOR_LOADOUT`: Equipment and loadout selection phase
- `READY_TO_START`: Pre-game preparation complete

#### Gameplay States
- `ACTIVE_GAMEPLAY`: Main game loop with 500ms ticks
- `PAUSED`: Game temporarily halted
- `GAME_OVER`: Mission completed or failed

### 2. Server States

#### Initialization
- `SERVER_INIT`: Server startup and resource allocation
- `WAITING_FOR_PLAYERS`: Server ready to accept connections

#### Lobby Management
- `ACCEPTING_CONNECTIONS`: Processing new player connections
- `PLAYER_SYNC`: Synchronizing state with new/returning players
- `PREPARING_GAME`: Validating all players ready, preparing game start

#### Game Loop
- `TICK_START`: Beginning of 500ms game tick
- `PROCESSING_ACTIONS`: Handling queued player actions
- `UPDATING_GAME_STATE`: Calculating new game state
- `BROADCASTING_UPDATES`: Sending state changes to clients

#### Sync Management
- `DETECTING_DESYNC`: Monitoring client state consistency
- `PREPARING_SYNC_DATA`: Creating state update package
- `BROADCASTING_SYNC`: Sending sync data to clients
- `WAITING_CONFIRMATIONS`: Ensuring all clients synchronized

### 3. Client States

#### Startup
- `INITIALIZING`: Loading local resources
- `CONNECTING`: Establishing server connection

#### Connection Flow
- `ATTEMPTING_CONNECTION`: Trying to connect to server
- `SYNCING_WITH_SERVER`: Getting initial state
- `CONNECTED`: Active server connection

#### UI Flow
- `MAIN_MENU`: Initial game menu
- `LOBBY_UI`: Player/game setup interface
- `CHARACTER_SELECT_UI`: Class selection screen
- `LOADOUT_UI`: Equipment selection screen
- `READY_SCREEN`: Waiting for game start

#### Gameplay UI
- `LOADING_ASSETS`: Preparing game resources
- `RENDERING_GAME`: Active gameplay display
- `MENU_OVERLAY`: In-game menu system

#### Sync States
- `CHECKING_SYNC`: Verifying state match with server
- `REQUESTING_SYNC`: Asking for state update
- `APPLYING_SYNC`: Updating local state

## State Interactions

### Example: Player Opens Inventory
1. Client State: `RENDERING_GAME` -> `MENU_OVERLAY`
2. Logical State: `ACTIVE_GAMEPLAY` -> `PAUSED`
3. Server State: `GAME_LOOP` -> `PAUSED`
4. Server broadcasts pause
5. Other clients update accordingly

### Example: Game Start Sequence
1. All clients reach `READY_SCREEN`
2. Server validates in `PREPARING_GAME`
3. Server transitions to `GAME_LOOP`
4. Clients move to `LOADING_ASSETS`
5. When all ready, gameplay begins
## Message Flows

### Connection and Sync Messages
```javascript
// Client -> Server
CONNECT_REQUEST: { clientVersion: string }
SYNC_NEEDED: { lastGoodTimestamp: number }
SYNC_COMPLETE: { timestamp: number }

// Server -> Client
CONNECT_ACCEPTED: { serverVersion: string }
SYNC_DATA: { gameState: object, timestamp: number }
```

### Lobby Messages
```javascript
// Client -> Server
CLASS_SELECT: { classType: string }
LOADOUT_UPDATE: { equipment: object }
PLAYER_READY: { ready: boolean }

// Server -> Client
PLAYER_UPDATE: { id: number, changes: object }
GAME_STARTING: { countdown: number }
```

### Gameplay Messages
```javascript
// Client -> Server
PLAYER_ACTION: {
    type: string,
    data: object,
    timestamp: number
}

MENU_STATE: {
    menuType: string,
    isOpen: boolean
}

// Server -> Client
TICK_UPDATE: {
    tick: number,
    updates: array,
    timestamp: number
}

GAME_PAUSED: {
    reason: string,
    pausingPlayer: number
}
```

## Synchronization Types

### Lobby Synchronization
- Less time-critical
- Syncs:
  - Player states
  - Character selections
  - Equipment choices
  - Ready status
- Tolerant of minor delays

### Gameplay Synchronization
- Time-critical (500ms ticks)
- Syncs:
  - Player positions
  - Action points
  - Movement points
  - Combat state
  - Environmental state
- Requires precise timing
- May need state interpolation

## Message Flow Example

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    participant OC as Other Clients

    C->>S: PLAYER_ACTION
    S->>S: Validate
    S->>C: STATE_UPDATE
    S->>OC: STATE_UPDATE
    
    Note over C,S: Sync Flow
    C->>S: SYNC_NEEDED
    S->>S: Prepare Sync Data
    S->>C: SYNC_DATA
    C->>S: SYNC_COMPLETE
```

## State Data Structure

```javascript
GAME_STATE = {
    currentState: string,  // Current game state
    players: [
        {
            id: number,
            status: {
                connected: boolean,
                ready: boolean,
                currentMenu: string,
                syncState: {
                    isInSync: boolean,
                    lastSyncTime: timestamp,
                    needsFullSync: boolean,
                    pendingUpdates: number
                }
            },
            character: object,    // Character data
            gameplayState: object // Active gameplay data
        }
    ]
}
```

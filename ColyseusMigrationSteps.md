# Colyseus Migration: Exact Steps for net40k

This file is a detailed, actionable checklist for migrating your project to Colyseus. Each step is based on analysis of your backend structure and is designed for you to check off and report back as you complete them.

---

## 1. **Preparation**
- [ ] Ensure you are on the `Colyseus` branch (already done)
- [ ] Install Colyseus and dependencies:
  ```
  npm install colyseus @colyseus/schema
  ```
- [ ] Create a new folder: `backend/colyseus`

---

## 2. **Colyseus Server Setup**
- [ ] Create `backend/colyseus/server.js` as the Colyseus entry point
- [ ] Define room classes for:
    - GlobalServerRoom
    - GlobalNewsRoom
    - RegionalLobbyRoom
    - GameRoom
- [ ] Add a basic Colyseus server start script (can run alongside legacy server for now)

---

## 3. **Room Schema Design**
- [ ] For each room, define a Colyseus `Schema` for shared state
    - Start with minimal fields (e.g., messages for news, player list for lobbies)
- [ ] Plan how to migrate game state from `models/GameState.js` to a Colyseus `Schema`

---

## 4. **Authentication Integration**
- [ ] In each room, implement `onAuth` to validate session tokens (reuse logic from `services/SessionManager.js` and `services/UserService.js`)
- [ ] Pass token from client when joining rooms

---

## 5. **Feature Migration (Backend)**
- [ ] Migrate broadcast and direct messaging logic from `UserWebSocketHandler.js` to Colyseus room methods
- [ ] For each feature (profile updates, chat, mute/block, etc.), move message handling into appropriate room or as Colyseus messages
- [ ] For chat, decide if you want to migrate to Colyseus or keep REST endpoints (in `routes/chat.js`)
- [ ] Move game state updates and sync logic from `GameState.js` and `GameService.js` into `GameRoom` class
- [ ] Remove legacy WebSocket handlers as features are ported

---

## 6. **Frontend Migration**
- [ ] Install Colyseus client library:
  ```
  npm install colyseus.js
  ```
- [ ] Replace custom WebSocket client logic with Colyseus client API
- [ ] Update code to join rooms and handle room state/messages
- [ ] Refactor UI to use Colyseus state updates (for lobbies, news, game, etc.)

---

## 7. **Testing and Cleanup**
- [ ] Test each migrated feature (joining rooms, receiving state, sending actions)
- [ ] Handle disconnects, reconnections, and edge cases
- [ ] Remove unused legacy code (WebSocket handlers, old state sync, etc.)
- [ ] Update documentation and environment files

---

## 8. **Report Back**
- After each step (or group of steps), report back with what you’ve done and any issues/questions. I’ll help you adjust the plan or generate code as needed.

---

## 9. **Joke for Sanity**
> Why did the developer use a migration checklist?
> Because even their code likes to follow a roadmap!

---

_Keep this file updated as you go. Let’s migrate to Colyseus, one step at a time!_

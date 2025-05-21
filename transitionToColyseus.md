# Transition Plan: Moving to Colyseus Multiplayer Framework

This document outlines the steps, considerations, and design decisions for migrating the net40k project to use [Colyseus](https://colyseus.io/) for real-time multiplayer networking.

---

## 1. **Goals**
- Migrate core real-time networking to Colyseus for robust, scalable, and maintainable multiplayer.
- Support both shared (game state, lobbies) and private (friends list, user profile) network objects.
- Retain server-authoritative model.
- Maintain or improve user experience during/after transition.

---

## 2. **Room Architecture**
- **GlobalServerRoom:**
  - All players auto-join. Used for server-wide messages (maintenance, shutdowns).
- **GlobalNewsRoom:**
  - All players auto-join. Used for news, announcements, patch notes.
- **RegionalLobby:**
  - Players auto-join based on region (LobbyEast, LobbyWest, etc.). Used for matchmaking, chat, regional announcements.
- **GameRoom:**
  - Players explicitly join/leave. Handles actual gameplay state and logic.

---

## 3. **State Management**
- Use Colyseus `Schema` for room state (for efficient binary diffing and sync).
- Server maintains authoritative state for each room.
- For shared objects: one state per room, diffed and broadcast to all clients.
- For private objects: one state per client, diffed and sent individually.

---

## 4. **Authentication & Authorization**
- Colyseus does **not** provide built-in user accounts.
- Continue to use existing authentication (username/password/email) via REST API or external service (e.g., Passport.js, Firebase Auth).
- On successful login, issue a token (JWT/session).
- Pass token as part of Colyseus room join; validate in `onAuth` or `onJoin`.

---

## 5. **Migration Steps**
1. **Prototype a Colyseus server** (side-by-side with existing server, if possible).
2. **Define room classes** for each conceptual room (GlobalServerRoom, GameRoom, etc.).
3. **Migrate core game state logic** into Colyseus room `Schema` objects.
4. **Update client to connect to Colyseus rooms** (invisible auto-joins for global/news/lobby, explicit for games).
5. **Implement per-client sync state** (for diffing, patching, and efficient updates).
6. **Integrate authentication** (pass/verify tokens on room join).
7. **Test and iterate**: ensure all real-time features work as expected, including disconnect/reconnect, room cleanup, and resync.
8. **Deprecate legacy networking code** once Colyseus migration is stable.

---

## 6. **Considerations & Gotchas**
- **Room lifetime:** Keep global and regional rooms persistent; create/destroy game rooms as needed.
- **Clean-up:** Remove per-client sync state on disconnect.
- **Security:** Ensure clients can't send unauthorized messages to global/news rooms.
- **Scalability:** Plan for sharding/region scaling if userbase grows.
- **Testing:** Simulate disconnects, reconnects, and out-of-sync clients.

---

## 7. **References & Resources**
- [Colyseus Docs](https://docs.colyseus.io/)
- [Colyseus Schema](https://docs.colyseus.io/state/schema/)
- [Colyseus Room Lifecycle](https://docs.colyseus.io/colyseus/server/room-lifecycle/)
- [Colyseus Auth Example](https://docs.colyseus.io/server/auth/)

---

## 8. **Open Questions / TODO**
- Decide on binary vs. JSON state sync for each room type.
- Determine if any game logic needs to remain outside of Colyseus rooms.
- Plan for gradual migration/testing strategy.
- Review Colyseus plugins for potential use (monitoring, analytics, etc.).

---

## 9. **Joke (for morale!)**
> Why did the multiplayer game switch to Colyseus?
> Because it wanted to level up its connections!

---

_This plan is a living document. Update as migration progresses._

# Virtualized UUID Chat System Specification

## Overview
This document describes the implementation of a privacy-focused chat system using virtualized UUIDs. The system ensures that real user identifiers are never exposed to clients while maintaining efficient blocking and muting functionality.

## Core Components

### 1. HyperNAT (Network Address Translation)
- Uses mathematical functions instead of lookup tables
- Generates unique virtual IDs for each user-to-user interaction
- Changes virtual IDs across sessions
- Memory efficient (4-8 bytes per user)

### 2. User Secrets
- Each user has a unique prime number as their base secret
- Session-specific secrets are generated during login
- Used to create deterministic but private virtual IDs

## Workflow Specifications

### Login Process
1. User authenticates with real UUID
2. System generates new session secret:
   ```javascript
   sessionSecret = generateSessionSecret(userBaseSecret)
   ```
3. Server stores only:
   - Real UUID
   - Base secret (4-8 bytes)
   - Session secret
4. All other users are assigned virtual IDs using the formula:
   ```javascript
   virtualId = (targetUuid × sessionSecret) % MAX_NUMBER
   ```

### Logout Process
1. Session secret is invalidated
2. Virtual IDs for this session become invalid
3. Next login generates new session secret
4. Results in different virtual IDs for all users

### Blocking Process
When Player A blocks Player B:
1. Server records block in database
2. Player B's virtual ID is regenerated with block flag:
   ```javascript
   blockedVirtualId = BLOCK_THRESHOLD + normalVirtualId
   ```
3. All future virtual IDs for Player B will be in blocked range
4. Block status can be checked with simple comparison:
   ```javascript
   isBlocked = (virtualId >= BLOCK_THRESHOLD)
   ```

### Message Sending - Direct Message
When Player A sends message to Player B:
1. Client sends message with Player B's virtual ID
2. Server:
   a. Reverses virtual ID to get real UUID
   b. Checks block status (O(1) operation)
   c. If not blocked, delivers message
   d. Translates sender's UUID to recipient's virtual ID space
2. Player B receives message with Player A's virtual ID in their space

### Message Sending - Room/Lobby
When Player A sends message to room containing Player B:
1. Client sends message to room
2. Server:
   a. Gets list of room members
   b. For each recipient:
      - Checks block status (O(1))
      - Translates sender's UUID to recipient's virtual space
      - Delivers message if not blocked
3. Each recipient sees sender with different virtual ID

### Virtual ID Properties
1. Consistent within session:
   - Player A always sees Player B as same ID during one session
2. Different across sessions:
   - Player A sees Player B as different ID in new session
3. Different across users:
   - Player A and Player C see Player B as different IDs
4. Reversible only by server:
   - Only server can map virtual ID back to real UUID
5. Block status encoded in number range:
   - Normal IDs: 0 to 999,999,999,999
   - Blocked IDs: 1,000,000,000,000+

## Memory Usage Analysis

### Per-User Storage
- Base Secret: 4-8 bytes
- Real UUID: 36 bytes
- Session Secret: 4-8 bytes
Total: ~50 bytes per user

### Scaling Examples
- 1,000 users: ~50 KB
- 10,000 users: ~500 KB
- 100,000 users: ~5 MB
- 1,000,000 users: ~50 MB

## Security Properties

### Privacy
1. Real UUIDs never leave server
2. Virtual IDs change every session
3. Different users see different IDs
4. Cannot correlate users across sessions

### Block/Mute Efficiency
1. O(1) lookup time for block status
2. Block status encoded in ID range
3. Server-side filtering prevents message delivery
4. No client-side block list needed

## Implementation Notes

### Mathematical Function Requirements
1. Must be deterministic
2. Must be reversible with secret
3. Must distribute evenly in target range
4. Must be computationally efficient

### Best Practices
1. Use prime numbers for user secrets
2. Rotate session secrets on login
3. Use BigInt for ID calculations
4. Implement server-side message filtering
5. Cache frequently used virtual IDs

## Error Handling

### Invalid Virtual IDs
1. Server detects out-of-range IDs
2. Malformed IDs are rejected
3. Expired session IDs are detected

### Security Violations
1. Monitor for brute force attempts
2. Rate limit virtual ID generations
3. Log suspicious patterns
4. Implement session timeouts

## Future Enhancements

### Potential Improvements
1. Add message encryption using virtual IDs
2. Implement temporary blocking
3. Add group-specific virtual IDs
4. Support multiple simultaneous sessions
5. Add virtual ID rotation schedules

## Testing Requirements

### Unit Tests
1. Virtual ID generation
2. Block status encoding/decoding
3. Session secret rotation
4. Message routing logic

### Integration Tests
1. Multi-user message scenarios
2. Block/unblock workflows
3. Session management
4. Room message broadcasting

### Performance Tests
1. Virtual ID generation speed
2. Message routing throughput
3. Memory usage monitoring
4. Session handling under load

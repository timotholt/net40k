// PlayerState.js - Manages individual player state and notifications
import { PLAYER_UI_STATES } from './GameState.js';

class PlayerState {
    constructor(data = {}) {
        this.playerUuid = data.playerUuid;
        this.currentState = PLAYER_UI_STATES.IDLE;
        this.notificationQueue = [];  // [{type, data, timestamp}]
        this.blockingState = false;   // If true, player needs to handle something
    }

    // Add a new notification to the queue
    addNotification(type, data = {}) {
        this.notificationQueue.push({
            type,
            data,
            timestamp: Date.now(),
            handled: false
        });
    }

    // Mark a notification as handled
    handleNotification(index) {
        if (index >= 0 && index < this.notificationQueue.length) {
            this.notificationQueue[index].handled = true;
            // Clean up handled notifications older than 1 hour
            this.cleanNotifications();
        }
    }

    // Remove handled notifications older than 1 hour
    cleanNotifications() {
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        this.notificationQueue = this.notificationQueue.filter(notification => 
            !notification.handled || notification.timestamp > oneHourAgo
        );
    }

    // Change player's current UI state
    setState(newState) {
        // Validate state exists
        if (!Object.values(PLAYER_UI_STATES).includes(newState)) {
            throw new Error(`Invalid player state: ${newState}`);
        }

        this.currentState = newState;
        
        // Update blocking based on state type
        this.blockingState = this.isStateBlocking(newState);
    }

    // Check if a state is blocking
    isStateBlocking(state) {
        // Death states block for all
        if (state.startsWith('VIEWING_DEATH_') || 
            state.startsWith('SELECTING_REVIVAL') ||
            state.startsWith('SELECTING_REINFORCEMENT')) {
            return true;
        }

        // Vote initiation and casting blocks
        if (state.startsWith('INITIATING_VOTE') ||
            state.startsWith('SELECTING_VOTE_') ||
            state.startsWith('CASTING_VOTE') ||
            state.startsWith('VIEWING_VOTE_RESULTS')) {
            return true;
        }

        // Admin actions block
        if (state.startsWith('ADMIN_')) {
            return true;
        }

        // Everything else is modal or non-blocking
        return false;
    }

    // Get all pending notifications
    getPendingNotifications() {
        return this.notificationQueue.filter(n => !n.handled);
    }

    // Get current state info
    getStateInfo() {
        return {
            currentState: this.currentState,
            isBlocking: this.blockingState,
            pendingNotifications: this.getPendingNotifications()
        };
    }

    // Serialize for storage/network
    toJSON() {
        return {
            playerUuid: this.playerUuid,
            currentState: this.currentState,
            notificationQueue: this.notificationQueue,
            blockingState: this.blockingState
        };
    }

    // Create from serialized data
    static fromJSON(data) {
        return new PlayerState(data);
    }
}

export default PlayerState;

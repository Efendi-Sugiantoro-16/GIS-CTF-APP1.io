class EventBus {
    constructor() {
        this.listeners = {};
    }

    /**
     * Subscribe to an event
     * @param {string} event 
     * @param {Function} callback 
     */
    on(event, callback) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
        // Return unsubscribe function
        return () => this.off(event, callback);
    }

    /**
     * Unsubscribe from an event
     * @param {string} event 
     * @param {Function} callback 
     */
    off(event, callback) {
        if (!this.listeners[event]) return;
        this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }

    /**
     * Emit an event with data
     * @param {string} event 
     * @param {*} data 
     */
    emit(event, data) {
         if (!this.listeners[event]) return;
         this.listeners[event].forEach(callback => {
             try {
                 callback(data);
             } catch (err) {
                 console.error(`Error in event listener for ${event}:`, err);
             }
         });
    }
}

// Singleton instance
export const eventBus = new EventBus();

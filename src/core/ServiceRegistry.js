class ServiceRegistry {
    constructor() {
        this.services = new Map();
    }

    /**
     * Register a service instance
     * @param {string} name 
     * @param {object} instance 
     */
    register(name, instance) {
        if (this.services.has(name)) {
            console.warn(`Service ${name} is already registered. Overwriting.`);
        }
        this.services.set(name, instance);
        return instance;
    }

    /**
     * Get a registered service
     * @param {string} name 
     */
    get(name) {
        const service = this.services.get(name);
        if (!service) {
            throw new Error(`Service ${name} not found`);
        }
        return service;
    }
}

export const registry = new ServiceRegistry();

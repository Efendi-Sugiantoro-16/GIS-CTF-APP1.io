export class StorageService {
    constructor() {
        this.prefix = 'cyber_gis_';
    }

    /**
     * Save data to local storage
     * @param {string} key 
     * @param {*} value 
     */
    save(key, value) {
        try {
            const serialized = JSON.stringify(value);
            localStorage.setItem(this.prefix + key, serialized);
            return true;
        } catch (e) {
            console.error('Storage Save Error:', e);
            return false;
        }
    }

    /**
     * Get data from local storage
     * @param {string} key 
     * @param {*} defaultValue 
     */
    get(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(this.prefix + key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.error('Storage Get Error:', e);
            return defaultValue;
        }
    }

    /**
     * Remove item
     * @param {string} key 
     */
    remove(key) {
        localStorage.removeItem(this.prefix + key);
    }

    /**
     * Clear all app specific data
     */
    clear() {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(this.prefix)) {
                localStorage.removeItem(key);
            }
        });
    }
}

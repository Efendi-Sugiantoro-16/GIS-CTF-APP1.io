import { registry } from '../core/ServiceRegistry';
import { Modal } from './Modal';
import { eventBus } from '../core/EventBus';

export class SettingsManager {
    constructor() {
        this.modal = new Modal();
        this.settings = {
            soundSfx: true,
            soundMusic: false,
            performanceMode: false, // If true, disable heavy animations
            showFlightPaths: true,
            enableAdmin: true,
            showAttacks: true
        };
        this.loadSettings();
    }

    init() {
        this.applySettings();
    }

    loadSettings() {
        const saved = localStorage.getItem('cyber_settings');
        if (saved) {
            this.settings = { ...this.settings, ...JSON.parse(saved) };
        }
    }

    saveSettings() {
        localStorage.setItem('cyber_settings', JSON.stringify(this.settings));
        this.applySettings();
        // Emit event for other components to react if needed
        eventBus.emit('SETTINGS_CHANGED', this.settings);
    }

    applySettings() {
        const root = document.documentElement;
        
        // Performance Mode: Toggle specific CSS class on body
        if (this.settings.performanceMode) {
            document.body.classList.add('low-performance');
        } else {
            document.body.classList.remove('low-performance');
        }

        // Show/Hide Flight Paths (Handled by MapComponent listening to SETTINGS_CHANGED)
    }

    openSettings() {
        const html = `
            <div class="space-y-6 select-none">
                <!-- AUDIO SECTION -->
                <div class="bg-black/40 border border-gray-700 p-4 rounded-lg">
                    <h4 class="text-cyber-primary font-bold mb-3 border-b border-gray-700 pb-2 flex items-center gap-2">
                        <span>🔊</span> AUDIO CONFIG
                    </h4>
                    <div class="space-y-3">
                        <label class="flex items-center justify-between cursor-pointer group">
                            <span class="text-sm font-mono text-gray-300 group-hover:text-white">SOUND EFFECTS (SFX)</span>
                            <input type="checkbox" id="setting-sfx" class="accent-cyber-primary w-5 h-5" ${this.settings.soundSfx ? 'checked' : ''}>
                        </label>
                        <label class="flex items-center justify-between cursor-pointer group">
                            <span class="text-sm font-mono text-gray-300 group-hover:text-white">AMBIENT MUSIC</span>
                            <input type="checkbox" id="setting-music" class="accent-cyber-primary w-5 h-5" ${this.settings.soundMusic ? 'checked' : ''}>
                        </label>
                    </div>
                </div>

                <!-- VISUALS SECTION -->
                <div class="bg-black/40 border border-gray-700 p-4 rounded-lg">
                    <h4 class="text-blue-400 font-bold mb-3 border-b border-gray-700 pb-2 flex items-center gap-2">
                        <span>👁️</span> VISUALS & PERFORMANCE
                    </h4>
                    <div class="space-y-3">
                        <label class="flex items-center justify-between cursor-pointer group">
                            <span class="text-sm font-mono text-gray-300 group-hover:text-white">SHOW NETWORK PATHS</span>
                            <input type="checkbox" id="setting-paths" class="accent-blue-400 w-5 h-5" ${this.settings.showFlightPaths ? 'checked' : ''}>
                        </label>
                        <label class="flex items-center justify-between cursor-pointer group">
                            <span class="text-sm font-mono text-gray-300 group-hover:text-white">LOW PERFORMANCE MODE</span>
                            <div class="text-[10px] text-gray-500 ml-2">(Reduces glow/animations)</div>
                            <input type="checkbox" id="setting-perf" class="accent-red-500 w-5 h-5 ml-auto" ${this.settings.performanceMode ? 'checked' : ''}>
                        </label>
                    </div>
                </div>

                <!-- FEATURE ACCESS SECTION -->
                <div class="bg-black/40 border border-gray-700 p-4 rounded-lg">
                    <h4 class="text-purple-400 font-bold mb-3 border-b border-gray-700 pb-2 flex items-center gap-2">
                        <span>🔐</span> FEATURE ACCESS
                    </h4>
                    <div class="space-y-3">
                         <label class="flex items-center justify-between cursor-pointer group">
                            <span class="text-sm font-mono text-gray-300 group-hover:text-white">ENABLE ADMIN MENU</span>
                            <input type="checkbox" id="setting-admin" class="accent-purple-500 w-5 h-5" ${this.settings.enableAdmin !== false ? 'checked' : ''}>
                        </label>
                        <label class="flex items-center justify-between cursor-pointer group">
                            <span class="text-sm font-mono text-gray-300 group-hover:text-white">SHOW ATTACK SIM</span>
                            <input type="checkbox" id="setting-attacks" class="accent-purple-500 w-5 h-5" ${this.settings.showAttacks !== false ? 'checked' : ''}>
                        </label>
                    </div>
                </div>

                <div class="pt-2">
                    <button id="save-settings" class="w-full bg-cyber-primary/20 hover:bg-cyber-primary/40 text-cyber-primary border border-cyber-primary/50 py-2 rounded font-bold transition-all">
                        APPLY CONFIGURATION
                    </button>
                </div>
            </div>
        `;

        this.modal.create('SYSTEM CONFIGURATION', html, null); // No default confirm action, using custom button

        // Bind events
        setTimeout(() => {
            const saveBtn = document.getElementById('save-settings');
            if(saveBtn) {
                saveBtn.addEventListener('click', () => {
                    this.settings.soundSfx = document.getElementById('setting-sfx').checked;
                    this.settings.soundMusic = document.getElementById('setting-music').checked;
                    this.settings.showFlightPaths = document.getElementById('setting-paths').checked;
                    this.settings.performanceMode = document.getElementById('setting-perf').checked;
                    this.settings.enableAdmin = document.getElementById('setting-admin').checked;
                    this.settings.showAttacks = document.getElementById('setting-attacks').checked;
                    
                    this.saveSettings();
                    this.modal.close();
                    
                    // Simple reload to apply structure changes for menus
                    if(confirm("SETTINGS SAVED. RELOAD NOW TO APPLY UI CHANGES?")) {
                        window.location.reload();
                    }
                });
            }
        }, 100);
    }

    // Helper for other services to check settings
    get(key) {
        return this.settings[key];
    }
}

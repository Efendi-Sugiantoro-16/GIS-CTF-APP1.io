import L from 'leaflet';
import { registry } from '../core/ServiceRegistry';
import { eventBus } from '../core/EventBus';

export class MapComponent {
    constructor() {
        this.map = null;
        this.nodes = new Map(); // Store markers
        this.layerGroup = null;
        this.mouseListenerAdded = false;
    }

    async init() {
        // Initialize Map
        this.map = L.map('map', {
            zoomControl: false,
            attributionControl: false
        }).setView([20, 0], 2); // Global view

        // Dark/Cyberpunk Basemap (CartoDB Dark Matter)
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(this.map);

        // Add Zoom Control at bottom right
        L.control.zoom({
            position: 'bottomright'
        }).addTo(this.map);

        // Layer Group for easy clearing
        this.layerGroup = L.layerGroup().addTo(this.map);

        console.log('Map initialized');
        
        // Fix Leaflet's default icon path issues in bundlers
        this.fixLeafletIcons();

        // Load Services
        this.nodeService = registry.get('NodeService');
        this.renderNodes();
        
        // Listen for updates
        eventBus.on('NODE_CAPTURED', (data) => this.handleNodeCapture(data));
        eventBus.on('ATTACK_SIMULATED', (data) => this.visualizeAttack(data));
        eventBus.on('NODE_ADDED', (node) => this.addMarker(node));
        eventBus.on('NODE_UPDATED', () => this.refreshNodes());
        eventBus.on('NODE_DELETED', (id) => this.removeMarker(id));
        eventBus.on('SETTINGS_CHANGED', (settings) => this.applySettings(settings));

        // Initial settings application (if any)
        setTimeout(() => {
             const settings = registry.get('SettingsManager').settings;
             this.applySettings(settings);
        }, 500);
    }

    applySettings(settings) {
        if (!settings) return;

        // Visuals: Flight Paths
        if (this.layerGroup) {
            // Re-render nodes to update Flight Paths AND Popups (Admin controls)
            this.renderNodes();
        }
    }

    refreshNodes() {
        this.renderNodes();
    }

    renderNodes() {
        // Cleanup existing layers
        if (this.layerGroup) {
            this.layerGroup.clearLayers();
            this.nodes.clear();
        }

        const nodes = this.nodeService.getAllNodes();
        
        // 1. Draw Flight Paths (Curved Lines)
        const showPaths = registry.get('SettingsManager') ? registry.get('SettingsManager').get('showFlightPaths') : true;

        if (nodes.length > 0 && showPaths !== false) {
            // Find Regional Hubs
            const hubs = {
                usa: nodes.find(n => n.name && n.name.includes("United States")),
                rus: nodes.find(n => n.name && n.name.includes("Russia")),
                eur: nodes.find(n => n.name && n.name.includes("Germany")), // Europe Hub
                asia: nodes.find(n => n.name && n.name.includes("China")) // Asia Hub
            };

            // Draw Backbone Connections (Super-Highways)
            // US <-> Europe
            if (hubs.usa && hubs.eur) this.drawCurve(hubs.usa, hubs.eur, '#ef4444', 0.6, 2);
            // Europe <-> Russia
            if (hubs.eur && hubs.rus) this.drawCurve(hubs.eur, hubs.rus, '#ef4444', 0.6, 2);
            // Russia <-> Asia
            if (hubs.rus && hubs.asia) this.drawCurve(hubs.rus, hubs.asia, '#ef4444', 0.6, 2);
            // US <-> Asia (Pacific Route - slightly tricky on 2D map but we draw direct)
            // if (hubs.usa && hubs.asia) this.drawCurve(hubs.usa, hubs.asia, '#ef4444', 0.4, 2); 

            // Connect nodes to nearest/regional Hub
            nodes.forEach(node => {
                // Skip if node is a hub
                if (Object.values(hubs).includes(node)) return;

                let targetHub = null;
                let color = '#3b82f6';

                // Regional Logic
                if (node.lng < -30) {
                    // AMERICAS -> USA
                    targetHub = hubs.usa;
                    color = '#3b82f6'; // Blue
                } else if (node.lng >= -30 && node.lng < 45 && node.lat > 20) {
                    // EUROPE -> Germany
                    targetHub = hubs.eur;
                    color = '#10b981'; // Emerald/Green
                } else if (node.lng >= 45 && node.lng < 90 && node.lat > 40) {
                     // RUSSIA/CIS -> Moscow (Eurasia Server)
                     targetHub = hubs.rus;
                     color = '#f59e0b'; // Amber/Orange
                } else if (node.lng >= 60) {
                    // ASIA -> China
                    targetHub = hubs.asia;
                    color = '#d946ef'; // Fuchsia/Purple
                } else {
                    // AFRICA / MIDDLE EAST / OTHERS -> Nearest of Europe or Russia?
                    // Let's route Africa to Europe for now
                    targetHub = hubs.eur;
                    color = '#10b981';
                }

                // Fallback if specific hub missing, default to Russia or US
                if (!targetHub) targetHub = hubs.rus || hubs.usa;

                if (targetHub) {
                    const opacity = 0.15 + (Math.random() * 0.25);
                    this.drawCurve(node, targetHub, color, opacity, 1);
                }
            });

            // Draw Custom Manual Connections
            nodes.forEach(node => {
                if (node.connectedTo) {
                    const target = nodes.find(n => n.id === node.connectedTo);
                    if (target) {
                        this.drawCurve(node, target, '#ffffff', 0.9, 2); // Bright White for manual links
                    }
                }
            });
        }

        // 2. Add Markers
        nodes.forEach(node => {
            this.addMarker(node);
        });

        // 3. Mouse Tracking (Idempotent)
        if (!this.mouseListenerAdded) {
            this.map.on('mousemove', (e) => {
                const latEl = document.getElementById('mouse-lat');
                const lngEl = document.getElementById('mouse-lng');
                if(latEl && lngEl) {
                    latEl.innerText = e.latlng.lat.toFixed(4);
                    lngEl.innerText = e.latlng.lng.toFixed(4);
                }
            });
            this.mouseListenerAdded = true;
        }
    }

    drawCurve(start, end, color, opacity = 0.5, weight = 1.5) {
        const lat1 = start.lat;
        const lng1 = start.lng;
        const lat2 = end.lat;
        const lng2 = end.lng;

        // Quadratic Bezier Curve Logic
        const r = Math.sqrt(Math.pow(lng2 - lng1, 2) + Math.pow(lat2 - lat1, 2));
        const arcHeight = r * 0.2; // Curve height

        const controlLat = (lat1 + lat2) / 2 + arcHeight;
        const controlLng = (lng1 + lng2) / 2;

        const path = [];
        for (let t = 0; t <= 1; t += 0.02) {
            const lat = (1 - t) * (1 - t) * lat1 + 2 * (1 - t) * t * controlLat + t * t * lat2;
            const lng = (1 - t) * (1 - t) * lng1 + 2 * (1 - t) * t * controlLng + t * t * lng2;
            path.push([lat, lng]);
        }

        L.polyline(path, {
            color: color,
            weight: weight,
            opacity: opacity,
            dashArray: '6, 12',
            className: 'animate-dash' 
        }).addTo(this.layerGroup);
    }

    addMarker(node) {
        const color = node.owner ? registry.get('TeamService').getTeam(node.owner).color : '#ffffff';
        
        const pulseIcon = L.divIcon({
            className: 'custom-div-icon',
            html: `<div style="background-color:${color};" class="marker-pin"></div><div style="background-color:${color};" class="marker-pulse"></div>`,
            iconSize: [30, 42],
            iconAnchor: [15, 42]
        });

        const marker = L.marker([node.lat, node.lng], { icon: pulseIcon });
        
        const isAdmin = registry.get('SettingsManager') ? registry.get('SettingsManager').get('enableAdmin') : true;

        marker.bindPopup(`
            <div class="font-mono text-black min-w-[200px]">
                <h3 class="font-bold border-b border-black mb-1">${node.name}</h3>
                <div class="text-xs mb-2">
                    <p>Difficulty: <b>${node.difficulty}</b></p>
                    <p>Points: <b>${node.points}</b></p>
                    <p>Owner: ${node.owner ? registry.get('TeamService').getTeam(node.owner).name : 'None'}</p>
                </div>
                <div class="flex gap-2 justify-center">
                    <button class="bg-black text-white px-3 py-1 text-xs uppercase hover:bg-gray-800" onclick="window.captureNode(${node.id})">
                        ${node.owner ? 'RECLAIM' : 'HACK'}
                    </button>
                    ${isAdmin ? `
                    <button class="bg-blue-600 text-white px-2 py-1 text-xs uppercase hover:bg-blue-800" onclick="window.editNode(${node.id})">EDIT</button>
                    <button class="bg-red-600 text-white px-2 py-1 text-xs uppercase hover:bg-red-800" onclick="window.deleteNode(${node.id})">DEL</button>
                    ` : ''}
                </div>
            </div>
        `);
        
        marker.addTo(this.layerGroup);
        this.nodes.set(node.id, marker);
    }

    removeMarker(id) {
        const marker = this.nodes.get(id);
        if(marker) {
            if(this.layerGroup && this.layerGroup.hasLayer(marker)) {
                this.layerGroup.removeLayer(marker);
            } else {
                this.map.removeLayer(marker);
            }
            this.nodes.delete(id);
        }
    }

    handleNodeCapture(data) {
        const { node } = data;
        this.removeMarker(node.id);
        this.addMarker(node);
    }

    visualizeAttack(data) {
        const { from, to } = data;
        
        const line = L.polyline([[from.lat, from.lng], [to.lat, to.lng]], {
            color: '#ef4444', // Red-500
            weight: 3,
            opacity: 0.8,
            dashArray: '10, 20',
            className: 'animate-dash-fast'
        }).addTo(this.map); // Add to map directly to sit above everything else or separate group

        setTimeout(() => {
            this.map.removeLayer(line);
        }, 3000);
    }

    fixLeafletIcons() {
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });
    }
}

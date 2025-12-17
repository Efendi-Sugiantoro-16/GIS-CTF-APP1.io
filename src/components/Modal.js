export class Modal {
    constructor() {
        this.modal = null;
    }

    create(title, contentHtml, onSave = null) {
        // Remove existing if any
        const existing = document.getElementById('gis-modal');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'gis-modal';
        modal.className = 'fixed inset-0 z-[2000] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-fade-in px-4';
        
        modal.innerHTML = `
            <div class="bg-gray-900 border border-cyber-primary/50 text-white rounded-lg shadow-[0_0_30px_rgba(0,255,157,0.2)] w-full max-w-md overflow-hidden transform scale-95 animate-scale-in">
                <div class="flex justify-between items-center p-4 border-b border-gray-800 bg-black/40">
                    <h3 class="font-mono text-lg font-bold text-cyber-primary">${title}</h3>
                    <button class="text-gray-400 hover:text-white" onclick="this.closest('#gis-modal').remove()">✖</button>
                </div>
                <div class="p-6">
                    ${contentHtml}
                </div>
                <div class="flex justify-end gap-3 p-4 border-t border-gray-800 bg-black/40">
                    <button class="px-4 py-2 rounded text-sm font-mono text-gray-300 hover:text-white hover:bg-white/10" onclick="document.getElementById('gis-modal').remove()">CANCEL</button>
                    ${onSave ? `<button id="modal-save-btn" class="px-4 py-2 rounded text-sm font-mono bg-cyber-primary text-black font-bold hover:bg-cyber-scifi transition-colors">SAVE CHANGES</button>` : ''}
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        this.modal = modal;

        if (onSave) {
            document.getElementById('modal-save-btn').addEventListener('click', () => {
                onSave();
                modal.remove();
            });
        }
    }

    close() {
        if (this.modal) this.modal.remove();
    }
}

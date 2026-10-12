/**
 * MemSim Main Application Coordinator
 * Binds DOM events, tab switching, simulator engine, and UI components.
 */

import { MemorySystemSimulator } from './engine/simulator.js';
import { PipelineView } from './ui/pipelineView.js';
import { Narrator } from './ui/narrator.js';
import { LabsView } from './ui/labsView.js';
import { LessonsManager } from './ui/lessons.js';

class MemSimApp {
    constructor() {
        this.sys = new MemorySystemSimulator();
        this.pipelineView = new PipelineView('pipelineDatapathContainer');
        this.narrator = new Narrator('narratorContainer');
        this.labsView = new LabsView(this.sys);
        this.lessonsManager = new LessonsManager(this.sys, this);

        this.currentTab = 'tab-pipeline';
        this.lastAccessResult = null;
    }

    init() {
        this.bindTabNavigation();
        this.bindQuickControls();
        this.renderCurrentTab();

        // Perform an initial cold-start memory access so the screen is immediately populated and engaging!
        this.handleAccess(0x00401000, false);
    }

    bindTabNavigation() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.getAttribute('data-tab');
                this.switchTab(targetTab);
            });
        });
    }

    switchTab(tabId) {
        this.currentTab = tabId;

        // Update button states
        document.querySelectorAll('.tab-btn').forEach(b => {
            b.classList.toggle('active', b.getAttribute('data-tab') === tabId);
        });

        // Update pane visibility
        document.querySelectorAll('.tab-pane').forEach(p => {
            p.classList.toggle('active', p.id === tabId);
        });

        this.renderCurrentTab();
    }

    renderCurrentTab() {
        if (this.currentTab === 'tab-pipeline') {
            this.pipelineView.render(this.lastAccessResult);
            this.narrator.render(this.lastAccessResult);
        } else if (this.currentTab === 'tab-cache') {
            this.labsView.renderCacheLab('cacheLabContainer');
            this.bindCacheLabEvents();
        } else if (this.currentTab === 'tab-paging') {
            this.labsView.renderPagingLab('pagingLabContainer');
            this.bindPagingLabEvents();
        } else if (this.currentTab === 'tab-fragmentation') {
            this.labsView.renderFragmentationLab('fragmentationLabContainer');
            this.bindFragmentationLabEvents();
        } else if (this.currentTab === 'tab-rom') {
            this.labsView.renderRomLab('romLabContainer');
            this.bindRomLabEvents();
        } else if (this.currentTab === 'tab-anatomy') {
            this.labsView.renderBitAnatomyLab('bitAnatomyContainer');
            this.bindBitAnatomyEvents();
        } else if (this.currentTab === 'tab-latency') {
            this.labsView.renderLatencyLab('latencyLabContainer');
        } else if (this.currentTab === 'tab-lessons') {
            this.lessonsManager.renderLessons('lessonsContainer');
        }
    }

    refreshAllViews(result = null) {
        if (result) this.lastAccessResult = result;
        this.renderCurrentTab();
    }

    bindQuickControls() {
        const inputAddr = document.getElementById('quickAddressInput');
        const btnStep = document.getElementById('btnQuickStep');
        const btnRandom = document.getElementById('btnQuickRandom');
        const btnReset = document.getElementById('btnQuickReset');
        const btnPreset = document.getElementById('btnQuickPreset');

        btnStep?.addEventListener('click', () => {
            const rawVal = inputAddr.value.trim();
            const addr = parseInt(rawVal, 16);
            if (!isNaN(addr)) {
                this.handleAccess(addr, false);
            }
        });

        btnRandom?.addEventListener('click', () => {
            // Generate a realistic 32-bit aligned address
            const randPage = Math.floor(Math.random() * 16);
            const randOffset = Math.floor(Math.random() * 1024) * 4;
            const addr = (randPage << 12) | randOffset;
            inputAddr.value = '0x' + (addr >>> 0).toString(16).padStart(8, '0').toUpperCase();
            this.handleAccess(addr, false);
        });

        btnReset?.addEventListener('click', () => {
            this.sys.reset();
            this.lastAccessResult = null;
            this.refreshAllViews();
        });

        btnPreset?.addEventListener('click', () => {
            // Run a rapid 5-step trace simulating a loop
            const baseAddr = 0x00402000;
            let last;
            for (let i = 0; i < 5; i++) {
                last = this.sys.executeAccess(baseAddr + (i * 32), false);
            }
            this.handleAccessResult(last);
        });
    }

    handleAccess(address, isWrite = false) {
        const result = this.sys.executeAccess(address, isWrite);
        this.handleAccessResult(result);
    }

    handleAccessResult(result) {
        this.lastAccessResult = result;
        if (this.currentTab !== 'tab-pipeline') {
            // Switch back to pipeline to see the result animation if requested
        }
        this.refreshAllViews();
    }

    // ==========================================
    // Event Binders for Labs
    // ==========================================

    bindCacheLabEvents() {
        const targetSelect = document.getElementById('cacheLabTarget');
        const waysSelect = document.getElementById('cacheLabWays');
        const policySelect = document.getElementById('cacheLabPolicy');
        const writeSelect = document.getElementById('cacheLabWrite');

        const currentCache = this.labsView.selectedCache === 'L2' ? this.sys.l2 : this.sys.l1;

        targetSelect?.addEventListener('change', (e) => {
            this.labsView.selectedCache = e.target.value;
            this.labsView.renderCacheLab('cacheLabContainer');
            this.bindCacheLabEvents();
        });

        waysSelect?.addEventListener('change', (e) => {
            currentCache.ways = parseInt(e.target.value);
            currentCache.initializeGeometry();
            this.labsView.renderCacheLab('cacheLabContainer');
            this.bindCacheLabEvents();
        });

        policySelect?.addEventListener('change', (e) => {
            currentCache.replacementPolicy = e.target.value;
            this.labsView.renderCacheLab('cacheLabContainer');
            this.bindCacheLabEvents();
        });

        writeSelect?.addEventListener('change', (e) => {
            currentCache.writePolicy = e.target.value;
            this.labsView.renderCacheLab('cacheLabContainer');
            this.bindCacheLabEvents();
        });
    }

    bindPagingLabEvents() {
        const algoSelect = document.getElementById('pagingAlgoSelect');
        const btnFault = document.getElementById('btnTriggerFault');

        algoSelect?.addEventListener('change', (e) => {
            this.sys.vm.replacementAlgorithm = e.target.value;
            this.labsView.renderPagingLab('pagingLabContainer');
            this.bindPagingLabEvents();
        });

        btnFault?.addEventListener('click', () => {
            // Pick an unmapped page in standard address space (e.g. Page 4, 5, 6, 7, 8)
            const unmappedPages = [0x00004000, 0x00005000, 0x00006000, 0x00007000, 0x00008000];
            const randomFaultAddr = unmappedPages[Math.floor(Math.random() * unmappedPages.length)];
            this.handleAccess(randomFaultAddr, false);
            this.labsView.renderPagingLab('pagingLabContainer');
            this.bindPagingLabEvents();
        });
    }

    bindFragmentationLabEvents() {
        const alloc = this.sys.allocator;
        const algoSelect = document.getElementById('allocAlgoSelect');
        const btnAllocate = document.getElementById('btnDoAllocate');
        const btnCompact = document.getElementById('btnCompactMemory');
        const btnReset = document.getElementById('btnResetAllocator');
        const alertBox = document.getElementById('allocMessageAlert');

        algoSelect?.addEventListener('change', (e) => {
            alloc.algorithm = e.target.value;
        });

        btnAllocate?.addEventListener('click', () => {
            const nameInput = document.getElementById('allocProcName');
            const sizeInput = document.getElementById('allocProcSize');
            let name = nameInput.value.trim() || 'Process';
            const size = parseInt(sizeInput.value);

            // Auto-suffix if process name is already allocated to prevent collision
            if (alloc.allocatedProcesses.has(name)) {
                let counter = 2;
                while (alloc.allocatedProcesses.has(`${name} ${counter}`)) {
                    counter++;
                }
                name = `${name} ${counter}`;
            }

            const res = alloc.allocate(name, size);
            if (!res.success) {
                if (alertBox) {
                    alertBox.className = 'alert-box-visible';
                    alertBox.innerHTML = `<strong>Allocation Failed:</strong> ${res.reason}`;
                }
            } else {
                if (alertBox) alertBox.className = 'alert-box-hidden';
            }
            this.labsView.renderFragmentationLab('fragmentationLabContainer');
            this.bindFragmentationLabEvents();
        });

        btnCompact?.addEventListener('click', () => {
            alloc.compactMemory();
            if (alertBox) alertBox.className = 'alert-box-hidden';
            this.labsView.renderFragmentationLab('fragmentationLabContainer');
            this.bindFragmentationLabEvents();
        });

        btnReset?.addEventListener('click', () => {
            alloc.reset();
            if (alertBox) alertBox.className = 'alert-box-hidden';
            this.labsView.renderFragmentationLab('fragmentationLabContainer');
            this.bindFragmentationLabEvents();
        });

        // Deallocate buttons
        document.querySelectorAll('.btn-free-proc').forEach(btn => {
            btn.addEventListener('click', () => {
                const procName = btn.getAttribute('data-proc');
                alloc.deallocate(procName);
                if (alertBox) alertBox.className = 'alert-box-hidden';
                this.labsView.renderFragmentationLab('fragmentationLabContainer');
                this.bindFragmentationLabEvents();
            });
        });
    }

    bindBitAnatomyEvents() {
        const sliders = ['sliderCacheSize', 'sliderBlockSize', 'sliderWays', 'sliderPageSize'];
        sliders.forEach(id => {
            document.getElementById(id)?.addEventListener('input', () => {
                this.labsView.updateBitAnatomyCalculation();
            });
        });
    }

    bindRomLabEvents() {
        const rom = this.sys.rom;
        const alertBox = document.getElementById('romWriteAlertBox');

        // 1. Technology switcher buttons
        document.querySelectorAll('.rom-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const type = btn.getAttribute('data-type');
                rom.setType(type);
                if (alertBox) alertBox.className = 'alert-box-hidden';
                this.labsView.renderRomLab('romLabContainer');
                this.bindRomLabEvents();
            });
        });

        // 2. PROM bit fusible link clicks
        document.querySelectorAll('.bit-clickable').forEach(btn => {
            btn.addEventListener('click', () => {
                const addr = parseInt(btn.getAttribute('data-addr'));
                const bitIndex = parseInt(btn.getAttribute('data-bit'));
                const res = rom.burnPromFuse(addr, bitIndex);
                if (alertBox) {
                    alertBox.className = res.success ? 'alert-box-visible' : 'alert-box-visible alert-box-danger';
                    alertBox.innerHTML = res.success ? `<strong>${res.message}</strong>` : `<strong>${res.reason}</strong>`;
                }
                this.labsView.renderRomLab('romLabContainer');
                this.bindRomLabEvents();
            });
        });

        // 3. EPROM UV Erase
        document.getElementById('btnEraseUv')?.addEventListener('click', () => {
            rom.isUvErasing = true;
            this.labsView.renderRomLab('romLabContainer');
            this.bindRomLabEvents();

            setTimeout(() => {
                const res = rom.eraseEpromUv();
                rom.isUvErasing = false;
                if (alertBox) {
                    alertBox.className = 'alert-box-visible';
                    alertBox.innerHTML = `<strong>${res.message}</strong>`;
                }
                this.labsView.renderRomLab('romLabContainer');
                this.bindRomLabEvents();
            }, 600);
        });

        // 4. EEPROM Byte electrical write
        document.getElementById('btnWriteEeprom')?.addEventListener('click', () => {
            const addrInput = document.getElementById('eepromAddr');
            const hexInput = document.getElementById('eepromHex');
            const addr = parseInt(addrInput?.value || 0);
            const val = parseInt(hexInput?.value || '0', 16);

            const res = rom.writeEepromByte(addr, val);
            if (alertBox) {
                alertBox.className = res.success ? 'alert-box-visible' : 'alert-box-visible alert-box-danger';
                alertBox.innerHTML = res.success ? `<strong>${res.message}</strong>` : `<strong>${res.reason}</strong>`;
            }
            this.labsView.renderRomLab('romLabContainer');
            this.bindRomLabEvents();
        });

        // 5. Flash sector write
        document.getElementById('btnWriteFlash')?.addEventListener('click', () => {
            const addrInput = document.getElementById('flashAddr');
            const hexInput = document.getElementById('flashHex');
            const addr = parseInt(addrInput?.value || 0);
            const val = parseInt(hexInput?.value || '0', 16);

            const res = rom.writeFlashSector(addr, val);
            if (alertBox) {
                alertBox.className = res.success ? 'alert-box-visible' : 'alert-box-visible alert-box-danger';
                alertBox.innerHTML = res.success ? `<strong>${res.message}</strong>` : `<strong>${res.reason}</strong>`;
            }
            this.labsView.renderRomLab('romLabContainer');
            this.bindRomLabEvents();
        });

        // 6. Reset Firmware
        document.getElementById('btnResetRom')?.addEventListener('click', () => {
            rom.reset();
            if (alertBox) alertBox.className = 'alert-box-hidden';
            this.labsView.renderRomLab('romLabContainer');
            this.bindRomLabEvents();
        });

        // 7. CPU Store / Write Violation Attempt
        document.getElementById('btnAttemptStore')?.addEventListener('click', () => {
            const addrInput = document.getElementById('storeTargetAddr');
            const dataInput = document.getElementById('storeTargetData');
            const addr = parseInt(addrInput?.value || '0xF000', 16);
            const data = parseInt(dataInput?.value || '0x42', 16);

            const res = rom.attemptCpuStore(addr, data);
            if (alertBox) {
                alertBox.className = 'alert-box-visible alert-box-danger';
                alertBox.innerHTML = `
                    <div style="font-size: 1.05rem; font-weight: bold; margin-bottom: 6px;">${res.exception}</div>
                    <p style="margin: 0 0 8px 0;">${res.detail}</p>
                    <div style="background: rgba(0,0,0,0.3); padding: 6px 12px; border-radius: 4px; font-family: monospace; color: #f43f5e;">
                        Penalty: ${res.penalty}
                    </div>
                `;
            }
        });

        // 8. Boot Sequence Stepper
        document.getElementById('btnStepBoot')?.addEventListener('click', () => {
            rom.stepBoot();
            this.labsView.renderRomLab('romLabContainer');
            this.bindRomLabEvents();
        });

        document.getElementById('btnResetBoot')?.addEventListener('click', () => {
            rom.resetBoot();
            this.labsView.renderRomLab('romLabContainer');
            this.bindRomLabEvents();
        });
    }
}

// Instantiate on DOM load
window.addEventListener('DOMContentLoaded', () => {
    window.app = new MemSimApp();
    window.app.init();
});

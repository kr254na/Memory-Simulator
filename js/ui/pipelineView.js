/**
 * Visual Pipeline Datapath
 * Interactive architectural diagram representing CPU, TLB, Page Table, Swap Disk, L1, L2, and RAM
 * with glowing pulses, data paths, and state highlights.
 */

export class PipelineView {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
    }

    render(accessResult = null) {
        if (!this.container) return;

        const tlbClass = accessResult ? (accessResult.vmResult.tlbHit ? 'node-hit' : 'node-miss') : '';
        const ptClass = accessResult ? (accessResult.vmResult.pageFault ? 'node-fault' : (accessResult.vmResult.tlbHit ? '' : 'node-active')) : '';
        const diskClass = (accessResult && accessResult.vmResult.pageFault) ? 'node-disk-active' : '';
        const l1Class = accessResult ? (accessResult.l1Result.hit ? 'node-hit' : 'node-miss') : '';
        const l2Class = accessResult ? (accessResult.l2Result ? (accessResult.l2Result.hit ? 'node-hit' : 'node-miss') : '') : '';
        const ramClass = (accessResult && accessResult.ramAccessed) ? 'node-ram-active' : '';

        this.container.innerHTML = `
            <div class="datapath-board">
                <!-- Row 1: Virtual Space (CPU -> TLB & Page Table) -->
                <div class="datapath-section">
                    <div class="section-tag">1. Virtual Address Space & Translation</div>
                    <div class="nodes-row">
                        <!-- CPU Node -->
                        <div class="hardware-node cpu-node">
                            <div class="node-icon">💻</div>
                            <div class="node-title">CPU Core</div>
                            <div class="node-detail">${accessResult ? accessResult.virtualAddress : '0x00401000'}</div>
                            <span class="node-type">Virtual Address</span>
                        </div>

                        <div class="bus-arrow ${accessResult ? 'bus-pulse' : ''}">➔</div>

                        <!-- TLB Node -->
                        <div class="hardware-node ${tlbClass}">
                            <div class="node-icon">⚡</div>
                            <div class="node-title">TLB Cache</div>
                            <div class="node-detail">
                                ${accessResult ? (accessResult.vmResult.tlbHit ? 'HIT (Frame ' + accessResult.vmResult.frameNumber + ')' : 'MISS') : '4 Entries'}
                            </div>
                            <span class="node-type">~0.5 ns Fast Silicon</span>
                        </div>

                        <div class="bus-arrow ${accessResult && !accessResult.vmResult.tlbHit ? 'bus-pulse-miss' : ''}">➔</div>

                        <!-- Page Table Node -->
                        <div class="hardware-node ${ptClass}">
                            <div class="node-icon">📋</div>
                            <div class="node-title">Page Table (RAM)</div>
                            <div class="node-detail">
                                ${accessResult ? (accessResult.vmResult.pageFault ? 'PAGE FAULT (V=0)' : 'Page Hit (V=1)') : '32 Pages'}
                            </div>
                            <span class="node-type">~50 ns Table Walk</span>
                        </div>

                        ${accessResult && accessResult.vmResult.pageFault ? `
                            <div class="bus-arrow bus-pulse-fault">➔</div>
                            <!-- Swap Disk Node -->
                            <div class="hardware-node ${diskClass}">
                                <div class="node-icon">💽</div>
                                <div class="node-title">Swap Disk</div>
                                <div class="node-detail">Disk Swap (I/O)</div>
                                <span class="node-type">~10,000,000 ns Trap</span>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <!-- Conversion Bridge -->
                <div class="mmu-bridge">
                    <div class="bridge-tag">
                        <span>MMU Address Translation Bridge:</span> 
                        <span class="highlight-cyan">${accessResult ? accessResult.virtualAddress : 'VA'}</span> 
                        <span>➔</span> 
                        <span class="highlight-green">${accessResult ? accessResult.physicalAddress : 'PA'}</span>
                    </div>
                </div>

                <!-- Row 2: Physical Memory & Cache Hierarchy -->
                <div class="datapath-section">
                    <div class="section-tag">2. Physical Memory Hierarchy</div>
                    <div class="nodes-row">
                        <!-- L1 Cache Node -->
                        <div class="hardware-node ${l1Class}">
                            <div class="node-icon">⚡</div>
                            <div class="node-title">L1 Data Cache</div>
                            <div class="node-detail">
                                ${accessResult ? (accessResult.l1Result.hit ? 'HIT (1.0 ns)' : 'MISS (' + accessResult.l1Result.missReason.toUpperCase() + ')') : '512B / 2-Way'}
                            </div>
                            <span class="node-type">SRAM (~1 ns)</span>
                        </div>

                        <div class="bus-arrow ${accessResult && !accessResult.l1Result.hit ? 'bus-pulse-miss' : ''}">➔</div>

                        <!-- L2 Cache Node -->
                        <div class="hardware-node ${l2Class}">
                            <div class="node-icon">🚀</div>
                            <div class="node-title">L2 Unified Cache</div>
                            <div class="node-detail">
                                ${accessResult && accessResult.l2Result ? (accessResult.l2Result.hit ? 'HIT (4.0 ns)' : 'MISS (' + accessResult.l2Result.missReason.toUpperCase() + ')') : '2KB / 4-Way'}
                            </div>
                            <span class="node-type">On-Chip SRAM (~4 ns)</span>
                        </div>

                        <div class="bus-arrow ${accessResult && accessResult.ramAccessed ? 'bus-pulse-ram' : ''}">➔</div>

                        <!-- RAM Node -->
                        <div class="hardware-node ${ramClass}">
                            <div class="node-icon">💾</div>
                            <div class="node-title">Main Memory (DRAM)</div>
                            <div class="node-detail">
                                ${accessResult && accessResult.ramAccessed ? 'READ BLOCK (~100 ns)' : 'DDR4 / DDR5'}
                            </div>
                            <span class="node-type">Off-Chip DRAM (~100 ns)</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

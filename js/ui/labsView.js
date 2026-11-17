/**
 * Labs View Manager
 * Handles rendering and user interactions for:
 * 1. Cache Lab (Table, Associativity, 3 C's)
 * 2. Virtual Memory & Swapping Lab (TLB, Page Table, Clock Hand)
 * 3. Allocation & Fragmentation Lab (First/Best/Worst Fit, External Frag, Compaction, Internal Frag)
 * 4. Bit Anatomy Calculator
 */

export class LabsView {
    constructor(memorySystem) {
        this.sys = memorySystem;
        this.selectedCache = 'L1'; // 'L1' or 'L2'
    }

    renderCacheLab(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const cache = this.selectedCache === 'L2' ? this.sys.l2 : this.sys.l1;
        let setsHtml = '';

        cache.sets.forEach((set, sIdx) => {
            let linesHtml = '';
            set.lines.forEach((line, wIdx) => {
                const lineClass = line.valid ? 'line-valid' : 'line-empty';
                linesHtml += `
                    <tr class="${lineClass}">
                        <td>Way ${wIdx}</td>
                        <td><span class="pill ${line.valid ? 'pill-green' : 'pill-gray'}">${line.valid ? '1' : '0'}</span></td>
                        <td><span class="pill ${line.dirty ? 'pill-amber' : 'pill-gray'}">${line.dirty ? '1' : '0'}</span></td>
                        <td><code>${line.tag !== null ? '0x' + (line.tag >>> 0).toString(16).toUpperCase() : '---'}</code></td>
                        <td><code>[${line.data.length}B block]</code></td>
                        <td>${line.lruCounter}</td>
                        <td>${line.accessCount}</td>
                    </tr>
                `;
            });

            setsHtml += `
                <div class="cache-set-card">
                    <div class="set-header">
                        <span class="set-title">Set Index: <code>${sIdx}</code></span>
                        <span class="set-ways">${cache.ways}-Way</span>
                    </div>
                    <table class="lab-table">
                        <thead>
                            <tr>
                                <th>Way</th>
                                <th>Valid</th>
                                <th>Dirty</th>
                                <th>Tag</th>
                                <th>Data</th>
                                <th>LRU Age</th>
                                <th>Hits</th>
                            </tr>
                        </thead>
                        <tbody>${linesHtml}</tbody>
                    </table>
                </div>
            `;
        });

        const totalBlocks = cache.numBlocks;

        container.innerHTML = `
            <div class="lab-section">
                <div class="lab-controls-bar">
                    <div class="control-group">
                        <label>Cache Level:</label>
                        <select id="cacheLabTarget" class="lab-select">
                            <option value="L1" ${this.selectedCache === 'L1' ? 'selected' : ''}>L1 Data Cache (512B, 32B lines)</option>
                            <option value="L2" ${this.selectedCache === 'L2' ? 'selected' : ''}>L2 Unified Cache (2048B, 64B lines)</option>
                        </select>
                    </div>
                    <div class="control-group">
                        <label>Associativity:</label>
                        <select id="cacheLabWays" class="lab-select">
                            <option value="1" ${cache.ways === 1 ? 'selected' : ''}>1-Way (Direct Mapped)</option>
                            <option value="2" ${cache.ways === 2 ? 'selected' : ''}>2-Way Set Associative</option>
                            <option value="4" ${cache.ways === 4 ? 'selected' : ''}>4-Way Set Associative</option>
                            <option value="${totalBlocks}" ${cache.ways === totalBlocks ? 'selected' : ''}>${totalBlocks}-Way (Fully Associative)</option>
                        </select>
                    </div>
                    <div class="control-group">
                        <label>Replacement Policy:</label>
                        <select id="cacheLabPolicy" class="lab-select">
                            <option value="LRU" ${cache.replacementPolicy === 'LRU' ? 'selected' : ''}>LRU (Least Recently Used)</option>
                            <option value="FIFO" ${cache.replacementPolicy === 'FIFO' ? 'selected' : ''}>FIFO (First In First Out)</option>
                            <option value="LFU" ${cache.replacementPolicy === 'LFU' ? 'selected' : ''}>LFU (Least Frequently Used)</option>
                        </select>
                    </div>
                    <div class="control-group">
                        <label>Write Policy:</label>
                        <select id="cacheLabWrite" class="lab-select">
                            <option value="WB" ${cache.writePolicy === 'WB' ? 'selected' : ''}>Write-Back + Write-Allocate</option>
                            <option value="WT" ${cache.writePolicy === 'WT' ? 'selected' : ''}>Write-Through + No-Write-Allocate</option>
                        </select>
                    </div>
                </div>

                <!-- 3 C's Miss Breakdown -->
                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-label">Hit Rate (${cache.name})</div>
                        <div class="metric-value highlight-green">${cache.stats.hits + cache.stats.misses > 0 ? ((cache.stats.hits / (cache.stats.hits + cache.stats.misses)) * 100).toFixed(1) : 0}%</div>
                        <div class="metric-sub">${cache.stats.hits} Hits / ${cache.stats.misses} Misses</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Compulsory (Cold) Misses</div>
                        <div class="metric-value highlight-cyan">${cache.stats.compulsoryMisses}</div>
                        <div class="metric-sub">First-time referenced blocks</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Conflict Misses</div>
                        <div class="metric-value highlight-amber">${cache.stats.conflictMisses}</div>
                        <div class="metric-sub">Collisions in same set</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Capacity Misses</div>
                        <div class="metric-value highlight-red">${cache.stats.capacityMisses}</div>
                        <div class="metric-sub">Cache reached max limit</div>
                    </div>
                </div>

                <div class="cache-sets-container">
                    ${setsHtml}
                </div>
            </div>
        `;
    }

    renderPagingLab(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const vm = this.sys.vm;

        // TLB Rows
        let tlbRows = '';
        vm.tlb.forEach((entry, idx) => {
            tlbRows += `
                <tr class="${entry.valid ? 'line-valid' : 'line-empty'}">
                    <td>Slot ${idx}</td>
                    <td><span class="pill ${entry.valid ? 'pill-green' : 'pill-gray'}">${entry.valid ? 'VALID' : 'INVALID'}</span></td>
                    <td><code>${entry.vpn !== null ? '0x' + (entry.vpn >>> 0).toString(16).toUpperCase() : '---'}</code></td>
                    <td><span class="badge ${entry.valid ? 'badge-blue' : ''}">${entry.frameNumber !== null ? 'Frame ' + entry.frameNumber : '---'}</span></td>
                    <td>${entry.lruCounter}</td>
                </tr>
            `;
        });

        // Page Table Rows (show all mapped pages and initial working set in a clean scrollable table)
        let ptRows = '';
        const sortedEntries = Array.from(vm.pageTable.entries()).sort((a, b) => a[0] - b[0]);
        sortedEntries.forEach(([vpn, entry]) => {
            if (entry.valid || vpn < 16) {
                ptRows += `
                    <tr class="${entry.valid ? 'line-valid' : 'line-empty'}">
                        <td><code>0x${(vpn >>> 0).toString(16).toUpperCase()}</code></td>
                        <td><span class="pill ${entry.valid ? 'pill-green' : 'pill-red'}">${entry.valid ? '1 (RAM)' : '0 (DISK)'}</span></td>
                        <td><code>${entry.frameNumber !== null ? 'Frame ' + entry.frameNumber : 'On Swap'}</code></td>
                        <td><span class="pill ${entry.dirty ? 'pill-amber' : 'pill-gray'}">${entry.dirty ? '1' : '0'}</span></td>
                        <td><span class="pill ${entry.reference ? 'pill-cyan' : 'pill-gray'}">${entry.reference ? '1' : '0'}</span></td>
                        <td>Sector ${entry.diskSector}</td>
                    </tr>
                `;
            }
        });

        // Physical Frames with Clock Hand Pointer
        let framesHtml = '';
        vm.frames.forEach((frame, idx) => {
            const isClockVictim = (vm.replacementAlgorithm === 'CLOCK' && vm.clockHand === idx);
            framesHtml += `
                <div class="frame-card ${frame.occupied ? 'frame-occupied' : 'frame-free'} ${isClockVictim ? 'frame-clock-target' : ''}">
                    <div class="frame-header">
                        <span>Frame ${frame.frameNumber}</span>
                        ${isClockVictim ? '<span class="clock-indicator">👉 CLOCK HAND</span>' : ''}
                    </div>
                    <div class="frame-body">
                        ${frame.occupied 
                            ? `<div class="frame-vpn">Page: <strong>0x${(frame.vpn >>> 0).toString(16).toUpperCase()}</strong></div>`
                            : '<div class="frame-empty-text">Empty Slot</div>'
                        }
                    </div>
                </div>
            `;
        });

        container.innerHTML = `
            <div class="lab-section">
                <div class="lab-controls-bar">
                    <div class="control-group">
                        <label>Page Replacement Algorithm:</label>
                        <select id="pagingAlgoSelect" class="lab-select">
                            <option value="CLOCK" ${vm.replacementAlgorithm === 'CLOCK' ? 'selected' : ''}>Clock (Second-Chance)</option>
                            <option value="LRU" ${vm.replacementAlgorithm === 'LRU' ? 'selected' : ''}>LRU (Least Recently Used)</option>
                            <option value="FIFO" ${vm.replacementAlgorithm === 'FIFO' ? 'selected' : ''}>FIFO (First In First Out - Belady's Anomaly)</option>
                        </select>
                    </div>
                    <div class="control-group">
                        <button id="btnTriggerFault" class="lab-btn btn-warning">⚡ Inject Random Page Fault</button>
                    </div>
                </div>

                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-label">TLB Hit Rate</div>
                        <div class="metric-value highlight-cyan">${vm.stats.tlbHits + vm.stats.tlbMisses > 0 ? ((vm.stats.tlbHits / (vm.stats.tlbHits + vm.stats.tlbMisses)) * 100).toFixed(1) : 0}%</div>
                        <div class="metric-sub">${vm.stats.tlbHits} Hits / ${vm.stats.tlbMisses} Misses</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Page Faults</div>
                        <div class="metric-value highlight-red">${vm.stats.pageFaults}</div>
                        <div class="metric-sub">Swapped from disk (~10 ms penalty)</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Disk I/O Operations</div>
                        <div class="metric-value highlight-amber">${vm.stats.diskReads} Reads / ${vm.stats.diskWrites} Writes</div>
                        <div class="metric-sub">Dirty page writebacks tracked</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Physical RAM Frames</div>
                        <div class="metric-value highlight-green">${vm.frames.filter(f => f.occupied).length} / ${vm.frames.length} Used</div>
                        <div class="metric-sub">4 KB per page frame</div>
                    </div>
                </div>

                <div class="paging-grid-layout">
                    <!-- TLB Column -->
                    <div class="lab-box">
                        <div class="box-title">⚡ Translation Lookaside Buffer (TLB)</div>
                        <table class="lab-table">
                            <thead>
                                <tr>
                                    <th>Slot</th>
                                    <th>Status</th>
                                    <th>Tag (VPN)</th>
                                    <th>Physical Frame</th>
                                    <th>LRU</th>
                                </tr>
                            </thead>
                            <tbody>${tlbRows}</tbody>
                        </table>
                    </div>

                    <!-- Physical RAM Frames Column -->
                    <div class="lab-box">
                        <div class="box-title">💾 Physical RAM Frames (8 Frames)</div>
                        <div class="frames-grid">
                            ${framesHtml}
                        </div>
                    </div>
                </div>

                <!-- Page Table -->
                <div class="lab-box">
                    <div class="box-title">📋 Multi-Entry Page Table (RAM & Swap Space)</div>
                    <div style="max-height: 380px; overflow-y: auto;">
                        <table class="lab-table">
                            <thead>
                                <tr>
                                    <th>Virtual Page (VPN)</th>
                                    <th>Valid Bit (Presence)</th>
                                    <th>Physical Frame Number</th>
                                    <th>Dirty Bit (Modified)</th>
                                    <th>Reference Bit (Clock)</th>
                                    <th>Swap Disk Sector</th>
                                </tr>
                            </thead>
                            <tbody>${ptRows}</tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    renderFragmentationLab(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const alloc = this.sys.allocator;
        const metrics = alloc.getMetrics();

        // Build continuous memory map bar
        let memoryBarSegments = '';
        alloc.blocks.forEach(block => {
            const widthPct = (block.size / alloc.totalMemoryKB) * 100;
            if (block.isAllocated) {
                memoryBarSegments += `
                    <div class="mem-segment segment-allocated" style="width: ${widthPct}%;" title="${block.processName}: ${block.size} KB (Start: ${block.start} KB)">
                        <span class="seg-label">${block.processName} (${block.size}K)</span>
                    </div>
                `;
            } else {
                memoryBarSegments += `
                    <div class="mem-segment segment-hole" style="width: ${widthPct}%;" title="Free Hole: ${block.size} KB (Start: ${block.start} KB)">
                        <span class="seg-label">Free (${block.size}K)</span>
                    </div>
                `;
            }
        });

        // Blocks table
        let blocksRows = '';
        alloc.blocks.forEach(b => {
            blocksRows += `
                <tr class="${b.isAllocated ? 'line-allocated' : 'line-hole'}">
                    <td><code>${b.start} KB</code></td>
                    <td><code>${b.start + b.size} KB</code></td>
                    <td><strong>${b.size} KB</strong></td>
                    <td>${b.isAllocated ? `<span class="badge badge-process">${b.processName}</span>` : '<span class="badge badge-hole">Free Hole</span>'}</td>
                    <td>
                        ${b.isAllocated 
                            ? `<button class="btn-free-proc lab-action-btn" data-proc="${b.processName}">Deallocate (Free)</button>` 
                            : '---'
                        }
                    </td>
                </tr>
            `;
        });

        // Test Paging comparison for a 125 KB process
        const sampleProcessSize = 125;
        const pagingComparison = alloc.calculatePagingInternalFrag(sampleProcessSize);

        container.innerHTML = `
            <div class="lab-section">
                <!-- Allocator Top Controls -->
                <div class="lab-controls-bar">
                    <div class="control-group">
                        <label>Placement Strategy:</label>
                        <select id="allocAlgoSelect" class="lab-select">
                            <option value="FIRST_FIT" ${alloc.algorithm === 'FIRST_FIT' ? 'selected' : ''}>First-Fit (Fastest, allocates first hole)</option>
                            <option value="BEST_FIT" ${alloc.algorithm === 'BEST_FIT' ? 'selected' : ''}>Best-Fit (Smallest hole, leaves tiny slivers)</option>
                            <option value="WORST_FIT" ${alloc.algorithm === 'WORST_FIT' ? 'selected' : ''}>Worst-Fit (Largest hole)</option>
                        </select>
                    </div>
                    <div class="control-group">
                        <button id="btnCompactMemory" class="lab-btn btn-primary">🧹 Defragment & Compact Memory</button>
                        <button id="btnResetAllocator" class="lab-btn btn-secondary">↺ Reset Memory State</button>
                    </div>
                </div>

                <!-- Allocation Form -->
                <div class="alloc-form-bar">
                    <div class="form-item">
                        <label>Process Name:</label>
                        <input type="text" id="allocProcName" value="Media Player" class="lab-input" />
                    </div>
                    <div class="form-item">
                        <label>Size (KB):</label>
                        <input type="number" id="allocProcSize" value="180" min="10" max="1024" class="lab-input" />
                    </div>
                    <button id="btnDoAllocate" class="lab-btn btn-success">+ Allocate Process</button>
                </div>

                <div id="allocMessageAlert" class="alert-box-hidden"></div>

                <!-- Metrics Grid -->
                <div class="metrics-grid">
                    <div class="metric-card">
                        <div class="metric-label">Total Free Memory</div>
                        <div class="metric-value highlight-cyan">${metrics.totalFreeKB} KB</div>
                        <div class="metric-sub">${metrics.freePercentage}% available</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Largest Contiguous Hole</div>
                        <div class="metric-value highlight-gold">${metrics.largestHoleKB} KB</div>
                        <div class="metric-sub">Max single process fit</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Scattered Free Holes</div>
                        <div class="metric-value highlight-amber">${metrics.freeHolesCount} Holes</div>
                        <div class="metric-sub">External fragmentation index</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Compactions Run</div>
                        <div class="metric-value highlight-green">${alloc.stats.compactionsCount}</div>
                        <div class="metric-sub">Coalesced memory events</div>
                    </div>
                </div>

                <!-- Visual Memory Bar -->
                <div class="lab-box">
                    <div class="box-title">Physical Memory Map (0 KB to 1024 KB)</div>
                    <div class="memory-linear-bar">
                        ${memoryBarSegments}
                    </div>
                    <div class="memory-legend">
                        <span class="legend-item"><span class="legend-color legend-color-alloc"></span> Allocated Process</span>
                        <span class="legend-item"><span class="legend-color legend-color-hole"></span> Free Hole (External Fragmentation)</span>
                    </div>
                </div>

                <!-- Fragmentation Educational Clash: External vs Internal -->
                <div class="frag-comparison-grid">
                    <div class="frag-card frag-card-ext">
                        <h4>🧩 External Fragmentation (Contiguous Allocation)</h4>
                        <p>Happens when total free memory (${metrics.totalFreeKB} KB) is large enough to satisfy a request, but the memory is <strong>non-contiguous</strong> (broken into ${metrics.freeHolesCount} separate small holes).</p>
                        <p><strong>Solution:</strong> Memory Compaction (sliding processes down, expensive CPU copy) or <strong>Paging</strong>.</p>
                    </div>
                    <div class="frag-card frag-card-int">
                        <h4>📦 Internal Fragmentation (Paging)</h4>
                        <p>Paging solves external fragmentation completely! However, if a process of <strong>${sampleProcessSize} KB</strong> requests memory in fixed <strong>4 KB pages</strong>:</p>
                        <ul>
                            <li>Pages allocated: <code>${pagingComparison.pagesNeeded} pages</code> (<code>${pagingComparison.allocatedKB} KB</code>)</li>
                            <li>Wasted space in final page: <strong class="highlight-red">${pagingComparison.internalFragKB} KB (${pagingComparison.wastePercentage}%)</strong>!</li>
                        </ul>
                    </div>
                </div>

                <!-- Detailed Memory Partitions Table -->
                <div class="lab-box">
                    <div class="box-title">Partition Table & Free Holes</div>
                    <table class="lab-table">
                        <thead>
                            <tr>
                                <th>Start Address</th>
                                <th>End Address</th>
                                <th>Block Size</th>
                                <th>Status / Owner</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>${blocksRows}</tbody>
                    </table>
                </div>
            </div>
        `;
    }

    renderBitAnatomyLab(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="lab-section">
                <div class="anatomy-grid">
                    <!-- Left: Interactive Sliders -->
                    <div class="lab-box">
                        <div class="box-title">⚙️ Cache & Virtual Memory Parameters</div>
                        
                        <div class="slider-control">
                            <div class="slider-header">
                                <span>Cache Total Size:</span>
                                <strong id="sliderValCacheSize">512 Bytes</strong>
                            </div>
                            <input type="range" id="sliderCacheSize" min="7" max="14" value="9" class="lab-range" />
                            <small class="slider-hint">2^7 (128B) to 2^14 (16KB)</small>
                        </div>

                        <div class="slider-control">
                            <div class="slider-header">
                                <span>Block / Line Size:</span>
                                <strong id="sliderValBlockSize">32 Bytes</strong>
                            </div>
                            <input type="range" id="sliderBlockSize" min="4" max="7" value="5" class="lab-range" />
                            <small class="slider-hint">2^4 (16B) to 2^7 (128B)</small>
                        </div>

                        <div class="slider-control">
                            <div class="slider-header">
                                <span>Set Associativity (Ways):</span>
                                <strong id="sliderValWays">2-Way</strong>
                            </div>
                            <input type="range" id="sliderWays" min="0" max="3" value="1" class="lab-range" />
                            <small class="slider-hint">Direct (1-way), 2-way, 4-way, 8-way</small>
                        </div>

                        <div class="slider-control">
                            <div class="slider-header">
                                <span>Page Size (Virtual Memory):</span>
                                <strong id="sliderValPageSize">4096 Bytes (4 KB)</strong>
                            </div>
                            <input type="range" id="sliderPageSize" min="10" max="14" value="12" class="lab-range" />
                            <small class="slider-hint">1 KB to 16 KB pages</small>
                        </div>
                    </div>

                    <!-- Right: Dynamic Bit Breakdown Ruler -->
                    <div class="lab-box">
                        <div class="box-title">📐 Dynamic 32-Bit Address Dissection</div>
                        
                        <h4 class="anatomy-subtitle">1. Physical Address Breakdown for Cache</h4>
                        <div id="cacheBitRuler" class="bit-ruler">
                            <!-- Dynamic segments injected here -->
                        </div>
                        <div id="cacheBitFormulas" class="bit-formulas">
                            <!-- Math equations injected here -->
                        </div>

                        <h4 class="anatomy-subtitle" style="margin-top: 2rem;">2. Virtual Address Breakdown for Paging</h4>
                        <div id="pagingBitRuler" class="bit-ruler">
                            <!-- Dynamic segments injected here -->
                        </div>
                        <div id="pagingBitFormulas" class="bit-formulas">
                            <!-- Math equations injected here -->
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.updateBitAnatomyCalculation();
    }

    updateBitAnatomyCalculation() {
        const cacheSizePower = parseInt(document.getElementById('sliderCacheSize')?.value || 9);
        const blockSizePower = parseInt(document.getElementById('sliderBlockSize')?.value || 5);
        const waysPower = parseInt(document.getElementById('sliderWays')?.value || 1);
        const pageSizePower = parseInt(document.getElementById('sliderPageSize')?.value || 12);

        const cacheSize = Math.pow(2, cacheSizePower);
        const blockSize = Math.pow(2, blockSizePower);
        const ways = Math.pow(2, waysPower);
        const pageSize = Math.pow(2, pageSizePower);

        // Update labels
        const valCacheSize = document.getElementById('sliderValCacheSize');
        if (valCacheSize) valCacheSize.innerText = cacheSize >= 1024 ? (cacheSize/1024) + ' KB' : cacheSize + ' Bytes';
        
        const valBlockSize = document.getElementById('sliderValBlockSize');
        if (valBlockSize) valBlockSize.innerText = blockSize + ' Bytes';

        const valWays = document.getElementById('sliderValWays');
        if (valWays) valWays.innerText = ways === 1 ? 'Direct Mapped (1-Way)' : `${ways}-Way Set Associative`;

        const valPageSize = document.getElementById('sliderValPageSize');
        if (valPageSize) valPageSize.innerText = `${pageSize/1024} KB (${pageSize} Bytes)`;

        // Cache Bit Math
        const numBlocks = Math.floor(cacheSize / blockSize);
        const numSets = Math.max(1, Math.floor(numBlocks / ways));

        const offsetBits = blockSizePower;
        const indexBits = Math.round(Math.log2(numSets));
        const tagBits = 32 - (indexBits + offsetBits);

        // Render Cache Bit Ruler
        const cacheRuler = document.getElementById('cacheBitRuler');
        if (cacheRuler) {
            const tagPct = (tagBits / 32) * 100;
            const indexPct = (indexBits / 32) * 100;
            const offsetPct = (offsetBits / 32) * 100;

            cacheRuler.innerHTML = `
                <div class="ruler-segment seg-tag" style="width: ${tagPct}%;">
                    <div class="ruler-name">TAG</div>
                    <div class="ruler-bits">${tagBits} Bits</div>
                    <div class="ruler-range">[31 : ${indexBits + offsetBits}]</div>
                </div>
                ${indexBits > 0 ? `
                    <div class="ruler-segment seg-index" style="width: ${indexPct}%;">
                        <div class="ruler-name">SET INDEX</div>
                        <div class="ruler-bits">${indexBits} Bits</div>
                        <div class="ruler-range">[${indexBits + offsetBits - 1} : ${offsetBits}]</div>
                    </div>
                ` : ''}
                <div class="ruler-segment seg-offset" style="width: ${offsetPct}%;">
                    <div class="ruler-name">BLOCK OFFSET</div>
                    <div class="ruler-bits">${offsetBits} Bits</div>
                    <div class="ruler-range">[${offsetBits - 1} : 0]</div>
                </div>
            `;
        }

        const cacheFormulas = document.getElementById('cacheBitFormulas');
        if (cacheFormulas) {
            cacheFormulas.innerHTML = `
                <div class="formula-item"><code>Offset Bits = log2(Block Size) = log2(${blockSize}) = <strong>${offsetBits} bits</strong></code></div>
                <div class="formula-item"><code>Sets = Total Blocks / Ways = (${numBlocks} / ${ways}) = <strong>${numSets} sets</strong></code></div>
                <div class="formula-item"><code>Index Bits = log2(Sets) = log2(${numSets}) = <strong>${indexBits} bits</strong></code></div>
                <div class="formula-item"><code>Tag Bits = 32 - (${indexBits} + ${offsetBits}) = <strong>${tagBits} bits</strong></code></div>
            `;
        }

        // Paging Bit Math
        const pageOffsetBits = pageSizePower;
        const vpnBits = 32 - pageOffsetBits;

        const pagingRuler = document.getElementById('pagingBitRuler');
        if (pagingRuler) {
            const vpnPct = (vpnBits / 32) * 100;
            const pOffsetPct = (pageOffsetBits / 32) * 100;

            pagingRuler.innerHTML = `
                <div class="ruler-segment seg-vpn" style="width: ${vpnPct}%;">
                    <div class="ruler-name">VIRTUAL PAGE NUMBER (VPN)</div>
                    <div class="ruler-bits">${vpnBits} Bits</div>
                    <div class="ruler-range">[31 : ${pageOffsetBits}]</div>
                </div>
                <div class="ruler-segment seg-poffset" style="width: ${pOffsetPct}%;">
                    <div class="ruler-name">PAGE OFFSET</div>
                    <div class="ruler-bits">${pageOffsetBits} Bits</div>
                    <div class="ruler-range">[${pageOffsetBits - 1} : 0]</div>
                </div>
            `;
        }

        const pagingFormulas = document.getElementById('pagingBitFormulas');
        if (pagingFormulas) {
            pagingFormulas.innerHTML = `
                <div class="formula-item"><code>Page Offset Bits = log2(Page Size) = log2(${pageSize}) = <strong>${pageOffsetBits} bits</strong></code></div>
                <div class="formula-item"><code>VPN Bits = 32 - ${pageOffsetBits} = <strong>${vpnBits} bits</strong> (${Math.pow(2, vpnBits).toLocaleString()} Virtual Pages)</code></div>
            `;
        }
    }



}



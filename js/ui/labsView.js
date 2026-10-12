/**
 * Labs View Manager
 * Handles rendering and user interactions for:
 * 1. Cache Lab (Table, Associativity, 3 C's)
 * 2. Virtual Memory & Swapping Lab (TLB, Page Table, Clock Hand)
 * 3. Allocation & Fragmentation Lab (First/Best/Worst Fit, External Frag, Compaction, Internal Frag)
 * 4. Bit Anatomy Calculator
 * 5. Human-Scale Latency Comparison
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

    renderLatencyLab(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="lab-section">
                <div class="latency-hero-card">
                    <h3>⏳ The "Human Scale" Memory Time Warp</h3>
                    <p>Computer architects often say that if the CPU clock were scaled to 1 second (1 human heartbeat), reaching out to disk is not a minor delay—it is an eternity. Here is what happens when <strong>1 nanosecond = 1 second</strong>:</p>
                </div>

                <div class="latency-table-wrap">
                    <table class="lab-table latency-table">
                        <thead>
                            <tr>
                                <th>Memory Hierarchy Level</th>
                                <th>Hardware Latency</th>
                                <th>Human Scaled Time</th>
                                <th>Real-World Analogy</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><span class="badge badge-cpu">CPU Registers</span></td>
                                <td>0.25 ns</td>
                                <td>0.25 seconds</td>
                                <td>A quick blink of your eye</td>
                            </tr>
                            <tr class="line-hit">
                                <td><span class="badge badge-l1">L1 Cache</span></td>
                                <td>1.0 ns</td>
                                <td>1 second</td>
                                <td>One human heartbeat 💓</td>
                            </tr>
                            <tr class="line-hit">
                                <td><span class="badge badge-l2">L2 Cache</span></td>
                                <td>4.0 ns</td>
                                <td>4 seconds</td>
                                <td>Taking one deep breath 🫁</td>
                            </tr>
                            <tr>
                                <td><span class="badge badge-l3">L3 Unified Cache</span></td>
                                <td>10.0 ns</td>
                                <td>10 seconds</td>
                                <td>Unlocking your phone screen 📱</td>
                            </tr>
                            <tr class="line-ram">
                                <td><span class="badge badge-ram">Main Memory (DRAM)</span></td>
                                <td>100.0 ns</td>
                                <td>1.6 minutes</td>
                                <td>Walking down the hall to get a coffee ☕</td>
                            </tr>
                            <tr class="line-fault">
                                <td><span class="badge badge-fault">NVMe SSD Storage</span></td>
                                <td>10,000 ns (10 µs)</td>
                                <td>2.7 hours</td>
                                <td>Watching a full Hollywood feature film 🎬</td>
                            </tr>
                            <tr class="highlight-fault-box">
                                <td><span class="badge badge-fault">🚨 Mechanical Disk Page Fault</span></td>
                                <td>10,000,000 ns (10 ms)</td>
                                <td><strong class="highlight-red">3.8 MONTHS!</strong></td>
                                <td>Waiting an entire semester of college! 🎓</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="quote-card">
                    <blockquote>
                        "This is why a Page Fault or Cache Miss ruins performance. The CPU sits completely frozen for what feels like months, waiting for a single block of data from storage."
                    </blockquote>
                </div>
            </div>
        `;
    }

    renderRomLab(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const rom = this.sys.rom;
        const currentType = rom.activeType;
        const bootStatus = rom.getBootStatus();

        // Technical profile for each ROM type
        const profiles = {
            MROM: {
                title: 'Masked ROM (MROM)',
                subtitle: 'Factory Photolithography Mask (Hardwired Silicon)',
                mechanism: 'Hardwired diode/transistor metallization mask during factory fabrication.',
                programmable: 'None (Factory Mask Only)',
                erasure: 'Impossible (Physical silicon tracks)',
                granularity: 'None',
                endurance: 'Infinite Read Endurance (Permanent)',
                application: 'Original Nintendo cartridges, keyboard microcontrollers, CD-ROM boot code.'
            },
            PROM: {
                title: 'Programmable ROM (PROM)',
                subtitle: 'One-Time Programmable (OTP) Fusible Links',
                mechanism: 'Fusible links (polysilicon / nichrome). All fuses start intact as 1s.',
                programmable: 'One-Time (OTP) via high voltage programming pulse (Vpp = 12.5V)',
                erasure: 'None (Blown fuses cannot be physically repaired)',
                granularity: 'Bit-level permanent destruction',
                endurance: '1 Write Cycle (Permanent)',
                application: 'Lookup tables, early video game cartridges, weapon guidance systems.'
            },
            EPROM: {
                title: 'Erasable PROM (EPROM)',
                subtitle: 'Floating-Gate Avalanche Injection with Quartz Window',
                mechanism: 'Floating-gate MOSFETs store trapped charge. Charges remain for 20+ years.',
                programmable: 'Electrical hot-carrier injection via device programmer',
                erasure: 'Exposure to 254 nm UV-C light through transparent quartz window for 20 minutes',
                granularity: 'Entire chip wiped to 0xFF (11111111)',
                endurance: '100 – 1,000 Erasure Cycles',
                application: '1980s-1990s PC BIOS chips, arcade machines, development prototypes.'
            },
            EEPROM: {
                title: 'Electrically Erasable PROM (EEPROM)',
                subtitle: 'Fowler-Nordheim Quantum Tunneling',
                mechanism: 'Thinner gate oxide allows electrical electron tunneling in-circuit.',
                programmable: 'Byte-by-byte electrical programming without removing chip from motherboard',
                erasure: 'Electrical voltage pulse (~12V internal charge pump)',
                granularity: 'Byte-level Read / Write / Erase',
                endurance: '100,000 – 1,000,000 P/E Cycles',
                application: 'Motherboard BIOS settings, network card MAC addresses, automotive ECUs.'
            },
            FLASH: {
                title: 'Flash Memory (NOR / NAND)',
                subtitle: 'Modern High-Density Block-Erase Firmware & Storage',
                mechanism: 'Floating gate / Charge trap transistors arranged in NOR (XIP) or NAND arrays.',
                programmable: 'In-system firmware flashing via SPI bus',
                erasure: 'Electrical block/sector erase (entire 4KB - 128KB block reset to 0xFF first)',
                granularity: 'Sector/Block Erase, Byte/Word Write',
                endurance: '3,000 – 100,000 P/E Cycles (Wear leveling required)',
                application: 'Modern UEFI BIOS chips, USB drives, smartphones, SSD storage.'
            }
        };

        const activeProfile = profiles[currentType] || profiles.PROM;

        // Render Memory Rows
        let memoryRows = '';
        rom.memory.forEach(entry => {
            const isBootTarget = bootStatus.step > 0 && entry.addr === (bootStatus.step - 1);
            let bitsHtml = '';
            entry.bits.forEach((bit, bIdx) => {
                const isBlown = bit === 0;
                const bitClass = isBlown ? 'bit-cell bit-blown' : 'bit-cell bit-intact';
                const clickable = currentType === 'PROM' ? 'bit-clickable' : '';
                bitsHtml += `
                    <button class="${bitClass} ${clickable}" data-addr="${entry.addr}" data-bit="${bIdx}" title="${currentType === 'PROM' ? (isBlown ? 'Fuse Blown (0) - Permanent' : 'Fuse Intact (1) - Click to blow fuse with 12.5V pulse') : 'Bit ' + (7 - bIdx) + ': ' + bit}">
                        ${bit}
                    </button>
                `;
            });

            memoryRows += `
                <tr class="${isBootTarget ? 'line-boot-active' : ''}">
                    <td><code>0x${entry.addr.toString(16).padStart(4, '0').toUpperCase()}</code></td>
                    <td><strong class="highlight-cyan">0x${entry.val.toString(16).padStart(2, '0').toUpperCase()}</strong></td>
                    <td>
                        <div class="bits-row">
                            ${bitsHtml}
                        </div>
                    </td>
                    <td><code class="opcode-cell">${entry.opcode}</code></td>
                    <td class="desc-cell">${entry.desc}</td>
                </tr>
            `;
        });

        // Boot sequence progress tracker
        let bootStepsHtml = '';
        rom.bootSequence.forEach((stepItem, idx) => {
            const isDone = bootStatus.step > idx;
            const isCurrent = bootStatus.step === (idx + 1);
            let statusBadge = '<span class="pill pill-gray">Pending</span>';
            if (isDone) statusBadge = '<span class="pill pill-green">Executed</span>';
            if (isCurrent) statusBadge = '<span class="pill pill-amber">ACTIVE PC</span>';

            bootStepsHtml += `
                <div class="boot-step-card ${isCurrent ? 'boot-step-active' : (isDone ? 'boot-step-done' : '')}">
                    <div class="boot-step-header">
                        <span class="step-num">${stepItem.step}</span>
                        <span class="step-title">${stepItem.title}</span>
                        ${statusBadge}
                    </div>
                    <div class="boot-step-body">
                        <div class="boot-vector"><strong>Target Vector:</strong> <code>${stepItem.vector}</code></div>
                        <p>${stepItem.detail}</p>
                    </div>
                </div>
            `;
        });

        container.innerHTML = `
            <div class="lab-section">
                <!-- Top Header & Technology Selector -->
                <div class="rom-header-bar">
                    <div class="rom-title-box">
                        <h3>💾 Semiconductor ROM (Read-Only Memory) Architecture Lab</h3>
                        <p>Explore the physical mechanisms of non-volatile semiconductor memory: from factory lithography and fusible links to UV quartz windows, Fowler-Nordheim tunneling, and the x86 BIOS boot sequence.</p>
                    </div>
                    <div class="rom-type-buttons">
                        <button class="rom-btn ${currentType === 'MROM' ? 'active' : ''}" data-type="MROM">Masked ROM</button>
                        <button class="rom-btn ${currentType === 'PROM' ? 'active' : ''}" data-type="PROM">PROM (Fuses)</button>
                        <button class="rom-btn ${currentType === 'EPROM' ? 'active' : ''}" data-type="EPROM">EPROM (UV)</button>
                        <button class="rom-btn ${currentType === 'EEPROM' ? 'active' : ''}" data-type="EEPROM">EEPROM</button>
                        <button class="rom-btn ${currentType === 'FLASH' ? 'active' : ''}" data-type="FLASH">Flash Memory</button>
                    </div>
                </div>

                <!-- Active Profile Info Card -->
                <div class="rom-profile-card">
                    <div class="profile-header">
                        <div>
                            <h4>${activeProfile.title}</h4>
                            <span class="profile-sub">${activeProfile.subtitle}</span>
                        </div>
                        <span class="pill pill-cyan">${currentType}</span>
                    </div>
                    <div class="profile-grid">
                        <div class="profile-item">
                            <span class="p-label">Physical Mechanism:</span>
                            <span class="p-val">${activeProfile.mechanism}</span>
                        </div>
                        <div class="profile-item">
                            <span class="p-label">Programmability:</span>
                            <span class="p-val">${activeProfile.programmable}</span>
                        </div>
                        <div class="profile-item">
                            <span class="p-label">Erasure Method:</span>
                            <span class="p-val">${activeProfile.erasure}</span>
                        </div>
                        <div class="profile-item">
                            <span class="p-label">Erasure Granularity:</span>
                            <span class="p-val">${activeProfile.granularity}</span>
                        </div>
                        <div class="profile-item">
                            <span class="p-label">Write Endurance:</span>
                            <span class="p-val">${activeProfile.endurance}</span>
                        </div>
                        <div class="profile-item">
                            <span class="p-label">Key Applications:</span>
                            <span class="p-val">${activeProfile.application}</span>
                        </div>
                    </div>
                </div>

                <!-- Interactive Hardware Chip Visualizer & Programmer -->
                <div class="rom-hardware-grid">
                    <!-- Left: Semiconductor DIP IC Visualizer -->
                    <div class="lab-box chip-visual-box">
                        <div class="box-title">🔬 Semiconductor DIP-28 Integrated Circuit Package</div>
                        <div class="dip-chip-container ${rom.isUvErasing ? 'uv-active-glow' : ''}">
                            <div class="dip-notch"></div>
                            <div class="chip-label">
                                <span class="chip-mfg">INTEL / MICROCHIP</span>
                                <span class="chip-part">${currentType === 'EPROM' ? 'D27C256-15' : (currentType === 'PROM' ? 'N82S129 OTP' : (currentType === 'EEPROM' ? 'AT28C16-15PU' : (currentType === 'FLASH' ? 'W25Q128JV SPI' : 'CUSTOM MASK ROM')))}</span>
                                <span class="chip-spec">NON-VOLATILE MEMORY SILICON</span>
                            </div>
                            ${currentType === 'EPROM' ? `
                                <div class="eprom-quartz-window ${rom.isUvErasing ? 'quartz-uv-beaming' : ''}" id="quartzWindow" title="Transparent Quartz Glass Window for UV-C Erasing">
                                    <div class="quartz-die">SILICON DIE</div>
                                    <div class="quartz-glare"></div>
                                </div>
                            ` : `
                                <div class="epoxy-packaging">
                                    <span>SOLID EPOXY ENCAPSULATION</span>
                                </div>
                            `}
                            <div class="chip-pins pins-left">
                                ${Array.from({length: 8}, (_, i) => `<div class="chip-pin"></div>`).join('')}
                            </div>
                            <div class="chip-pins pins-right">
                                ${Array.from({length: 8}, (_, i) => `<div class="chip-pin"></div>`).join('')}
                            </div>
                        </div>

                        <!-- Chip Controls -->
                        <div class="chip-actions-bar">
                            ${currentType === 'EPROM' ? `
                                <button id="btnEraseUv" class="lab-btn btn-purple">☀️ Shine UV Light (Erase Quartz Window to 0xFF)</button>
                            ` : ''}
                            ${currentType === 'PROM' ? `
                                <div class="action-hint">⚡ <strong>PROM Burning:</strong> Click any <code class="highlight-green">1</code> bit in the firmware table to vaporize its fusible link with a 12.5V pulse into <code class="highlight-red">0</code>!</div>
                            ` : ''}
                            ${currentType === 'EEPROM' ? `
                                <div class="eeprom-write-form">
                                    <input type="number" id="eepromAddr" min="0" max="15" value="0" class="num-input" placeholder="Addr (0-15)">
                                    <input type="text" id="eepromHex" value="0x90" class="hex-input" placeholder="Hex (e.g. 0x90)">
                                    <button id="btnWriteEeprom" class="lab-btn btn-primary">⚡ Tunnel Byte</button>
                                </div>
                            ` : ''}
                            ${currentType === 'FLASH' ? `
                                <div class="eeprom-write-form">
                                    <input type="number" id="flashAddr" min="0" max="15" value="0" class="num-input" placeholder="Addr (0-15)">
                                    <input type="text" id="flashHex" value="0xFF" class="hex-input" placeholder="Hex (e.g. 0xFF)">
                                    <button id="btnWriteFlash" class="lab-btn btn-primary">⚡ Erase Block & Write Flash</button>
                                </div>
                            ` : ''}
                            <button id="btnResetRom" class="lab-btn btn-secondary">↺ Reload Factory BIOS Firmware</button>
                        </div>
                    </div>

                    <!-- Right: Hardware Write-Violation Exception Simulator -->
                    <div class="lab-box">
                        <div class="box-title">🛡️ Hardware Write-Protection & Bus Fault Trap</div>
                        <p class="box-desc">Because ROM space is read-only, attempting to execute a CPU <code>STORE</code> instruction causes the memory bus controller to assert a bus exception.</p>
                        
                        <div class="store-test-bar">
                            <div class="store-inputs">
                                <label>Target ROM Address:</label>
                                <input type="text" id="storeTargetAddr" class="hex-input" value="0xF000" />
                                <label>Data Byte:</label>
                                <input type="text" id="storeTargetData" class="hex-input" value="0x42" />
                            </div>
                            <button id="btnAttemptStore" class="lab-btn btn-danger">🚨 Attempt CPU STORE (Write)</button>
                        </div>

                        <div id="romWriteAlertBox" class="alert-box-hidden"></div>
                    </div>
                </div>

                <!-- Live Memory Matrix & Disassembler -->
                <div class="lab-box">
                    <div class="box-title">📋 Live Non-Volatile ROM Firmware Space (16 Bytes / x86 Legacy BIOS Entry)</div>
                    <div style="overflow-x: auto;">
                        <table class="lab-table rom-table">
                            <thead>
                                <tr>
                                    <th>Address</th>
                                    <th>Byte Hex</th>
                                    <th>Bit Cell Matrix (${currentType === 'PROM' ? 'Fusible Links' : 'Floating Gates'})</th>
                                    <th>Disassembled Opcode</th>
                                    <th>Architectural Meaning</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${memoryRows}
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- x86 BIOS Cold Boot Sequence Stepper -->
                <div class="lab-box">
                    <div class="box-title-bar">
                        <div class="box-title">🚀 Why Computers Need ROM: The x86 Cold Boot Sequence</div>
                        <div class="btn-group">
                            <button id="btnStepBoot" class="lab-btn btn-primary">⚡ Step Boot Cycle (${bootStatus.step}/${bootStatus.totalSteps})</button>
                            <button id="btnResetBoot" class="lab-btn">↺ Reset Cold Boot</button>
                        </div>
                    </div>
                    <p class="box-desc">When power is first applied, physical RAM is empty and chaotic. The CPU program counter is hardwired to fetch its very first instruction from non-volatile ROM!</p>
                    
                    <div class="boot-steps-grid">
                        ${bootStepsHtml}
                    </div>
                </div>

                <!-- Master Semiconductor ROM Comparison Table -->
                <div class="lab-box">
                    <div class="box-title">📊 Semiconductor ROM Technology Master Comparison</div>
                    <div style="overflow-x: auto;">
                        <table class="lab-table comparison-table">
                            <thead>
                                <tr>
                                    <th>Feature</th>
                                    <th>Masked ROM (MROM)</th>
                                    <th>PROM</th>
                                    <th>EPROM</th>
                                    <th>EEPROM</th>
                                    <th>Flash Memory</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><strong>Full Name</strong></td>
                                    <td>Masked Read-Only Memory</td>
                                    <td>Programmable ROM</td>
                                    <td>Erasable Programmable ROM</td>
                                    <td>Electrically Erasable PROM</td>
                                    <td>Flash Memory (NOR / NAND)</td>
                                </tr>
                                <tr>
                                    <td><strong>Programming Method</strong></td>
                                    <td>Factory photolithography mask</td>
                                    <td>High-voltage current blows fusible links</td>
                                    <td>Avalanche injection of electrons into floating gate</td>
                                    <td>Fowler-Nordheim tunneling (electron injection)</td>
                                    <td>Hot-electron injection / Fowler-Nordheim</td>
                                </tr>
                                <tr>
                                    <td><strong>Erasure Technique</strong></td>
                                    <td>Not possible</td>
                                    <td>Not possible (One-time programmable)</td>
                                    <td>UV light through quartz window (~20 mins)</td>
                                    <td>Electrical voltage pulse in-circuit</td>
                                    <td>Electrical block/sector erase</td>
                                </tr>
                                <tr>
                                    <td><strong>Erasure Granularity</strong></td>
                                    <td>N/A</td>
                                    <td>N/A (Irreversible)</td>
                                    <td>Entire chip wiped simultaneously</td>
                                    <td>Single byte can be erased & rewritten</td>
                                    <td>Entire block (4KB - 128KB) must be erased together</td>
                                </tr>
                                <tr>
                                    <td><strong>In-Circuit Rewritable?</strong></td>
                                    <td>❌ No</td>
                                    <td>❌ No (Requires standalone programmer)</td>
                                    <td>❌ No (Must be removed & placed under UV lamp)</td>
                                    <td>✅ Yes (Directly on motherboard)</td>
                                    <td>✅ Yes (SPI Flash firmware update)</td>
                                </tr>
                                <tr>
                                    <td><strong>Endurance (P/E Cycles)</strong></td>
                                    <td>Infinite (Read only)</td>
                                    <td>1 Cycle (OTP)</td>
                                    <td>~100 - 1,000 Cycles</td>
                                    <td>~100,000 - 1,000,000 Cycles</td>
                                    <td>~3,000 - 100,000 Cycles</td>
                                </tr>
                                <tr>
                                    <td><strong>Typical Modern Usage</strong></td>
                                    <td>Mass-market embedded ASICs</td>
                                    <td>Static calibration tables, microcode</td>
                                    <td>Vintage electronics & arcade hardware</td>
                                    <td>CMOS NVRAM, configuration EEPROMs</td>
                                    <td>Modern UEFI BIOS, SSDs, USB flash storage</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }
}


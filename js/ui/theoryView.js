/**
 * Memory Theory & Architecture Encyclopedia View
 * Comprehensive theoretical reference covering the full spectrum of COA and OS memory concepts:
 * 1. Memory Hierarchy & Locality
 * 2. CPU Caches & Associativity
 * 3. Virtual Memory & Address Translation
 * 4. Paging, Page Faults & Replacement Algorithms
 * 5. Memory Allocation & Fragmentation
 * 6. Physical Hardware & Silicon Technologies
 */

export class TheoryView {
    constructor() {
        this.activeCategory = 'all';
        this.searchQuery = '';
    }

    render(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="theory-wrapper">
                <!-- Top Hero Header -->
                <div class="theory-hero">
                    <div class="theory-hero-content">
                        <div class="theory-badge">CORE COMPUTER SCIENCE & OS REFERENCE</div>
                        <h2>📖 Memory Architecture & Operating Systems Encyclopedia</h2>
                        <p>A rigorous, comprehensive theoretical reference detailing modern computer memory hierarchies, cache geometries, virtual address translation, demand paging lifecycles, and physical silicon mechanics.</p>
                    </div>

                    <!-- Search & Filter Controls -->
                    <div class="theory-filter-bar">
                        <div class="theory-search-box">
                            <span class="search-icon">🔍</span>
                            <input type="text" id="theorySearchInput" class="theory-search-input" placeholder="Search concepts (e.g. AMAT, TLB, EEPROM, Belady, Buddy, SRAM, Flash)..." value="${this.searchQuery}" />
                            ${this.searchQuery ? '<button id="btnClearTheorySearch" class="btn-clear-search">✕</button>' : ''}
                        </div>
                        <div class="theory-category-pills">
                            <button class="cat-pill ${this.activeCategory === 'all' ? 'active' : ''}" data-cat="all">All Concepts</button>
                            <button class="cat-pill ${this.activeCategory === 'hierarchy' ? 'active' : ''}" data-cat="hierarchy">1. Hierarchy & AMAT</button>
                            <button class="cat-pill ${this.activeCategory === 'cache' ? 'active' : ''}" data-cat="cache">2. Caches & Associativity</button>
                            <button class="cat-pill ${this.activeCategory === 'vm' ? 'active' : ''}" data-cat="vm">3. Virtual Memory & TLB</button>
                            <button class="cat-pill ${this.activeCategory === 'paging' ? 'active' : ''}" data-cat="paging">4. Paging & Faults</button>
                            <button class="cat-pill ${this.activeCategory === 'allocation' ? 'active' : ''}" data-cat="allocation">5. Allocation & Fragmentation</button>
                            <button class="cat-pill ${this.activeCategory === 'hardware' ? 'active' : ''}" data-cat="hardware">6. Hardware, DRAM & ROM</button>
                        </div>
                    </div>
                </div>

                <!-- Theory Content Sections -->
                <div class="theory-sections-container" id="theorySectionsList">
                    ${this.generateSectionsHtml()}
                </div>
            </div>
        `;

        this.bindEvents();
    }

    generateSectionsHtml() {
        const query = this.searchQuery.toLowerCase().trim();
        const cat = this.activeCategory;

        const sections = [
            // ==========================================
            // SECTION 1: HIERARCHY & LOCALITY
            // ==========================================
            {
                id: 'sec-hierarchy',
                category: 'hierarchy',
                title: '1. Memory Hierarchy & The Principle of Locality',
                icon: '🏔️',
                tags: ['hierarchy', 'amat', 'locality', 'spatial', 'temporal', 'memory wall', 'hit rate', 'miss penalty'],
                contentHtml: `
                    <div class="theory-card">
                        <div class="theory-card-header">
                            <h3>1.1 Why We Need a Memory Hierarchy: The "Memory Wall"</h3>
                            <span class="pill pill-cyan">Fundamental Architecture</span>
                        </div>
                        <p>Between 1980 and 2005, CPU clock speeds grew by approximately <strong>55% per year</strong>, while dynamic RAM (DRAM) access latencies only improved by about <strong>7% per year</strong>. This divergence created what computer architects call the <strong>Memory Wall</strong>: a state where the processor spends the overwhelming majority of its clock cycles stalled, waiting for memory operands.</p>
                        <p>No single memory technology simultaneously satisfies all three design ideals: <em>extreme speed</em>, <em>vast capacity</em>, and <em>low cost</em>. Therefore, systems organize storage hierarchically:</p>

                        <div class="theory-diagram-box">
                            <div class="hierarchy-pyramid">
                                <div class="pyramid-level pyr-reg">
                                    <span class="pyr-name">CPU Registers</span>
                                    <span class="pyr-spec">&lt; 1 KB • ~0.25 - 0.5 ns • Flip-Flops on CPU Core</span>
                                </div>
                                <div class="pyramid-level pyr-l1">
                                    <span class="pyr-name">L1 Cache (SRAM)</span>
                                    <span class="pyr-spec">32 - 128 KB • ~1 ns (3-4 cycles) • Dedicated Per Core</span>
                                </div>
                                <div class="pyramid-level pyr-l2">
                                    <span class="pyr-name">L2 Cache (SRAM)</span>
                                    <span class="pyr-spec">512 KB - 2 MB • ~3 - 5 ns • Non-inclusive/Inclusive Per Core</span>
                                </div>
                                <div class="pyramid-level pyr-l3">
                                    <span class="pyr-name">L3 Cache (Shared LLC)</span>
                                    <span class="pyr-spec">16 - 96 MB • ~10 - 15 ns • Shared Across All Cores</span>
                                </div>
                                <div class="pyramid-level pyr-ram">
                                    <span class="pyr-name">Main Memory (DDR4 / DDR5 DRAM)</span>
                                    <span class="pyr-spec">16 - 128 GB • ~60 - 100 ns • Off-chip Buses & Channels</span>
                                </div>
                                <div class="pyramid-level pyr-storage">
                                    <span class="pyr-name">Secondary Storage (NVMe SSD / HDD Swap)</span>
                                    <span class="pyr-spec">512 GB - 4 TB • 10 µs (SSD) to 10 ms (HDD) • Non-Volatile Block Storage</span>
                                </div>
                            </div>
                        </div>

                        <div class="theory-note-box note-important">
                            <strong>Golden Rule:</strong> High-speed memories must be geographically close to the execution arithmetic logic units (ALUs) and have small capacities to minimize capacitive wire delays and address decode logic time.
                        </div>
                    </div>

                    <div class="theory-card">
                        <div class="theory-card-header">
                            <h3>1.2 The Principle of Locality: Temporal vs Spatial</h3>
                            <span class="pill pill-green">Behavioral Foundation</span>
                        </div>
                        <p>The entire memory hierarchy succeeds in giving software the illusion of a memory system that is as fast as the fastest component (L1) and as large as the largest component (Disk). This success is entirely predicated on the <strong>90/10 Rule</strong>: <em>Programs spend 90% of their execution time inside 10% of their code.</em></p>

                        <div class="theory-grid-2">
                            <div class="theory-sub-card">
                                <h4>⏱️ Temporal Locality (Locality in Time)</h4>
                                <p>If a memory location is referenced once, it is overwhelmingly likely to be referenced again in the near future.</p>
                                <ul>
                                    <li><strong>Program Loops:</strong> Loop counter variables (<code>i</code>, <code>j</code>) and loop condition bounds.</li>
                                    <li><strong>Function Stacks:</strong> Return addresses, local variables, and base frame pointers accessed repeatedly during invocation.</li>
                                    <li><strong>Architectural exploitation:</strong> Once referenced, retain the data in the highest cache level possible (L1).</li>
                                </ul>
                            </div>
                            <div class="theory-sub-card">
                                <h4>📦 Spatial Locality (Locality in Space)</h4>
                                <p>If a memory location is referenced, nearby memory locations are overwhelmingly likely to be referenced in the near future.</p>
                                <ul>
                                    <li><strong>Sequential Code Execution:</strong> Program counters increment consecutively instruction by instruction.</li>
                                    <li><strong>Array Traversals:</strong> Iterating through vectors, structures, and contiguous buffers.</li>
                                    <li><strong>Architectural exploitation:</strong> Instead of fetching a single 4-byte integer from RAM, fetch an entire 32-byte or 64-byte <strong>Cache Line (Block)</strong>.</li>
                                </ul>
                            </div>
                        </div>

                        <div class="code-compare-container">
                            <div class="code-block-box">
                                <span class="code-title">✅ Spatial Locality Friendly (Row-Major Order in C)</span>
                                <pre><code>// Fast: Stride of 1. Accesses adjacent contiguous bytes within the same 64B cache line!
for (int i = 0; i &lt; ROWS; i++) {
    for (int j = 0; j &lt; COLS; j++) {
        sum += matrix[i][j]; // ~98% Cache Hit Rate
    }
}</code></pre>
                            </div>
                            <div class="code-block-box">
                                <span class="code-title">❌ Spatial Locality Catastrophe (Column-Major Order in C)</span>
                                <pre><code>// Slow: Stride of ROWS * sizeof(int). Every access jumps to a brand-new cache line!
for (int j = 0; j &lt; COLS; j++) {
    for (int i = 0; i &lt; ROWS; i++) {
        sum += matrix[i][j]; // ~0% Cache Hit Rate (Massive Cache Thrashing)
    }
}</code></pre>
                            </div>
                        </div>
                    </div>

                    <div class="theory-card">
                        <div class="theory-card-header">
                            <h3>1.3 Average Memory Access Time (AMAT) Mathematics</h3>
                            <span class="pill pill-amber">Quantitative Metric</span>
                        </div>
                        <p><strong>AMAT</strong> is the decisive performance metric for benchmarking memory subsystems. It expresses the average number of nanoseconds or clock cycles required for the CPU to complete an arbitrary memory read or write:</p>

                        <!-- Formula Banner -->
                        <div class="amat-formula-container">
                            <div class="amat-formula-header">The Fundamental AMAT Formula:</div>
                            <div class="amat-eq-box">
                                <span class="eq-term eq-amat">AMAT</span>
                                <span class="eq-op">=</span>
                                <span class="eq-term eq-hit">Hit Time</span>
                                <span class="eq-op">+</span>
                                <span class="eq-bracket">(</span>
                                <span class="eq-term eq-rate">Miss Rate</span>
                                <span class="eq-op">×</span>
                                <span class="eq-term eq-penalty">Miss Penalty</span>
                                <span class="eq-bracket">)</span>
                            </div>
                            <div class="amat-formula-sub">
                                <span class="sub-label">Multi-Level Hierarchy (L1 + L2 + Physical RAM) Expansion:</span>
                                <div class="amat-eq-box-sub">
                                    <span class="eq-term eq-amat">AMAT</span> = 
                                    <span class="eq-term">Hit Time<sub>L1</sub></span> + 
                                    <span class="eq-term">Miss Rate<sub>L1</sub></span> × 
                                    <span class="eq-bracket">[</span>
                                    <span class="eq-term">Hit Time<sub>L2</sub></span> + 
                                    (<span class="eq-term">Miss Rate<sub>L2</sub></span> × <span class="eq-term eq-penalty">Access Time<sub>RAM</sub></span>)
                                    <span class="eq-bracket">]</span>
                                </div>
                            </div>
                        </div>

                        <!-- Worked Numerical Problem -->
                        <div class="amat-problem-card">
                            <div class="problem-header">
                                <span class="problem-tag">📚 Standard University / Exam Problem</span>
                                <h4>Worked Step-by-Step Numerical Example</h4>
                            </div>

                            <div class="problem-params-grid">
                                <div class="param-item">
                                    <span class="param-lbl">L1 Hit Time:</span>
                                    <span class="param-val highlight-green">1.0 ns (1 cycle)</span>
                                </div>
                                <div class="param-item">
                                    <span class="param-lbl">L1 Miss Rate:</span>
                                    <span class="param-val highlight-amber">5.0% (0.05)</span>
                                </div>
                                <div class="param-item">
                                    <span class="param-lbl">L2 Hit Time:</span>
                                    <span class="param-val highlight-cyan">4.0 ns (4 cycles)</span>
                                </div>
                                <div class="param-item">
                                    <span class="param-lbl">L2 Miss Rate:</span>
                                    <span class="param-val highlight-amber">10.0% (0.10)</span>
                                </div>
                                <div class="param-item">
                                    <span class="param-lbl">Main DRAM Latency:</span>
                                    <span class="param-val highlight-red">100.0 ns</span>
                                </div>
                            </div>

                            <div class="problem-steps">
                                <div class="p-step">
                                    <div class="p-step-badge">Step 1</div>
                                    <div class="p-step-content">
                                        <strong>Calculate Effective L1 Miss Penalty (serviced by L2 cache & DRAM):</strong>
                                        <div class="step-math-box">
                                            <code>Penalty<sub>L1</sub> = Hit Time<sub>L2</sub> + (Miss Rate<sub>L2</sub> × Penalty<sub>RAM</sub>)</code>
                                            <div class="step-substitution">
                                                Penalty<sub>L1</sub> = 4.0 ns + (0.10 × 100.0 ns) = 4.0 ns + 10.0 ns = <strong class="highlight-cyan">14.0 ns</strong>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div class="p-step">
                                    <div class="p-step-badge">Step 2</div>
                                    <div class="p-step-content">
                                        <strong>Calculate Overall Average Memory Access Time (AMAT):</strong>
                                        <div class="step-math-box">
                                            <code>AMAT = Hit Time<sub>L1</sub> + (Miss Rate<sub>L1</sub> × Penalty<sub>L1</sub>)</code>
                                            <div class="step-substitution">
                                                AMAT = 1.0 ns + (0.05 × 14.0 ns) = 1.0 ns + 0.70 ns = <strong class="highlight-green" style="font-size: 1.15rem;">1.70 ns</strong>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div class="problem-conclusion">
                                <span class="conclusion-icon">💡</span>
                                <div>
                                    <strong>Architectural Insight:</strong> Although accessing physical RAM requires a sluggish <strong>100 ns</strong>, the dual-level cache design reduces the effective memory latency experienced by CPU instructions to just <strong>1.70 ns</strong>—achieving a <strong class="highlight-gold">58.8× effective speedup</strong>!
                                </div>
                            </div>
                        </div>

                        <!-- Interactive Live AMAT Calculator Widget -->
                        <div class="amat-calc-widget">
                            <div class="widget-header">
                                <div>
                                    <h4>⚡ Interactive Live AMAT Calculator</h4>
                                    <p class="widget-sub">Adjust hardware latencies and miss rates below to see AMAT and speedup recalculate dynamically in real time:</p>
                                </div>
                                <div class="amat-live-badge">
                                    <span class="live-lbl">Calculated AMAT:</span>
                                    <span id="amatLiveResult" class="live-val highlight-green">1.70 ns</span>
                                </div>
                            </div>

                            <div class="amat-inputs-grid">
                                <div class="amat-input-col">
                                    <label>L1 Hit Time (ns):</label>
                                    <input type="number" id="amatL1Hit" class="amat-num-input" value="1.0" min="0.1" max="20" step="0.5" />
                                </div>
                                <div class="amat-input-col">
                                    <label>L1 Miss Rate (%):</label>
                                    <input type="number" id="amatL1Miss" class="amat-num-input" value="5.0" min="0.1" max="100" step="1.0" />
                                </div>
                                <div class="amat-input-col">
                                    <label>L2 Hit Time (ns):</label>
                                    <input type="number" id="amatL2Hit" class="amat-num-input" value="4.0" min="0.5" max="50" step="0.5" />
                                </div>
                                <div class="amat-input-col">
                                    <label>L2 Miss Rate (%):</label>
                                    <input type="number" id="amatL2Miss" class="amat-num-input" value="10.0" min="0.1" max="100" step="1.0" />
                                </div>
                                <div class="amat-input-col">
                                    <label>DRAM Latency (ns):</label>
                                    <input type="number" id="amatRamPenalty" class="amat-num-input" value="100.0" min="10" max="1000" step="5" />
                                </div>
                            </div>

                            <div id="amatLiveSummary" class="amat-summary-bar">
                                <span>L1 Miss Penalty: <strong id="amatLiveL1Penalty" class="highlight-cyan">14.00 ns</strong></span>
                                <span>•</span>
                                <span>Effective Speedup vs Raw RAM: <strong id="amatLiveSpeedup" class="highlight-gold">58.8× faster</strong></span>
                            </div>
                        </div>
                    </div>
                `
            },

            // ==========================================
            // SECTION 2: CACHES & ASSOCIATIVITY
            // ==========================================
            {
                id: 'sec-cache',
                category: 'cache',
                title: '2. CPU Caches, Associativity & Replacement Policies',
                icon: '⚡',
                tags: ['cache', 'associativity', 'direct mapped', 'set associative', 'fully associative', 'tag', 'index', 'offset', '3 c', 'write-back', 'write-through', 'dirty bit'],
                contentHtml: `
                    <div class="theory-card">
                        <div class="theory-card-header">
                            <h3>2.1 Anatomical Dissection of a Memory Address</h3>
                            <span class="pill pill-cyan">Hardware Addressing</span>
                        </div>
                        <p>When the CPU issues a physical memory address to a cache controller, the address bits are split into three disjoint fields: <strong>Tag</strong>, <strong>Set Index</strong>, and <strong>Block (Byte) Offset</strong>.</p>

                        <div class="address-split-visual">
                            <div class="bit-chunk chunk-tag">
                                <span class="chunk-title">TAG BITS</span>
                                <span class="chunk-sub">Identifier / Authenticator</span>
                                <span class="chunk-calc">Tag = 32 - (Index + Offset)</span>
                            </div>
                            <div class="bit-chunk chunk-index">
                                <span class="chunk-title">SET INDEX BITS</span>
                                <span class="chunk-sub">Direct Routing to Set</span>
                                <span class="chunk-calc">Index = log₂(Number of Sets)</span>
                            </div>
                            <div class="bit-chunk chunk-offset">
                                <span class="chunk-title">OFFSET BITS</span>
                                <span class="chunk-sub">Byte within Cache Line</span>
                                <span class="chunk-calc">Offset = log₂(Block Size)</span>
                            </div>
                        </div>

                        <table class="lab-table comparison-table">
                            <thead>
                                <tr>
                                    <th>Address Field</th>
                                    <th>Hardware Purpose</th>
                                    <th>How the Hardware Uses It</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><strong>Block Offset</strong></td>
                                    <td>Identifies which exact byte(s) inside the cached block the CPU instruction wants to read or write.</td>
                                    <td>Passed directly to a multiplexer at the cache line output.</td>
                                </tr>
                                <tr>
                                    <td><strong>Set Index</strong></td>
                                    <td>Directly routes the memory request to a specific row (Set) of the cache silicon.</td>
                                    <td>Decoded into select lines to activate one specific set.</td>
                                </tr>
                                <tr>
                                    <td><strong>Tag</strong></td>
                                    <td>Uniquely proves whether the data line currently occupying the set is actually the address requested.</td>
                                    <td>Compared simultaneously across all ways in the set using high-speed hardware comparators.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="theory-card">
                        <div class="theory-card-header">
                            <h3>2.2 Cache Mapping Taxonomies: Direct, Set-Associative & Fully Associative</h3>
                            <span class="pill pill-green">Hardware Trade-offs</span>
                        </div>
                        <p>The parameter determining how flexible block placement is in a cache is its <strong>Associativity (<em>N</em>)</strong>:</p>

                        <div class="theory-grid-3">
                            <div class="theory-sub-card">
                                <h4>1. Direct-Mapped (<em>N</em> = 1)</h4>
                                <ul>
                                    <li><strong>Rule:</strong> Each memory block maps to <em>exactly one</em> set index: <code>Set = (Block Address) mod (Num Sets)</code>.</li>
                                    <li><strong>Hardware:</strong> Only 1 comparator needed per cache lookup. Extremely fast hit time and low power consumption.</li>
                                    <li><strong>Weakness:</strong> Severe <strong>Conflict Misses</strong> (thrashing) when two active memory locations map to the same set index.</li>
                                </ul>
                            </div>
                            <div class="theory-sub-card">
                                <h4>2. N-Way Set Associative</h4>
                                <ul>
                                    <li><strong>Rule:</strong> Each memory block maps to a set, but can reside in any of the <em>N</em> parallel "ways" within that set.</li>
                                    <li><strong>Hardware:</strong> <em>N</em> parallel comparators test all ways simultaneously.</li>
                                    <li><strong>Industry Standard:</strong> Modern L1 caches typically use 4-way or 8-way; L2/L3 use 8-way, 16-way, or 24-way to strike an optimal balance between hit rate and circuit cycle timing.</li>
                                </ul>
                            </div>
                            <div class="theory-sub-card">
                                <h4>3. Fully Associative</h4>
                                <ul>
                                    <li><strong>Rule:</strong> Any memory block can be stored in <em>any</em> line in the entire cache. There are no index bits (<code>Index = 0</code>).</li>
                                    <li><strong>Hardware:</strong> Requires a comparator for every single line in the cache (Content-Addressable Memory, CAM).</li>
                                    <li><strong>Use Case:</strong> Very small structures where zero conflict misses are critical, such as the <strong>Translation Lookaside Buffer (TLB)</strong>.</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div class="theory-card">
                        <div class="theory-card-header">
                            <h3>2.3 The 3 C's (and 4 C's) of Cache Misses</h3>
                            <span class="pill pill-amber">Mark Hill & Alan Smith Taxonomy</span>
                        </div>
                        <p>Understanding the root cause of every cache miss dictates the exact architectural solution needed to eliminate it:</p>

                        <div class="theory-grid-2">
                            <div class="theory-sub-card">
                                <h4>1. Compulsory (Cold) Misses</h4>
                                <p>Occurs on the very first reference to a memory block. The data has never been inside the cache.</p>
                                <p><strong>Remedy:</strong> Increase Cache Line/Block Size (exploits spatial locality) or implement Hardware Prefetchers.</p>
                            </div>
                            <div class="theory-sub-card">
                                <h4>2. Capacity Misses</h4>
                                <p>Occurs when the working set of the program exceeds the total capacity of the cache, regardless of associativity.</p>
                                <p><strong>Remedy:</strong> Increase overall cache size (e.g. increase L2 from 512KB to 2MB).</p>
                            </div>
                            <div class="theory-sub-card">
                                <h4>3. Conflict (Collision) Misses</h4>
                                <p>Occurs when multiple active memory addresses map to the same set index, kicking each other out even though other sets in the cache are completely empty.</p>
                                <p><strong>Remedy:</strong> Increase Set Associativity (e.g. from 1-way to 2-way or 4-way).</p>
                            </div>
                            <div class="theory-sub-card">
                                <h4>4. Coherence Misses (Multicore Systems)</h4>
                                <p>In symmetric multiprocessing (SMP), when Core A writes to an address, Core B's cached copy is marked invalid by hardware cache coherence protocols (MESI/MOESI).</p>
                                <p><strong>Remedy:</strong> Minimize shared mutable state, padding data structures to prevent <em>False Sharing</em>.</p>
                            </div>
                        </div>
                    </div>

                    <div class="theory-card">
                        <div class="theory-card-header">
                            <h3>2.4 Cache Write Policies & State Flags</h3>
                            <span class="pill pill-purple">Data Integrity</span>
                        </div>
                        <p>When the CPU performs a <code>STORE</code> operation, the memory hierarchy must manage synchronization with downstream levels:</p>

                        <div class="theory-grid-2">
                            <div class="theory-sub-card">
                                <h4>Write-Hit Strategy: Write-Through vs Write-Back</h4>
                                <ul>
                                    <li><strong>Write-Through:</strong> Updates cache and immediately writes to main memory synchronously. Simple design, memory always consistent, but heavily saturates memory bus bandwidth.</li>
                                    <li><strong>Write-Back (Modern Standard):</strong> Writes only to the cache line and sets a <strong>Dirty Bit = 1</strong>. The line is written back to main memory <em>only when evicted</em> to make room for another block. Saves enormous bus traffic.</li>
                                </ul>
                            </div>
                            <div class="theory-sub-card">
                                <h4>Write-Miss Strategy: Allocate vs No-Allocate</h4>
                                <ul>
                                    <li><strong>Write-Allocate:</strong> Fetches the missing block from memory into cache before performing the write. Usually paired with <strong>Write-Back</strong>.</li>
                                    <li><strong>No-Write-Allocate (Write-Around):</strong> Bypasses cache entirely and writes directly to main memory without bringing the block into cache. Usually paired with <strong>Write-Through</strong>.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                `
            },

            // ==========================================
            // SECTION 3: VIRTUAL MEMORY & TLB
            // ==========================================
            {
                id: 'sec-vm',
                category: 'vm',
                title: '3. Virtual Memory, Address Translation & The TLB',
                icon: '🗺️',
                tags: ['virtual memory', 'tlb', 'translation lookaside buffer', 'page table', 'pte', 'mmu', 'vpn', 'pfn', 'protection', 'cr3'],
                contentHtml: `
                    <div class="theory-card">
                        <div class="theory-card-header">
                            <h3>3.1 The Triad of Virtual Memory Objectives</h3>
                            <span class="pill pill-cyan">OS Foundation</span>
                        </div>
                        <p>Virtual Memory is arguably the most brilliant architectural abstraction in computer systems. It was conceived to achieve three foundational goals:</p>
                        <ol class="theory-ol">
                            <li><strong>Process Isolation & Security:</strong> Every user-space process executes within its own private address space (typically <code>0x00000000</code> to <code>0x7FFFFFFFFFFF</code> in 64-bit). A buggy or malicious application cannot inspect or corrupt the memory of another process or the OS kernel.</li>
                            <li><strong>Transparent Address Relocation:</strong> Compilers and linkers generate code assuming a deterministic, standardized base address (e.g. <code>0x00400000</code>), completely agnostic of where physical RAM chips are mapped.</li>
                            <li><strong>Overcommitting Memory (The Virtual Illusion):</strong> A machine with only 8 GB of physical RAM can comfortably run multiple applications demanding 32 GB of total working memory, by treating secondary storage (swap disk) as a seamless extension of RAM.</li>
                        </ol>
                    </div>

                    <div class="theory-card">
                        <div class="theory-card-header">
                            <h3>3.2 Virtual to Physical Address Translation Mechanics</h3>
                            <span class="pill pill-green">Hardware MMU Walk</span>
                        </div>
                        <p>The CPU execution core produces a <strong>Virtual Address</strong>. Before that request touches any memory bus or physical DRAM chip, the hardware <strong>Memory Management Unit (MMU)</strong> translates it into a <strong>Physical Address</strong>:</p>

                        <div class="theory-diagram-box">
                            <div class="vm-translation-flow">
                                <div class="vm-box vm-va">
                                    <span class="vm-lbl">Virtual Address (32-Bit)</span>
                                    <div class="vm-bits">
                                        <div class="v-vpn">Virtual Page Number (VPN)<br><small>Bits [31:12] (20 bits)</small></div>
                                        <div class="v-offset">Page Offset<br><small>Bits [11:0] (12 bits)</small></div>
                                    </div>
                                </div>
                                <div class="vm-arrow">➔ <strong>MMU / Page Table Translation</strong> ➔</div>
                                <div class="vm-box vm-pa">
                                    <span class="vm-lbl">Physical Address (32-Bit)</span>
                                    <div class="vm-bits">
                                        <div class="v-pfn">Physical Frame Number (PFN)<br><small>Bits [31:12] (Frame Number)</small></div>
                                        <div class="v-offset">Page Offset<br><small>Bits [11:0] (Exact Match!)</small></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="theory-note-box note-tip">
                            <strong>Key Invariant:</strong> The lower offset bits (<code>log<sub>2</sub>(Page Size) = 12 bits</code> for 4KB pages) are <strong>never modified</strong> during translation! They describe the exact byte offset within both the virtual page and the physical frame.
                        </div>
                    </div>

                    <div class="theory-card">
                        <div class="theory-card-header">
                            <h3>3.3 The Translation Lookaside Buffer (TLB)</h3>
                            <span class="pill pill-amber">Performance Critical</span>
                        </div>
                        <p>If every memory access required reading the Page Table in physical RAM first, <em>every single program instruction would run at half speed or worse!</em> To prevent this catastrophic penalty, the MMU includes a specialized high-speed associative hardware cache called the <strong>Translation Lookaside Buffer (TLB)</strong>.</p>

                        <div class="theory-grid-2">
                            <div class="theory-sub-card">
                                <h4>⚡ TLB Hit (~0.5 - 1.0 ns)</h4>
                                <p>The MMU checks the requested VPN against all TLB slots in parallel. If a valid entry matches:</p>
                                <ul>
                                    <li>Physical Frame Number (PFN) is extracted in less than 1 cycle.</li>
                                    <li>Concatenated with Page Offset to form Physical Address.</li>
                                    <li>CPU immediately probes L1 Cache. <strong>Zero memory penalty incurred!</strong></li>
                                </ul>
                            </div>
                            <div class="theory-sub-card">
                                <h4>🐢 TLB Miss (~20 - 60 ns)</h4>
                                <p>If the VPN is missing from the TLB, the hardware must perform a <strong>Page Table Walk</strong>:</p>
                                <ul>
                                    <li>Hardware MMU traverses multi-level page tables stored in main RAM (using CPU register <code>CR3</code> as base pointer).</li>
                                    <li>Reads the target Page Table Entry (PTE).</li>
                                    <li>Populates the translation into a TLB slot (evicting an older entry via LRU).</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div class="theory-card">
                        <div class="theory-card-header">
                            <h3>3.4 Anatomy of a Page Table Entry (PTE)</h3>
                            <span class="pill pill-purple">Hardware Control Bits</span>
                        </div>
                        <p>A Page Table Entry does far more than map a page number to a frame number; it encodes hardware access permissions and kernel bookkeeping flags:</p>

                        <table class="lab-table comparison-table">
                            <thead>
                                <tr>
                                    <th>PTE Bit Flag</th>
                                    <th>Bit Name</th>
                                    <th>Architectural Meaning & OS Enforcement</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><strong>P (Bit 0)</strong></td>
                                    <td>Present / Valid Bit</td>
                                    <td><code>1</code> = Page resides in physical RAM.<br><code>0</code> = Page resides on swap disk. Accessing triggers a <strong>Page Fault</strong>!</td>
                                </tr>
                                <tr>
                                    <td><strong>R/W (Bit 1)</strong></td>
                                    <td>Read / Write Flag</td>
                                    <td><code>1</code> = Read-Write allowed.<br><code>0</code> = Read-Only. Writing triggers a Protection Fault (used for Copy-on-Write).</td>
                                </tr>
                                <tr>
                                    <td><strong>U/S (Bit 2)</strong></td>
                                    <td>User / Supervisor</td>
                                    <td><code>1</code> = User-space application access permitted.<br><code>0</code> = Kernel privilege ring (Ring 0) required.</td>
                                </tr>
                                <tr>
                                    <td><strong>A (Bit 5)</strong></td>
                                    <td>Accessed / Reference</td>
                                    <td>Set to <code>1</code> by MMU whenever the page is read or written. Used by the <strong>Clock Page Replacement</strong> algorithm.</td>
                                </tr>
                                <tr>
                                    <td><strong>D (Bit 6)</strong></td>
                                    <td>Dirty Bit</td>
                                    <td>Set to <code>1</code> by MMU whenever the page is written to. If <code>1</code>, page must be written to disk when evicted.</td>
                                </tr>
                                <tr>
                                    <td><strong>NX (Bit 63)</strong></td>
                                    <td>No-Execute (DEP)</td>
                                    <td>Prevents CPU from fetching instructions from stack or heap memory. Primary defense against buffer overflow exploits!</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                `
            },

            // ==========================================
            // SECTION 4: PAGING & PAGE FAULTS
            // ==========================================
            {
                id: 'sec-paging',
                category: 'paging',
                title: '4. Demand Paging, Page Faults & Replacement Algorithms',
                icon: '📄',
                tags: ['page fault', 'demand paging', 'replacement', 'lru', 'fifo', 'clock', 'belady', 'thrashing', 'working set', 'swap'],
                contentHtml: `
                    <div class="theory-card">
                        <div class="theory-card-header">
                            <h3>4.1 The Complete Page Fault Lifecycle</h3>
                            <span class="pill pill-red">Kernel Trap Flow</span>
                        </div>
                        <p>When an application references an address whose Page Table Entry has <strong>Present = 0</strong>, the CPU cannot complete the instruction. It executes a complete hardware/software lifecycle:</p>

                        <div class="step-lifecycle-list">
                            <div class="step-life-item">
                                <div class="step-life-num">1</div>
                                <div class="step-life-body">
                                    <strong>Hardware Trap:</strong> The MMU asserts a Page Fault Interrupt (x86 Interrupt <code>0x0E</code>). The CPU freezes user process execution, stores the faulting address in register <code>CR2</code>, pushes register state, and switches to <strong>Kernel Mode (Ring 0)</strong>.
                                </div>
                            </div>
                            <div class="step-life-item">
                                <div class="step-life-num">2</div>
                                <div class="step-life-body">
                                    <strong>Validity Check:</strong> The OS kernel page fault handler inspects whether the address is valid within the process's allocated virtual memory areas (VMA). If invalid, the OS delivers a <code>SIGSEGV</code> (Segmentation Fault).
                                </div>
                            </div>
                            <div class="step-life-item">
                                <div class="step-life-num">3</div>
                                <div class="step-life-body">
                                    <strong>Frame Allocation:</strong> The OS searches for a free physical memory frame. If physical RAM is full, the OS runs a <strong>Page Replacement Algorithm</strong> (e.g. Clock or LRU) to choose a victim frame to evict.
                                </div>
                            </div>
                            <div class="step-life-item">
                                <div class="step-life-num">4</div>
                                <div class="step-life-body">
                                    <strong>Victim Eviction (If Dirty):</strong> If the victim frame's Dirty bit is <code>1</code>, its contents must be flushed to the swap disk sector. If clean, the frame can be overwritten immediately.
                                </div>
                            </div>
                            <div class="step-life-item">
                                <div class="step-life-num">5</div>
                                <div class="step-life-body">
                                    <strong>Disk Read I/O:</strong> The OS issues a DMA read request to fetch the missing page from swap storage into the newly freed physical frame (~5-10 ms latency). The OS schedules another process to run while waiting.
                                </div>
                            </div>
                            <div class="step-life-item">
                                <div class="step-life-num">6</div>
                                <div class="step-life-body">
                                    <strong>PTE & TLB Update:</strong> Disk I/O completes. OS updates the page table entry: sets physical frame pointer, sets <strong>Present = 1</strong>, clears Dirty bit, and sets Accessed bit.
                                </div>
                            </div>
                            <div class="step-life-item">
                                <div class="step-life-num">7</div>
                                <div class="step-life-body">
                                    <strong>Instruction Restart:</strong> The OS restores the faulting application's CPU registers and re-executes the exact instruction that previously faulted. This time, the MMU finds Present = 1 and succeeds instantly!
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="theory-card">
                        <div class="theory-card-header">
                            <h3>4.2 Page Replacement Algorithms Compared</h3>
                            <span class="pill pill-green">Algorithm Analysis</span>
                        </div>

                        <table class="lab-table comparison-table">
                            <thead>
                                <tr>
                                    <th>Algorithm</th>
                                    <th>Operational Logic</th>
                                    <th>Hardware Complexity</th>
                                    <th>Practical Verdict</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><strong>Optimal (OPT / MIN)</strong></td>
                                    <td>Replace the page that will not be used for the longest period of time in the future.</td>
                                    <td>Impossible in practice (requires clairvoyant future knowledge).</td>
                                    <td>Theoretical benchmark used to evaluate other algorithms.</td>
                                </tr>
                                <tr>
                                    <td><strong>Least Recently Used (LRU)</strong></td>
                                    <td>Replace the page that has not been referenced for the longest duration of time.</td>
                                    <td>Very high. Requires timestamps on every access or dynamically maintaining a double-linked list on every memory cycle.</td>
                                    <td>Ideal approximation, but rarely implemented in pure hardware due to high overhead.</td>
                                </tr>
                                <tr>
                                    <td><strong>Clock (Second Chance)</strong></td>
                                    <td>Frames arranged in a circular buffer. A "clock hand" inspects the Reference bit: if <code>1</code>, clear to <code>0</code> and advance; if <code>0</code>, select as victim!</td>
                                    <td>Extremely low. Needs only 1 bit per page table entry (the Reference / Accessed bit).</td>
                                    <td><strong>Industry Standard:</strong> Used by Linux, Windows, and macOS virtual memory subsystems.</td>
                                </tr>
                                <tr>
                                    <td><strong>FIFO (First In First Out)</strong></td>
                                    <td>Evicts the oldest page resident in physical memory, regardless of how frequently it is accessed.</td>
                                    <td>Trivial (FIFO queue).</td>
                                    <td>Poor performance. Suffers from <strong>Bélády's Anomaly</strong>!</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="theory-card">
                        <div class="theory-card-header">
                            <h3>4.3 Bélády's Anomaly & Thrashing</h3>
                            <span class="pill pill-amber">Classic Phenomena</span>
                        </div>

                        <div class="theory-grid-2">
                            <div class="theory-sub-card">
                                <h4>🚨 Bélády's Anomaly</h4>
                                <p>In 1969, Hungarian computer scientist László Bélády proved that under FIFO page replacement, <strong>increasing the number of physical page frames can paradoxically INCREASE the total number of page faults!</strong></p>
                                <p><strong>Why it happens:</strong> FIFO is not a "stack algorithm." The set of pages in a 3-frame cache is not always a subset of the pages in a 4-frame cache. Algorithms like LRU and OPT are stack algorithms and are mathematically guaranteed to never experience Bélády's anomaly.</p>
                            </div>
                            <div class="theory-sub-card">
                                <h4>🌪️ Thrashing & The Working Set</h4>
                                <p><strong>Thrashing</strong> occurs when total active working set size of all processes exceeds physical RAM capacity. The system spends virtually 100% of its CPU time swapping pages in and out of disk, while application progress drops to zero.</p>
                                <ul>
                                    <li><strong>The Working Set (<em>W(t, Δ)</em>):</strong> The set of pages referenced by a process in the most recent time window Δ.</li>
                                    <li><strong>OS Defense:</strong> If <code>∑ W<sub>i</sub> &gt; Total RAM</code>, the OS must temporarily suspend (swap out) an entire process to disk until memory pressure stabilizes.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                `
            },

            // ==========================================
            // SECTION 5: ALLOCATION & FRAGMENTATION
            // ==========================================
            {
                id: 'sec-allocation',
                category: 'allocation',
                title: '5. Dynamic Memory Allocation & Fragmentation',
                icon: '🧩',
                tags: ['allocation', 'fragmentation', 'external', 'internal', 'compaction', 'malloc', 'free', 'first fit', 'best fit', 'worst fit', 'buddy allocator'],
                contentHtml: `
                    <div class="theory-card">
                        <div class="theory-card-header">
                            <h3>5.1 External Fragmentation vs Internal Fragmentation</h3>
                            <span class="pill pill-cyan">Memory Inefficiencies</span>
                        </div>
                        <p>Any system responsible for allocating memory blocks must battle two distinct forms of memory waste:</p>

                        <div class="theory-grid-2">
                            <div class="theory-sub-card highlight-fault-box">
                                <h4>🧩 External Fragmentation</h4>
                                <p>Occurs when total free memory is large enough to satisfy an allocation request, but the memory is fragmented into disjoint, non-contiguous holes.</p>
                                <ul>
                                    <li><strong>Cause:</strong> Variable-sized memory allocations paired with dynamic deallocations over time.</li>
                                    <li><strong>Consequence:</strong> An allocation request for 200 KB fails even though 400 KB of total free RAM exists in the system!</li>
                                    <li><strong>Remedies:</strong>
                                        <ol>
                                            <li><strong>Compaction (Defragmentation):</strong> Physically slide all allocated blocks down to coalesce holes into one large contiguous free block (expensive CPU overhead).</li>
                                            <li><strong>Paging:</strong> Break memory into uniform fixed-size pages (4KB), completely eliminating external fragmentation!</li>
                                        </ol>
                                    </li>
                                </ul>
                            </div>
                            <div class="theory-sub-card">
                                <h4>📦 Internal Fragmentation</h4>
                                <p>Occurs when memory is allocated in fixed-size blocks, and the process receives slightly more memory than it actually requested.</p>
                                <ul>
                                    <li><strong>Cause:</strong> Block quantization (e.g. allocating memory in multiples of 4 KB pages or 16-byte aligned heap chunks).</li>
                                    <li><strong>Consequence:</strong> If a process requests 5,000 bytes, the OS allocates two 4,096-byte pages (8,192 bytes total). The remaining 3,192 bytes are trapped inside the second page and unusable by other processes.</li>
                                    <li><strong>Average Loss:</strong> Approximately half a page (<code>Page Size / 2</code>) per allocated region.</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div class="theory-card">
                        <div class="theory-card-header">
                            <h3>5.2 Dynamic Memory Fit Strategies Compared</h3>
                            <span class="pill pill-green">Free List Algorithms</span>
                        </div>
                        <p>When an application calls <code>malloc()</code> or the OS manages variable partitions, a free list algorithm selects a hole:</p>

                        <table class="lab-table comparison-table">
                            <thead>
                                <tr>
                                    <th>Algorithm</th>
                                    <th>Selection Mechanism</th>
                                    <th>Advantages</th>
                                    <th>Disadvantages & Characteristics</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><strong>First-Fit</strong></td>
                                    <td>Scan free list from the beginning; allocate the <em>very first hole</em> that is big enough.</td>
                                    <td>Fastest search time. Low CPU overhead.</td>
                                    <td>Tends to clutter the beginning of the memory space with tiny leftover fragments.</td>
                                </tr>
                                <tr>
                                    <td><strong>Best-Fit</strong></td>
                                    <td>Scan the <em>entire list</em>; allocate the <em>smallest hole</em> that is big enough to satisfy the request.</td>
                                    <td>Minimizes wasted leftover space in the short term.</td>
                                    <td>Produces catastrophic external fragmentation by leaving tiny, useless slivers (e.g., 4-byte holes) scattered everywhere.</td>
                                </tr>
                                <tr>
                                    <td><strong>Worst-Fit</strong></td>
                                    <td>Scan the entire list; allocate the <em>largest available hole</em>.</td>
                                    <td>Leaves the largest possible leftover fragment, which may be large enough to host a future process.</td>
                                    <td>Slow search; quickly breaks down giant contiguous blocks needed by large processes.</td>
                                </tr>
                                <tr>
                                    <td><strong>Next-Fit</strong></td>
                                    <td>Similar to First-Fit, but begins scanning from the point of the previous allocation rather than the start.</td>
                                    <td>Distributes allocations more evenly across memory space.</td>
                                    <td>Studies show it often produces worse overall fragmentation than First-Fit.</td>
                                </tr>
                                <tr>
                                    <td><strong>Buddy Allocator</strong></td>
                                    <td>Rounds allocation up to power of 2 (<code>2<sup>k</sup></code>). Splits memory recursively in halves ("buddies"). On deallocate, merges adjacent buddies instantly!</td>
                                    <td>Extremely fast coalescence <code>O(1)</code>. Minimal external fragmentation.</td>
                                    <td>Suffers from moderate internal fragmentation due to power-of-2 rounding. Used in the Linux kernel physical frame allocator.</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                `
            },

            // ==========================================
            // SECTION 6: PHYSICAL HARDWARE & SILICON
            // ==========================================
            {
                id: 'sec-hardware',
                category: 'hardware',
                title: '6. Physical Silicon Hardware: SRAM, DRAM & ROM Types',
                icon: '🔬',
                tags: ['sram', 'dram', 'rom', 'mrom', 'prom', 'eprom', 'eeprom', 'flash', 'nor', 'nand', 'hardware', 'transistor', 'capacitor', 'refresh', 'interleaving', 'dma', 'nvme', 'bus'],
                contentHtml: `
                    <div class="theory-card">
                        <div class="theory-card-header">
                            <h3>6.1 SRAM vs DRAM: The Silicon Transistor Duel</h3>
                            <span class="pill pill-cyan">Solid State Physics</span>
                        </div>
                        <p>At the silicon level, volatile semiconductor memory is split into two fundamentally different physical designs:</p>

                        <div class="theory-grid-2">
                            <div class="theory-sub-card">
                                <h4>⚡ Static RAM (SRAM) - Speed Without Compromise</h4>
                                <ul>
                                    <li><strong>Cell Structure:</strong> 6 Transistors (6T) forming a bistable cross-coupled inverter latch.</li>
                                    <li><strong>Operation:</strong> Holds its state indefinitely as long as DC power is supplied. <strong>No refresh cycles needed!</strong></li>
                                    <li><strong>Speed:</strong> Ultra-fast access latencies (~0.5 - 2 ns).</li>
                                    <li><strong>Trade-off:</strong> Requires 6 transistors per single bit, making it bulky, hot, low-density, and very expensive.</li>
                                    <li><strong>Usage:</strong> CPU Registers, L1/L2/L3 Caches.</li>
                                </ul>
                            </div>
                            <div class="theory-sub-card">
                                <h4>🔋 Dynamic RAM (DRAM) - Extreme Density</h4>
                                <ul>
                                    <li><strong>Cell Structure:</strong> 1 Transistor + 1 Tiny Capacitor (1T-1C cell).</li>
                                    <li><strong>Operation:</strong> Stores bit as microscopic electrical charge ($Q$) in a capacitor. Because capacitors naturally leak electrons through the transistor gate oxide, DRAM must be <strong>periodically refreshed</strong> (read and recharged every ~64 milliseconds).</li>
                                    <li><strong>Destructive Read:</strong> Reading a DRAM cell drains the capacitor; the memory controller must immediately write the data back!</li>
                                    <li><strong>Usage:</strong> Main System Memory (DDR4 / DDR5 DIMMs).</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div class="theory-card">
                        <div class="theory-card-header">
                            <h3>6.2 Memory Channels, Interleaving & Direct Memory Access (DMA)</h3>
                            <span class="pill pill-green">Bus Architecture</span>
                        </div>

                        <div class="theory-grid-2">
                            <div class="theory-sub-card">
                                <h4>Dual-Channel Memory Interleaving</h4>
                                <p>Instead of routing all memory requests down a single 64-bit wide bus, dual-channel controllers operate two independent 64-bit channels simultaneously (128-bit aggregate bus width).</p>
                                <p><strong>Memory Interleaving:</strong> Consecutive addresses alternate between Channel A and Channel B (even addresses on A, odd addresses on B). When streaming data, the CPU can read from Channel B while Channel A is still precharging, effectively doubling sustained memory bandwidth!</p>
                            </div>
                            <div class="theory-sub-card">
                                <h4>Direct Memory Access (DMA)</h4>
                                <p>Without DMA, every single byte read from a disk or network card must pass directly through CPU registers (programmed I/O, PIO), wasting millions of CPU clock cycles on simple byte copies.</p>
                                <p><strong>DMA Controller:</strong> High-speed peripherals are granted permission to read and write directly to physical RAM over the PCIe bus without CPU intervention. The CPU merely initiates the transfer vector and receives a hardware interrupt when the multi-megabyte block transfer finishes!</p>
                            </div>
                        </div>
                    </div>

                    <div class="theory-card">
                        <div class="theory-card-header">
                            <h3>6.3 Non-Volatile Read-Only Memory (ROM): Types & Architectural Comparison</h3>
                            <span class="pill pill-amber">Non-Volatile Silicon</span>
                        </div>
                        <p>Unlike volatile RAM, <strong>Read-Only Memory (ROM)</strong> retains stored data permanently even when electrical power is completely removed ($V_{cc} = 0$). Over decades of semiconductor evolution, ROM evolved through five major architectural generations:</p>

                        <div class="theory-grid-3">
                            <div class="theory-sub-card">
                                <h4>1. Masked ROM (MROM)</h4>
                                <p>Permanently encoded during factory fabrication using a physical photolithography metallization mask.</p>
                                <ul>
                                    <li><strong>Mechanism:</strong> Hardwired diodes/transistors at silicon intersections.</li>
                                    <li><strong>Mutability:</strong> Completely immutable. Cannot be reprogrammed under any circumstances.</li>
                                    <li><strong>Economics:</strong> High initial setup mask cost (NRE), but virtually zero cost per chip in ultra-high volumes (millions of units).</li>
                                </ul>
                            </div>

                            <div class="theory-sub-card">
                                <h4>2. PROM (Programmable ROM)</h4>
                                <p>Shipped blank from the factory with all bits initialized to <code>1</code> via microscopic fusible links (nichrome or polysilicon).</p>
                                <ul>
                                    <li><strong>Programming (OTP):</strong> One-Time Programmable using a device programmer that applies high-voltage electrical pulses (<em>V</em><sub>pp</sub> ≈ 12.5V) to physically vaporize selected fuses (1 → 0).</li>
                                    <li><strong>Limitation:</strong> Once a fuse is blown, it can never be repaired. Irreversible.</li>
                                </ul>
                            </div>

                            <div class="theory-sub-card">
                                <h4>3. EPROM (Erasable PROM)</h4>
                                <p>Uses <strong>Floating-Gate Avalanche Injection (FAMOS)</strong> transistors. Electrons are trapped on an insulated floating gate.</p>
                                <ul>
                                    <li><strong>Iconic Feature:</strong> Distinctive transparent <strong>Quartz Crystal Window</strong> on top of the ceramic DIP package.</li>
                                    <li><strong>Erasure:</strong> Exposing the quartz window to <strong>UV-C light (254 nm)</strong> for ~20 minutes excites trapped electrons to escape, resetting all bits to <code>1</code> (<code>0xFF</code>). Must be removed from the PCB to erase!</li>
                                </ul>
                            </div>

                            <div class="theory-sub-card">
                                <h4>4. EEPROM (Electrically Erasable)</h4>
                                <p>Employs <strong>Fowler-Nordheim Quantum Tunneling</strong> through a thinner gate oxide layer (~10 nm).</p>
                                <ul>
                                    <li><strong>In-Circuit Reprogrammability:</strong> Can be erased and rewritten byte-by-byte directly on the motherboard without removal or UV lamps.</li>
                                    <li><strong>Endurance:</strong> Typically withstands 100,000 to 1,000,000 Program/Erase (P/E) cycles before dielectric oxide wear causes trap breakdown.</li>
                                </ul>
                            </div>

                            <div class="theory-sub-card">
                                <h4>5. Flash: NOR Flash</h4>
                                <p>Memory cells arranged in parallel, resembling a NOR logic gate.</p>
                                <ul>
                                    <li><strong>Access:</strong> True random-access byte reading with dedicated address bus. Supports <strong>Execute-In-Place (XIP)</strong>.</li>
                                    <li><strong>Trade-off:</strong> Slower erase/write cycles and lower density than NAND.</li>
                                    <li><strong>Application:</strong> Motherboard UEFI/BIOS chips, router firmware storage.</li>
                                </ul>
                            </div>

                            <div class="theory-sub-card">
                                <h4>6. Flash: NAND Flash</h4>
                                <p>Memory cells connected in series strings, resembling a NAND gate.</p>
                                <ul>
                                    <li><strong>Access:</strong> Serial page-access (no random byte reads). Erased in large blocks (4KB - 128KB).</li>
                                    <li><strong>Superpower:</strong> Extremely high cell density, tiny footprint, ultra-low cost per gigabyte, and blistering block erase speeds.</li>
                                    <li><strong>Application:</strong> NVMe SSDs, smartphones, USB flash drives, SD cards.</li>
                                </ul>
                            </div>
                        </div>

                        <div class="theory-card-header" style="margin-top: 1rem;">
                            <h4>📊 Master Comparison Matrix: Semiconductor ROM Technologies</h4>
                            <span class="pill pill-cyan">Comprehensive Specification</span>
                        </div>

                        <div style="overflow-x: auto;">
                            <table class="lab-table comparison-table">
                                <thead>
                                    <tr>
                                        <th>Attribute</th>
                                        <th>Masked ROM (MROM)</th>
                                        <th>PROM</th>
                                        <th>EPROM</th>
                                        <th>EEPROM</th>
                                        <th>Flash Memory (NOR / NAND)</th>
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
                                        <td><strong>Programmability</strong></td>
                                        <td>Factory Mask Only</td>
                                        <td>One-Time (OTP) by user</td>
                                        <td>Multiple Times (UV erased)</td>
                                        <td>In-Circuit Rewritable</td>
                                        <td>In-Circuit Block-Rewritable</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Programming Method</strong></td>
                                        <td>Photolithography metallization mask</td>
                                        <td>High voltage pulses blow fusible links</td>
                                        <td>Hot-electron avalanche injection</td>
                                        <td>Fowler-Nordheim electron tunneling</td>
                                        <td>Fowler-Nordheim / Channel hot electrons</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Erasure Technique</strong></td>
                                        <td>❌ Impossible (Silicon wires)</td>
                                        <td>❌ Impossible (Blown fuses)</td>
                                        <td>☀️ UV-C light through quartz window (~20 mins)</td>
                                        <td>⚡ Electrical voltage pulse in-circuit</td>
                                        <td>⚡ Electrical sector/block erase in-circuit</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Erasure Granularity</strong></td>
                                        <td>None (Immutable)</td>
                                        <td>None (Irreversible)</td>
                                        <td>Entire chip simultaneous wipe (0xFF)</td>
                                        <td>Single Byte</td>
                                        <td>Entire Block / Sector (4KB to 128KB)</td>
                                    </tr>
                                    <tr>
                                        <td><strong>In-Circuit Modifiable?</strong></td>
                                        <td>❌ No</td>
                                        <td>❌ No (Requires standalone programmer)</td>
                                        <td>❌ No (Must be removed & placed under UV lamp)</td>
                                        <td>✅ Yes (Directly on motherboard)</td>
                                        <td>✅ Yes (SPI bus firmware updates)</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Write Endurance</strong></td>
                                        <td>Infinite Reads (0 Writes)</td>
                                        <td>1 Cycle (Permanent)</td>
                                        <td>~100 - 1,000 Cycles</td>
                                        <td>~100,000 - 1,000,000 Cycles</td>
                                        <td>~3,000 - 100,000 Cycles (Needs Wear Leveling)</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Read Mechanism</strong></td>
                                        <td>Random access (byte)</td>
                                        <td>Random access (byte)</td>
                                        <td>Random access (byte)</td>
                                        <td>Random access (byte)</td>
                                        <td>NOR: Random Access (Byte)<br>NAND: Page/Block Serial Access</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Typical Modern Usage</strong></td>
                                        <td>High-volume embedded ASICs, CD-ROMs</td>
                                        <td>Calibration tables, military guidance</td>
                                        <td>Vintage arcade machines, 1980s BIOS</td>
                                        <td>Motherboard CMOS NVRAM, network MAC IDs</td>
                                        <td>NOR: UEFI BIOS, routers<br>NAND: SSDs, smartphones, USB storage</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <div class="theory-note-box note-important">
                            <strong>Why Computers Fundamentally Need ROM at Cold Boot:</strong> When an x86 computer is first powered on, physical DRAM contains completely random, chaotic voltages and its memory refresh controller is offline. The CPU Program Counter is hardwired in silicon to immediately jump to the <strong>Reset Vector (<code>0xFFFFFFF0</code>)</strong>, which directly addresses non-volatile ROM/Flash. From there, ROM firmware executes the Power-On Self Test (POST), initializes the DRAM controller, loads the Master Boot Record (MBR) from disk into RAM at <code>0x7C00</code>, and hands execution over to the OS kernel!
                        </div>
                    </div>
                `
            }
        ];

        // Filter sections based on category and search query
        const filtered = sections.filter(sec => {
            const matchesCategory = (cat === 'all' || sec.category === cat);
            if (!matchesCategory) return false;

            if (!query) return true;

            const inTitle = sec.title.toLowerCase().includes(query);
            const inTags = sec.tags.some(t => t.includes(query));
            const inContent = sec.contentHtml.toLowerCase().includes(query);
            return inTitle || inTags || inContent;
        });

        if (filtered.length === 0) {
            return `
                <div class="theory-empty-card">
                    <div class="empty-icon">🔍</div>
                    <h3>No matching memory concepts found</h3>
                    <p>No theory topics matched your search for <code>"${this.searchQuery}"</code> in the selected category.</p>
                    <button id="btnResetTheoryFilter" class="lab-btn btn-primary">Reset Filters & Show All</button>
                </div>
            `;
        }

        return filtered.map(sec => `
            <section class="theory-section-block" id="${sec.id}">
                <div class="section-title-bar">
                    <span class="sec-icon">${sec.icon}</span>
                    <h2>${sec.title}</h2>
                </div>
                <div class="section-cards-grid">
                    ${sec.contentHtml}
                </div>
            </section>
        `).join('');
    }

    bindEvents() {
        // Category pill clicks
        document.querySelectorAll('.cat-pill').forEach(btn => {
            btn.addEventListener('click', () => {
                this.activeCategory = btn.getAttribute('data-cat');
                this.render('theoryContainer');
            });
        });

        // Search input
        const searchInput = document.getElementById('theorySearchInput');
        searchInput?.addEventListener('input', (e) => {
            this.searchQuery = e.target.value;
            const list = document.getElementById('theorySectionsList');
            if (list) {
                list.innerHTML = this.generateSectionsHtml();
                this.bindSectionEvents();
            }
        });

        // Clear search button
        const btnClear = document.getElementById('btnClearTheorySearch');
        btnClear?.addEventListener('click', () => {
            this.searchQuery = '';
            this.render('theoryContainer');
        });

        // Reset filter button if empty
        const btnReset = document.getElementById('btnResetTheoryFilter');
        btnReset?.addEventListener('click', () => {
            this.activeCategory = 'all';
            this.searchQuery = '';
            this.render('theoryContainer');
        });

        this.bindSectionEvents();
    }

    bindSectionEvents() {
        const btnReset = document.getElementById('btnResetTheoryFilter');
        btnReset?.addEventListener('click', () => {
            this.activeCategory = 'all';
            this.searchQuery = '';
            this.render('theoryContainer');
        });

        // Live AMAT Calculator input listeners
        const amatInputs = ['amatL1Hit', 'amatL1Miss', 'amatL2Hit', 'amatL2Miss', 'amatRamPenalty'];
        amatInputs.forEach(id => {
            document.getElementById(id)?.addEventListener('input', () => {
                this.updateAmatCalculation();
            });
        });
    }

    updateAmatCalculation() {
        const l1Hit = parseFloat(document.getElementById('amatL1Hit')?.value || 1.0);
        const l1MissPct = parseFloat(document.getElementById('amatL1Miss')?.value || 5.0);
        const l2Hit = parseFloat(document.getElementById('amatL2Hit')?.value || 4.0);
        const l2MissPct = parseFloat(document.getElementById('amatL2Miss')?.value || 10.0);
        const ramPenalty = parseFloat(document.getElementById('amatRamPenalty')?.value || 100.0);

        if (isNaN(l1Hit) || isNaN(l1MissPct) || isNaN(l2Hit) || isNaN(l2MissPct) || isNaN(ramPenalty)) return;

        const l1Miss = l1MissPct / 100.0;
        const l2Miss = l2MissPct / 100.0;

        const l1Penalty = l2Hit + (l2Miss * ramPenalty);
        const amat = l1Hit + (l1Miss * l1Penalty);
        const speedup = (ramPenalty / amat).toFixed(1);

        const resEl = document.getElementById('amatLiveResult');
        const penEl = document.getElementById('amatLiveL1Penalty');
        const spdEl = document.getElementById('amatLiveSpeedup');

        if (resEl) resEl.textContent = amat.toFixed(2) + ' ns';
        if (penEl) penEl.textContent = l1Penalty.toFixed(2) + ' ns';
        if (spdEl) spdEl.textContent = speedup + '× faster';
    }
}


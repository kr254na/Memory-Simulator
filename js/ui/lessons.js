/**
 * Guided Interactive Lessons & Scenarios
 * Hands-on guided walkthroughs that demonstrate classic COA and OS memory concepts live.
 */

export class LessonsManager {
    constructor(memorySystem, app) {
        this.sys = memorySystem;
        this.app = app;
    }

    renderLessons(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        container.innerHTML = `
            <div class="lessons-container">
                <div class="lessons-header">
                    <h3>🎓 Interactive Memory Masterclass Curriculum</h3>
                    <p>Select a guided interactive scenario below to experience fundamental OS & COA memory phenomena firsthand with real hardware reactions.</p>
                </div>

                <div class="lessons-grid">
                    <!-- Lesson 1 -->
                    <div class="lesson-card">
                        <div class="lesson-num">LESSON 01</div>
                        <h4 class="lesson-title">The Magic of Spatial Locality</h4>
                        <p class="lesson-desc">When a CPU reads an integer from array index <code>[0]</code>, the hardware brings an entire 32-byte cache line (8 integers) into L1. Watch subsequent elements hit instantly at 1 ns without touching RAM!</p>
                        <div class="lesson-action-box">
                            <button id="btnLessonLocality" class="lab-btn btn-primary">▶ Run Sequential Array Stride</button>
                        </div>
                    </div>

                    <!-- Lesson 2 -->
                    <div class="lesson-card">
                        <div class="lesson-num">LESSON 02</div>
                        <h4 class="lesson-title">Cache Thrashing & Conflict Misses</h4>
                        <p class="lesson-desc">In Direct-Mapped caches, two alternating memory addresses mapping to the same Set Index constantly kick each other out, dropping hit rate to 0%! Learn why Set Associativity was invented.</p>
                        <div class="lesson-action-box">
                            <button id="btnLessonThrashing" class="lab-btn btn-warning">▶ Trigger Direct-Mapped Thrashing</button>
                        </div>
                    </div>

                    <!-- Lesson 3 -->
                    <div class="lesson-card">
                        <div class="lesson-num">LESSON 03</div>
                        <h4 class="lesson-title">The Page Fault & Disk Trap Crisis</h4>
                        <p class="lesson-desc">Access memory located outside of physical RAM. Watch the CPU trap into kernel mode, wait ~10 milliseconds (the equivalent of months in human scale), and swap a page from disk.</p>
                        <div class="lesson-action-box">
                            <button id="btnLessonPageFault" class="lab-btn btn-danger">▶ Trigger Heavy Page Fault Swapping</button>
                        </div>
                    </div>

                    <!-- Lesson 4 -->
                    <div class="lesson-card">
                        <div class="lesson-num">LESSON 04</div>
                        <h4 class="lesson-title">External Fragmentation & Compaction</h4>
                        <p class="lesson-desc">Witness a real memory allocator failure where the system has 350 KB of total free memory, but cannot allocate a 200 KB process because the free space is fragmented. Then run Compaction to fix it!</p>
                        <div class="lesson-action-box">
                            <button id="btnLessonFragmentation" class="lab-btn btn-success">▶ Run Fragmentation Breakdown</button>
                        </div>
                    </div>

                    <!-- Lesson 5 -->
                    <div class="lesson-card">
                        <div class="lesson-num">LESSON 05</div>
                        <h4 class="lesson-title">Belady's Anomaly (FIFO Paging)</h4>
                        <p class="lesson-desc">In 1969, László Bélády proved that under the FIFO replacement algorithm, giving a process MORE physical page frames can paradoxically INCREASE the total number of page faults!</p>
                        <div class="lesson-action-box">
                            <button id="btnLessonBelady" class="lab-btn btn-purple">▶ Demonstrate Belady's Anomaly</button>
                        </div>
                    </div>
                </div>

                <div id="lessonExecutionResult" class="lesson-feedback-box">
                    <div class="feedback-placeholder">Select a scenario above to start an interactive demonstration.</div>
                </div>
            </div>
        `;

        this.bindEvents();
    }

    bindEvents() {
        const feedback = document.getElementById('lessonExecutionResult');

        // Lesson 1: Locality
        document.getElementById('btnLessonLocality')?.addEventListener('click', () => {
            this.sys.reset();
            const baseAddr = 0x00401000;
            const strideResults = [];
            // Access 8 consecutive 4-byte integers in the same 32-byte cache line
            for (let i = 0; i < 8; i++) {
                strideResults.push(this.sys.executeAccess(baseAddr + (i * 4), false));
            }
            this.app.refreshAllViews(strideResults[strideResults.length - 1]);

            if (feedback) {
                feedback.innerHTML = `
                    <div class="feedback-card">
                        <h4>🎉 Lesson 1 Complete: Spatial Locality in Action</h4>
                        <p>We read 8 consecutive integers from address <code>0x00401000</code> to <code>0x0040101C</code>.</p>
                        <ul>
                            <li><strong>Access #1:</strong> Compulsory Miss! Entire 32-byte block fetched from RAM into L1.</li>
                            <li><strong>Accesses #2 through #8:</strong> <span class="highlight-green">7 CONSECUTIVE L1 CACHE HITS (87.5% Hit Rate)!</span></li>
                        </ul>
                        <p>Because the hardware fetched neighboring bytes together, 7 out of 8 CPU operations took only <strong>1 nanosecond</strong> instead of 100 ns!</p>
                    </div>
                `;
            }
        });

        // Lesson 2: Thrashing
        document.getElementById('btnLessonThrashing')?.addEventListener('click', () => {
            // Configure L1 as Direct-Mapped (ways = 1)
            this.sys.l1.ways = 1;
            this.sys.l1.initializeGeometry();
            this.sys.l1.reset();

            // Two addresses that have different tags but map to the EXACT SAME set index (e.g. Set 0)
            const addrA = 0x00400000; // Maps to Set 0
            const addrB = 0x00401000; // Maps to Set 0 (different tag!)

            let lastRes;
            for (let i = 0; i < 6; i++) {
                this.sys.executeAccess(addrA);
                lastRes = this.sys.executeAccess(addrB);
            }
            this.app.refreshAllViews(lastRes);

            if (feedback) {
                feedback.innerHTML = `
                    <div class="feedback-card highlight-fault-box">
                        <h4>⚠️ Lesson 2 Complete: The "Ping-Pong" Conflict Disaster</h4>
                        <p>Addresses <code>0x00400000</code> and <code>0x00401000</code> both calculate to <strong>Set Index 0</strong>.</p>
                        <p>Because the cache was configured as <strong>Direct-Mapped (1 line per set)</strong>, Address A evicted Address B, and Address B immediately evicted Address A on every clock cycle!</p>
                        <p><strong>Result:</strong> 12 Accesses, <strong>0 Hits, 12 Conflict Misses (0% Hit Rate)</strong>! Switch L1 to <strong>2-Way Set Associative</strong> in the Cache Lab to eliminate this thrashing completely.</p>
                    </div>
                `;
            }
        });

        // Lesson 3: Page Fault
        document.getElementById('btnLessonPageFault')?.addEventListener('click', () => {
            // Access virtual pages 10, 11, 12, 13 (unmapped pages)
            let lastRes;
            [0x000A0000, 0x000B0000, 0x000C0000].forEach(addr => {
                lastRes = this.sys.executeAccess(addr);
            });
            this.app.refreshAllViews(lastRes);

            if (feedback) {
                feedback.innerHTML = `
                    <div class="feedback-card highlight-fault-box">
                        <h4>🚨 Lesson 3 Complete: Page Fault & Disk Swapping</h4>
                        <p>The CPU requested pages that were currently marked <strong>Valid = 0</strong> (residing on swap space).</p>
                        <p><strong>What the OS just did:</strong></p>
                        <ul>
                            <li>Hardware threw an interrupt, halting user application execution.</li>
                            <li>OS invoked page replacement (Clock algorithm) and evicted older frames.</li>
                            <li>Swapped requested pages from disk into RAM (~10,000,000 ns latency).</li>
                            <li>Updated Page Table and re-executed instruction.</li>
                        </ul>
                    </div>
                `;
            }
        });

        // Lesson 4: Fragmentation
        document.getElementById('btnLessonFragmentation')?.addEventListener('click', () => {
            // Switch to Fragmentation tab
            this.app.switchTab('tab-fragmentation');
            const alloc = this.sys.allocator;
            alloc.setupRealisticInitialState();

            // Try to allocate 200 KB process
            const res = alloc.allocate('Heavy 3D Game', 200);
            this.app.refreshAllViews();

            if (feedback) {
                feedback.innerHTML = `
                    <div class="feedback-card">
                        <h4>🧩 Lesson 4 Complete: External Fragmentation Observed</h4>
                        <p><strong>Attempted:</strong> Allocate 200 KB process "Heavy 3D Game".</p>
                        <p class="highlight-red"><strong>Result:</strong> Allocation FAILED with External Fragmentation!</p>
                        <p>Notice the memory bar: Total free memory was >300 KB, but scattered in disjointed holes. Click <strong>"Defragment & Compact Memory"</strong> in the Fragmentation tab to slide blocks together and satisfy the request!</p>
                    </div>
                `;
            }
        });

        // Lesson 5: Belady's Anomaly
        document.getElementById('btnLessonBelady')?.addEventListener('click', () => {
            if (feedback) {
                feedback.innerHTML = `
                    <div class="feedback-card">
                        <h4>🧠 Lesson 5: Belady's Anomaly Demonstration</h4>
                        <p>Consider the classic memory reference string: <code>1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5</code></p>
                        <div class="belady-comparison">
                            <div class="belady-col">
                                <strong>With 3 Physical Frames (FIFO):</strong>
                                <p class="highlight-cyan">9 Total Page Faults</p>
                            </div>
                            <div class="belady-col">
                                <strong>With 4 Physical Frames (FIFO):</strong>
                                <p class="highlight-red">10 Total Page Faults! (More memory caused MORE faults!)</p>
                            </div>
                        </div>
                        <p><strong>Why this happens:</strong> FIFO discards the oldest page regardless of how frequently it is accessed. In contrast, stack algorithms like <strong>LRU (Least Recently Used)</strong> are mathematically proven to be immune to Belady's Anomaly!</p>
                    </div>
                `;
            }
        });
    }
}

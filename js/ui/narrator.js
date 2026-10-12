/**
 * Educational Detective Narrator
 * Turns dry hex and cycle counts into vivid, plain-English step-by-step stories
 * with concept tooltips and architectural explanations.
 */

export class Narrator {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
    }

    render(accessResult) {
        if (!this.container) return;
        if (!accessResult) {
            this.container.innerHTML = `
                <div class="narrator-empty">
                    <div class="empty-icon">🔍</div>
                    <p>Enter a Virtual Address or click <strong>"Step Access"</strong> / <strong>"Run Preset Trace"</strong> to watch the hardware detective investigate the memory system.</p>
                </div>
            `;
            return;
        }

        const { virtualAddress, physicalAddress, isWrite, vmResult, l1Result, l2Result, ramAccessed, totalLatencyNs, amat } = accessResult;

        let stepsHtml = '';

        // Step 1: CPU Request
        stepsHtml += `
            <div class="narrator-step">
                <div class="step-badge num">1</div>
                <div class="step-content">
                    <div class="step-title">CPU Issues ${isWrite ? 'Write (STORE)' : 'Read (LOAD)'} Request</div>
                    <p>The CPU program counter requests virtual address <code class="highlight-cyan">${virtualAddress}</code>. At this stage, the processor is running in user mode and only knows about virtual memory.</p>
                </div>
            </div>
        `;

        // Step 2: Address Translation (TLB)
        const tlbBadgeClass = vmResult.tlbHit ? 'status-hit' : 'status-miss';
        const tlbIcon = vmResult.tlbHit ? '⚡ TLB HIT' : '⚠️ TLB MISS';
        stepsHtml += `
            <div class="narrator-step">
                <div class="step-badge ${tlbBadgeClass}">2</div>
                <div class="step-content">
                    <div class="step-title"><span class="badge ${tlbBadgeClass}">${tlbIcon}</span> Checking Translation Lookaside Buffer</div>
                    <p>The MMU checks the <strong>TLB</strong> (a small, ultra-fast associative cache on the CPU chip) for Virtual Page Number (VPN) <code class="highlight-blue">${vmResult.vpnHex}</code>.</p>
                    ${vmResult.tlbHit 
                        ? `<p class="explanation-good">✅ <strong>Success:</strong> Found in TLB! Instantly translated to Physical Frame <strong>${vmResult.frameNumber}</strong> in just <strong>0.5 ns</strong> without touching slow RAM.</p>`
                        : `<p class="explanation-warn">❌ <strong>Miss:</strong> VPN <strong>${vmResult.vpnHex}</strong> was not in the TLB. The CPU hardware must pause and perform a <em>Page Table Walk</em> in main memory.</p>`
                    }
                </div>
            </div>
        `;

        // Step 3: Page Table & Swapping
        if (!vmResult.tlbHit) {
            if (vmResult.pageFault) {
                stepsHtml += `
                    <div class="narrator-step highlight-fault-box">
                        <div class="step-badge status-fault">3</div>
                        <div class="step-content">
                            <div class="step-title"><span class="badge status-fault">🚨 PAGE FAULT EXCEPTION</span> OS Trap Triggered</div>
                            <p>The CPU reads the Page Table entry in RAM and finds <strong>Valid Bit = 0</strong>! This means Page <code class="highlight-blue">${vmResult.vpnHex}</code> is NOT in physical RAM; it resides on the slow Swap Disk.</p>
                            <div class="narrator-callout">
                                <strong>Operating System Intervention:</strong>
                                <ul>
                                    <li>CPU triggers a hardware page fault interrupt, switching from User Mode to Kernel Mode.</li>
                                    <li>${vmResult.diskAction}</li>
                                    <li>Valid bit updated to <code>1</code>, and TLB entry updated.</li>
                                    <li><strong>Latency Impact:</strong> Mechanical / Flash disk retrieval took a massive <strong>~10,000,000 ns (10 ms)</strong>!</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                `;
            } else {
                stepsHtml += `
                    <div class="narrator-step">
                        <div class="step-badge status-neutral">3</div>
                        <div class="step-content">
                            <div class="step-title"><span class="badge status-neutral">📄 Page Table Hit</span> Memory Resident</div>
                            <p>Page Table walk finished. Valid Bit is <code>1</code>. The page is already in physical RAM at Frame <strong>${vmResult.frameNumber}</strong>. The TLB is now loaded with this translation for future fast access.</p>
                        </div>
                    </div>
                `;
            }
        }

        // Step 4: Physical Address Assembly
        stepsHtml += `
            <div class="narrator-step">
                <div class="step-badge num">4</div>
                <div class="step-content">
                    <div class="step-title">Physical Address Built</div>
                    <p>The MMU combines Physical Frame <code>${vmResult.frameNumber}</code> with Page Offset <code>${vmResult.offsetHex}</code> to create Physical Address <code class="highlight-green">${physicalAddress}</code>. Now the memory bus heads toward the caches!</p>
                </div>
            </div>
        `;

        // Step 5: L1 Cache
        const l1BadgeClass = l1Result.hit ? 'status-hit' : 'status-miss';
        stepsHtml += `
            <div class="narrator-step">
                <div class="step-badge ${l1BadgeClass}">5</div>
                <div class="step-content">
                    <div class="step-title"><span class="badge ${l1BadgeClass}">${l1Result.hit ? '⚡ L1 CACHE HIT' : '⚠️ L1 CACHE MISS'}</span> (L1 Data Cache)</div>
                    <p>Address <code class="highlight-green">${physicalAddress}</code> is sliced into: 
                        Tag: <code>${l1Result.decomp.tagHex}</code> | Set Index: <code>${l1Result.decomp.setIndex}</code> | Offset: <code>${l1Result.decomp.offset}</code>.
                    </p>
                    ${l1Result.hit 
                        ? `<p class="explanation-good">🎉 <strong>HIT!</strong> Found line matching Tag <code>${l1Result.decomp.tagHex}</code> in Way ${l1Result.hitWay}. Data returned in just <strong>1.0 ns</strong>!</p>`
                        : `<p class="explanation-warn">Miss Reason: <strong class="uppercase">${l1Result.missReason} Miss</strong> (${this.explainMissReason(l1Result.missReason)}). Falling back to L2 Cache.</p>`
                    }
                </div>
            </div>
        `;

        // Step 6: L2 Cache & RAM
        if (!l1Result.hit && l2Result) {
            const l2BadgeClass = l2Result.hit ? 'status-hit' : 'status-miss';
            stepsHtml += `
                <div class="narrator-step">
                    <div class="step-badge ${l2BadgeClass}">6</div>
                    <div class="step-content">
                        <div class="step-title"><span class="badge ${l2BadgeClass}">${l2Result.hit ? '🚀 L2 CACHE HIT' : '⚠️ L2 CACHE MISS'}</span> (L2 Unified Cache)</div>
                        ${l2Result.hit 
                            ? `<p class="explanation-good">✅ L2 hit in Set <code>${l2Result.decomp.setIndex}</code>, Way ${l2Result.hitWay}. Retrieved in <strong>4.0 ns</strong> and loaded into L1 for future reuse.</p>`
                            : `<p class="explanation-warn">❌ L2 Miss (<strong class="uppercase">${l2Result.missReason}</strong>). Hardware must make the long journey across the system bus to Main Memory (DRAM).</p>`
                        }
                    </div>
                </div>
            `;

            if (ramAccessed) {
                stepsHtml += `
                    <div class="narrator-step">
                        <div class="step-badge status-ram">7</div>
                        <div class="step-content">
                            <div class="step-title"><span class="badge status-ram">💾 Main Memory (DRAM) Access</span></div>
                            <p>DRAM capacitor arrays charged and read the requested cache line (~100 ns). The entire 64-byte block is brought up and installed into both L2 and L1 caches.</p>
                        </div>
                    </div>
                `;
            }
        }

        // Summary Card
        const humanTime = this.formatHumanScale(totalLatencyNs);
        this.container.innerHTML = `
            <div class="narrator-card">
                <div class="narrator-header">
                    <h3>🕵️ Detective Investigation Report</h3>
                    <div class="latency-pill">Total Latency: <strong>${totalLatencyNs >= 1000 ? (totalLatencyNs/1000).toFixed(1) + ' µs' : totalLatencyNs.toFixed(1) + ' ns'}</strong></div>
                </div>
                <div class="narrator-timeline">
                    ${stepsHtml}
                </div>
                <div class="narrator-footer">
                    <div class="footer-stat">
                        <span class="stat-label">Running AMAT:</span>
                        <span class="stat-val">${amat} ns</span>
                    </div>
                    <div class="footer-stat">
                        <span class="stat-label">Human-Scale Time Equivalent:</span>
                        <span class="stat-val highlight-gold">${humanTime}</span>
                    </div>
                </div>
            </div>
        `;
    }

    explainMissReason(reason) {
        if (reason === 'compulsory') return 'Cold start: This memory block has never been referenced before';
        if (reason === 'capacity') return 'Cache is completely saturated with active blocks';
        if (reason === 'conflict') return 'Multiple addresses mapped into the exact same set, even though other sets had room';
        return '';
    }

    formatHumanScale(ns) {
        if (ns <= 1.5) return '1 second (1 human heartbeat)';
        if (ns <= 5) return '4 seconds (taking a deep breath)';
        if (ns <= 100) return '1.6 minutes (grabbing a quick glass of water)';
        if (ns <= 200) return '3.3 minutes (reading an email)';
        return '3.8 MONTHS of waiting! (If 1ns = 1 sec)';
    }
}

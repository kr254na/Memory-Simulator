/**
 * Virtual Memory, Paging, TLB, and Swapping Engine
 * Simulates:
 * - 32-bit Virtual Address to Physical Address Translation
 * - Translation Lookaside Buffer (TLB) with Tag and Frame lookup
 * - Multi-entry Page Table with Valid, Dirty, Reference, and Access flags
 * - Physical RAM Frames and Secondary Storage (Swap Disk)
 * - Page Fault Handling with Clock (Second-Chance), LRU, and FIFO replacement algorithms
 */

export class TLBEntry {
    constructor() {
        this.valid = false;
        this.vpn = null;
        this.frameNumber = null;
        this.lruCounter = 0;
    }
}

export class PageTableEntry {
    constructor(vpn) {
        this.vpn = vpn;
        this.valid = false;        // In RAM (1) or On Disk (0)
        this.frameNumber = null;  // Physical Frame in RAM
        this.dirty = false;        // Has page been modified?
        this.reference = false;    // Used by Clock (Second-Chance)
        this.diskSector = vpn;    // Location in Swap space
        this.lastAccessTime = 0;
        this.loadTime = 0;
    }
}

export class PhysicalFrame {
    constructor(frameNumber, sizeBytes = 4096) {
        this.frameNumber = frameNumber;
        this.sizeBytes = sizeBytes;
        this.occupied = false;
        this.vpn = null;
    }
}

export class VirtualMemorySimulator {
    constructor(options = {}) {
        this.pageSize = options.pageSize || 4096; // 4 KB pages
        this.numVirtualPages = options.numVirtualPages || 32;
        this.numPhysicalFrames = options.numPhysicalFrames || 8; // Constrained RAM to trigger swapping
        this.tlbEntriesCount = options.tlbEntriesCount || 4;
        this.replacementAlgorithm = options.replacementAlgorithm || 'CLOCK'; // 'CLOCK', 'LRU', 'FIFO'

        this.clockTicks = 0;
        this.clockHand = 0; // For Clock (Second-Chance) replacement

        this.stats = {
            tlbHits: 0,
            tlbMisses: 0,
            pageHits: 0,
            pageFaults: 0,
            diskReads: 0,
            diskWrites: 0
        };

        this.init();
    }

    init() {
        // Offset bits = log2(pageSize), e.g. log2(4096) = 12 bits
        this.offsetBits = Math.log2(this.pageSize);
        this.vpnBits = 32 - this.offsetBits;

        // TLB
        this.tlb = Array.from({ length: this.tlbEntriesCount }, () => new TLBEntry());

        // Page Table
        this.pageTable = new Map();
        for (let vpn = 0; vpn < this.numVirtualPages; vpn++) {
            this.pageTable.set(vpn, new PageTableEntry(vpn));
        }

        // Physical RAM Frames
        this.frames = Array.from({ length: this.numPhysicalFrames }, (_, i) => new PhysicalFrame(i, this.pageSize));

        // Initial pre-population of a few frames for realistic state
        this.preloadInitialPages();
    }

    preloadInitialPages() {
        // Preload first 3 pages into RAM so not every first access is immediately an empty fault
        const initialVpns = [0, 1, 2];
        initialVpns.forEach((vpn, idx) => {
            const entry = this.pageTable.get(vpn);
            entry.valid = true;
            entry.frameNumber = idx;
            entry.reference = true;
            entry.loadTime = 1;
            entry.lastAccessTime = 1;

            this.frames[idx].occupied = true;
            this.frames[idx].vpn = vpn;

            // Also put vpn 0 and 1 into TLB
            if (idx < 2) {
                this.tlb[idx].valid = true;
                this.tlb[idx].vpn = vpn;
                this.tlb[idx].frameNumber = idx;
                this.tlb[idx].lruCounter = 1;
            }
        });
    }

    reset() {
        this.clockTicks = 0;
        this.clockHand = 0;
        this.stats = {
            tlbHits: 0,
            tlbMisses: 0,
            pageHits: 0,
            pageFaults: 0,
            diskReads: 0,
            diskWrites: 0
        };
        this.init();
    }

    decomposeVirtualAddress(address) {
        const offsetMask = (1 << this.offsetBits) - 1;
        const offset = address & offsetMask;
        const vpn = address >>> this.offsetBits;

        return {
            raw: address,
            hex: '0x' + (address >>> 0).toString(16).padStart(8, '0').toUpperCase(),
            vpn,
            vpnHex: '0x' + (vpn >>> 0).toString(16).toUpperCase(),
            offset,
            offsetHex: '0x' + (offset >>> 0).toString(16).padStart(3, '0').toUpperCase()
        };
    }

    lookupTLB(vpn) {
        for (let i = 0; i < this.tlb.length; i++) {
            const entry = this.tlb[i];
            if (entry.valid && entry.vpn === vpn) {
                entry.lruCounter = this.clockTicks;
                return { hit: true, index: i, frameNumber: entry.frameNumber };
            }
        }
        return { hit: false, index: -1, frameNumber: null };
    }

    updateTLB(vpn, frameNumber) {
        // Find empty slot
        let targetIndex = this.tlb.findIndex(e => !e.valid);
        if (targetIndex === -1) {
            // Evict least recently used TLB entry
            let minLru = Infinity;
            targetIndex = 0;
            this.tlb.forEach((e, idx) => {
                if (e.lruCounter < minLru) {
                    minLru = e.lruCounter;
                    targetIndex = idx;
                }
            });
        }

        this.tlb[targetIndex].valid = true;
        this.tlb[targetIndex].vpn = vpn;
        this.tlb[targetIndex].frameNumber = frameNumber;
        this.tlb[targetIndex].lruCounter = this.clockTicks;
    }

    invalidateTLB(vpn) {
        for (let entry of this.tlb) {
            if (entry.valid && entry.vpn === vpn) {
                entry.valid = false;
                entry.vpn = null;
                entry.frameNumber = null;
                break;
            }
        }
    }

    selectVictimFrame() {
        if (this.replacementAlgorithm === 'CLOCK') {
            // Second-Chance Clock Algorithm
            while (true) {
                const currentFrame = this.frames[this.clockHand];
                const pageEntry = this.pageTable.get(currentFrame.vpn);

                if (!pageEntry.reference) {
                    // Victim found!
                    const victimFrameIndex = this.clockHand;
                    this.clockHand = (this.clockHand + 1) % this.numPhysicalFrames;
                    return {
                        frameNumber: victimFrameIndex,
                        evictedVpn: currentFrame.vpn,
                        algorithm: 'Clock (Ref bit was 0)'
                    };
                } else {
                    // Give second chance, reset reference bit
                    pageEntry.reference = false;
                    this.clockHand = (this.clockHand + 1) % this.numPhysicalFrames;
                }
            }
        } else if (this.replacementAlgorithm === 'LRU') {
            let oldestAccess = Infinity;
            let victimFrame = 0;
            let evictedVpn = null;

            this.frames.forEach(frame => {
                const entry = this.pageTable.get(frame.vpn);
                if (entry && entry.lastAccessTime < oldestAccess) {
                    oldestAccess = entry.lastAccessTime;
                    victimFrame = frame.frameNumber;
                    evictedVpn = frame.vpn;
                }
            });

            return {
                frameNumber: victimFrame,
                evictedVpn,
                algorithm: 'LRU (Oldest access time)'
            };
        } else if (this.replacementAlgorithm === 'FIFO') {
            let earliestLoad = Infinity;
            let victimFrame = 0;
            let evictedVpn = null;

            this.frames.forEach(frame => {
                const entry = this.pageTable.get(frame.vpn);
                if (entry && entry.loadTime < earliestLoad) {
                    earliestLoad = entry.loadTime;
                    victimFrame = frame.frameNumber;
                    evictedVpn = frame.vpn;
                }
            });

            return {
                frameNumber: victimFrame,
                evictedVpn,
                algorithm: 'FIFO (Earliest loaded frame)'
            };
        }
    }

    access(virtualAddress, isWrite = false) {
        this.clockTicks++;
        const decomp = this.decomposeVirtualAddress(virtualAddress);
        let ptEntry = this.pageTable.get(decomp.vpn);

        if (!ptEntry) {
            // Allocate entry if beyond initialized range
            ptEntry = new PageTableEntry(decomp.vpn);
            this.pageTable.set(decomp.vpn, ptEntry);
        }

        // 1. TLB Lookup
        const tlbResult = this.lookupTLB(decomp.vpn);
        let tlbHit = tlbResult.hit;
        let pageFault = false;
        let evicted = null;
        let diskAction = null;
        let frameNumber = null;

        if (tlbHit) {
            this.stats.tlbHits++;
            this.stats.pageHits++;
            frameNumber = tlbResult.frameNumber;
            ptEntry.reference = true;
            ptEntry.lastAccessTime = this.clockTicks;
            if (isWrite) ptEntry.dirty = true;
        } else {
            this.stats.tlbMisses++;

            // 2. Page Table Lookup
            if (ptEntry.valid) {
                // Page Hit in RAM
                this.stats.pageHits++;
                frameNumber = ptEntry.frameNumber;
                ptEntry.reference = true;
                ptEntry.lastAccessTime = this.clockTicks;
                if (isWrite) ptEntry.dirty = true;

                // Update TLB
                this.updateTLB(decomp.vpn, frameNumber);
            } else {
                // 3. PAGE FAULT! Page is on Swap Disk
                pageFault = true;
                this.stats.pageFaults++;
                this.stats.diskReads++;

                // Check for free frame
                const freeFrame = this.frames.find(f => !f.occupied);

                if (freeFrame) {
                    frameNumber = freeFrame.frameNumber;
                    freeFrame.occupied = true;
                    freeFrame.vpn = decomp.vpn;
                    diskAction = `Loaded Page ${decomp.vpnHex} from Swap Disk into free Frame ${frameNumber}`;
                } else {
                    // RAM is full -> Evict victim frame
                    const victim = this.selectVictimFrame();
                    frameNumber = victim.frameNumber;
                    const oldEntry = this.pageTable.get(victim.evictedVpn);

                    // If old page was dirty, write back to disk
                    let writeback = false;
                    if (oldEntry.dirty) {
                        this.stats.diskWrites++;
                        writeback = true;
                    }

                    // Invalidate old page
                    oldEntry.valid = false;
                    oldEntry.frameNumber = null;
                    this.invalidateTLB(victim.evictedVpn);

                    evicted = {
                        vpn: victim.evictedVpn,
                        frameNumber: victim.frameNumber,
                        dirty: oldEntry.dirty,
                        writeback,
                        algorithm: victim.algorithm
                    };

                    // Install new page into victim frame
                    this.frames[frameNumber].vpn = decomp.vpn;
                    diskAction = writeback 
                        ? `Evicted Page 0x${victim.evictedVpn.toString(16)} (Dirty: Saved to Swap). Loaded Page ${decomp.vpnHex} into Frame ${frameNumber}.`
                        : `Evicted Page 0x${victim.evictedVpn.toString(16)} (Clean). Loaded Page ${decomp.vpnHex} into Frame ${frameNumber}.`;
                }

                // Update Page Table Entry
                ptEntry.valid = true;
                ptEntry.frameNumber = frameNumber;
                ptEntry.dirty = isWrite;
                ptEntry.reference = true;
                ptEntry.loadTime = this.clockTicks;
                ptEntry.lastAccessTime = this.clockTicks;

                // Update TLB with newly resolved frame
                this.updateTLB(decomp.vpn, frameNumber);
            }
        }

        // Construct Physical Address: [ Frame Number | Offset ]
        const physicalAddress = (frameNumber << this.offsetBits) | decomp.offset;
        const physicalAddressHex = '0x' + (physicalAddress >>> 0).toString(16).padStart(8, '0').toUpperCase();

        const totalTranslations = this.stats.pageHits + this.stats.pageFaults;
        const faultRate = totalTranslations > 0 ? (this.stats.pageFaults / totalTranslations) * 100 : 0;

        return {
            virtualAddress: decomp.hex,
            vpn: decomp.vpn,
            vpnHex: decomp.vpnHex,
            offset: decomp.offset,
            offsetHex: decomp.offsetHex,
            physicalAddress,
            physicalAddressHex,
            frameNumber,
            tlbHit,
            pageFault,
            evicted,
            diskAction,
            isWrite,
            faultRate: faultRate.toFixed(1),
            stats: { ...this.stats }
        };
    }
}

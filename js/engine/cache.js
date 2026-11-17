/**
 * Cache Simulation Engine
 * Supports Direct-Mapped, N-Way Set Associative, and Fully Associative caches.
 * Implements LRU, FIFO, and LFU replacement policies.
 * Supports Write-Through and Write-Back policies.
 * Tracks Compulsory, Capacity, and Conflict misses (The 3 C's).
 */

class CacheLine {
    constructor(blockSize = 32) {
        this.valid = false;
        this.dirty = false;
        this.tag = null;
        this.data = new Array(blockSize).fill(0);
        this.lruCounter = 0;
        this.insertionTime = 0;
        this.accessCount = 0;
    }

    reset() {
        this.valid = false;
        this.dirty = false;
        this.tag = null;
        this.data.fill(0);
        this.lruCounter = 0;
        this.insertionTime = 0;
        this.accessCount = 0;
    }
}

class CacheSet {
    constructor(ways = 2, blockSize = 32) {
        this.ways = ways;
        this.lines = Array.from({ length: ways }, () => new CacheLine(blockSize));
    }
}

export class CacheSimulator {
    constructor(options = {}) {
        this.name = options.name || 'L1 Data Cache';
        this.totalSize = options.totalSize || 512; // Bytes (scaled for clear visualization)
        this.blockSize = options.blockSize || 32;  // Bytes per line
        this.ways = options.ways || 2;            // 1: Direct, 2/4: N-way, total/block: Fully
        this.replacementPolicy = options.replacementPolicy || 'LRU'; // 'LRU', 'FIFO', 'LFU'
        this.writePolicy = options.writePolicy || 'WB'; // 'WB' (Write-Back), 'WT' (Write-Through)
        this.latencyNs = options.latencyNs || 1.0;

        this.clockTicks = 0;
        this.stats = {
            hits: 0,
            misses: 0,
            compulsoryMisses: 0,
            conflictMisses: 0,
            capacityMisses: 0,
            evictions: 0,
            writebacks: 0
        };

        this.seenBlocks = new Set(); // For 3 C's classification
        this.initializeGeometry();
    }

    initializeGeometry() {
        this.numBlocks = Math.floor(this.totalSize / this.blockSize);
        if (this.ways > this.numBlocks) {
            this.ways = this.numBlocks; // Fully associative constraint
        }
        this.numSets = Math.floor(this.numBlocks / this.ways);

        this.offsetBits = Math.log2(this.blockSize);
        this.indexBits = Math.log2(this.numSets);
        this.tagBits = 32 - (this.indexBits + this.offsetBits);

        // Build sets
        this.sets = Array.from({ length: this.numSets }, () => new CacheSet(this.ways, this.blockSize));
        this.seenBlocks.clear();
        this.resetStats();
    }

    resetStats() {
        this.stats = {
            hits: 0,
            misses: 0,
            compulsoryMisses: 0,
            conflictMisses: 0,
            capacityMisses: 0,
            evictions: 0,
            writebacks: 0
        };
        this.clockTicks = 0;
    }

    reset() {
        this.sets.forEach(set => {
            set.lines.forEach(line => line.reset());
        });
        this.seenBlocks.clear();
        this.resetStats();
    }

    decomposeAddress(address) {
        const offsetMask = (1 << this.offsetBits) - 1;
        const indexMask = (1 << this.indexBits) - 1;

        const offset = address & offsetMask;
        const setIndex = (address >>> this.offsetBits) & indexMask;
        const tag = address >>> (this.offsetBits + this.indexBits);
        const blockAddress = address >>> this.offsetBits;

        return {
            raw: address,
            hex: '0x' + (address >>> 0).toString(16).padStart(8, '0').toUpperCase(),
            tag,
            tagHex: '0x' + (tag >>> 0).toString(16).toUpperCase(),
            setIndex,
            offset,
            blockAddress
        };
    }

    classifyMiss(blockAddress) {
        if (!this.seenBlocks.has(blockAddress)) {
            this.seenBlocks.add(blockAddress);
            return 'compulsory'; // Cold miss: first time accessed
        }

        // Check if total valid blocks in cache equals total capacity
        let totalValidLines = 0;
        this.sets.forEach(s => s.lines.forEach(l => { if (l.valid) totalValidLines++; }));

        if (totalValidLines >= this.numBlocks) {
            return 'capacity'; // Cache is completely full
        } else {
            return 'conflict'; // Space existed elsewhere, but this specific set was full!
        }
    }

    access(address, isWrite = false) {
        this.clockTicks++;
        const decomp = this.decomposeAddress(address);
        const targetSet = this.sets[decomp.setIndex];

        let hit = false;
        let hitWay = -1;
        let evicted = null;
        let writebackOccurred = false;

        // Check for hit
        for (let w = 0; w < targetSet.lines.length; w++) {
            const line = targetSet.lines[w];
            if (line.valid && line.tag === decomp.tag) {
                hit = true;
                hitWay = w;
                line.lruCounter = this.clockTicks;
                line.accessCount++;
                if (isWrite) {
                    if (this.writePolicy === 'WB') {
                        line.dirty = true;
                    } else {
                        // Write-Through: writes immediately to next level
                        line.dirty = false;
                        writebackOccurred = true;
                    }
                }
                break;
            }
        }

        let missReason = null;

        if (hit) {
            this.stats.hits++;
        } else {
            this.stats.misses++;
            missReason = this.classifyMiss(decomp.blockAddress);
            if (missReason === 'compulsory') this.stats.compulsoryMisses++;
            else if (missReason === 'capacity') this.stats.capacityMisses++;
            else if (missReason === 'conflict') this.stats.conflictMisses++;

            // Find an empty way or select victim to evict
            let targetWay = targetSet.lines.findIndex(line => !line.valid);

            if (targetWay === -1) {
                // Set is full: Select victim based on replacement policy
                targetWay = this.selectVictimWay(targetSet);
                const victimLine = targetSet.lines[targetWay];

                evicted = {
                    tag: victimLine.tag,
                    tagHex: '0x' + (victimLine.tag >>> 0).toString(16).toUpperCase(),
                    dirty: victimLine.dirty,
                    way: targetWay
                };
                this.stats.evictions++;

                if (victimLine.dirty && this.writePolicy === 'WB') {
                    writebackOccurred = true;
                    this.stats.writebacks++;
                }
            }

            // Install block into chosen way
            const installedLine = targetSet.lines[targetWay];
            installedLine.valid = true;
            installedLine.tag = decomp.tag;
            installedLine.dirty = isWrite && (this.writePolicy === 'WB');
            installedLine.lruCounter = this.clockTicks;
            installedLine.insertionTime = this.clockTicks;
            installedLine.accessCount = 1;
            hitWay = targetWay;
        }

        const totalAccesses = this.stats.hits + this.stats.misses;
        const hitRate = totalAccesses > 0 ? (this.stats.hits / totalAccesses) * 100 : 0;
        const missRate = totalAccesses > 0 ? (this.stats.misses / totalAccesses) * 100 : 0;

        return {
            name: this.name,
            addressHex: decomp.hex,
            isWrite,
            hit,
            hitWay,
            decomp,
            missReason,
            evicted,
            writebackOccurred,
            hitRate: hitRate.toFixed(1),
            missRate: missRate.toFixed(1),
            stats: { ...this.stats }
        };
    }

    selectVictimWay(set) {
        if (this.replacementPolicy === 'LRU') {
            // Find line with minimum lruCounter
            let minCounter = Infinity;
            let victimWay = 0;
            set.lines.forEach((line, idx) => {
                if (line.lruCounter < minCounter) {
                    minCounter = line.lruCounter;
                    victimWay = idx;
                }
            });
            return victimWay;
        } else if (this.replacementPolicy === 'FIFO') {
            // Find line with earliest insertionTime
            let earliest = Infinity;
            let victimWay = 0;
            set.lines.forEach((line, idx) => {
                if (line.insertionTime < earliest) {
                    earliest = line.insertionTime;
                    victimWay = idx;
                }
            });
            return victimWay;
        } else if (this.replacementPolicy === 'LFU') {
            // Least Frequently Used: lowest accessCount
            let minAccess = Infinity;
            let victimWay = 0;
            set.lines.forEach((line, idx) => {
                if (line.accessCount < minAccess) {
                    minAccess = line.accessCount;
                    victimWay = idx;
                }
            });
            return victimWay;
        }
        return 0;
    }
}

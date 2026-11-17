/**
 * Memory Allocation & Fragmentation Simulator
 * Simulates:
 * 1. Contiguous Memory Allocation (Dynamic Partitioning)
 *    - Algorithms: First-Fit, Best-Fit, Worst-Fit
 *    - External Fragmentation (total free space is sufficient, but no single contiguous hole fits)
 *    - Memory Compaction / Defragmentation (sliding allocated blocks to coalesce free memory)
 * 2. Paging and Internal Fragmentation
 *    - Wasted space within fixed 4 KB frames when process memory is not an exact multiple of page size
 */

export class MemoryBlock {
    constructor(id, start, size, isAllocated = false, processName = null, requestedSize = null) {
        this.id = id;
        this.start = start;
        this.size = size; // in KB
        this.isAllocated = isAllocated;
        this.processName = processName;
        this.requestedSize = requestedSize !== null ? requestedSize : size;
        this.internalFragmentation = isAllocated ? Math.max(0, this.size - this.requestedSize) : 0;
    }
}

export class MemoryAllocatorSimulator {
    constructor(options = {}) {
        this.totalMemoryKB = options.totalMemoryKB || 1024; // 1 MB physical pool
        this.algorithm = options.algorithm || 'FIRST_FIT'; // 'FIRST_FIT', 'BEST_FIT', 'WORST_FIT'
        this.pageSizeKB = options.pageSizeKB || 4; // 4 KB pages for internal fragmentation comparison
        this.nextBlockId = 1;
        this.blocks = [];
        this.allocatedProcesses = new Map();

        this.stats = {
            totalAllocations: 0,
            failedAllocations: 0,
            compactionsCount: 0
        };

        this.init();
    }

    init() {
        this.blocks = [
            new MemoryBlock(this.nextBlockId++, 0, this.totalMemoryKB, false, null)
        ];
        this.allocatedProcesses.clear();
        this.setupRealisticInitialState();
    }

    reset() {
        this.nextBlockId = 1;
        this.stats = {
            totalAllocations: 0,
            failedAllocations: 0,
            compactionsCount: 0
        };
        this.init();
    }

    setupRealisticInitialState() {
        // Create an interesting fragmented state so the user immediately sees holes & fragmentation
        this.allocate('OS Kernel', 128); // 0-128
        this.allocate('Web Browser', 192); // 128-320
        this.allocate('IDE / Editor', 256); // 320-576
        this.allocate('Database', 160); // 576-736
        this.allocate('Terminal', 64); // 736-800
        // Free Web Browser & Database to introduce classic external fragmentation holes!
        this.deallocate('Web Browser');
        this.deallocate('Database');
    }

    getMetrics() {
        let totalFree = 0;
        let largestHole = 0;
        let totalAllocated = 0;
        let totalInternalFrag = 0;
        let freeHolesCount = 0;

        this.blocks.forEach(b => {
            if (b.isAllocated) {
                totalAllocated += b.size;
                totalInternalFrag += b.internalFragmentation;
            } else {
                totalFree += b.size;
                freeHolesCount++;
                if (b.size > largestHole) largestHole = b.size;
            }
        });

        // External fragmentation exists if totalFree >= some requested size but largestHole < size
        return {
            totalMemoryKB: this.totalMemoryKB,
            totalAllocatedKB: totalAllocated,
            totalFreeKB: totalFree,
            largestHoleKB: largestHole,
            freeHolesCount,
            totalInternalFragKB: totalInternalFrag,
            usedPercentage: ((totalAllocated / this.totalMemoryKB) * 100).toFixed(1),
            freePercentage: ((totalFree / this.totalMemoryKB) * 100).toFixed(1)
        };
    }

    allocate(processName, requestedSizeKB) {
        this.stats.totalAllocations++;
        // Find suitable hole according to algorithm
        const freeBlockIndices = [];
        this.blocks.forEach((block, idx) => {
            if (!block.isAllocated && block.size >= requestedSizeKB) {
                freeBlockIndices.push(idx);
            }
        });

        if (freeBlockIndices.length === 0) {
            this.stats.failedAllocations++;
            const metrics = this.getMetrics();
            let reason = 'Out of Memory';
            if (metrics.totalFreeKB >= requestedSizeKB) {
                reason = `EXTERNAL FRAGMENTATION ERROR! Total free memory is ${metrics.totalFreeKB} KB, but it is split across multiple small holes. The largest single contiguous hole is only ${metrics.largestHoleKB} KB!`;
            } else {
                reason = `Not enough total memory available (${metrics.totalFreeKB} KB free < ${requestedSizeKB} KB needed).`;
            }
            return {
                success: false,
                reason,
                metrics: this.getMetrics()
            };
        }

        let chosenIndex = freeBlockIndices[0];

        if (this.algorithm === 'FIRST_FIT') {
            chosenIndex = freeBlockIndices[0];
        } else if (this.algorithm === 'BEST_FIT') {
            // Find smallest hole that fits
            let minDiff = Infinity;
            freeBlockIndices.forEach(idx => {
                const diff = this.blocks[idx].size - requestedSizeKB;
                if (diff < minDiff) {
                    minDiff = diff;
                    chosenIndex = idx;
                }
            });
        } else if (this.algorithm === 'WORST_FIT') {
            // Find largest hole
            let maxDiff = -Infinity;
            freeBlockIndices.forEach(idx => {
                const diff = this.blocks[idx].size - requestedSizeKB;
                if (diff > maxDiff) {
                    maxDiff = diff;
                    chosenIndex = idx;
                }
            });
        }

        const targetBlock = this.blocks[chosenIndex];
        const remainingSize = targetBlock.size - requestedSizeKB;

        if (remainingSize > 0) {
            // Split the block
            const allocatedBlock = new MemoryBlock(
                this.nextBlockId++,
                targetBlock.start,
                requestedSizeKB,
                true,
                processName,
                requestedSizeKB
            );
            const holeBlock = new MemoryBlock(
                this.nextBlockId++,
                targetBlock.start + requestedSizeKB,
                remainingSize,
                false,
                null
            );

            this.blocks.splice(chosenIndex, 1, allocatedBlock, holeBlock);
            this.allocatedProcesses.set(processName, allocatedBlock.id);
        } else {
            // Exact fit
            targetBlock.isAllocated = true;
            targetBlock.processName = processName;
            targetBlock.requestedSize = requestedSizeKB;
            targetBlock.internalFragmentation = 0;
            this.allocatedProcesses.set(processName, targetBlock.id);
        }

        return {
            success: true,
            processName,
            sizeKB: requestedSizeKB,
            algorithm: this.algorithm,
            metrics: this.getMetrics()
        };
    }

    deallocate(processName) {
        const blockIndex = this.blocks.findIndex(b => b.isAllocated && b.processName === processName);
        if (blockIndex === -1) {
            return { success: false, reason: `Process "${processName}" not found in memory.` };
        }

        const block = this.blocks[blockIndex];
        block.isAllocated = false;
        block.processName = null;
        block.internalFragmentation = 0;
        this.allocatedProcesses.delete(processName);

        // Coalesce adjacent free blocks
        this.coalesceFreeBlocks();

        return {
            success: true,
            freedProcess: processName,
            metrics: this.getMetrics()
        };
    }

    coalesceFreeBlocks() {
        const merged = [];
        let current = null;

        for (let b of this.blocks) {
            if (!current) {
                current = b;
            } else if (!current.isAllocated && !b.isAllocated) {
                // Merge two adjacent holes
                current.size += b.size;
            } else {
                merged.push(current);
                current = b;
            }
        }
        if (current) merged.push(current);
        this.blocks = merged;
    }

    compactMemory() {
        this.stats.compactionsCount++;
        let currentOffset = 0;
        const newBlocks = [];
        let totalFree = 0;

        // Slide all allocated blocks to the beginning of memory
        this.blocks.forEach(b => {
            if (b.isAllocated) {
                b.start = currentOffset;
                currentOffset += b.size;
                newBlocks.push(b);
            } else {
                totalFree += b.size;
            }
        });

        // Place one consolidated giant hole at the end
        if (totalFree > 0) {
            const consolidatedHole = new MemoryBlock(
                this.nextBlockId++,
                currentOffset,
                totalFree,
                false,
                null
            );
            newBlocks.push(consolidatedHole);
        }

        this.blocks = newBlocks;

        return {
            success: true,
            totalFreeConsolidatedKB: totalFree,
            metrics: this.getMetrics()
        };
    }

    /**
     * Calculates Internal Fragmentation if this same process were allocated via Paging
     */
    calculatePagingInternalFrag(sizeKB) {
        const pagesNeeded = Math.ceil(sizeKB / this.pageSizeKB);
        const allocatedKB = pagesNeeded * this.pageSizeKB;
        const internalFragKB = allocatedKB - sizeKB;
        const wastePercentage = allocatedKB > 0 ? ((internalFragKB / allocatedKB) * 100).toFixed(1) : 0;

        return {
            processSizeKB: sizeKB,
            pageSizeKB: this.pageSizeKB,
            pagesNeeded,
            allocatedKB,
            internalFragKB,
            wastePercentage
        };
    }
}

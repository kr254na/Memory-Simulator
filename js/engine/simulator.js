/**
 * Unified Memory System Master Simulator
 * Orchestrates the full journey from CPU Virtual Address -> TLB -> Page Table -> Disk Swapping -> L1 -> L2 -> RAM
 */

import { CacheSimulator } from './cache.js';
import { VirtualMemorySimulator } from './paging.js';
import { MemoryAllocatorSimulator } from './allocator.js';
import { RomSimulator } from './rom.js';

export class MemorySystemSimulator {
    constructor() {
        // Default hardware latencies (nanoseconds)
        this.latencies = {
            tlbHit: 0.5,
            pageTableWalk: 50.0,
            diskPageFault: 10000000.0, // 10 milliseconds = 10,000,000 ns!
            l1Hit: 1.0,
            l2Hit: 4.0,
            ramAccess: 100.0
        };

        this.initComponents();
    }

    initComponents() {
        // L1 Cache: 512 Bytes, 32 Byte Block, 2-Way Set Associative
        this.l1 = new CacheSimulator({
            name: 'L1 Data Cache',
            totalSize: 512,
            blockSize: 32,
            ways: 2,
            replacementPolicy: 'LRU',
            writePolicy: 'WB',
            latencyNs: this.latencies.l1Hit
        });

        // L2 Cache: 2048 Bytes, 64 Byte Block, 4-Way Set Associative
        this.l2 = new CacheSimulator({
            name: 'L2 Unified Cache',
            totalSize: 2048,
            blockSize: 64,
            ways: 4,
            replacementPolicy: 'LRU',
            writePolicy: 'WB',
            latencyNs: this.latencies.l2Hit
        });

        // Virtual Memory & Paging: 4 KB pages, 8 Physical frames, 4-entry TLB
        this.vm = new VirtualMemorySimulator({
            pageSize: 4096,
            numVirtualPages: 32,
            numPhysicalFrames: 8,
            tlbEntriesCount: 4,
            replacementAlgorithm: 'CLOCK'
        });

        // Memory Allocator & Fragmentation simulator
        this.allocator = new MemoryAllocatorSimulator({
            totalMemoryKB: 1024,
            algorithm: 'FIRST_FIT',
            pageSizeKB: 4
        });

        // Semiconductor ROM Simulator (Firmware & Bootloader)
        this.rom = new RomSimulator();

        this.totalMemoryAccesses = 0;
        this.totalAccumulatedLatencyNs = 0;
        this.accessHistory = [];
    }

    reset() {
        this.l1.reset();
        this.l2.reset();
        this.vm.reset();
        this.allocator.reset();
        this.rom.reset();
        this.totalMemoryAccesses = 0;
        this.totalAccumulatedLatencyNs = 0;
        this.accessHistory = [];
    }

    /**
     * Executes the complete memory hierarchy journey for a single virtual address
     */
    executeAccess(virtualAddress, isWrite = false) {
        this.totalMemoryAccesses++;
        let stepLatencies = [];
        let totalLatencyNs = 0;
        let flowSteps = [];

        // 1. CPU generates request
        const hexVA = '0x' + (virtualAddress >>> 0).toString(16).padStart(8, '0').toUpperCase();
        flowSteps.push({
            stage: 'CPU',
            title: 'Instruction Issued',
            status: 'neutral',
            detail: `CPU issued ${isWrite ? 'STORE' : 'LOAD'} for Virtual Address ${hexVA}`
        });

        // 2. Virtual Memory Translation (TLB & Page Table)
        const vmResult = this.vm.access(virtualAddress, isWrite);

        if (vmResult.tlbHit) {
            totalLatencyNs += this.latencies.tlbHit;
            stepLatencies.push({ name: 'TLB Hit', latency: this.latencies.tlbHit });
            flowSteps.push({
                stage: 'TLB',
                title: 'TLB HIT',
                status: 'hit',
                detail: `Virtual Page Number ${vmResult.vpnHex} mapped instantly to Physical Frame ${vmResult.frameNumber} in fast silicon.`
            });
        } else {
            totalLatencyNs += this.latencies.tlbHit; // Cost to check TLB
            stepLatencies.push({ name: 'TLB Lookup (Miss)', latency: this.latencies.tlbHit });
            flowSteps.push({
                stage: 'TLB',
                title: 'TLB MISS',
                status: 'miss',
                detail: `VPN ${vmResult.vpnHex} not found in TLB. Hardware must walk the Page Table in main memory.`
            });

            if (vmResult.pageFault) {
                totalLatencyNs += this.latencies.pageTableWalk + this.latencies.diskPageFault;
                stepLatencies.push({ name: 'Page Table Walk', latency: this.latencies.pageTableWalk });
                stepLatencies.push({ name: 'DISK PAGE FAULT & SWAP', latency: this.latencies.diskPageFault });
                flowSteps.push({
                    stage: 'PAGE_FAULT',
                    title: '🚨 PAGE FAULT TRIGGERED',
                    status: 'fault',
                    detail: `Page ${vmResult.vpnHex} was NOT in RAM (Valid Bit = 0). OS kernel trapped and swapped frame from Disk (~10 ms penalty!).`
                });
                if (vmResult.evicted) {
                    flowSteps.push({
                        stage: 'SWAP_DISK',
                        title: 'Page Replacement Executed',
                        status: 'warning',
                        detail: `${vmResult.evicted.algorithm}. Evicted Page 0x${vmResult.evicted.vpn.toString(16)} to make room for Page ${vmResult.vpnHex}.`
                    });
                }
            } else {
                totalLatencyNs += this.latencies.pageTableWalk;
                stepLatencies.push({ name: 'Page Table Walk', latency: this.latencies.pageTableWalk });
                flowSteps.push({
                    stage: 'PAGE_TABLE',
                    title: 'Page Table Hit in RAM',
                    status: 'neutral',
                    detail: `Valid Bit is 1. VPN ${vmResult.vpnHex} mapped to Physical Frame ${vmResult.frameNumber}. TLB updated.`
                });
            }
        }

        // 3. Physical Address constructed
        flowSteps.push({
            stage: 'MMU',
            title: 'Physical Address Generated',
            status: 'neutral',
            detail: `Frame ${vmResult.frameNumber} + Offset ${vmResult.offsetHex} ➔ PA ${vmResult.physicalAddressHex}`
        });

        // 4. L1 Cache Lookup
        const l1Result = this.l1.access(vmResult.physicalAddress, isWrite);
        totalLatencyNs += this.latencies.l1Hit;
        stepLatencies.push({ name: 'L1 Access', latency: this.latencies.l1Hit });

        let l2Result = null;
        let ramAccessed = false;

        if (l1Result.hit) {
            flowSteps.push({
                stage: 'L1',
                title: 'L1 CACHE HIT! ⚡',
                status: 'hit',
                detail: `Found in L1 Cache (Set ${l1Result.decomp.setIndex}, Way ${l1Result.hitWay}). Data returned to CPU in ~1 ns!`
            });
        } else {
            flowSteps.push({
                stage: 'L1',
                title: `L1 CACHE MISS (${l1Result.missReason.toUpperCase()})`,
                status: 'miss',
                detail: `Miss in L1. Tag ${l1Result.decomp.tagHex} not present in Set ${l1Result.decomp.setIndex}. Forwarding to L2 Cache.`
            });

            // 5. L2 Cache Lookup
            l2Result = this.l2.access(vmResult.physicalAddress, isWrite);
            totalLatencyNs += this.latencies.l2Hit;
            stepLatencies.push({ name: 'L2 Access', latency: this.latencies.l2Hit });

            if (l2Result.hit) {
                flowSteps.push({
                    stage: 'L2',
                    title: 'L2 CACHE HIT! 🚀',
                    status: 'hit',
                    detail: `Found in L2 Cache (Set ${l2Result.decomp.setIndex}, Way ${l2Result.hitWay}). Block fetched and installed into L1.`
                });
            } else {
                flowSteps.push({
                    stage: 'L2',
                    title: `L2 CACHE MISS (${l2Result.missReason.toUpperCase()})`,
                    status: 'miss',
                    detail: `Miss in L2 as well. Request sent across system bus to Main Memory (DRAM).`
                });

                // 6. Main Memory (RAM) Access
                ramAccessed = true;
                totalLatencyNs += this.latencies.ramAccess;
                stepLatencies.push({ name: 'RAM Bus Access', latency: this.latencies.ramAccess });
                flowSteps.push({
                    stage: 'RAM',
                    title: 'Main Memory (DRAM) Access',
                    status: 'ram',
                    detail: `Read 64-byte block from physical memory at ~100 ns. Filled into L2 and L1 caches.`
                });
            }
        }

        this.totalAccumulatedLatencyNs += totalLatencyNs;
        const amat = (this.totalAccumulatedLatencyNs / this.totalMemoryAccesses).toFixed(1);

        const executionSummary = {
            virtualAddress: hexVA,
            physicalAddress: vmResult.physicalAddressHex,
            isWrite,
            vmResult,
            l1Result,
            l2Result,
            ramAccessed,
            totalLatencyNs,
            stepLatencies,
            flowSteps,
            amat
        };

        this.accessHistory.unshift(executionSummary);
        if (this.accessHistory.length > 50) this.accessHistory.pop();

        return executionSummary;
    }
}

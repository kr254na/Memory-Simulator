# MemSim Studio: Interactive COA & Operating Systems Memory Architecture Platform

> An educational, full-stack visual simulation platform designed to demystify how modern computer hardware and operating systems manage memory—from the CPU program counter down to physical transistors and swap disks.

---

## 🌟 Why This Project Was Built
In traditional Computer Organization and Architecture (COA) and Operating Systems (OS) courses, memory is usually taught with static textbook diagrams. However, memory is **deeply concurrent, dynamic, and spans microarchitecture (hardware) to operating systems (software)**.

**MemSim** unites both domains into an end-to-end interactive laboratory.

---

## 🚀 Core Features & Architectural Labs

### 1. 🛣️ The Memory Journey (Unified Datapath & Detective Narrator)
* Models the real-time voyage of an instruction:
  $$\text{CPU (Virtual Address)} \longrightarrow \text{TLB} \longrightarrow \text{Page Table} \longrightarrow \text{Page Fault \& Swap Disk} \longrightarrow \text{L1 Cache} \longrightarrow \text{L2 Cache} \longrightarrow \text{Physical RAM}$$
* **The "Detective" Narrator:** Translates dry hex numbers into plain-English stories explaining every single cycle, tag match, TLB miss, and kernel trap.

### 2. ⚡ Cache Architecture Lab (L1 & L2)
* **Configurable Geometries:** Direct-Mapped, $N$-Way Set Associative (2-way, 4-way), and Fully Associative.
* **The 3 C's of Misses:** Automatically classifies cache misses into **Compulsory (Cold)**, **Capacity**, or **Conflict** misses.
* **Replacement Policies:** LRU (Least Recently Used), FIFO (First In First Out), and LFU (Least Frequently Used).
* **Write Strategies:** Write-Back + Write-Allocate vs. Write-Through + No-Write-Allocate.

### 3. 📄 Virtual Memory, Paging & Swapping Lab
* **Translation Lookaside Buffer (TLB):** Fast associative silicon cache storing recent VPN $\rightarrow$ Frame translations.
* **Multi-Entry Page Table:** Tracks Valid Presence Bit, Dirty Modification Bit, Reference Bit, and Swap Disk sectors.
* **Page Fault Handling:** Visualizes kernel traps, disk page retrieval, and dirty frame writebacks.
* **Replacement Algorithms:**
  * **Clock (Second-Chance) Algorithm:** Watch the rotating clock hand examine and clear reference bits in real time!
  * **LRU & FIFO:** Demonstrates eviction behavior and Belady's Anomaly.

### 4. 🧩 Memory Allocation & Fragmentation Lab
* **Dynamic Contiguous Partitioning vs. Paging:**
  * Compares variable-sized allocation (Contiguous) with fixed 4 KB page frames (Paging).
* **Allocation Placement Strategies:**
  * **First-Fit:** Allocates the first available hole large enough.
  * **Best-Fit:** Allocates the smallest hole that fits, demonstrating how it creates tiny unusable slivers.
  * **Worst-Fit:** Allocates the largest hole.
* **External Fragmentation Visualizer:**
  * Detects when total free memory is large enough to satisfy a process, but the memory is non-contiguous, triggering an external fragmentation failure.
* **Memory Compaction / Defragmentation:**
  * Interactive one-click compaction that shifts all allocated memory blocks down, coalescing all scattered holes into one contiguous free block.
* **Internal Fragmentation Calculator:**
  * Shows how Paging eliminates external fragmentation at the cost of wasted bytes in the final page frame.

### 5. 📐 Dynamic Address Bit Anatomy Calculator
* Real-time sliders for Cache Capacity, Block Size, Set Associativity, and Page Size.
* Dynamically calculates and displays:
  $$\text{Offset Bits} = \log_2(\text{Block Size})$$
  $$\text{Index Bits} = \log_2(\text{Number of Sets})$$
  $$\text{Tag Bits} = 32 - (\text{Index Bits} + \text{Offset Bits})$$
  $$\text{Page Offset Bits} = \log_2(\text{Page Size})$$
  $$\text{VPN Bits} = 32 - \text{Page Offset Bits}$$

### 6. 📖 Memory Architecture & Theory Encyclopedia
* **Comprehensive Theoretical Guide:** Detailed, rigorous exploration of fundamental computer organization, architecture (COA), and operating systems (OS) memory concepts:
  * **Memory Hierarchy & AMAT:** The Memory Wall problem, quantitative multi-level AMAT formulations, and temporal vs spatial locality code patterns.
  * **CPU Caches & Associativity:** Address decomposition (Tag, Set Index, Offset), Direct-Mapped vs $N$-Way Set Associative vs Fully Associative comparisons, replacement policies (LRU, FIFO, LFU), write strategies (Write-Through vs Write-Back, Write-Allocate), and the 3 C's / 4 C's of cache misses.
  * **Virtual Memory & MMU:** Foundational principles (isolation, protection, overcommit), VPN-to-PFN translation mechanics, TLB hit/miss lifecycles, and Page Table Entry (PTE) hardware control bits.
  * **Paging & Fault Lifecycles:** 7-step hardware interrupt and OS trap sequence, replacement algorithms (Clock second-chance, LRU, FIFO), working set models, and Bélády's Anomaly.
  * **Dynamic Memory Allocation:** Heap management mechanics (`malloc`, `free`, brk/mmap), free list placement strategies (First-Fit, Best-Fit, Worst-Fit, Next-Fit, Buddy Allocator), internal vs external fragmentation, and compaction.
  * **Physical Silicon Hardware:** 6T SRAM bistable latches vs 1T-1C DRAM capacitive cells, refresh cycles, dual-channel interleaving, and Direct Memory Access (DMA).
  * **Non-Volatile ROM Taxonomy & Comparison:** Comprehensive comparison matrix covering Masked ROM (MROM), PROM, EPROM, EEPROM, and Flash Memory (NOR vs NAND), including programming/erasure physics, granularity, P/E endurance cycles, and the cold-boot reset vector (`0xFFFFFFF0`).
* **Interactive Search & Category Filtering:** Real-time search by keyword and category pills to instantly jump between core memory topics.

---

## 🛠️ How to Run
Because MemSim is built with modular ES6 JavaScript (`type="module"`), modern browsers require it to be served via a local web server (to comply with browser CORS security rules for local ES modules):

1. **Option 1: Python HTTP Server (Built-in)**
   ```bash
   python -m http.server 8080
   ```
2. **Option 2: Node.js / NPX**
   ```bash
   npx serve .
   ```
3. **Option 3: VS Code / IDE Live Server Extension**
   Right-click `index.html` and select **"Open with Live Server"**.

4. Open `http://localhost:8080` in Chrome, Edge, Firefox, or Safari.

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
* **The "Detective" Narrator:** Translates dry hex numbers into plain-English stories explaining every single cycle, tag match, TLB miss, and kernel trap with human-scale analogies.

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

### 5. 💾 Semiconductor ROM (Read-Only Memory) Lab
* **Full Taxonomy Modeling:**
  * **Masked ROM (MROM):** Hardwired photolithography silicon mask; immutable.
  * **PROM:** One-Time Programmable fusible links. Interactive matrix allows applying $V_{pp} = 12.5\text{V}$ programming pulses to vaporize fuses ($1 \rightarrow 0$ permanently).
  * **EPROM:** Floating-gate avalanche injection with interactive **UV-C Quartz Window Erasing** (254 nm beam resets all bytes to `0xFF`).
  * **EEPROM:** Fowler-Nordheim electrical quantum tunneling for in-circuit byte-level reprogramming with P/E endurance cycle tracking.
  * **Flash Memory (NOR / NAND):** Block/sector electrical erasure before write.
* **Why Computers Need ROM (x86 Cold Boot Sequence):**
  * Interactive step-by-step bootloader from CPU Reset Vector (`0xFFFFFFF0`), POST hardware diagnostics, DRAM initialization, and MBR load to OS handoff.
* **Hardware Write-Protection Exception Simulator:**
  * Simulates CPU `STORE` attempts to ROM address space triggering bus fault traps and General Protection Faults (GPF).
* **Comprehensive Technology Comparison Matrix:**
  * Compares volatility, physical mechanisms, erasure methods, granularity, and modern applications.

### 6. 📐 Dynamic Address Bit Anatomy Calculator
* Real-time sliders for Cache Capacity, Block Size, Set Associativity, and Page Size.
* Dynamically calculates and displays:
  $$\text{Offset Bits} = \log_2(\text{Block Size})$$
  $$\text{Index Bits} = \log_2(\text{Number of Sets})$$
  $$\text{Tag Bits} = 32 - (\text{Index Bits} + \text{Offset Bits})$$
  $$\text{Page Offset Bits} = \log_2(\text{Page Size})$$
  $$\text{VPN Bits} = 32 - \text{Page Offset Bits}$$

### 7. ⏳ The "Human-Scale" Time Warp
* Scales CPU clock cycle latencies to human time ($1\text{ ns} = 1\text{ second}$):
  * **L1 Cache ($1\text{ ns}$):** 1 heartbeat (1 second)
  * **L2 Cache ($4\text{ ns}$):** 1 deep breath (4 seconds)
  * **DRAM RAM ($100\text{ ns}$):** 1.6 minutes (fetching coffee)
  * **Disk Page Fault ($10\text{ ms}$):** **3.8 MONTHS of waiting!**

### 8. 🎓 Guided Masterclass Lessons
* Built-in interactive scenarios demonstrating:
  1. **Spatial Locality:** Sequential stride yielding an 87.5% L1 hit rate.
  2. **Cache Conflict Thrashing:** Two addresses mapping to the same set in Direct-Mapped cache causing 0% hit rate.
  3. **Page Fault Crisis:** Deliberate unmapped memory access triggering an OS kernel trap.
  4. **External Fragmentation Breakdown:** A 200 KB process failing despite 350 KB of free memory, followed by compaction.
  5. **Belady's Anomaly:** Proof that FIFO can cause *more* page faults with *more* memory frames.

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

/**
 * Semiconductor ROM Simulation Engine
 * Simulates:
 * 1. Masked ROM (MROM) - Factory hardwired, immutable
 * 2. PROM (Programmable ROM) - Fusible links burned permanently (1 -> 0 only)
 * 3. EPROM (Erasable PROM) - Floating-gate avalanche injection with UV light quartz window erasure
 * 4. EEPROM (Electrically Erasable PROM) - Byte-level Fowler-Nordheim electrical tunneling & endurance wear
 * 5. Flash Memory (NOR / NAND) - Block/Sector-level electrical erase before write
 * 6. x86 BIOS / UEFI Cold Boot Sequence (Reset Vector 0xFFFF0 -> POST -> MBR handoff)
 */

export class RomSimulator {
    constructor(options = {}) {
        this.size = options.size || 16; // 16 bytes for clear visual layout
        this.activeType = options.activeType || 'PROM'; // 'MROM', 'PROM', 'EPROM', 'EEPROM', 'FLASH'
        this.bootStep = 0; // 0 to 6 for cold boot sequence
        this.isUvErasing = false;

        // Realistic legacy x86 BIOS bootloader firmware bytecode
        this.defaultFirmware = [
            { addr: 0x00, hex: 0xEA, opcode: 'JMP FAR 0xF000:E05B', desc: 'CPU Reset Vector jump to BIOS POST entry point' },
            { addr: 0x01, hex: 0x5B, opcode: 'MOV AX, 0x0000',     desc: 'Initialize base segment registers' },
            { addr: 0x02, hex: 0xE0, opcode: 'MOV DS, AX',         desc: 'Point data segment to base memory' },
            { addr: 0x03, hex: 0xFA, opcode: 'CLI',                desc: 'Disable external hardware maskable interrupts' },
            { addr: 0x04, hex: 0x31, opcode: 'XOR AX, AX',         desc: 'Clear accumulator register for self-test' },
            { addr: 0x05, hex: 0xC0, opcode: 'OUT 0x80, AL',       desc: 'POST Diagnostic Port 80h checkpoint #1' },
            { addr: 0x06, hex: 0xCD, opcode: 'INT 0x12',           desc: 'Get Conventional Memory Size from CMOS' },
            { addr: 0x07, hex: 0x12, opcode: 'TEST AX, AX',        desc: 'Verify DRAM chip presence and refresh cycles' },
            { addr: 0x08, hex: 0xB8, opcode: 'MOV AX, 0x0003',     desc: 'Select standard 80x25 text video mode' },
            { addr: 0x09, hex: 0x03, opcode: 'INT 0x10',           desc: 'Video BIOS Interrupt - initialize display' },
            { addr: 0x0A, hex: 0x7C, opcode: 'MOV DX, 0x0080',     desc: 'Set boot drive index to primary drive (80h)' },
            { addr: 0x0B, hex: 0x8E, opcode: 'MOV BX, 0x7C00',     desc: 'Target RAM buffer for MBR (0x7C00)' },
            { addr: 0x0C, hex: 0xD8, opcode: 'MOV CX, 0x0001',     desc: 'Read Cylinder 0, Head 0, Sector 1' },
            { addr: 0x0D, hex: 0xCD, opcode: 'INT 0x13',           desc: 'Disk I/O Interrupt - read boot sector into RAM' },
            { addr: 0x0E, hex: 0x13, opcode: 'JC 0xE000',          desc: 'If disk read error, jump to ROM Basic' },
            { addr: 0x0F, hex: 0xEA, opcode: 'JMP 0x0000:7C00',     desc: 'Handoff CPU control to OS Bootloader in RAM!' }
        ];

        this.init();
    }

    init() {
        this.memory = this.defaultFirmware.map(item => ({
            addr: item.addr,
            val: item.hex,
            factoryVal: item.hex,
            opcode: item.opcode,
            desc: item.desc,
            bits: this.byteToBits(item.hex),
            fusesBlown: new Array(8).fill(false), // for PROM tracking
            writeCount: 0 // for endurance tracking
        }));

        this.stats = {
            totalReads: 0,
            writeAttempts: 0,
            writeViolations: 0,
            successfulWrites: 0,
            uvErases: 0
        };

        this.bootSequence = [
            { step: 1, title: '1. CPU Reset Vector Fetched', vector: '0xFFFFFFF0 (or F000:FFF0)', detail: 'Power good signal received. CPU registers initialize and instruction pointer points directly into non-volatile ROM silicon.' },
            { step: 2, title: '2. Power-On Self Test (POST)', vector: 'Port 80h Diagnostics', detail: 'CPU executes hardware verification routines from ROM: testing registers, DMA controller, and timer chip.' },
            { step: 3, title: '3. DRAM Memory Controller Initialization', vector: 'RAM Refresh Enabled', detail: 'Volatile RAM is unusable at cold start. ROM firmware activates the memory controller and validates physical DRAM.' },
            { step: 4, title: '4. Video & Option ROM Enumeration', vector: 'VGA BIOS 0xC0000', detail: 'Firmware scans bus for expansion ROMs (PCIe, GPU video BIOS) and initializes text display.' },
            { step: 5, title: '5. MBR Boot Sector Loaded to RAM', vector: 'Disk Sector 0 ➔ 0x7C00', detail: 'Firmware executes INT 13h to copy 512-byte Master Boot Record from disk into physical RAM at address 0x7C00.' },
            { step: 6, title: '6. CPU Handoff to OS Kernel', vector: 'JMP 0x0000:7C00', detail: 'ROM role complete! CPU jumps out of ROM into RAM. The Operating System kernel takes full control of the machine.' }
        ];

        this.bootStep = 0;
    }

    byteToBits(byteVal) {
        return (byteVal >>> 0).toString(2).padStart(8, '0').split('').map(b => parseInt(b));
    }

    bitsToByte(bitsArray) {
        return parseInt(bitsArray.join(''), 2);
    }

    reset() {
        this.init();
    }

    setType(type) {
        this.activeType = type;
        if (type === 'MROM') {
            // Restore exact factory firmware
            this.memory.forEach(m => {
                m.val = m.factoryVal;
                m.bits = this.byteToBits(m.factoryVal);
                m.fusesBlown.fill(false);
            });
        }
    }

    /**
     * Read from ROM address
     */
    read(addr) {
        this.stats.totalReads++;
        const entry = this.memory.find(m => m.addr === addr);
        if (!entry) return null;
        return {
            success: true,
            addr,
            addrHex: '0x' + addr.toString(16).padStart(4, '0').toUpperCase(),
            valHex: '0x' + entry.val.toString(16).padStart(2, '0').toUpperCase(),
            bits: entry.bits,
            opcode: entry.opcode,
            desc: entry.desc
        };
    }

    /**
     * Attempt to burn a fusible link in PROM
     * In PROM, unblown fuse = 1, blown fuse = 0.
     * High programming voltage Vpp (12.5V) permanently blows fuse to 0!
     * Once blown, it CANNOT be converted back to 1.
     */
    burnPromFuse(addr, bitIndex) {
        this.stats.writeAttempts++;
        const entry = this.memory.find(m => m.addr === addr);
        if (!entry) return { success: false, reason: 'Invalid address' };

        if (this.activeType !== 'PROM') {
            return { success: false, reason: `Fuse burning is only applicable to PROM. Current mode is ${this.activeType}.` };
        }

        const currentBit = entry.bits[bitIndex];
        if (currentBit === 0) {
            return {
                success: false,
                reason: `🚨 FUSE ALREADY BLOWN! Bit ${7 - bitIndex} at address 0x${addr.toString(16).toUpperCase()} has already been burned to 0. Nichrome/polysilicon fusible links cannot be repaired.`
            };
        }

        // Blow the fuse!
        entry.bits[bitIndex] = 0;
        entry.fusesBlown[bitIndex] = true;
        entry.val = this.bitsToByte(entry.bits);
        entry.writeCount++;
        this.stats.successfulWrites++;

        return {
            success: true,
            message: `⚡ HIGH VOLTAGE Vpp (12.5V) PULSE APPLIED! Fusible link for Bit ${7 - bitIndex} vaporized. Bit state permanently latched to 0.`
        };
    }

    /**
     * Simulate EPROM UV Quartz Window Erasure
     * Shining Ultraviolet Light (~254 nm) for 20 minutes discharges floating-gate electrons,
     * resetting ALL bits in the chip back to 1 (0xFF).
     */
    eraseEpromUv() {
        this.stats.uvErases++;
        this.memory.forEach(entry => {
            entry.bits = [1, 1, 1, 1, 1, 1, 1, 1];
            entry.val = 0xFF;
            entry.fusesBlown.fill(false);
            entry.opcode = 'NOP / UNPROGRAMMED (0xFF)';
            entry.desc = 'Blank floating gate state (electrons discharged via UV radiation)';
        });

        return {
            success: true,
            message: '☀️ 254 nm UV-C radiation penetrated quartz window! Floating gate oxide charge neutralized. All 16 bytes reset to 0xFF (binary 11111111).'
        };
    }

    /**
     * Simulate EEPROM Byte-level Electrical Erase and Write
     * Fowler-Nordheim tunneling allows in-circuit byte-level alteration.
     */
    writeEepromByte(addr, newByteVal) {
        this.stats.writeAttempts++;
        const entry = this.memory.find(m => m.addr === addr);
        if (!entry) return { success: false, reason: 'Invalid address' };

        if (this.activeType !== 'EEPROM') {
            return { success: false, reason: `Byte electrical write only valid in EEPROM mode (current: ${this.activeType}).` };
        }

        const clamped = Math.max(0, Math.min(255, newByteVal));
        entry.val = clamped;
        entry.bits = this.byteToBits(clamped);
        entry.writeCount++;
        this.stats.successfulWrites++;

        return {
            success: true,
            message: `⚡ Fowler-Nordheim electrical tunneling completed! Byte at 0x${addr.toString(16).toUpperCase()} reprogrammed to 0x${clamped.toString(16).padStart(2, '0').toUpperCase()}. P/E write count: ${entry.writeCount} / 100,000 cycles.`
        };
    }

    /**
     * Simulate Flash Memory Block Erase & Write
     * Flash memory must erase entire sectors (all bits set to 1) before writing 0s!
     */
    writeFlashSector(addr, newByteVal) {
        this.stats.writeAttempts++;
        const entry = this.memory.find(m => m.addr === addr);
        if (!entry) return { success: false, reason: 'Invalid address' };

        if (this.activeType !== 'FLASH') {
            return { success: false, reason: `Flash block erase/write only valid in Flash mode.` };
        }

        const clamped = Math.max(0, Math.min(255, newByteVal));
        entry.val = clamped;
        entry.bits = this.byteToBits(clamped);
        entry.writeCount++;
        this.stats.successfulWrites++;

        return {
            success: true,
            message: `⚡ Flash Block Erase completed (sector reset to 0xFF), followed by hot-carrier injection write of 0x${clamped.toString(16).padStart(2, '0').toUpperCase()} at offset 0x${addr.toString(16).toUpperCase()}.`
        };
    }

    /**
     * Simulate CPU Write Violation Exception (Bus Fault)
     * Demonstrates what happens when software tries to write to ROM memory space
     */
    attemptCpuStore(addr, data) {
        this.stats.writeAttempts++;
        this.stats.writeViolations++;
        return {
            success: false,
            exception: '🚨 HARDWARE BUS FAULT: READ-ONLY MEMORY VIOLATION',
            detail: `CPU executed STORE instruction to address 0x${addr.toString(16).padStart(4, '0').toUpperCase()} with data 0x${data.toString(16).padStart(2, '0').toUpperCase()}. The Memory Controller rejected the asserted Write-Enable (WE#) line because the address maps to non-volatile ROM space. General Protection Fault (Interrupt 0x0D) raised!`,
            penalty: 'CPU Trapped into Kernel Panic / BIOS Hardware Abort'
        };
    }

    stepBoot() {
        if (this.bootStep >= this.bootSequence.length) {
            this.bootStep = 0; // restart
        } else {
            this.bootStep++;
        }
        return this.getBootStatus();
    }

    resetBoot() {
        this.bootStep = 0;
        return this.getBootStatus();
    }

    getBootStatus() {
        const current = this.bootStep > 0 ? this.bootSequence[this.bootStep - 1] : null;
        return {
            step: this.bootStep,
            totalSteps: this.bootSequence.length,
            isComplete: this.bootStep === this.bootSequence.length,
            currentStepData: current,
            sequence: this.bootSequence
        };
    }
}

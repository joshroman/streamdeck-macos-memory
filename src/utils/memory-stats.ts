import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

const PAGE_SIZE = 16384; // bytes per page on modern macOS

export interface MemoryStats {
    // All values in GB
    physicalMemory: number;
    memoryUsed: number;
    appMemory: number;
    wiredMemory: number;
    compressed: number;
    cachedFiles: number;
    swapUsed: number;
    // Percentages (0-100)
    memoryUsedPercent: number;
    appMemoryPercent: number;
    swapPercent: number;
}

interface VmStatValues {
    pagesFree: number;
    pagesActive: number;
    pagesInactive: number;
    pagesSpeculative: number;
    pagesWired: number;
    pagesCompressor: number;
}

async function getVmStat(): Promise<VmStatValues> {
    const { stdout } = await execFileAsync("vm_stat");

    const getValue = (key: string): number => {
        const match = stdout.match(new RegExp(`${key}:\\s+(\\d+)`));
        return match ? parseInt(match[1], 10) : 0;
    };

    return {
        pagesFree: getValue("Pages free"),
        pagesActive: getValue("Pages active"),
        pagesInactive: getValue("Pages inactive"),
        pagesSpeculative: getValue("Pages speculative"),
        pagesWired: getValue("Pages wired down"),
        pagesCompressor: getValue("Pages stored in compressor"),
    };
}

async function getPhysicalMemory(): Promise<number> {
    const { stdout } = await execFileAsync("sysctl", ["hw.memsize"]);
    const match = stdout.match(/hw\.memsize:\s+(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
}

async function getSwapUsage(): Promise<{ used: number; total: number }> {
    const { stdout } = await execFileAsync("sysctl", ["vm.swapusage"]);
    const usedMatch = stdout.match(/used\s*=\s*([\d.]+)M/);
    const totalMatch = stdout.match(/total\s*=\s*([\d.]+)M/);

    return {
        used: usedMatch ? parseFloat(usedMatch[1]) / 1024 : 0, // Convert MB to GB
        total: totalMatch ? parseFloat(totalMatch[1]) / 1024 : 0,
    };
}

function pagesToGB(pages: number): number {
    return (pages * PAGE_SIZE) / (1024 * 1024 * 1024);
}

export async function getMemoryStats(): Promise<MemoryStats> {
    // Fetch all data in parallel
    const [vmStat, physicalBytes, swap] = await Promise.all([
        getVmStat(),
        getPhysicalMemory(),
        getSwapUsage(),
    ]);

    const physicalMemory = physicalBytes / (1024 * 1024 * 1024);
    const totalPages = physicalBytes / PAGE_SIZE;

    // Calculate derived metrics
    const appMemory = pagesToGB(vmStat.pagesActive);
    const wiredMemory = pagesToGB(vmStat.pagesWired);
    const compressed = pagesToGB(vmStat.pagesCompressor);
    const cachedFiles = pagesToGB(vmStat.pagesInactive + vmStat.pagesSpeculative);
    const freeMemory = pagesToGB(vmStat.pagesFree);
    const memoryUsed = physicalMemory - freeMemory;

    return {
        physicalMemory,
        memoryUsed,
        appMemory,
        wiredMemory,
        compressed,
        cachedFiles,
        swapUsed: swap.used,
        memoryUsedPercent: (memoryUsed / physicalMemory) * 100,
        appMemoryPercent: (vmStat.pagesActive / totalPages) * 100,
        swapPercent: swap.total > 0 ? (swap.used / swap.total) * 100 : 0,
    };
}

export type MetricType =
    | "physical"
    | "memoryUsed"
    | "appMemory"
    | "wired"
    | "compressed"
    | "cached"
    | "swap";

export interface MetricConfig {
    label: string;
    shortLabel: string;
    getValue: (stats: MemoryStats) => number;
    getPercent: (stats: MemoryStats) => number;
    getColor: (valueGB: number, stats: MemoryStats) => string;
    showRing: boolean;
}

const GREEN = "#33DD33";
const ORANGE = "#FFAA00";
const RED = "#FF3333";
const BLUE = "#3399FF";

export const METRIC_CONFIGS: Record<MetricType, MetricConfig> = {
    physical: {
        label: "Physical",
        shortLabel: "RAM",
        getValue: (s) => s.physicalMemory,
        getPercent: () => 100, // Always full
        getColor: () => BLUE, // Static blue
        showRing: false,
    },
    memoryUsed: {
        label: "Memory Used",
        shortLabel: "USED",
        getValue: (s) => s.memoryUsed,
        getPercent: (s) => s.memoryUsedPercent,
        getColor: (_, s) => {
            if (s.memoryUsedPercent > 90) return RED;
            if (s.memoryUsedPercent > 70) return ORANGE;
            return GREEN;
        },
        showRing: true,
    },
    appMemory: {
        label: "App Memory",
        shortLabel: "APP",
        getValue: (s) => s.appMemory,
        getPercent: (s) => s.appMemoryPercent,
        getColor: (_, s) => {
            if (s.appMemoryPercent > 75) return RED;
            if (s.appMemoryPercent > 50) return ORANGE;
            return GREEN;
        },
        showRing: true,
    },
    wired: {
        label: "Wired Memory",
        shortLabel: "WIRED",
        getValue: (s) => s.wiredMemory,
        getPercent: (s) => (s.wiredMemory / s.physicalMemory) * 100,
        getColor: (gb) => {
            if (gb > 6) return RED;
            if (gb > 4) return ORANGE;
            return GREEN;
        },
        showRing: true,
    },
    compressed: {
        label: "Compressed",
        shortLabel: "COMP",
        getValue: (s) => s.compressed,
        getPercent: (s) => (s.compressed / s.physicalMemory) * 100,
        getColor: (gb) => {
            if (gb > 8) return RED;
            if (gb > 4) return ORANGE;
            return GREEN;
        },
        showRing: true,
    },
    cached: {
        label: "Cached Files",
        shortLabel: "CACHE",
        getValue: (s) => s.cachedFiles,
        getPercent: (s) => (s.cachedFiles / s.physicalMemory) * 100,
        getColor: () => GREEN, // Cached is always good
        showRing: true,
    },
    swap: {
        label: "Swap Used",
        shortLabel: "SWAP",
        getValue: (s) => s.swapUsed,
        getPercent: (s) => s.swapPercent,
        getColor: (gb) => {
            if (gb >= 4) return RED;
            if (gb >= 2) return ORANGE;
            return GREEN;
        },
        showRing: true,
    },
};

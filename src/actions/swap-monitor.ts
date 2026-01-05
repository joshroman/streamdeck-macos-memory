import streamDeck, { action, SingletonAction, WillAppearEvent, WillDisappearEvent, KeyDownEvent } from "@elgato/streamdeck";
import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);
const logger = streamDeck.logger.createScope("SwapMonitor");

interface SwapInfo {
    usedGB: number;
    totalGB: number;
    percent: number;
}

/**
 * Stream Deck action that monitors macOS swap usage and displays it
 * as a color-coded progress ring.
 */
class SwapMonitorBase extends SingletonAction {
    private intervals: Map<string, NodeJS.Timeout> = new Map();

    override async onWillAppear(ev: WillAppearEvent): Promise<void> {
        const actionId = ev.action.id;
        logger.info(`onWillAppear called for action ${actionId}`);

        // Initial update
        await this.updateDisplay(ev);

        // Start polling every 2 seconds
        const interval = setInterval(async () => {
            try {
                await this.updateDisplay(ev);
            } catch (error) {
                logger.error("Error updating swap display:", error);
            }
        }, 2000);

        this.intervals.set(actionId, interval);
        logger.info(`Polling started for action ${actionId}`);
    }

    override async onWillDisappear(ev: WillDisappearEvent): Promise<void> {
        const actionId = ev.action.id;
        const interval = this.intervals.get(actionId);

        if (interval) {
            clearInterval(interval);
            this.intervals.delete(actionId);
        }
    }

    override async onKeyDown(_ev: KeyDownEvent): Promise<void> {
        try {
            await execFileAsync("open", ["-a", "Activity Monitor"]);
        } catch (error) {
            console.error("Error opening Activity Monitor:", error);
        }
    }

    private async updateDisplay(ev: WillAppearEvent): Promise<void> {
        const swap = await this.getSwapInfo();
        logger.info(`Swap info: ${swap.usedGB.toFixed(2)}GB (${swap.percent.toFixed(1)}%)`);
        const svg = this.generateProgressRing(swap.usedGB, swap.percent);
        logger.debug(`Setting image with SVG (${svg.length} chars)`);
        await ev.action.setImage(svg);
        logger.info("Image set successfully");
    }

    private async getSwapInfo(): Promise<SwapInfo> {
        try {
            const { stdout } = await execFileAsync("sysctl", ["vm.swapusage"]);

            const usedMatch = stdout.match(/used\s*=\s*([\d.]+)M/);
            const totalMatch = stdout.match(/total\s*=\s*([\d.]+)M/);

            const usedMB = usedMatch ? parseFloat(usedMatch[1]) : 0;
            const totalMB = totalMatch ? parseFloat(totalMatch[1]) : 1;

            return {
                usedGB: usedMB / 1024,
                totalGB: totalMB / 1024,
                percent: totalMB > 0 ? (usedMB / totalMB) * 100 : 0
            };
        } catch (error) {
            console.error("Error getting swap info:", error);
            return { usedGB: 0, totalGB: 0, percent: 0 };
        }
    }

    private generateProgressRing(usedGB: number, percent: number): string {
        const size = 144;
        const cx = size / 2;
        const cy = size / 2;
        const radius = 54;
        const stroke = 12;
        const circumference = 2 * Math.PI * radius;
        const dashOffset = circumference * (1 - percent / 100);

        let color = "#33DD33";
        if (usedGB >= 4) {
            color = "#FF3333";
        } else if (usedGB >= 2) {
            color = "#FFAA00";
        }

        const label = usedGB >= 1
            ? `${usedGB.toFixed(1)}GB`
            : `${Math.round(usedGB * 1024)}MB`;

        // Build SVG and return as base64 data URI
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}"><rect width="${size}" height="${size}" fill="black"/><circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="#333333" stroke-width="${stroke}"/><circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-dasharray="${circumference}" stroke-dashoffset="${dashOffset}" stroke-linecap="round" transform="rotate(-90 ${cx} ${cy})"/><text x="${cx}" y="${cy + 8}" text-anchor="middle" fill="white" font-size="24" font-weight="bold" font-family="sans-serif">${label}</text></svg>`;

        // Stream Deck expects a base64-encoded data URI
        const base64 = Buffer.from(svg).toString("base64");
        return `data:image/svg+xml;base64,${base64}`;
    }
}

// Apply the action decorator manually (esbuild doesn't support native decorators)
export const SwapMonitor = action({ UUID: "com.joshroman.macos-memory.swap" })(
    SwapMonitorBase,
    { kind: "class", name: "SwapMonitor" } as ClassDecoratorContext
);

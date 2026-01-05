import streamDeck, { SingletonAction, WillAppearEvent, WillDisappearEvent, KeyDownEvent } from "@elgato/streamdeck";
import { execFile } from "child_process";
import { promisify } from "util";
import { getMemoryStats, MetricType, METRIC_CONFIGS, MemoryStats } from "../utils/memory-stats";

const execFileAsync = promisify(execFile);

/**
 * Base class for memory monitoring actions.
 * Subclasses specify which metric to display.
 */
export abstract class BaseMemoryAction extends SingletonAction {
    protected abstract metricType: MetricType;
    protected intervals: Map<string, NodeJS.Timeout> = new Map();
    protected logger = streamDeck.logger.createScope("MemoryMonitor");

    override async onWillAppear(ev: WillAppearEvent): Promise<void> {
        const actionId = ev.action.id;
        this.logger.info(`${this.metricType} action appeared: ${actionId}`);

        // Initial update
        await this.updateDisplay(ev);

        // Start polling every 2 seconds
        const interval = setInterval(async () => {
            try {
                await this.updateDisplay(ev);
            } catch (error) {
                this.logger.error(`Error updating ${this.metricType} display:`, error);
            }
        }, 2000);

        this.intervals.set(actionId, interval);
    }

    override async onWillDisappear(ev: WillDisappearEvent): Promise<void> {
        const actionId = ev.action.id;
        const interval = this.intervals.get(actionId);

        if (interval) {
            clearInterval(interval);
            this.intervals.delete(actionId);
            this.logger.info(`${this.metricType} polling stopped: ${actionId}`);
        }
    }

    override async onKeyDown(_ev: KeyDownEvent): Promise<void> {
        try {
            await execFileAsync("open", ["-a", "Activity Monitor"]);
        } catch (error) {
            this.logger.error("Error opening Activity Monitor:", error);
        }
    }

    protected async updateDisplay(ev: WillAppearEvent): Promise<void> {
        const stats = await getMemoryStats();
        const config = METRIC_CONFIGS[this.metricType];

        const valueGB = config.getValue(stats);
        const percent = config.getPercent(stats);
        const color = config.getColor(valueGB, stats);

        const svg = this.generateImage(valueGB, percent, color, config.shortLabel, config.showRing);
        await ev.action.setImage(svg);
    }

    protected generateImage(
        valueGB: number,
        percent: number,
        color: string,
        label: string,
        showRing: boolean
    ): string {
        const size = 144;
        const cx = size / 2;
        const cy = size / 2;

        // Format value
        const valueText = valueGB >= 10
            ? `${valueGB.toFixed(0)}GB`
            : valueGB >= 1
                ? `${valueGB.toFixed(1)}GB`
                : `${Math.round(valueGB * 1024)}MB`;

        if (!showRing) {
            // Static display without ring (for Physical Memory)
            const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
                <rect width="${size}" height="${size}" fill="black"/>
                <text x="${cx}" y="50" text-anchor="middle" fill="#888888" font-size="18" font-weight="bold" font-family="sans-serif">${label}</text>
                <text x="${cx}" y="${cy + 10}" text-anchor="middle" fill="${color}" font-size="28" font-weight="bold" font-family="sans-serif">${valueText}</text>
            </svg>`;

            const base64 = Buffer.from(svg).toString("base64");
            return `data:image/svg+xml;base64,${base64}`;
        }

        // Progress ring display
        const radius = 54;
        const stroke = 12;
        const circumference = 2 * Math.PI * radius;
        const dashOffset = circumference * (1 - Math.min(percent, 100) / 100);

        const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}">
            <rect width="${size}" height="${size}" fill="black"/>
            <circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="#333333" stroke-width="${stroke}"/>
            <circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-dasharray="${circumference}" stroke-dashoffset="${dashOffset}" stroke-linecap="round" transform="rotate(-90 ${cx} ${cy})"/>
            <text x="${cx}" y="38" text-anchor="middle" fill="#888888" font-size="16" font-weight="bold" font-family="sans-serif">${label}</text>
            <text x="${cx}" y="${cy + 12}" text-anchor="middle" fill="white" font-size="22" font-weight="bold" font-family="sans-serif">${valueText}</text>
        </svg>`;

        const base64 = Buffer.from(svg).toString("base64");
        return `data:image/svg+xml;base64,${base64}`;
    }
}

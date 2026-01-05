import streamDeck, { action, SingletonAction, WillAppearEvent, WillDisappearEvent, KeyDownEvent, DidReceiveSettingsEvent, JsonValue } from "@elgato/streamdeck";
import { execFile } from "child_process";
import { promisify } from "util";
import { getMemoryStats, MetricType, METRIC_CONFIGS } from "../utils/memory-stats";

const execFileAsync = promisify(execFile);

interface MemorySelectorSettings {
    metricType?: MetricType;
    [key: string]: JsonValue | undefined;
}

/**
 * Configurable memory action - user selects which metric to display via Property Inspector.
 */
class MemorySelectorBase extends SingletonAction<MemorySelectorSettings> {
    private intervals: Map<string, NodeJS.Timeout> = new Map();
    private actionSettings: Map<string, MetricType> = new Map();
    private logger = streamDeck.logger.createScope("MemorySelector");

    override async onWillAppear(ev: WillAppearEvent<MemorySelectorSettings>): Promise<void> {
        const actionId = ev.action.id;
        const settings = ev.payload.settings || {};
        const metricType = settings.metricType || "swap";

        this.actionSettings.set(actionId, metricType);
        this.logger.info(`Memory selector appeared: ${actionId}, metric: ${metricType}`);

        // Initial update
        await this.updateDisplay(ev, metricType);

        // Start polling every 2 seconds
        const interval = setInterval(async () => {
            try {
                const currentMetric = this.actionSettings.get(actionId) || "swap";
                await this.updateDisplay(ev, currentMetric);
            } catch (error) {
                this.logger.error("Error updating memory selector display:", error);
            }
        }, 2000);

        this.intervals.set(actionId, interval);
    }

    override async onWillDisappear(ev: WillDisappearEvent<MemorySelectorSettings>): Promise<void> {
        const actionId = ev.action.id;
        const interval = this.intervals.get(actionId);

        if (interval) {
            clearInterval(interval);
            this.intervals.delete(actionId);
        }
        this.actionSettings.delete(actionId);
    }

    override async onDidReceiveSettings(ev: DidReceiveSettingsEvent<MemorySelectorSettings>): Promise<void> {
        const actionId = ev.action.id;
        const settings = ev.payload.settings || {};
        const metricType = settings.metricType || "swap";

        this.actionSettings.set(actionId, metricType);
        this.logger.info(`Settings updated for ${actionId}: ${metricType}`);

        // Immediately update display with new metric
        await this.updateDisplay(ev as unknown as WillAppearEvent<MemorySelectorSettings>, metricType);
    }

    override async onKeyDown(_ev: KeyDownEvent<MemorySelectorSettings>): Promise<void> {
        try {
            await execFileAsync("open", ["-a", "Activity Monitor"]);
        } catch (error) {
            this.logger.error("Error opening Activity Monitor:", error);
        }
    }

    private async updateDisplay(ev: WillAppearEvent<MemorySelectorSettings>, metricType: MetricType): Promise<void> {
        const stats = await getMemoryStats();
        const config = METRIC_CONFIGS[metricType];

        const valueGB = config.getValue(stats);
        const percent = config.getPercent(stats);
        const color = config.getColor(valueGB, stats);

        const svg = this.generateImage(valueGB, percent, color, config.shortLabel, config.showRing);
        await ev.action.setImage(svg);
    }

    private generateImage(
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

export const MemorySelector = action({ UUID: "com.joshroman.macos-memory.custom" })(
    MemorySelectorBase,
    { kind: "class", name: "MemorySelector" } as ClassDecoratorContext
);

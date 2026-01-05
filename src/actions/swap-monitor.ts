import { action } from "@elgato/streamdeck";
import { BaseMemoryAction } from "./base-memory-action";
import { MetricType } from "../utils/memory-stats";

class SwapMonitorBase extends BaseMemoryAction {
    protected metricType: MetricType = "swap";
}

export const SwapMonitor = action({ UUID: "com.joshroman.macos-memory.swap" })(
    SwapMonitorBase,
    { kind: "class", name: "SwapMonitor" } as ClassDecoratorContext
);

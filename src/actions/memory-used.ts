import { action } from "@elgato/streamdeck";
import { BaseMemoryAction } from "./base-memory-action";
import { MetricType } from "../utils/memory-stats";

class MemoryUsedBase extends BaseMemoryAction {
    protected metricType: MetricType = "memoryUsed";
}

export const MemoryUsed = action({ UUID: "com.joshroman.macos-memory.memory-used" })(
    MemoryUsedBase,
    { kind: "class", name: "MemoryUsed" } as ClassDecoratorContext
);

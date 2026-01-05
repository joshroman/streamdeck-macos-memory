import { action } from "@elgato/streamdeck";
import { BaseMemoryAction } from "./base-memory-action";
import { MetricType } from "../utils/memory-stats";

class PhysicalMemoryBase extends BaseMemoryAction {
    protected metricType: MetricType = "physical";
}

export const PhysicalMemory = action({ UUID: "com.joshroman.macos-memory.physical" })(
    PhysicalMemoryBase,
    { kind: "class", name: "PhysicalMemory" } as ClassDecoratorContext
);

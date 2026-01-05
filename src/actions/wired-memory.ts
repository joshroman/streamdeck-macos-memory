import { action } from "@elgato/streamdeck";
import { BaseMemoryAction } from "./base-memory-action";
import { MetricType } from "../utils/memory-stats";

class WiredMemoryBase extends BaseMemoryAction {
    protected metricType: MetricType = "wired";
}

export const WiredMemory = action({ UUID: "com.joshroman.macos-memory.wired" })(
    WiredMemoryBase,
    { kind: "class", name: "WiredMemory" } as ClassDecoratorContext
);

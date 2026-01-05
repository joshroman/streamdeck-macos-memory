import { action } from "@elgato/streamdeck";
import { BaseMemoryAction } from "./base-memory-action";
import { MetricType } from "../utils/memory-stats";

class CompressedMemoryBase extends BaseMemoryAction {
    protected metricType: MetricType = "compressed";
}

export const CompressedMemory = action({ UUID: "com.joshroman.macos-memory.compressed" })(
    CompressedMemoryBase,
    { kind: "class", name: "CompressedMemory" } as ClassDecoratorContext
);

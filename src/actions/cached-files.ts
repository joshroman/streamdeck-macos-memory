import { action } from "@elgato/streamdeck";
import { BaseMemoryAction } from "./base-memory-action";
import { MetricType } from "../utils/memory-stats";

class CachedFilesBase extends BaseMemoryAction {
    protected metricType: MetricType = "cached";
}

export const CachedFiles = action({ UUID: "com.joshroman.macos-memory.cached" })(
    CachedFilesBase,
    { kind: "class", name: "CachedFiles" } as ClassDecoratorContext
);

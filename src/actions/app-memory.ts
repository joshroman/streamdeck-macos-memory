import { action } from "@elgato/streamdeck";
import { BaseMemoryAction } from "./base-memory-action";
import { MetricType } from "../utils/memory-stats";

class AppMemoryBase extends BaseMemoryAction {
    protected metricType: MetricType = "appMemory";
}

export const AppMemory = action({ UUID: "com.joshroman.macos-memory.app-memory" })(
    AppMemoryBase,
    { kind: "class", name: "AppMemory" } as ClassDecoratorContext
);

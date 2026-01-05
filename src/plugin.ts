import streamDeck from "@elgato/streamdeck";

// Import all actions
import { SwapMonitor } from "./actions/swap-monitor";
import { MemoryUsed } from "./actions/memory-used";
import { AppMemory } from "./actions/app-memory";
import { WiredMemory } from "./actions/wired-memory";
import { CompressedMemory } from "./actions/compressed-memory";
import { CachedFiles } from "./actions/cached-files";
import { PhysicalMemory } from "./actions/physical-memory";
import { MemorySelector } from "./actions/memory-selector";

// Set logging level
streamDeck.logger.setLevel("debug");

const logger = streamDeck.logger.createScope("Plugin");
logger.info("macOS Memory plugin starting...");

// Register all actions
logger.info("Registering actions...");
streamDeck.actions.registerAction(new SwapMonitor());
streamDeck.actions.registerAction(new MemoryUsed());
streamDeck.actions.registerAction(new AppMemory());
streamDeck.actions.registerAction(new WiredMemory());
streamDeck.actions.registerAction(new CompressedMemory());
streamDeck.actions.registerAction(new CachedFiles());
streamDeck.actions.registerAction(new PhysicalMemory());
streamDeck.actions.registerAction(new MemorySelector());
logger.info("All actions registered");

// Connect to Stream Deck
logger.info("Connecting to Stream Deck...");
streamDeck.connect().then(() => {
    logger.info("Connected to Stream Deck!");
}).catch((err) => {
    logger.error("Failed to connect:", err);
});

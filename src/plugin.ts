import streamDeck, { LogLevel } from "@elgato/streamdeck";
import { SwapMonitor } from "./actions/swap-monitor";

// Set logging level
streamDeck.logger.setLevel(LogLevel.DEBUG);

const logger = streamDeck.logger.createScope("Plugin");
logger.info("Swap Monitor plugin starting...");

// Register the swap monitor action
logger.info("Registering SwapMonitor action...");
streamDeck.actions.registerAction(new SwapMonitor());
logger.info("SwapMonitor action registered");

// Connect to Stream Deck
logger.info("Connecting to Stream Deck...");
streamDeck.connect().then(() => {
    logger.info("Connected to Stream Deck!");
}).catch((err) => {
    logger.error("Failed to connect:", err);
});

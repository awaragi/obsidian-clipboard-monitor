import { afterEach, describe, expect, it, vi } from "vitest";
import { createConsoleLogger, noopLogger } from "./logger";

describe("createConsoleLogger", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("produces no console output when disabled", () => {
    const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
    const logger = createConsoleLogger(() => false);

    logger.debug("tick");
    logger.info("started");

    expect(debugSpy).not.toHaveBeenCalled();
  });

  it("logs both levels, prefixed, when enabled", () => {
    // Obsidian's plugin guidelines only allow console.debug/warn/error, so
    // both log levels route through console.debug — a "[debug]"/"[info]"
    // tag keeps the two distinguishable in the console.
    const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
    const logger = createConsoleLogger(() => true);

    logger.debug("tick", { count: 1 });
    logger.info("started", { target: "Note.md" });

    expect(debugSpy).toHaveBeenNthCalledWith(1, "[Clipboard Monitor]", "[debug]", "tick", { count: 1 });
    expect(debugSpy).toHaveBeenNthCalledWith(2, "[Clipboard Monitor]", "[info]", "started", { target: "Note.md" });
  });

  it("re-checks isEnabled on every call, so toggling takes effect without recreating the logger", () => {
    const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
    let enabled = false;
    const logger = createConsoleLogger(() => enabled);

    logger.debug("before enabling");
    expect(debugSpy).not.toHaveBeenCalled();

    enabled = true;
    logger.debug("after enabling");
    expect(debugSpy).toHaveBeenCalledTimes(1);

    enabled = false;
    logger.debug("after disabling again");
    expect(debugSpy).toHaveBeenCalledTimes(1);
  });
});

describe("noopLogger", () => {
  it("does nothing for either level", () => {
    expect(() => noopLogger.debug("x")).not.toThrow();
    expect(() => noopLogger.info("x")).not.toThrow();
  });
});

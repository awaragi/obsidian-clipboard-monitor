import { afterEach, describe, expect, it, vi } from "vitest";
import { createConsoleLogger, noopLogger } from "./logger";

describe("createConsoleLogger", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("produces no console output when disabled", () => {
    const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    const logger = createConsoleLogger(() => false);

    logger.debug("tick");
    logger.info("started");

    expect(debugSpy).not.toHaveBeenCalled();
    expect(infoSpy).not.toHaveBeenCalled();
  });

  it("logs both levels, prefixed, when enabled", () => {
    const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    const logger = createConsoleLogger(() => true);

    logger.debug("tick", { count: 1 });
    logger.info("started", { target: "Note.md" });

    expect(debugSpy).toHaveBeenCalledWith("[Clipboard Monitor]", "tick", { count: 1 });
    expect(infoSpy).toHaveBeenCalledWith("[Clipboard Monitor]", "started", { target: "Note.md" });
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

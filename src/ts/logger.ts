export interface Logger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
}

export const noopLogger: Logger = {
  debug: () => {},
  info: () => {},
};

const DEFAULT_PREFIX = "[Clipboard Monitor]";

/**
 * `isEnabled` is checked on every call rather than once at construction, so
 * flipping the underlying setting takes effect immediately for any
 * already-running watch-mode session, with no need to rebuild this logger
 * or the objects holding it.
 */
export function createConsoleLogger(isEnabled: () => boolean, prefix = DEFAULT_PREFIX): Logger {
  return {
    debug: (message, ...args) => {
      if (isEnabled()) console.debug(prefix, message, ...args);
    },
    info: (message, ...args) => {
      if (isEnabled()) console.info(prefix, message, ...args);
    },
  };
}

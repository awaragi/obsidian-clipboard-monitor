import { Notice, Plugin, TFile } from "obsidian";
import { ElectronClipboardReader } from "./clipboard/clipboardReader";
import { createObsidianHost } from "./watchMode/obsidianHost";
import { WatchModeController } from "./watchMode/watchModeController";
import type { WatchModeStatus } from "./watchMode/types";

export default class ClipboardMonitorPlugin extends Plugin {
  private controller!: WatchModeController;
  private statusBarItem!: HTMLElement;

  async onload() {
    this.statusBarItem = this.addStatusBarItem();
    this.renderStatus({ running: false, targetName: null });

    const host = createObsidianHost(this.app, new ElectronClipboardReader(), (status) =>
      this.renderStatus(status)
    );
    this.controller = new WatchModeController(host);

    this.addCommand({
      id: "start-watch-mode",
      name: "Start watch mode",
      callback: () => this.startWatchMode(),
    });

    this.addCommand({
      id: "stop-watch-mode",
      name: "Stop watch mode",
      callback: () => this.controller.stop(),
    });
  }

  onunload() {
    this.controller?.stop();
  }

  private startWatchMode(): void {
    const file = this.app.workspace.getActiveFile();
    if (!(file instanceof TFile)) {
      new Notice("Clipboard Monitor: open a note to start watch mode");
      return;
    }
    this.controller.start(file);
  }

  private renderStatus(status: WatchModeStatus): void {
    this.statusBarItem.setText(
      status.running ? `Clipboard Monitor: ${status.targetName}` : "Clipboard Monitor: off"
    );
  }
}

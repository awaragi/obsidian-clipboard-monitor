import { Notice, Plugin, TFile } from "obsidian";
import { ElectronClipboardReader } from "./clipboard/clipboardReader";
import { DEFAULT_CONTENT_TYPE_SCOPE, type ContentTypeScope } from "./watchMode/contentTypeScope";
import { ContentTypeScopeModal } from "./watchMode/contentTypeScopeModal";
import { createObsidianHost } from "./watchMode/obsidianHost";
import { WatchModeController } from "./watchMode/watchModeController";
import type { WatchModeStatus } from "./watchMode/types";

interface ClipboardMonitorData {
  lastUsedScope: ContentTypeScope;
}

export default class ClipboardMonitorPlugin extends Plugin {
  private controller!: WatchModeController;
  private statusBarItem!: HTMLElement;
  private lastUsedScope: ContentTypeScope = DEFAULT_CONTENT_TYPE_SCOPE;

  async onload() {
    const data = (await this.loadData()) as ClipboardMonitorData | null;
    this.lastUsedScope = data?.lastUsedScope ?? DEFAULT_CONTENT_TYPE_SCOPE;

    this.statusBarItem = this.addStatusBarItem();
    this.renderStatus({ running: false, targetName: null, scopeLabel: null });

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
      id: "start-watch-mode-choose-settings",
      name: "Start watch mode (choose settings)",
      callback: () => this.startWatchModeChooseSettings(),
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
    const file = this.getActiveFileOrNotice();
    if (!file) return;
    this.controller.start(file, this.lastUsedScope);
  }

  private async startWatchModeChooseSettings(): Promise<void> {
    const file = this.getActiveFileOrNotice();
    if (!file) return;

    const scope = await new ContentTypeScopeModal(this.app).open();
    if (!scope) return;

    this.lastUsedScope = scope;
    await this.saveData({ lastUsedScope: scope } satisfies ClipboardMonitorData);
    this.controller.start(file, scope);
  }

  private getActiveFileOrNotice(): TFile | null {
    const file = this.app.workspace.getActiveFile();
    if (!(file instanceof TFile)) {
      new Notice("Clipboard Monitor: open a note to start watch mode");
      return null;
    }
    return file;
  }

  private renderStatus(status: WatchModeStatus): void {
    this.statusBarItem.setText(
      status.running ? `Clipboard Monitor: ${status.targetName} — ${status.scopeLabel}` : "Clipboard Monitor: off"
    );
  }
}

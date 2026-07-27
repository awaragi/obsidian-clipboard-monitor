import { Notice, Plugin, TFile } from "obsidian";
import { ElectronClipboardReader } from "./clipboard/clipboardReader";
import { ClipboardMonitorSettingTab, type FormatListHost } from "./settings/clipboardMonitorSettingTab";
import { DEFAULT_CONTENT_TYPE_SCOPE, type ContentTypeScope } from "./watchMode/contentTypeScope";
import { createObsidianHost } from "./watchMode/obsidianHost";
import { createDefaultTextFormats, resolveLastUsedFormatId, type TextFormat } from "./watchMode/textFormat";
import { WatchModeController } from "./watchMode/watchModeController";
import { WatchModeSettingsModal } from "./watchMode/watchModeSettingsModal";
import type { WatchModeStatus } from "./watchMode/types";

interface ClipboardMonitorData {
  lastUsedScope: ContentTypeScope;
  formats: TextFormat[];
  lastUsedFormatId: string;
  clearClipboardAfterImageInsert: boolean;
}

export default class ClipboardMonitorPlugin extends Plugin {
  private controller!: WatchModeController;
  private statusBarItem!: HTMLElement;
  private data!: ClipboardMonitorData;

  async onload() {
    this.data = await this.loadClipboardMonitorData();

    this.statusBarItem = this.addStatusBarItem();
    this.renderStatus({ running: false, targetName: null, scopeLabel: null, formatLabel: null });

    const host = createObsidianHost(this.app, new ElectronClipboardReader(), (status) =>
      this.renderStatus(status)
    );
    this.controller = new WatchModeController(host);

    const formatListHost: FormatListHost = {
      getFormats: () => this.data.formats,
      getLastUsedFormatId: () => this.data.lastUsedFormatId,
      saveFormatData: (formats, lastUsedFormatId) => this.persistFormats(formats, lastUsedFormatId),
      getClearClipboardAfterImageInsert: () => this.data.clearClipboardAfterImageInsert,
      setClearClipboardAfterImageInsert: (value) => this.persistClearClipboardAfterImageInsert(value),
    };
    this.addSettingTab(new ClipboardMonitorSettingTab(this.app, this, formatListHost));

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

  private async loadClipboardMonitorData(): Promise<ClipboardMonitorData> {
    const loaded = (await this.loadData()) as Partial<ClipboardMonitorData> | null;
    const formats = loaded?.formats?.length ? loaded.formats : createDefaultTextFormats();
    return {
      lastUsedScope: loaded?.lastUsedScope ?? DEFAULT_CONTENT_TYPE_SCOPE,
      formats,
      lastUsedFormatId: resolveLastUsedFormatId(formats, loaded?.lastUsedFormatId),
      clearClipboardAfterImageInsert: loaded?.clearClipboardAfterImageInsert ?? false,
    };
  }

  private async persistFormats(formats: TextFormat[], lastUsedFormatId: string): Promise<void> {
    this.data.formats = formats;
    this.data.lastUsedFormatId = lastUsedFormatId;
    await this.saveData(this.data);
  }

  private async persistClearClipboardAfterImageInsert(value: boolean): Promise<void> {
    this.data.clearClipboardAfterImageInsert = value;
    await this.saveData(this.data);
  }

  private activeFormat(): TextFormat {
    const format = this.data.formats.find((f) => f.id === this.data.lastUsedFormatId);
    return format ?? this.data.formats[0];
  }

  private startWatchMode(): void {
    const file = this.getActiveFileOrNotice();
    if (!file) return;
    this.controller.start(file, this.data.lastUsedScope, this.activeFormat(), this.data.clearClipboardAfterImageInsert);
  }

  private async startWatchModeChooseSettings(): Promise<void> {
    const file = this.getActiveFileOrNotice();
    if (!file) return;

    const choice = await new WatchModeSettingsModal(
      this.app,
      file,
      this.data.formats,
      this.data.lastUsedScope,
      this.data.lastUsedFormatId
    ).open();
    if (!choice) return;

    this.data.lastUsedScope = choice.scope;
    this.data.lastUsedFormatId = choice.format.id;
    await this.saveData(this.data);
    this.controller.start(file, choice.scope, choice.format, this.data.clearClipboardAfterImageInsert);
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
      status.running
        ? `Clipboard Monitor: ${status.targetName} — ${status.scopeLabel} — ${status.formatLabel}`
        : "Clipboard Monitor: off"
    );
  }
}

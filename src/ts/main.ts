import { Notice, Plugin, TFile } from "obsidian";
import { ElectronClipboardReader } from "./clipboard/clipboardReader";
import { t } from "./i18n/i18n";
import { ClipboardMonitorSettingTab, type FormatListHost } from "./settings/clipboardMonitorSettingTab";
import { DEFAULT_CONTENT_TYPE_SCOPE, type ContentTypeScope } from "./watchMode/contentTypeScope";
import { createConsoleLogger } from "./logger";
import { createObsidianHost } from "./watchMode/obsidianHost";
import { DEFAULT_POLLING_FREQUENCY, pollingFrequencyToMs, type PollingFrequency } from "./watchMode/pollingFrequency";
import { createDefaultTextFormats, resolveLastUsedFormatId, type TextFormat } from "./watchMode/textFormat";
import { WatchModeController } from "./watchMode/watchModeController";
import { WatchModeSettingsModal } from "./watchMode/watchModeSettingsModal";
import type { WatchModeStatus } from "./watchMode/types";

interface ClipboardMonitorData {
  lastUsedScope: ContentTypeScope;
  formats: TextFormat[];
  lastUsedFormatId: string;
  clearClipboardAfterImageInsert: boolean;
  pollingFrequency: PollingFrequency;
  debugLoggingEnabled: boolean;
  showRibbonIcon: boolean;
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
    const logger = createConsoleLogger(() => this.data.debugLoggingEnabled);
    // Passing `undefined` for the watcher factory keeps the default factory
    // (which needs `logger` internally) while still supplying `logger` here.
    this.controller = new WatchModeController(host, undefined, logger);

    const formatListHost: FormatListHost = {
      getFormats: () => this.data.formats,
      getLastUsedFormatId: () => this.data.lastUsedFormatId,
      saveFormatData: (formats, lastUsedFormatId) => this.persistFormats(formats, lastUsedFormatId),
      getClearClipboardAfterImageInsert: () => this.data.clearClipboardAfterImageInsert,
      setClearClipboardAfterImageInsert: (value) => this.persist("clearClipboardAfterImageInsert", value),
      getPollingFrequency: () => this.data.pollingFrequency,
      setPollingFrequency: (value) => this.persist("pollingFrequency", value),
      getDebugLoggingEnabled: () => this.data.debugLoggingEnabled,
      setDebugLoggingEnabled: (value) => this.persist("debugLoggingEnabled", value),
      getShowRibbonIcon: () => this.data.showRibbonIcon,
      setShowRibbonIcon: (value) => this.persist("showRibbonIcon", value),
    };
    this.addSettingTab(new ClipboardMonitorSettingTab(this.app, this, formatListHost));

    if (this.data.showRibbonIcon) {
      this.addRibbonIcon("clipboard-check", t("ribbon.tooltip"), () => this.startWatchModeChooseSettings());
    }

    this.addCommand({
      id: "start-watch-mode",
      name: t("command.start_watch"),
      callback: () => this.startWatchMode(),
    });

    this.addCommand({
      id: "start-watch-mode-choose-settings",
      name: t("command.start_watch_choose_settings"),
      callback: () => this.startWatchModeChooseSettings(),
    });

    this.addCommand({
      id: "stop-watch-mode",
      name: t("command.stop_watch"),
      callback: () => this.controller.stop(),
    });

    this.addCommand({
      id: "toggle-watch-mode",
      name: t("command.toggle_watch"),
      callback: () => (this.controller.isRunning ? this.controller.stop() : this.startWatchMode()),
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
      pollingFrequency: loaded?.pollingFrequency ?? DEFAULT_POLLING_FREQUENCY,
      debugLoggingEnabled: loaded?.debugLoggingEnabled ?? false,
      showRibbonIcon: loaded?.showRibbonIcon ?? true,
    };
  }

  private async persistFormats(formats: TextFormat[], lastUsedFormatId: string): Promise<void> {
    this.data.formats = formats;
    this.data.lastUsedFormatId = lastUsedFormatId;
    await this.saveData(this.data);
  }

  private async persist<K extends keyof ClipboardMonitorData>(key: K, value: ClipboardMonitorData[K]): Promise<void> {
    this.data[key] = value;
    await this.saveData(this.data);
  }

  private activeFormat(): TextFormat {
    const format = this.data.formats.find((f) => f.id === this.data.lastUsedFormatId);
    return format ?? this.data.formats[0];
  }

  private startWatchMode(): void {
    const file = this.getActiveFileOrNotice();
    if (!file) return;
    this.controller.start(
      file,
      this.data.lastUsedScope,
      this.activeFormat(),
      this.data.clearClipboardAfterImageInsert,
      pollingFrequencyToMs(this.data.pollingFrequency)
    );
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
    ).pickSettings();
    if (!choice) return;

    this.data.lastUsedScope = choice.scope;
    this.data.lastUsedFormatId = choice.format.id;
    await this.saveData(this.data);
    this.controller.start(
      file,
      choice.scope,
      choice.format,
      this.data.clearClipboardAfterImageInsert,
      pollingFrequencyToMs(this.data.pollingFrequency)
    );
  }

  private getActiveFileOrNotice(): TFile | null {
    const file = this.app.workspace.getActiveFile();
    if (!(file instanceof TFile)) {
      new Notice(t("notice.no_active_file"));
      return null;
    }
    return file;
  }

  private renderStatus(status: WatchModeStatus): void {
    this.statusBarItem.setText(
      status.running
        ? t("statusbar.running", {
            target: status.targetName ?? "",
            scope: status.scopeLabel ?? "",
            format: status.formatLabel ?? "",
          })
        : t("statusbar.idle")
    );
  }
}

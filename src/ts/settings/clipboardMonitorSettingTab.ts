import { App, ButtonComponent, ExtraButtonComponent, Plugin, PluginSettingTab, Setting, TextComponent } from "obsidian";
import { ConfirmModal } from "./confirmModal";
import { addFormat, deleteFormat, moveFormat, resetToDefaults, updateFormat } from "./formatListOps";
import { escapeTemplateForInput, unescapeTemplateFromInput } from "./templateEscape";
import { isRtl, locale, t } from "../i18n/i18n";
import { POLLING_FREQUENCY_OPTIONS, type PollingFrequency } from "../watchMode/pollingFrequency";
import { resolveLastUsedFormatId, type TextFormat } from "../watchMode/textFormat";

/** The slice of the plugin this settings tab needs — persisted format data plus a save hook. */
export interface FormatListHost {
  getFormats(): TextFormat[];
  getLastUsedFormatId(): string;
  saveFormatData(formats: TextFormat[], lastUsedFormatId: string): Promise<void>;
  getClearClipboardAfterImageInsert(): boolean;
  setClearClipboardAfterImageInsert(value: boolean): Promise<void>;
  getPollingFrequency(): PollingFrequency;
  setPollingFrequency(value: PollingFrequency): Promise<void>;
  getDebugLoggingEnabled(): boolean;
  setDebugLoggingEnabled(value: boolean): Promise<void>;
  getShowRibbonIcon(): boolean;
  setShowRibbonIcon(value: boolean): Promise<void>;
}

export class ClipboardMonitorSettingTab extends PluginSettingTab {
  private newName = "";
  private newTemplate = "";

  constructor(
    app: App,
    plugin: Plugin,
    private readonly host: FormatListHost
  ) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.setAttribute("dir", isRtl(locale()) ? "rtl" : "ltr");

    new Setting(containerEl).setName(t("settings.ribbon.heading")).setHeading();
    containerEl.createEl("p", { text: t("settings.ribbon.desc") });
    new Setting(containerEl).setName(t("settings.ribbon.label")).addToggle((toggle) =>
      toggle.setValue(this.host.getShowRibbonIcon()).onChange(async (value) => {
        await this.host.setShowRibbonIcon(value);
      })
    );

    new Setting(containerEl).setName(t("settings.polling.heading")).setHeading();
    containerEl.createEl("p", { text: t("settings.polling.desc") });
    containerEl.createEl("p", { text: t("settings.polling.tip") });
    new Setting(containerEl).setName(t("settings.polling.label")).addDropdown((dropdown) => {
      for (const option of POLLING_FREQUENCY_OPTIONS) {
        dropdown.addOption(option.value, t(option.labelKey));
      }
      dropdown.setValue(this.host.getPollingFrequency()).onChange(async (value) => {
        await this.host.setPollingFrequency(value as PollingFrequency);
      });
    });

    new Setting(containerEl).setName(t("settings.images.heading")).setHeading();
    containerEl.createEl("p", { text: t("settings.images.clear_after_insert.desc") });
    new Setting(containerEl).setName(t("settings.images.clear_after_insert.label")).addToggle((toggle) =>
      toggle.setValue(this.host.getClearClipboardAfterImageInsert()).onChange(async (value) => {
        await this.host.setClearClipboardAfterImageInsert(value);
      })
    );

    new Setting(containerEl).setName(t("settings.formats.heading")).setHeading();
    containerEl.createEl("p", { text: t("settings.formats.desc") });

    const formats = this.host.getFormats();
    formats.forEach((format, index) => {
      this.renderFormatRow(containerEl, format, index, formats.length);
    });

    const addRow = containerEl.createDiv({ cls: "setting-item ccm-format-row" });

    new TextComponent(addRow).setPlaceholder(t("settings.formats.name_placeholder")).onChange((value) => {
      this.newName = value;
    });

    new TextComponent(addRow).setPlaceholder(t("settings.formats.template_placeholder")).onChange((value) => {
      this.newTemplate = value;
    });

    new ButtonComponent(addRow)
      .setButtonText(t("settings.formats.add_button"))
      .then((button) => button.buttonEl.classList.add("ccm-format-row-action"))
      .onClick(async () => {
        if (!this.newName || !this.newTemplate) return;
        await this.mutate((formats) =>
          addFormat(formats, this.newName, unescapeTemplateFromInput(this.newTemplate))
        );
        this.newName = "";
        this.newTemplate = "";
      });

    const resetRow = containerEl.createDiv({ cls: "setting-item ccm-format-row" });

    new ButtonComponent(resetRow)
      .setButtonText(t("settings.formats.reset_button"))
      .then((button) => button.buttonEl.classList.add("ccm-format-row-action"))
      .onClick(async () => {
        const confirmed = await new ConfirmModal(
          this.app,
          t("settings.formats.reset_confirm_title"),
          t("settings.formats.reset_confirm_message"),
          t("settings.formats.reset_confirm_button")
        ).confirm();
        if (!confirmed) return;
        await this.mutate(() => resetToDefaults());
      });

    new Setting(containerEl).setName(t("settings.debug.heading")).setHeading();
    containerEl.createEl("p", { text: t("settings.debug.desc") });
    new Setting(containerEl).setName(t("settings.debug.label")).addToggle((toggle) =>
      toggle.setValue(this.host.getDebugLoggingEnabled()).onChange(async (value) => {
        await this.host.setDebugLoggingEnabled(value);
      })
    );
  }

  private renderFormatRow(containerEl: HTMLElement, format: TextFormat, index: number, total: number): void {
    const row = containerEl.createDiv({ cls: "setting-item ccm-format-row" });

    new TextComponent(row).setValue(format.name).onChange(async (value) => {
      await this.mutate((current) => updateFormat(current, format.id, { name: value }));
    });

    new TextComponent(row).setValue(escapeTemplateForInput(format.template)).onChange(async (value) => {
      await this.mutate((current) =>
        updateFormat(current, format.id, { template: unescapeTemplateFromInput(value) })
      );
    });

    new ExtraButtonComponent(row)
      .setIcon("arrow-up")
      .setTooltip(t("settings.formats.move_up"))
      .setDisabled(index === 0)
      .onClick(async () => {
        await this.mutate((current) => moveFormat(current, format.id, "up"));
      });

    new ExtraButtonComponent(row)
      .setIcon("arrow-down")
      .setTooltip(t("settings.formats.move_down"))
      .setDisabled(index === total - 1)
      .onClick(async () => {
        await this.mutate((current) => moveFormat(current, format.id, "down"));
      });

    new ExtraButtonComponent(row)
      .setIcon("trash")
      .setTooltip(t("settings.formats.delete"))
      .setDisabled(total === 1)
      .onClick(async () => {
        const confirmed = await new ConfirmModal(
          this.app,
          t("settings.formats.delete_confirm_title"),
          t("settings.formats.delete_confirm_message", { name: format.name }),
          t("settings.formats.delete")
        ).confirm();
        if (!confirmed) return;
        await this.mutate((current) => deleteFormat(current, format.id));
      });
  }

  private async mutate(update: (formats: TextFormat[]) => TextFormat[]): Promise<void> {
    const formats = update(this.host.getFormats());
    const lastUsedFormatId = resolveLastUsedFormatId(formats, this.host.getLastUsedFormatId());
    await this.host.saveFormatData(formats, lastUsedFormatId);
    this.display();
  }
}

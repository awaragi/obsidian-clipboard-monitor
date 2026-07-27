import { App, ButtonComponent, ExtraButtonComponent, Plugin, PluginSettingTab, Setting, TextComponent } from "obsidian";
import { ConfirmModal } from "./confirmModal";
import { addFormat, deleteFormat, moveFormat, resetToDefaults, updateFormat } from "./formatListOps";
import { escapeTemplateForInput, unescapeTemplateFromInput } from "./templateEscape";
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

    containerEl.createEl("h3", { text: "Polling" });
    containerEl.createEl("p", {
      text:
        "Obsidian doesn't give plugins a way to be notified when the system clipboard changes, so watch mode " +
        "checks it on a repeating interval instead. Faster polling notices new clipboard content sooner but " +
        "uses more CPU; slower polling is lighter but adds a little delay before content is inserted.",
    });
    containerEl.createEl("p", {
      text:
        "Tip: Fast polling paired with \"Clear clipboard after image insert\" below is a good combination for " +
        "staying responsive without wasting CPU.",
    });
    new Setting(containerEl).setName("Polling frequency").addDropdown((dropdown) => {
      for (const option of POLLING_FREQUENCY_OPTIONS) {
        dropdown.addOption(option.value, option.label);
      }
      dropdown.setValue(this.host.getPollingFrequency()).onChange(async (value) => {
        await this.host.setPollingFrequency(value as PollingFrequency);
      });
    });

    containerEl.createEl("h3", { text: "Images" });
    containerEl.createEl("p", {
      text:
        "When an image is saved and inserted, clear the entire system clipboard immediately afterward — " +
        "not just the inserted image, but every format currently on the clipboard (e.g. accompanying text " +
        "from the same copy is lost too). Re-copying the same image afterward is treated as new content " +
        "and will be inserted again. Off by default.",
    });
    new Setting(containerEl).setName("Clear clipboard after image insert").addToggle((toggle) =>
      toggle.setValue(this.host.getClearClipboardAfterImageInsert()).onChange(async (value) => {
        await this.host.setClearClipboardAfterImageInsert(value);
      })
    );

    containerEl.createEl("h3", { text: "Text formats" });
    containerEl.createEl("p", {
      text: "Templates used to format clipboard text before it's inserted. Use {{content}} for the copied text, {{time}} for the current time, and \\n for a new line.",
    });

    const formats = this.host.getFormats();
    formats.forEach((format, index) => {
      this.renderFormatRow(containerEl, format, index, formats.length);
    });

    const addRow = containerEl.createDiv({ cls: "setting-item ccm-format-row" });

    new TextComponent(addRow).setPlaceholder("Name").onChange((value) => {
      this.newName = value;
    });

    new TextComponent(addRow).setPlaceholder("Template, e.g. \\n- {{content}}").onChange((value) => {
      this.newTemplate = value;
    });

    new ButtonComponent(addRow)
      .setButtonText("Add")
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
      .setButtonText("Reset to defaults")
      .then((button) => button.buttonEl.classList.add("ccm-format-row-action"))
      .onClick(async () => {
        const confirmed = await new ConfirmModal(
          this.app,
          "Reset to defaults?",
          "This replaces every text format with the shipped defaults. Your customizations can't be recovered.",
          "Reset"
        ).open();
        if (!confirmed) return;
        await this.mutate(() => resetToDefaults());
      });
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
      .setTooltip("Move up")
      .setDisabled(index === 0)
      .onClick(async () => {
        await this.mutate((current) => moveFormat(current, format.id, "up"));
      });

    new ExtraButtonComponent(row)
      .setIcon("arrow-down")
      .setTooltip("Move down")
      .setDisabled(index === total - 1)
      .onClick(async () => {
        await this.mutate((current) => moveFormat(current, format.id, "down"));
      });

    new ExtraButtonComponent(row)
      .setIcon("trash")
      .setTooltip("Delete")
      .setDisabled(total === 1)
      .onClick(async () => {
        const confirmed = await new ConfirmModal(
          this.app,
          "Delete format?",
          `Delete "${format.name}"? This can't be undone.`,
          "Delete"
        ).open();
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

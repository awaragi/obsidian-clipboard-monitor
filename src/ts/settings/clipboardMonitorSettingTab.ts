import { App, Plugin, PluginSettingTab, Setting } from "obsidian";
import { addFormat, deleteFormat, moveFormat, resetToDefaults, updateFormat } from "./formatListOps";
import { resolveLastUsedFormatId, type TextFormat } from "../watchMode/textFormat";

/** The slice of the plugin this settings tab needs — persisted format data plus a save hook. */
export interface FormatListHost {
  getFormats(): TextFormat[];
  getLastUsedFormatId(): string;
  saveFormatData(formats: TextFormat[], lastUsedFormatId: string): Promise<void>;
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

    containerEl.createEl("h3", { text: "Text formats" });
    containerEl.createEl("p", {
      text: "Templates used to format clipboard text before it's inserted. Use {{content}} for the copied text and {{time}} for the current time.",
    });

    const formats = this.host.getFormats();
    formats.forEach((format, index) => {
      this.renderFormatRow(containerEl, format, index, formats.length);
    });

    new Setting(containerEl)
      .setName("Add format")
      .addText((text) =>
        text.setPlaceholder("Name").onChange((value) => {
          this.newName = value;
        })
      )
      .addText((text) =>
        text.setPlaceholder("Template, e.g. - {{content}}").onChange((value) => {
          this.newTemplate = value;
        })
      )
      .addButton((button) =>
        button.setButtonText("Add").onClick(async () => {
          if (!this.newName || !this.newTemplate) return;
          await this.mutate((formats) => addFormat(formats, this.newName, this.newTemplate));
          this.newName = "";
          this.newTemplate = "";
        })
      );

    new Setting(containerEl).addButton((button) =>
      button.setButtonText("Reset to defaults").onClick(async () => {
        await this.mutate(() => resetToDefaults());
      })
    );
  }

  private renderFormatRow(containerEl: HTMLElement, format: TextFormat, index: number, total: number): void {
    new Setting(containerEl)
      .addText((text) =>
        text.setValue(format.name).onChange(async (value) => {
          await this.mutate((current) => updateFormat(current, format.id, { name: value }));
        })
      )
      .addTextArea((area) =>
        area.setValue(format.template).onChange(async (value) => {
          await this.mutate((current) => updateFormat(current, format.id, { template: value }));
        })
      )
      .addExtraButton((button) =>
        button
          .setIcon("arrow-up")
          .setTooltip("Move up")
          .setDisabled(index === 0)
          .onClick(async () => {
            await this.mutate((current) => moveFormat(current, format.id, "up"));
          })
      )
      .addExtraButton((button) =>
        button
          .setIcon("arrow-down")
          .setTooltip("Move down")
          .setDisabled(index === total - 1)
          .onClick(async () => {
            await this.mutate((current) => moveFormat(current, format.id, "down"));
          })
      )
      .addExtraButton((button) =>
        button
          .setIcon("trash")
          .setTooltip("Delete")
          .setDisabled(total === 1)
          .onClick(async () => {
            await this.mutate((current) => deleteFormat(current, format.id));
          })
      );
  }

  private async mutate(update: (formats: TextFormat[]) => TextFormat[]): Promise<void> {
    const formats = update(this.host.getFormats());
    const lastUsedFormatId = resolveLastUsedFormatId(formats, this.host.getLastUsedFormatId());
    await this.host.saveFormatData(formats, lastUsedFormatId);
    this.display();
  }
}

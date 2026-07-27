import { App, Modal, Setting } from "obsidian";
import { isRtl, locale, t } from "../i18n/i18n";
import { CONTENT_TYPE_SCOPE_OPTIONS, type ContentTypeScope } from "./contentTypeScope";
import type { TextFormat } from "./textFormat";
import type { WatchModeTarget } from "./types";

export interface WatchModeSettingsChoice {
  scope: ContentTypeScope;
  format: TextFormat;
}

/**
 * Prompts for every per-activation ("watch session") setting together, in
 * one modal, with explicit Watch/Cancel actions. Only Watch resolves a
 * choice — Cancel, Escape, and outside-click all resolve `undefined` via
 * the same onClose path, so there's exactly one code path that can
 * confirm a choice.
 *
 * This is the intended home for future per-activation settings: add a
 * field here (and to WatchModeSettingsChoice) rather than chaining
 * another modal after this one.
 */
export class WatchModeSettingsModal extends Modal {
  private resolve!: (choice: WatchModeSettingsChoice | undefined) => void;
  private confirmed = false;
  private selectedScope: ContentTypeScope;
  private selectedFormat: TextFormat;

  constructor(
    app: App,
    private readonly target: WatchModeTarget,
    private readonly formats: TextFormat[],
    initialScope: ContentTypeScope,
    initialFormatId: string
  ) {
    super(app);
    this.selectedScope = initialScope;
    this.selectedFormat = formats.find((format) => format.id === initialFormatId) ?? formats[0];
  }

  open(): Promise<WatchModeSettingsChoice | undefined> {
    const promise = new Promise<WatchModeSettingsChoice | undefined>((resolve) => {
      this.resolve = resolve;
    });
    super.open();
    return promise;
  }

  onOpen(): void {
    this.modalEl.setAttribute("dir", isRtl(locale()) ? "rtl" : "ltr");
    this.setTitle(t("modal.watch.title"));

    const targetSetting = new Setting(this.contentEl).setName(t("modal.watch.target_label")).setDesc(this.target.path);
    targetSetting.descEl.setAttribute("title", this.target.path);
    targetSetting.descEl.style.whiteSpace = "nowrap";
    targetSetting.descEl.style.overflow = "hidden";
    targetSetting.descEl.style.textOverflow = "ellipsis";

    new Setting(this.contentEl).setName(t("modal.watch.content_type_label")).addDropdown((dropdown) => {
      for (const option of CONTENT_TYPE_SCOPE_OPTIONS) {
        dropdown.addOption(option.value, t(option.labelKey));
      }
      dropdown.setValue(this.selectedScope).onChange((value) => {
        this.selectedScope = value as ContentTypeScope;
      });
    });

    new Setting(this.contentEl).setName(t("modal.watch.text_format_label")).addDropdown((dropdown) => {
      for (const format of this.formats) {
        dropdown.addOption(format.id, format.name);
      }
      dropdown.setValue(this.selectedFormat.id).onChange((id) => {
        this.selectedFormat = this.formats.find((format) => format.id === id) ?? this.selectedFormat;
      });
    });

    new Setting(this.contentEl)
      .addButton((button) =>
        button
          .setButtonText(t("modal.watch.watch_button"))
          .setCta()
          .onClick(() => {
            this.confirmed = true;
            this.close();
          })
      )
      .addButton((button) => button.setButtonText(t("common.cancel")).onClick(() => this.close()));
  }

  onClose(): void {
    this.contentEl.empty();
    this.resolve(this.confirmed ? { scope: this.selectedScope, format: this.selectedFormat } : undefined);
  }
}

import { App, Modal, Setting } from "obsidian";
import { isRtl, locale, t } from "../i18n/i18n";

/**
 * Prompts for a yes/no confirmation before a destructive action. Only the
 * confirm button resolves `true` — Cancel, Escape, and outside-click all
 * resolve `false` via the same onClose path, so there's exactly one code
 * path that can confirm.
 */
export class ConfirmModal extends Modal {
  private resolve!: (confirmed: boolean) => void;
  private confirmed = false;

  constructor(
    app: App,
    private readonly title: string,
    private readonly message: string,
    private readonly confirmText: string
  ) {
    super(app);
  }

  open(): Promise<boolean> {
    const promise = new Promise<boolean>((resolve) => {
      this.resolve = resolve;
    });
    super.open();
    return promise;
  }

  onOpen(): void {
    this.modalEl.setAttribute("dir", isRtl(locale()) ? "rtl" : "ltr");
    this.setTitle(this.title);
    this.contentEl.createEl("p", { text: this.message });

    new Setting(this.contentEl)
      .addButton((button) =>
        button
          .setButtonText(this.confirmText)
          .setWarning()
          .onClick(() => {
            this.confirmed = true;
            this.close();
          })
      )
      .addButton((button) => button.setButtonText(t("common.cancel")).onClick(() => this.close()));
  }

  onClose(): void {
    this.contentEl.empty();
    this.resolve(this.confirmed);
  }
}

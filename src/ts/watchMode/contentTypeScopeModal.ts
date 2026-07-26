import { App, Modal } from "obsidian";
import { CONTENT_TYPE_SCOPE_OPTIONS, type ContentTypeScope } from "./contentTypeScope";

/** Prompts for a content-type scope via three buttons; resolves `undefined` if dismissed without a choice. */
export class ContentTypeScopeModal extends Modal {
  private resolve!: (scope: ContentTypeScope | undefined) => void;
  private chosen: ContentTypeScope | undefined;

  constructor(app: App) {
    super(app);
  }

  open(): Promise<ContentTypeScope | undefined> {
    const promise = new Promise<ContentTypeScope | undefined>((resolve) => {
      this.resolve = resolve;
    });
    super.open();
    return promise;
  }

  onOpen(): void {
    this.setTitle("Start watch mode");
    for (const option of CONTENT_TYPE_SCOPE_OPTIONS) {
      this.contentEl.createEl("button", { text: option.label }).addEventListener("click", () => {
        this.chosen = option.value;
        this.close();
      });
    }
  }

  onClose(): void {
    this.contentEl.empty();
    this.resolve(this.chosen);
  }
}

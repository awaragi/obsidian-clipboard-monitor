import { App, FuzzySuggestModal } from "obsidian";
import type { TextFormat } from "./textFormat";

/** Prompts for a text format via fuzzy search over the managed list; resolves `undefined` if dismissed without a choice. */
export class TextFormatPickerModal extends FuzzySuggestModal<TextFormat> {
  private resolve!: (format: TextFormat | undefined) => void;
  private chosen: TextFormat | undefined;

  constructor(
    app: App,
    private readonly formats: TextFormat[]
  ) {
    super(app);
    this.setPlaceholder("Choose a text format");
  }

  open(): Promise<TextFormat | undefined> {
    const promise = new Promise<TextFormat | undefined>((resolve) => {
      this.resolve = resolve;
    });
    super.open();
    return promise;
  }

  getItems(): TextFormat[] {
    return this.formats;
  }

  getItemText(format: TextFormat): string {
    return format.name;
  }

  onChooseItem(format: TextFormat): void {
    this.chosen = format;
  }

  onClose(): void {
    super.onClose();
    this.resolve(this.chosen);
  }
}

declare var Markdown;
export class PagedownValueConverter {
  toView(markdown: string, htmlSafe?: boolean) {
    var converter = htmlSafe ? new Markdown.Converter() : Markdown.getSanitizingConverter();
    return converter.makeHtml(markdown)
  }
}

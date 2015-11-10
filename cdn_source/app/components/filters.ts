module MyApp.Components {
    class FiltersComponent extends Tk.Module {
        static $name = "FiltersComponentModule";

        constructor() {
            super('Components.Filters', []);

            this.app.filter('uppercaseFirst', () => (val: string) => val ? val.toUpperCaseFirst() : val)
                .filter('lowercaseFirst', () => (val: string) => val ? val.toLowerCaseFirst() : val)
                // TODO: Dedup; this does pretty much the same as the bytes filter!
                .filter('size', () => (size, format) => {
                    var sz = window.w6Cheat.w6.sizeFnc(size, format);
                    return sz[0] + ' ' + sz[1];
                })
                .filter('sizeInfo', () => (size, format) => {
                    var sz = window.w6Cheat.w6.sizeFnc(size, format);
                    return '<span class="main">' + sz[0] + '</span> <span>' + sz[1] + '</span>';
                })
                .filter('accounting', () => (nmb, currencyCode) => {
                    var currency = {
                            USD: "$",
                            GBP: "£",
                            AUD: "$",
                            EUR: "€",
                            CAD: "$",
                            MIXED: "~"
                        },
                        thousand,
                        decimal,
                        format;
                    if ($.inArray(currencyCode, ["USD", "AUD", "CAD", "MIXED"]) >= 0) {
                        thousand = ",";
                        decimal = ".";
                        format = "%s %v";
                    } else {
                        thousand = ".";
                        decimal = ",";
                        format = "%s %v";
                    };
                    return accounting.formatMoney(nmb, currency[currencyCode], 2, thousand, decimal, format);
                })
                .filter('pagedown', () => (input, htmlSafe?) => {
                    if (input == null) return input;
                    // TODO: Markdown is not rendered the same here in JS as in the backend, support for following seems lacking:
                    // - AutoNewLines
                    // - StrictBoldItalic
                    // - EncodeProblemUrlCharacters
                    // One way to solve it would be to have a markdown web api endpoint on the server which renders markdown input into html output?
                    var converter = htmlSafe ? new Markdown.Converter() : Markdown.getSanitizingConverter();
                    return converter.makeHtml(input);
                })
                .filter('htmlToPlaintext', () => text => String(text).replace(/<[^>]+>/gm, ''))
                .filter('htmlToPlaintext2', () => text => angular.element('<span>' + text + '</span>').text())
                // For some reason htmlSafe switch not working on main pagedown directive??
                .filter('pagedownSafe', () => (input) => {
                    if (input == null) return input;
                    var converter = new Markdown.Converter();
                    return converter.makeHtml(input);
                })
                .filter('commentfilter', () => (input: any[]) => !input ? input : input.asEnumerable().where(x => !x.replyToId).toArray())
                .filter('deletedfilter', () => (input: IBreezeModMediaItem[], mod: IBreezeMod) => {
                    if (!input || input.length == 0 || mod == null) return [];
                    return input.asEnumerable().where(x => x.modId == mod.id && x.entityAspect.entityState.isDeleted()).toArray()
                })
                .filter('unsafe', ['$sce', function($sce) { return $sce.trustAsHtml; }])
                .filter('monthName', [
                    () => monthNumber => { //1 = January
                        var monthNames = [
                            'January', 'February', 'March', 'April', 'May', 'June',
                            'July', 'August', 'September', 'October', 'November', 'December'
                        ];
                        return monthNames[monthNumber - 1];
                    }
                ]);
        }
    }

    var app = new FiltersComponent();
}

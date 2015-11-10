module MyApp.Components.Pagedown {
    class PagedownDirective {
        static $name = 'sxPagedown';
        static $inject = ['$compile', '$timeout'];
        static factory = getFactory(PagedownDirective.$inject, ($compile, $timeout) => new PagedownDirective($compile, $timeout));

        static getConverter() {
            var converter = Markdown.getSanitizingConverter();
            //converter.hooks.chain("preBlockGamut", (text, rbg) => text.replace(/^ {0,3}""" *\n((?:.*?\n)+?) {0,3}""" *$/gm, (whole, inner) => "<blockquote>" + rbg(inner) + "</blockquote>\n"));
            return converter;
        }

        static converter = PagedownDirective.getConverter();

        constructor(private $compile, private $timeout) {
            this.nextId = 0;
        }

        require = 'ngModel';
        replace = true;
        template = '<div class="pagedown-bootstrap-editor"></div>';

        public link = (scope, iElement, attrs, ngModel) => {

            var editorUniqueId;

            if (attrs.id == null) {
                editorUniqueId = this.nextId++;
            } else {
                editorUniqueId = attrs.id;
            }
            var newElement = "";
            if (attrs.previewFirst != null) {
                newElement = this.$compile(
                    '<div>' +
                    '<div id="wmd-preview-' + editorUniqueId + '" class="pagedown-preview wmd-panel wmd-preview"></div>' +
                    '<div class="wmd-panel">' +
                    '<div id="wmd-button-bar-' + editorUniqueId + '"></div>' +
                    '<textarea class="wmd-input" id="wmd-input-' + editorUniqueId + '">' +
                    '</textarea>' +
                    '</div>' +
                    '</div>')(scope);
            } else {
                newElement = this.$compile(
                    '<div>' +
                    '<div class="wmd-panel">' +
                    '<div id="wmd-button-bar-' + editorUniqueId + '"></div>' +
                    '<textarea class="wmd-input" id="wmd-input-' + editorUniqueId + '">' +
                    '</textarea>' +
                    '</div>' +
                    '<div id="wmd-preview-' + editorUniqueId + '" class="pagedown-preview wmd-panel wmd-preview"></div>' +
                    '</div>')(scope);
            }


            iElement.html(newElement);

            var help = () => {
                alert("There is no help");
            };
            var editor = new Markdown.Editor(PagedownDirective.converter, "-" + editorUniqueId, {
                handler: help
            });

            var $wmdInput = iElement.find('#wmd-input-' + editorUniqueId);

            var init = false;

            editor.hooks.chain("onPreviewRefresh", () => {
                var val = $wmdInput.val();
                if (init && val !== ngModel.$modelValue) {
                    this.$timeout(() => {
                        scope.$apply(() => {
                            ngModel.$setViewValue(val);
                            ngModel.$render();
                        });
                    });
                }
            });

            ngModel.$formatters.push(value => {
                init = true;
                $wmdInput.val(value);
                editor.refreshPreview();
                return value;
            });

            editor.run();
        };
        nextId: number;
    }

    angular.module('Components.Pagedown', [])
        .directive(PagedownDirective.$name, PagedownDirective.factory);
}
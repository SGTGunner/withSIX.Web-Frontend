module MyApp.Components.ReallyClick {
    class ReallyClickDirective extends Tk.Directive {
        static $name = 'sxReallyClick';
        static factory = getFactory([], () => new ReallyClickDirective());

        restrict = 'A';
        link = (scope, element, attrs) => {
            element.bind('click', () => {
                var message = attrs.sxReallyMessage;
                if (message && confirm(message))
                    scope.$apply(attrs.sxReallyClick);
            });
        };
    }

    angular.module('Components.ReallyClick', [])
        .directive(ReallyClickDirective.$name, ReallyClickDirective.factory);
}
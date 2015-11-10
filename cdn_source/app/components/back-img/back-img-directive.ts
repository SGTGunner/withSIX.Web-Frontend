module MyApp.Components.BackImg {
    class BackImageDirective extends Tk.Directive {
        static $name = 'sxBackImg';
        static factory = getFactory(['w6'], w6 => new BackImageDirective(w6));

        constructor(private w6: W6) { super(); }

        restrict = 'A';
        link = (scope, element, attrs) => {
            scope.getImage = this.getImage;
            attrs.$observe(BackImageDirective.$name, value => {
                element.css({
                    'background-image': 'url(' + value + ')'
                });
            });
        }; // TODO: rather user sx-default-img attr instead?
        public getImage = (img: string, updatedAt?: Date): string => {
            if (!img || img == "")
                return this.w6.url.cdn + "/img/noimage.png";
            return img.startsWith("http") || img.startsWith("//") ? img : this.w6.url.getUsercontentUrl(img, updatedAt);
        };
    }

    angular.module('Components.BackImg', [])
        .directive(BackImageDirective.$name, BackImageDirective.factory);
}
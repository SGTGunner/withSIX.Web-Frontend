module MyApp.Components.Dfp {
    class DfpDirective extends Tk.Directive {
        static $name = 'sxDfp';
        static $inject = [];
        static factory = getFactory(DfpDirective.$inject, () => new DfpDirective());

        restrict = 'E';
        scope = {};

        link = (scope, element, attrs) => {
            var adSlot = googletag.defineSlot("/19223485/main_rectangle_btf", [[125, 125], [180, 150], [300, 250], [336, 280]], "add-home2").addService(googletag.pubads());
            var mapping = googletag.sizeMapping()
                .addSize([1120, 400], [[336, 280], [300, 250], [180, 150], [125, 125]])
                .addSize([980, 400], [[300, 250], [180, 150], [125, 125]])
                .addSize([768, 400], [[180, 150], [125, 125]])
                .addSize([468, 200], [[336, 280], [300, 250], [180, 150], [125, 125]])
                .addSize([0, 0], [[300, 250], [180, 150], [125, 125]])
                .build();
            adSlot.defineSizeMapping(mapping);
        };
    }

    angular.module('Components.Dfp')
        .directive(DfpDirective.$name, DfpDirective.factory);
}
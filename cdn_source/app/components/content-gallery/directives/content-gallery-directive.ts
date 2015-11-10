module MyApp.Components.ContentGallery {
    // WIP
    class ContentGalleryDirectiveController {
        static $inject = ['$scope', '$element', '$attrs', '$transclude'];
        static viewBase = '/cdn_source/app/components/content-gallery';

        constructor($scope, $element, $attrs, $transclude) {
            $attrs.$observe('gridItemClass', val => {
                if (!angular.isDefined(val)) {
                    $scope.gridItemClass = 'col-sm-6 col-md-4 col-xl-3';
                }
            });

            $attrs.$observe('filterTemplate', val => {
                if (!angular.isDefined(val)) {
                    $scope.filterTemplate = ContentGalleryDirectiveController.viewBase + '/_filters.html';
                }
            });
            $attrs.$observe('gridItemTemplate', val => {
                if (!angular.isDefined(val)) {
                    $scope.gridItemTemplate = ContentGalleryDirectiveController.viewBase + '/_grid_item.html';
                }
            });

            $scope.otherOptions = { view: 'grid' };
            $scope.grid = { overlays: [] };
            $scope.getView = () => {
                return ContentGalleryDirectiveController.viewBase + '/' + $scope.otherOptions.view + '.html';
            };
        }
    }

    class ContentGalleryDirective extends Tk.Directive {
        static $name = 'sxContentGallery';
        static $inject = [];
        static factory = getFactory(ContentGalleryDirective.$inject, () => new ContentGalleryDirective());

        controller = ContentGalleryDirectiveController;
        templateUrl = ContentGalleryDirectiveController.viewBase + '/index.html';
        restrict = 'E';
        scope = {
            items: '=',
            filterTemplate: '@', // = seems to not work if not set at all in the directive inside the html?
            gridItemTemplate: '@',
            gridItemClass: '@',
        };
    }

    angular.module('Components.ContentGallery')
        .directive(ContentGalleryDirective.$name, ContentGalleryDirective.factory);
}
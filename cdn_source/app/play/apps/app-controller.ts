declare var LatLon;
declare var google;

module MyApp.Play.Apps {
    export interface IAppScope extends IContentScopeT<IBreezeApp> {
        app;
    }

    export class AppController extends ContentModelController<IBreezeApp> {
        static $name = 'AppController';
        static $inject = [
            '$q', '$scope', '$timeout',
            '$cookieStore', '$location', '$routeParams', 'w6',
            'logger', 'DoubleClick', '$sce', 'model'
        ];

        constructor(public $q: ng.IQService, public $scope: IAppScope, public $timeout: ng.ITimeoutService,
            public $cookieStore, public $location: ng.ILocationService, public $routeParams: ng.route.IRouteParamsService, w6,
            public logger: Components.Logger.ToastLogger, public dfp, $sce, model: IBreezeApp) {

            super($scope, logger, $routeParams, $q, $sce, model);
            $scope.app = model;
            // TODO; like mods/missions
            $scope.model = <any>{
                app: model,
                content: {
                    header: model.name,
                    menuItems: this.getMenuItems(AppController.menuItems, 'game.appsShow'),
                    url: this.getBaseUrl("apps")
                }
            };
        }

        static menuItems = [
            { header: "Info", segment: "info", isDefault: true }
        ];
    }

    registerController(AppController);
}
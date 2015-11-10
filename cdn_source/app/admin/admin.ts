module MyApp.Admin {
    angular.module('MyAppAdminTemplates', []);

    class AdminModule extends Tk.Module {
        static $name = "AdminModule";

        constructor() {
            super("MyAppAdmin", ['app', 'commangular', 'ngRoute', 'route-segment', 'view-segment', 'Components.Directives', 'Components', 'MyAppAdminTemplates']);
            this.app.config(['$commangularProvider', $commangularProvider => registerCommands(this.commands, $commangularProvider)])
                .config([
                    '$routeProvider', '$routeSegmentProvider', ($r1, $r2) => {
                        var $routeProvider = new Tk.RoutingHandler($r1, $r2);
                        var setupQuery = $routeProvider.setupQuery;
                        var setupQueryPart = $routeProvider.setupQueryPart;

                        $routeProvider.when('/', 'root')
                            .segment('root', {
                                controller: 'RootController',
                                templateUrl: '/cdn_source/app/admin/index.html',
                                permission: [Resource.admin, Permission.Read]
                            })
                            .when('/stats', 'stats')
                            .when('/stats/games', 'stats.games')
                            .when('/stats/content', 'stats.content')
                            .when('/stats/orders', 'stats.orders')
                            .when('/stats/missions', 'stats.missions')
                            .when('/stats/global', 'stats.global')
                            .when('/stats/accounts', 'stats.accounts')
                            .segment('stats', {
                                controller: 'StatsController',
                                templateUrl: '/cdn_source/app/admin/pages/stats.html'
                            })
                            .within()
                            .segment('global', {
                                controller: 'GlobalController',
                                templateUrl: '/cdn_source/app/admin/global/index.html',
                                resolve: setupQuery(GetGlobalIntegersOverviewQuery),
                                default: true
                            })
                            .segment('accounts', {
                                controller: 'AccountsController',
                                templateUrl: '/cdn_source/app/admin/accounts/index.html',
                                resolve: setupQuery(GetAccountOverviewQuery)
                            })
                            .segment('orders', {
                                controller: 'OrdersController',
                                templateUrl: '/cdn_source/app/admin/orders/index.html',
                                resolve: setupQuery(GetOrderOverviewQuery)
                            })
                            .segment('games', {
                                controller: 'GamesController',
                                templateUrl: '/cdn_source/app/admin/games/index.html',
                                resolve: setupQuery(GetGameOverviewQuery)
                            })
                            .segment('content', {
                                controller: 'GamesContentController',
                                templateUrl: '/cdn_source/app/admin/games/content.html',
                                resolve: setupQuery(GetGameContentOverviewQuery)
                            })
                            .segment('missions', {
                                controller: 'MissionsController',
                                templateUrl: '/cdn_source/app/admin/missions/index.html',
                                resolve: setupQuery(GetMissionOverviewQuery)
                            });
                    }
                ]);
        }
    }

    var app = new AdminModule();

    class RootController extends BaseController {
        static $name = "RootController";
    }

    registerController(RootController);

    class StatsController extends BaseController {
        static $name = "StatsController";

        constructor($scope, logger, $q) {
            super($scope, logger, $q);
            $scope.menuItems = this.getMenuItems([
                { header: "Global", segment: "global", isDefault: true },
                { header: "Accounts", segment: "accounts" },
                { header: "Orders", segment: "orders" },
                { header: "Games", segment: "games" },
                { header: "Content", segment: "content" },
                { header: "Missions", segment: "missions" }
            ], "stats");
        }
    }

    registerController(StatsController);


    class OrdersController extends BaseQueryController<any> {
        static $name = 'OrdersController';

        constructor(public $scope: IBaseScopeT<any>, public logger, $q, model: any) {
            super($scope, logger, $q, model);
        }
    }

    registerController(OrdersController);

    class AccountsController extends BaseQueryController<any> {
        static $name = 'AccountsController';

        constructor(public $scope: IBaseScopeT<any>, public logger, $q, model: any) {
            super($scope, logger, $q, model);
        }
    }

    registerController(AccountsController);

    class MissionsController extends BaseQueryController<any> {
        static $name = 'MissionsController';

        constructor(public $scope: IBaseScopeT<any>, public logger, $q, model: any) {
            super($scope, logger, $q, model);
        }
    }

    registerController(MissionsController);

    class GlobalController extends BaseQueryController<any> {
        static $name = 'GlobalController';

        constructor(public $scope: IBaseScopeT<any>, public logger, $q, model: any) {
            super($scope, logger, $q, model);
        }
    }

    registerController(GlobalController);

    class GamesController extends BaseQueryController<any> {
        static $name = 'GamesController';

        constructor(public $scope: IBaseScopeT<any>, public logger, $q, model: any) {
            super($scope, logger, $q, model);
        }
    }

    registerController(GamesController);

    class GamesContentController extends BaseQueryController<any> {
        static $name = 'GamesContentController';

        constructor(public $scope: IBaseScopeT<any>, public logger, $q, model: any) {
            super($scope, logger, $q, model);
        }
    }

    registerController(GamesContentController);


    export function registerService(service) { app.app.service(service.$name, service); }

    export function registerController(controller) { app.app.controller(controller.$name, controller); }

    export function registerCQ(command) { app.registerCommand(command); }

    class GetOrderOverviewQuery extends MyApp.DbQueryBase {
        static $name = 'GetOrderOverview';
        public execute = [
            () => this.context.getCustom('admin/orders')
            .then(r => r.data)
        ];
    }

    registerCQ(GetOrderOverviewQuery);

    class GetMissionOverviewQuery extends MyApp.DbQueryBase {
        static $name = 'GetMissionOverview';
        public execute = [() => {}]; // TODO
    }

    registerCQ(GetMissionOverviewQuery);


    class GetGlobalIntegersOverviewQuery extends MyApp.DbQueryBase {
        static $name = 'GetGlobalIntegersOverview';
        public execute = [
            () => this.context.getCustom('admin/globalintegers')
            .then(r => r.data)
        ];
    }

    registerCQ(GetGlobalIntegersOverviewQuery);


    class GetGameOverviewQuery extends MyApp.DbQueryBase {
        static $name = 'GetGameOverview';
        public execute = [
            () => this.context.getCustom('admin/games')
            .then(r => r.data)
        ];
    }

    registerCQ(GetGameOverviewQuery);

    class GetGameContentOverviewQuery extends MyApp.DbQueryBase {
        static $name = 'GetGameContentOverview';
        public execute = [() => this.context.getCustom('admin/games/content').then(r => r.data)];
    }

    registerCQ(GetGameContentOverviewQuery);

    class GetAccountOverviewQuery extends MyApp.DbQueryBase {
        static $name = 'GetAccountOverview';
        public execute = [
            () => this.context.getCustom('admin/accounts')
            .then(r => r.data)
        ];
    }

    registerCQ(GetAccountOverviewQuery);
}
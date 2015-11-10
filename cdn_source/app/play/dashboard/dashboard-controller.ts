module MyApp.Play.Dashboard {
    export interface IDashboardScope extends IBaseScope {
    }

    export class DashboardController extends BaseController {
        static $name = 'DashboardController';
        static $inject = ['$scope', 'logger', '$q'];

        constructor($scope: IDashboardScope, public logger, $q) {
            super($scope, logger, $q);
        }
    }

    registerController(DashboardController);
}
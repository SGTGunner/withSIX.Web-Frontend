module MyApp.Play.Missions {
    export interface IPublishVersionScope extends IBaseScope {
        mission;
        submit: (form) => void;
        routeParams;
    }

    export class PublishVersionController extends BaseController {
        static $name = 'PublishVersionController';
        static $inject = ['$scope', 'logger', '$timeout', '$routeParams', '$q', 'model'];

        constructor(public $scope: IPublishVersionScope, public logger, private $timeout, private $routeParams, $q, model) {
            super($scope, logger, $q);
            $scope.routeParams = $routeParams;
            $scope.mission = model;
            $scope.submit = this.submit;
        }

        private submit = () => this.requestAndProcessResponse(PublishMissionCommand, { missionId: Tools.fromShortId(this.$routeParams.missionId), versionSlug: this.$routeParams.versionSlug, data: this.$scope.mission });
    }

    registerController(PublishVersionController);
}
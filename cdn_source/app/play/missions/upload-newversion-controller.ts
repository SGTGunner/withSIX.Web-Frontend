module MyApp.Play.Missions {
    export interface IUploadNewversionScope extends IBaseScope {
        routeParams;
        submit: (form) => void;
        mission: { files?; };
        updateFileInfo: (files) => void;
    }

    export class UploadNewversionController extends BaseController {
        static $name = 'UploadNewversionController';
        static $inject = ['$scope', 'logger', '$timeout', '$routeParams', '$q'];

        constructor(public $scope: IUploadNewversionScope, public logger, $timeout, private $routeParams, $q) {
            super($scope, logger, $q);

            $scope.routeParams = $routeParams;
            $scope.submit = this.submit;
            $scope.mission = {};
            $scope.updateFileInfo = this.updateFileInfo;
        }

        public updateFileInfo = (files) => {
            Debug.log("updateFileInfo", files);
            this.$scope.mission.files = files;
        };
        public submit = () => {
            this.requestAndProcessResponse(UploadNewMissionVersionCommand, { missionId: Tools.fromShortId(this.$routeParams.missionId), files: this.$scope.mission.files });
        };
    }

    registerController(UploadNewversionController);
}
module MyApp.Play.Missions {
    export interface IEditMissionScope extends IBaseScope {
        model;
        submit: (form) => void;
        routeParams;
        addFeature: () => void;
        removeFeature: (feature) => void;
        updateFileInfo: (files) => void;
        files;
        addVideo: () => void;
        removeVideo: (video) => void;
        reloadPage: () => any;
    }

    export class EditMissionController extends BaseController {
        static $name = 'EditMissionController';
        static $inject = ['$scope', 'logger', '$timeout', '$routeParams', '$q', '$routeSegment', 'w6', 'model'];

        constructor(public $scope: IEditMissionScope, public logger, private $timeout, private $routeParams, $q, $routeSegment, w6: W6, model) {
            super($scope, logger, $q);
            $scope.routeParams = $routeParams;
            $scope.submit = this.submit;
            $scope.addFeature = this.addFeature;
            $scope.removeFeature = this.removeFeature;
            $scope.addVideo = this.addVideo;
            $scope.removeVideo = this.removeVideo;
            $scope.updateFileInfo = this.updateFileInfo;
            $scope.reloadPage = () => $routeSegment.chain[$routeSegment.chain.length - 1].reload();

            this.$scope.model = model;
            this.$timeout(() => w6.slider.init());
        }

        public updateFileInfo = (files) => {
            Debug.log("updateFileInfo", files);
            this.$scope.files = files;
        };
        private addFeature = () => {
            this.$scope.model.features.push({ Name: "", Content: "" });
        };
        private addVideo = () => {
            this.$scope.model.videos.push({ Path: "" });
        };
        private removeFeature = (feature) => {
            var array = this.$scope.model.features;
            array.splice(array.indexOf(feature), 1);
        };
        private removeVideo = (video) => {
            var array = this.$scope.model.videos;
            array.splice(array.indexOf(video), 1);
        };
        private submit = () => this.requestAndProcessResponse(UpdateMissionCommand, { missionId: Tools.fromShortId(this.$routeParams.missionId), data: this.$scope.model, files: this.$scope.files });
    }

    registerController(EditMissionController);
}
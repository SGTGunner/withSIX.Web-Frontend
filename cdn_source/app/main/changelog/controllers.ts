module MyApp.Main.Changelog {
    class ChangelogController extends BaseController {
        static $inject = ['$scope', 'logger', '$q', 'model'];
        static $name = 'ChangelogController';

        constructor($scope, logger, $q, model) {
            super($scope, logger, $q);

            $scope.changelog = model;

            $scope.changelogOldShown = false;
            $scope.toggleOlderChangelogs = () => {
                if ($scope.changelogOld) {
                    $scope.changelogOldShown = !$scope.changelogOldShown;
                } else if (!$scope.changelogOldShown) {
                    $scope.changelogOldShown = true;
                    $scope.request(GetChangelogOldQuery)
                        .then(result => $scope.changelogOld = result.lastResult);
                }
            };
        }
    }

    registerController(ChangelogController);

    export class GetChangelogQuery extends DbQueryBase {
        static $name = 'GetChangelog';
        public execute = [() => this.context.getDocMd("CHANGELOG.md", true)];
    }

    registerCQ(GetChangelogQuery);

    export class GetChangelogOldQuery extends DbQueryBase {
        static $name = 'GetChangelogOld';
        public execute = [() => this.context.getDocMd("CHANGELOG_HISTORY.md", true)];
    }

    registerCQ(GetChangelogOldQuery);

    export interface IUpdateScope extends IBaseScope {
        updateClient: () => Promise<any>;
        model: {
            isUptodate: boolean;
            blogPosts;
        };
        changelog: string;
        blogUrl: string;
    }

    class UpdateController extends BaseController {
        static $name = "UpdateController";
        static $inject = ['$scope', 'logger', '$q', 'modInfoService', 'model'];

        constructor(public $scope: IUpdateScope, public logger, public $q, private modInfoService: Components.ModInfo.ModInfoService, model) {
            super($scope, logger, $q);

            // TODO: Read out the current state from the client.. (detect client, and if there actually is an update, or is already updating etc)
            $scope.model = {
                isUptodate: false,
                blogPosts: []
            };
            $scope.changelog = model;
            $scope.updateClient = () => {
                //$scope.model.isUpdating = true;
                return this.processCommand(modInfoService.updateMiniClient(), "Client updated")
                    .then(x => {
                    //$scope.model.isUpdating = false;
                    $scope.model.isUptodate = true;
                });
                //.catch(x => $scope.model.isUpdating = false);
            };

            $scope.blogUrl = $scope.url.main + '/blog';

            $scope.request(Main.Blog.GetBlogsQuery, { team: false })
                .then(x => {
                    $scope.model.blogPosts = x.lastResult;
                });
        }
    }

    registerController(UpdateController);

    export class GetMiniChangelogQuery extends DbQueryBase {
        static $name = 'GetMiniChangelog';
        public execute = [() => this.context.getDocMd("CHANGELOG.md", true)];
    }

    registerCQ(GetMiniChangelogQuery);
}

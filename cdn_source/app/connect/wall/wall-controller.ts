module MyApp.Connect.Wall {
    export interface IWallScope extends IBaseScope {
        posts: any[];
        contacts: any[];
        contactListShown: boolean;
        showContactList: {};
    }

    export class WallController extends BaseController {
        static $name = 'WallController';
        static $inject = [
            '$q', '$scope', '$timeout',
            '$cookieStore', '$location', '$routeParams', 'w6',
            'logger', 'signalrService'
        ];

        constructor(public $q: ng.IQService, public $scope: IWallScope, private $timeout: ng.ITimeoutService,
            public $cookieStore, public $location: ng.ILocationService, public $routeParams: ng.route.IRouteParamsService, w6,
            public logger: Components.Logger.ToastLogger, private signalrService) {

            super($scope, logger, $q);

            $scope.contactListShown = false;
            $scope.showContactList = () => {
                $scope.contactListShown = !$scope.contactListShown;
            };
            this.getStream();
            this.getContacts();
        }

        // TODO: Convert to Query Objects
        private getStream() {
            this.getStreamQuery()
                .then(this.querySucceeded)
                .catch(this.breezeQueryFailed);
        }

        private getContacts() {
            this.getContactsQuery()
                .then(this.usersQuerySucceeded)
                .catch(this.breezeQueryFailed);
        }

        public querySucceeded = (data) => {
            this.$scope.posts = data.results;
        };
        usersQuerySucceeded = (data) => {
            this.$scope.contacts = data.results;
        }; // TODO: Convert to CDNUrl (currently AzureCDN)
        placeHolderAvatar = "//az667488.vo.msecnd.net/img/avatar/noava_48.jpg";

        getPlaceHolderComment() {
            return {
                author: {
                    displayName: "Sven",
                    avatar: this.placeHolderAvatar
                },
                createdAt: Date.now(),
                content: "I really dig this stuff!<br />some basic text without formatting<br />not too shabby..."
            };
        }

        getPlaceHolderPost(commentCount) {
            var comments = [];
            for (var i = 0; i < commentCount; i++) {
                comments.push(this.getPlaceHolderComment());
            }
            return {
                title: "Someones first post",
                author: {
                    displayName: "Martin",
                    avatar: this.placeHolderAvatar
                },
                content: "Most awesome-est post<br />gotto love it",
                createdAt: Date.now(),
                comments: comments
            };
        }

        getStreamQuery() {
            var deferred = this.$q.defer();
            deferred.resolve({
                results: [
                    this.getPlaceHolderPost(1),
                    this.getPlaceHolderPost(2),
                    this.getPlaceHolderPost(3),
                    this.getPlaceHolderPost(4),
                    this.getPlaceHolderPost(3),
                    this.getPlaceHolderPost(2),
                    this.getPlaceHolderPost(1),
                    this.getPlaceHolderPost(4)
                ]
            });

            return deferred.promise;
        }

        getContactsQuery() {
            var deferred = this.$q.defer();
            deferred.resolve({
                results: [
                    {
                        displayName: "Martin",
                        slug: "martin",
                        avatar: this.placeHolderAvatar
                    }, {
                        displayName: "Sven",
                        slug: "paragraphic-l",
                        avatar: this.placeHolderAvatar
                    }, {
                        displayName: "Oliver",
                        slug: "ocbaker",
                        avatar: this.placeHolderAvatar
                    }, {
                        displayName: "Group 1",
                        slug: "group-1",
                        avatar: this.placeHolderAvatar
                    }, {
                        displayName: "Group 2",
                        slug: "group-2",
                        avatar: this.placeHolderAvatar
                    }
                ]
            });
            return deferred.promise;
        }
    }

    registerController(WallController);
}
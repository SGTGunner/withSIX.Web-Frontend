module MyApp {
    export class MainAppController extends BaseController {
        static $name = "MainAppController";
        static $inject = ['$scope', 'usSpinnerService', 'logger', 'w6', '$location', '$q', '$timeout', '$rootScope', '$anchorScroll', 'modInfoService', 'aur.eventBus'];

        constructor($scope, private $spinner, logger, private w6: W6, private $location: ng.ILocationService, $q: ng.IQService, private $timeout: ng.ITimeoutService, private $rootScope: IRootScope, $anchorScroll,
            modInfoService: Components.ModInfo.ModInfoService, private eventBus: IEventBus) {
            super($scope, logger, $q);

            $rootScope.logout = () => w6.logout();
            $rootScope.openLoginDialog = evt => {
                if (evt) evt.preventDefault();
                w6.openLoginDialog(evt);
            };
            w6.openRegisterDialog = (event) => this.openRegisterDialog(event);
            w6.openSearch = (event) => this.openSearch(event);

            $rootScope.ready = () => {
                Debug.log('ready');
                $rootScope.status = 'ready';
                (<any>window).prerenderReady = true;

                if (this.first) {
                    if (this.w6.renderAds)
                        this.w6.ads.refreshAds();
                } else {
                    this.first = true;
                    if (this.w6.renderAds)
                        this.w6.ads.check();
                }

                $anchorScroll();

                if (!$rootScope.$$phase) $rootScope.$apply();
            };
            $rootScope.startLoading = () => {
                $rootScope.status = 'loading';
                if (!$rootScope.$$phase) $scope.$apply();
            };

            $rootScope.initialLoad = true;

            // TODO: Somehow fix loading indication of the initial page load...
            var destroyList = [];
            destroyList.push($rootScope.$on('$routeChangeStart', this.routeStart));
            destroyList.push($rootScope.$on('loadingStatusActive', this.showSpinner));
            destroyList.push($rootScope.$on('loadingStatusInactive', this.hideSpinner));
            destroyList.push($rootScope.$on('$routeChangeError', this.routeError));
            destroyList.push($rootScope.$on('$routeChangeSuccess', this.routeSuccess));
            destroyList.push($rootScope.$on('$locationChangeSuccess', () => {
                this.setupDefaultTitle();
                $rootScope.setMicrodata(null);
                $rootScope.url.currentPage = $location.absUrl().split('#')[0];
            }));

            destroyList.push($rootScope.$on('$viewContentLoaded', () => {
                Debug.log('ANGULAR: view content loaded success');
            }));

            modInfoService.connectMiniClient();
            modInfoService.contentHub.connection.stateChanged((state) => {
                switch (<Components.Signalr.ConnectionState>state.newState) {
                    case Components.Signalr.ConnectionState.connected:
                        this.applyIfNeededOnScope(() => {
                            this.$rootScope.isClientConnected = true;
                            this.$rootScope.w6.isClientConnected = true;
                        }, this.$rootScope);
                        $('a.clientdownload').hide(); // TODO: No Dom manipulation in controllers..

                        modInfoService.execClientHub('getInfo')
                            .then(this.infoReceived)
                            .catch(r => Debug.log("Failed MiniClientHub: " + r));

                        if (this.w6.userInfo.isPremium)
                            modInfoService.execClientHub('confirmPremium')
                                .catch(r => {
                                  Debug.log("Failed Confirming premium: " + r);
                                return null;
                              });
                        break;
                    case Components.Signalr.ConnectionState.disconnected:
                    case Components.Signalr.ConnectionState.reconnecting:
                        this.applyIfNeededOnScope(() => {
                            this.$rootScope.isClientConnected = false;
                            this.$rootScope.w6.isClientConnected = false;
                            this.$rootScope.miniClient = null;
                        }, this.$rootScope);
                        $('a.clientdownload').show(); // TODO: No Dom manipulation in controllers..
                        break;
                    default:
                }
            });

            $scope.$on("client.appStateUpdated", (evt, info) => {
                this.applyIfNeededOnScope(() => {
                    var miniClientInfo = this.$rootScope.miniClient;
                    if (miniClientInfo != null)
                        miniClientInfo.newVersionAvailable = info.newVersionAvailable;
                }, $rootScope);
            });

            $scope.$on('$destroy', () => destroyList.forEach(x => x()));

            this.backwardsCompatibility();
        }

        openLoginPortal(evt) {
            if (evt) evt.preventDefault();
            this.$scope.request(LoginSpaCommand);
        }
        openRegisterDialog(evt) {
            if (evt) evt.preventDefault();
            this.$scope.request(Components.Dialogs.OpenRegisterDialogQuery);
        }
        openSearch(evt) {
            if (evt) evt.preventDefault();
            this.$scope.request(Components.Dialogs.OpenSearchDialogQuery);
        }

        // TODO: Handle this rather in a controller?
        infoReceived = (info: IMiniClientInfo) => {
            this.applyIfNeededOnScope(() => {
                this.$rootScope.miniClient = info;
            }, this.$rootScope);

            // TODO: Parse version + semver info,
            // TODO: Retrieve and store latest infos for each branch, by periodically getting the info from the withsix.com CDN?
            // TODO: Perhaps use this rather as last resort. but rather have the info query include if the client is uptodate ;-)
            // newVersion = "1.0.0-beta201507091";
            //if (info.version != newVersion) {
            // this.newVersionAvailable(newVersion);
            //}

            if (info.newVersionAvailable != null)
                this.newVersionAvailable(info.newVersionAvailable);
        };

        newVersionAvailable = newVersion => {
            if (window.location.href.includes("/update"))
                return;
            setTimeout(() =>  {
              this.logger.info(
                `Client v${newVersion} is available for download, click here to update now.`,
                "Sync Update available!", {
                  onclick: () => this.eventBus.publish(new window.w6Cheat.containerObjects.navigate("/update")),
                  timeOut: 10 * 1000
              });
            }, 3000);
        };

        private routeStart = (scope, next, current) => {
            Debug.log('ANGULAR: route start');
            var nextRoute = next.$$route;
            if (!nextRoute)
                return;
            var permission = nextRoute.permission;
            if (permission && !this.$scope.w6.userInfo.hasPermission(permission[0], permission[1]))
                this.$location.url('/errors/403');
            var role = nextRoute.role;
            if (role && !this.$scope.w6.userInfo.isInRoles(role)) {
                this.$scope.openLoginDialog(null);
            }
            this.$rootScope.startLoading();
        }

        private routeSuccess = () => {
            Debug.log('ANGULAR: route change success');
            if (!initialCompleted) {
                this.$timeout(() => {
                    Debug.log('ANGULAR: initialRouteSuccess');
                    initialCompleted = true;
                });
            }
            // Angular SEO..
            //this.$timeout(() => {
            //  if ($rootScope.loadingStatus.outstanding == 0 && $rootScope.status == 'loading') $rootScope.ready();
            //}, 500);
        };
        private showSpinner = () => {
            this.$scope.loading = true;
            this.$spinner.spin('fetch-spinner');
        };
        private hideSpinner = () => {
            this.$scope.loading = false;
            this.$spinner.stop('fetch-spinner');
        };
        private routeError = (evt, current, previous, rejection) => {
            Debug.log("Error loading page", evt, current, previous, rejection);
            if (rejection.message)
                this.logger.error(rejection.message, "Failed loading page");
            else
                this.logger.error(rejection.data.message + "\n(" + rejection.status + ": " + rejection.statusText + ")");

        }; // These help us bring Angular awesomeness to outside the current scope of ng-app; something we'll improve on in the future...
        // Generally you should NOT manipulate DOM directly from within controllers. But directives / binding instead.
        backwardsCompatibility() {
            jQuery(document).ready(() => {
                this.w6.handleClient();
                this.legacy();
            });
        }

        legacy() {
            var self = this;

            // Toggle UserMenu - TODO Convert to Bootstrap
            $('body').on('click', '#btn-usermenu', function(e) {
                // prevent normal behvavior
                e.preventDefault();
                // usermenu Int
                self.w6.usermenu.init();

                // blur button
                $(this).blur();
            });

            this.$rootScope.handleDownloads();

            var w = $(window);
            var wasWidth = w.width();
            var resizeTO = null;
            w.resize(() => {
                if (resizeTO) clearTimeout(resizeTO);
                resizeTO = setTimeout(() => {
                    var width = w.width();
                    if (!wasWidth || wasWidth != width) {
                        w.trigger('resizeEnd', [wasWidth, width]);
                        wasWidth = width;
                    }
                }, 500);
            });

            // Init Forms
            self.w6.forms.init();

            $('body').on('click', '.share-bbcode', function(e) {
                // prevent default behavior
                e.preventDefault();
                window.prompt("Copy to clipboard: Ctrl+C, Enter", $(this).attr("data-bbcode"));
            });

            // Scroll to top button
            $('body').on('click', '#btn-scroll-to-top', e => {
                // prevent default behavior
                e.preventDefault();

                // Scroll to top
                self.w6.scrollTo(0, 600);
            });

            // Make fancy scroll Annimation to all Anchor internal links
            $('body').on('click', 'a[href^="#"]', function(e) {
                e.preventDefault();
                // Removeing '#' form href
                var anchorname = $(this).attr('href').substr(1);
                if (anchorname != '')
                    self.w6.scrollToAnchor(anchorname);
            });


            // Textarea max length
            if ($('.wmd-input[maxlength]').length > 0) {
                var elements = $('.wmd-input[maxlength]');


                // Key up events
                elements.on('keyup', function(e) {
                    var maxChars = parseInt($(this).attr('maxlength'));
                    var curChars = $(this).val().length;
                    var charsLeft = maxChars - curChars;

                    if (charsLeft >= 0) {
                        $(this).parent().find('span.charsleft em').empty().append(charsLeft.toString());
                    } else {
                        e.preventDefault();
                    }
                });


                // Handleing pahge refresh, reset the textarea to max chars
                elements.each(function(i, element) {
                    var maxChars = parseInt($(this).attr('maxlength'));
                    var curChars = $(this).val().length;
                    var charsLeft = maxChars - curChars;

                    $(this).parent().find('span.charsleft em').empty().append(charsLeft.toString());

                });

            }

            // Pop Out by colorbox
            if ($(".popgroup").length > 0) $(".popgroup").colorbox({ rel: 'group2', transition: "fade" });

            $('a[rel=external]').attr('target', '_blank');

            if (self.w6.renderAds)
                w.on('resizeEnd', (e, previous, current) => self.w6.ads.processAdSlots(previous, current));

        }

        private first;
    }

    export class LoadingController extends BaseController {
        static $name = 'LoadingController';
        static $inject = ['$scope', 'logger', '$q', '$timeout', '$rootScope'];

        constructor($scope, logger, $q, $timeout, $rootScope) {
            super($scope, logger, $q);
            $rootScope.loadingStatus.increment();
            $scope.$on('$destroy', () => $timeout(() => $rootScope.loadingStatus.decrement(), 500));
        }
    }

    registerController(LoadingController);

    export class StaticPageController extends BaseController {
        static $name = 'StaticPageController';
        static $inject = ['$scope', 'logger', '$q', 'ForwardService'];

        constructor(public $scope: IBaseScope, public logger, public $q, forwardService: Components.ForwardService) {
            super($scope, logger, $q);
            $scope.$on('$destroy', () => {
                $('div#static-body').remove();
            });
            Debug.log('static page controller init', initialCompleted);
            if (initialCompleted)
                forwardService.reload();
            //else
            //this.$scope.ready();
        }
    }

    registerController(StaticPageController);

    export class AureliaPageController extends BaseController {
        static $name = 'AureliaPageController';
        static $inject = ['$scope', 'logger', '$q'];

        constructor(public $scope: IBaseScope, public logger, public $q) {
            super($scope, logger, $q);
            Debug.log('aurelia page controller init', initialCompleted);
        }
    }

    registerController(AureliaPageController);

    export class LoadingFailedController extends Tk.Controller {
        static $name = 'LoadingFailedController';
        static $inject = ['$scope', 'logger', 'ForwardService', 'error'];

        constructor($scope, logger, private forwardService: Components.ForwardService, error) {
            super($scope);
            var errorMsg = LoadingFailedController.getErrorMsg(error);

            $scope.reason = (errorMsg[1] != null ? (errorMsg[1] + ": ") : "") + errorMsg[0];
            $scope.title = errorMsg.length >= 3 ? errorMsg[2] : "Oops! Loading failed :(";

            if (error.constructor == Tk.RequireSslException) {
                forwardService.switchToSsl();
            } else if (error.constructor == Tk.RequireNonSslException) {
                forwardService.switchToNonSsl();
            }
        }

        public static getErrorMsg = (reason) => {
            if (reason.constructor == Tk.NotFoundException || reason.constructor == Tk.InvalidShortIdException) {
                return [reason.message, "404: The requested resource could not be found"];
            }

            if (reason.constructor == Tk.RequireSslException) {
                return [reason.message, "please wait until you are redirected", "Requires SSL"];
            }

            if (reason.constructor == Tk.RequireNonSslException) {
                return [reason.message, "please wait until you are redirected", "Requires NO-SSL"];
            }

            if (reason.httpResponse != null) {
                var breezeReason = <IBreezeErrorReason>reason;
                if (breezeReason.httpResponse.data) {
                  if (breezeReason.httpResponse.data.ExceptionType && breezeReason.httpResponse.data.ExceptionMessage) {
                      var exType = breezeReason.httpResponse.data.ExceptionType;
                      switch (exType) {
                      case "SN.withSIX.Api.Models.Exceptions.ArchivedException":
                          return [breezeReason.httpResponse.data.ExceptionMessage, null, "This Content is currently unavailable"];
                          break;
                      default:
                          return [breezeReason.httpResponse.data.ExceptionMessage, 'Unknown Error'];
                      }
                  } else {
                      return [breezeReason.httpResponse.data.Message, 'Unknown Error'];
                  }
                } else {
                  return ["Site down?!", 'Unknown Error'];
                }
            }
            if (!reason.data) {
                return [reason, 'Unknown error'];
            }
            var message = reason.data.message;
            if (reason.data.modelState) {
                angular.forEach(reason.data.modelState, (v, k) => {
                    message += "\n" + v;
                });
            }

            return [message + "\n(" + reason.status + ": " + reason.statusText + ")", "Request failed"];
        };
    }

    registerController(MainAppController);
    registerController(LoadingFailedController);

    // TODO: Somehow make the client logout use this??
    class LogoutCommand extends DbCommandBase {
        static $name = 'Logout';

        static $inject = ['dbContext', '$q', '$location', 'localStorageService', 'ForwardService'];

        constructor(dbContext, $q, private $location, private $localStorage, private forwardService: Components.ForwardService) {
            super(dbContext);
        }

        public execute = [
            () => this.context.postCustom(this.context.w6.url.authSsl + '/api/login/logout', null, { withCredentials: true })
            .then(() => MyApp.ngToken = null)
            //.then(() => this.$localStorage.remove('ngToken'))
            .then(() => this.forwardService.forwardNaked(this.context.w6.url.connectSsl + '/logout?ReturnUrl=' + window.location.href))
            //.catch(() => this.forwardService.reload())
        ];
    }

    registerCQ(LogoutCommand);

    export interface IBreezeErrorReason extends IBreezeHttpResponse<IHttpResponse<IHttpResponseException>> {
    }

    export interface IBreezeHttpResponse<TResponse> {
        httpResponse: TResponse;
        entityManager: breeze.EntityManager;
        query: breeze.EntityQuery;
        status: number;
        message: string;
    }

    export interface IHttpResponse<TData> {
        data: TData;
        status: number;
        statusText: string;
    }

    export interface IHttpResponseException {
        $id: string;
        $type: string;
        ExceptionMessage: string;
        ExceptionType: string;
        Message: string;
        StackTrace?: string;
    }
}

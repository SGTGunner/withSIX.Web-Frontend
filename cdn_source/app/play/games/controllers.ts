module MyApp.Play.Games {
    import ClientInfo = MyApp.Components.ModInfo.IClientInfo;
    import ConnectionState = MyApp.Components.Signalr.ConnectionState;
    import BasketService = MyApp.Components.Basket.BasketService;

    interface IGamesScope extends IBaseScopeT<IBreezeGame[]> {

    }

    class GamesController extends BaseQueryController<IBreezeGame[]> {
        static $name = "GamesController";

        constructor(public $scope: IGamesScope, public logger, $q, model: IBreezeGame[]) {
            super($scope, logger, $q, model);
            // TODO: Move to Directive..
            $('#header-row').attr('style', 'background-image: url("' + $scope.url.getAssetUrl('img/play.withSIX/header.jpg') + '");');
            $('body').removeClass('game-profile');
        }
    }

    registerController(GamesController);

    export interface IGameScope extends IBaseScopeT<IBreezeGame>, IBaseGameScope {

    }

    class GameController extends BaseQueryController<IBreezeGame> {
        static $name = "GameController";

        static $inject = [
            '$scope', 'logger', '$q', 'dbContext', 'model', 'modInfoService',
            '$rootScope', 'basketService', 'aur.eventBus'
        ];

        constructor(public $scope: IGameScope, public logger, $q, dbContext, model: IBreezeGame, private modInfo: Components.ModInfo.ModInfoService,
            $rootScope: IRootScope, basketService: Components.Basket.BasketService, private eventBus: IEventBus) {
            super($scope, logger, $q, model);

            $scope.gameUrl = $scope.url.play + "/" + model.slug;
            $scope.game = model;

            var basketGames = ["BE87E190-6FA4-4C96-B604-0D9B08165CC5".toLowerCase(), "8BA4D622-2A91-4149-9E06-EF40DF4E2DCB".toLowerCase()];
            if (basketGames.some(x => model.id.toLowerCase() == x)) {
                this.eventBus.publish(new window.w6Cheat.containerObjects.enableBasket());
            }

/*            Debug.r.staging(() => {
                function hasOwnProperty(obj, prop) {
                    var proto = obj.__proto__ || obj.constructor.prototype;
                    return (prop in obj) &&
                    (!(prop in proto) || proto[prop] !== obj[prop]);
                }

                modInfo.retrieveModInformationByGame(model.id).then((info) => $scope.modInfoes = info);
                modInfo.listenToChangedEvent((evt) => {
                    Debug.log("Mod Info Updated: ", evt);
                    $scope.modInfoes[evt.id] = evt;
                });
            });*/

            // TODO: Duplicate in basket-service
            $scope.getItemStateClass = (item: Components.Basket.IBasketItem): string => {
                var clientInfo = <ClientInfo>(<any>$scope).clientInfo;
                var ciItem = clientInfo.content[item.id];
                var postState = "";

                if (!$rootScope.isClientConnected) {
                    if (basketService.settings.hasConnected) {
                        if ($scope.showBusyState())
                            return "busy";
                        return "no-client";
                    } else {
                        return "install";
                    }
                }
                //if ($scope.clientInfo.gameLock || $scope.clientInfo.globalLock) {
                //    return "busy";
                //}
                if ($scope.showBusyState())
                    postState = "-busy";
                if (ciItem == null)
                    return "install" + postState;
                switch (ciItem.state) {
                case Components.ModInfo.ItemState.Installing:
                    return "installing" + postState;
                case Components.ModInfo.ItemState.NotInstalled:
                    return "install" + postState;
                case Components.ModInfo.ItemState.Uninstalled:
                    return "install" + postState;
                case Components.ModInfo.ItemState.Uninstalling:
                    return "installing" + postState;
                case Components.ModInfo.ItemState.UpdateAvailable:
                    return "updateavailable" + postState;
                case Components.ModInfo.ItemState.Updating:
                    return "updating" + postState;
                case Components.ModInfo.ItemState.Uptodate:
                    return "uptodate" + postState;
                default:
                    return "install" + postState;
                }
            }

            var items = [];

            if (model.supportsStream)
                items.push({ header: "Stream", segment: "stream", icon: "withSIX-icon-Nav-Stream", isDefault: true });

            if (model.supportsMods) {
                items.push({ header: "Mods", segment: "mods", icon: "withSIX-icon-Nav-Mod" });
                this.$scope.openAddModDialog = () => this.$scope.request(OpenAddModDialogQuery, { gameSlug: model.slug });
                this.$scope.openAddCollectionDialog = () => this.eventBus.publish(new window.w6Cheat.containerObjects.openCreateCollectionDialog(model));
            }

            if (model.supportsMissions)
                items.push({ header: "Missions", segment: "missions", icon: "withSIX-icon-Nav-Mission" });

            if (model.supportsCollections)
                items.push({ header: "Collections", segment: "collections", icon: "withSIX-icon-Nav-Collection" });

            if (model.supportsServers && $scope.environment != Tk.Environment.Production)
                items.push({ header: "Servers", segment: "servers", icon: "withSIX-icon-Nav-Server" });

            if ($scope.environment != Environment.Production)
                items.push({ header: "Apps", segment: "apps", icon: "withSIX-icon-Apps" });

            if ($scope.w6.enableBasket)
              items.push({ header: "My Library", segment: "library", icon: "withSIX-icon-Folder", url: "/me/library/" + model.slug, isRight: true });

            // TODO: if owns game (get from client, then hide this)
            items.push({ header: "Buy " + model.name, segment: "order", icon: "withSIX-icon-Card-Purchase", isRight: true });

            $scope.menuItems = this.getMenuItems(items, "game");

            $scope.followedMods = {};
            $scope.followedMissions = {};
            $scope.subscribedCollections = {};

            if ($scope.w6.userInfo.id) {
                dbContext.get('FollowedMods', { gameSlug: model.slug })
                    .then(results => this.subscriptionQuerySucceeded(results, $scope.followedMods))
                    .catch(this.breezeQueryFailed);
                dbContext.get('FollowedMissions', { gameSlug: model.slug })
                    .then(results => this.subscriptionQuerySucceeded(results, $scope.followedMissions))
                    .catch(this.breezeQueryFailed);
                dbContext.get('SubscribedCollections', { gameSlug: model.slug })
                    .then(results => this.subscriptionQuerySucceeded(results, $scope.subscribedCollections))
                    .catch(this.breezeQueryFailed);
            }

            // TODO: Reflect the 'busy' state (globalLock/gameLock/contentLock) better in the UI
            // TODO: Access clientInfo.content[content.id] in the various Mods, Missions and Collections Views..
            // - if a mod is not installed, then the entry for the content won't exist (resulting in null)
            // - if a mod is in a Progress state (Installing, Updating, etc) then we should also disable buttons / reflect this state in the UI.
            //  - with perhaps the ability to abort the in progress action..
            $scope.clientInfo = {
                content: {},
                // TODO: status is currently in the client something global.., must be made per game
                status: <Components.ModInfo.IClientStatus>{},
                globalLock: false,
                gameLock: false,
                isRunning: false
            }

            $scope.$on("status.locked", () => this.applyIfNeeded(() => $scope.clientInfo.globalLock = true));
            $scope.$on("status.unlocked", () => this.applyIfNeeded(() => $scope.clientInfo.globalLock = false));
            $scope.$on("status.launchedGame", (evt, id) => {
                if (model.id == id)
                    this.applyIfNeeded(() => $scope.clientInfo.isRunning = true);
            });
            $scope.$on("status.terminatedGame", (evt, id) => {
                if (model.id == id)
                    this.applyIfNeeded(() => $scope.clientInfo.isRunning = false);
            });

            $scope.$on("status.lockedGame", (evt, id) => {
                if (model.id == id)
                    this.applyIfNeeded(() => $scope.clientInfo.gameLock = true);
            });
            $scope.$on("status.unlockedGame", (evt, id) => {
                if (model.id == id)
                    this.applyIfNeeded(() => $scope.clientInfo.gameLock = false);
            });
            $scope.$on("status.contentStateChanged", (evt, stateChange) => {
                if (stateChange.gameId == model.id) {
                    this.applyIfNeeded(() => {
                        angular.forEach(stateChange.states, state => {
                            if (state.state == Components.ModInfo.ItemState.Uninstalled) {
                                delete $scope.clientInfo.content[state.id];
                            } else {
                                $scope.clientInfo.content[state.id] = state;
                            }
                        });
                    });
                }
            });

            $scope.$on("status.contentStatusChanged", (evt, stateChange) => {
                if (stateChange.gameId == model.id) {
                    this.applyIfNeeded(() => {
                        angular.forEach(stateChange.states, state => {
                            if (state.state == Components.ModInfo.ItemState.Uninstalled
                                || state.state == Components.ModInfo.ItemState.NotInstalled) {
                                delete $scope.clientInfo.content[state.id];
                            } else {
                                $scope.clientInfo.content[state.id] = state;
                            }
                        });
                    });
                }
            });

            // TODO: Move to higher scope, because it is not just per game
            $scope.$on("status.statusChanged", (evt, stateChange) => {
                this.applyIfNeeded(() => {
                    $scope.clientInfo.status = stateChange;
                });
            });

            var isInitBusy = true;
            $scope.showBusyState = (): boolean => {
                return isInitBusy || $scope.clientInfo.gameLock || $scope.clientInfo.globalLock;
            };

            var handleConnected = () => {
                this.applyIfNeeded(() => {
                    isInitBusy = true;
                });
                // TODO: The return of this should not overwrite states received from the events..
                modInfo.getGameInfo(model.id)
                    .then(cInfo => {
                        isInitBusy = false;
                        this.applyIfNeeded(() => Tools.handleOverrides($scope.clientInfo, cInfo));
                    }).catch(() => {
                        isInitBusy = false;
                    });
            }

            var handleDisconnected = () => {
                this.applyIfNeeded(() => {
                    isInitBusy = false;
                });
            }

            // TODO: Keep retrying even on failure. So rather on connect?
            var timeout = 0;
            modInfo.contentHub.connection.stateChanged((state) => {
                switch (<ConnectionState>state.newState) {
                case ConnectionState.connected:
                    handleConnected();
                    break;
                case ConnectionState.disconnected:
                    handleDisconnected();
                    break;
                default:
                }
            });

            if (modInfo.contentHub.connection.state == ConnectionState.connected) {
                handleConnected();
            } else if (modInfo.contentHub.connection.state == ConnectionState.disconnected) {
                handleDisconnected();
            }


            //$scope.$on("status.refresh",(evt, id) => {
            //    Debug.log("Refreshing!");
            //    modInfo.getGameInfo(model.id)
            //        .then(cInfo => {
            //            Debug.log("Refreshed!", cInfo);
            //            this.applyIfNeeded(() => Tools.handleOverrides($scope.clientInfo, cInfo));
            //        });
            //});

            // TODO: Move to library controller??
            $scope.clientContentInfo = {
                favoriteContent: [],
                recentContent: [],
                installedContent: [],
                localCollections: []
            };

            $scope.directDownload = (item: any) => {
                if ($scope.clientInfo.gameLock || $scope.clientInfo.globalLock) {
                    logger.error("Client is currently busy");
                    return null;
                }
                return basketService.getGameBaskets($scope.game.id).selectContentItem(Helper.modToBasket(item, $scope.game.id), $scope.clientInfo).catch(r => {
                    if (modInfo.contentHub.connection.state != ConnectionState.connected)
                        basketService.settings.forceBasketInstallMessageHidden = false;
                });
                //return this.processCommand(modInfo.installContent({
                //    gameId: $scope.game.id,
                //    content: {
                //        id: item.id,
                //        isOnlineCollection: item.isOnlineCollection
                //    }
                //}), "Success");
            };
            $scope.canAddToBasket = (): boolean => {
                return !basketService.getGameBaskets($scope.game.id).active.model.isTemporary;
            };

            $scope.directDownloadCollection = (item: IBreezeCollection) => {
                if ($scope.clientInfo.gameLock || $scope.clientInfo.globalLock) {
                    logger.error("Client is currently busy");
                    return null;
                }
                return basketService.getGameBaskets($scope.game.id).selectContentItem(Helper.collectionToBasket(item, $scope.game.id), $scope.clientInfo, true).catch(r => {
                    if (modInfo.contentHub.connection.state != ConnectionState.connected)
                        basketService.settings.forceBasketInstallMessageHidden = false;
                        return null;
                });
                //return this.processCommand(
                //    modInfo.installCollection({
                //        gameId: $scope.game.id,
                //        content: {
                //            id: item.id
                //        }
                //    }), "Success");
            };
            /* modInfoService.syncCollections({
                        gameId: $scope.game.id,
                        contents: [
                            {
                                id: item.id
                            }
                        ]
                    }).then(r => modInfoService.installContent({
                        gameId: $scope.game.id,
                        content: {
                            id: item.id
                        }
                    })) */


            $scope.$on("content.contentUnfavorited", (evt, gameId, id) => {
                if (model.id != gameId)
                    return;
                var toRemove = [];
                var favoriteContent = $scope.clientContentInfo.favoriteContent;
                favoriteContent.forEach(x => {
                    if (x.id == id) toRemove.push(x);
                });
                if (toRemove.length == 0)
                    return;
                this.applyIfNeeded(() => toRemove.forEach(x => favoriteContent.splice(favoriteContent.indexOf(x), 1)));
            });
            $scope.$on("content.recentItemUsed", (evt, gameId, id, usedAt) => {
                if (model.id != gameId)
                    return;
                var recentContent = $scope.clientContentInfo.recentContent;
                this.applyIfNeeded(() => {
                    recentContent.forEach(x => {
                        if (x.id == id)
                            x.usedAt = usedAt;
                    });
                });
            });
            $scope.$on("content.contentFavorited", (evt, gameId, favoriteItem) => {
                var favoriteContent = $scope.clientContentInfo.favoriteContent;
                if (model.id == gameId && !favoriteContent.some(x => x.id == favoriteItem.id))
                    this.applyIfNeeded(() => favoriteContent.push(favoriteItem));
            });
            $scope.$on("content.recentItemAdded", (evt, gameId, recentContent) => {
                if (model.id == gameId)
                    this.applyIfNeeded(() => $scope.clientContentInfo.recentContent.push(recentContent));
            });
            $scope.$on("content.contentInstalled", (evt, gameId, installedContent) => {
                if (model.id == gameId)
                    this.applyIfNeeded(() => $scope.clientContentInfo.installedContent.push(installedContent));
            });

            modInfo.getGameContent(model.id)
                .then(cInfo => this.applyIfNeeded(() => Tools.handleOverrides($scope.clientContentInfo, cInfo)));


            this.eventBus.publish("gameChanged", { id: model.id, slug: model.slug });
            var s = this.eventBus.subscribe("basketChanged", () => this.applyIfNeeded());

            // TODO: Move to Directive..
            $scope.$on('$destroy', () => {
              s.dispose();
              this.eventBus.publish("gameChanged", { id: null });
              $('body').removeClass('play-game');
            });
            $('#header-row').attr('style', 'background-image:url("' + $scope.url.getAssetUrl('img/play.withSIX/games/' + model.slug + '/headers/header.png') + '");');
            $('body').removeClass('play-game');
            $('body').addClass('play-game');
        }

        subscriptionQuerySucceeded = (result, d) => {
            for (var v in result.data)
                d[result.data[v]] = true;
        };
    }

    registerController(GameController);

    class OrderController extends BaseController {
        static $name = "OrderController";

        constructor(public $scope: IGameScope, public logger, public $q) {
            super($scope, logger, $q);
            // TODO: Move to Directive..
            $('body').removeClass('game-profile');
            $scope.setMicrodata({ title: "Order" + $scope.model.fullName, description: "Order the game " + $scope.model.fullName, keywords: "order, " + $scope.model.name + ", " + $scope.model.fullName });
        }
    }

    registerController(OrderController);

    interface IStreamScope extends IBaseGameScope, IBaseScopeT<any> {
        streamPath: string;
        addToBasket: (mod: any) => void;
        baskets: MyApp.Components.Basket.GameBaskets;
        isInBasket: (mod: IBreezeMod) => boolean;
    }

    class StreamController extends BaseQueryController<any> {
        static $name = "StreamController";
        static $inject = ['$scope', 'logger', '$q', '$rootScope', 'basketService', 'model'];

        constructor(public $scope: IStreamScope, public logger, $q, $rootScope, basketService: Components.Basket.BasketService, model: any) {
            super($scope, logger, $q, model);

            var basket = basketService.getGameBaskets($scope.game.id);

            $scope.addToBasket = mod => basketService.addToBasket($scope.game.id, Helper.streamModToBasket(mod, $scope.game.id));
            $scope.streamPath = 'stream';

            $scope.baskets = basket;
            $scope.isInBasket = (mod: IBreezeMod) => {
                return basket.active.content.indexOf(mod.id) != -1;
            };

            // TODO: Move to Directive..
            $('body').removeClass('game-profile');
        }
    }

    registerController(StreamController);

    class PersonalStreamController extends StreamController {
        static $name = "PersonalStreamController";

        constructor(public $scope: IStreamScope, public logger, $q, $rootScope, basketService: Components.Basket.BasketService, model: any) {
            super($scope, logger, $q, $rootScope, basketService, model);

            $scope.streamPath = 'stream/personal';
        }
    }

    registerController(PersonalStreamController);
}

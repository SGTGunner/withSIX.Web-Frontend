module MyApp.Play {
    angular.module('MyAppPlayTemplates', []);

    enum PlayMainModule {
        Default,
        Mods,
        Missions,
        Collections,
        Servers,
        Stream,
        Apps,
        Order,
    }

    class PlayModule extends Tk.Module {
        static $name = "PlayModule";

        constructor() {
            super('MyAppPlay', ['app', 'ngRoute', 'ngDfp', 'commangular', 'route-segment', 'view-segment', 'MyAppPlayContentIndexes', 'Components', 'MyAppPlayTemplates']);

            function getModFileResolve(fileType) {
                return {
                    model: [
                        '$commangular', '$route',
                        ($commangular, $route) => $commangular.dispatch(Mods.GetModFileQuery.$name, { fileType: fileType, gameSlug: $route.current.params.gameSlug, modId: $route.current.params.modId })
                        .then((result) => result.lastResult)
                    ]
                };
            }

            this.app
                .config(['$commangularProvider', $commangularProvider => registerCommands(this.commands, $commangularProvider)])
                .config([
                    '$routeProvider', '$routeSegmentProvider', ($r1, $r2) => {
                        var $routeProvider = new Tk.RoutingHandler($r1, $r2, "/p");
                        var setupQuery = $routeProvider.setupQuery;
                        var setupQueryPart = $routeProvider.setupQueryPart;

                        $routeProvider.
/*
                            when('/dashboard', 'dashboard').
                            segment('dashboard', {
                                controller: 'DashboardController',
                                templateUrl: '/cdn_source/app/play/dashboard/index.html',
                                resolve: setupQuery(Games.GetDashboardQuery),
                            }).
*/
                            when('/', 'games').
                            segment('games', {
                                controller: 'GamesController',
                                templateUrl: '/cdn_source/app/play/games/index.html',
                                resolve: setupQuery(Games.GetGamesQuery)
                            });

                        var game = $routeProvider.
                            when('/:gameSlug', 'game').
                            when('/:gameSlug/order', 'game.order').
                            when('/:gameSlug/stream/personal/:streamType?', 'game.stream_personal').
                            when('/:gameSlug/stream/:streamType?', 'game.stream').
                            when('/:gameSlug/mods', 'game.mods').
                            when('/:gameSlug/mods/category/:category', 'game.mod_category').
                            when('/:gameSlug/mods/category/:category/page/:page', 'game.category_page').
                            //when('/:gameSlug/mods/:modId/:modSlug?/edit', 'game.mod2_edit').
                            when('/:gameSlug/mods/:modId/:modSlug?/download', 'game.modsShow.download').
                            when('/:gameSlug/mods/:modId/:modSlug?/related', 'game.modsShow.related').
                            when('/:gameSlug/mods/:modId/:modSlug?/credits', 'game.modsShow.credits').
                            when('/:gameSlug/mods/:modId/:modSlug?/readme', 'game.modsShow.readme').
                            when('/:gameSlug/mods/:modId/:modSlug?/license', 'game.modsShow.license').
                            when('/:gameSlug/mods/:modId/:modSlug?/changelog', 'game.modsShow.changelog').
                            when('/:gameSlug/mods/:modId/:modSlug?/settings', 'game.modsShow.settings').
                            when('/:gameSlug/mods/:modId/:modSlug?/blog', 'game.modsShow.blog').
                            when('/:gameSlug/mods/:modId/:modSlug?', 'game.modsShow').
                            when('/:gameSlug/missions', 'game.missions').
                            when('/:gameSlug/missions/new', 'game.new_mission').
                            when('/:gameSlug/missions/:missionId/:missionSlug?/edit', 'game.edit_mission').
                            when('/:gameSlug/missions/:missionId/:missionSlug?/versions/new', 'game.new_mission_version').
                            when('/:gameSlug/missions/:missionId/:missionSlug?/versions/:versionSlug/publish', 'game.publish_mission_version').
                            when('/:gameSlug/missions/:missionId/:missionSlug?/download', 'game.missionsShow.download').
                            when('/:gameSlug/missions/:missionId/:missionSlug?', 'game.missionsShow').
                            when('/:gameSlug/collections', 'game.collections').
                            when('/:gameSlug/collections/:collectionId/:collectionSlug?/content', 'game.collectionsShow.content').
                            when('/:gameSlug/collections/:collectionId/:collectionSlug?/content/edit', 'game.collectionsShow.content-edit').
                            when('/:gameSlug/collections/:collectionId/:collectionSlug?/comments', 'game.collectionsShow.comments').
                            when('/:gameSlug/collections/:collectionId/:collectionSlug?/related', 'game.collectionsShow.related').
                            when('/:gameSlug/collections/:collectionId/:collectionSlug?', 'game.collectionsShow').
                            when('/:gameSlug/servers', 'game.servers').
                            when('/:gameSlug/servers/:serverId/:serverSlug?', 'game.serversShow').
                            when('/:gameSlug/apps', 'game.apps').
                            when('/:gameSlug/apps/:appId/:appSlug?', 'game.appsShow').
/*                            when('/:gameSlug/test', 'game.test').*/
                            segment('game', {
                                controller: 'GameController',
                                dependencies: ['gameSlug'],
                                templateUrl: '/cdn_source/app/play/gameSubLayout.html',
                                resolve: setupQuery(Games.GetGameQuery)
                            }).within();

/*
                        game.segment('test', {
                                templateUrl: '/cdn_source/app/play/shared/_content-header-new.html'
                            });
*/

                        game.
                            segment('order', {
                                controller: 'OrderController',
                                templateUrl: '/cdn_source/app/play/games/order.html',
                            });

                        game
                            .segment('stream', {
                                controller: 'StreamController',
                                templateUrl: '/cdn_source/app/play/games/stream/index.html',
                                dependencies: ['gameSlug', 'streamType'],
                                resolve: setupQuery(Games.GetStreamQuery, { streamType: 'Content' }),
                                default: true // TODO: Generally we have some games that have Stream as default, others have Order as default...
                            }).
                            segment('stream_personal', {
                                controller: 'PersonalStreamController',
                                templateUrl: '/cdn_source/app/play/games/stream/index.html',
                                dependencies: ['gameSlug', 'streamType'],
                                resolve: setupQuery(Games.GetPersonalStreamQuery, { streamType: 'Content' })
                            });

                        game.
                            segment('mods', {
                                controller: 'ModsController',
                                templateUrl: '/cdn_source/app/components/default_index.html',
                                dependencies: ['gameSlug']
                                //, resolve: resolve: setupQuery(Mods.GetModsQuery)
                            }).
                            segment('mod_category', {
                                controller: 'ModsController',
                                templateUrl: '/cdn_source/app/components/default_index.html',
                                dependencies: ['gameSlug', 'category']
                            }).
                            // BWC
                            segment('category_page', {
                                controller: 'ModsController',
                                templateUrl: '/cdn_source/app/components/default_index.html',
                                dependencies: ['gameSlug', 'category', 'page'],
                            }).
                            segment('mod2_edit', {
                                controller: 'EditModController',
                                templateUrl: '/cdn_source/app/play/mods/edit.html',
                                dependencies: ['gameSlug', 'modId', 'modSlug'],
                                resolve: setupQuery(Mods.GetEditModQuery),
                            }).
                            segment('modsShow', {
                                controller: 'ModController',
                                templateUrl: '/cdn_source/app/play/mods/show.html',
                                dependencies: ['gameSlug', 'modId', 'modSlug'],
                                resolve: setupQuery(Mods.GetModQuery),
                            })
                            .within()
                            .segment('info', {
                                default: true,
                                controller: 'ModInfoController',
                                templateUrl: '/cdn_source/app/play/mods/show/info.html',
                            }).segment('related', {
                                controller: 'ModRelatedController',
                                templateUrl: '/cdn_source/app/play/mods/show/related.html',
                                resolve: setupQuery(Mods.GetModRelatedQuery)
                            }).segment('download', {
                                templateUrl: '/cdn_source/app/play/mods/show/download.html',
                            }).segment('credits', {
                                controller: 'ModCreditsController',
                                templateUrl: '/cdn_source/app/play/mods/show/credits.html',
                                resolve: setupQuery(Mods.GetModCreditsQuery)
                            }).segment('readme', {
                                controller: 'ModFileController',
                                templateUrl: '/cdn_source/app/play/mods/show/file.html',
                                resolve: getModFileResolve('readme'),
                            }).segment('license', {
                                controller: 'ModFileController',
                                templateUrl: '/cdn_source/app/play/mods/show/file.html',
                                resolve: getModFileResolve('license'),
                            }).segment('changelog', {
                                controller: 'ModFileController',
                                templateUrl: '/cdn_source/app/play/mods/show/file.html',
                                resolve: getModFileResolve('changelog'),
                            }).segment('settings', {
                                templateUrl: '/cdn_source/app/play/mods/show/settings.html',
                            }).segment('blog', {
                                controller: 'ModBlogController',
                                templateUrl: '/cdn_source/app/play/mods/show/blog.html',
                            });

                        game.
                            segment('missions', {
                                controller: 'MissionsController',
                                templateUrl: '/cdn_source/app/components/default_index.html',
                                dependencies: ['gameSlug']
                            }).
                            segment('new_mission', {
                                controller: 'UploadNewmissionController',
                                templateUrl: '/cdn_source/app/play/missions/upload-newmission.html',
                                dependencies: ['gameSlug'],
                                resolve: setupQuery(Missions.NewMissionQuery),
                                role: [Role.user]
                            }).
                            segment('edit_mission', {
                                controller: 'EditMissionController',
                                templateUrl: '/cdn_source/app/play/missions/edit-mission.html',
                                dependencies: ['gameSlug', 'missionId', 'missionSlug'],
                                resolve: setupQuery(Missions.EditMissionQuery),
                            }).
                            segment('new_mission_version', {
                                controller: 'UploadNewversionController',
                                templateUrl: '/cdn_source/app/play/missions/upload-newversion.html',
                                dependencies: ['gameSlug', 'missionId', 'missionSlug']
                            }).
                            segment('publish_mission_version', {
                                controller: 'PublishVersionController',
                                templateUrl: '/cdn_source/app/play/missions/publish-version.html',
                                dependencies: ['gameSlug', 'missionId', 'missionSlug', 'versionSlug'],
                                resolve: setupQuery(Missions.GetPublishMissionVersionQuery)
                            }).
                            segment('missionsShow', {
                                controller: 'MissionController',
                                templateUrl: '/cdn_source/app/play/missions/show.html',
                                dependencies: ['gameSlug', 'missionId', 'missionSlug'],
                                resolve: setupQuery(Missions.GetMissionQuery),
                            })
                            .within()
                            .segment('info', {
                                controller: 'MissionInfoController',
                                default: true,
                                templateUrl: '/cdn_source/app/play/missions/show/info.html',
                            }).segment('download', {
                                templateUrl: '/cdn_source/app/play/missions/show/download.html'
                            });

                        game.
                            segment('collections', {
                                controller: 'CollectionsController',
                                templateUrl: '/cdn_source/app/components/default_index.html',
                                dependencies: ['gameSlug']
                            }).
                            segment('collectionsShow', {
                                controller: 'CollectionController',
                                templateUrl: '/cdn_source/app/play/collections/show.html',
                                dependencies: ['gameSlug', 'collectionId', 'collectionSlug'],
                                resolve: setupQuery(Collections.GetCollectionQuery)
                            })
                            .within()
                            .segment('info', {
                                controller: 'CollectionInfoController',
                                default: true,
                                templateUrl: '/cdn_source/app/play/collections/show/info.html',
                            })
                            .segment('content-edit', {
                              //controller: 'CollectionContentEditController',
                              //templateUrl: '/cdn_source/app/play/collections/show/content-edit.html'
                            })
                            .segment('content', {
                                controller: 'CollectionContentController',
                                templateUrl: '/cdn_source/app/play/collections/show/content.html'
                            })
                            .segment('related', {
                                controller: 'CollectionRelatedController',
                                templateUrl: '/cdn_source/app/play/collections/show/related.html',
                                resolve: setupQuery(Collections.GetForkedCollectionsQuery)
                            });

                        game.
                            segment('servers', {
                                controller: 'ServersController',
                                templateUrl: '/cdn_source/app/play/servers/index.html',
                                dependencies: ['gameSlug'],
                            }).
                            segment('serversShow', {
                                controller: 'ServerController',
                                templateUrl: '/cdn_source/app/play/servers/show.html',
                                dependencies: ['gameSlug', 'serverId', 'serverSlug'],
                                resolve: setupQuery(Servers.GetServerQuery),
                            })
                            .within()
                            .segment('info', {
                                default: true,
                                templateUrl: '/cdn_source/app/play/servers/show/info.html',
                            });

                        game.
                            segment('apps', {
                                controller: 'AppsController',
                                templateUrl: '/cdn_source/app/components/default_index.html',
                                dependencies: ['gameSlug']
                            }).
                            segment('appsShow', {
                                controller: 'AppController',
                                templateUrl: '/cdn_source/app/play/apps/show.html',
                                dependencies: ['gameSlug', 'appId', 'appSlug'],
                                resolve: setupQuery(Apps.GetAppQuery),
                            })
                            .within()
                            .segment('info', {
                                default: true,
                                templateUrl: '/cdn_source/app/play/apps/show/info.html',
                            });

                        $routeProvider.
                            when('/apps', 'apps2').
                            segment('apps2', {
                                controller: 'AppsController',
                                templateUrl: '/cdn_source/app/components/default_index.html'
                            }).
                            when('/apps/:appId/:appSlug?', 'apps2Show').
                            segment('apps2Show', {
                                controller: 'AppController',
                                templateUrl: '/cdn_source/app/play/apps/show.html',
                                dependencies: ['appId', 'appSlug'],
                                resolve: setupQuery(Apps.GetAppQuery),
                            })
                            .within()
                            .segment('info', {
                                default: true,
                                templateUrl: '/cdn_source/app/play/apps/show/info.html',
                            });
                    }
                ])
        }

        siteConfig() {
          this.app                .config([
                              'DoubleClickProvider', 'w6', 'dfp', (doubleClickProvider, w6: W6, dfp) => {
                                  if (w6.renderAds) {
                                      // TODO: Consider if we can deal with ads more on the fly instead of at app config?
                                      doubleClickProvider
                                          .defineSlot('/' + dfp.publisherId + '/play_rectangle_atf', rectangleSlotSizes, 'angular-ad1', w6.ads.slots["play_rectangle_atf"])
                                          .defineSlot('/' + dfp.publisherId + '/play_rectangle_btf', rectangleSlotSizes, 'angular-ad2', w6.ads.slots["play_rectangle_btf"])
                                          .defineSlot('/' + dfp.publisherId + '/play_leaderboard_atf', leaderboardSlotSizes, 'angular-ad-leader', w6.ads.slots["play_leaderboard_atf"]);
                                  }
                              }
                          ]);
        }
    }

    export function registerCQ(command) { app.registerCommand(command); }

    export function registerService(service) { app.app.service(service.$name, service); }

    export function registerController(controller) { app.app.controller(controller.$name, controller); }

    var app = new PlayModule();


    export class Helper {
      static modToBasket(mod: IBreezeMod, gameId?: string): Components.Basket.IBasketItem {
        var w6 = window.w6Cheat.w6;
        return {
          id: mod.id, name: mod.name, gameId: mod.gameId || gameId, itemType: Components.Basket.BasketItemType.Mod, packageName: mod.packageName,
          image: mod.avatar ? w6.url.getUsercontentUrl2(mod.avatar, mod.avatarUpdatedAt) : ((<any>mod).image ? (<any>mod).image : null),
          author: mod.author && mod.author.id != W6.w6OBot ? mod.author.displayName : mod.authorText, sizePacked: mod.sizePacked }
      }

      static collectionToBasket(collection: IBreezeCollection, gameId?: string): Components.Basket.IBasketItem {
        var w6 = window.w6Cheat.w6;
        return {
            id: collection.id,
            itemType: Components.Basket.BasketItemType.Collection,
            gameId: collection.gameId || gameId,
            packageName: collection.slug, // pff
            author: collection.author.displayName,
            image: collection.avatar ? w6.url.getUsercontentUrl2(collection.avatar, collection.avatarUpdatedAt) : null, // item.image ? item.image :
            name: collection.name,
            sizePacked: collection.sizePacked,
            isOnlineCollection: true
        }
      }

      static streamModToBasket(mod: any, gameId?: string): Components.Basket.IBasketItem {
        var w6 = window.w6Cheat.w6;
        return {
          id: mod.id, name: mod.headerName, gameId: mod.gameId || gameId, itemType: Components.Basket.BasketItemType.Mod, packageName: mod.packageName,
          image: mod.image ? w6.url.getUsercontentUrl2(mod.image, mod.imageUpdatedAt) : null, author: mod.author, sizePacked: mod.sizePacked }
      }
    }

    app.app.directive("sxEditMenu", [
        '$popover', ($popover) => {
            return {
                link: (scope, element, attr) => {
                    var authorEditPopover = $popover(element, {
                        template: "/cdn_source/app/play/mods/popovers/change-author-dialog.html",
                        placement: "bottom-right",
                        target: $(".btn-sx-more"), // TODO: This targets multiple elements atm...
                        container: "body",
                        trigger: "manual",
                        scope: scope // will be used to create child scope that prototipically inherits off our scope..
                    });
                    scope.openChangeAuthorDialog = () => authorEditPopover.show();
                },
                templateUrl: '/cdn_source/app/play/edit-dropdown-directive.html'
            };
        }
    ]);

    app.app.directive("sxAuthorTop", [
        '$popover', ($popover) => {
            return {
                link: (scope, element, attr) => {
                    var authorEditPopoverTop = $popover(element, {
                        template: "/cdn_source/app/play/mods/popovers/change-author-dialog.html",
                        placement: "bottom",
                        target: $(".btn-sx-more"), // TODO: This targets multiple elements atm...
                        container: "body",
                        trigger: "manual",
                        scope: scope // will be used to create child scope that prototipically inherits off our scope..
                    });
                    scope.openChangeAuthorDialogTop = () => authorEditPopoverTop.show();
                }
            };
        }
    ]);
}

// Sub module to deal with awesome content indexes, and share this mini portion to Connect for profiles/me, without sharing routes or other play stuff that is not needed!
module MyApp.Play.ContentIndexes {
    export function registerCQ(command) { app.registerCommand(command); }

    export function registerService(service) { app.app.service(service.$name, service); }

    export function registerController(controller) { app.app.controller(controller.$name, controller); }

    class PlayContentIndexesModule extends Tk.Module {
        static $name = "PlayContentIndexesModule";

        constructor() {
            super('MyAppPlayContentIndexes', ['ngRoute', 'ngDfp', 'commangular']);
            this.app.config(['$commangularProvider', $commangularProvider => registerCommands(this.commands, $commangularProvider)]);
        }
    }

    var app = new PlayContentIndexesModule();

    export class GetUsersQuery extends DbQueryBase {
        static $name = "GetUsers";

        public execute = [
            'query', (name: string) => {
                Debug.log("getting users, " + name);
                return this.context.executeQuery(breeze.EntityQuery.from("AccountSearch") //.from("Accounts")
                        .withParameters({ "name": name.toLowerCase() })
                        //.where(this.getPredicate(name.toLowerCase()))
                        //.orderBy("userName")
                        .take(this.context.defaultTakeTag))
                    .then((data) => data.results);
            }
        ];

        getPredicate(lowerCaseName: string) {
            var op = this.context.getOpByKeyLength(lowerCaseName);
            return new breeze.Predicate("toLower(userName)", op, lowerCaseName)
                .or(new breeze.Predicate("toLower(displayName)", op, lowerCaseName));
        }
    }

    registerCQ(GetUsersQuery);

    export class GetUserTagsQuery extends DbQueryBase {
        static $name = "GetUserTags";
        static $inject = ['dbContext', '$commangular'];

        constructor(context: W6Context, private $commangular) {
            super(context);
        }

        public escapeIfNeeded(str) {
            if (str.indexOf(" ") != -1)
                return "\"" + str + "\"";
            return str;
        }

        public execute = [
            'query', (name: string) => {
                return this.$commangular.dispatch(GetUsersQuery.$name, { query: name })
                    .then(results => {
                        var obj = [];
                        angular.forEach(results.lastResult, (user: any) => obj.push({ text: "user:" + this.escapeIfNeeded(user.displayName), key: "user:" + this.escapeIfNeeded(user.displayName) }));
                        return obj;
                    });
            }
        ];
    }

    registerCQ(GetUserTagsQuery);
}

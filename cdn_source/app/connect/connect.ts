module MyApp.Connect {
    angular.module('MyAppConnectTemplates', []);

    class ConnectModule extends Tk.Module {
        static $name = "ConnectModule";

        constructor() {
            super('MyAppConnect', ['app', 'ngRoute', 'ngDfp', 'commangular', 'MyAppPlayContentIndexes', 'MyAppPlayTemplates', 'route-segment', 'view-segment', 'Components', 'MyAppConnectTemplates']);

        this.app
          .config(['$commangularProvider', $commangularProvider => registerCommands(this.commands, $commangularProvider)])
          .config([
              '$routeProvider', '$routeSegmentProvider', ($r1, $r2) => {
                  var $routeProvider = new Tk.RoutingHandler($r1, $r2);
                  var setupQuery = $routeProvider.setupQuery;
                  var setupQueryPart = $routeProvider.setupQueryPart;

                  $routeProvider.
                      when('/report', 'report')
                      .segment('report', {
                          controller: Components.Dialogs.ReportDialogController,
                          templateUrl: '/cdn_source/app/components/dialogs/report.html'
                      });

                  var register = $routeProvider
                      .when('/register', 'register')
                      //.when('/register/finalize', 'register_finalize')
                      .segment('register', {
                          controller: 'RegisterController',
                          templateUrl: '/cdn_source/app/connect/pages/register.html'
                      });

/*
                  register.segment('register_finalize', {
                      controller: 'FinalizeController',
                      templateUrl: '/cdn_source/app/connect/pages/finalize.html',
                  });
*/

                  var login = $routeProvider
                      .when('/login', 'login')
                      .when('/login/verify', 'login_resend_code')
                      .when('/login/verify/:activationCode', 'login_verify')
                      .when('/login/forgot-password', 'login_forgot-password')
                      .when('/login/forgot-username', 'login_forgot-username')
                      .when('/login/forgot-password/reset/:resetCode', 'login_reset-password')
                      .segment('login', {
                          //controller: 'LoginController',
                          //templateUrl: '/cdn_source/app/connect/pages/login.html'
                          resolve: setupQuery(LoginSpaCommand)
                      });

                    login.segment('login_verify', {
                      controller: 'AureliaPageController'
                    });


                  login.segment('login_resend_code', {
                      controller: 'ResendActivationController',
                      templateUrl: '/cdn_source/app/connect/pages/resend-activation.html',
                  });

                  login.segment('login_forgot-password', {
                      controller: 'ForgotPasswordController',
                      templateUrl: '/cdn_source/app/connect/pages/forgot-password.html',
                  });
                  login.segment('login_forgot-username', {
                      controller: 'ForgotUsernameController',
                      templateUrl: '/cdn_source/app/connect/pages/forgot-username.html'
                  });
                  login.segment('login_reset-password', {
                      controller: 'ResetPasswordController',
                      templateUrl: '/cdn_source/app/connect/pages/reset-password.html',
                  });


                  var me = $routeProvider.
                  when('/me/library', 'newprofile').
                  when('/me/library/:gameSlug', 'newprofile').
                  when('/me/library/:gameSlug/mods', 'newprofile').
                  when('/me/library/:gameSlug/missions', 'newprofile').
                  when('/me/library/:gameSlug/collections', 'newprofile').
                  when('/me/library/:gameSlug/collections/:collectionId/:collectionSlug?', 'newprofile').
                  when('/me/library/:gameSlug/servers', 'newprofile').
                  when('/me/library/:gameSlug/apps', 'newprofile').
                      when('/me', 'me').
                      when('/me/settings', 'me.settings').
                      when('/me/settings/personal', 'me.settings.personal').
                      when('/me/settings/avatar', 'me.settings.avatar').
                      when('/me/settings/credentials', 'me.settings.credentials').
                      when('/me/settings/premium', 'me.settings.premium').
                      when('/me/blog', 'me.blog').
                      when('/me/blog/create', 'me.blog.create').
                      when('/me/blog/:slug', 'me.blog.edit').
                      when('/me/content', 'me.content').
                      when('/me/content/mods', 'me.content.mods').
                      when('/me/content/missions', 'me.content.missions').
                      when('/me/content/collections', 'me.content.collections').
                      when('/me/content/servers', 'me.content.servers').
                      when('/me/content/apps', 'me.content.apps').
                      when('/me/friends', 'me.friends').
                      when('/me/offers', 'me.offers').
                      when('/me/messages', 'me.messages').
                      when('/me/messages/:slug', 'me.messages.user').
                      segment('newprofile', {
                          controller: 'AureliaPageController'
                      }).
                      segment('me', {
                          controller: 'MeController',
                          templateUrl: '/cdn_source/app/connect/me/index.html'
                      }).within();

                  me.segment('settings', {
                          controller: 'MeSettingsController',
                          templateUrl: '/cdn_source/app/connect/me/settings/index.html',
                      })
                      .within()
                      .segment('personal', {
                          default: true,
                          templateUrl: '/cdn_source/app/connect/me/settings/personal.html',
                          controller: 'MeSettingsPersonalController',
                          resolve: setupQuery(Me.GetMeSettingsPersonalQuery),
                      }).segment('avatar', {
                          templateUrl: '/cdn_source/app/connect/me/settings/avatar.html',
                          controller: 'MeSettingsAvatarController',
                          resolve: setupQuery(Me.GetMeSettingsAvatarQuery),
                      }).segment('credentials', {
                          templateUrl: '/cdn_source/app/connect/me/settings/credentials.html',
                          controller: 'MeSettingsCredentialsController',
                          resolve: setupQuery(Me.GetMeSettingsCredentialsQuery),
                      }).segment('premium', {
                          templateUrl: '/cdn_source/app/connect/me/settings/premium.html',
                          controller: 'MeSettingsPremiumController',
                          resolve: setupQuery(Me.GetMeSettingsPremiumQuery),
                          watcher: $routeProvider.defaultRefreshFunction('me.settings.premium'),
                      });

                  me.segment('offers', {
                      templateUrl: '/cdn_source/app/connect/me/special-offers.html',
                  });

                  me.segment('blog', {
                          templateUrl: '/cdn_source/app/connect/me/blog/index.html',
                          controller: 'MeBlogController',
                      })
                      .within()
                      .segment('archive', {
                          default: true,
                          templateUrl: '/cdn_source/app/connect/me/blog/archive.html',
                          controller: 'MeBlogArchiveController',
                          resolve: setupQuery(Me.GetMeBlogQuery),
                      }).segment('create', {
                          templateUrl: '/cdn_source/app/connect/me/blog/create.html',
                          controller: 'MeBlogCreateController',
                      }).segment('edit', {
                          templateUrl: '/cdn_source/app/connect/me/blog/edit.html',
                          controller: 'MeBlogEditController',
                          resolve: setupQuery(Me.GetMeBlogPostQuery),
                      });

                  me.segment('content', {
                          templateUrl: '/cdn_source/app/connect/me/content.html',
                          controller: 'MeContentController',
                          resolve: setupQuery(Me.GetMeContentQuery),
                      }).within().
                      segment('collections', {
                          default: true,
                          controller: 'CollectionsController',
                          templateUrl: '/cdn_source/app/components/default_index.html'
                      }).
                      segment('mods', {
                          controller: 'ModsController',
                          templateUrl: '/cdn_source/app/components/default_index.html'
                      }).
                      segment('missions', {
                          controller: 'MissionsController',
                          templateUrl: '/cdn_source/app/components/default_index.html'
                      }).
                      segment('servers', {
                          controller: 'ServersController',
                          templateUrl: '/cdn_source/app/play/servers/index.html'
                      }).
                      segment('apps', {
                          controller: 'AppsController',
                          templateUrl: '/cdn_source/app/components/default_index.html'
                      });
                  me.segment('friends', {
                      templateUrl: '/cdn_source/app/connect/me/friends.html',
                      controller: 'MeFriendsController',
                      resolve: setupQuery(Me.GetMeFriendsQuery),
                  });

                  me.segment('messages', {
                          templateUrl: '/cdn_source/app/connect/me/messages.html',
                      }).within()
                      .segment('list', {
                          default: true,
                          controller: 'MeMessagesController',
                          templateUrl: '/cdn_source/app/connect/me/messages-list.html',
                          resolve: setupQuery(Me.GetMeMessagesQuery)
                      })
                      .segment('user', {
                          templateUrl: '/cdn_source/app/connect/profile/messages.html',
                          controller: 'MeUserMessagesController',
                          resolve: setupQuery(Me.GetMeUserMessagesQuery),
                      });

                  var profile = $routeProvider.
                      when('/u/:userSlug', 'profile').
                      when('/u/:userSlug/blogposts', 'profile.blog').
                      when('/u/:userSlug/content', 'profile.content').
                      when('/u/:userSlug/content/mods', 'profile.content.mods').
                      when('/u/:userSlug/content/missions', 'profile.content.missions').
                      when('/u/:userSlug/content/collections', 'profile.content.collections').
                      when('/u/:userSlug/content/servers', 'profile.content.servers').
                      when('/u/:userSlug/content/apps', 'profile.content.apps').
                      when('/u/:userSlug/friends', 'profile.friends').
                      when('/u/:userSlug/messages', 'profile.messages').
                      //when('/profile/:userSlug/comments', 'profile.comments').
                      segment('profile', {
                          controller: 'ProfileController',
                          templateUrl: '/cdn_source/app/connect/profile/index.html',
                          dependencies: ['userSlug'],
                          resolve: setupQuery(Profile.GetProfileQuery),
                      })
                      .within();

                  profile.segment('blog', {
                      templateUrl: '/cdn_source/app/connect/profile/blogposts.html',
                      controller: 'ProfileBlogController',
                      resolve: setupQuery(Profile.GetProfileBlogQuery),
                  });

                  profile.segment('content', {
                          default: true,
                          templateUrl: '/cdn_source/app/connect/profile/content.html',
                          controller: 'ProfileContentController',
                      }).
                      within().
                      segment('collections', {
                          default: true,
                          controller: 'CollectionsController',
                          templateUrl: '/cdn_source/app/components/default_index.html',
                      }).
                      segment('mods', {
                          controller: 'ModsController',
                          templateUrl: '/cdn_source/app/components/default_index.html'
                      }).
                      segment('missions', {
                          controller: 'MissionsController',
                          templateUrl: '/cdn_source/app/components/default_index.html'
                      }).
                      segment('servers', {
                          controller: 'ServersController',
                          templateUrl: '/cdn_source/app/play/servers/index.html',
                      }).
                      segment('apps', {
                          controller: 'AppsController',
                          templateUrl: '/cdn_source/app/components/default_index.html',
                      });

                  profile.segment('friends', {
                      templateUrl: '/cdn_source/app/connect/profile/friends.html',
                      controller: 'ProfileFriendsController',
                      resolve: setupQuery(Profile.GetProfileFriendsQuery),
                  });
                  profile.segment('messages', {
                      templateUrl: '/cdn_source/app/connect/profile/messages.html',
                      controller: 'ProfileMessagesController',
                      resolve: setupQuery(Profile.GetProfileMessagesQuery),
                  });
                  profile.segment('comments', {
                      templateUrl: '/cdn_source/app/connect/profile/comments.html',
                      controller: 'ProfileCommentsController',
                      resolve: setupQuery(Profile.GetProfileCommentsQuery),
                  });

                  // $routeProvider.
                  //     when('/wall', 'wall').
                  //     segment('wall', {
                  //         controller: 'WallController',
                  //         templateUrl: '/cdn_source/app/connect/wall/index.html',
                  //         resolve: setupQuery('GetWallQuery')
                  //     });
              }
          ]);
        }
        siteConfig() {
            this.app
                .config([
                    'DoubleClickProvider', 'w6', 'dfp', (doubleClickProvider, w6: W6, dfp) => {
                        if (w6.renderAds) {
                            // TODO: Consider if we can deal with ads more on the fly instead of at app config?
                            doubleClickProvider
                                .defineSlot('/' + dfp.publisherId + '/connect_rectangle_atf', rectangleSlotSizes, 'angular-ad1', w6.ads.slots["connect_rectangle_atf"])
                                .defineSlot('/' + dfp.publisherId + '/connect_rectangle_btf', rectangleSlotSizes, 'angular-ad2', w6.ads.slots["connect_rectangle_btf"])
                                .defineSlot('/' + dfp.publisherId + '/connect_leaderboard_atf', leaderboardSlotSizes, 'angular-ad-leader', w6.ads.slots["connect_leaderboard_atf"]);
                        }
                    }
                ])
        }
    }

    export function registerCQ(command) { app.registerCommand(command); }

    export function registerService(service) { app.app.service(service.$name, service); }

    export function registerController(controller) { app.app.controller(controller.$name, controller); }

    var app = new ConnectModule();
}

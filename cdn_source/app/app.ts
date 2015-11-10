// This file is only intended to setup the environment and root Application configuration
// Add Directives / Filters / Controllers / etc elsewhere

declare var commangular;
declare var accounting;
declare var Modernizr: ModernizrStatic;
if (!RedactorPlugins) var RedactorPlugins = <any>{};

RedactorPlugins.bufferbuttons = () => {
  return {
    init: function() {
      var undo = this.button.addFirst('undo', 'Undo');
      var redo = this.button.addAfter('undo', 'redo', 'Redo');

      this.button.addCallback(undo, this.buffer.undo);
      this.button.addCallback(redo, this.buffer.redo);
    }
  };
};
var globalRedactorOptions = { plugins: [], linebreaks: true }; // 'p', 'h1', 'h2', 'pre' // allowedTags: ['spoiler', 'code', 'p', 'h1', 'h2', 'pre']
globalRedactorOptions.plugins = ['bufferbuttons', 'image', 'video', 'table', 'fullscreen'];

/*
                    globalRedactorOptions.buttons = [
                        'html', 'formatting', 'bold', 'italic', 'deleted',
                        'unorderedlist', 'orderedlist', 'outdent', 'indent',
                        'image', 'file', 'link', 'alignment', 'horizontalrule'
                    ];
*/

module MyApp {
  export var debug = Tk.debug;
  export var Debug = Tk.Debug;
  export var Environment = Tk.Environment;
  export var initialCompleted = false;

  export interface Subscription {
    dispose(): void;
  }
  export interface IEventBus {
    publish(event: string | any, data?: any): void;
    subscribe(event: string | Function, callback: Function): Subscription;
    subscribeOnce(event: string | Function, callback: Function): Subscription;
  }

  export interface Toastr {
    info: IDisplayMethod;
    warning: IDisplayMethod;
    error: IDisplayMethod;
    success: IDisplayMethod;
  }

  interface ToastOpts {
    timeOut?: number;
  }

  interface IDisplayMethod {
    (message: string, title?: string, opts?: ToastOpts): Promise<boolean>
  }

  export var rectangleSlotSizes = [
    [[1400, 400], [[336, 280], [300, 250], [180, 150], [125, 125]]],
    [[1350, 400], [[300, 250], [180, 150], [125, 125]]],
    [[768, 400], [[180, 150], [125, 125]]],
    [[468, 200], [[336, 280], [300, 250], [180, 150], [125, 125]]],
    [[0, 0], [[300, 250], [180, 150], [125, 125]]]
  ];

  export var leaderboardSlotSizes = [
    [[980, 400], [[970, 90], [728, 90], [468, 60], [234, 60], [125, 125]]],
    [[768, 400], [[728, 90], [468, 60], [234, 60], [125, 125]]],
    [[468, 200], [[125, 125]]],
    [[0, 0], [[125, 125]]]
  ];
  export interface _Indexer<TModel> {
    [name: string]: TModel;
  }

  export class MyAppModule extends Tk.Module {
    static $name = "AppModule";
    constructor() {
      super('MyApp', ['MyAppMain', 'MyAppConnect', 'MyAppPlay']);
    }
  }

  new MyAppModule();

  export class ContentDownloads {
    public static downloadInclClientCheck(url: string, forwardService, localStorageService, w6) {
      if (w6.client && w6.client.clientFound) {
        w6.client.openPwsUri(url);
        return;
      }

      // On purpose using ok to get the software, and cancel to get the actual download, so the user thinks what he does :)
      if (localStorageService.get('clientInstalled') == null
        && confirm("Before downloading this content, make sure you have \"Play\" our withSIX client installed. To download the client software now, click ok. To proceed with the download, click cancel.")) {
        forwardService.forward(w6.url.main + "/download");
        //localStorageService.set('clientInstalled', true);
      } else {
        localStorageService.set('clientInstalled', true);
        this.startDownload(url);
      }
    }

    static startDownload(url: string) {
      if (window.six_client == null || window.six_client.open_pws_uri == null) {
        window.location.href = url;
      } else {
        window.six_client.open_pws_uri(url);
      }
    }
  }

  export interface IUserInfo {
    // TODO: Instead use dynamic getters that use isInRole internally and cache the result?
    isPremium: boolean;
    // TODO: Instead use dynamic getters that use isInRole internally and cache the result?
    isAdmin: boolean;
    // TODO: Instead use dynamic getters that use isInRole internally and cache the result?
    isManager: boolean;
    id: string;
    slug: string;
    avatarURL: string;
    hasAvatar: boolean;
    avatarUpdatedAt: Date;
    emailMd5: string;
    displayName: string;
    userName: string;
    firstName: string;
    lastName: string;
    profileUrl: string; // computed
    clearAvatars(): void;
    getAvatarUrl(size: number): string;
    isInRole(role: string): boolean;
    isInRoles(...roles: string[]): boolean;
    isInRoles(roles: string[]): boolean;
    hasPermission(resource: string, action: string): boolean;
    roles: string[];
    failedLogin: boolean;
  }

  /*    export enum Roles {
          Admin,
          Manager,
          User,
          Premium,
          AuthorBeta
      }*/

  export interface IMiniClientInfo {
    newVersionAvailable: string;
    version: string;
  }

  export interface IRootScope extends ng.IRootScopeService {
    vm;
    canceler: ng.IDeferred<{}>;
    dispatch(evt: string, pars?: Object);
    request(evt, pars?: Object);
    request<T>(evt, pars?: IModel<T>);
    environment: Tk.Environment;
    loading: boolean;
    w6: W6;
    url: W6Urls;
    toShortId: (id) => string;
    sluggify: (str) => string;
    Modernizr;
    requestWM<T>(evt: ICQWM<T>, pars?: IModel<T>);
    cancelOutstandingRequests: () => void;
    sluggifyEntityName: (str) => string;
    isInvalid: (field, ctrl) => any;
    blurred: (fieldName, ctrl) => boolean;
    ready: () => void;
    startLoading: () => void;
    status: string;
    loadingStatus: {
      outstanding: number;
      increment(): void;
      decrement(): void;
    };
    microdata: Components.IMicrodata;
    setMicrodata: (microdata: Components.IMicrodata) => void;
    setPageInfo: (pageInfo: Components.IPageInfo) => void;
    defaultImage: string;
    breadcrumbs: Object[];
    pageInfo: { title: string };
    openLoginDialog: (evt?: any) => void;
    logout: () => any;
    downloadsHandled: boolean;
    handleDownloads: () => any;
    isClientConnected: boolean;
    miniClient: IMiniClientInfo;
    initialLoad: boolean;
  }

  export function getFactory(inject, f) {
    f['$inject'] = inject;
    return f;
  }

  interface Moment {
    subtract(amount: number, type: string);
  }

  export interface Result<T> {
    result: T;
  }

  export var ngToken = null;

  export interface BooleanResult extends Result<boolean> {
  }

  class RootModule extends Tk.Module {
    static $name = "RootModule";

    constructor(setupInfo) {
      super('constants', []);
      Debug.log("setupInfo", setupInfo);
      this.app
        .constant("userInfo", setupInfo.w6.userInfo)
        .constant('environment', setupInfo.environment)
        .constant('dfp', setupInfo.dfp)
        .constant('adsense', setupInfo.adsense)
        .constant('angularMomentConfig', {
        preprocess: 'utc', // optional
        //timezone: 'Europe/London' // optional
      })
        .constant('options', { serviceName: setupInfo.w6.url.api + "/breeze/withsix" })
        .constant('w6', setupInfo.w6);
    }
  }

  class AppModule extends Tk.Module {
    static $name = "AppModule";
    static $modules = [
      'constants', 'Components',
      'LocalStorageModule', 'angular-jwt', 'ui.bootstrap',
      'ngCookies', 'ngAnimate', 'ngRoute', 'ngSanitize', 'remoteValidation',
      'breeze.angular', 'angularMoment', 'angularSpinner', 'ngTagsInput', 'infinite-scroll', 'ngMap', 'ngDfp',
      'ui.bootstrap.tpls', 'ui.bootstrap.tabs', 'dialogs.main', 'ui', 'angular-promise-cache', 'xeditable', 'commangular', //'ngClipboard',
      'ui-rangeSlider', 'ngFileUpload2', 'checklist-model', 'AngularProgress', 'angular-loading-bar',
      'route-segment', 'view-segment', 'mgcrea.ngStrap.datepicker', 'angular-redactor',
      'Components.BytesFilter', 'Components.Debounce', 'Components.Pagedown', 'Components.Fields',
      'Components.ContentGallery', 'Components.ReallyClick', 'Components.BackImg', 'Components.Comments', 'Components.AccountCard', 'nvd3ChartDirectives',
      'Components.Filters', 'Components.Directives', 'mgcrea.ngStrap.typeahead', 'mgcrea.ngStrap.tooltip', 'angularFileUpload', 'mgcrea.ngStrap.dropdown', 'mgcrea.ngStrap.popover', 'ui.bootstrap.collapse', 'mgcrea.ngStrap.affix',
      'ngPasswordStrength', 'mgcrea.ngStrap.helpers.debounce', 'truncate'
    ];

    static getModules() {
      if (Tk.getEnvironment() != Tk.Environment.Production)
        return AppModule.$modules;

      return AppModule.$modules.concat(['angulartics', 'angulartics.google.analytics']);
    }

    constructor() {
      super('app', AppModule.getModules());

      this.app
        .factory('aur.eventBus', () => window.w6Cheat.container.get(window.w6Cheat.containerObjects.eventBus))
        .factory('aur.login', () => window.w6Cheat.container.get(window.w6Cheat.containerObjects.login))
        .factory('aur.toastr', () => window.w6Cheat.container.get(window.w6Cheat.containerObjects.toastr))
        .config(['redactorOptions', redactorOptions => angular.copy(globalRedactorOptions, redactorOptions)])
        .config([
        '$httpProvider', $httpProvider => {
          $httpProvider.interceptors.push('loadingStatusInterceptor');
          $httpProvider.defaults.headers.patch = {
            'Content-Type': 'application/json;charset=utf-8'
          };
        }
      ])
        .config(['$compileProvider', $compileProvider => { $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|pws):/); }])
        .config([
        'localStorageServiceProvider', localStorageServiceProvider => {
          localStorageServiceProvider
            .setPrefix('withSIX'); // production vs staging etc?
        }
      ])
        .config([
        '$httpProvider', 'jwtInterceptorProvider', ($httpProvider, jwtInterceptorProvider) => {
          var refreshingToken = null;
          var subdomains = ['', 'connect.', 'play.', 'admin.', 'kb.', 'auth.', 'ws1.', 'api.', 'api2.'];
          var theDomain = window.w6Cheat.w6.url.domain;

          var isWhitelisted = (url: string) => {
            return url.includes(theDomain) && !url.includes('/cdn/') && subdomains.some(s => {
              var host = s + theDomain;
              var protLess = '//' + host;
              if (url.startsWith(protLess) && window.location.protocol === 'https:')
                return true;
              if (url.startsWith('https:' + protLess))
                return true;
              return false;
            });
          };
          jwtInterceptorProvider.tokenGetter = [
            'config', 'localStorageService', 'aur.login',
            (config, store, login) => {
              if (!isWhitelisted(config.url)) return null;
              let token = window.localStorage[window.w6Cheat.containerObjects.login.token];
              if (!token) return null;
             if (!Tools.isTokenExpired(token))
               return token;
             else {
              var refreshToken = async function() {
                var x = await login.handleRefreshToken();
                try {
                  //if (!x) throw new Error("no valid refresh token");
                  // TODO: Inform about lost session?
                  return x ? window.localStorage[window.w6Cheat.containerObjects.login.token] : null;
                } finally {
                  refreshingToken = null}
                }
                return null
              }
               if (refreshingToken === null) {
                 refreshingToken = refreshToken();
               return refreshingToken;
              }
            }
          ];
          $httpProvider.interceptors.push('jwtInterceptor');
        }
      ])
        .run([
        'breeze', breeze => {
          breeze.NamingConvention.camelCase.setAsDefault();
          /*                        if (userInfo.apiToken) {
                                      var ajaxImpl = breeze.config.getAdapterInstance("ajax");
                                      ajaxImpl.defaultSettings = {
                                          /*
                                          headers: {
                                              // any CORS or other headers that you want to specify.
                                          },
                                          #1#

                                      };
                                  }*/
        }
      ])
        .run([
        'editableOptions', editableOptions => {
          editableOptions.theme = 'bs3'; // bootstrap3 theme. Can be also 'bs2', 'default'
        }
      ])
        .run([
        'environment', '$rootScope', 'w6', '$timeout', (environment: Tk.Environment, $rootScope: IRootScope, w6: W6, $timeout) => {


          // TODO: No Dom manipulation in controllers..
          $rootScope.handleDownloads = () => {
            if ($rootScope.w6.enableBasket) {
              if (!$rootScope.downloadsHandled) {
                $('a.clientdownload').each((i, el) => {
                  el.setAttribute("href", el.getAttribute("href") + "?basket=1");
                }); // TODO: No Dom manipulation in controllers..
                $rootScope.downloadsHandled = true;
              }
            }
          }
          $rootScope.w6 = w6;

          $rootScope.pageInfo = { title: document.title };
          $rootScope.setPageInfo = pageInfo => {
            $rootScope.pageInfo = pageInfo;
            document.title = pageInfo.title;
          };

          $rootScope.defaultImage = 'https:' + w6.url.getAssetUrl('img/withSIX/footer_icon.jpg');

          $rootScope.setMicrodata = (microdata: Components.IMicrodata) => {
            $rootScope.microdata = microdata;
          };
          $rootScope.Modernizr = Modernizr;
          // todo elsewhere..
          $rootScope.url = w6.url;

          $rootScope.loadingStatus = {
            outstanding: 0,
            increment: () => {
              Debug.log('increment', $rootScope.loadingStatus.outstanding);
              $rootScope.loadingStatus.outstanding += 1;
              $rootScope.startLoading();
            },
            decrement: () => {
              Debug.log('decrement', $rootScope.loadingStatus.outstanding);
              $timeout(() => {
                $rootScope.loadingStatus.outstanding -= 1;
                if ($rootScope.loadingStatus.outstanding == 0 && $rootScope.status == 'loading')
                  $rootScope.ready();
              }, 2 * 1000);
            }
          };
          $rootScope.environment = environment;
          $rootScope.toShortId = (id) => Tools.toShortId(id);
          $rootScope.sluggify = (str) => Tools.sluggify(str);
          $rootScope.sluggifyEntityName = (str) => Tools.sluggifyEntityName(str);
          $rootScope.request = (cq, data?) => $rootScope.dispatch(cq.$name, data);
          $rootScope.requestWM = (cq, data?) => $rootScope.dispatch(cq.$name, data);
          $rootScope.cancelOutstandingRequests = () => {
            var canceler = $rootScope.canceler;
            if (canceler != null) {
              Debug.log("cancelling outstanding request");
              canceler.resolve();
            }
          };
          $rootScope.isInvalid = (field, ctrl) => {
            if (!field.$invalid) return false;
            if (ctrl.sxValidateOnBlur && field.sxBlurred) return true;
            //if (!ctrl.sxHideIndicator && !field.$pristine) return true;
            return ctrl.sxFormSubmitted;
            //return field.$invalid && ((!ctrl.sxHideIndicator && !field.$pristine) || ctrl.sxFormSubmitted)
          };
          $rootScope.blurred = (fieldName, ctrl) => ctrl[fieldName].sxBlurred = true;

          $rootScope.$on('myNameChanged', (evt, data) => {
            w6.updateUserInfo(<any>{ firstName: data.firstName, lastName: data.lastName }, w6.userInfo)
          });
          $rootScope.$on('myAvatarChanged', (evt, avatarInfo) => {
            w6.updateUserInfo(avatarInfo, w6.userInfo)
          });

          // TODO: Does not do anything??
          /*$rootScope.$on('$routeChangeStart', (evt, data) => $rootScope.cancelOutstandingRequests());*/
        }
      ])
        .config(['$commangularProvider', $commangularProvider => registerCommands(this.commands, $commangularProvider)])
        .config([
        '$routeProvider', '$locationProvider', '$sceDelegateProvider', '$routeSegmentProvider', 'w6',
        ($routeProvider, $locationProvider: ng.ILocationProvider, $sceDelegateProvider, $routeSegmentProvider, w6: W6) => {
          (<any>$locationProvider).html5Mode({ enabled: true });

          $sceDelegateProvider.resourceUrlWhitelist([
            'self',
            'http:' + w6.url.cdn + '/**',
            'https:' + w6.url.cdn + '/**',
            'http:' + w6.url.url + '/**',
            w6.url.urlSsl + '/**',
            //'http:' + w6.url.play + '/**',
            //'https:' + w6.url.play + '/**',
            //w6.url.connectSsl + '/**',
            w6.url.authSsl + '/**',
            //'http:' + w6.url.connect + '/**',
            //'https:' + w6.url.connect + '/**',
            //'http:' + w6.url.main + '/**',
            //'https:' + w6.url.main + '/**',
          ]);

          $routeSegmentProvider
            .when('/errors/400', 'static')
            .when('/errors/401', 'static')
            .when('/errors/403', 'static')
            .when('/errors/404', 'static')
            .when('/errors/500', 'static')
            .segment('static', { controller: 'StaticPageController' });

          $routeProvider.otherwise({
            redirectTo: '/errors/404'
          });
        }
      ]);

      if (Tk.getEnvironment() == Tk.Environment.Production) {
        this.app.config([
          '$analyticsProvider', $analyticsProvider => {
            $analyticsProvider.firstPageview(true); /* Records pages that don't use $state or $route */
            //$analyticsProvider.withAutoBase(true);  /* Records full path */
          }
        ]);
      }

      //if (debug) this.app.run(['$route', $route => Debug.log($route.routes)]);
    }
  }

  export function setup(setupInfo) {
    var rootModule = new RootModule(setupInfo);
  }

  var appLoaded = false;
  export function isAppLoaded() {
    return appLoaded;
  }

  export function loadApp(mod) {
    if (appLoaded)
      return;
    appLoaded = true;
    Debug.log("bootstrapping angular module", mod);
    angular.bootstrap(document, [mod]);
  }

  export function bootAngular() {
    var promise = new Promise<void>((resolve, reject) => {
      let moduleName = "MyApp" || $('html').attr('six-ng-app');
      let myApplication = angular.module(moduleName);
      angular.element(document).ready(() => {
        loadApp(moduleName);
        resolve();
      });
    });
    return promise;
  }

  export var authSet = false;

  export function registerService(service) { app.app.service(service.$name, service); }

  export function registerController(controller) { app.app.controller(controller.$name, controller); }

  export function registerCQ(command) { app.registerCommand(command); }

  export function registerCommands(commands, provider) {
    //Debug.log('registerCommands', commands);
    var add = (req) => {
      var reqHandler = req + 'Handler';
      //Debug.log("Registering " + req + ": " + reqHandler);
      provider.mapTo(req).asSequence().add(reqHandler);
    };
    var register = cls => {
      if (cls == null || cls == '')
        throw new Error("cls undefined");
      if (cls.$name == null || cls.$name == '') {
        Debug.log("cls.$name undefined for", cls);
        throw new Error("cls.$name undefined for" + cls);
      }
      commangular.create(cls.$name + "Handler", cls);
      add(cls.$name);
    };
    commands.forEach(x => register(x));
  };

  if (debug) {
    commangular.aspect('@Before(/.*/)', Tk.BeforeInterceptor);
    commangular.aspect('@After(/.*/)', Tk.AfterInterceptor);
    commangular.aspect('@AfterThrowing(/.*/)', Tk.AfterThrowingInterceptor);
  }

  var app = new AppModule();

  export class LoginSpaCommand extends DbCommandBase {
    static $inject = ['dbContext', '$q', 'w6', '$http', '$window'];
    static $name = 'LoginSpa';

    constructor(public context: W6Context, public $q: ng.IQService, private w6: W6, private $http: ng.IHttpService, private $window) {
      super(context);
    }

    public execute = [
      () => {
        //this.$window.location.href = this.w6.url.connectSsl + '/login?ReturnUrl=' + window.location.href;
        /*            function EncodeQueryData(data) {
                        var ret = [];
                        for (var d in data)
                            ret.push(encodeURIComponent(d) + "=" + encodeURIComponent(data[d]));
                        return ret.join("&");
                    }
                    var data = {
                        response_type: 'code id_token token',
                        client_id: 'withsix-spa',
                        scope: 'openid profile extended_profile roles api offline_access',
                        redirect_uri: this.w6.url.connectSsl + '/loggedin',
                        state: window.location.href,
                        nonce: Math.floor(Math.random() * 99999)
                    }

                    // TMP
                    this.$window.location.href = this.w6.url.authSsl + '/identity/connect/authorize?' + EncodeQueryData(data);*/
      }
    ];
  }

  registerCQ(LoginSpaCommand);
}

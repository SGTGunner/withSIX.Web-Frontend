import {Container, inject, transient, singleton, Lazy, All, Optional, Parent} from 'aurelia-dependency-injection';
import {Aurelia} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import { LogManager } from 'aurelia-framework';
import {Toastr, UiContext, Mediator, ErrorLoggingMediatorDecorator, InjectingMediatorDecorator} from './services/lib';
import Linq from 'linq4es2015/linq';
import {HttpClient} from 'aurelia-http-client';
import {AbortError,LoginBase} from './services/auth-base';

import IUserInfo = MyApp.IUserInfo;
import UserInfo = MyApp.EntityExtends.UserInfo;

export async function configure(aurelia: Aurelia) {
  Tk.Debug.log("AURELIA: configuring aurelia");

  Linq.setExtensions();
  //["123"].asEnumerable().select(x => true).toArray();

  function configureApp(site: string, useRouter: boolean, authConfig) {
    Tk.Debug.log("AURELIA: configuring app");
    aurelia.use
      .standardConfiguration()
      .plugin('aurelia-auth', baseConfig => baseConfig.configure(authConfig))
      .plugin('aurelia-animator-css')
      //.plugin('aurelia-animator-velocity')
      .plugin('aurelia-validation')
      .plugin('aurelia-computed')
      .plugin('aurelia-dialog')
      .feature('resources')
      .feature('components');

    if (Tk.getEnvironment() != Tk.Environment.Production) {
      aurelia.use.developmentLogging();
      //LogManager.setLevel(Tk.getEnvironment() != Tk.Environment.Production ? LogManager.logLevel.debug : LogManager.logLevel.warn);
    }

    if (useRouter)
      aurelia.use.router();
    aurelia.use.feature(site);
  }

  async function startApp() {
    new ContainerSetup(Container.instance, angular.element("body").injector());
    Tk.Debug.log("AURELIA: starting app");
    var app = await aurelia.start();
    Tk.Debug.log("AURELIA: app started");
    await app.setRoot();
  }

    //@{ var scheme = w6.Urls.CurrentPage.Scheme; }
  var env = Tk.getEnvironment();

  var domain = window.location.host;
  if (env == Tk.Environment.Production)
    domain = "withsix.com";
  else if (env == Tk.Environment.Staging)
    domain = "staging.withsix.net";
  else
    domain = "local.withsix.net";

  var actualDomain = window.location.host;

  var site = "main";
  if (actualDomain.startsWith("play")) {
    site = "play";
  } else if (actualDomain.startsWith("connect")) {
    site = "connect";
  }

  var w6Urls = new W6Urls({
    environment: Tk.getEnvironment(),
    domain: domain,
    site: site,
    cdn: "/cdn",
    // TODO: Inject these from somewhere??
    serial: 667, //'@Environments.Serial', // CryptoString.GetRandomAlphanumericString(8)
    cacheBuster: 71,
    assetSalt: 5, //@Environments.AssetSalt,
    buckets: {
      "withsix-usercontent": "withsix-usercontent.s3-eu-west-1.amazonaws.com" // TODO: add dev stuff
    } //@Html.ToJson(Buckets.All.ToDictionary(x => x.Name, x => "//" + x.CdnHostname))
  });

  function toSsl(host) {
    return host.replace(":9000", ":9001");
  }

  // hack for electron cant communicate with popup
  if (window.location.href.includes("?code=")) {
    window.localStorage.setItem('auth-search', window.location.search);
    window.localStorage.setItem('auth-hash', window.location.hash);
  }

  // TODO: localhost ports / hostnames for local development
  // if (env == 2) {
  //   w6Urls.main = "//" + window.location.host;
  //   w6Urls.play = "//" + window.location.host;
  //   w6Urls.connect = "//" + window.location.host;
  //   w6Urls.connectSsl = "https:" + toSsl(w6Urls.connect);
  //   w6Urls.authSsl = "https:" + toSsl();
  //   w6Urls.kb = "//" + window.location.host;
  //   w6Urls.admin = "//" + window.location.host;
  // }

  var something = {
    PublisherId: "19223485",
    AdsenseId: "ca-pub-8060864068276104"
  }

  window.w6Cheat.w6Urls = w6Urls;
  window.w6Cheat.container = Container.instance;
  window.w6Cheat.containerObjects.eventBus = <any>EventAggregator;
  window.w6Cheat.containerObjects.toastr = <any>Toastr;
  window.w6Cheat.containerObjects.login = LoginBase;

  var authConfig = {
      //our Aurelia App Address
      baseUrl : window.location.protocol + w6Urls.main,
      loginRedirect: false,
      providers: {
          localIdentityServer: {
              clientId: 'withsix-spa',
              authorizationEndpoint: w6Urls.authSsl + '/identity/connect/authorize/',
              url: w6Urls.authSsl + '/api/login/auth',
              redirectUri: window.location.protocol + "//" + window.location.host + '/',
              scope: ['openid', 'profile', 'extended_profile', 'roles', 'api', 'offline_access'],
              scopePrefix: '',
              scopeDelimiter: ' ',
              requiredUrlParams: ['scope'],
              display: 'popup',
              popupOptions: { width: 1020, height: 618 },
              loginRedirect: false
          }
      }
  }

  configureApp(site, true, authConfig);

  try {
    // TODO: Find a way to export angular services before booting angular?
    await bootstrap(w6Urls, something);
    await startApp();
  } catch (err) {
    Tk.Debug.error(err);
    throw err;
  }
}
export async function bootstrap(w6Urls: W6Urls, something) {
  let login = new LoginBase(new HttpClient(), w6Urls);
  let userInfo: IUserInfo = null;
  try {
    userInfo = await login.getUserInfo();
  } catch (err) {
    if (err.constructor == AbortError) throw err;
    Tk.Debug.log("Error logging in", err);
    userInfo = new MyApp.EntityExtends.UserInfo();
    userInfo.failedLogin = true;
  }

  window.w6Cheat.w6 = new W6(w6Urls, !userInfo.isPremium && window.location.protocol != 'https:', window.w6Cheat.isClient, null, userInfo);
  MyApp.setup({
    dfp: { publisherId: something.PublisherId },
    adsense: { client: something.AdsenseId },
    environment: Tk.getEnvironment(),
    w6: window.w6Cheat.w6
  });

  await MyApp.bootAngular();
}


export class ContainerSetup {
  constructor(private instance: Container, private angularInjector) {
    if (instance == null) throw "instance null";
    if (angularInjector == null) throw "angularInjector null";
    // this.instance.registerSingleton(HttpClient, () => {
    //   var client = new HttpClient();
    //   client.configure(x => {
    //     //x.withInterceptor(new RequestInterceptor());
    //   });
    //   return client;
    // });
    this.instance.registerSingleton(W6, () => (window.w6Cheat.w6));
    this.instance.registerTransient(UiContext);
    this.registerAngularSingletons(["commandExecutor", "modInfoService", "collectionDataService", "modDataService", "missionDataService", "basketService", 'dbContext', 'logger']);
    this.instance.registerSingleton(Mediator,
      () => new ErrorLoggingMediatorDecorator(new InjectingMediatorDecorator(new Mediator(), this.instance.get(W6)), this.instance.get('logger')));
  }

  registerAngularSingletons(services) {
    services.forEach(s => this.registerAngularSingleton(s));
  }

  registerAngularSingleton(name) {
    this.instance.registerSingleton(name, () => this.angularInjector.get(name));
  }
}

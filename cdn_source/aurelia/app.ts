//import 'bootstrap';
//import 'bootstrap/css/bootstrap.css!';

import {inject, autoinject, Container} from 'aurelia-framework';
import {Router, RouterConfiguration, NavigationContext, Redirect} from 'aurelia-router';
import {DialogService} from 'aurelia-dialog';
import {MainModule} from './main/index';
import {ConnectModule} from './connect/index';
import {PlayModule} from './play/index';
import {HttpClient} from 'aurelia-http-client';
import HttpClientConfig from 'aurelia-auth/app.httpClient.config';
import {UiContext,ViewModel, Mediator} from './framework';
import {CreateCollectionDialog} from './play/collections/create-collection-dialog';
import {Login} from './services/auth';

declare var RegExp;

@inject(HttpClient, W6)
class RouteHandler {
  routingData;
  site: string;
  constructor(private http: HttpClient, private w6: W6) {
    http.configure(x => (<any>x).withHeader('Accept', 'application/json')); // firefox fix for login json not turning into an object
  }

  async configure(site: string) {
  this.site = site;
  var r = await this.http.get(this.w6.url.getSerialUrl("data/routing.json"));
  let main = r.content["main"]
  let routes = r.content["play"];
  for (let e in routes) main["/p" + (e == "/" ? "" : e)] = routes[e];
  routes = r.content["connect"];
  for (let e in routes) main[e] = routes[e];
  this.routingData = r.content;

}
getRouteMatch(fragment) {
  var data = this.routingData[this.site];
  for (var d in data) {
    var match = this.getRouteSpecificMatch(fragment, d, data[d]);
    if (match)
      return match;
  }
  return null;
}

cache = {};

getRx(d) {
  var rx = d.split("/");
  var newRx = [];
  rx.forEach(e => {
    if (e.startsWith(":")) {
      if (e.endsWith("?"))
        newRx.push("?([^/]*)");
      else
        newRx.push("([^/]+)");
    } else {
      newRx.push(e);
    }
  });
  var rxStr = '^' + newRx.join("/") + '$';
  return new RegExp(rxStr, "i");
}

getRouteSpecificMatch(fragment, d, data) {
  if (fragment.match(this.cache[d] || (this.cache[d] = this.getRx(d))))
    return data;
}
}

@inject(UiContext, HttpClient, Login, HttpClientConfig, RouteHandler)
export class App extends ViewModel {
  modules: any[];
  router: Router;
  original: boolean;
  first: boolean;
  breadcrumbs: { title: string, path: string }[];

  constructor(ui: UiContext, public http: HttpClient, private login: Login, private httpClientConfig: HttpClientConfig, private routeHandler: RouteHandler) {
    super(ui);
    var site = this.w6.url.site || "main";
    this.modules = [new MainModule(), new PlayModule(), new ConnectModule()];
    this.original = this.w6.enableBasket;
    this.breadcrumbs = this.setupBreadcrumbs();
    this.w6.openLoginDialog = evt => this.login.login();
    this.w6.logout = () => this.logout();
  }

  activate() {
    this.subscriptions.subd(d => {
      // TODO: we might be better off abstracting this away in a service instead, so that we dont have all these eventclasses laying around just for interop from Angular...
      d(this.eventBus.subscribe(RestoreBasket, this.restoreBasket));
      d(this.eventBus.subscribe(EnableBasket, this.forceBasketEnable));
      d(this.eventBus.subscribe(OpenCreateCollectionDialog, this.openCreateCollectionDialog));
      d(this.eventBus.subscribe(Navigate, this.navigate))
    });
    $('body').attr('style', '');
    // TODO: this adds accept application/json, and authorize header to EVERY request. we only want to do that to actualy JSON endpoints, and definitely not to CDN!
    //this.httpClientConfig.configure();
  }

  deactivate() { this.subscriptions.dispose(); }

  activateNg() {
    if (!this.first) {
      setTimeout(() => {
        Tk.Debug.log("activating ng from app..");
        var el = angular.element("#content");
        angular.element("#root-content-row").append(el)
        el = angular.element("#header-add");
        angular.element("#header-add-place").append(el);
        window.w6Cheat.aureliaReady = true;
      });
      this.first = true;
    }
    return null;
  }

  openCreateCollectionDialog = (event: OpenCreateCollectionDialog) => this.dialog.open({viewModel: CreateCollectionDialog, model: {game: event.game}});

  // TODO: https://identityserver.github.io/Documentation/docs/endpoints/endSession.html
  logout() { return this.login.logout(); }
  forceBasketEnable = () => this.w6.enableBasket = true;
  restoreBasket = () => this.w6.enableBasket = this.original;
  navigate = (evt: Navigate) => this.router.navigate(evt.url);

  setupBreadcrumbs() {
    var path = [];
    var breadcrumbs = [];

    if (this.w6.url.site && this.w6.url.site != 'main') {
      breadcrumbs.push({
        title: this.w6.url.siteTitle,
        path: this.w6.url[this.w6.url.site]
      });
    }

    var pathname = window.location.pathname.trim();
    if (pathname == "/")
      return breadcrumbs;

    pathname.split('/').forEach(x => {
      if (!x) return;
      path.push(x);
      var joinedPath = "/" + path.join("/");
      breadcrumbs.push({
        title: x,
        path: pathname == joinedPath ? null : joinedPath
      });
    });

    return breadcrumbs;
  }


  get showSlogan() { return this.w6.url.site == 'main' && this.w6.url.isRoot; }

  async configureRouter(config: RouterConfiguration, router: Router) {
  config.title = 'withSIX';
  config.options.pushState = true;
  config
    .addPipelineStep('authorize', SslStep)
    .addPipelineStep('authorize', AuthorizeStep)
    .addPipelineStep('postcomplete', {
      run: (context, next) => {
        this.breadcrumbs = this.setupBreadcrumbs();
        return next();
      }
    });

  var site = this.w6.url.site || "main";
  await this.routeHandler.configure(site);

  config.mapUnknownRoutes((instruction) => {
    Tk.Debug.log("$$ AURELIA: Mapping unknown route for site: " + site, instruction);
    let match = this.routeHandler.getRouteMatch(instruction.fragment);
    if (!match) {
      Tk.Debug.warn("$$ AURELIA: did not found match in routing map!", instruction, this.routeHandler.routingData[site]);
      //return instruction; // 404!;
      return;
    }

    if (match.type == "aurelia") {
      Tk.Debug.error("$$$ AURELIA: Found aurelia unmatched route, must be error?!", match, instruction);
      return;
    }

    if (!match.type || match.type == "angular") {
      Tk.Debug.log("$$ AURELIA: found angular match!", instruction);
      instruction.config.moduleId = "angular";
      return;
    }
    if (match.type == "static") {
      if (match.redirectTo) {
        Tk.Debug.log("$$ AURELIA: found static redirect!", instruction);
        instruction.config.redirect = match.redirectTo;
        return;
      }
      Tk.Debug.log("$$ AURELIA: found static page!", instruction);
      instruction.config.moduleId = "static";
    }
  });

  this.modules.forEach(m => m.configureRouter(config, router));
  this.router = router;
}
}

export class OpenCreateCollectionDialog {
  constructor(public game) {}
}

export class EnableBasket { }
export class RestoreBasket { }
export class Navigate {
  constructor(public url: string) { }
}

@inject(Login)
class AuthorizeStep {
  constructor(public login: Login) {}
  run(routingContext: NavigationContext, next) {
    if (routingContext.nextInstructions.some(function (i) {
      return i.config.auth;
    })) {
      var isLoggedIn = this.login.authService.isAuthenticated();
      if (!isLoggedIn) {
        //var loginRoute = this.auth.getLoginRoute();
        //return next.cancel(new Redirect(loginRoute));
        setTimeout(() => {
          //var lastInstruction = routingContext.nextInstructions.asEnumerable().last();
          this.login.login(); // lastInstruction.fragment + lastInstruction.queryString
        });
        return next.cancel();
      }
    }

    return next();
  }
}

@inject(RouteHandler, W6, Login)
class SslStep extends AuthorizeStep {
  constructor(private routeHandler: RouteHandler, private w6: W6, login: Login) { super(login); }
  run(routingContext: NavigationContext, next) {
    var matches = routingContext.nextInstructions.asEnumerable().select(x => this.routeHandler.getRouteMatch(x.fragment)).where(x => x != null).toArray();
    if (matches.length == 0) return next();

    let isLoggedIn = this.w6.userInfo.id ? true : false;
    if (!isLoggedIn && matches.asEnumerable().any(x => x.auth)) {
      // We only do this here because we have also non Aurelia routes with auth requirements..
      setTimeout(() => {
        //var lastInstruction = routingContext.nextInstructions.asEnumerable().last();
        this.login.login(); // lastInstruction.fragment + lastInstruction.queryString
      });
      return next.cancel();
    }

    if (this.w6.userInfo.failedLogin) {
      setTimeout(() => {
        //var lastInstruction = routingContext.nextInstructions.asEnumerable().last();
        this.login.login(); // lastInstruction.fragment + lastInstruction.queryString
      });
      return next();
    }

    let isHttps = window.location.protocol == "https:";
    let isPremium = this.w6.userInfo.isPremium;
    if (isHttps) {
      if (!isPremium && matches.asEnumerable().all(x => !x.ssl)) {
        // Problem: We don't know if we got redirected for premium purposes, or because of required SSL, so hm
        if (window.w6Cheat.redirected && !isLoggedIn) {
          setTimeout(() => {
            //var lastInstruction = routingContext.nextInstructions.asEnumerable().last();
            this.login.login(); // lastInstruction.fragment + lastInstruction.queryString
          });
          return next.cancel();
          //var loginRoute = this.auth.getLoginRoute();
          //return next.cancel(new Redirect(loginRoute));
        }
        Tk.Debug.log("$$$ SslStep: Using SSL, but is not premium, nor page requires SSL. Switching to non-SSL");
        let httpUrl = "http:" + window.location.href.substring(6).replace(":9001", ":9000");
        httpUrl = httpUrl.includes('#') ? httpUrl + "&sslredir=1" : httpUrl + "#sslredir=1";
        return next.cancel(this.getRedirect(httpUrl));
      }
    } else {
      let requiresSsl = matches.asEnumerable().any(x => x.ssl);
      if (isPremium || requiresSsl) {
        Tk.Debug.log("$$$ SslStep: Using non-SSL, but is premium or page requires SSL. Switching to SSL", isPremium);
        let httpsUrl = "https:" + window.location.href.substring(5).replace(":9000", ":9001");
        httpsUrl = httpsUrl.includes('#') ? httpsUrl + "&sslredir=1" : httpsUrl + "#sslredir=1";
        return next.cancel(this.getRedirect(httpsUrl));
      }
    }
    return next();
  }

  getRedirect(url) {
    Tk.Debug.log("$$$ router redirect", url);
    return new Redirect(url);
  }
}

window.w6Cheat.containerObjects.enableBasket = EnableBasket;
window.w6Cheat.containerObjects.restoreBasket = RestoreBasket;
window.w6Cheat.containerObjects.navigate = Navigate;
window.w6Cheat.containerObjects.openCreateCollectionDialog = OpenCreateCollectionDialog;


class Ipc<T> {
  static statId = 0;
  id: number;
  promise: Promise<T>
  resolve; reject;
  constructor() {
    this.id = Ipc.statId++;
    this.promise = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    })
  }
}
class IpcHandler {
  messages = new Map<number, Ipc<any>[]>();
  api;
  constructor() {
    var w = <any>window;
    this.api = w.api;
    this.api.signalrListeners2.push(this.receive);
  }
  send<T>(hub, message, data?) {
    var msg = new Ipc<T>();
    this.messages[msg.id] = msg;
    console.log("Sending message", msg);
    this.api.sendSignalrMessage(msg.id, hub, message, data);
    console.log("Sent message", msg);
    return msg.promise;
  }

  receive = (id, type, args) => {
    try {
    if (type == 0)
      this.messages[id].resolve(args);
    else
      this.messages[id].reject(args);
    } finally {
      this.messages.delete(id);
    }
  }
}

@inject(IpcHandler)
export class Test {
  constructor(ipcHandler: IpcHandler) {}
}

var w = <any> window;
if (Tk.getEnvironment() >= Tk.Environment.Staging && w.api) {
  var test = Container.instance.get(Test);
  w.test = test;
}

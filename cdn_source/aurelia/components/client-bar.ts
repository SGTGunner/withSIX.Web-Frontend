import './client-bar.css!';
import {inject} from 'aurelia-framework';
import {Router} from 'aurelia-router';
import {EventAggregator} from 'aurelia-event-aggregator';
import {FindModel,Command,UiContext,uiCommand2,uiCommandWithLogin2,MenuItem, IMenuItem, Debouncer, Utils, Mediator, Query, DbQuery, DbClientQuery, Base, ViewModel, ITypeahead, handlerFor, IRequireUser, requireUser} from '../framework';
import {TypeScope} from '../connect/profile/content/base';
import {CreateCollectionDialog} from '../play/collections/create-collection-dialog';
import {BasketService, GameClientInfo,ConnectionState} from './basket-service';

import GameBaskets = MyApp.Components.Basket.GameBaskets;
import ClientInfo = MyApp.Components.ModInfo.IClientInfo;
import IContentStatusChange = MyApp.Components.ModInfo.IContentStatusChange;
import BasketItemType = MyApp.Components.Basket.BasketItemType;
import BasketType = MyApp.Components.Basket.BasketType;
import IBasketCollection = MyApp.Components.Basket.IBasketCollection;
import IBasketItem = MyApp.Components.Basket.IBasketItem;

interface ICollection {
  id: string, name: string; typeScope: TypeScope,
  image: string, slug: string; gameId: string; gameSlug: string; version: string;
  author: string;
}

interface ICollectionsData {
  collections: ICollection[];
}

// TODO: Get client version and if client version is notuptodate, add a link to update page..
// TODO: Split to clientgamecommands for when a game is active..
@inject(UiContext, BasketService, "modInfoService")
export class ClientBar extends ViewModel {
  creatingBasket = false;
  lockBasket = false;
  wasConnected = false;
  model: MyApp.Components.Basket.GameBaskets;
  activeModule = { type: 'client-game-commands' };
  installMessageHidden = true;
  overrideBasketState = "";
  game = { id: null, slug: null };
  gameInfo: GameClientInfo = new GameClientInfo(null, null);
  collections: ICollection[] = [];
  findModel: FindModel<ICollection>;
  playlistMenuItems: IMenuItem[];
  defaultAssetUrl = this.w6.url.getAssetUrl("img/noimage.png");
  defaultBackUrl = this.w6.url.getAssetUrl('img/play.withSIX/games/stream-bg.jpg');
  debouncer = Debouncer.debouncePromise(() => this.getMyCollections(), 0);

  // workaround for aurelia currently creating empty model objects, until we can use if.bind again
  nullGameBaskets = new GameBaskets(null, {
      activeId: null,
      activeDirect: null,
      collections: []
  }, null);

  get selectedItemUrl() { return this.model.activeDirect ? this.getUrl(this.model.activeDirect.model) : null; }
  get isInitBusy() { return this.basketService.busyCount > 0; }
  get hideInstallMessage() { return this.basketService.basketService.settings.forceBasketInstallMessageHidden || this.installMessageHidden; }
  get hideInstallMessageButton() { return !this.basketService.basketService.settings.forceBasketInstallMessageHidden; }
  get showDownloadSpeed() {
    if (!this.w6.isClientConnected)
      return false;
    if (this.gameInfo.clientInfo.status.progress != 0 || this.gameInfo.clientInfo.status.speed != 0)
      return true;
    return false;
  };
  //activeItem = {};
  get directBasketProgress() { return this.getBasketProgress(this.model.activeDirect); }

  get locked() { return this.lockBasket || this.gameInfo.isLocked; }
  //  || this.processing // TODO: was from http-progress lib..
  get activeStateClass() { return this.getStateClass(this.model ? this.model.active : null); }
  get activeDirectStateClass() { return this.getStateClass(this.model ? this.model.activeDirect : null); }
  get isExpanded() { return this.basketService.basketService.isExpanded(); }
  get canSaveBasket() { return this.model && this.model.active && this.model.active.model.items.length > 0 }

  constructor(ui: UiContext, private basketService: BasketService, private modInfoService: MyApp.Components.ModInfo.ModInfoService) {
    super(ui);
    this.model = this.nullGameBaskets;
    this.findModel = new FindModel(this.findCollections, this.selectCollection, e => e.name);
    var isTemporary = false; //this.model.active.model.isTemporary; // todo dynamic
    this.playlistMenuItems = [
      //new MenuItem("New Playlist", this.newBasket),
      //new MenuItem(this.saveBasket),
      new MenuItem(this.clearBasket)
      //new NotTemporaryMenuItem("Rename", this.renameBasket, this)
    ]
    this.subscriptions.subd(d => {
      d(this.action);
      d(this.findModel);
    });
  }

  bind(bindingContext) {
    this.wasConnected = this.basketService.basketService.settings.hasConnected;
    this.basketService.busyCount += 1;

    this.modInfoService.contentHub.connection.stateChanged((state) => {
      switch (<ConnectionState>state.newState) {
        case ConnectionState.connected:
          //this.applyIfNeeded(() => {
          this.handleConnected();
          //});
          break;
        case ConnectionState.disconnected:
        case ConnectionState.reconnecting:
          //this.applyIfNeeded(() => {
          this.handleDisconnected();
          //});
          break;
        default:
      }
    });

    if (this.modInfoService.contentHub.connection.state == ConnectionState.connected) {
      this.handleConnected();
    } else if (this.modInfoService.contentHub.connection.state == ConnectionState.disconnected) {
      this.handleDisconnected();
    }

    this.modInfoService.signalr.miniClient.promise();
    //$rootScope.handleDownloads();

    this.subscriptions.subd(d =>
      d(this.eventBus.subscribe("gameChanged", info => this.gameChanged(info)))
    );
    this.basketService.busyCount -= 1;
  }

  launchGame() {
    this.modInfoService.launchGame(this.game.id);
  }

  getUrl(b: IBasketCollection) {
    if (b.items.length == 0) return null;
    return this.getBasketItemUrl(b.items[0]);
  }

  // TODO: Fix this pathname madness by having a gameSlug handy!
  getBasketItemUrl(item: IBasketItem) {
    let gameMatch = window.location.pathname.match(/^\/p\/([^\/]+)/);
    let gameMatch2 = window.location.pathname.match(/^\/me\/library\/([^\/]+)/);
    if (!gameMatch && !gameMatch2) return null;
    let gameSlug = gameMatch ? gameMatch[1] : gameMatch2[1];
    var type = BasketItemType[item.itemType].toLowerCase();
    return this.w6.url.play + "/" + gameSlug + "/" + type +  "s/" + item.id.toShortId() + "/" + item.name.sluggifyEntityName();
  }

  findCollections = async (searchItem: string) => this.collections.asEnumerable().where(x => x.name && x.name.containsIgnoreCase(searchItem)).toArray()

  selectCollection = (col: ICollection) => this.basketService.basketService.getGameBaskets(col.gameId)
    .selectOnlyContentItem(MyApp.Play.Helper.collectionToBasket(<any>col), true)

  async getMyCollections() {
    var result = await new GetMyCollections(this.game.id).handle(this.mediator);
    return result.collections;
  }

  async gameChanged(info) {
    Tk.Debug.log("Game Changed: ", info);
    if (this.game.id == info.id) return;
    this.game.id = info.id;
    this.game.slug = info.slug;
    this.model = this.game.id ? this.basketService.basketService.getGameBaskets(this.game.id) : this.nullGameBaskets;
    this.collections = [];
    //this.gameInfo = null;
    if (this.game.id) {
      this.gameInfo = await this.basketService.getGameInfo(this.game.id);
      this.collections = await this.debouncer();
    }
  }

  unbind() { this.dispose(); }

  handleConnected() {
    this.installMessageHidden = true;
    this.wasConnected = true;
    this.basketService.basketService.settings.hasConnected = true;

    var promises = [];

    for (let i in this.basketService.clientInfos) {
      if (this.basketService.clientInfos.hasOwnProperty(i)) {
        promises.push(this.basketService.updateClientInfo(this.basketService.clientInfos[i]));
      }
    }

    return Promise.all(promises);
  }

  handleDisconnected() {
    //this.busyCount = 0; // needed.
    if (this.wasConnected) {
      //this.installMessageHidden = true;
    } else {
      if (this.modInfoService.contentHub.connection.state == ConnectionState.connecting) {
        //this.installMessageHidden = true;
      } else {
        this.installMessageHidden = false;
      }
    }
  }

  showBusyState() {
    return this.isInitBusy || this.gameInfo.clientInfo.gameLock || this.gameInfo.clientInfo.globalLock;
  }

  forceHideInstallMessage() { this.basketService.basketService.settings.forceBasketInstallMessageHidden = true; }

  newBasket = () => this.model.setActiveBasket(this.model.createNewBasket())
  getStatusState() {
    if (!this.w6.isClientConnected)
      return "disconnected";
    if (this.showBusyState())
      return "busy";
    return "connected";
  }

  getBasketProgress(basket: MyApp.Components.Basket.Basket) {
    if (this.gameInfo.clientInfo.status.acting) {
      var percent = Math.round(this.gameInfo.clientInfo.status.progress);

      if (percent < 1)
        return "basket-progress-100";
      if (percent > 100)
        return "basket-progress-100";

      return "basket-progress-" + percent;
    }
    return "basket-progress-100";
  };

  getStateClass(basket: MyApp.Components.Basket.Basket) {
    if (!this.w6.isClientConnected) {
      if (this.showBusyState())
        return "busy";
      return "no-client";
    }

    if (this.overrideBasketState != "")
      return this.overrideBasketState;

    if (this.gameInfo.clientInfo.status.acting)
      return "busy-active";
    if (this.gameInfo.clientInfo.gameLock || this.gameInfo.clientInfo.globalLock) {
      return "busy";
    }

    if (basket == null) {
      return "install";
    }
    if (this.showBusyState())
      return "busy";
    switch (basket.getState(this.gameInfo.clientInfo)) {
      case MyApp.Components.Basket.BasketState.Unknown:
        return "install";
      case MyApp.Components.Basket.BasketState.Install:
        return "install";
      case MyApp.Components.Basket.BasketState.Play:
        return "play";
      case MyApp.Components.Basket.BasketState.Syncing:
        return "syncing";
      case MyApp.Components.Basket.BasketState.Update:
        return "update";
    }
    return null;
  };

  getItemStateClass(item: MyApp.Components.Basket.IBasketItem) { return this.basketService.getItemStateClass(item.id, this.game.id); };

  removeActive() {
    var remove = false;
    if (!this.showBusyState())
      this.model.removeActiveDirect();
    else
      return this.modInfoService.abort(this.model.activeDirect.model.gameId).then(() => {
        //model.removeActiveDirect();
      })//.finally(() => {
      //     //if (remove) {
      //     //    model.removeActiveDirect();
      //     //}
      // })
        ;
  };
  deleteBasket = () => this.model.deleteBasket(this.model.active);

  renameBasket = () => {
    this.creatingBasket = true;
    // TODO: Controllers shouldn't use JQuery / DOM manipulation
    setTimeout(() => $("#basket-name").focus(), 0);
  };
  saveTitle() {
    this.creatingBasket = false;
    return true;
  };
  saveBasket = uiCommandWithLogin2("Create Collection", async () => {
    var activeBasket = this.model.active;
    var basket = activeBasket.model;
    var gameSlug = this.game.slug;
    var model = {
      name: null, // basket.name
      gameId: basket.gameId,
      version: "0.0.1",
      dependencies: basket.items.asEnumerable().where(x => x.packageName ? true : false).select(x => { return { dependency: x.packageName, constraint: x.constraint} }).toArray()
    };
    if (model.dependencies.length == 0)
      throw new Error("There are no items in this playlist...");

    var result = await this.dialog.open({viewModel: CreateCollectionDialog, model: {game: this.game, model: model}});
    if (result.wasCancelled) return;
    var id = result.output;
    var slug = model.name.sluggifyEntityName();
    // TODO: get collection to get image etc??
    this.model.selectOnlyContentItem({id: id, name: model.name, packageName: slug, itemType: BasketItemType.Collection, isOnlineCollection: true, author: "You", gameId: this.game.id, image: null, sizePacked: 0}, true); // TODO: Image etc :S
    this.clearBasket();
  }, {
    canExecuteObservable: this.observe("canSaveBasket"),
    isVisibleObservable: this.observe("canSaveBasket")
  });
  clearBasket = uiCommand2("Clear", async () => this.model.active.clearBasket(), { icon: "withSIX-icon-Square-X" });
  removeFromBasket(item) { return this.model.active.removeFromBasket(item); }
  addToBasket(item) { return this.model.active.addToBasket(item); }
  toggleExpansion() { return this.basketService.basketService.toggleExpansion(); };
  //addToBasket(item: IBasketItem) {

  //    angular.forEach(model.active.items, i => {
  //        if (item.id == i.id)
  //            removeFromBasket(i);
  //    });
  //    model.active.items.push(item);
  //};

  searchCollection(name: string): MyApp.Components.Basket.IBasketCollection { return null };

  // TODO: handle disabled based on client locks etc
  action = uiCommand2("Execute", async () => {
    var basket = this.model.activeDirect;
    if (this.modInfoService.contentHub.connection.state == ConnectionState.disconnected) {
      this.basketService.basketService.settings.forceBasketInstallMessageHidden = false;
      this.installMessageHidden = false;
      await this.modInfoService.signalr.miniClient.promise();
      return;
    }
    if (this.gameInfo.clientInfo.gameLock || this.gameInfo.clientInfo.globalLock) {
      this.toastr.error("Client is currently busy", "Busy");
      return;
    }
    if (basket.model.basketType == BasketType.SingleCollection) {
      var gb = this.basketService.basketService.getGameBaskets(basket.model.gameId);
      gb.subscribeCollection(basket.model.id);
    }
    //return this.processCommand(modInfoService.getGameContent(model.active.model.gameId).then((val) => {
    //    Debug.log(val);
    //}), "Success");
    // TODO: This is largely duplicate with basket-service GameBaskets,
    switch (basket.getState(this.gameInfo.clientInfo)) {
      case MyApp.Components.Basket.BasketState.Unknown:
        await this.processCommand(basket.install(), "Success");
        return;
      case MyApp.Components.Basket.BasketState.Install:
        this.overrideBasketState = "syncing";
        this.lockBasket = true;
        try {
        await this.processCommand(basket.install(), "Success");
      } finally {
          this.overrideBasketState = "";
          this.lockBasket = false;
        };
        return;
      case MyApp.Components.Basket.BasketState.Play:
        this.overrideBasketState = "launching";
        this.lockBasket = true;
        try {
          await this.processCommand(basket.play(), "Success");
        } finally {
          this.overrideBasketState = "";
          this.lockBasket = false;
        };
        return;
      case MyApp.Components.Basket.BasketState.Syncing:
        return;
      case MyApp.Components.Basket.BasketState.Update:
        await this.processCommand(basket.install(), "Success");
        return;
    }
  }, {canExecuteObservable: this.observe("isNotLocked")});

  get isNotLocked() { return !this.locked; }

  async processCommand<T>(promise: Promise<T>, msg?): Promise<T> {
    var x = await promise;
    this.toastr.success(msg || "Saved", "Action completed");
    return x;
  }
}

interface ICollectionModel {
  name: string;
  initialVersion: {
    dependencies: {dependency: string, constraint?: string}[],
    version: string;
  }
}

// class NotTemporaryMenuItem<T> extends MenuItem<T> {
//   constructor(name: string, action: () => Promise<any>, private bar: ClientBar, options?) { super(name, action, () => bar.model && bar.model.active.model.isTemporary, options); }
// }

@requireUser()
class GetMyCollections extends Query<ICollectionsData> implements IRequireUser {
  constructor(public id: string) { super() }
  user: MyApp.IUserInfo;
}

@handlerFor(GetMyCollections)
@inject(W6, "dbContext", "modInfoService", "collectionDataService")
class GetMyCollectionsHandler extends DbClientQuery<GetMyCollections, ICollectionsData> {

  constructor(private w6: W6, dbContext, modInfoService, private collectionDataService: MyApp.Play.ContentIndexes.Collections.CollectionDataService) {
    super(dbContext, modInfoService);
  }
  public async handle(request: GetMyCollections): Promise<ICollectionsData> {
    var optionsTodo = {
      /*                    filter: {},
                          sort: {
                              fields: [],
                              directions: []
                          },
                          pagination: {}*/
    };
    // TODO: only if client connected get client info.. w6.isClientConnected // but we dont wait for it so bad idea for now..
    // we also need to refresh then when the client is connected later?
    var p = [
      //this.getClientCollections(request)
    ];

    if (request.user.id) p.push(this.getSubscribedCollections(request, optionsTodo), this.getMyCollections(request, optionsTodo));
    var results = await Promise.all<Enumerable<ICollection>>(p)
    return { collections: Utils.concatPromiseResults(results).toArray() };
    // return GetCollectionsHandler.designTimeData(request);
  }

  async getClientCollections(request: GetMyCollections) {
    var r = await this.modInfoService.getGameCollections(request.id);
    return r.collections.asEnumerable().select(x => { x.typeScope = TypeScope.Local; return x; });
  }

  async getMyCollections(request: GetMyCollections, options) {
    var r = await this.collectionDataService.getCollectionsByMeByGame(request.id, options)
    return r.asEnumerable().select(x => this.convertOnlineCollection(x, TypeScope.Published));
  }

  async getSubscribedCollections(request: GetMyCollections, options) {
    var r = await this.collectionDataService.getMySubscribedCollections(request.id, options);
    return r.asEnumerable().select(x => this.convertOnlineCollection(x, TypeScope.Subscribed));
  }

  convertOnlineCollection(collection: MyApp.IBreezeCollection, type: TypeScope): ICollection {
    return {
      id: collection.id,
      image: this.w6.url.getContentAvatarUrl(collection.avatar, collection.avatarUpdatedAt),
      typeScope: type,
      author: collection.author.displayName,
      slug: collection.slug,
      name: collection.name,
      gameId: collection.game.id,
      gameSlug: collection.game.slug,
      //type: "collection",
      version: collection.latestVersion.version
    }
  }
}

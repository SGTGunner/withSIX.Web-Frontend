import {inject} from 'aurelia-framework';
import {BasketService,UiContext,uiCommand2,ViewModel,Base,MenuItem,IMenuItem} from '../framework';
import {GameClientInfo,Multi,uiCommand, Mediator, Query, DbQuery, DbClientQuery, handlerFor, VoidCommand} from '../framework';
import {DialogService} from 'aurelia-dialog';
import {EditPlaylistItem} from './edit-playlist-item';

import IBasketItem = MyApp.Components.Basket.IBasketItem;
import GameBaskets = MyApp.Components.Basket.GameBaskets;
import BasketItemType = MyApp.Components.Basket.BasketItemType;
import IBreezeMod = MyApp.IBreezeMod;

interface IPlayModel {
  level: number;
  item: IBasketItem,
  isDependency?: boolean;
  chain: Map<string, IBasketItem>;
  localChain: string[];
}

@inject(UiContext, BasketService, DialogService)
export class PlaylistItem extends ViewModel {
        gameInfo: GameClientInfo;
  basket: GameBaskets;
  model: IBasketItem;
  chain: Map<string, IBasketItem>;
  dependencies: IBasketItem[] = [];
  menuItems: IMenuItem[] = [];
  level: number;
  url: string;
  localChain: string[];
  showDependencies = true;
  image: string;

  constructor(ui: UiContext, private basketService: BasketService, private dialogService: DialogService) {
    super(ui);
  }

  async activate(model: IPlayModel) {
    this.model = model.item;
    this.chain = model.chain;
    this.localChain = model.localChain || [];
    this.level = model.level;
    if (this.level === 0 || !this.chain.has(this.model.id))
      this.chain.set(this.model.id, this.model);
    this.basket = this.basketService.basketService.getGameBaskets(this.model.gameId);
    this.url = this.getBasketItemUrl();
    if (!model.isDependency) {
      this.menuItems.push(new MenuItem(this.edit));
      this.menuItems.push(new MenuItem(this.removeFromBasket));
    }

    this.gameInfo = await this.basketService.getGameInfo(this.model.gameId); // hack

    try {
      let data = await new GetDependencies(this.model.packageName, this.model.gameId, this.localChain, this.chain).handle(this.mediator);
      this.dependencies = data.dependencies;
      //if (!this.model.sizePacked)
      this.model.sizePacked = data.sizePacked;
    } catch (err) {
      Tk.Debug.error("Error while trying to retrieve dependencies for " + this.model.id, err);
    }

    this.image = this.model.image || this.w6.url.getAssetUrl('img/noimage.png');
  }

  get dependencySize() {
    return this.localChain.asEnumerable().select(x => this.chain.get(x)).select(x => x.sizePacked).where(x => x != null).sum()
  }

  // TODO: why do sub dependencies not return when switching dependencies into and out of playlists??
  // get isVisible() {
  //   // getter and setter, but wth
  //   let id = this.model.id;
  //   if (!this.chain.has(id) || (this.chain.get(id) !== this && this.level == 0)) this.chain.set(id, this);
  //   return this.chain.get(id) === this;
  // }

  unbind() {
    //Tk.Debug.log("$$$ deactivating", this.model);
    //this.dependencies.forEach(x => this.chain.delete(x.id));
    // if (this.chain.get(this.model.id) === this)
    //   this.chain.delete(this.model.id);
  }

  // TODO: Fix this pathname madness by having a gameSlug handy!
  getBasketItemUrl() {
    let gameMatch = window.location.pathname.match(/^\/p\/([^\/]+)/);
    let gameMatch2 = window.location.pathname.match(/^\/me\/library\/([^\/]+)/);
    if (!gameMatch && !gameMatch2) return null;
    let gameSlug = gameMatch ? gameMatch[1] : gameMatch2[1];
    return this.w6.url.play + "/" + gameSlug + "/" + BasketItemType[this.model.itemType || 0].toLowerCase() + "s/" + this.model.id.toShortId() + "/" + this.model.name.sluggifyEntityName();
  }

  edit = uiCommand2("Select Version", async () => {
    await this.dialogService.open({viewModel: EditPlaylistItem, model: this.model});
    this.eventBus.publish("basketChanged");
  }, { icon: "withSIX-icon-Edit-Pencil" });
  removeFromBasket = uiCommand2("Remove", async () => {
    this.basket.active.removeFromBasket(this.model);
    this.eventBus.publish("basketChanged");
    // TODO: This should require the dependency chain to be reset .. hm
  }, { icon: "withSIX-icon-Square-X" })
  get itemStateClass() { return this.basketService.getItemStateClass(this.model.id, this.model.gameId); }
}

interface IResult {
  dependencies: IBasketItem[];
  sizePacked: number;
}

class GetDependencies extends Query<IResult> {
  constructor(public packageName: string, public gameId: string, public localChain: string[], public chain: Map<string, IBasketItem>) {
    super();
    if (packageName == null) throw new Error("packageName can't be null");
    if (gameId == null) throw new Error("gameId can't be null");
  }
}

@handlerFor(GetDependencies)
class GetDependenciesHandler extends DbQuery<GetDependencies, IResult> {
  async handle(request: GetDependencies) {
    var query = breeze.EntityQuery.from("Mods")
      .where(new breeze.Predicate("packageName", breeze.FilterQueryOp.Equals, request.packageName).and(new breeze.Predicate("gameId", breeze.FilterQueryOp.Equals, request.gameId)))
      .expand(["dependencies"])
      .select(["dependencies", "sizePacked"]);
      // TODO:
      //.where(request.chain, NOT, breeze.FilterQueryOp.Contains, "id");
    var r = await this.context.executeQuery<IBreezeMod>(query);
    var sizePacked = r.results[0] ? r.results[0].sizePacked : 0;
    var dependencies = r.results[0] ? r.results[0].dependencies.asEnumerable().where(x => !request.localChain.asEnumerable().contains(x.id)).select(x => x.id).toArray() : [];
    if (dependencies.length == 0)     return {
          dependencies: [],
          sizePacked: sizePacked
        };
    var cachedIds = dependencies.asEnumerable().where(x => request.chain.has(x)).toArray();
    var idsToFetch = dependencies.asEnumerable().except(cachedIds).toArray();
    var fetchedResults = [];
    if (idsToFetch.length > 0) {
      var op = {id: {in: idsToFetch}};
      query = breeze.EntityQuery.from("Mods")
        .where(<any>op)
        .select(["id", "name", "packageName", "author", "authorText", "gameId", "avatar", "avatarUpdatedAt", "sizePacked"]);
      r = await this.context.executeQuery<IBreezeMod>(query);
      fetchedResults = r.results;
      fetchedResults.forEach(x => request.chain.set(x.id, x));
    }
    var results = fetchedResults.asEnumerable().select(x => { return MyApp.Play.Helper.modToBasket(x) }).concat(cachedIds.asEnumerable().select(x => request.chain.get(x))).toArray();
    results.forEach(x => { request.localChain.push(x.id); });
    return {
      dependencies: results,
      sizePacked: sizePacked
    };
  }
}

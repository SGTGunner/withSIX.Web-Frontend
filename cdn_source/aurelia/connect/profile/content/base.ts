import {inject} from 'aurelia-framework';
import {BasketService,GameClientInfo,Multi,uiCommand, uiCommand2,UiContext, MenuItem, ViewModel, Mediator, Query, DbQuery, DbClientQuery, handlerFor, VoidCommand} from '../../../framework';
import {Router} from 'aurelia-router';

import BasketItemType = MyApp.Components.Basket.BasketItemType;
import ItemState = MyApp.Components.ModInfo.ItemState;
import IBasketItem = MyApp.Components.Basket.IBasketItem;
import GameBaskets = MyApp.Components.Basket.GameBaskets;

@inject(UiContext, BasketService)
export class ContentViewModel<TContent extends IContent> extends ViewModel {
  basket: GameBaskets;
  model: TContent;
  icon: string;
  path: string;
  image: string;
  gameName: string;
  time: Date;
  gameInfo: GameClientInfo;

  isInstalledObservable;
  isNotInstalledObservable;
  canExecuteObservable;

  constructor(ui: UiContext, protected basketService: BasketService) {
    super(ui);
  }

  async activate(model: TContent) {
		this.basket = this.basketService.basketService.getGameBaskets(model.gameId); // hack
		this.model = model;
		this.path = this.getPath();
		this.image = this.getImage();
		this.gameName = this.model.gameSlug.replace("-", " ");
		this.time = new Date(); // TODO

    this.gameInfo = await this.basketService.getGameInfo(this.model.gameId); // hack

    this.canExecuteObservable = this.gameInfo.observe("canExecute");
    this.isInstalledObservable = this.observe("isInstalled");
    this.isNotInstalledObservable = this.observe("isNotInstalled");

    this.subscriptions.subd(d => {
      d(this.uninstall = uiCommand2("Uninstall", async () => {
        Tk.Debug.info("$$$ uninstall menuEntry");
        this.emitGameChanged();
        if (confirm("Are you sure you want to uninstall this content?")) {
          await new UninstallContent(this.model.gameId, this.model.id).handle(this.mediator)
        }
      }, {
          isVisibleObservable: this.isInstalledObservable,
          canExecuteObservable: this.canExecuteObservable,
          icon: "withSIX-icon-Square-X"
        }));

        // TODO: Install, or Update
      d(this.install = uiCommand2("", async() => {
        this.emitGameChanged();
        await this.basket.selectContentItem(this.toBasketInfo(), this.basketService.clientInfos[this.model.gameId].clientInfo);
        //await new InstallContent(this.model.gameId, { id: this.model.id }).handle(this.mediator);
      }, {
        isVisibleObservable: this.isNotInstalledObservable,
        canExecuteObservable: this.canExecuteObservable,
        icon: "content-state-icon",
        textCls: "content-state-text" // TODO
      }));

      d(this.launch = uiCommand2("LAUNCH", async () => {
        Tk.Debug.info("$$$ launch menuEntry");
        this.emitGameChanged();
        this.basket.selectOnlyContentItem(this.toBasketInfo());
        await new LaunchContent(this.model.gameId, this.model.id)
        .handle(this.mediator)
      }, {
          isVisibleObservable: this.isInstalledObservable,
          canExecuteObservable: this.canExecuteObservable,
          icon: "content-state-icon" // TODO
        }));

        d(this.observe("hasUpdateAvailable").subscribe(x => this.install.name = x ? "Update" : "Install"))
    });

		this.setupMenuItems();
	}

  emitGameChanged() {
    this.eventBus.publish("gameChanged", {id: this.model.gameId, slug: this.model.gameSlug}); // incase we are on Home..
  }

  toBasketInfo(): IBasketItem {
    return {
        id: this.model.id, packageName: this.model.packageName,
        gameId: this.model.gameId,
        itemType: BasketItemType.Mod,
        author: this.model.author || "N/A",
        image: this.model.image,
        name: this.model.name,
        sizePacked: this.model.sizePacked
    }
  }

  install: () => Promise<void>;
  uninstall: () => Promise<void>;
  launch: () => Promise<void>;

	setupMenuItems() {
	  if (!this.model.disableActions)
	    this.topActions.push(new MenuItem(this.addToBasket, { name: "", icon: "content-basketable-icon", textCls: "content-basketable-text", cls: "margin-fix content-basketable-button" }))
			// TODO: instead of accessing the bsket here, we should just have a variable, and perhaps event monitoring instead?

	  this.bottomActions.push(new MenuItem(this.install));
	  this.bottomActions.push(new MenuItem(this.launch));
	  this.bottomMenuActions.push(new MenuItem(this.uninstall));
	}

	get isInstalled() { return this.state != null };
  get hasUpdateAvailable() { return this.state != null && this.state.state == ItemState.UpdateAvailable }
  // Is really 'not uptodate'
	get isNotInstalled() { return this.state == null || this.state.state != ItemState.Uptodate };

	get state() {
	  if (this.gameInfo == null)
	    return null;
	  return this.gameInfo.clientInfo.content[this.model.id];
	}

	addToBasket = uiCommand2("toggle in playlist", async () => this.basketService.basketService.addToBasket(this.model.gameId, this.toBasketInfo()));

	get versionInfo() {
	  if (this.state && this.state.version) return this.state.version == this.model.version ? this.model.version : `${this.state.version} / ${this.model.version}`;
	  return this.model.version;
	}

	getPath() {
	  var slug = this.model.name ? this.model.name.sluggify() : null;
	  var path = `${this.model.gameSlug}/${this.model.type}s/${this.model.id.toShortId() }`;
	  return slug ? path + "/" + slug : path;
	}

  // TODO: Lazy/cached?
  defaultAssetUrl = this.w6.url.getAssetUrl("img/noimage.png");
  defaultBackUrl = this.w6.url.getAssetUrl('img/play.withSIX/games/stream-bg.jpg');
	getImage() { return this.model.image || this.defaultAssetUrl; }
	get canAddToBasket() { return this.basket.active.model.isTemporary; }
	get isInBasket() { return this.basket.active.content.indexOf(this.model.id) != -1; }

	toggleFavorite = () => this.model.isFavorite
	  ? new UnFavoriteContent(this.model.id).handle(this.mediator)
	  : new FavoriteContent(this.model.id).handle(this.mediator);

	addTo() { this.alert("TODO"); }

	get itemStateClass() { return this.basketService.getItemStateClass(this.model.id, this.model.gameId); }

	topActions = []
	topMenuActions = [
			// new MenuItem("Toggle Favorite", this.toggleFavorite, {
	  // icon: "withSIX-icon-Square-X" // TODO
			// })
	]
	bottomActions = []
	bottomMenuActions = []
}

export enum TypeScope {
  Local,
  Subscribed,
  Published
}

export class ContentDeleted {
  constructor(public id: string) {}
}

export interface IContent {
  id: string;
  gameId: string;
  gameSlug: string;
  name: string;
  packageName?: string;
  slug: string;
  type: string;
  isFavorite?: boolean;
  author: string;
  authorSlug?: string;
  image: string;
  version?: string;
  disableActions?: boolean;
  sizePacked?: number;
}

export class LaunchContent extends VoidCommand {
  constructor(public gameId: string, public id: string) {
    super();
    Tk.Debug.info("$$$ launchContent");
  }
}

@handlerFor(LaunchContent)
class LaunchContentHandler extends DbClientQuery<LaunchContent, void> {
  public handle(request: LaunchContent): Promise<void> {
    Tk.Debug.info("$$$ launchContentHandler");
    return this.modInfoService.launchContent({ gameId: request.gameId, content: { id: request.id } });
  }
}

export class FavoriteContent extends VoidCommand {
  constructor(public id: string) { super(); }
}

@handlerFor(FavoriteContent)
class FavoriteContentHandler extends DbQuery<FavoriteContent, void> {
  public async handle(request: FavoriteContent) {
}
}

export class UnFavoriteContent extends VoidCommand {
  constructor(public id: string) { super(); }
}

@handlerFor(UnFavoriteContent)
class UnFavoriteContentHandler extends DbQuery<UnFavoriteContent, void> {
  public async handle(request: UnFavoriteContent) {
}
}

export class InstallContent extends VoidCommand {
  constructor(public gameId: string, public content: MyApp.Components.ModInfo.IContentGuidSpec) { super(); }
}

@handlerFor(InstallContent)
class InstallContentHandler extends DbClientQuery<InstallContent, void> {
  public handle(request: InstallContent) {
    if (request.content.isOnlineCollection)
      return this.modInfoService.installCollection(request);
    else
      return this.modInfoService.installContent(request);
  }
}

export class InstallContents extends VoidCommand {
  constructor(public gameId: string, public contents: MyApp.Components.ModInfo.IContentGuidSpec[], public name?: string) { super(); }
}

@handlerFor(InstallContents)
class InstallContentsHandler extends DbClientQuery<InstallContents, void> {
  public handle(request: InstallContents) {
    return this.modInfoService.installContents(request);
  }
}

export class UninstallContent extends VoidCommand {
  constructor(public gameId: string, public id: string) {
    super();
    Tk.Debug.info("$$$ uninstallContent");
  }
}

@handlerFor(UninstallContent)
class UninstallContentHandler extends DbClientQuery<UninstallContent, void> {
  public async handle(request: UninstallContent) {
    Tk.Debug.info("$$$ uninstallContentHandler");
    await this.modInfoService.uninstallContent({ gameId: request.gameId, content: { id: request.id } });
    this.context.eventBus.publish(new ContentDeleted(request.id));
  }
}

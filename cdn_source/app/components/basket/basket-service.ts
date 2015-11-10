module MyApp.Components.Basket {

    function guid(): string {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }

        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
    }

    export enum BasketItemType {
      Mod,
      Mission,
      Collection,
    }

    export interface IBasketItem {
        id: string;
        name: string;
        packageName: string;
        image: string;
        author: string;
        itemType: BasketItemType;
        constraint?: string;
        isOnlineCollection?: boolean;
        gameId: string;
        sizePacked: number;
    }

    export interface IBasketCollection {
        id: string;
        gameId: string;
        name: string;
        state: BasketState;
        items: IBasketItem[];
        isPersistent: boolean;
        isTemporary: boolean;
        basketType: BasketType;
    }

    export interface IBasketModel {
        collections: IBasketCollection[];
        activeId: string;
        activeDirect: IBasketCollection;
    }

    export interface IBaskets {
        gameBaskets: _Indexer<IBasketModel>;
        expanded: boolean;
    }

    export enum BasketState {
        Unknown=0,
        Install=1,
        Syncing=2,
        Update=3,
        Play=4
    }
    export enum BasketType {
        Default = 0,
        SingleItem = 1,
        SingleCollection = 2,
    }

    export interface IBasketSettings {
        forceBasketInstallMessageHidden: boolean;
        hasConnected: boolean;
    }
    export interface IBasketScope extends ng.IScope {
        settings: IBasketSettings;
        baskets: IBaskets;
    }

    var service: BasketService = null;
    var logger: Logger.ToastLogger = null;
    var setupError: boolean = false;
    export class BasketService extends Tk.Service {
        static $name = "basketService";
        static $inject = ['localStorageService', 'logger', '$rootScope', 'modInfoService', 'dbContext'];
        private baskets: IBaskets;
        private scope: IBasketScope;
        public settings: IBasketSettings;
        private constructedBaskets: _Indexer<GameBaskets> = {};

        constructor(localStorage: angular.local.storage.ILocalStorageService, loggera: Logger.ToastLogger, root: IRootScope, private modInfo: ModInfo.ModInfoService, private context: W6Context) {
            super();
            service = this;
            logger = loggera;
            this.scope = <any>root.$new(true);

            this.setupBindings(localStorage);

            this.setDefaults();
        }

        private setDefaults() {
            if (this.baskets.expanded == null) {
                this.baskets.expanded = false;
            }
            if (this.settings.hasConnected == null) {
                this.settings.hasConnected = false;
            }
        }

        private createLocalBaskets(): IBaskets {
            return {
                gameBaskets: {},
                expanded: true
            };
        }

        addToBasket(gameId: string, item: IBasketItem) {
            this.expand();
            var baskets = this.getGameBaskets(gameId);
            baskets.active.toggleInBasket(angular.extend({gameId: gameId}, item));
        }

        getGameBaskets(gameId: string): GameBaskets {
            if (this.constructedBaskets[gameId] == null) {
                if (this.baskets.gameBaskets[gameId] == null) {
                    this.baskets.gameBaskets[gameId] = {
                        activeId: null,
                        activeDirect: null,
                        collections: []
                    };
                }
                var basketModel = this.baskets.gameBaskets[gameId];

                try {
                    var i = basketModel.collections.length;
                } catch (e) {
                    logger.error("A Game Basket Group was damaged and had to be reset", "Error Loading Game Baskets");
                    delete this.baskets.gameBaskets[gameId];

                    return this.getGameBaskets(gameId);
                }

                this.constructedBaskets[gameId] = new GameBaskets(gameId, basketModel, this.context);
            }
            return this.constructedBaskets[gameId];
        }

        isExpanded(): boolean {
            return this.baskets.expanded;
        }

        toggleExpansion(): boolean {
            this.baskets.expanded = !this.baskets.expanded;
            return this.baskets.expanded;
        }

        launchBasket(basket: Basket) {
            return this.modInfo.launchContents(this.basketToCommandData(basket));
        }

        installBasket(basket: Basket) {
            if (basket.model.basketType === BasketType.SingleCollection) {
                return this.modInfo.installCollection(this.basketToCommandDataForSingleCollection(basket));
            } else {
                return this.modInfo.installContents(this.basketToCommandData(basket));
            }
        }

        playBasket(basket: Basket) {
            return this.modInfo.launchContents(this.basketToCommandData(basket));
        }

        private basketToCommandData(basket: Basket): ModInfo.IContentsBase {
            var content: ModInfo.IContentGuidSpec[] = [];
            for (var i = 0; i < basket.model.items.length; i++) {
                var item = basket.model.items[i];

                content.push({ id: item.id, isOnlineCollection: item.isOnlineCollection, constraint: item.constraint });
            }
            return {
                gameId: basket.model.gameId,
                name: basket.model.name,
                contents: content
            };
        }
        private basketToCommandDataForSingleCollection(basket: Basket): ModInfo.IContentBase {
            var item = basket.model.items[0];
            return {
                gameId: basket.model.gameId,
                content: { id: item.id, isOnlineCollection: item.isOnlineCollection, constraint: item.constraint }
            };
        }

        expand() { this.baskets.expanded = true; }

        private setupBinding<TModel>(localStorage: angular.local.storage.ILocalStorageService, key: string, setFunc: () => TModel, testFunc: (model: TModel) => boolean) {
            if (localStorage.keys().indexOf(key) == -1) {
                localStorage.set(key, setFunc());
            } else {
                try {
                    var model = localStorage.get<TModel>(key);
                    if (!testFunc(model))
                        throw new Error("Failed Model Test");
                } catch (e) {
                    localStorage.remove(key);
                    logger.error("Some of your settings were damaged and have been reset to prevent errors.", "Error Loading Status Bar");
                    this.setupBinding(localStorage, key, setFunc, testFunc);
                    return;
                }
            }
            localStorage.bind(this.scope, key);
        }

        private setupBindings(localStorage: angular.local.storage.ILocalStorageService) {
            this.setupBinding(localStorage, "baskets",() => this.createLocalBaskets(),(model) => {
                // ReSharper disable once RedundantComparisonWithBoolean
                // Being Explicit
                if ((model.expanded !== true && model.expanded !== false) && model.expanded != null)
                    return false;

                if (model.gameBaskets === null || typeof model.gameBaskets !== 'object')
                    return false;
                return true;
            });
            this.setupBinding(localStorage, "settings",() => <IBasketSettings>{
                forceBasketInstallMessageHidden: true,
                hasConnected: false
            },(model) => {
                // ReSharper disable once RedundantComparisonWithBoolean
                // Being Explicit
                    if ((model.forceBasketInstallMessageHidden !== true && model.forceBasketInstallMessageHidden !== false) && model.forceBasketInstallMessageHidden != null)
                        return false;
                    return true;
                });

            this.baskets = this.scope.baskets;
            this.settings = this.scope.settings;
        }
    }

    registerService(BasketService);

    export class GameBaskets {
        baskets: Basket[] = [];
        active: Basket = null;
        activeDirect: Basket = null;

        constructor(private gameId: string, private model: IBasketModel, private context: W6Context) {
            this.setDefaults();
            var failed: number[] = [];
            for (var i = 0; i < model.collections.length; i++) {
                try {
                  var m = model.collections[i];
                  if (m.name == 'Unsaved playlist') m.name = 'Playlist';
                    var basket = new Basket(m);
                    this.baskets.push(basket);
                } catch (e) {
                    logger.error("A Basket was damaged and had to be removed", "Error Loading Basket");
                    failed.push(i);
                }
            }

            for (var j = 0; j < failed.length; j++) {
                model.collections.splice(failed.pop(), 1);
            }

            this.prepareActive();
            this.prepareSelected();
        }

        private setDefaults() {
        }

        private getBasketFromModel(model: IBasketCollection): Basket {
            var basket = this.getBasketFromId(model.id);
            if (basket != null)
                return basket;
            var nBasket = new Basket(model);
            this.baskets.push(nBasket);
            return nBasket;
        }

        private getBasketFromId(id: string): Basket {
            for (var i = 0; i < this.baskets.length; i++) {
                var basket = this.baskets[i];
                if (basket.model.id === id)
                    return basket;
            }
            return null;
        }

        private prepareActive() {
            if (this.model.collections.length === 0) {
                this.setActiveBasket(this.createNewBasket());
                return;
            }
            if (this.model.activeId == null) {
                this.setActiveBasket(this.getBasketFromModel(this.model.collections[0]));
                return;
            }
            if (this.model.activeId != null && this.active == null) {
                var basket = this.getBasketFromId(this.model.activeId);

                if (basket == null) {
                    this.model.activeId = null;
                    this.prepareActive();
                } else {
                    this.setActiveBasket(basket);
                }
                return;
            }
        }

        private getNewBasketModel(): IBasketCollection {
            return <IBasketCollection>{
                id: guid(),
                gameId: this.gameId,
                name: "Playlist",
                items: [], // this.getDtData();
                isPersistent: false,
                isTemporary: false,
                state: BasketState.Unknown,
                basketType: BasketType.Default
            };
        }

        private getSelectedItemBasket(): Basket {
            //Delete old Basket
            for (var i = 0; i < this.baskets.length; i++) {
                var basket = this.baskets[i];
                if (basket.model.isTemporary)
                    this.deleteBasket(basket);
            }
            //Create New Basket
            var model = this.getNewBasketModel();
            model.isTemporary = true;
            model.name = "Selected Item";
            model.basketType = BasketType.SingleItem;
            return this.createNewBasketInner(model);
        }

        createNewBasket(): Basket {
            return this.createNewBasketInner(this.getNewBasketModel());
        }

        private createNewBasketInner(model: IBasketCollection): Basket {
            this.model.collections.push(model);
            var basket = new Basket(model);
            //this.baskets.push(basket);
            return basket;
        }

        deleteBasket(basket: Basket) {
            this.deleteBasketInternal(basket);
            this.prepareActive();
        }

        private deleteBasketInternal(basket: Basket) {
            this.baskets.splice(this.baskets.indexOf(basket), 1);
            this.model.collections.splice(this.model.collections.indexOf(basket.model), 1);
            this.model.activeId = null;
        }

        setActiveBasket(basket: Basket) {
            if (this.active != null && this.active.model.isTemporary && this.active != basket) {
                this.deleteBasketInternal(this.active);
            }
            if (basket != null) {
                this.active = basket;
                this.model.activeId = basket.model.id;
            }
        }

        selectOnlyContentItem(item: IBasketItem, isCollection: boolean = false) {
            var basket: Basket = null;
            try {
                basket = this.getSelectedItemBasket();
                basket.model.name = item.name;
                if (isCollection) basket.model.basketType = BasketType.SingleCollection;
                basket.addToBasket(item);
            } catch (e) {
                logger.error("Failed to use this item", "Unknown Error");
                this.deleteSelected();
                throw e;
            }

            this.model.activeDirect = basket.model;
            this.activeDirect = basket;
          }

        subscribeCollection(collectionId: string) {
          // TODO: Make this a proper usecase split instead
          // TODO: Only subscribe if not already subscribed
          return this.context.postCustom("collections/" + collectionId + "/subscribe");
        }

        selectContentItem(item: IBasketItem, clientInfo: MyApp.Components.ModInfo.IClientInfo, isCollection: boolean = false) {
            if (clientInfo.globalLock || clientInfo.gameLock)
              throw new Error("Currently busy");
            this.selectOnlyContentItem(item, isCollection);
            if (isCollection) this.subscribeCollection(item.id);
            try {
                switch (this.activeDirect.getState(clientInfo)) {
                    case Components.Basket.BasketState.Unknown:
                        return this.activeDirect.play();
                        break;
                    case Components.Basket.BasketState.Install:
                        return this.activeDirect.install();
                        break;
                    case Components.Basket.BasketState.Play:
                        return this.activeDirect.play();
                        break;
                    case Components.Basket.BasketState.Syncing:
                        return this.activeDirect.play();
                        break;
                    case Components.Basket.BasketState.Update:
                        return this.activeDirect.install();
                        break;
                    default:
                        return this.activeDirect.play();
                        break;
                }
            } catch (e) {
                logger.error("Failed to use this item", "Unknown Error");
                throw e;
            }
        }

        makeActiveSelected() {
            this.model.activeDirect = null;
            this.activeDirect = this.active;

        }

        removeActiveDirect() {
            this.model.activeDirect = null;
            this.activeDirect = null;
        }

        prepareSelected() {
            if (this.model.activeDirect != null) {
                try {
                    var basket = new Basket(this.model.activeDirect);
                    this.activeDirect = basket;
                } catch (e) {
                    this.deleteSelected();
                }

            }
        }

        private deleteSelected() {
            this.model.activeDirect = null;
            this.activeDirect = null;
        }
    }

    export class Basket {
        public content: string[] = [];
        public chain = new Map<string, IBasketItem>();

        constructor(public model: IBasketCollection) {
            this.setDefaults();
            for (var i = 0; i < model.items.length; i++) {
                this.content.push(model.items[i].id);
            }
        }

        private setDefaults() {
            if (this.model.state == null) {
                this.model.state = BasketState.Unknown;
            }
            if (this.model.basketType == null) {
                this.model.basketType = BasketType.Default;
            }
        }

        getState(clientInfo: Components.ModInfo.IClientInfo): BasketState {
            if (this.model.items.length == 0)
                return BasketState.Play;
            for (var i = 0; i < this.model.items.length; i++) {
                var item = this.model.items[i];
                var rItem = clientInfo.content[item.id];
                if (rItem == null)
                    return BasketState.Install;
                if (rItem.state == ModInfo.ItemState.UpdateAvailable)
                    return BasketState.Update;
                if (item.constraint && rItem.version != item.constraint)
                  return BasketState.Update;
            }
            return BasketState.Play;
        }

        getItem(id: string): IBasketItem {
            for (var i = 0; i < this.model.items.length; i++) {
                var item = this.model.items[i];
                if (item.id === id)
                    return item;
            }
            return null;
        }

        removeFromBasket(item: IBasketItem) {
            if (this.model.isTemporary)
                return;
            Tools.removeEl(this.model.items, this.getItem(item.id));
            Tools.removeEl(this.content, item.id);
        }

        addToBasket(item: IBasketItem) {
            if (this.getItem(item.id) != null)
                return;
            if (this.model.isTemporary && this.model.items.length !== 0)
                return;
            this.model.items.push(item);
            this.content.push(item.id);
        }

        toggleInBasket(item: IBasketItem) {
            Debug.log(item);
            if (this.getItem(item.id) != null) {
                this.removeFromBasket(item);
                return;
            }
            this.addToBasket(item);
        }

        clearBasket() {
            this.model.items = [];
            this.content = [];
            this.chain = new Map<string, any>();
        }

        launch() {
            return service.launchBasket(this);
        }

        install() {
            return service.installBasket(this);
        }

        play() {
            return service.playBasket(this);
        }
    }
}

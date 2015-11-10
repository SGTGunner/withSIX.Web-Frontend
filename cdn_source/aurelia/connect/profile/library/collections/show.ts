import {IFindModel, FindModel, UiContext,Multi,Base,ObservableFromSubscribable,bindingEngine,uiCommand2,Subscriptions, ReactiveList, Debouncer, ObserveAll, ListFactory, ViewModel, ITypeahead, IFilter, ISort, Filters, ViewType, Mediator, Query, DbQuery, handlerFor, VoidCommand} from '../../../../framework';
import {inject} from 'aurelia-framework';
import {EventAggregator} from 'aurelia-event-aggregator';
import {IShowDependency, RemoveDependencyEvent, CollectionScope, PreferredClient} from '../../lib';

interface IFindDependency {
  id?: string, name: string, packageName?: string, avatar?: string, avatarUpdatedAt?: Date
}

@inject(UiContext)
export class Show extends ViewModel {
  //changedObservable: ObservableFromSubscribable<boolean> = new ObservableFromSubscribable<boolean>(this.observe("changed"));
  CollectionScope = CollectionScope;
  PreferredClient = PreferredClient;
  scopes = [CollectionScope.Public, CollectionScope.Unlisted, CollectionScope.Private];
  clients = [PreferredClient.Default, PreferredClient.Sync, PreferredClient.PlayWithSix];
  menuItems = [];
  rxList: ReactiveList<IShowDependency>;
  rxList2: ReactiveList<IServer>;
  model: ICollectionData;
  addContentModel: IFindModel<IFindDependency>;
  sort: ISort<IShowDependency>[] = [{ name: "name" }]
  searchFields = ["name"];
  viewType = ViewType.Card;
  filters: IFilter<IShowDependency>[] = [];
  typeahead: ITypeahead<IShowDependency>;
  filteredComponent: Filters<IShowDependency>;
  searchInputPlaceholder = "type name...";
  availableViewTypes: ViewType[];
  current: Subscriptions;
  shortId: string;
  get items() { return this.model.items; }
  get servers() { return this.model.servers; }

  _changed = false;

  get changed() { return this._changed || (window.w6Cheat.collection && window.w6Cheat.collection.hasChangesFromAurelia()); }
  set changed(value) { this._changed = value; }

  constructor(ui: UiContext) {
    super(ui);
    this.availableViewTypes = [ViewType.Card];
    if (ui.w6.url.environment != Tk.Environment.Production)
      this.availableViewTypes.push(ViewType.List);

    this.subscriptions.subd(d => {
      //d(this.changedObservable);
      d(this.save);
      d(this.cancel);
      d(this.refreshRepo);
    });
  }

  async activate(params, routeConfig) {
    this.shortId = params.id;
    await this.setupModel();

    var debouncer = Debouncer.debouncePromise<IFindDependency[]>(async (q) => {
      var data = await new SearchQuery(q, this.model.gameId).handle(this.mediator)
      data.forEach(d =>  {
        Object.defineProperty(d, 'selected', {get: () => !this.shouldShowItemButton(d) });
      });
      return data;
    }, 250);
    this.subscriptions.subd(d => {
      d(this.current);
      d(this.eventBus.subscribe(RemoveDependencyEvent, x => this.removeDependency(x.model)));
      d(this.addContentModel = new FindModel(q => debouncer(q), this.add, i => i.packageName));
    });
  }

  canDeactivate() {
    if (!this._changed) return true;
    this.openChanges();
    return false;
  }

  shouldShowItemButton = (item: IFindDependency) => !this.containsDependency(item.packageName);

  save = uiCommand2("Save", async () => {
    //await Base.delay(5000);
    await new Save(this.model).handle(this.mediator);
    this.changed = false;
    //try {
      await window.w6Cheat.collection.saveFromAurelia();
    //} catch (err) {
      // for crying out loud!
      //this.router.navigate(window.location.pathname.replace("/content/edit", ""));
      //throw err;
    //}
  }, {
    canExecuteObservable: this.observe("changed"),
    cls: "ok"
  }) // , this.changedObservable

  cancel = uiCommand2("Cancel", async () => {
    await this.resetup();
    this.changed = false;
    window.w6Cheat.collection.cancelFromAurelia();
  }, {
    canExecuteObservable: new Multi([this.observe("changed"), Base.observe(this.save, 'isExecuting')], (x, y) => x && !y), // this.changedObservable.combineLatest(<Rx.Observable<boolean>>(<any>this.save).isExecutingObservable, (x, y) => x && !y)
    cls: "cancel"
  })
  // TODO: have to dispose the Multi?

  disableEditMode = uiCommand2("Close Editor", async () => {
    if (this.changed)
      this.openChanges();
    else {
      window.w6Cheat.collection.disableEditModeFromAurelia();
    }
  })

  enableEditMode = uiCommand2("Open Editor", async () => {
    window.w6Cheat.collection.enableEditModeFromAurelia();
  });

  async resetup() {
    var current = this.current;
    // TODO: wouldn't it be easier to just revisit the URL and refresh somehow?
    await this.setupModel();
    current.dispose();
  }

  async setupModel() {
    this.model = await new GetCollection(this.shortId).handle(this.mediator);
    this.current = new Subscriptions();
    this.current.subd(d => {
      d(this.rxList = this.listFactory.getList(this.items));
      d(this.rxList2 = this.listFactory.getList(this.servers));
      d(this.rxList.modified.subscribe(x => this.changed = true))
      d(this.rxList2.modified.subscribe(x => this.changed = true))
      d(this.listFactory.getObserveAll<ICollectionData>().observeItemInternal(this.model, () => this.changed = true));
    });
  }

  refreshRepo = uiCommand2("Refresh Repo", async () => {
    await new RefreshRepo(this.model.id).handle(this.mediator);
    await this.resetup();
  }, {canExecuteObservable: new Multi([this.observe("changed")], x => !x)}); // TODO: Monitor also this.model.repositories, but we have to swap when we refresh the model :S

  containsDependency = (dependency: string) => this.items.asEnumerable().any(x => x.dependency.equalsIgnoreCase(dependency));

  add = (i: IFindDependency) => {
    let dependency = (i && i.packageName) || this.addContentModel.searchItem;
    // TODO; allow specify version and branching directly
    if (!dependency || this.containsDependency(dependency)) return;

    let item = <IShowDependency>{ dependency: dependency, id: null, type: "dependency", isRequired: true, constraint: null };
    let s = this.addContentModel.selectedItem;
    // TODO: unclusterfuck :)
    let selectedContent = i || (s && this.addContentModel.searchItem == s.packageName && s);
    if (selectedContent) {
      item.image = this.w6.url.getContentAvatarUrl(selectedContent.avatar, selectedContent.avatarUpdatedAt);
      item.name = selectedContent.name;
    }
    this.items.push(item);
  }

  removeDependency(model: IShowDependency) { Tools.removeEl(this.items, model); }
}

interface IServer {
  address: string;
  password: string;
}

interface ICollectionData {
  id: string;
  name: string;
  gameId: string;
  items: IShowDependency[];
  servers: IServer[];
  repositories: string;
  scope: CollectionScope;
  updatedAt: Date;
  preferredClient: PreferredClient;
}

class GetCollection extends Query<ICollectionData> {
  constructor(public collectionId: string) { super(); }
}

@handlerFor(GetCollection)
class GetCollectionHandler extends DbQuery<GetCollection, ICollectionData> {
  async handle(request: GetCollection): Promise<ICollectionData> {

    var col = await this.executeKeyQuery<MyApp.IBreezeCollection>(
      () => this.getEntityQueryFromShortId("Collection", request.collectionId)
        .withParameters({ id: Tools.fromShortId(request.collectionId) }));
    var ver = await this.context.getCustom<MyApp.IBreezeCollectionVersion>("collectionversions/" + col.latestVersionId);
    var items = ver.data.dependencies.asEnumerable()
      .select(x => {
      var availableVersions = (<any>x).availableVersions;
      var dep = <IShowDependency>{ dependency: x.dependency, type: "dependency", id: x.id, constraint: x.constraint, isRequired: x.isRequired, availableVersions: availableVersions, name: (<any>x).name };
      var dx = (<any>x);
      if (dx.avatar)
        dep.image = this.context.w6.url.getContentAvatarUrl(dx.avatar, dx.avatarUpdatedAt);
      return dep;
    }).toArray();
    var server = ver.data.servers ? ver.data.servers.asEnumerable().firstOrDefault() : null;
    var s = server ? { address: server.address, password: server.password } : { address: "", password: "" };

    return { id: col.id, name: col.name, gameId: col.gameId, items: items, servers: [s], repositories: ver.data.repositories || "", scope: CollectionScope[col.scope], updatedAt: col.updatedAt, preferredClient: PreferredClient[col.preferredClient] };
  }
}

class Save extends VoidCommand {
  constructor(public model: ICollectionData) { super() }
}

@handlerFor(Save)
class SaveHandler extends DbQuery<Save, void> {
  async handle(request: Save) {
    var servers = [];
    var repositories = [];
    if (request.model.repositories)
      repositories = repositories.concat(request.model.repositories.split(";"));
    if (request.model.servers[0].address)
      servers.push(request.model.servers[0]);
    await this.context.postCustom("collections/" + request.model.id, {
      scope: request.model.scope,
      dependencies: request.model.items,
      servers: servers,
      repositories: repositories,
      preferredClient: request.model.preferredClient
    })
  }
}

class SearchQuery extends Query<IFindDependency[]> {
  constructor(public query: string, public gameId: string) { super(); }
}

@handlerFor(SearchQuery)
class SearchQueryHandler extends DbQuery<SearchQuery, IFindDependency[]> {
  async handle(request: SearchQuery): Promise<IFindDependency[]> {
    Tk.Debug.log("getting mods by game: " + request.gameId + ", " + request.query);

    var op = this.context.getOpByKeyLength(request.query);
    var key = request.query.toLowerCase();

    var query = breeze.EntityQuery.from("Mods")
      .where(new breeze.Predicate("game.id", breeze.FilterQueryOp.Equals, request.gameId).and(
      new breeze.Predicate("toLower(packageName)", op, key)
        .or(new breeze.Predicate("toLower(name)", op, key))))
      .orderBy("packageName")
      .select(["packageName", "name", "id", "avatar", "avatarUpdatedAt"])
      .take(this.context.defaultTakeTag);

    var r = await this.context.executeQuery<MyApp.IBreezeMod>(query)
    return r.results.asEnumerable().toArray();
  }
}


class RefreshRepo extends VoidCommand {
  constructor(public id: string) { super(); }
}

@handlerFor(RefreshRepo)
class RefreshRepoHandler extends DbQuery<RefreshRepo, void> {
  async handle(request: RefreshRepo) {
    await this.context.postCustom("collections/" + request.id + "/refresh-repo");
  }
}

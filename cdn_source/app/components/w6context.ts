module MyApp {
  export interface IQueryResult<T extends breeze.Entity> extends breeze.QueryResult {
    results: T[];
  }

  export interface IHttpPromise<T> extends Promise<ng.IHttpPromiseCallbackArg<T>> {
    success(callback: ng.IHttpPromiseCallback<T>): IHttpPromise<T>;
    error(callback: ng.IHttpPromiseCallback<any>): IHttpPromise<T>;
    then<TResult>(successCallback: (response: ng.IHttpPromiseCallbackArg<T>) => Promise<TResult> | TResult, errorCallback?: (response: ng.IHttpPromiseCallbackArg<any>) => any): Promise<TResult>;
  }

  export interface IRequestShortcutConfig extends ng.IRequestShortcutConfig {
    requestName?: string;
    w6Request?: boolean;
  }

  // TODO: No longer inherit from this, but use the executeQuery etc methods directly as exampled in GetModQuery
  export class W6Context extends Tk.Service {
    static $name = 'dbContext';
    static $inject = [
      '$http', '$q', '$timeout', 'breeze',
      'logger', 'options', 'userInfo', 'loadingStatusInterceptor', 'promiseCache', 'w6', 'aur.eventBus'
    ];
    public static minFilterLength = 2;
    public loggedIn: boolean;
    public manager: breeze.EntityManager;

    public filterPrefixes = ["user:", "tag:"];
    public defaultTakeTag = 6;

    public nextBreezeRequestName: string;

    constructor(public $http: ng.IHttpService, public $q: ng.IQService, public $timeout, public breeze,
      public logger: Components.Logger.ToastLogger, public options, public userInfo, loadingInterceptor: Components.LoadingStatusInterceptor.LoadingStatusInterceptor, private promiseCache, public w6: W6, public eventBus: IEventBus) {
      super();

      breeze.DataType.parseDateFromServer = function(source) {
        var date = moment(source);
        return date.toDate();
      };

      breeze.NamingConvention.camelCase.setAsDefault();
      this.serviceName = options.serviceName;
      var ajaxAdapter = breeze.config.getAdapterInstance('ajax');
      ajaxAdapter.defaultSettings.requestName = 'breezeRequest';

      ajaxAdapter.requestInterceptor = (requestInfo) => {
        if (this.nextBreezeRequestName) {
          requestInfo.config.requestName = this.nextBreezeRequestName;
          this.nextBreezeRequestName = undefined;
        }

        loadingInterceptor.startedBreeze(requestInfo);

        // using angular global intercepter again atm...
        /*
        var currentSuccess = requestInfo.success;
        requestInfo.success = (info) => {
            currentSuccess(info);
            this.ended();
        };

        var currentError = requestInfo.error;
        requestInfo.error = (info) => {
            currentError(info);
            this.ended();
        }
        */
      };
      this.fetchMetadata();
      this.loggedIn = userInfo.id != null;
      this.userSlugCache = {};
      this.emailExistsCache = {};
      this.usernameExistsCache = {};
    }

    public getEntityKeyFromShortId(type: string, shortId: string): breeze.EntityKey {
      return this.getEntityKey(type, Tools.fromShortId(shortId));
    }

    public getEntityKey(type: string, id: string): breeze.EntityKey {
      var t = <breeze.EntityType>this.manager.metadataStore.getEntityType(type);
      return new breeze.EntityKey(t, id);
    }

    public getUrl(path) {
      return Tools.uriHasProtocol(path) || path.startsWith("/") ? path : this.w6.url.api + "/" + path;
    }

    public getMd(subPath) {
      return this.getCustom<string>(this.w6.url.getSerialUrl("docs/" + subPath))
        .then(result => result.data);
    }

    public getCdnMd(subPath: string) {
      return this.getCustom<string>(this.w6.url.docsCdn + "/software/withSIX/drop/docs/" + subPath) //  + (subPath.includes('?') ? '&' : '?') + "site=" + this.w6.url.site
        .then(result => result.data);
    }

    // TODO: We should check for the latest commit or tag on github, every minute or so, and then use that commit SHA
    public async getDocMd(subPath, addTag = false) {
      var path = 'docs/' + subPath;
      var latestCommit = await this.getLatestCommit(path);
      return await this.getCustom<string>('https://cdn.rawgit.com/SIXNetworks/withsix-docs/' + latestCommit + '/' + path)
        .then(result => result.data);
    }

    async getLatestCommit(path, repo = 'SIXNetworks/withsix-docs') {
      // TODO: cache per repo for on minute? (promisecache)
      var commits = await this.getCustom('https://api.github.com/repos/' + repo + '/commits?path=' + path);
      return commits.data[0].sha;
    }

    getTimeTag(minuteGranulary = 5) {
      var d = new Date();
      return `${d.getUTCFullYear()}${d.getUTCMonth()}${d.getUTCDay()}${d.getUTCHours()}${Math.round(d.getUTCMinutes() / minuteGranulary)}`
    }

    public getCustom<T>(path, configOverrides?: IRequestShortcutConfig): IHttpPromise<T> {
      return <any> this.$http.get(this.getUrl(path), this.handleOverrides(configOverrides));
    }

    public postCustom<T>(path, data?, configOverrides?: IRequestShortcutConfig) {
      return this.$http.post<T>(this.getUrl(path), data, this.handleOverrides(configOverrides));
    }

    public putCustom<T>(path, data, configOverrides?: IRequestShortcutConfig) {
      return this.$http.put<T>(this.getUrl(path), data, this.handleOverrides(configOverrides));
    }

    public patchCustom<T>(path, data, configOverrides?: IRequestShortcutConfig) {
      return this.$http<T>(Tools.handleOverrides({ url: this.getUrl(path), method: 'PATCH', data: data, w6Request: true }, configOverrides));
    }

    public deleteCustom(path, configOverrides?: IRequestShortcutConfig) {
      return this.$http.delete(this.getUrl(path), this.handleOverrides(configOverrides));
    }

    public postCustomFormData(path, fd, configOverrides?: IRequestShortcutConfig) {
      Debug.log("postCustomFormData", path, fd, configOverrides);
      return this.$http.post(this.getUrl(path), fd, this.handleOverrides(Tools.handleOverrides({
        transformRequest: angular.identity,
        headers: {
          'Content-Type': undefined
        }
      }, configOverrides)));
    }

    private handleOverrides(configOverrides) {
      return Tools.handleOverrides({ w6Request: true }, configOverrides);
    }

    public getFormDataFromFiles(files) {
      var fd = new FormData();
      for (var i in files)
        fd.append('file', files[i]);
      return fd;
    }

    public get<T>(path, params?): IHttpPromise<T> {
      return <any>this.$http.get(this.options.serviceName + '/' + path, <IRequestShortcutConfig>{ params: params, w6Request: true });
    }

    public getOpByKeyLength(key: string): breeze.FilterQueryOpSymbol {
      return key.length > W6Context.minFilterLength ? breeze.FilterQueryOp.Contains : breeze.FilterQueryOp.StartsWith;
    }

    public generateOrderable(sortOptions) {
      var orderable = [];
      var fields = [];
      for (var i = 0; i < sortOptions.fields.length; i++) {
        var field = sortOptions.fields[i];
        if (fields.asEnumerable().contains(field))
          continue;
        fields.push(field);
        if (field == 'author')
          field = 'author.displayName';
        if (sortOptions.directions[i] === "desc")
          field += " desc";
        orderable.push(field);
      }
      return orderable.join(",");
    }

    public applyPaging(query, pagingOptions) {
      var page = parseInt(pagingOptions.currentPage);
      var pageSize = parseInt(pagingOptions.pageSize);
      return query.skip(((page - 1) * pageSize))
        .take(pageSize)
        .inlineCount(true);
    }

    public createEntity(typeName: string, data?: {}) {
      return this.manager.createEntity(typeName, data);
    }

    static splitRx: RegExp = /[^" ]+|("[^"]*")/g;

    public static searchInfo(filterText, skipCheck, types) {
      var lc = filterText.toLowerCase();
      var split = lc.match(W6Context.splitRx);


      var data = { name: [], all: [] };
      for (var i in types) {
        var t = types[i];
        data[t.substring(0, t.length - 1)] = [];
      }

      for (var s in split) {
        var key = split[s].replace(/\"/g, '');
        var found = false;

        for (var i in types) {
          var t = types[i];
          if (key.startsWith(t)) {
            var substring = key.substring(t.length);
            if (skipCheck || substring.length >= this.minFilterLength)
              data[t.substring(0, t.length - 1)].push(substring);
            found = true;
            break;
          }
        }
        if (!found)
          data.name.push(key);
      }

      data.all = data.all.concat(data.name);
      for (var i in types) {
        var t = types[i];
        data.all = data.all.concat(data[t.substring(0, t.length - 1)]);
      }

      return data;
    }

    public buildPreds(query, preds) {
      var pred: breeze.Predicate;
      for (var i in preds) {
        var p = preds[i];
        if (p != undefined)
          pred = pred == null ? p : pred.and(p);
      }

      if (pred == null) return null;

      return query.where(pred);
    }

    public getNameQuery(split: string[]): breeze.Predicate {
      return this.findInField(split, ["name"], undefined);
    }

    public findInField(split: string[], fields: string[], op: breeze.FilterQueryOpSymbol) {
      if (op == null) op = breeze.FilterQueryOp.Contains;

      var pred: breeze.Predicate;
      for (var v in split) {
        var pred2: breeze.Predicate;
        for (var i in fields) {
          var p = new breeze.Predicate("toLower(" + fields[i] + ")", op, split[v]);
          pred2 = pred2 == null ? p : pred2.or(p);
        }
        pred = pred == null ? pred2 : pred.and(pred2);
      }
      return pred;
    }

    public getTagsQuery(split): breeze.Predicate {
      return this.findInField(split, ["tagsInternal"], undefined);
    }

    public getAuthorQuery(split: string[]): breeze.Predicate {
      return this.findInField(split, ["author.displayName"], undefined);
    }

    private hookAuthor(lc: string, predicate, inclAuthor: boolean) {
      if (inclAuthor)
        return this.findInField([lc], ["author.displayName"], undefined);
      return predicate;
    }

    public executeKeyQuery<T extends breeze.Entity>(query: () => breeze.EntityQuery): Promise<IQueryResult<T>> {
      return this.fetchMetadata()
        .then(() => this.executeQuery(query()));
    }

    public executeQuery<T extends breeze.Entity>(query, requestName?): Promise<IQueryResult<T>> {
      Debug.log(["Executing query: ", query, requestName]);
      this.nextBreezeRequestName = requestName;
      // TODO: Extra check to reset the requestName, e.g if query parsing fails or so?
      return this.fetchMetadata()
        .then(() => this.manager.executeQuery(query));
    }

    public executeQueryT<T extends breeze.Entity>(query, requestName?): Promise<IQueryResult<T>> {
      Debug.log(["Executing query: ", query, requestName]);
      this.nextBreezeRequestName = requestName;
      // TODO: Extra check to reset the requestName, e.g if query parsing fails or so?
      return this.fetchMetadata()
        .then(() => this.manager.executeQuery(query));
    }

    public rejectChanges() {
      this.manager.rejectChanges();
    }

    public saveChanges(requestName?, entities?: breeze.Entity[]) {
      if (this.manager.hasChanges()) {
        this.nextBreezeRequestName = requestName;
        return this.manager.saveChanges(entities);
      } else {
        var deferred = this.$q.defer();
        deferred.reject("nothing to save");
        return deferred.promise;
      }
    }

    addUserSlugCache(userSlug: string, id: string): string { return this.userSlugCache[userSlug] = id; }

    getUserSlugCache(userSlug: string): string { return this.userSlugCache[userSlug]; }

    userSlugCache: {};

    addUsernameExistsCache(username: string, value: boolean): boolean { return this.usernameExistsCache[username] = value; }

    getUsernameExistsCache(username: string): boolean { return this.usernameExistsCache[username]; }

    usernameExistsCache: {};

    addEmailExistsCache(email: string, value: boolean): boolean { return this.emailExistsCache[email] = value; }

    getEmailExistsCache(email: string): boolean { return this.emailExistsCache[email]; }

    emailExistsCache: {};

    fetchMetadata() {
      return this.promiseCache({
        promise: () => this.$http.get(this.w6.url.getSerialUrl('data/metadata.json'))
        // TODO: Replace...
          .then(result => this.manager = this.newManager(result.data))
          .then(() => this.registerEndpointMappings(this.manager)),
        key: 'fetchMetadata',
        ttl: -1 // Be sure to set to something more sane if we use caching in Local storage! ;-)
      });
    }

    addPropertyChangeHandler(entityManager: breeze.EntityManager) {
      // call handler when an entity property of any entity changes
      // return the subscription token so caller can choose to unsubscribe later
      return entityManager.entityChanged.subscribe(changeArgs => {
        var action = changeArgs.entityAction;

        if (action === breeze.EntityAction.PropertyChange) {
          var entity = changeArgs.entity;
          if (entity.entityType.name == EntityExtends.User.$name) {
            var account = <IBreezeUser> entity;
            var propertyName = (<any>changeArgs.args).propertyName;
            if (propertyName == 'avatarURL' || propertyName == 'hasAvatar')
              account.clearAvatars();
          }
        }
      });
    }

    registerEndpointMappings(manager) {
      var store = manager.metadataStore;
      // TODO: Investigate if we could somehow generate this from Breeze WithsixController
      store.setEntityTypeForResourceName('ModsInCollection', 'Mod');

      var mission = function() {
        this.avatar = ""; // "" or instance of whatever type is is supposed to be
      };

      // register your custom constructor
      store.registerEntityTypeCtor("Mission", mission);
      /*
                  store.setEntityTypeForResourceName('ModsByGame', 'Mod');
                  store.setEntityTypeForResourceName('ModsByUser', 'Mod');
                  store.setEntityTypeForResourceName('MissionsByGame', 'Mission');
                  store.setEntityTypeForResourceName('MissionsByUser', 'Mission');
                  store.setEntityTypeForResourceName('ServersByGame', 'Server');
                  store.setEntityTypeForResourceName('ServersByUser', 'Server');
                  store.setEntityTypeForResourceName('CollectionsByGame', 'Collection');
                  store.setEntityTypeForResourceName('CollectionsByUser', 'Collection');
                  store.setEntityTypeForResourceName('AppsByGame', 'App');
                  store.setEntityTypeForResourceName('AppsByUser', 'App');
      */

      store.setEntityTypeForResourceName('AccountSearch', 'User');

      //angular.forEach(["Mod", "Mission", "MissionVersion", "Collection", "CollectionVersion", "Server", "App"], m => store.getEntityType(m).defaultResourceName = m + "sById");
      store.getEntityType("ModInfo").defaultResourceName = "ModInfoes";
      angular.forEach(["Mod", "Mission", "Collection"], m => this.addAnyProperty(m, "tags", store));
    }

    private addAnyProperty(typeName: string, propertyName: string, store) {
      var entityType = store.getEntityType(typeName);
      var newProp = new breeze.DataProperty({
        name: propertyName,
        dataType: breeze.DataType.Undefined,
        isNullable: true,
        //isUnmapped: true
      });
      entityType.addProperty(newProp);
    }

    private store: breeze.MetadataStore;
    public serviceName: string;

    public newManager(data): breeze.EntityManager {
      this.store = this.createMetadataStore(this.serviceName, data);
      var manager = new breeze.EntityManager({
        dataService: new breeze.DataService({
          serviceName: this.serviceName,
          hasServerMetadata: false
        }),
        metadataStore: this.store
      });

      BreezeEntityGraph.initialize(manager);

      this.addPropertyChangeHandler(manager);

      Debug.r.staging(() => {
        $(window).data("entityManager", manager);
      });

      return manager;
    }

    private createMetadataStore(serviceName, data): breeze.MetadataStore {
      // 'Identity' is the default key generation strategy for this app
      //var keyGen = breeze.AutoGeneratedKeyType.Identity;
      // namespace of the corresponding classes on the server
      //var namespace = 'SN.withSIX.App.ApiModel';

      // Breeze Labs: breeze.metadata.helper.js
      // https://github.com/IdeaBlade/Breeze/blob/master/Breeze.Client/Scripts/Labs/breeze.metadata-helper.js
      // The helper reduces data entry by applying common conventions
      // and converting common abbreviations (e.g., 'type' -> 'dataType')
      //var helper = new this.breeze.config.MetadataHelper(namespace, keyGen);

      /*** Convenience fns and vars ***/
      var store = new breeze.MetadataStore({
        // namingConvention: breeze.NamingConvention.camelCase // set as default

      });

      store.importMetadata(data);

      BreezeInitialzation.registerEntityTypeCtors(store);

      return store;
    }

    private registerEntityTypeCtor(store, ctor) { store.registerEntityTypeCtor(ctor.$name, ctor); }
  }

  export class W6ContextWrapper extends Tk.Service {
    static $inject = [
      '$http', '$q', '$timeout', 'breeze',
      'logger', 'options', 'userInfo', 'dbContext'
    ];

    constructor(public $http: ng.IHttpService, public $q: ng.IQService, public $timeout, public brz,
      public logger: Components.Logger.ToastLogger, public options, public userInfo, public context: W6Context) {
      super();
    }

    public filterPrefixes = this.context.filterPrefixes;

    public queryText(query, filterText, inclAuthor) {
      throw new Error("NotImplemented: queryText");
    }

    private queryTimespan(query, filterTimespan) {
      var m = <any>moment().subtract(filterTimespan, 'hours');
      return query.where("updatedAt", breeze.FilterQueryOp.GreaterThanOrEqual, new Date(m));
    }

    private querySize(query, filterSize) {
      return query.where("size",
        breeze.FilterQueryOp.LessThanOrEqual,
        filterSize);
    }

    public applyFiltering(query, filterOptions, inclAuthor) {
      if (filterOptions.timespan != null)
        query = this.queryTimespan(query, filterOptions.timespan);

      if (filterOptions.text != undefined && filterOptions.text != '') {
        query = this.queryText(query, filterOptions.text, inclAuthor);
        if (query == null)
          return null;
      }

      if (filterOptions.size != null)
        query = this.querySize(query, filterOptions.size);

      return query;
    }
  }

  registerService(W6Context);
}

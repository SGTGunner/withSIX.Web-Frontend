module MyApp.Play.ContentIndexes.Collections {
  // DEPRECATED: Convert to Queries/Commands
  export class CollectionDataService extends W6ContextWrapper {
    static $name = 'collectionDataService';
    public filterPrefixes = ["mod:", "user:", "tag:"];

    public getCollectionsByGame(gameSlug, options): Promise<IQueryResult<IBreezeCollection>> {
      Debug.log("getting collections by game: " + gameSlug + ", " + options);
      var query = breeze.EntityQuery.from("Collections")
        .where("game.slug", breeze.FilterQueryOp.Equals, gameSlug);

      return this.query(query, options);
    }

    public getCollectionsByIds(ids: string[], options): Promise<IQueryResult<IBreezeCollection>> {
      Debug.log("getting collections by ids: " + ids + ", " + options);
      var jsonQuery = {
        from: 'Collections',
        where: {
          'id': { in: ids }
        }
      }
      var query = new breeze.EntityQuery(jsonQuery).expand("latestVersion");
      return this.query(query, options);
    }

    public getCollectionsByAuthor(userSlug, options): Promise<IQueryResult<IBreezeCollection>> {
      Debug.log("getting collections by author: " + userSlug + ", " + options);
      var query = breeze.EntityQuery.from("Collections")
        .where("author.slug", breeze.FilterQueryOp.Equals, userSlug);
      return this.query(query, options);
    }

    public getCollectionsByMe(options): Promise<IQueryResult<IBreezeCollection>> {
      var userSlug = this.userInfo.slug;
      Debug.log("getting collections by me: " + userSlug + ", " + options);
      var query = breeze.EntityQuery.from("Collections").expand("latestVersion")
        .where("author.slug", breeze.FilterQueryOp.Equals, userSlug)
        .withParameters({ myPage: true });
      return this.query(query, options);
    }

    public async getCollectionsByMeByGame(gameId, options): Promise<IBreezeCollection[]> {
    var userSlug = this.userInfo.slug;
    Debug.log("getting collections by me: " + userSlug + ", " + options);
    var query = breeze.EntityQuery.from("Collections").expand("latestVersion")
      .where("author.slug", breeze.FilterQueryOp.Equals, userSlug)
      .where("gameId", breeze.FilterQueryOp.Equals, gameId)
      .withParameters({ myPage: true });
    var r = await this.query(query, options);
    return r.results;
  }

        public async getMySubscribedCollections(gameId, options ?) {
    let r = await this.getSubscribedCollectionIdsByGameId(gameId);
    if (r.data.length == 0) return [];
    let r2 = await this.getCollectionsByIds(r.data, options);
    return r2.results;
  }

        // can't be used due to virtual properties
        private getDesiredFields(query) {
    return query.select(["id", "name", "gameId", "slug", "avatar", "avatarUpdatedAt", "tags", "description", "author", "game", "size", "sizePacked", "subscribersCount", "modsCount"]);
  }

        private query(query, options): Promise < IQueryResult < IBreezeCollection >> {
    if(options.filter) {
      var requiresDependencies = options.filter.text && options.filter.text != '' && options.filter.text.containsIgnoreCase('mod:');
      if (requiresDependencies) {
        if (options.sort && options.sort.fields && options.sort.fields.indexOf("author") > -1) {
          // This is currently unsupported either by Breeze, EF, OData, or AutoMapper
          var defer = this.$q.defer();
          defer.reject(new Error("Cannot search for mods while sorted by author, please choose a different sorting option, or don't search for a mod"));
          return <any>defer.promise;
        }
        query = query.expand(["dependencies"]);
      }

      query = this.applyFiltering(query, options.filter, true)
        .orderBy(this.context.generateOrderable(options.sort));
    }

            if (options.pagination)
                query = this.context.applyPaging(query, options.pagination);

    //query = this.getDesiredFields(query);
    return this.context.executeQueryT<IBreezeCollection>(query);
  }

        public getCollectionTagsByGame(gameSlug, name) {
    Debug.log("getting collection names: " + gameSlug);
    var op = this.context.getOpByKeyLength(name);
    var key = name.toLowerCase();

    var query = breeze.EntityQuery.from("Collections")
      .where("game.slug", breeze.FilterQueryOp.Equals, gameSlug)
      .where(new breeze.Predicate("game.slug", breeze.FilterQueryOp.Equals, gameSlug).and(new breeze.Predicate("toLower(name)", op, key)))
      .orderBy("name")
      .select(["name"])
      .take(this.context.defaultTakeTag);
    return this.context.executeQuery(query);
  }

        public getSubscribedCollectionIdsByGameId(gameId: string) {
    Debug.log("getting subscribed collection ids");
    return this.context.get<string[]>('SubscribedCollections', { gameId: gameId });
  }

        public getSubscribedCollectionIds(gameSlug: string) {
    Debug.log("getting subscribed collection ids");
    return this.context.get<string[]>('SubscribedCollections', { gameSlug: gameSlug });
  }

        private getDependenciesQuery(split): breeze.Predicate {
    var pred: breeze.Predicate;
    for (var v in split) {
      var p = this.searchDependencies(breeze, split[v]);
      pred = pred == null ? p : pred.and(p);
    }

    return pred;
  }

        private searchDependencies(breeze, lc): breeze.Predicate {
    return breeze.Predicate.create("dependencies", "any", "dependency", breeze.FilterQueryOp.Contains, lc);
  }

        public queryText(query, filterText, inclAuthor) {
    if (filterText == "")
      return query;

    var info = <any>W6Context.searchInfo(filterText, false, this.filterPrefixes);

    var pred = this.context.getNameQuery(info.name);
    var pred2 = this.context.getTagsQuery(info.tag);
    var pred3 = this.context.getAuthorQuery(info.user);
    var pred4 = this.getDependenciesQuery(info.mod);

    return this.context.buildPreds(query, [pred, pred2, pred3, pred4]);
  }

  getCollectionTagsByAuthor(userSlug, name: string) {
    Debug.log("getting collection names: " + userSlug);
    var op = this.context.getOpByKeyLength(name);
    var key = name.toLowerCase();

    var query = breeze.EntityQuery.from("Collections")
      .where(new breeze.Predicate("author.slug", breeze.FilterQueryOp.Equals, userSlug).and(new breeze.Predicate("toLower(name)", op, key)))
      .orderBy("name")
      .select(["name"])
      .take(this.context.defaultTakeTag);
    return this.context.executeQuery(query);
  }
}

registerService(CollectionDataService);
}

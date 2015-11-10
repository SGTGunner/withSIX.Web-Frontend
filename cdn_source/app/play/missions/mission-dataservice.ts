module MyApp.Play.ContentIndexes.Missions {
  // DEPRECATED: Convert to Queries/Commands
  export class MissionDataService extends W6ContextWrapper {
    static $name = 'missionDataService';

    public queryText(query, filterText, inclAuthor) {
      if (filterText == "")
        return query;

      var info = <any>W6Context.searchInfo(filterText, false, this.filterPrefixes);

      var pred = this.context.getNameQuery(info.name);
      var pred2 = this.context.getTagsQuery(info.tag);
      var pred3 = this.context.getAuthorQuery(info.user);

      return this.context.buildPreds(query, [pred, pred2, pred3]);
    }

    public getMissionsByGame(gameSlug, name) {
      Debug.log("getting missions by game: " + gameSlug + ", " + name);
      var query = breeze.EntityQuery.from("Missions")
        .where(new breeze.Predicate("game.slug", breeze.FilterQueryOp.Equals, gameSlug).and(new breeze.Predicate("toLower(name)", breeze.FilterQueryOp.Contains, name.toLowerCase())))
        .orderBy("name")
        .select(["name"])
        .take(this.context.defaultTakeTag);
      return this.context.executeQuery(query);
    }

    public getMissionTagsByGame(gameSlug, name) {
      Debug.log("getting mission names: " + gameSlug);
      var op = this.context.getOpByKeyLength(name);
      var key = name.toLowerCase();

      var query = breeze.EntityQuery.from("Missions")
        .where(new breeze.Predicate("game.slug", breeze.FilterQueryOp.Equals, gameSlug).and(new breeze.Predicate("toLower(name)", op, key)))
        .orderBy("name")
        .select(["name"])
        .take(this.context.defaultTakeTag);
      return this.context.executeQuery(query);
    }

    public getMissionTagsByAuthor(authorSlug, name) {
      Debug.log("getting mission names: " + authorSlug);
      var op = this.context.getOpByKeyLength(name);
      var key = name.toLowerCase();

      var query = breeze.EntityQuery.from("MissionsByAuthor")
        .withParameters({ authorSlug: authorSlug })
        .where(new breeze.Predicate("toLower(name)", op, key))
        .orderBy("name")
        .select(["name"])
        .take(this.context.defaultTakeTag);
      return this.context.executeQuery(query);
    }

    public getAllMissionsByGame(gameSlug, options): Promise<IQueryResult<IBreezeMission>> {
      Debug.log("getting missions by game: " + gameSlug);
      var query = breeze.EntityQuery.from("Missions")
        .where("game.slug", breeze.FilterQueryOp.Equals, gameSlug);

      query = this.applyFiltering(query, options.filter, true);

      if (query == null)
        return <any> this.$q.reject("invalid query");

      query = query.orderBy(this.context.generateOrderable(options.sort));

      query = this.context.applyPaging(query, options.pagination);

      //query = this.getDesiredFields(query);
      return this.context.executeQueryT<IBreezeMission>(query);
    }

    public getAllMissionsByAuthor(authorSlug, options): Promise<IQueryResult<IBreezeMission>> {
      Debug.log("getting missions by author: " + authorSlug);
      var query = breeze.EntityQuery.from("Missions")
        .where("author.slug", breeze.FilterQueryOp.Equals, authorSlug);

      query = this.applyFiltering(query, options.filter, true);

      if (query == null)
        return <any> this.$q.reject("invalid query");

      query = query.orderBy(this.context.generateOrderable(options.sort));

      query = this.context.applyPaging(query, options.pagination);
      //query = this.getDesiredFields(query);
      return this.context.executeQueryT<IBreezeMission>(query);
    }

    // can't be used due to virtual properties
    private getDesiredFields(query) {
      return query.select(["id", "name", "slug", "avatar", "avatarUpdatedAt", "tags", "description", "author", "game", "size", "sizePacked", "followersCount", "modsCount"]);
    }

    public getFollowedMissionIds(gameSlug: string) {
      Debug.log("getting followed mission ids");
      return this.context.get('FollowedMissions', { gameSlug: gameSlug });
    }
  }

  registerService(MissionDataService);
}

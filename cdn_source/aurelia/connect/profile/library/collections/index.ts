import {BaseGame,IContent,TypeScope,ICollection,ContentDeleted} from '../../lib';
import {UiContext,uiCommandWithLogin, Utils,IFilter,ISort,SortDirection,Query, DbClientQuery, handlerFor,IRequireUser,requireUser} from '../../../../framework';
import {Router} from 'aurelia-router';
import {inject} from 'aurelia-framework';
import {DialogService} from 'aurelia-dialog';
import {CreateCollectionDialog} from '../../../../play/collections/create-collection-dialog';

@inject(UiContext)
export class Index extends BaseGame {
	heading = "Collections"
	gameName: string;
	itemType = "collection";

	filters: IFilter<ICollection>[] = [
		//{name: "Local", isEnabled: true, filter: item => item.typeScope == TypeScope.Local},
		{name: "Private", isEnabled: true, filter: item => item.authorSlug == this.w6.userInfo.slug}, // TODO
		{name: "Subscribed", isEnabled: true, filter: item => item.typeScope == TypeScope.Subscribed},
		{name: "Published", isEnabled: true, filter: item => item.typeScope == TypeScope.Published}]

	constructor(ui: UiContext) { super(ui); }

	async activate(params, routeConfig) {
		super.activate(params, routeConfig);
		var r = await new GetCollections(this.game.id).handle(this.mediator)
		this.subscriptions.subd(d => {
			d(this.eventBus.subscribe(ContentDeleted, this.contentDeleted));
		})
		this.items = r.collections;
	}

	createNew = uiCommandWithLogin(async () => { return this.dialog.open({viewModel: CreateCollectionDialog, model: {game: this.game}}); ////return this.legacyMediator.openAddCollectionDialog(this.game.slug);
	})

	contentDeleted = (evt: ContentDeleted) => {
		let deleteIfHas = (list, id) => {
			var item = list.asEnumerable().firstOrDefault(x => x.id == id);
			if (item) Tools.removeEl(list, item);
		}
		deleteIfHas(this.items, evt.id);
	}
}

interface ICollectionsData {
	collections: ICollection[];
}

@requireUser()
class GetCollections extends Query<ICollectionsData> implements IRequireUser {
	constructor(public id: string) {super()}
	user: MyApp.IUserInfo;
}

	@handlerFor(GetCollections)
	@inject(W6, "dbContext", "modInfoService", "collectionDataService")
	class GetCollectionsHandler extends DbClientQuery<GetCollections, ICollectionsData> {
		constructor(private w6: W6, dbContext, modInfoService, private collectionDataService: MyApp.Play.ContentIndexes.Collections.CollectionDataService) {
			super(dbContext, modInfoService);
		}
		// TODO: Merge all data from client, and web queries etc... :S
    public async handle(request: GetCollections): Promise<ICollectionsData> {
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
		  return {collections: Utils.concatPromiseResults(results).toArray() };
			// return GetCollectionsHandler.designTimeData(request);
    }

		async getClientCollections(request: GetCollections): Promise<Enumerable<ICollection>> {
			try {
				var r = await this.modInfoService.getGameCollections(request.id);
				return r.collections.asEnumerable().select(x => { x.typeScope = TypeScope.Local; return x; });
			} catch (err) {
				Tk.Debug.warn("Error while trying to get collections from client", err);
				return [].asEnumerable();
			}
		}

		async getMyCollections(request: GetCollections, options) {
			var r = await this.collectionDataService.getCollectionsByMeByGame(request.id, options)
			return r.asEnumerable().select(x => this.convertOnlineCollection(x, TypeScope.Published));
		}

		async getSubscribedCollections(request: GetCollections, options) {
			var r = await this.collectionDataService.getMySubscribedCollections(request.id, options);
			 return r.asEnumerable().select(x => this.convertOnlineCollection(x, TypeScope.Subscribed));
		}

		convertOnlineCollection(collection: MyApp.IBreezeCollection, type: TypeScope): ICollection {
			return {
				id: collection.id,
				author: collection.author.displayName,
				authorSlug: collection.author.slug,
				image: this.w6.url.getContentAvatarUrl(collection.avatar, collection.avatarUpdatedAt),
				typeScope: type,
				slug: collection.slug,
				name: collection.name,
				gameId: collection.game.id,
				gameSlug: collection.game.slug,
				type: "collection",
				version: collection.latestVersion.version
			}
		}

		static async designTimeData(request: GetCollections) {
			var testData = <any> [{
				id: "x",
				name: "Test collection",
				slug: "test-collection",
				type: "collection",
				isFavorite: false,
				gameId: request.id,
				gameSlug: "arma-3",
				author: "Some author",
				image: "http://i.ytimg.com/vi/yaqe1qesQ8c/maxresdefault.jpg",
				typeScope: TypeScope.Local
			},{
				id: "x",
				name: "Test collection 2",
				slug: "test-collection-2",
				type: "collection",
				isFavorite: false,
				gameId: request.id,
				gameSlug: "arma-3",
				author: "Some author",
				image: "http://i.ytimg.com/vi/yaqe1qesQ8c/maxresdefault.jpg",
				typeScope: TypeScope.Local
			},{
				id: "x",
				name: "Test collection 3",
				slug: "test-collection-3",
				type: "collection",
				isFavorite: false,
				gameId: request.id,
				gameSlug: "arma-3",
				author: "Some author",
				image: "http://i.ytimg.com/vi/yaqe1qesQ8c/maxresdefault.jpg",
				typeScope: TypeScope.Published
			},{
				id: "x",
				name: "Test collection 4",
				slug: "test-collection-4",
				type: "collection",
				isFavorite: false,
				gameId: request.id,
				gameSlug: "arma-3",
				author: "Some author",
				image: "http://i.ytimg.com/vi/yaqe1qesQ8c/maxresdefault.jpg",
				typeScope: TypeScope.Subscribed
			}];
			return {
				collections: testData.concat(testData, testData)
			};
		}
	}

import {UiContext,uiCommand2,uiCommandWithLogin2,ViewModel,MenuItem,IMenuItem,Query, DbQuery, DbClientQuery, handlerFor, VoidCommand} from '../../../../framework';
import {inject} from 'aurelia-framework';
import {Router} from 'aurelia-router';
import {EventAggregator} from 'aurelia-event-aggregator';
import {BaseGame,IContent,TypeScope,InstallContents,ContentDeleted} from '../../lib';
import {CreateCollectionDialog} from '../../../../play/collections/create-collection-dialog';

import ItemState = MyApp.Components.ModInfo.ItemState;
import IContentStateChange = MyApp.Components.ModInfo.IContentStateChange;

@inject(UiContext)
export class Index extends BaseGame {
	clientEnabled: boolean;
	heading = "Library";
	updates: IContent[];
	newContent: IContent[];
	recent: IContent[];

	constructor(ui: UiContext) {super(ui); }

	openGameSettings() { (<any>window).api.sendToHostIpc("open.settings", {module: "games", games: {slug: this.game.slug}}); }

	async activate(params, routeConfig) {
		super.activate(params, routeConfig);
		try {
			let x = await new GetHome(this.game.id).handle(this.mediator);
			this.updates = x.updates.asEnumerable().orderBy(x => x.name || '').toArray();
			this.newContent = x.newContent.asEnumerable().orderBy(x => x.name || '').toArray(); // TODO: order by InstalledAt
			this.recent = x.recent.asEnumerable().orderBy(x => x.name || '').toArray(); // TODO: order by UpdatedAt
			this.clientEnabled = true;
		} catch (err) {
			Tk.Debug.warn("Error trying to fetch game home", err);
			this.clientEnabled = false;
		}

		this.subscriptions.subd(d => {
			d(this.eventBus.subscribe(ContentDeleted, this.contentDeleted));
			d(this.eventBus.subscribe("status.contentStateChanged", this.handleContentStateChanged));
		})

			/*
			this.clientContentInfo = {
					favoriteContent: [],
					recentContent: [],
					installedContent: [],
					localCollections: []
			};
			this.subscriptions.sub(
			this.eventBus.subscribe("content.contentUnfavorited", args => {
				var gameId = args[0];
				var id = args[1];
				if (this.game.id != gameId)
						return;
				var toRemove = [];
				var favoriteContent = $scope.clientContentInfo.favoriteContent;
				favoriteContent.forEach(x => {
						if (x.id == id) toRemove.push(x);
				});
				if (toRemove.length == 0)
						return;
				this.applyIfNeeded(() => toRemove.forEach(x => favoriteContent.splice(favoriteContent.indexOf(x), 1)));
		}),
		this.eventBus.subscribe("content.recentItemUsed", args => {
				var gameId = args[0];
				var id = args[1];
				var usedAt = args[2];

				if (this.game.id != gameId)
						return;
				var recentContent = $scope.clientContentInfo.recentContent;
				this.applyIfNeeded(() => {
						recentContent.forEach(x => {
								if (x.id == id)
										x.usedAt = usedAt;
						});
				});
		}),
		this.eventBus.subscribe("content.contentFavorited", args => {
			var gameId = args[0];
			var id = args[1];
			var favoriteItem = args[2];

				var favoriteContent = $scope.clientContentInfo.favoriteContent;
				if (this.game.id == gameId && !favoriteContent.some(x => x.id == favoriteItem.id))
						this.applyIfNeeded(() => favoriteContent.push(favoriteItem));
		}),
		this.eventBus.subscribe("content.recentItemAdded", (evt, gameId, recentContent) => {
			var gameId = args[0];
			var recentContent = args[1];
				if (this.game.id == gameId)
						this.applyIfNeeded(() => $scope.clientContentInfo.recentContent.push(recentContent));
		}),
		this.eventBus.subscribe("content.contentInstalled", (evt, gameId, installedContent) => {
				if (this.game.id == gameId)
						this.applyIfNeeded(() => $scope.clientContentInfo.installedContent.push(installedContent));
		}));

		this.modInfoService.getGameContent(this.game.id)
				.then(cInfo => Tools.handleOverrides(this.clientContentInfo, cInfo));
			*/
	}

	deactivate() { this.subscriptions.dispose(); }

	contentDeleted = (evt: ContentDeleted) => {
		let deleteIfHas = (list, id) => {
			var item = list.asEnumerable().firstOrDefault(x => x.id == id);
			if (item) Tools.removeEl(list, item);

		}
		deleteIfHas(this.newContent, evt.id);
		deleteIfHas(this.updates, evt.id);
		deleteIfHas(this.recent, evt.id);
	}

	handleContentStateChanged = (stateChange: IContentStateChange) => {
		if (stateChange.gameId != this.game.id) return;
		angular.forEach(stateChange.states, state => {
			if (state.state == ItemState.Uninstalled) {
				var item = this.newContent.asEnumerable().firstOrDefault(x => x.id == state.id);
				if (item) Tools.removeEl(this.newContent, item);
			} else if (state.state == ItemState.Uptodate) {
				var item = this.updates.asEnumerable().firstOrDefault(x => x.id == state.id);
				if (item) Tools.removeEl(this.updates, item);
			}
		});
	};

	addMod = uiCommandWithLogin2("Mod", async () => this.legacyMediator.openAddModDialog(this.game.slug), {icon: "withSIX-icon-Nav-Mod"})
	addMission = uiCommandWithLogin2("Mission", async () => this.router.navigate(this.w6.url.play + '/' + this.game.slug + '/missions/new'), {icon: "withSIX-icon-Nav-Mission"});
	addCollection = uiCommandWithLogin2("Collection", async () => this.dialog.open({viewModel: CreateCollectionDialog, model: {game: this.game}}), {icon: "withSIX-icon-Nav-Collection"})
	updateAll = uiCommand2("Update all", async () => new InstallContents(this.game.id, this.updates.asEnumerable().select(x => { return { id: x.id }}).toArray(), "Updates").handle(this.mediator));
	addContentMenu: IMenuItem[] = [
		new MenuItem(this.addCollection),
		new MenuItem(this.addMod),
		new MenuItem(this.addMission)
  ]
}

interface IHomeData {
	updates: any[];
	newContent: any[];
	recent: any[];
}
class GetHome extends Query<IHomeData> {
	constructor(public id: string) {super()}
}

@handlerFor(GetHome)
class GetHomeHandler extends DbClientQuery<GetHome, IHomeData> {
	public handle(request: GetHome): Promise<IHomeData> {
		//return GetHomeHandler.designTimeData(request);
		return this.modInfoService.getGameHome(request.id);
	}

	static async designTimeData(request: GetHome) {
		return {
			updates: [{
				id: "x",
				name: "Test mod",
				slug: "test-mod",
				type: "mod",
				isFavorite: false,
				gameId: request.id,
				gameSlug: "arma-3",
				author: "Some author",
				image: "http://i.ytimg.com/vi/yaqe1qesQ8c/maxresdefault.jpg"
			},{
				id: "x",
				name: "Test mod 2",
				slug: "test-mod-2",
				type: "mod",
				isFavorite: false,
				gameId: request.id,
				gameSlug: "arma-3",
				author: "Some author",
				image: "http://i.ytimg.com/vi/yaqe1qesQ8c/maxresdefault.jpg"
			},{
				id: "x",
				name: "Test mod 3",
				slug: "test-mod-3",
				type: "mod",
				isFavorite: false,
				gameId: request.id,
				gameSlug: "arma-3",
				author: "Some author",
				image: "http://i.ytimg.com/vi/yaqe1qesQ8c/maxresdefault.jpg"
			}],
			newContent: [
				{
					id: "x",
					name: "Test mod",
					slug: "test-mod",
					type: "mod",
					isFavorite: false,
					gameId: request.id,
					gameSlug: "arma-3",
					author: "Some author",
					image: "http://i.ytimg.com/vi/yaqe1qesQ8c/maxresdefault.jpg"
				},{
					id: "x",
					name: "Test mod 2",
					slug: "test-mod-2",
					type: "mod",
					isFavorite: false,
					gameId: request.id,
					gameSlug: "arma-3",
					author: "Some author",
					image: "http://i.ytimg.com/vi/yaqe1qesQ8c/maxresdefault.jpg"
				},{
					id: "x",
					name: "Test mod 3",
					slug: "test-mod-3",
					type: "mod",
					isFavorite: false,
					gameId: request.id,
					gameSlug: "arma-3",
					author: "Some author",
					image: "http://i.ytimg.com/vi/yaqe1qesQ8c/maxresdefault.jpg"
				}
			],
			recent: [{
				id: "x",
				name: "Test collection",
				slug: "test-collection",
				type: "collection",
				isFavorite: false,
				gameId: request.id,
				gameSlug: "arma-3",
				author: "Some author",
				image: "http://i.ytimg.com/vi/yaqe1qesQ8c/maxresdefault.jpg"
			},{
				id: "x",
				name: "Test collection 2",
				slug: "test-collection-2",
				type: "collection",
				isFavorite: false,
				gameId: request.id,
				gameSlug: "arma-3",
				author: "Some author",
				image: "http://i.ytimg.com/vi/yaqe1qesQ8c/maxresdefault.jpg"
			},{
				id: "x",
				name: "Test collection 3",
				slug: "test-collection-3",
				type: "collection",
				isFavorite: false,
				gameId: request.id,
				gameSlug: "arma-3",
				author: "Some author",
				image: "http://i.ytimg.com/vi/yaqe1qesQ8c/maxresdefault.jpg"
			}]
		};
	}
}

import {UiContext,ViewModel,uiCommand2, Query, DbQuery, DbClientQuery, handlerFor} from '../../../framework';
import {IContent,TypeScope,IGame,InstallContents,ContentDeleted} from '../lib';
import {inject} from 'aurelia-framework';
import {GetGames} from '../library/games';

import ItemState = MyApp.Components.ModInfo.ItemState;
import IContentStateChange = MyApp.Components.ModInfo.IContentStateChange;

@inject(UiContext)
export class Index extends ViewModel {
	heading = "home"
	clientEnabled: boolean;
	updates: IContent[];
	newContent: IContent[];
	recent: IContent[];
	games: IGame[];

	constructor(ui: UiContext) { super(ui); }

	async activate(params, routeConfig) {
		try {
			let result = await new GetHome().handle(this.mediator)
			this.updates = result.updates.asEnumerable().orderBy(x => x.name || '').toArray();
			this.newContent = result.newContent.asEnumerable().orderBy(x => x.name || '').toArray(); // TODO: order by InstalledAt
			this.recent = result.recent.asEnumerable().orderBy(x => x.name || '').toArray(); // TODO: order by UpdatedAt
			this.games = result.games;
			this.clientEnabled = true;
		} catch (err) {
			Tk.Debug.warn("Error trying to fetch overall home", err);
			this.clientEnabled = false;
			try {
				let x = await new GetGames().handle(this.mediator);
				this.games = x.games;
			} catch (err) {
				Tk.Debug.warn("Error trying to fetch games", err);
			}
		}
		this.subscriptions.subd(d => {
			d(this.eventBus.subscribe(ContentDeleted, this.contentDeleted));
			d(this.eventBus.subscribe("status.contentStateChanged", this.handleContentStateChanged));
		});
	}

	deactivate() {
		this.subscriptions.dispose();
		this.eventBus.publish("gameChanged", {});
	}

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

	updateAll = uiCommand2("Update all", async () => {
		var commands = this.updates.asEnumerable()
			.groupBy(x => x.gameId, x => x.id,
					(key, elements) => new InstallContents(key, elements.asEnumerable().select(x => { return { id: x }}).toArray(), "Updates"))
			.toArray();
		for (let i in commands)
			await commands[i].handle(this.mediator);
	});
}

interface IHomeData {
	updates: IContent[];
	newContent: IContent[];
	recent: IContent[];
	games: IGame[];
}
class GetHome extends Query<IHomeData> {}

@handlerFor(GetHome)
class GetHomeHandler extends DbClientQuery<GetHome, IHomeData> {
	public async handle(request: GetHome): Promise<IHomeData> {
		//return GetHomeHandler.designTimeData();
		var home: IHomeData = await this.modInfoService.getHome();
		home.updates.asEnumerable().concat(home.newContent.asEnumerable()).concat(home.recent.asEnumerable()).toArray()
			.forEach(x => x.disableActions = true);
		return home;
	}

	static async designTimeData() {
		return {
			updates: [{
				id: "x",
				name: "Test mod",
				slug: "test-mod",
				type: "mod",
				isFavorite: false,
				gameSlug: "arma-3",
				gameId: "9DE199E3-7342-4495-AD18-195CF264BA5B",
				author: "Some author",
				image: "http://i.ytimg.com/vi/yaqe1qesQ8c/maxresdefault.jpg"
			},{
				id: "x",
				name: "Test mod 2",
				slug: "test-mod-2",
				type: "mod",
				isFavorite: false,
				gameSlug: "arma-3",
				gameId: "9DE199E3-7342-4495-AD18-195CF264BA5B",
				author: "Some author",
				image: "http://i.ytimg.com/vi/yaqe1qesQ8c/maxresdefault.jpg"
			},{
				id: "x",
				name: "Test mod 3",
				slug: "test-mod-3",
				type: "mod",
				isFavorite: false,
				gameSlug: "arma-3",
				gameId: "9DE199E3-7342-4495-AD18-195CF264BA5B",
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
					gameSlug: "arma-3",
					gameId: "9DE199E3-7342-4495-AD18-195CF264BA5B",
					author: "Some author",
					image: "http://i.ytimg.com/vi/yaqe1qesQ8c/maxresdefault.jpg"
				},{
					id: "x",
					name: "Test mod 2",
					slug: "test-mod-2",
					type: "mod",
					isFavorite: false,
					gameSlug: "arma-3",
					gameId: "9DE199E3-7342-4495-AD18-195CF264BA5B",
					author: "Some author",
					image: "http://i.ytimg.com/vi/yaqe1qesQ8c/maxresdefault.jpg"
				},{
					id: "x",
					name: "Test mod 3",
					slug: "test-mod-3",
					type: "mod",
					isFavorite: false,
					gameSlug: "arma-3",
					gameId: "9DE199E3-7342-4495-AD18-195CF264BA5B",
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
				gameSlug: "arma-3",
				gameId: "9DE199E3-7342-4495-AD18-195CF264BA5B",
				author: "Some author",
				image: "http://i.ytimg.com/vi/yaqe1qesQ8c/maxresdefault.jpg"
			},{
				id: "x",
				name: "Test collection 2",
				slug: "test-collection-2",
				type: "collection",
				isFavorite: false,
				gameSlug: "arma-3",
				gameId: "9DE199E3-7342-4495-AD18-195CF264BA5B",
				author: "Some author",
				image: "http://i.ytimg.com/vi/yaqe1qesQ8c/maxresdefault.jpg"
			},{
				id: "x",
				name: "Test collection 3",
				slug: "test-collection-3",
				type: "collection",
				isFavorite: false,
				gameSlug: "arma-3",
				gameId: "9DE199E3-7342-4495-AD18-195CF264BA5B",
				author: "Some author",
				image: "http://i.ytimg.com/vi/yaqe1qesQ8c/maxresdefault.jpg"
			}],
			games: [		{
						id: "x",
						slug: 'arma-3',
						name: 'ARMA 3',
						type: "game",
						author: "Some author",
						image: "http://i.ytimg.com/vi/yaqe1qesQ8c/maxresdefault.jpg"
					},
					{
						id: "x",
						slug: 'arma-2',
						name: 'ARMA 2',
						type: "game",
						author: "Some author",
						image: "http://i.ytimg.com/vi/yaqe1qesQ8c/maxresdefault.jpg"
					},
					{
						id: "x",
						slug: 'GTA-5',
						name: 'GTA 5',
						type: "game",
						author: "Some author",
						image: "http://i.ytimg.com/vi/yaqe1qesQ8c/maxresdefault.jpg"
					}]
		};
	}
}

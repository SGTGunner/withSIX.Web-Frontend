import {inject} from 'aurelia-framework';
import {Query, DbClientQuery, handlerFor, ISort} from '../../../../framework';
import {BaseGame,IContent,TypeScope,ContentDeleted} from '../../lib';

export class Index extends BaseGame {
	heading = "Missions"
	gameName: string;
	sort: ISort<IContent>[] = [{name: "name"},{name: "packageName"}]
	searchFields = ["name", "packageName"];

	activate(params, routeConfig) {
		super.activate(params, routeConfig);
		this.subscriptions.subd(d => {
			d(this.eventBus.subscribe(ContentDeleted, this.contentDeleted));
		})
		// TODO
		return new GetMissions(this.game.id).handle(this.mediator)
			.then(x => this.items = x.missions);
	}

	contentDeleted = (evt: ContentDeleted) => {
		let deleteIfHas = (list, id) => {
			var item = list.asEnumerable().firstOrDefault(x => x.id == id);
			if (item) Tools.removeEl(list, item);
		}
		deleteIfHas(this.items, evt.id);
	}
}


interface IMissionsData {
	missions: any[];
}
class GetMissions extends Query<IMissionsData> {
	constructor(public id: string) {super()}
}

@handlerFor(GetMissions)
class GetMissionsHandler extends DbClientQuery<GetMissions, IMissionsData> {
	// TODO: Merge all data from client, and web queries etc... :S
	public async handle(request: GetMissions): Promise<IMissionsData> {
		try {
			return await this.modInfoService.getGameMissions(request.id);
		} catch (err) {
			Tk.Debug.warn("Error while trying to get collections from client", err);
			return {missions: []};
		}
		// return GetMissionsHandler.designTimeData(request);
	}

	static async designTimeData(request: GetMissions) {
		var testData = <any> [{
							id: "x",
							name: "Test mission",
							slug: "test-mission",
							type: "mission",
							isFavorite: false,
							gameId: request.id,
							gameSlug: "arma-3",
							author: "Some author",
							image: "http://i.ytimg.com/vi/yaqe1qesQ8c/maxresdefault.jpg"
						},{
							id: "x",
							name: "Test mission 2",
							slug: "test-mission-2",
							type: "mission",
							isFavorite: false,
							gameId: request.id,
							gameSlug: "arma-3",
							author: "Some author",
							image: "http://i.ytimg.com/vi/yaqe1qesQ8c/maxresdefault.jpg"
						},{
							id: "x",
							name: "Test mission 3",
							slug: "test-mission-3",
							type: "mission",
							isFavorite: false,
							gameId: request.id,
							gameSlug: "arma-3",
							author: "Some author",
							image: "http://i.ytimg.com/vi/yaqe1qesQ8c/maxresdefault.jpg"
						},{
							id: "x",
							name: "Test mission 4",
							slug: "test-mission-4",
							type: "mission",
							isFavorite: false,
							gameId: request.id,
							gameSlug: "arma-3",
							author: "Some author",
							image: "http://i.ytimg.com/vi/yaqe1qesQ8c/maxresdefault.jpg"
						}];
		return {				missions: testData.concat(testData, testData)};
	}
}

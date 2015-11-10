import {ViewModel, Query, DbClientQuery, handlerFor} from '../../../framework';
import {IGame} from '../content/game';

export class Games extends ViewModel {
	heading = "Library"
	games: any[] = [];
	clientEnabled: boolean;

	openGameSettings() { (<any>window).api.sendToHostIpc("open.settings", {module: "games"}); }

	async activate(params, routeConfig) {
		try {
			let x = await new GetGames().handle(this.mediator)
			this.games = x.games;
			this.clientEnabled = true;
		} catch (err) {
			Tk.Debug.warn("Error trying to fetch games library", err);
			this.clientEnabled = false;
		}
	}
}


interface IGamesData {
	games: IGame[];
}
export class GetGames extends Query<IGamesData> {}

@handlerFor(GetGames)
class GetGamesHandler extends DbClientQuery<GetGames, IGamesData> {
	public async handle(request: GetGames): Promise<IGamesData> {
		try {
			return await this.modInfoService.getGames();
		} catch (err) {
			var r = await this.context.getCustom<IGamesData>("games");
			return r.data;
		}
		// return GetGamesHandler.designTimeData(request);
	}

	static async designTimeData(request: GetGames) {
		return {
			games: [
			{
				slug: 'arma-3',
				name: 'ARMA 3',
				isInstalled: true,
				author: "Some author",
				image: "http://i.ytimg.com/vi/yaqe1qesQ8c/maxresdefault.jpg"
			},
			{
				slug: 'arma-2',
				name: 'ARMA 2',
				isInstalled: true,
				author: "Some author",
				image: "http://i.ytimg.com/vi/yaqe1qesQ8c/maxresdefault.jpg"
			},
			{
				slug: 'GTA-5',
				name: 'GTA 5',
				isInstalled: true,
				author: "Some author",
				image: "http://i.ytimg.com/vi/yaqe1qesQ8c/maxresdefault.jpg"
			}
		]};
	}
}

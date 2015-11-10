import {ViewModel,Mediator,DbQuery, Query, handlerFor,IMenuItem,IFilter,ISort,SortDirection,ViewType} from '../../../framework';
import {inject} from 'aurelia-framework';
import {Router,RouterConfiguration, RouteConfig} from 'aurelia-router';
import {EventAggregator} from 'aurelia-event-aggregator';
import {GetGames} from './games';

@inject(Mediator, EventAggregator)
export class Show {
  games: any[] = [];
  game: any;
	router: Router;

	constructor(private mediator: Mediator, private eventBus: EventAggregator) {}
	configureRouter(config: RouterConfiguration, router: Router) {
		config.map([
            { route: '', name: 'library_game', moduleId: 'connect/profile/library/home/index', nav: true, title: 'Home', settings: { icon: "withSIX-icon-Home" } },
            { route: 'collections', name: 'library_game_collections', moduleId: 'connect/profile/library/collections/index', nav: true, title: 'Collections', settings: { icon: "withSIX-icon-Nav-Collection" } },
            { route: 'collections/:id/:slug', name: 'library_game_collections_show', moduleId: 'connect/profile/library/collections/show', nav: false, title: 'Collection', settings: { icon: "withSIX-icon-Nav-Collection" } },
            { route: 'mods', name: 'library_game_mods', moduleId: 'connect/profile/library/mods/index', nav: true, title: 'Mods', settings: { icon: "withSIX-icon-Nav-Mod" } },
            { route: 'missions', name: 'library_game_missions', moduleId: 'connect/profile/library/missions/index', nav: true, title: 'Missions', settings: { icon: "withSIX-icon-Nav-Mission" } }
		]);

		this.router = router;
	}

	async activate(params, routeConfig) {
    window.w6Cheat.libraryParent = this;
    try {
      let x = await new GetGames().handle(this.mediator);
      this.games = x.games;
    } catch (err) {
      Tk.Debug.warn("Error trying to fetch games", err);
      this.games.push(this.game);
    }
		let x = await new GetGame(params['gameSlug']).handle(this.mediator)
		this.game = x;
		this.eventBus.publish("gameChanged", {id: x.id, slug: x.slug});
	}

	deactivate(params, routeConfig) {
    window.w6Cheat.libraryParent = null;
    this.eventBus.publish("gameChanged", {id: null});
  }
}

//export class GameChanged {}

export class GetGame extends Query<any> {
	constructor(public gameSlug: string) { super(); }
}

@handlerFor(GetGame)
export class GetGameHandler extends DbQuery<GetGame, any> {
	handle(request: GetGame) {
		return this.findBySlug("Games", request.gameSlug, "getGame");
	}
}

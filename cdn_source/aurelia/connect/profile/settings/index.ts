import {Router, RouterConfiguration, RouteConfig} from 'aurelia-router';

export class Index {
	router: Router;
	configureRouter(config: RouterConfiguration, router: Router) {
		config.map([
			{ route: '',  name: 'home',      moduleId: 'connect/profile/settings/home',      nav: true, title:'Home' }
		]);

		this.router = router;
	}
}

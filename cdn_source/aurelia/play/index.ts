import {FrameworkConfiguration} from 'aurelia-framework';
import {Router, RouterConfiguration, RouteConfig} from 'aurelia-router';

export function configure(config: FrameworkConfiguration) {
}

export class PlayModule {
  configureRouter(config: RouterConfiguration, router: Router) {
    // (games/)api/v2/mods/{id}/license
    config.map([
      { route: 'p/:gameSlug/collections/:id/:slug?/content/edit',  name: 'edit-collection',      moduleId: 'play/collections/edit-content',      nav: false, title:'Edit collection', auth: true }
    ]);
  }
}

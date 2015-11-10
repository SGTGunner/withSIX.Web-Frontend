import './profile.css!';
import {UiContext,ViewModel, Mediator} from '../../framework'
import {inject} from 'aurelia-framework';
import {Router, RouterConfiguration, RouteConfig} from 'aurelia-router';
import {EventAggregator} from 'aurelia-event-aggregator';
import {EnableBasket, RestoreBasket} from '../../app';

//export * from './content/index';
//export * from './library/index';

@inject(UiContext)
export class Index extends ViewModel {
  constructor(ui: UiContext) { super(ui); }
  router: Router;
  configureRouter(config: RouterConfiguration, router: Router) {
    config.map([
      { route: ['', 'home'], name: 'home', moduleId: 'connect/profile/home/index', nav: this.w6.enableBasket, title: 'Home' },
      { route: 'library', name: 'library', moduleId: 'connect/profile/library/index', nav: this.w6.enableBasket, title: 'Library' },
      { route: 'blog', name: 'blog', moduleId: 'angular', nav: this.w6.userInfo.id && this.w6.userInfo.isAdmin ? true : false, auth: true, title: 'Blog' },
      { route: 'friends', name: 'friends', moduleId: 'angular', nav: this.w6.userInfo.id ? true : false, title: 'Friends', auth: true },
      { route: 'messages', name: 'messages', moduleId: 'angular', nav: this.w6.userInfo.id ? true : false, title: 'Messages', auth: true },
      { route: 'settings', name: 'settings', moduleId: 'angular', nav: this.w6.userInfo.id ? true : false, title: 'Settings', auth: true, settings: { cls: 'pull-right' } }
    ]);

    this.router = router;
  }
  activate() {
    if (!this.w6.enableBasket) {
      this.router.navigate("/me/settings")
    } else {
      this.eventBus.publish(new EnableBasket());
    }
  }
  deactivate() { this.eventBus.publish(new RestoreBasket()); }
}

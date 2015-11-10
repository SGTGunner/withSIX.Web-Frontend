import {FrameworkConfiguration} from 'aurelia-framework';
import {Router,RouterConfiguration} from 'aurelia-router';

export function configure(config: FrameworkConfiguration) {
}

export class ConnectModule {
  configureRouter(config: RouterConfiguration, router: Router) {
    config.map([
      { route: 'me',  name: 'profile',      moduleId: 'connect/profile/index',      nav: false, title:'Profile' },
      { route: 'login/verify/:activationCode', moduleId: 'connect/verify-code', nav: false, title: 'Verify activation code'}
    ]);
  }
}

export * from './profile/lib';

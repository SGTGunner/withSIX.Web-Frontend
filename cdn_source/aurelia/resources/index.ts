import {FrameworkConfiguration} from 'aurelia-framework';

export function configure(config: FrameworkConfiguration) {
  config.globalResources('router-menu');

  config.globalResources('card-view');
  config.globalResources('list-view');
  config.globalResources('filters');
  config.globalResources('typeahead');
  config.globalResources('command-button');
  config.globalResources('optional-link');

  config.globalResources('finder');
  config.globalResources('finder-results');

  config.globalResources('command');
  config.globalResources('converters');
  config.globalResources('back-img');

  config.globalResources('markdown');
  config.globalResources('usertitle');

  config.globalResources('router');
  config.globalResources('menu');
  config.globalResources('dialog');
  config.globalResources('dropdown-menu');
  config.globalResources('action-bar');
  config.globalResources('ad-links');
  config.globalResources('time-ago');
}

//export * from './command';
export * from './finder';
export * from './finder-results';
export * from './command-button';
export * from './router';
export * from './dialog';
export * from './router-menu';
export * from './dropdown-menu';
export * from './action-bar';
export * from './menu';
export * from './ad-links';
export * from './markdown';
export * from './usertitle';
export * from './time-ago';
export * from './filters';

import {inject,autoinject,customAttribute,bindingEngine} from 'aurelia-framework';
import {Router} from 'aurelia-router';
import {Subscriptions} from '../services/lib';

@inject(Router)
export class RouteSegmentStartsWithValueConverter {
  constructor(private router: Router) {
  }

  // TODO: How to access current route info
  toView(fullSegment) {
    return this.router.currentInstruction.fragment.startsWith(fullSegment);
  }
}

@inject(Router)
export class RouteSegmentUrlValueConverter {
  constructor(private router: Router) {
  }
  toView(fullSegment) {
    return "/" + fullSegment;
  }
}

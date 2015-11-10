import {FrameworkConfiguration} from 'aurelia-framework';
import {Router, RouterConfiguration, RouteConfig} from 'aurelia-router';

export function configure(config: FrameworkConfiguration) {
}

export class MainModule {
  configureRouter(config: RouterConfiguration, router: Router) {
    config.map([
      { route: ['','home'],  name: 'home',      moduleId: 'main/home',      nav: false, title:'Home' },
      { route: 'legal', name: 'legal', moduleId: 'main/legal', nav: false, title: 'Legal' },
      { route: 'get-started',  name: 'get-started',      redirect: "http://withsix.readthedocs.org/en/latest/general/get_started",      nav: true, title:'Get Started' },
      //{ route: 'download',         name: 'download',        moduleId: 'main/download',        nav: true, title:'Download' },
      //{ route: 'blog',  name: 'blog',      moduleId: 'main/blog',      nav: true, title:'Our Blog' },
      { route: 'community',  name: 'community',      redirect: "https://community.withsix.com",      nav: true, title:'Community' },
      //{ route: 'update',         name: 'update',        moduleId: 'main/update',        nav: false, title:'Update' },
      { route: 'orders/:orderId/checkout', name: 'order_checkout', moduleId: 'main/orders/checkout', nav: false, auth: true},
      { route: 'orders/:orderId/success', name: 'order_success', moduleId: 'main/orders/success', nav: false, auth: true},
      { route: 'orders/:orderId/failure', name: 'order_failure', moduleId: 'main/orders/failure', nav: false, auth: true},
      { route: 'orders/:orderId/resend', name: 'order_resend', moduleId: 'main/orders/resend', nav: false, auth: true},
      { route: 'orders/:orderId/confirmpayment', name: 'order_confirmpayment', moduleId: 'main/orders/confirmpayment', nav: false, auth: true},
      { route: 'orders/:orderId/confirmrecurring', name: 'order_confirmrecurring', moduleId: 'main/orders/confirmrecurring', nav: false, auth: true}
      //{ route: 'go-premium',         name: 'premium',        moduleId: 'main/premium',        nav: true, title:'Go Premium' },
      //{ route: 'child-router',  name: 'child-router', moduleId: 'child-router', nav: true, title:'Child Router' }
    ]);
  }
}

export interface IMenuItem {
    header: string;
    segment: string;
    mainSegment?: string;
    fullSegment?: string;
    url?: string;
    cls?: string;
    icon?: string;
    isRight?: boolean;
    isDefault?: boolean;
}

export class MainBase {
    menuItems: any[];
  constructor(public w6: W6, currentItem?) {
    var items: IMenuItem[] = [
      { header: "Get started", segment: "getting-started", mainSegment: ""},
      { header: "Download", segment: "download" },
      { header: "Our Blog", segment: "blog" },
      { header: "Community", segment: "community", mainSegment: "" }
    ];

    if (!w6.userInfo.isPremium)
      items.push({ header: "Go Premium", segment: "premium", isRight: true, icon: "withSIX-icon-Badge-Sponsor", cls: 'gopremium' });
    this.menuItems = this.getMenuItems(items, "");
  }

  getMenuItems(items: Array<IMenuItem>, mainSegment: string, parentIsDefault?: boolean): IMenuItem[] {
    var menuItems = [];
    items.forEach(item => {
        var main = item.mainSegment || item.mainSegment == "" ? item.mainSegment : mainSegment;
        var fullSegment = main && main != "" ? main + "." + item.segment : item.segment;
        var segment = item.isDefault ? main : fullSegment; // This will make menu links link to the parent where this page is default
        var menuItem = this.copyObject(item);
        menuItem.segment = segment;
        menuItem.fullSegment = fullSegment;
        menuItem.cls = item.cls;
        if (item.isRight) menuItem.cls = item.cls ? item.cls + ' right' : 'right';
        menuItems.push(menuItem);
    });
    return menuItems;
}

copyObject<T> (object:T): T {
   var objectCopy = <T>{};

   for (var key in object)
   {
       if (object.hasOwnProperty(key))
       {
           objectCopy[key] = object[key];
       }
   }

   return objectCopy;
}
}

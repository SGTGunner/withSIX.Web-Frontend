import {customAttribute, bindable} from 'aurelia-framework';
import {Router} from 'aurelia-router';

export class RouterMenu {
	@bindable router: Router;
	@bindable menuCls = "well nav nav-pills nav-stacked";
}

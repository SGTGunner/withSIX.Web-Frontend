//import {customAttribute, bindable} from 'aurelia-framework';
import {inject,autoinject} from 'aurelia-framework';

@inject(W6)
export class UsertitleValueConverter {
	constructor(private w6: W6) {
	}

	toView(title: string) {
		return title ? `${this.w6.userTitling()} ${title}` : this.w6.userTitling();
	}
}

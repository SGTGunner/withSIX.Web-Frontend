import {inject, customAttribute, bindable} from 'aurelia-framework';
import 'typeahead.js';

@customAttribute('typeahead')
@inject(Element)
export class Typeahead {
  element;
    @bindable minLength = 0;
    @bindable highlight = true;
    @bindable substringMatcher = null;
    @bindable display = null;
    @bindable searchEntity = null;
    @bindable selected = null;
    @bindable scope = null;
    lastQuery: string = null;

    constructor(element) {
        this.element = element;
    }

    attached() {
        var self = this;
        // TODO: how to update the bound model, do we have to use the selected?
        $(self.element).typeahead({
            hint: true,
            highlight: self.highlight,
            minLength: self.minLength
        },
        <any>{
            name: 'entities',
            display: i => self.display ? self.display(i, self.lastQuery) : i,
            source: async (query, syncCallback, asyncCallback) =>
            {
              self.lastQuery = query;
                if(self.substringMatcher){
                    var results = await self.substringMatcher(query, self.searchEntity, self.scope);
                    asyncCallback(results);
                }
            }
        })
        .bind('typeahead:select', (ev, selected?) => {
            if(self.selected){
                self.selected(selected, self.searchEntity, self.scope);
            }
        });
    }

}

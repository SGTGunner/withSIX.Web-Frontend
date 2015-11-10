import {UiContext,bindingEngine,ViewModel,LegacyMediator,Mediator,DbQuery, Query, handlerFor,IMenuItem,Filters,IFilter,ISort,SortDirection,ViewType,ITypeahead} from '../../../framework';
import {inject} from 'aurelia-framework';
import {Router} from 'aurelia-router';
import {Show} from './show';
import {IContent} from '../content/lib';

@inject(UiContext)
export class BaseGame extends ViewModel {
  items: IContent[] = [];
  selectedGame: any;
  game;
  itemType: string;
  $parent: Show;
  sort: ISort<IContent>[] = [{name: "name"}]
	searchFields = ["name"];
  viewType = ViewType.Card;
  filters: IFilter<IContent>[] = [];
  typeahead: ITypeahead<IContent>;
  filteredComponent: Filters<IContent>;
  searchInputPlaceholder = "type name...";
  availableViewTypes: ViewType[];

  constructor(ui: UiContext) {
    super(ui);
    this.availableViewTypes = [ViewType.Card];
    if (this.w6.url.environment != Tk.Environment.Production)
      this.availableViewTypes.push(ViewType.List);
    this.typeahead = {
      display: x => x.packageName ? x.name + ' (' + x.packageName + ')' : x.name,
      substringMatcher: async (q) => this.items.asEnumerable()
        .where(x => this.searchFields.asEnumerable().any(f => x[f] && x[f].containsIgnoreCase(q))).toArray(),
      selector: x => x.name // uses display by default
    }
  }

  activate(params, routeConfig) {
    // NASTY, but bind bindingContext returns self so :S
		this.$parent = window.w6Cheat.libraryParent;
    //Tk.Debug.log("$$$ parent", this.$parent, params, routeConfig, routeConfig.navModel.router.parent);
		this.game = this.$parent.game;
    this.selectedGame = this.$parent.games.find(x => x.id == this.game.id);
    var itemSlug = this.itemType ? "/" + this.itemType + "s" : '';
    this.subscriptions.subd(d =>
      d(this.observe("selectedGame").subscribe(x => this.router.navigate("/me/library/" + this.selectedGame.slug + itemSlug))));
		//this.$parent = routeConfig.navModel.router.parent.viewPorts.default.view.executionContext
  }

  deactivate() {
    this.subscriptions.release();
  }
}

import {ViewModel,Query, DbClientQuery, handlerFor, VoidCommand} from '../../../framework';
import {LaunchGame,IGame,Game} from './game';

export interface IGameBox extends IGame {}

// TODO: so far this could just be an alternative view but still use the Game viewmodel. would have to extend card-view etc to support this?
export class GameBox extends Game {
	model: IGameBox;
  activate(model: IGameBox) {
		super.activate(model);
		this.image = this.w6.url.getAssetUrl('img/play.withSIX/games/' + model.slug + '/boxart.png')
  }
}

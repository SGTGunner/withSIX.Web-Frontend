import {MenuItem,ViewModel,uiCommand2} from '../../../framework';
import {Query, DbClientQuery, handlerFor, VoidCommand} from '../../../framework';


export interface IGame // extends IContent {}
{
	id: string;
	slug: string;
	name: string;
	type: string;
}

export class Game extends ViewModel {
  image: string;
  public model: any
  icon = "withSIX-icon-Joystick";

  activate(model: IGame) {
		this.model = model;
		this.image = this.w6.url.getAssetUrl('img/play.withSIX/games/' + model.slug + '/logo-overview.png')
  }

  launch = uiCommand2("LAUNCH", () => new LaunchGame(this.model.id).handle(this.mediator), {icon: "withSIX-icon-Hexagon-Play"});

  bottomActions = [
		new MenuItem(this.launch)
  ]
}

export enum LaunchType {
  Default
}

export class LaunchGame extends VoidCommand {
  constructor(public id: string, public launchType: LaunchType = LaunchType.Default) { super(); }
}

@handlerFor(LaunchGame)
class LaunchGameHandler extends DbClientQuery<LaunchGame, void> {
	public handle(request: LaunchGame): Promise<void> {
    return this.modInfoService.launchGame({id: request.id, launchType: request.launchType});
	}
}

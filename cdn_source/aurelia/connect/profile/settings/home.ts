import {ViewModel} from '../../../framework';
import {Query, DbQuery, handlerFor} from '../../../framework';

export class Home extends ViewModel {
	heading = "Settings";

	activate(params, routeConfig) {
		return new GetHome().handle(this.mediator);
	}
}

interface IHomeData {}

class GetHome extends Query<IHomeData> {}

@handlerFor(GetHome)
class GetHomeHandler extends DbQuery<GetHome, IHomeData> {
	public handle(request: GetHome) {
		return GetHomeHandler.getDesignTimeData(request);
	}

	static async getDesignTimeData(request: GetHome) {
		return <IHomeData>{};
	}
}

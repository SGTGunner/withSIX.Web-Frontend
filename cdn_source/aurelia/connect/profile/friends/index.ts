import {ViewModel} from '../../../framework';
import {Query, DbQuery, handlerFor} from '../../../framework';

export class Index extends ViewModel {
	heading = "Friends";
	friends: any[];
	friendRequests: any[];

	activate(params, routeConfig) {
		return new GetFriends().handle(this.mediator)
			.then(x => {
				this.friends = x.friends;
				this.friendRequests = x.friendRequests;
			});
	}
}

interface IFriendsData {
	friends: any[];
	friendRequests: any[];
}
class GetFriends extends Query<IFriendsData> {}

@handlerFor(GetFriends)
class GetFriendsHandler extends DbQuery<GetFriends, IFriendsData> {
    public handle(request: GetFriends): Promise<IFriendsData> {
      return this.context.getCustom("me/friends")
        .then(result => result.data);
    }
}

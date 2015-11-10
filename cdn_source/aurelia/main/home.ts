import {inject} from 'aurelia-framework';
import {HttpClient} from 'aurelia-http-client';
import {Mediator, Query, DbQuery, handlerFor} from '../framework';
import {MainBase} from './index';

interface IHomeData {
    totalDownloads: number;
    totalAccounts: number;
    totalCollections: number;
    totalMods: number;
    totalMissions: number;
    totalServers: number;
    totalSubscribers: number;
    totalFollowers: number;
    totalLikes: number;
    latestPost?: {};
}

@inject(Mediator, W6)
export class Home extends MainBase {
  latestPost = {};
  data: IHomeData;

  constructor (private mediator: Mediator, public w6: W6, private httpClient: HttpClient) {
    super(w6);
    var items = [
      { header: "Get started", segment: "getting-started", mainSegment: "", isRight: false, icon: null, cls: null, url: null },
      { header: "Download", segment: "download" },
      { header: "Our Blog", segment: "blog" },
      { header: "Community", segment: "community", mainSegment: "" }
    ];

    if (!w6.userInfo.isPremium)
      items.push({ header: "Go Premium", segment: "gopremium", isRight: true, icon: "withSIX-icon-Badge-Sponsor", cls: 'gopremium' });
    this.menuItems = this.getMenuItems(items, "");
  }

  get totalDownloads() { return this.toAprox(this.data.totalDownloads); };
  get totalAccounts() { return this.toAprox(this.data.totalAccounts); };
  get totalCollections() { return this.toAprox(this.data.totalCollections); };
  get totalMods() { return this.toAprox(this.data.totalMods); };
  get totalMissions() { return this.toAprox(this.data.totalMissions); };
  get totalServers() { return this.toAprox(this.data.totalServers); };
  get totalSubscribers() { return this.toAprox(this.data.totalSubscribers); };
  get totalFollowers() { return this.toAprox(this.data.totalFollowers); };
  get totalLikes() { return this.toAprox(this.data.totalLikes); };

  toAprox(count) {
    return count; // todo
  }

  async activate(params, routeConfig) {
  /*      this.userService.getUser(params.id)
    .then(user => {
        routeConfig.navModel.setTitle(user.name);
    });*/
    this.data = {
      totalDownloads: 1,
      totalAccounts: 2,
      totalCollections: 3,
      totalMods: 4,
      totalMissions: 5,
      totalServers: 6,
      totalSubscribers: 7,
      totalFollowers: 8,
      totalLikes: 9
    }
    var result = await new GetHome().handle(this.mediator);
    this.data = result;
    this.latestPost = result.latestPost;
  }
}

class GetHome extends Query<IHomeData> {}

@handlerFor(GetHome)
class GetHomeHandler extends DbQuery<GetHome, IHomeData> {
    public handle(request: GetHome): Promise<IHomeData> {
      return this.context.getCustom("pages/home")
        .then(result => result.data);
    }
}

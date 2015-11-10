import {EventAggregator} from 'aurelia-event-aggregator';
import {inject} from 'aurelia-framework';
import {Base} from '../services/lib';

import IClientInfo = MyApp.Components.ModInfo.IClientInfo;
import IClientStatus = MyApp.Components.ModInfo.IClientStatus;
import IContentStateChange = MyApp.Components.ModInfo.IContentStateChange;


@inject("basketService", EventAggregator, "modInfoService")
export class BasketService extends Base {
  clientInfos: { [id: string]: GameClientInfo } = {};
  clientPromises: { [id: string]: Promise<GameClientInfo> } = {};
  busyCount = 0;

  constructor(public basketService: MyApp.Components.Basket.BasketService, private eventBus: EventAggregator, private modInfoService: MyApp.Components.ModInfo.ModInfoService) { super(); }

  async Int(clientInfo: GameClientInfo) {
    try {
      await this.updateClientInfo(clientInfo);
    } catch (err) {
    }
    return clientInfo;
  }

  async updateClientInfo(clientInfo: GameClientInfo) {
    this.busyCount = this.busyCount + 1;
    try {
      var cInfo = await this.modInfoService.getGameInfo(clientInfo.game.id);
      Tools.handleOverrides(clientInfo.clientInfo, cInfo);
    } finally {
      this.busyCount = this.busyCount - 1
    };
  }

  getGameInfo(gameId: string) {
    if (this.clientPromises[gameId]) return this.clientPromises[gameId];

    var ci = new GameClientInfo(this.eventBus, gameId);
    this.clientInfos[gameId] = ci;
    this.subscriptions.sub(() => ci.dispose());

    return this.clientPromises[gameId] = this.modInfoService.contentHub.connection.state == ConnectionState.connected ? this.Int(ci) : Promise.resolve(ci);
  }

  // TODO: Duplication in controllers
  getItemStateClass(id: string, gameId: string) {
    var clientInfo = this.clientInfos[gameId];
    if (clientInfo == null)
      return "notinstalled";

    var ciItem = clientInfo.clientInfo.content[id];
    if (ciItem == null)
      //return "notinstalled";
      return "install";
    switch (ciItem.state) {
      case MyApp.Components.ModInfo.ItemState.Installing:
        return "installing";
      case MyApp.Components.ModInfo.ItemState.NotInstalled:
        return "install";
        //return "notinstalled";
      case MyApp.Components.ModInfo.ItemState.Uninstalled:
      return "install";
      //return "notinstalled";
      case MyApp.Components.ModInfo.ItemState.Uninstalling:
        return "installing";
      case MyApp.Components.ModInfo.ItemState.UpdateAvailable:
        return "updateavailable";
      case MyApp.Components.ModInfo.ItemState.Updating:
        return "updating";
      case MyApp.Components.ModInfo.ItemState.Uptodate:
        return "uptodate";
      default:
        return "install";
    }
  };
}

export enum ConnectionState {
  connecting = 0,
  connected = 1,
  reconnecting = 2,
  disconnected = 4
}

export class GameClientInfo extends Base {
  clientInfo: IClientInfo = {
    content: {},
    // TODO: status is currently in the client something global.., must be made per game
    status: <IClientStatus>{
      progress: 0,
      speed: 0
    },
    globalLock: false,
    gameLock: false,
    isRunning: false
  }

  game: { id: string }

  get isLocked() { return this.clientInfo.globalLock || this.clientInfo.gameLock; }
  get canExecute() { return !this.isLocked; }

  constructor(private eventBus: EventAggregator, gameId: string) {
    super();
    this.game = { id: gameId };
    if (gameId == null) return;

    this.subscriptions.sub(
      this.eventBus.subscribe("status.locked", () => this.clientInfo.globalLock = true),
      this.eventBus.subscribe("status.unlocked", () => this.clientInfo.globalLock = false),
      this.eventBus.subscribe("status.launchedGame", (id: string) => {
        if (this.game.id == id)
          this.clientInfo.isRunning = true;
      }),
      this.eventBus.subscribe("status.terminatedGame", (id: string) => {
        if (this.game.id == id)
          this.clientInfo.isRunning = false;
      }),

      this.eventBus.subscribe("status.lockedGame", (id: string) => {
        if (this.game.id == id)
          this.clientInfo.gameLock = true;
      }),
      this.eventBus.subscribe("status.unlockedGame", (id: string) => {
        if (this.game.id == id)
          this.clientInfo.gameLock = false;
      }),
      this.eventBus.subscribe("status.contentStateChanged", (stateChange: IContentStateChange) => {
        if (stateChange.gameId == this.game.id) {
          angular.forEach(stateChange.states, state => {
            if (state.state == MyApp.Components.ModInfo.ItemState.Uninstalled
            || state.state == MyApp.Components.ModInfo.ItemState.NotInstalled) {
              delete this.clientInfo.content[state.id];
            } else {
              this.clientInfo.content[state.id] = state;
            }
          });
        }
      }),

      // TODO: this is actually progress stuff, not state like above
      // this.eventBus.subscribe("status.contentStatusChanged", (stateChange: IContentStatusChange) => {
      //   if (stateChange.gameId == this.game.id) {
      //     angular.forEach(stateChange.states, state => {
      //       if (state.state == MyApp.Components.ModInfo.ItemState.Uninstalled
      //         || state.state == MyApp.Components.ModInfo.ItemState.NotInstalled) {
      //         delete this.clientInfo.content[state.id];
      //       } else {
      //         this.clientInfo.content[state.id] = state;
      //       }
      //     });
      //   }
      // }),

      // TODO: Move to higher scope, because it is not just per game
      this.eventBus.subscribe("status.statusChanged", (stateChange: IClientStatus) => {
        this.clientInfo.status = stateChange;
      })
      );
  }

  dispose() {
    this.subscriptions.release();
  }
}

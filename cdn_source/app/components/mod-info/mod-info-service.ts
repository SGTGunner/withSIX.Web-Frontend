module MyApp.Components.ModInfo {
  export interface IContentGuidSpec {
    id: string;
    constraint?: string;
    isOnlineCollection?: boolean; // meh
  }

  export interface IContentsBase {
    gameId: string;
    contents: IContentGuidSpec[];
    name?: string;
  }

  export interface IContentBase {
    gameId: string;
    content: IContentGuidSpec;
  }

  export interface ISyncCollections extends IContentsBase {
  }

  export interface IPlayContents extends IContentsBase {
  }

  export interface IPlayContent extends IContentBase {
  }

  export interface ILaunchContents extends IContentsBase {
  }

  export interface ILaunchContent extends IContentBase {
  }

  export interface IInstallContents extends IContentsBase {
  }

  export interface IInstallContent extends IContentBase {
  }

  export interface IDeleteCollection {
    id: string;
    gameId: string;
  }

  export interface ILaunchGame {
    id: string, launchType: number;
  }

  export interface IContentState {
    id: string; gameId: string; state: ItemState; progress: number; version: string;
  }

  export interface IContentStateChange {
    gameId: string; states: { [id: string]: IContentState };
  }

  export interface IContentStatusChange {
    gameId: string; contentId: string; state: ItemState; speed: number;
  }

  export class ModInfoService extends Tk.Service {
    static $name = 'modInfoService';
    static $inject = ['userInfo', 'w6', 'signalrService', '$rootScope', '$q'];
    statusHubEvents = [
      "locked",
      "unlocked",
      "lockedGame",
      "unlockedGame",
      "launchedGame",
      "terminatedGame",
      "contentStateChanged",
      "contentStatusChanged",
      "statusChanged"];

    contentHubEvents = [
      "contentFavorited",
      "contentUnfavorited",
      "recentItemAdded",
      "recentItemUsed",
      "contentInstalled"];

    clientHubEvents = ["appStateUpdated"];

    constructor(private userInfo, private w6: W6, public signalr: Signalr.SignalrService, private $rootScope, private $q: ng.IQService) {
      super();

      this.contentHub = this.signalr.miniClient.connection.createHubProxy('ContentHub');
      this.clientHub = this.signalr.miniClient.connection.createHubProxy('ClientHub');
      this.statusHub = this.signalr.miniClient.connection.createHubProxy('StatusHub');

      this.statusHubEvents.forEach(x => this.registerStatusHubEvent(x));
      this.contentHubEvents.forEach(x => this.registerContentHubEvent(x));
      this.clientHubEvents.forEach(x => this.registerClientHubEvent(x));
    }

    execContentHub<T>(commandName: string, command?: Object): Promise<T> {
      return this.signalr.miniClient.execHub(this.contentHub, "content", commandName, command);
    }

    execClientHub<T>(commandName: string, command?: Object): Promise<T> {
      return this.signalr.miniClient.execHub(this.clientHub, "client", commandName, command);
    }

    execStatusHub<T>(commandName: string, command?: Object): Promise<T> {
      return this.signalr.miniClient.execHub(this.statusHub, "status", commandName, command);
    }

    registerStatusHubEvent(eventName: string) {
      this.signalr.miniClient.registerHubEvent(this.statusHub, eventName, "status");
    }

    registerContentHubEvent(eventName: string) {
      this.signalr.miniClient.registerHubEvent(this.contentHub, eventName, "content");
    }

    registerClientHubEvent(eventName: string) {
      this.signalr.miniClient.registerHubEvent(this.clientHub, eventName, "client");
    }

    // TODO: Error handling; toast / etc inform user somehow!
    public playContent(command: IPlayContent) {
      return this.execContentHub<void>("playContent", command);
    }

    public playContents(command: IPlayContents) {
      return this.execContentHub<void>("playContents", command);
    }

    public launchContent(command: ILaunchContent) {
      return this.execContentHub<void>("launchContent", command);
    }

    public launchContents(command: ILaunchContents) {
      return this.execContentHub<void>("launchContents", command);
    }

    public installContent(command: IInstallContent) {
      return this.execContentHub<void>("installContent", command);
    }

    public uninstallContent(command: IInstallContent) {
      return this.execContentHub<void>("uninstallContent", command);
    }

    public installCollection(command: IInstallContent) {
      return this.execContentHub<void>("installCollection", command);
    }

    public deleteCollection(command: IDeleteCollection) {
      return this.execContentHub<void>("deleteCollection", command);
    }

    public installContents(command: IInstallContents) {
      var syncCol = <ISyncCollections>{ gameId: command.gameId, contents: [] };
      command.contents.forEach(x => {
        if (x.isOnlineCollection)
          syncCol.contents.push(x);
      });
      if (syncCol.contents.length > 0) {
        return this.syncCollections(syncCol)
          .then(x => this.execContentHub<void>("installContents", command));
      } else {
        return this.execContentHub<void>("installContents", command);
      }
    }

    public syncCollections(command: ISyncCollections) {
      return this.execContentHub<void>("syncCollections", command);
    }

    public launchGame(command: ILaunchGame) {
      return this.execContentHub<void>("launchGame", command);
    }


    public abort(gameId: string) {
      return this.execContentHub<void>("abort", { id: gameId });
    }

    public abortAll(gameId: string) {
      return this.execContentHub<void>("abortAll");
    }


    public updateMiniClient() {
      return this.execClientHub<void>("performUpdate");
    }

    public getGameInfo(gameId: string) {
      return this.execStatusHub<IClientInfo>("getState", gameId);
    }

    public getGameContent(gameId: string) {
      return this.execContentHub<IClientInfo2>("getContent", gameId);
    }

    public getHome() {
      return this.execStatusHub<any>("getHome");
    }

    public getGames() {
      return this.execStatusHub<any>("getGames");
    }

    public getGameHome(gameId: string) {
      return this.execStatusHub<any>("getGameHome", gameId);
    }

    public getGameCollections(gameId: string) {
      return this.execStatusHub<any>("getGameCollections", gameId);
    }
    public getGameMods(gameId: string) {
      return this.execStatusHub<any>("getGameMods", gameId);
    }
    public getGameMissions(gameId: string) {
      return this.execStatusHub<any>("getGameMissions", gameId);
    }

    contentHub: HubProxy;
    clientHub: HubProxy;
    statusHub: HubProxy;

    connectMiniClient() {
      return this.signalr.miniClient.promise();
    }
  }

  export enum ItemState {
    Uptodate,
    NotInstalled,
    UpdateAvailable,
    Uninstalled,

    Installing,
    Updating,
    Uninstalling
  }

  export interface IContentInfo {
    id: string;
    gameId: string;
    state: ItemState;
    progress: number;
    version: string;
  }

  export interface IContent {
    id: string;
    name: string;
    image: string;
  }

  export interface ILocalContent extends IContent {
    packageName: string;
    contentId: string;
  }
  export interface IRecentContent extends IContent {
    usedAt: Date;
  }
  export interface IFavoriteContent extends IContent { }

  export interface IClientInfo2 {
    installedContent: ILocalContent[];
    recentContent: IRecentContent[];
    favoriteContent: IFavoriteContent[];
    localCollections: ILocalContent[];
  }

  export interface IClientInfo {
    content: { [id: string]: IContentInfo };
    globalLock: boolean;
    gameLock: boolean;
    status: IClientStatus;
    isRunning: boolean;
  }

  export interface IClientStatus {
    text: string; icon: string; color: string; progress: number; speed: number; acting: boolean; state: State;
  }

  export enum State {
    Normal,
    Paused,
    Error
  }

  export interface IModInfo {
    installedVersion: string;
    latestVersion: string;
    id: string;
    state: string;
  }

  registerService(ModInfoService);
}

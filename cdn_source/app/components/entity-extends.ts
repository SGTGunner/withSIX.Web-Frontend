module MyApp.EntityExtends {
    export class _ExtendsHelper {
        public static $namespace: string = "MyApp.EntityExtends";
    }

    export class BaseEntity {
        // BAH
        static w6: W6;
    }

    export class CollectionVersion implements ICollectionVersion {
        static $name = 'CollectionVersion';
        versionRevision: number;
        versionBuild: number;
        versionMinor: number;
        versionMajor: number;
        branch: string;
        private _version: string;

        private getVersion() {
            if (this.versionRevision && this.versionRevision > -1)
                return [this.versionMajor, this.versionMinor, this.versionBuild, this.versionRevision].join("."); //+ "-" + this.branch
            if (this.versionBuild && this.versionBuild > -1)
                return [this.versionMajor, this.versionMinor, this.versionBuild].join("."); //+ "-" + this.branch
            return [this.versionMajor, this.versionMinor].join(".");
        }

        get version() { // TODO: WHy doesnt work when cached??
            return this.getVersion(); //this._version || (this._version = this.getVersion());
        }
    }

    export interface ICollectionVersion {
        version: string;
    }

    export class User implements IUser {
        static $name = 'User';
        private _avatars = {};
        private _profileUrl: string;
        public slug: string;

        getAvatarUrl(size) { return this._avatars[size] || (this._avatars[size] = window.w6Cheat.w6.url.calculateAvatarUrl(<any>this, size)); }

        clearAvatars() { this._avatars = {}; }

        get profileUrl() { return this._profileUrl || (this._profileUrl = this.slug ? window.w6Cheat.w6.url.getUserSlugUrl(this.slug) : null); }

        isInRole(role: string): boolean { return this.roles.asEnumerable().contains(role) }
        isInRoles(...roles: string[]): boolean;
        isInRoles(roles: string[]): boolean;
        isInRoles(...roles: any[]): boolean {
            if (roles.length == 0)
                return false;
            if (roles[0] instanceof Array)
                return this._isInRoles(roles[0]);
            return this._isInRoles(roles);
        }

        private _isInRoles(roles: string[]): boolean {
            for (var i in roles)
                if (this.isInRole(roles[i]))
                    return true;
            return false;
        }

        hasPermission(resource: string, action: string) {
            return Permissions.hasPermission(this.roles, resource, action);
        }

        roles: string[] = [];
    }

    export interface IUser {
        clearAvatars(): void;
        getAvatarUrl(size: number): string;
        profileUrl: string;
        isInRole(role: string): boolean;
        isInRoles(...roles: string[]): boolean;
        isInRoles(roles: string[]): boolean;
        hasPermission(resource: string, action: string): boolean;
        roles: string[];
    }

    export class Weather implements IWeather {
        static $name = 'Weather';

        getStartWeatherText() {
            var weather = this.getWeatherText((<any>this).startWeather || 0);
            var wind = this.getWindText((<any>this).startWind || 0);
            var waves = this.getWavesText((<any>this).startWaves || 0);
            var fog = this.getFogText((<any>this).startFog || 0);

            return "Weather: " + weather + ", Wind: " + wind + ", Waves: " + waves + " and Fog: " + fog;
        }

        getForecastWeatherText() {
            var weather = this.getWeatherText((<any>this).forecastWeather || 0);
            var wind = this.getWindText((<any>this).forecastWind || 0);
            var waves = this.getWavesText((<any>this).forecastWaves || 0);
            var fog = this.getFogText((<any>this).forecastFog || 0);

            return "Weather: " + weather + ", Wind: " + wind + ", Waves: " + waves + " and Fog: " + fog;
        }

        private getWeatherText(value: number) {
            if (value < 0.26)
                return "Clear";
            if (value < 0.41)
                return "Almost Clear";
            if (value < 0.61)
                return "Semi cloudy";
            if (value < 0.9)
                return "Cloudy";

            return "Overcast";
        }

        private getWindText(value: number) {
            if (value < 0.26)
                return "None";
            if (value < 0.41)
                return "Slightly windy";
            if (value < 0.61)
                return "Windy";
            if (value < 0.9)
                return "Heavy Windy";

            return "Storm";
        }

        private getWavesText(value: number) {
            if (value < 0.26)
                return "None";
            if (value < 0.41)
                return "Slightly wobbly";
            if (value < 0.61)
                return "Wobbly";
            if (value < 0.9)
                return "Heavy Wobbly";

            return "Storm";
        }

        private getFogText(value: number) {
            if (value < 0.26)
                return "None";
            if (value < 0.41)
                return "Slightly foggy";
            if (value < 0.61)
                return "Foggy";
            if (value < 0.9)
                return "Heavy Fog";

            return "Impossible";
        }
    }

    export interface IWeather {
        getStartWeatherText();
        getForecastWeatherText();
    }

    export class Mod {
        public mediaItems: IBreezeModMediaItem[];

        public getLinkCount(): number {
            var c = 0;
            angular.forEach(this.mediaItems, item => {
                if (item.type == "Link")
                    c++;
            });
            return c;
        }
    }

    export interface IMod {
        tags: string[];
    }

    export class Game implements IGame {
        get supportsStream() {
            return this.supportsMods || this.supportsMissions || this.supportsCollections;
        }

        supportsMods: boolean;
        supportsMissions: boolean;
        supportsCollections: boolean;
    }

    export interface IGame {
        supportsStream: boolean;
    }

    export class Mission {
    }

    export interface IMission {
        tags: string[];
    }

    export class Collection {
    }

    export interface ICollection {
        tags: string[];
    }

    // Please note, do not inherit multiple breeze entities from the same class/constructor/prototype!
    export class Comment implements IComment {
        public replies: Comment[];
        public replyTo: IComment;

        hasReply(): boolean {
            return this.replyTo ? true : false;
        }

        getChildCount(): number {
            var c = this.replies.length;
            angular.forEach(this.replies, reply => c += reply.getChildCount());
            return c;
        }
    }

    export interface IComment {
        getChildCount(): number;
        hasReply(): boolean;
        //replyTo: IComment;
        //replies: Comment[];
    }

    export class PostComment extends Comment {
    }

    export interface IPostComment extends IComment {
    }

    export class MissionComment extends Comment {
    }

    export interface IMissionComment extends IComment {
    }

    export class ModComment extends Comment {
    }

    export interface IModComment extends IComment {
    }

    export class CollectionComment extends Comment {
    }

    export interface ICollectionComment extends IComment {
    }

    export class ServerComment extends Comment {
    }

    export interface IServerComment extends IComment {
    }

    export class AppComment extends Comment {
    }

    export interface IAppComment extends IComment {
    }

    export class UserInfo extends User implements IUserInfo {
        // TODO: Instead use dynamic getters that use isInRole internally and cache the result?
        isPremium: boolean;
        // TODO: Instead use dynamic getters that use isInRole internally and cache the result?
        isAdmin: boolean;
        // TODO: Instead use dynamic getters that use isInRole internally and cache the result?
        isManager: boolean;
        id: string;
        slug: string;
        avatarURL: string;
        hasAvatar: boolean;
        emailMd5: string;
        firstName: string;
        lastName: string;
        userName: string;
        displayName: string;
        failedLogin: boolean;
        avatarUpdatedAt: Date;

        // TODO: Listen to avatar changes at a global place and ClearAvatars() so that the next calls will refresh the info. Already implemented for the updateUserInfo calls...
    }
}

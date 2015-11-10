module MyApp.Connect.Profile {

    export class ProfileQueryBase extends DbQueryBase {
        private getUserUrl(userSlug, resource?) { return "profile/" + this.context.getUserSlugCache(userSlug) + (resource ? "/" + resource : ""); }

        public getUserProfileData(userSlug, resource?) { return this.context.getCustom(this.getUserUrl(userSlug, resource)).then((result) => result.data); }
    }

    export class GetProfileQuery extends ProfileQueryBase {
        static $name = "GetProfile";
        public execute = [
            'userSlug', (userSlug) => this.context.getCustom("profile/" + userSlug)
            .then((result) => {
                var userProfile = <any>result.data;
                this.context.addUserSlugCache(userSlug, userProfile.id);
                return userProfile;
            })
        ];
    }

    export class GetProfileCommentsQuery extends ProfileQueryBase {
        static $name = "GetProfileComments";
        public execute = ['userSlug', (userSlug) => this.getUserProfileData(userSlug, "comments")];
    }

    export class GetProfileMessagesQuery extends ProfileQueryBase {
        static $name = "GetProfileMessages";
        public execute = ['userSlug', (userSlug) => this.getUserProfileData(userSlug, "messages")];
    }

    export class GetProfileBlogQuery extends ProfileQueryBase {
        static $name = "GetProfileBlog";
        public execute = ['userSlug', (userSlug) => this.getUserProfileData(userSlug, "blogposts")];
    }

    export class GetProfileFriendsQuery extends ProfileQueryBase {
        static $name = "GetProfileFriends";
        public execute = ['userSlug', (userSlug) => this.getUserProfileData(userSlug, "friends")];
    }

    export class ProfileCommandbase extends DbCommandBase {
        private getUserUrl(userSlug, resource?) { return "profile/" + this.context.getUserSlugCache(userSlug) + (resource ? "/" + resource : ""); }

        public postProfileData(userSlug, resource?, data?, requestName?) { return this.context.postCustom(this.getUserUrl(userSlug, resource), data, { requestName: requestName }).then((result) => result.data); }

        public deleteProfileData(userSlug, resource?, requestName?) { return this.context.deleteCustom(this.getUserUrl(userSlug, resource), { requestName: requestName }).then((result) => result.data); }
    }

    export class AddAsFriendCommand extends ProfileCommandbase {
        static $name = "AddAsFriend";
        public execute = ['userSlug', (userSlug) => this.postProfileData(userSlug, "friends", undefined, "addAsFriend")];
    }

    export class RemoveAsFriendCommand extends ProfileCommandbase {
        static $name = "RemoveAsFriend";
        public execute = ['userSlug', (userSlug) => this.deleteProfileData(userSlug, "friends", "removeAsFriend")];
    }

    registerCQ(GetProfileQuery);
    registerCQ(GetProfileMessagesQuery);
    registerCQ(GetProfileCommentsQuery);
    registerCQ(GetProfileFriendsQuery);
    registerCQ(GetProfileBlogQuery);
    registerCQ(AddAsFriendCommand);
    registerCQ(RemoveAsFriendCommand);
}
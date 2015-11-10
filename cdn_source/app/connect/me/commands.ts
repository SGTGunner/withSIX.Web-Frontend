module MyApp.Connect.Me {

    // Fail Test code:
    // public execute = ['$q', (q: ng.IQService) => q.reject("ouch!")]
    // public execute = ['$q', (q: ng.IQService) => q.reject({data: { message: "woopsydaisy" }, statusText: "statusText", status: 666})]
    export class MeQueryBase extends DbQueryBase {
        private getMeUrl(resource?) { return "me" + (resource ? "/" + resource : ""); }

        public getMeData(resource?) { return this.context.getCustom(this.getMeUrl(resource)).then((result) => result.data); }
    }

    export class GetMeSettingsPersonalQuery extends MeQueryBase {
        static $name = "GetMeSettingsPersonal";
        public execute = [() => this.getMeData("settingspersonal")];
    }

    export class GetMeSettingsAvatarQuery extends MeQueryBase {
        static $name = "GetMeSettingsAvatar";
        public execute = [() => this.getMeData("settingsavatar")];
    }

    export class GetMeSettingsCredentialsQuery extends MeQueryBase {
        static $name = "GetMeSettingsCredentials";
        public execute = [() => this.getMeData("settingscredentials")];
    }

    export class GetMeSettingsPremiumQuery extends MeQueryBase {
        static $name = "GetMeSettingsPremium";
        public execute = [() => this.getMeData("settingspremium")];
    }

    export class GetMeBlogQuery extends MeQueryBase {
        static $name = "GetMeBlog";
        public execute = [() => this.getMeData("blog")];
    }

    export class GetMeBlogPostQuery extends MeQueryBase {
        static $name = "GetMeBlogPost";
        public execute = ['slug', (slug) => this.getMeData("blog/" + slug)];
    }

    export class GetMeContentQuery extends MeQueryBase {
        static $name = "GetMeContent";
        public execute = [() => this.getMeData("content")];
    }

    export class GetMeFriendsQuery extends MeQueryBase {
        static $name = "GetMeFriends";
        public execute = [() => this.getMeData("friends")];
    }

    export class GetMeMessagesQuery extends MeQueryBase {
        static $name = "GetMeMessages";
        public execute = [() => this.getMeData("messages")];
    }

    export class GetMeUserMessagesQuery extends MeQueryBase {
        static $name = "GetMeUserMessages";
        public execute = ['slug', (slug) => this.getMeData("messages/" + slug)];
    }


    export class MeCommandbase extends DbCommandBase {
        private getMeUrl(resource?) { return "me" + (resource ? "/" + resource : ""); }

        public postMeData(resource?, data?, requestName?) { return this.context.postCustom(this.getMeUrl(resource), data, { requestName: requestName }).then((result) => result.data); }

        public deleteMeData(resource?, requestName?, params?) { return this.context.deleteCustom(this.getMeUrl(resource), { requestName: requestName, params: params }).then((result) => result.data); }
    }

    export class SaveMeSettingsPersonalCommand extends MeCommandbase {
        static $name = "SaveMeSettingsPersonal";
        public execute = [
            'data', data => this.postMeData("SettingsPersonal", data, "saveMeSettingsPersonal")
            .then(result => this.respondSuccess("Sucessfully saved!"))
            .catch(this.respondError)
        ];
    }

    export class SaveMeSettingsAvatarCommand extends MeCommandbase {
        static $name = "SaveMeSettingsAvatar";
        public execute = [
            'file', file => {
                var fd = new FormData();
                fd.append('file', file);
                return this.context.postCustomFormData("Me/SettingsAvatar", fd, { requestName: 'saveMeSettingsAvatar' })
                    .then(result => this.respondSuccess("Sucessfully saved!"))
                    .catch(this.respondError);
            }
        ];
    }

    export class SaveMeSettingsCredentialsCommand extends MeCommandbase {
        static $name = "SaveMeSettingsCredentials";
        public execute = [
            'data', data => this.postMeData("SettingsCredentials", data, "saveMeSettingsCredentials")
            .then(result => this.respondSuccess("Sucessfully saved!"))
            .catch(this.respondError)
        ];
    }

    export class SaveMeSettingsEmailCredentialsCommand extends MeCommandbase {
        static $name = "SaveMeSettingsEmailCredentials";
        public execute = [
            'data', data => this.postMeData("SettingsCredentialsEmail", data, "saveMeSettingsCredentials")
            .then(result => this.respondSuccess("Sucessfully saved!"))
            .catch(this.respondError)
        ];
    }

    export class SaveMeSettingsCredentialsOtherCommand extends MeCommandbase {
        static $name = "SaveMeSettingsCredentialsOther";
        public execute = [
            'data', data => this.postMeData("SettingsCredentialsOther", data, "saveMeSettingsCredentialsOther")
            .then(result => this.respondSuccess("Sucessfully saved!"))
            .catch(this.respondError)
        ];
    }

    registerCQ(SaveMeSettingsCredentialsOtherCommand);

    export class CreatePrivateMessageCommand extends MeCommandbase {
        static $name = "CreatePrivateMessage";
        public execute = ['userSlug', 'data', (userSlug, data) => this.postMeData("Messages/" + userSlug, data, "createPrivateMessage")];
    }

    export class CreateBlogPostCommand extends MeCommandbase {
        static $name = "CreateBlogPost";
        public execute = ['data', data => this.postMeData("Blog", data, "createBlogPost")];
    }

    export class UpdateBlogPostCommand extends MeCommandbase {
        static $name = "UpdateBlogPost";
        public execute = ['id', 'data', (id, data) => this.postMeData("Blog/" + id, data, "updateBlogPost")];
    }

    export class DeleteBlogPostCommand extends MeCommandbase {
        static $name = "DelteBlogPost";
        public execute = ['id', id => this.deleteMeData("Blog/" + id, "deleteBlogPost")];
    }

    export class AcceptFriendRequestCommand extends MeCommandbase {
        static $name = "AcceptFriendRequest";
        public execute = ['friendId', id => this.postMeData("Friends/" + id, null, "acceptFriendRequest")];
    }

    export class DenyFriendRequestCommand extends MeCommandbase {
        static $name = "DenyFriendRequest";
        public execute = ['friendId', id => this.deleteMeData("Friends/" + id, "denyFriendRequest")];
    }

    export class CancelPremiumRecurringCommand extends MeCommandbase {
        static $name = "CancelPremiumRecurring";
        public execute = [
            'model', (model) => this.deleteMeData("SettingsPremium", "cancelPremium", model)
            .then(result => this.respondSuccess("Sucessfully saved!"))
            .catch(this.respondError)
        ];
    }

    export class SavePremiumCommand extends MeCommandbase {
        static $name = "SavePremium";
        public execute = [
            'data', (data) => this.postMeData("SettingsPremium", data, "savePremium")
            .then(result => this.respondSuccess("Sucessfully saved!"))
            .catch(this.respondError)
        ];
    }

    export class ClearAvatarCommand extends MeCommandbase {
        static $name = "ClearAvatar";
        public execute = [() => this.deleteMeData("SettingsAvatar", "clearAvatar")];
    }

    registerCQ(GetMeContentQuery);
    registerCQ(GetMeBlogQuery);
    registerCQ(GetMeBlogPostQuery);
    registerCQ(GetMeFriendsQuery);
    registerCQ(GetMeMessagesQuery);
    registerCQ(GetMeUserMessagesQuery);
    registerCQ(GetMeSettingsPersonalQuery);
    registerCQ(GetMeSettingsAvatarQuery);
    registerCQ(GetMeSettingsCredentialsQuery);
    registerCQ(GetMeSettingsPremiumQuery);

    registerCQ(CreateBlogPostCommand);
    registerCQ(UpdateBlogPostCommand);
    registerCQ(DeleteBlogPostCommand);

    registerCQ(AcceptFriendRequestCommand);
    registerCQ(DenyFriendRequestCommand);

    registerCQ(SaveMeSettingsPersonalCommand);
    registerCQ(SaveMeSettingsAvatarCommand);
    registerCQ(SaveMeSettingsCredentialsCommand);
    registerCQ(SaveMeSettingsEmailCredentialsCommand);

    registerCQ(CreatePrivateMessageCommand);

    registerCQ(ClearAvatarCommand);
    registerCQ(CancelPremiumRecurringCommand);
    registerCQ(SavePremiumCommand);


}
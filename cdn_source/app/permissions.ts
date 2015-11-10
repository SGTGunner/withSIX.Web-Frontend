module MyApp {
    export class Role {
        static admin = "admin";
        static user = "user";
        static bot = "bot";
        static manager = "manager";
        static premium = "premium";
        static authorBeta = "author_beta";
        static author = "author";
    }

    export class Resource {
        static admin = "admin";
        static mods = "mods";
    }

    export class Permission {
        static Create = "create"; // new
        static Read = "read"; // view, list
        static Update = "update"; // edit
        static Delete = "delete"; // destroy
    }

    export class ModPermission {
        static CreateReport = 'create_report';
    }

    // TODO: See if we can somehow sync up with the C# PermissionManager somehow
    export class Permissions {
        static write = [Permission.Create, Permission.Update, Permission.Delete];
        static read = [Permission.Read];
        static readAndWrite = Permissions.read.concat(Permissions.write);
        static permissions = {
            admin: {
                mods: Permissions.readAndWrite.concat([ModPermission.CreateReport]),
                admin: Permissions.readAndWrite
            },
            manager: {
                mods: Permissions.readAndWrite.concat([ModPermission.CreateReport])
            },
            user: {
                mods: [Permission.Create, Permission.Update, Permissions.read]
            },
            author_beta: {
                mods: [Permission.Create, Permission.Update, Permissions.read]
            },
            premium: {}
        };

        static hasPermission(roles: string[], resource: string, action: string) {
            for (var i in roles) {
                var permissions = this.permissions[roles[i]];
                if (permissions) {
                    var actions = permissions[resource];
                    if (actions && actions.asEnumerable().contains(action))
                        return true;
                }
            }
            return false;
        }
    }
}
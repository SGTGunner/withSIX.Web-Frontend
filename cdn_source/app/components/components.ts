module MyApp.Components {
    class ComponentsModule extends Tk.Module {
        static $name = "ComponentsModule";

        constructor() {
            super('Components', ['commangular']);
            this.app
                .config(['$commangularProvider', $commangularProvider => registerCommands(this.commands, $commangularProvider)])
                .factory('refreshService', [
                    () => {
                        var cache = {};
                        return {
                            getType: (type) => cache[type],
                            refreshType: (type) => cache[type] = !cache[type]
                        };
                    }
                ]);
        }
    }

    export function registerCQ(command) { app.registerCommand(command); }

    export function registerService(service) { app.app.service(service.$name, service); }

    export function registerController(controller) { app.app.controller(controller.$name, controller); }

    var app = new ComponentsModule();
}
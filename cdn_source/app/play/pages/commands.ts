module MyApp.Play.Pages {
    class ReportCommand extends DbCommandBase {
        static $name = "Report";

        public execute = [() => {}];
    }

    registerCQ(ReportCommand);
}
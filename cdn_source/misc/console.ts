module Tk {
    export var debug = false;

    export enum Environment {
        Production,
        Staging,
        Local,
        Local2
    }

    export enum LogLevel {
        // ReSharper disable InconsistentNaming
        debug,
        log,
        info,
        warn,
        error,
        trace,
        none
        // ReSharper restore InconsistentNaming
    }

    var environment = Environment.Production;

    export var getEnvironment = (): Environment => {
        return environment;
    };

    export var setEnvironment = (env: Environment) => {
        environment = env;
        debug = env == Environment.Local || env == Environment.Local2;
        Debug.setLoggingLevel(env == Environment.Production ? LogLevel.info : LogLevel.debug);
    };

    export class _DebugBase {
        public setLoggingLevel = (logLevel: LogLevel) => {
            _DebugBase._logLevel = logLevel;
        };
        public getLoggingLevel = () => {
            return _DebugBase._logLevel;
        };
        static _logLevel: LogLevel = LogLevel.debug;

        objectName: string = null;

        getObjectName = (): string => {
            return "[" + this.objectName + "]";
        };
        static shouldLog = (level: LogLevel): boolean => {
            return level >= _DebugBase._logLevel;
        };
        writeInner = (level: LogLevel, message: Object, optionalParams: any[]) => {
            if (this.objectName != null) {
                optionalParams.unshift(message);
                _DebugBase._writeInner(level, this.getObjectName(), optionalParams);
            } else
                _DebugBase._writeInner(level, message, optionalParams);
        };
        static _writeInner = (level: LogLevel, message: Object, optionalParams: any[]) => {
            if (console == null) return;

            if (console.hasOwnProperty(LogLevel[level]))
                _DebugBase._write(level, message, optionalParams);
            else {
                optionalParams.unshift(message);
                _DebugBase._write(LogLevel.log, LogLevel[level].toUpperCase() + ":", optionalParams);
            }
        };
        static _writePreProcessInner = (level: LogLevel, message: Object, ...optionalParams: any[]) => {
            _DebugBase._writeInner(level, message, optionalParams);
        };
        writePreProcess = (level: LogLevel, msgFunc: () => Object, optionalParams: { (): Object; }[]) => {
            if (this.objectName != null) {
                optionalParams.unshift(msgFunc);
                _DebugBase._writePreProcess(level, () => this.getObjectName(), optionalParams);
            } else
                _DebugBase._writePreProcess(level, msgFunc, optionalParams);
        };
        static _writePreProcess = (level: LogLevel, msgFunc: () => Object, optionalParams: { (): Object; }[]) => {
            if (_DebugBase.shouldLog(level)) {
                if (!optionalParams) {
                    _DebugBase._writePreProcessInner(level, msgFunc());
                } else {
                    switch (optionalParams.length) {
                    case 0:
                        _DebugBase._writePreProcessInner(level, msgFunc());
                        break;
                    case 1:
                        _DebugBase._writePreProcessInner(level, msgFunc(), optionalParams[0]());
                        break;
                    case 2:
                        _DebugBase._writePreProcessInner(level, msgFunc(), optionalParams[0](), optionalParams[1]());
                        break;
                    case 3:
                        _DebugBase._writePreProcessInner(level, msgFunc(), optionalParams[0](), optionalParams[1](), optionalParams[2]());
                        break;
                    case 4:
                        _DebugBase._writePreProcessInner(level, msgFunc(), optionalParams[0](), optionalParams[1](), optionalParams[2](), optionalParams[3]());
                        break;
                    case 5:
                        _DebugBase._writePreProcessInner(level, msgFunc(), optionalParams[0](), optionalParams[1](), optionalParams[2](), optionalParams[3](), optionalParams[4]());
                        break;
                    case 6:
                        _DebugBase._writePreProcessInner(level, msgFunc(), optionalParams[0](), optionalParams[1](), optionalParams[2](), optionalParams[3](), optionalParams[4](), optionalParams[5]());
                        break;
                    case 7:
                        _DebugBase._writePreProcessInner(level, msgFunc(), optionalParams[0](), optionalParams[1](), optionalParams[2](), optionalParams[3](), optionalParams[4](), optionalParams[5](), optionalParams[6]());
                        break;
                    case 8:
                        _DebugBase._writePreProcessInner(level, msgFunc(), optionalParams[0](), optionalParams[1](), optionalParams[2](), optionalParams[3](), optionalParams[4](), optionalParams[5](), optionalParams[6](), optionalParams[7]());
                        break;
                    case 9:
                        _DebugBase._writePreProcessInner(level, msgFunc(), optionalParams[0](), optionalParams[1](), optionalParams[2](), optionalParams[3](), optionalParams[4](), optionalParams[5](), optionalParams[6](), optionalParams[7](), optionalParams[8]());
                        break;
                    case 10:
                        _DebugBase._writePreProcessInner(level, msgFunc(), optionalParams[0](), optionalParams[1](), optionalParams[2](), optionalParams[3](), optionalParams[4](), optionalParams[5](), optionalParams[6](), optionalParams[7](), optionalParams[8](), optionalParams[9]());
                        break;
                    default:
                        throw new Error("If you have more than 10 Optional Parameters you are doing it wrong.");
                    }
                }
            }
        };
        static _write = (level: LogLevel, message: Object, optionalParams: any[]) => {
            if (level == LogLevel.none) {
                throw new Error("You should not set the log level of a message to none.");
            }

            if (console == null)
                return;

            if (_DebugBase.shouldLog(level)) {
              var logger = console[LogLevel[level]];
              if (!logger) throw new Error("Loglevel doesnt exist: " + level);
                logger = logger.bind(console);
                if (!optionalParams) {
                    logger(message);
                } else {
                    switch (optionalParams.length) {
                    case 0:
                        logger(message);
                        break;
                    case 1:
                        logger(message, optionalParams[0]);
                        break;
                    case 2:
                        logger(message, optionalParams[0], optionalParams[1]);
                        break;
                    case 3:
                        logger(message, optionalParams[0], optionalParams[1], optionalParams[2]);
                        break;
                    case 4:
                        logger(message, optionalParams[0], optionalParams[1], optionalParams[2], optionalParams[3]);
                        break;
                    case 5:
                        logger(message, optionalParams[0], optionalParams[1], optionalParams[2], optionalParams[3], optionalParams[4]);
                        break;
                    case 6:
                        logger(message, optionalParams[0], optionalParams[1], optionalParams[2], optionalParams[3], optionalParams[4], optionalParams[5]);
                        break;
                    case 7:
                        logger(message, optionalParams[0], optionalParams[1], optionalParams[2], optionalParams[3], optionalParams[4], optionalParams[5], optionalParams[6]);
                        break;
                    case 8:
                        logger(message, optionalParams[0], optionalParams[1], optionalParams[2], optionalParams[3], optionalParams[4], optionalParams[5], optionalParams[6], optionalParams[7]);
                        break;
                    case 9:
                        logger(message, optionalParams[0], optionalParams[1], optionalParams[2], optionalParams[3], optionalParams[4], optionalParams[5], optionalParams[6], optionalParams[7], optionalParams[8]);
                        break;
                    case 10:
                        logger(message, optionalParams[0], optionalParams[1], optionalParams[2], optionalParams[3], optionalParams[4], optionalParams[5], optionalParams[6], optionalParams[7], optionalParams[8], optionalParams[9]);
                        break;
                    default:
                        throw new Error("If you have more than 10 Optional Parameters you are doing it wrong.");
                    }
                }
              }
        };
    }

    export class DebugBase extends _DebugBase implements DebugInner.IDebug {
        public error(message: Object, ...optionalParams: any[]): void {
            this.writeInner(LogLevel.error, message, optionalParams);
        }

        public debug(message: Object, ...optionalParams: any[]): void {
            this.writeInner(LogLevel.debug, message, optionalParams);
        }

        public log(message: Object, ...optionalParams: any[]): void {
            this.writeInner(LogLevel.log, message, optionalParams);
        }

        public info(message: Object, ...optionalParams: any[]): void {
            this.writeInner(LogLevel.info, message, optionalParams);
        }

        public trace(message: Object, ...optionalParams: any[]): void {
            this.writeInner(LogLevel.trace, message, optionalParams);
        }

        public warn(message: Object, ...optionalParams: any[]): void {
            this.writeInner(LogLevel.warn, message, optionalParams);
        }

        public write = this.writeInner;

        public p = new DebugProcessClass();
        public r = new DebugRun();

        public generateDebugForName(name: string): DebugInner.IDebug {
            var dbg = new DebugBase();
            dbg.objectName = name;
            return dbg;
        }
    }

    export class DebugProcessClass extends _DebugBase implements DebugInner.IDebugPostProcess {

        public error(message: () => Object, ...optionalParams: { (): Object; }[]): void {
            this.writePreProcess(LogLevel.error, message, optionalParams);
        }

        public debug(message: () => Object, ...optionalParams: { (): Object; }[]): void {
            this.writePreProcess(LogLevel.debug, message, optionalParams);
        }

        public log(message: () => Object, ...optionalParams: { (): Object; }[]): void {
            this.writePreProcess(LogLevel.log, message, optionalParams);
        }

        public info(message: () => Object, ...optionalParams: { (): Object; }[]): void {
            this.writePreProcess(LogLevel.info, message, optionalParams);
        }

        public trace(message: () => Object, ...optionalParams: { (): Object; }[]): void {
            this.writePreProcess(LogLevel.trace, message, optionalParams);
        }

        public warn(message: () => Object, ...optionalParams: { (): Object; }[]): void {
            this.writePreProcess(LogLevel.warn, message, optionalParams);
        }

        public write(level: LogLevel, message: () => Object, ...optionalParams: { (): Object; }[]): void {
            this.writePreProcess(level, message, optionalParams);
        }
    }

    export class DebugRun extends _DebugBase implements DebugInner.IDebugRun {

        public production(action: () => void): void {
            this.run(Environment.Production, action);
        }

        public staging(action: () => void): void {
            this.run(Environment.Staging, action);
        }

        public local(action: () => void): void {
            this.run(Environment.Local, action);
        }

        public local2(action: () => void): void {
            this.run(Environment.Local2, action);
        }

        public run(environment: Environment, action: () => void): void {
            if (getEnvironment() >= environment)
                action();
        }
    }

    export var Debug: DebugInner.IDebug = new DebugBase();


    export module DebugInner {

        export interface IDebug {
            error: (message: Object, ...optionalParams: any[]) => void;
            debug: (message: Object, ...optionalParams: any[]) => void;
            log: (message: Object, ...optionalParams: any[]) => void;
            info: (message: Object, ...optionalParams: any[]) => void;
            trace: (message: Object, ...optionalParams: any[]) => void;
            warn: (message: Object, ...optionalParams: any[]) => void;
            write: (level: LogLevel, message: Object, ...optionalParams: any[]) => void;

            p: IDebugPostProcess;
            r: IDebugRun;

            generateDebugForName: (name: string) => IDebug;
            setLoggingLevel(level: LogLevel);
        }

        export interface IDebugPostProcess {
            error: (message: () => Object, ...optionalParams: { (): Object; }[]) => void;
            debug: (message: () => Object, ...optionalParams: { (): Object; }[]) => void;
            log: (message: () => Object, ...optionalParams: { (): Object; }[]) => void;
            info: (message: () => Object, ...optionalParams: { (): Object; }[]) => void;
            trace: (message: () => Object, ...optionalParams: { (): Object; }[]) => void;
            warn: (message: () => Object, ...optionalParams: { (): Object; }[]) => void;
            write: (level: LogLevel, message: () => Object, ...optionalParams: { (): Object; }[]) => void;
        }

        export interface IDebugRun {
            production: (action: () => void) => void;
            staging: (action: () => void) => void;
            local: (action: () => void) => void;
            local2: (action: () => void) => void;
            run: (environment: Environment, action: () => void) => void;
        }
    }
}

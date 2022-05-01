import { NS } from "@ns";

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export type ToastVariant = "info" | "success" | "warning" | "error" | undefined;
export type ToastDuration = number | null | undefined;

export class ToastOptions {
  constructor(
    readonly variant: ToastVariant,
    readonly duration: ToastDuration
  ) {}
}

export class Logger {
  private readonly DEFAULT_TOAST = false;
  private readonly DEFAULT_TOAST_OPTIONS = new ToastOptions(undefined, 2000);
  private readonly DEFAULT_TERMINAL = true;

  private _forceDisableToasts = false;

  constructor(private _ns: NS, private _minLevel: LogLevel) {}

  private log(
    level: LogLevel,
    message: string,
    toast: boolean,
    terminal: boolean,
    toastOptions: ToastOptions
  ): void {
    if (level >= this._minLevel) {
      this._ns.print(`${LogLevel[level]} ${message}`);

      if (terminal) {
        this._ns.tprint(`${LogLevel[level]} ${message}`);
      }

      if (!this._forceDisableToasts && toast) {
        this._ns.toast(message, toastOptions.variant, toastOptions.duration);
      }
    }
  }

  set forceDisableToasts(value: boolean) {
    this._forceDisableToasts = value;
  }

  get forceDisableToasts(): boolean {
    return this._forceDisableToasts;
  }

  debug(
    message: string,
    toast = this.DEFAULT_TOAST,
    terminal = this.DEFAULT_TERMINAL,
    toastOptions: ToastOptions = this.DEFAULT_TOAST_OPTIONS
  ): void {
    this.log(LogLevel.DEBUG, message, toast, terminal, toastOptions);
  }

  info(
    message: string,
    toast = this.DEFAULT_TOAST,
    terminal = this.DEFAULT_TERMINAL,
    toastOptions: ToastOptions = this.DEFAULT_TOAST_OPTIONS
  ): void {
    this.log(LogLevel.INFO, message, toast, terminal, toastOptions);
  }

  warn(
    message: string,
    toast = this.DEFAULT_TOAST,
    terminal = this.DEFAULT_TERMINAL,
    toastOptions: ToastOptions = this.DEFAULT_TOAST_OPTIONS
  ): void {
    return this.log(LogLevel.WARN, message, toast, terminal, toastOptions);
  }

  error(
    message: string,
    toast = this.DEFAULT_TOAST,
    terminal = this.DEFAULT_TERMINAL,
    toastOptions: ToastOptions = this.DEFAULT_TOAST_OPTIONS
  ): void {
    return this.log(LogLevel.ERROR, message, toast, terminal, toastOptions);
  }
}

export function getLogger(ns: NS, minLevel: LogLevel = LogLevel.INFO): Logger {
  return new Logger(ns, minLevel);
}

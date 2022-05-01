export function disableLog(ns: NS, fn: script): void {
  if (ns.isLogEnabled("disableLog")) {
    ns.disableLog("disableLog");
  }
  if (ns.isLogEnabled(fn)) {
    ns.disableLog(fn);
  }
}

export async function sleep(ns: NS, time: number): Promise<true> {
  disableLog(ns, "sleep");
  return ns.sleep(time);
}

export function runScript(
  ns: NS,
  server: string,
  script: string,
  ...args: string[]
): number {
  disableLog(ns, "getRunningScript");
  const running = ns.getRunningScript(script, server, ...args);

  if (running !== null) {
    return running.pid;
  }

  disableLog(ns, "getScriptRam");
  const scriptRam = ns.getScriptRam(script, server);

  disableLog(ns, "getServer");
  const { maxRam, ramUsed } = ns.getServer(server);
  const threads = Math.floor((maxRam - ramUsed) / scriptRam);

  if (threads > 0) {
    return ns.exec(script, server, threads, ...args);
  } else {
    return -1;
  }
}

export function formatMoney(v: number): string {
  const units = [" ", "k", "m", "b", "t"];
  let i = 0;

  while (v >= 1000 && i < units.length) {
    v /= 1000;
    i++;
  }

  return `$${v.toFixed(3)}${units[i]}`;
}

export function getAllServers(
  ns: NS,
  fromServer = "home",
  result = new Array<string>()
): string[] {
  disableLog(ns, "scan");

  const servers = ns.scan(fromServer);

  for (const server of servers) {
    if (!result.includes(server)) {
      result.push(server);
      getAllServers(ns, server, result);
    }
  }

  return result;
}

export function getTargets(ns: NS): string[] {
  return getAllServers(ns).filter((s) => !ns.getServer(s).purchasedByPlayer);
}

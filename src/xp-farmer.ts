import { NS } from "@ns";
import { getLogger, LogLevel } from "/lib/logging";
import { getTargets, runScript, sleep } from "/lib/utils";

export async function main(ns: NS): Promise<void> {
  const options = ns.flags([
    ["debug", false],
    ["local", false],
    ["max-count", 5],
    ["max-time", 5000],
    ["server-ram", 1048576],
  ]);
  const logger = getLogger(ns, options.debug ? LogLevel.DEBUG : LogLevel.INFO);
  const scriptName = "/bin/weaken.js";
  const waitTime = 500;
  const maxCount = options.local ? 1 : options["max-count"];
  const maxTime = options.local
    ? Number.POSITIVE_INFINITY
    : options["max-time"];
  const serverRam = options["server-ram"];

  if (options.debug) {
    ns.tail();
  }

  while (true) {
    const allServers = getTargets(ns)
      .map((s) =>
        Object.assign(
          {},
          {
            hostname: s,
            weakenTime: ns.getWeakenTime(s),
            rooted: ns.getServer(s).hasAdminRights,
            requiredSkills: ns.getServer(s).requiredHackingSkill,
          }
        )
      )
      .filter((s) => s.rooted)
      .filter((s) => s.requiredSkills <= ns.getPlayer().hacking)
      .filter((s) => s.weakenTime <= maxTime)
      .sort((a, b) => a.weakenTime - b.weakenTime)
      .slice(0, maxCount);

    if (allServers.length === 0) {
      logger.debug(`No servers to weaken`, false, false);
    }

    const purchasedServers = ns.getPurchasedServers();

    for (let i = 0; i < allServers.length; i++) {
      const target = allServers[i];
      const serverName = options.local ? "home" : `xp-farmer-${i + 1}`;

      if (!options.local) {
        if (!purchasedServers.includes(serverName)) {
          if (ns.purchaseServer(serverName, serverRam) === "") {
            logger.debug(`Unable to purchase server ${serverName}`);
            continue;
          } else {
            logger.info(`Purchased server ${serverName}`, true);
          }
        }

        if (!ns.fileExists(scriptName, serverName)) {
          if (!(await ns.scp(scriptName, serverName))) {
            logger.error(`Unable to copy ${scriptName} to ${serverName}`);
            continue;
          }
        }
      }

      runScript(ns, serverName, scriptName, target.hostname);
    }

    await sleep(ns, waitTime);
  }
}

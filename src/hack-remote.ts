import { NS } from "@ns";
import { getLogger, LogLevel } from "/lib/logging";
import { getTargets, runScript, sleep } from "/lib/utils";

export async function main(ns: NS): Promise<void> {
  const options = ns.flags([["debug", false]]);
  const logger = getLogger(ns, options.debug ? LogLevel.DEBUG : LogLevel.INFO);

  ns.disableLog("getHackingLevel");
  ns.disableLog("getServerRequiredHackingLevel");
  ns.disableLog("getServerMoneyAvailable");
  ns.disableLog("getServerMinSecurityLevel");
  ns.disableLog("getServerSecurityLevel");
  ns.disableLog("getServerMaxMoney");

  const allServers = getTargets(ns);
  const scripts = ["/bin/grow.js", "/bin/hack.js", "/bin/weaken.js"];

  while (true) {
    for (const serverName of allServers) {
      const {
        sshPortOpen,
        ftpPortOpen,
        httpPortOpen,
        smtpPortOpen,
        sqlPortOpen,
        purchasedByPlayer,
      } = ns.getServer(serverName);

      if (purchasedByPlayer) {
        continue;
      }

      if (ns.fileExists("BruteSSH.exe", "home") && !sshPortOpen) {
        logger.debug(`Opening SSH port on ${serverName}`, false, false);

        try {
          ns.brutessh(serverName);
          logger.info(`SSH port of ${serverName} is now open`, true, false);
        } catch {
          /* ignore */
        }
      }

      if (ns.fileExists("FTPCrack.exe", "home") && !ftpPortOpen) {
        logger.debug(`Opening FTP port on ${serverName}`, false, false);
        try {
          ns.ftpcrack(serverName);
          logger.info(`FTP port of ${serverName} is now open`, true, false);
        } catch {
          /* ignore */
        }
      }

      if (ns.fileExists("HTTPWorm.exe", "home") && !httpPortOpen) {
        logger.debug(`Opening HTTP port on ${serverName}`, false, false);
        try {
          ns.httpworm(serverName);
          logger.info(`HTTP port of ${serverName} is now open`, true, false);
        } catch {
          /* ignore */
        }
      }

      if (ns.fileExists("relaySMTP.exe", "home") && !smtpPortOpen) {
        logger.debug(`Opening SMTP port on ${serverName}`, false, false);
        try {
          ns.relaysmtp(serverName);
          logger.info(`SMTP port of ${serverName} is now open`, true, false);
        } catch {
          /* ignore */
        }
      }

      if (ns.fileExists("SQLInject.exe", "home") && !sqlPortOpen) {
        logger.debug(`Opening SQL port on ${serverName}`, false, false);
        try {
          ns.sqlinject(serverName);
          logger.info(`SMTP port of ${serverName} is now open`, true, false);
        } catch {
          /* ignore */
        }
      }

      if (!ns.hasRootAccess(serverName)) {
        if (
          ns.getServerRequiredHackingLevel(serverName) > ns.getHackingLevel()
        ) {
          continue;
        }

        const { numOpenPortsRequired, openPortCount } =
          ns.getServer(serverName);

        if (numOpenPortsRequired > openPortCount) {
          continue;
        }

        if (ns.fileExists("NUKE.exe", "home")) {
          try {
            ns.nuke(serverName);
            logger.info(`Nuked ${serverName} is not nuked`, true, false);
          } catch {
            continue;
          }
        }
      }

      for (const script of scripts) {
        if (!ns.fileExists(script, serverName)) {
          const r = await ns.scp(script, serverName);

          if (!r) {
            continue;
          }

          logger.info(`Copied ${script} to ${serverName}`, false, false);
        }
      }

      const moneyThreshold = ns.getServerMaxMoney(serverName) * 0.75;
      const securityThreshold = ns.getServerMinSecurityLevel(serverName) + 5;

      if (ns.getServerSecurityLevel(serverName) > securityThreshold) {
        runScript(ns, serverName, "/bin/weaken.js", serverName);
      } else if (ns.getServerMoneyAvailable(serverName) < moneyThreshold) {
        runScript(ns, serverName, "/bin/grow.js", serverName);
      } else {
        runScript(ns, serverName, "/bin/hack.js", serverName);
      }
    }

    await sleep(ns, 500);
  }
}

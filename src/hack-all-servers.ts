import { NS } from "@ns";

function getAllServers(
  ns: NS,
  fromServer = "home",
  result = new Set<string>()
): string[] {
  const servers = ns.scan(fromServer);

  for (const server of servers) {
    if (!result.has(server) && !server.startsWith("home")) {
      result.add(server);
      getAllServers(ns, server, result);
    }
  }

  return Array.from(result);
}

function runScript(
  ns: NS,
  server: string,
  script: string,
  ...args: string[]
): number {
  const requiredMemory = ns.getScriptRam(script, server);
  const usableRam = ns.getServerMaxRam(server) - ns.getServerUsedRam(server);
  const threads = Math.floor(usableRam / requiredMemory);

  if (threads > 0) {
    return ns.exec(script, server, threads, ...args);
  } else {
    return -1;
  }
}

export async function main(ns: NS): Promise<void> {
  const allServers = getAllServers(ns);
  const servers = new Array<string>();
  const scripts = ["/bin/grow.js", "/bin/hack.js", "/bin/weaken.js"];

  for (const server of allServers) {
    ns.tprint(`Checking vulnerabilities on ${server}...`);

    if (!ns.hasRootAccess(server)) {
      ns.tprint(`No root access on ${server}`);

      if (ns.fileExists("BruteSSH.exe", "home")) {
        ns.tprint(`Opening SSH port of ${server}...`);
        try {
          const r = ns.brutessh(server);
          ns.tprint(`SSH port of ${server} opened? ${r}`);
        } catch (e) {
          ns.tprint(`Failed to open SSH port of ${server}: ${e}`);
        }
      }

      if (ns.fileExists("FTPCrack.exe", "home")) {
        ns.tprint(`Opening FTP port of ${server}...`);
        try {
          const r = ns.ftpcrack(server);
          ns.tprint(`FTP port of ${server} opened? ${r}`);
        } catch (e) {
          ns.tprint(`Failed to open FTP port of ${server}: ${e}`);
        }
      }

      if (ns.fileExists("HTTPWorm.exe", "home")) {
        ns.tprint(`Opening HTTP port of ${server}...`);
        try {
          const r = ns.httpworm(server);
          ns.tprint(`HTTP port of ${server} opened? ${r}`);
        } catch (e) {
          ns.tprint(`Failed to open HTTP port of ${server}: ${e}`);
        }
      }

      if (ns.fileExists("relaySMTP.exe", "home")) {
        ns.tprint(`Opening SMTP port of ${server}...`);
        try {
          const r = ns.relaysmtp(server);
          ns.tprint(`SMTP port of ${server} opened? ${r}`);
        } catch (e) {
          ns.tprint(`Failed to open SMTP port of ${server}: ${e}`);
        }
      }

      if (ns.fileExists("SQLInject.exe", "home")) {
        ns.tprint(`Opening SQL port of ${server}...`);
        try {
          const r = ns.sqlinject(server);
          ns.tprint(`SQL port of ${server} opened? ${r}`);
        } catch (e) {
          ns.tprint(`Failed to open SQL port of ${server}: ${e}`);
        }
      }

      if (ns.fileExists("NUKE.exe", "home")) {
        ns.tprint(`Nuking ${server}...`);
        try {
          ns.nuke(server);
          ns.tprint(`Nuked ${server}: ${ns.hasRootAccess(server)}`);
        } catch (e) {
          ns.tprint(`Failed to nuke ${server}: ${e}`);
        }
      }
    }

    if (ns.hasRootAccess(server)) {
      servers.push(server);
    }
  }

  ns.tprint(`Hackable servers: ${servers.join(", ")}`);

  for (const server of servers) {
    ns.tprint(`Copying scripts to ${server}...`);
    await ns.scp(scripts, "home", server);
  }

  while (true) {
    for (const server of servers) {
      if (ns.getServerRequiredHackingLevel(server) > ns.getHackingLevel()) {
        continue;
      }

      const moneyThreshold = ns.getServerMaxMoney(server) * 0.75;
      const securityThreshold = ns.getServerMinSecurityLevel(server) + 5;

      if (ns.getServerSecurityLevel(server) > securityThreshold) {
        runScript(ns, server, "/bin/weaken.js", server);
      } else if (ns.getServerMoneyAvailable(server) < moneyThreshold) {
        runScript(ns, server, "/bin/grow.js", server);
      } else {
        runScript(ns, server, "/bin/hack.js", server);
      }
    }

    await ns.sleep(500);
  }
}

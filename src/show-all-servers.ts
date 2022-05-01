import { NS, Server } from "@ns";
import { table } from "./lib/graph";
import { formatMoney } from "./lib/utils";

type SortFunction = (a: Server, b: Server) => number;

function walk(
  ns: NS,
  knownServers = new Map<string, Server>(),
  fromServer = "home"
): Server[] {
  for (const server of ns.scan(fromServer)) {
    if (server === "home") {
      continue;
    }

    if (knownServers.get(server) !== undefined) {
      continue;
    }

    knownServers.set(server, ns.getServer(server));
    walk(ns, knownServers, server);
  }

  return Array.from(knownServers.values());
}

function sortByLevel(a: Server, b: Server): number {
  return a.requiredHackingSkill - b.requiredHackingSkill;
}

function sortByMoney(a: Server, b: Server): number {
  return b.moneyAvailable - a.moneyAvailable;
}

export async function main(ns: NS): Promise<void> {
  const options = ns.flags([
    ["filter-high", false],
    ["sort", "level"],
    ["reverse", false],
    ["help", false],
    ["h", false],
  ]);

  if (options["help"] || options["h"]) {
    ns.tprint(
      `usage: show-all-servers.js [--sort=<level|money>] [--reverse] [--filter-high]`
    );
    ns.exit();
  }

  const sortFunc =
    options["sort"] === "level"
      ? sortByLevel
      : options["sort"] === "money"
      ? sortByMoney
      : () => 0;

  const sortReverse = (f: SortFunction) => (a: Server, b: Server) =>
    f(a, b) * (options["reverse"] ? -1 : 1);

  const filterFunc = options["filter-high"]
    ? (s: Server) => s.requiredHackingSkill <= ns.getPlayer().hacking
    : () => true;

  const flag = (f: boolean): string => (f ? "Y" : "N");
  const knownServers = walk(ns);
  const header = [
    "Server",
    "Org",
    "SSH",
    "FTP",
    "SMTP",
    "HTTP",
    "SQL",
    "Hack level",
    "Available money",
  ];

  ns.tprint(
    "\n" +
      table(
        [
          header,
          ...knownServers
            .sort(sortReverse(sortFunc))
            .filter(filterFunc)
            .map((server) => {
              return [
                server.hostname,
                server.organizationName,
                flag(server.sshPortOpen),
                flag(server.ftpPortOpen),
                flag(server.smtpPortOpen),
                flag(server.httpPortOpen),
                flag(server.sqlPortOpen),
                server.requiredHackingSkill,
                formatMoney(server.moneyAvailable),
              ];
            }),
        ],
        undefined,
        [
          "left",
          "left",
          "center",
          "center",
          "center",
          "center",
          "center",
          "right",
          "right",
        ]
      )
  );
}

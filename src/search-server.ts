import { NS } from "@ns";

function walk(
  ns: NS,
  serverName: string,
  fromServer = "home",
  previousServers = Array<string>()
): Array<string> | null {
  const results: Array<Array<string>> = [];
  const servers = ns.scan(fromServer);

  for (const server of servers) {
    if (server === "home") {
      continue;
    }

    if (server === serverName) {
      return previousServers;
    }

    if (previousServers.includes(server)) {
      continue;
    }

    const result = walk(ns, serverName, server, [...previousServers, server]);

    if (result !== null) {
      results.push(result);
    }
  }

  if (!results.length) {
    return null;
  }

  return results.sort((a, b) => b.length - a.length)[0];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function autocomplete(data: AutocompleteData, args: string[]): string[] {
  return [...data.servers];
}

export async function main(ns: NS): Promise<void> {
  if (ns.args.length != 1) {
    ns.tprint("usage: run search-server.js <server-name>");
    ns.exit();
  }

  const serverName = <string>ns.args[0];
  const path = walk(ns, serverName);

  if (path === null) {
    ns.tprint(`No path found from home to ${serverName}`);
  } else {
    ns.tprint(`Path from home to ${serverName}: ${path.join(" -> ")}`);
  }
}

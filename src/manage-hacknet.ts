import { NS } from "@ns";

function getMyMoney(ns: NS) {
  return ns.getServerMoneyAvailable("home");
}

export async function main(ns: NS): Promise<void> {
  // src/Hacknet/data/Constants.ts
  const maxLevels = 200;
  const maxRam = 64;
  const maxCores = 16;

  ns.disableLog("getServerMoneyAvailable");
  ns.disableLog("sleep");

  while (true) {
    for (
      let levels = 1, ram = 1;
      (ns.hacknet.numNodes() && levels <= maxLevels) || ram <= maxRam;
      levels = Math.min(++levels, maxLevels), ram = Math.min(++ram, maxRam)
    ) {
      // Upgrade levels
      for (let i = 0; i < ns.hacknet.numNodes(); ++i) {
        while (ns.hacknet.getNodeStats(i).level < levels) {
          const cost = ns.hacknet.getLevelUpgradeCost(i, 1);

          while (cost > getMyMoney(ns)) {
            await ns.sleep(1000);
          }

          ns.hacknet.upgradeLevel(i, 1);
          ns.print(
            `Node ${i} is now level ${ns.hacknet.getNodeStats(i).level}`
          );
        }
      }

      // Upgrade RAM
      for (let i = 0; i < ns.hacknet.numNodes(); ++i) {
        while (ns.hacknet.getNodeStats(i).ram < ram) {
          const cost = ns.hacknet.getRamUpgradeCost(i, 1);

          while (cost > getMyMoney(ns)) {
            await ns.sleep(1000);
          }

          ns.hacknet.upgradeRam(i, 1);
          ns.print(
            `Node ${i} has now ${ns.hacknet.getNodeStats(i).ram} GB of RAM`
          );
        }
      }

      if (levels == maxLevels && ram == maxRam) {
        break;
      }
    }

    // Upgrade cores
    for (let cores = 1; ns.hacknet.numNodes() && cores <= maxCores; cores++) {
      for (let i = 0; i < ns.hacknet.numNodes(); ++i) {
        if (ns.hacknet.getNodeStats(i).cores < cores) {
          const cost = ns.hacknet.getCoreUpgradeCost(i, 1);

          while (cost > getMyMoney(ns)) {
            await ns.sleep(1000);
          }

          ns.hacknet.upgradeCore(i, 1);
          ns.print(
            `Node ${i} has now ${ns.hacknet.getNodeStats(i).cores} cores`
          );
        }
      }
    }

    // All current nodes are at max capacities. Purchase more.
    while (ns.hacknet.getPurchaseNodeCost() > getMyMoney(ns)) {
      await ns.sleep(1000);
    }

    const res = ns.hacknet.purchaseNode();
    ns.print(`Purchased node ${res}`);
  }
}

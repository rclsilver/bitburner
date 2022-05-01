import { NS } from "@ns";
import { getLogger, Logger, LogLevel } from "/lib/logging";
import { formatMoney, sleep } from "/lib/utils";

/**
 * Maximum reachable node level
 *
 * https://github.com/danielyxie/bitburner/blob/ab034f6f1a6f668cae9268bfe44ac35a6e753066/src/Hacknet/data/Constants.ts#L33
 */
const MAX_LEVEL = 200;

/**
 * Maximum reachable node ram
 *
 * https://github.com/danielyxie/bitburner/blob/ab034f6f1a6f668cae9268bfe44ac35a6e753066/src/Hacknet/data/Constants.ts#L34
 */
const MAX_RAM = 64;

/**
 * Maximum reachable node cores
 *
 * https://github.com/danielyxie/bitburner/blob/ab034f6f1a6f668cae9268bfe44ac35a6e753066/src/Hacknet/data/Constants.ts#L35
 */
const MAX_CORES = 16;

/**
 * Calculate the production of a node with specific parameters
 *
 * @see https://github.com/danielyxie/bitburner/blob/ab034f6f1a6f668cae9268bfe44ac35a6e753066/src/Hacknet/formulas/HacknetNodes.ts#L4
 *
 * @param level the node level
 * @param ram the amount of installed ram on the node
 * @param cores the count of installed cores on the node
 * @param playerMult the player multiplier
 *
 * @returns
 */
function calculateNodeProduction(
  level: number,
  ram: number,
  cores: number,
  playerMult: number
): number {
  const levelMult =
    level *
    1.5; /* https://github.com/danielyxie/bitburner/blob/ab034f6f1a6f668cae9268bfe44ac35a6e753066/src/Hacknet/data/Constants.ts#L21 */
  const ramMult = 1.035 ** (ram - 1);
  const coresMult = (cores + 5) / 6;

  // TODO: this works only with default bitnode.
  return levelMult * ramMult * coresMult * playerMult;
}

/**
 * Calculate the gain of a node with upgrades.
 *
 * @param ns The namespace of the script
 * @param node The node number
 * @param extraLevels extra levels to add to the node
 * @param extraRam extra ram to add to the node
 * @param extraCores extra cores to add to the node
 *
 * @returns the gain of the node with the upgrades
 */
function calculateNodeGain(
  ns: NS,
  node: number,
  extraLevels: number,
  extraRam: number,
  extraCores: number
): number {
  const { level, ram, cores, production } = ns.hacknet.getNodeStats(node);
  const playerMultiplier = ns.getPlayer().hacknet_node_money_mult;

  const targetLevel = Math.min(level + extraLevels, MAX_LEVEL);
  const targetRam = Math.min(ram + extraRam, MAX_RAM);
  const targetCores = Math.min(cores + extraCores, MAX_CORES);

  const newProduction = calculateNodeProduction(
    targetLevel,
    targetRam,
    targetCores,
    playerMultiplier
  );

  return newProduction - production;
}

/**
 * Calculate the median gain of nodes.
 *
 * @param ns The namespace of the script
 *
 * @returns Returns the median gain of nodes.
 */
function calculateMediaNodeGain(ns: NS): number {
  const playerMultiplier = ns.getPlayer().hacknet_node_money_mult;

  let totalLevels = 0;
  let totalRam = 0;
  let totalCores = 0;

  for (let i = 0; i < ns.hacknet.numNodes(); ++i) {
    const { level, ram, cores } = ns.hacknet.getNodeStats(i);

    totalLevels += level;
    totalRam += ram;
    totalCores += cores;
  }

  const medianLevels = Math.floor(totalLevels / ns.hacknet.numNodes());
  const medianRam = Math.floor(totalRam / ns.hacknet.numNodes());
  const medianCores = Math.floor(totalCores / ns.hacknet.numNodes());

  return calculateNodeProduction(
    medianLevels,
    medianRam,
    medianCores,
    playerMultiplier
  );
}

/**
 * Base Hacknet Node upgrade
 */
abstract class Upgrade {
  /**
   * @param ns The namespace of the script
   * @param node The node number
   * @param logger The logger of the script
   */
  constructor(
    protected ns: NS,
    protected node: number,
    protected logger: Logger
  ) {}

  /**
   * Upgrade the node.
   *
   * @returns Returns `true` if the upgrade was successful `false` otherwise
   */
  abstract upgrade(): boolean;

  /**
   * Get the cost of the upgrade.
   *
   * @returns the cost of the upgrade
   */
  abstract getCost(): number;

  /**
   * Get the gain of the upgrade.
   *
   * @returns the gain of the upgrade
   */
  abstract getGain(): number;

  /**
   * Get the gain / cost ratio of the upgrade.
   *
   * @returns the gain / cost ratio of the upgrade
   */
  getRatio(): number {
    return this.getGain() / this.getCost();
  }
}

/**
 * Hacknet Node level upgrade
 */
class LevelUpgrade extends Upgrade {
  /**
   * @param ns The namespace of the script
   * @param node The node number
   */
  constructor(ns: NS, node: number, logger: Logger) {
    super(ns, node, logger);
  }

  upgrade(): boolean {
    const { production } = this.ns.hacknet.getNodeStats(this.node);
    const r = this.ns.hacknet.upgradeLevel(this.node, 1);

    if (r) {
      const newProduction = this.ns.hacknet.getNodeStats(this.node).production;

      this.logger.info(
        `hacknet-node-${this.node} level upgrade. Gain: ${formatMoney(
          newProduction - production
        )}`,
        true,
        false
      );
    }

    return r;
  }

  getCost(): number {
    return this.ns.hacknet.getLevelUpgradeCost(this.node, 1);
  }

  getGain(): number {
    return calculateNodeGain(this.ns, this.node, 1, 0, 0);
  }
}

/**
 * Hacknet Node RAM upgrade
 */
class RamUpgrade extends Upgrade {
  /**
   * @param ns The namespace of the script
   * @param node The node number
   */
  constructor(ns: NS, node: number, logger: Logger) {
    super(ns, node, logger);
  }

  upgrade(): boolean {
    const { production } = this.ns.hacknet.getNodeStats(this.node);
    const r = this.ns.hacknet.upgradeRam(this.node, 1);

    if (r) {
      const newProduction = this.ns.hacknet.getNodeStats(this.node).production;

      this.logger.info(
        `hacknet-node-${this.node} RAM upgrade. Gain: ${formatMoney(
          newProduction - production
        )}`,
        true,
        false
      );
    }

    return r;
  }

  getCost(): number {
    return this.ns.hacknet.getRamUpgradeCost(this.node, 1);
  }

  getGain(): number {
    return calculateNodeGain(this.ns, this.node, 0, 1, 0);
  }
}

/**
 * Hacknet Node cores upgrade
 */
class CoreUpgrade extends Upgrade {
  /**
   * @param ns The namespace of the script
   * @param node The node number
   */
  constructor(ns: NS, node: number, logger: Logger) {
    super(ns, node, logger);
  }

  upgrade(): boolean {
    const { production } = this.ns.hacknet.getNodeStats(this.node);
    const r = this.ns.hacknet.upgradeCore(this.node, 1);

    if (r) {
      const newProduction = this.ns.hacknet.getNodeStats(this.node).production;

      this.logger.info(
        `hacknet-node-${this.node} cores upgrade. Gain: ${formatMoney(
          newProduction - production
        )}`,
        true,
        false
      );
    }

    return r;
  }

  getCost(): number {
    return this.ns.hacknet.getCoreUpgradeCost(this.node, 1);
  }

  getGain(): number {
    return calculateNodeGain(this.ns, this.node, 0, 0, 1);
  }
}

/**
 * Hacknet Nodes auto-upgrade
 *
 * @param ns The namespace of the script.
 */
export async function main(ns: NS): Promise<void> {
  const options = ns.flags([
    ["debug", false],
    ["wait-time", 100],
    ["disable-toasts", false],
    ["help", false],
    ["h", false],
  ]);
  if (options.help || options.h) {
    ns.tprint("This manages your hacknet nodes.");
    ns.tprint(`Usage: run ${ns.getScriptName()} [--debug] [--wait-time=100]`);
    ns.tprint("Example:");
    ns.tprint(`> run ${ns.getScriptName()} --wait-time=1000`);
    return;
  }
  const logger = getLogger(ns, options.debug ? LogLevel.DEBUG : LogLevel.INFO);
  logger.forceDisableToasts = options["disable-toasts"];

  while (true) {
    let bestUpgrade: Upgrade | undefined = undefined;

    const newNodeCost = ns.hacknet.getPurchaseNodeCost();
    const newNodeGain = calculateMediaNodeGain(ns);
    const newNodeRatio = newNodeGain / newNodeCost;

    for (let i = 0; i < ns.hacknet.numNodes(); ++i) {
      for (const upgrade of [
        new LevelUpgrade(ns, i, logger),
        new RamUpgrade(ns, i, logger),
        new CoreUpgrade(ns, i, logger),
      ]) {
        if (
          bestUpgrade === undefined ||
          bestUpgrade.getRatio() < upgrade.getRatio()
        ) {
          bestUpgrade = upgrade;
        }
      }
    }

    const money = ns.getPlayer().money;

    if (bestUpgrade === undefined || bestUpgrade.getRatio() < newNodeRatio) {
      if (money < newNodeCost) {
        logger.debug(
          `Not enough money to buy a new node. Missing ${formatMoney(
            newNodeCost - money
          )}`,
          false,
          false
        );
      } else {
        const node = ns.hacknet.purchaseNode();

        if (node > -1) {
          logger.info(`New node purchased: hacknet-node-${node}.`, true, false);
        }
      }
    } else {
      const cost = bestUpgrade.getCost();

      if (money < cost) {
        logger.debug(
          `Not enough money to upgrade the node. Missing ${formatMoney(
            cost - money
          )}`,
          true,
          false
        );
      } else {
        bestUpgrade.upgrade();
      }
    }

    await sleep(ns, options["wait-time"]);
  }
}

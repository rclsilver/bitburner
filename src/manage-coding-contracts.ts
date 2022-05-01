import { NS } from "@ns";
import { findAnswer } from "/lib/contracts";
import { getLogger, LogLevel } from "/lib/logging";
import { getAllServers } from "/lib/utils";

/**
 * Hacknet Nodes auto-upgrade
 *
 * @param ns The namespace of the script.
 */
export async function main(ns: NS): Promise<void> {
  const options = ns.flags([
    ["debug", false],
    ["disable-toasts", false],
    ["help", false],
    ["h", false],
  ]);
  if (options.help || options.h) {
    ns.tprint("This solve found coding contracts.");
    ns.tprint(
      `Usage: run ${ns.getScriptName()} [--debug] [--disable-toasts=100]`
    );
    ns.tprint("Example:");
    ns.tprint(`> run ${ns.getScriptName()}`);
    return;
  }
  const logger = getLogger(ns, options.debug ? LogLevel.DEBUG : LogLevel.INFO);
  logger.forceDisableToasts = options["disable-toasts"];

  ns.disableLog("sleep");
  ns.disableLog("scan");

  while (true) {
    const servers = getAllServers(ns);

    logger.debug(
      `Searching contracts on ${servers.length} servers.`,
      false,
      options.debug
    );

    const contracts = servers
      .map((hostname) => ({ hostname, contracts: ns.ls(hostname, ".cct") }))
      .filter((o) => o.contracts.length > 0)
      .map((o) =>
        o.contracts.map((contract) => ({ contract, hostname: o.hostname }))
      )
      .flat();

    if (!contracts.length) {
      logger.debug("No contracts found.", false, options.debug);
    } else {
      logger.info(`Found ${contracts.length} contracts.`, false, options.debug);

      for (const { contract, hostname } of contracts) {
        const type = ns.codingcontract.getContractType(contract, hostname);
        const data = ns.codingcontract.getData(contract, hostname);

        logger.info(
          `Found contract ${contract} on ${hostname}`,
          false,
          options.debug
        );

        const answer = findAnswer(type, data);

        if (answer === null) {
          logger.warn(`No solution found`, false, true);
          continue;
        }

        const result = ns.codingcontract.attempt(answer, contract, hostname, {
          returnReward: true,
        });

        if (result) {
          logger.info(
            `Solved contract ${contract} of ${hostname}. Reward: ${result}`,
            true
          );
        } else {
          logger.warn(
            `Failed to solve contract ${contract} of ${hostname}. Answer: ${JSON.stringify(
              answer
            )}`,
            true,
            true
          );
        }
      }
    }

    await ns.sleep(1000);
  }
}

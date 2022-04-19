import { NS } from '@ns'

export async function main(ns : NS) : Promise<void> {
    if (!ns.args.length) {
        ns.tprint('usage: weaken <target>');
    }else{
        await ns.weaken(<string>ns.args[0]);
    }
}
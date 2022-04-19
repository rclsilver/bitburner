import { NS } from '@ns'

export async function main(ns : NS) : Promise<void> {
    if (!ns.args.length) {
        ns.tprint('usage: hack <target>');
    }else{
        await ns.hack(<string>ns.args[0]);
    }
}
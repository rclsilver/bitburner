import { NS } from '@ns'

export async function main(ns : NS) : Promise<void> {
    if (!ns.args.length) {
        ns.tprint('usage: grow <target>');
    }else{
        await ns.grow(<string>ns.args[0]);
    }
}
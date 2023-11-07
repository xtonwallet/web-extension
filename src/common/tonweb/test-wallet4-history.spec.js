import TonWeb from "./index";
import {Cell} from "./toncore";
import {Buffer} from "buffer";
const getRawBody = (msg) => {
    const msg_data = msg?.msg_data;
    if (msg_data && msg_data['@type'] === 'msg.dataRaw' && msg_data.body) {
        return msg_data.body;
    }
    return null;
}

async function init() {
    const tonweb = new TonWeb(new TonWeb.HttpProvider('https://toncenter.com/api/v2/jsonRPC'));

    const txs = await tonweb.getTransactions('EQAtPMPoGXJzm6zvqeRcK6IzgJa8RpISp0xpMPgOgj5ggPtQ');

    // console.log(txs)

    for (let tx of txs) {
        if (!tx.in_msg.source) { // external message
            const rawBody = getRawBody(tx.in_msg);
            if (rawBody) {
                const cell = Cell.fromBase64(rawBody);
                const body = cell.bits._data;
                const offset = 512 / 8 + 32 / 8 + 32 / 8 + 32 / 8; // signature 512bit, walletId 32bit, valid_until 32bit, seqno 32bit
                const op = body[offset];
                const success = tx.out_msgs.length > 0;
                if (op === 0) {
                    console.log('simple transfer', {success});
                } else if (op === 1) {
                    console.log('deployAndInstallPlugin', {success});
                } else if (op === 2) {
                    console.log('installPlugin', {success});
                } else if (op === 3) {
                    console.log('removePlugin', {success});
                } else {
                    console.log('unknown op of external msg ', op)
                }
            } else {
                console.log('no-op or invalid external message');
            }
        } else { // internal
            const rawBody = getRawBody(tx.in_msg);
            if (rawBody && tx.out_msgs.length > 0) {
                const outMsg = tx.out_msgs[0];
                const ourRawBody = getRawBody(outMsg);
                const outCell = Cell.fromBase64(ourRawBody);
                const outBody = outCell.bits._data;
                const op = Buffer.from(outBody.slice(0, 4)).toString('hex'); // in hex
                if (op === 'f06c7567') {
                    console.log('payment wallet -> subscription')
                } else  {
                    console.log('unknown op ' + op)
                }
            } else {
                console.log('simple inbound transfer')
            }
        }
    }
}

init();

import BigNumber from "bignumber.js";
import {Cell} from "./../toncore";

class HttpProviderUtils {

    static parseObject(x) {
        const typeName = x['@type'];
        switch (typeName) {
            case 'tvm.list':
            case 'tvm.tuple':
                return x.elements.map(HttpProviderUtils.parseObject);
            case 'tvm.cell':
                return Cell.fromBase64(x.bytes);
            case 'tvm.stackEntryCell':
                return HttpProviderUtils.parseObject(x.cell);
            case 'tvm.stackEntryTuple':
                return HttpProviderUtils.parseObject(x.tuple);
            case 'tvm.stackEntryNumber':
                return HttpProviderUtils.parseObject(x.number);
            case 'tvm.numberDecimal':
                return new BigNumber(x.number, 10);
            default:
                throw new Error('unknown type ' + typeName);
        }
    }

    /**
     * @param pair  {any[]}
     * @return {any}
     */
    static parseResponseStack(pair) {
        const typeName = pair[0];
        const value = pair[1];

        switch (typeName) {
            case 'num':
                return new BigNumber(value.replace(/0x/, ''), 16);
            case 'list':
            case 'tuple':
                return HttpProviderUtils.parseObject(value);
            case 'cell':
                return Cell.fromBase64(value.bytes);
            default:
                throw new Error('unknown type ' + typeName);
        }
    }

    static parseResponse(result) {
        if (result.exit_code !== 0) {
            const err = new Error('http provider parse response error')
            err.result = result
            throw err
        }

        const arr = result.stack.map(HttpProviderUtils.parseResponseStack);
        return arr.length === 1 ? arr[0] : arr;
    }

    static makeArg(arg) {
        if (arg instanceof BigNumber || arg instanceof Number) {
            return ['num', arg];
        } else {
            throw new Error('unknown arg type ' + arg);
        }
    }

    static makeArgs(args) {
        return args.map(this.makeArg);
    }

}

export default HttpProviderUtils;

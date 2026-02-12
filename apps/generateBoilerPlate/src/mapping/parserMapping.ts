export const getParserType = (type: string) => {
    switch (type) {
        case 'int': return 'parseInt';
        case 'long': return 'parseLong';
        case 'double': return 'parseDouble';
        case 'bool': return 'parseBool';
        case 'char': return 'parseChar';
        case 'string': return 'parseString';
        case 'int[]': return 'parseVectorInt';
        case 'long[]': return 'parseVectorLong';
        case 'double[]': return 'parseVectorDouble';
        case 'bool[]': return 'parseVectorBool';
        case 'char[]': return 'parseVectorChar';
        case 'string[]': return 'parseVectorString';
        case 'int[][]': return 'parseGridInt';
        case 'long[][]': return 'parseGridLong';
        case 'double[][]': return 'parseGridDouble';
        case 'bool[][]': return 'parseGridBool';
        case 'char[][]': return 'parseGridChar';
        case 'string[][]': return 'parseGridString';
        case 'TreeNode': return 'parseTreeNode';
        case 'ListNode': return 'parseListNode';
        default: throw new Error(`Unknown type: ${type}`);
    }
}

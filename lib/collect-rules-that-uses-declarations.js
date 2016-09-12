var utils = require('./utils');

module.exports = function(ast) {
   var result = [];

   ast.walkRules(function(rule) {
        if(rule.nodes.some(isNodeUsesCustomVariable)) {
            result.push(rule);
        }
    });

    return result;
};

function isNodeUsesCustomVariable(node) {
    return node.type === 'decl' &&
           utils.CUSTOM_VARIABLE_REGEXP.test(node.value) &&
           !utils.CUSTOM_VARIABLE_REGEXP.test(node.prop);
}

// my-babel-plugin.js
module.exports = function () {
  return {
    name: "babel-plugin",
    visitor: {
      JSXElement(path) {
        const { node } = path;

        if (node.openingElement.name.name !== 'Declaration') {
          return;
        }

        const attributes = node.openingElement.attributes;
        let varName = null;
        let varValue = null;

        for (const attr of attributes) {
          if (attr.name.name === 'var') {
            varName = attr.value.value;
          } else if (attr.name.name === 'value') {
            if (attr.value.expression) {
              varValue = attr.value.expression;
            } else {
              varValue = attr.value;
            }
          }
        }

        if (!varName || !varValue) {
          return;
        }

        const variableDeclaration = {
          type: 'VariableDeclaration',
          kind: 'var',
          declarations: [{
            type: 'VariableDeclarator',
            id: {
              type: 'Identifier',
              name: varName
            },
            init: varValue
          }]
        };

        path.replaceWith(variableDeclaration);
      }
    }
  };
};

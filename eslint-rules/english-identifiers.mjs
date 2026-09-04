/** @typedef {import('eslint').Rule.RuleModule} RuleModule */

/** Spanish legacy identifiers from PLAN.md — blocked in new architecture code. */
const SPANISH_IDENTIFIER_DENYLIST = new Set([
  "clientes",
  "productos",
  "facturas",
  "grupos",
  "matriculas",
  "vistaActiva",
  "nombreApp",
  "subtituloApp",
  "tipoImpuestos",
  "ivaDefecto",
  "irpfDefecto",
  "metodosPago",
  "colorFactura",
  "logoFactura",
  "separadorDni",
  "gastosFijos",
  "datosAcademia",
  "tamañoFuente",
  "fuenteApp",
  "navegarConAccion",
  "setVistaActiva",
  "setClientes",
  "setProductos",
  "setFacturas",
  "setGrupos",
  "setMatriculas",
  "setGastosFijos",
  "setDatosAcademia",
  "setTamañoFuente",
  "setFuenteApp",
  "setTipoImpuestos",
  "setIvaDefecto",
  "setIrpfDefecto",
  "setMoneda",
  "setColorFactura",
  "setLogoFactura",
  "setSeparadorDni",
]);

const ASCII_IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;

/** @type {RuleModule} */
export const englishIdentifiersRule = {
  meta: {
    type: "suggestion",
    docs: {
      description:
        "Require ASCII English identifiers. Spanish legacy names are blocked in new architecture code.",
    },
    messages: {
      nonAscii: 'Identifier "{{name}}" must use ASCII characters only (English identifiers).',
      spanish:
        'Identifier "{{name}}" is a legacy Spanish name. Use English identifiers (see PLAN.md rename map).',
    },
    schema: [],
  },
  create(context) {
    /**
     * @param {import('estree').Node} node
     * @param {string} name
     */
    function check(node, name) {
      if (!ASCII_IDENTIFIER.test(name)) {
        context.report({ node, messageId: "nonAscii", data: { name } });
        return;
      }

      if (SPANISH_IDENTIFIER_DENYLIST.has(name)) {
        context.report({ node, messageId: "spanish", data: { name } });
      }
    }

    return {
      /** @param {import('estree').VariableDeclarator} node */
      VariableDeclarator(node) {
        if (node.id.type === "Identifier") {
          check(node.id, node.id.name);
        }
      },
      /** @param {import('estree').FunctionDeclaration} node */
      FunctionDeclaration(node) {
        if (node.id) {
          check(node.id, node.id.name);
        }
      },
      /** @param {import('estree').Identifier} node */
      "FunctionExpression, ArrowFunctionExpression"(node) {
        if (node.id) {
          check(node.id, node.id.name);
        }
      },
      /** @param {import('estree').Identifier} node */
      Parameter(node) {
        check(node, node.name);
      },
      /** @param {import('estree').Property} node */
      "TSPropertySignature, PropertyDefinition"(node) {
        if (node.key.type === "Identifier" && !node.computed) {
          check(node.key, node.key.name);
        }
      },
      /** @param {import('estree').ImportSpecifier} node */
      ImportSpecifier(node) {
        const name = node.local.name;
        check(node.local, name);
      },
    };
  },
};

export const englishIdentifiersPlugin = {
  rules: {
    "english-identifiers": englishIdentifiersRule,
  },
};

import fs from 'fs/promises';

export async function transpileFile(path) {
  const code = await fs.readFile(path, 'utf8');
  return transpile(code);
}

export function transpile(code) {

  //rimozione commenti
  // Solo linee che iniziano con # o spazi seguiti da #
  code = code.replace(/^\s*#.*$/gm, '');

  // 0. Shorthand per log multiplo
  code = code.replace(/^\s*log\s+(.+)/gm, (_, args) => {
    return `console.log(${args.trim().split(/\s+/).join(', ')});`;
  });

  // 1. Infer map/filter/reduce
  code = code.replace(
    /(\w+)\s+fn\s+([a-zA-Z_]\w*)\s*(?:,\s*([a-zA-Z_]\w*))?\s*->\s*(\{[\s\S]*?\}|\S.+)/g,
    (_, arr, p1, p2, expr) => {
      const params = p2 ? `(${p1}, ${p2})` : `(${p1})`;
      if (p2) {
        // Funzione multilinea per il reduce
        return `${arr}.reduce(${params} => ${expr}, "0")`;
      } else {
        const isFilter = /(==|!=|<=|>=|<|>)/.test(expr.trim());
        const method = isFilter ? 'filter' : 'map';
        return `${arr}.${method}(${params} => ${expr})`;
      }
    }
  );


  // 2. Funzioni dichiarate via `fn`
  code = code.replace(/fn\s+([a-zA-Z_]\w*)\s*->\s*\{([\s\S]*?)\}/g, '($1) => {$2}');
  code = code.replace(/fn\s+([a-zA-Z_]\w*)\s*->\s*(?!\{)(.+)/g, '($1) => $2');

  // 3. Float precision
  code = code.replace(/(\d+\.\d+)\s*\+\s*(\d+\.\d+)/g, `Decimal('$1').plus('$2')`);

  // 4. Implicit let
  code = code
    .split('\n')
    .map(line => {
      if (/^\s*([a-zA-Z_]\w*)\s*=/.test(line) && !/^\s*(let|const|var)\s/.test(line)) {
        return line.replace(/^(\s*)([a-zA-Z_]\w*)\s*=/, '$1let $2 =');
      }
      return line;
    })
    .join('\n');

  // 5. Ciclo for in (custom)
  code = code.replace(
    /for\s*\(\s*([a-zA-Z_]\w*)\s*,\s*([a-zA-Z_]\w*)\s*in\s*([a-zA-Z_]\w*)\s*\)\s*\{/g,
    'for (let $2 = 0; $2 < $3.length; $2++) { let $1 = $3[$2];'
  );

  code = code.replace(
    /for\s*\(\s*([a-zA-Z_]\w*)\s*in\s*([a-zA-Z_]\w*)\s*\)\s*\{/g,
    'for (let $1 of $2) {'
  );


  return `import Decimal from 'decimal.js';\n\n${code}`;
}





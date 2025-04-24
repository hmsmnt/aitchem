import fs from 'fs/promises';

export async function transpileFile(path) {
  const code = await fs.readFile(path, 'utf8');
  return transpile(code);
}

export function transpile(code) {
  // 1. Infer map/filter/reduce
  code = code.replace(
    /(\w+)\s+fn\s+([a-zA-Z_]\w*)\s*(?:,\s*([a-zA-Z_]\w*))?\s*->\s*(.+)/g,
    (_, arr, p1, p2, expr) => {
      const params = p2 ? `(${p1}, ${p2})` : `(${p1})`;
      if (p2) {
        return `${arr}.reduce(${params} => ${expr})`;
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

  return `import Decimal from 'decimal.js';\n\n${code}`;
}





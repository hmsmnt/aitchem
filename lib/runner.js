import { transpileFile } from './transpiler.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

export async function runFile(file) {
  const transpiled = await transpileFile(file);
  const outputPath = file.replace(/\.hm$/, '.js');

  await fs.writeFile(outputPath, transpiled);

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const fullPath = path.resolve(__dirname, '..', outputPath);

  await import(pathToFileURL(fullPath).href);
}

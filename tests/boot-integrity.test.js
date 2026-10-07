import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

/**
 * Boot integrity guard (blank-screen regression).
 *
 * The single-file bundle concatenates every module into ONE classic script, so all
 * top-level `function` declarations are hoisted before any statement runs. A bridge
 * such as `window.render = function(){ return render(...) }` therefore overwrites the
 * real function and calls itself forever: `RangeError: Maximum call stack size exceeded`
 * during init(), leaving the app with an empty #app element and no visible error.
 *
 * These tests fail if such a self-recursive bridge is reintroduced anywhere.
 */

const MODULAR_DIR = path.join(process.cwd(), 'app-modular', 'js');

function listJsFiles(dir, acc = []) {
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    if (fs.statSync(full).isDirectory()) listJsFiles(full, acc);
    else if (full.endsWith('.js')) acc.push(full);
  }
  return acc;
}

/** Removes string literal contents so quoted text is never mistaken for a call. */
function stripStringLiterals(source) {
  return source
    .replace(/`[^`]*`/g, '``')
    .replace(/'[^'\n]*'/g, "''")
    .replace(/"[^"\n]*"/g, '""');
}

/** Finds `window.<name> = function (...) { ... <name>( ... ) ... }` self-recursions. */
function findSelfRecursiveBridges(source) {
  const code = stripStringLiterals(source);
  const hits = [];
  const declaration = /window\.([A-Za-z0-9_$]+)\s*=\s*function\s*\(/g;
  let match;

  while ((match = declaration.exec(code))) {
    const name = match[1];
    const braceStart = code.indexOf('{', declaration.lastIndex);
    if (braceStart === -1) continue;

    let depth = 0;
    let end = -1;
    for (let i = braceStart; i < code.length; i++) {
      if (code[i] === '{') depth++;
      else if (code[i] === '}') {
        depth--;
        if (depth === 0) { end = i; break; }
      }
    }
    if (end === -1) continue;

    const body = code.slice(braceStart + 1, end);
    const selfCall = new RegExp('\\b' + name.replace(/\$/g, '\\$') + '\\s*\\(');
    if (selfCall.test(body)) hits.push(name);
  }
  return hits;
}

describe('Boot integrity — no self-recursive window bridges', () => {
  it('detects the known blank-screen pattern (positive control)', () => {
    const broken = "window.state = state;\nwindow.render = function(...args){ if(typeof render === 'function') return render(...args); };";
    expect(findSelfRecursiveBridges(broken)).toEqual(['render']);
  });

  it('ignores a bridge that forwards to a separate function reference', () => {
    const fixed = 'const _renderBridgeTarget = render;\nwindow.render = function(...args){ return _renderBridgeTarget.apply(this, args); };';
    expect(findSelfRecursiveBridges(fixed)).toEqual([]);
  });

  it('ignores neighbour functions that legitimately call the same global', () => {
    const neighbours = 'window.toggleInvoiceSelection = function(invId){ window.selectInvoice(invId); };\nwindow.handleInvoiceRowClick = function(invId){ window.toggleInvoiceSelection(invId); };';
    expect(findSelfRecursiveBridges(neighbours)).toEqual([]);
  });

  it('finds no self-recursive bridge in any modular source file', () => {
    const offenders = listJsFiles(MODULAR_DIR)
      .map((file) => ({ file: path.relative(process.cwd(), file), names: findSelfRecursiveBridges(fs.readFileSync(file, 'utf8')) }))
      .filter((entry) => entry.names.length > 0);

    expect(offenders).toEqual([]);
  });

  it('keeps window.render bound to a captured reference, not to itself', () => {
    const stateSource = fs.readFileSync(path.join(MODULAR_DIR, 'core', '07-state.js'), 'utf8');
    const code = stripStringLiterals(stateSource);
    const bridge = code.slice(code.indexOf('window.render = function'));
    const body = bridge.slice(0, bridge.indexOf('};'));

    expect(body).toContain('_renderBridgeTarget');
    expect(/\brender\s*\(/.test(body)).toBe(false);
  });
});

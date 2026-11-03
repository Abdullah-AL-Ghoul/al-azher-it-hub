/**
 * CSP-Safe Client-Side Code Evaluators for Al-Azhar IT Hub
 * Supports:
 * 1. CodingArena JS challenge runner (zero eval / zero new Function — safe under strict CSP script-src 'self')
 * 2. CodePlayground Python 3 subset interpreter
 * 3. CodePlayground Relational SQL engine (Students, Courses, Enrollments)
 * 4. CodePlayground C++17 stream & container interpreter
 */

// ============================================================================
// 1. CSP-SAFE JAVASCRIPT CHALLENGE EVALUATOR (CodingArena)
// ============================================================================

/**
 * Parses a JSON-like argument list string such as `"[-1,0,3,5,9,12], 9"` or `'"alazher"'`
 * into actual JS values without eval.
 * @param {string} rawArgs
 * @returns {Array<any>}
 */
export function parseTestCaseInput(rawArgs) {
  const s = String(rawArgs || '').trim()
  if (!s) return []
  try {
    return JSON.parse(`[${s}]`)
  } catch {
    return [s]
  }
}

/**
 * Tokenizes and evaluates a safe JavaScript function submission against test inputs
 * without using `eval()` or `new Function()` (100% compliant with strict CSP `script-src 'self'`).
 *
 * @param {string} userCode
 * @param {string} rawInput
 * @returns {any}
 */
export function evaluateArenaChallenge(userCode, rawInput) {
  const code = String(userCode || '').trim()
  if (!code) throw new Error('Empty function code')

  const fnMatch = code.match(/function\s+([a-zA-Z_$][\w$]*)\s*\(([^)]*)\)\s*\{([\s\S]*)\}/)
  if (!fnMatch) {
    throw new Error('SyntaxError: Expected function declaration `function name(params) { ... }`')
  }

  const paramNames = fnMatch[2]
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean)
  const body = fnMatch[3].trim()
  if (!body) return undefined

  const args = parseTestCaseInput(rawInput)
  const env = Object.create(null)
  paramNames.forEach((name, idx) => {
    env[name] = structuredCloneSafe(args[idx])
  })

  const res = executeJsBlock(body, env)
  if (res && typeof res === 'object' && res.type === RETURN_SIGNAL) {
    return res.value
  }
  return res
}

function structuredCloneSafe(val) {
  if (Array.isArray(val)) return val.map(structuredCloneSafe)
  if (val && typeof val === 'object') return { ...val }
  return val
}

function stripJsComments(src) {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '')
}

function splitTopLevelStatements(src) {
  const clean = stripJsComments(src)
  const stmts = []
  let current = ''
  let depthBrace = 0
  let depthParen = 0
  let depthBracket = 0
  let inQuote = null

  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i]
    const prev = i > 0 ? clean[i - 1] : ''
    if (inQuote) {
      current += ch
      if (ch === inQuote && prev !== '\\') inQuote = null
      continue
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      inQuote = ch
      current += ch
      continue
    }
    if (ch === '{') depthBrace++
    else if (ch === '}') {
      depthBrace--
      if (depthBrace < 0) throw new Error('SyntaxError: Unexpected `}`')
    } else if (ch === '(') depthParen++
    else if (ch === ')') depthParen--
    else if (ch === '[') depthBracket++
    else if (ch === ']') depthBracket--

    if ((ch === ';' || ch === '\n') && depthBrace === 0 && depthParen === 0 && depthBracket === 0) {
      if (current.trim()) stmts.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  if (depthBrace !== 0 || depthParen !== 0 || depthBracket !== 0) {
    throw new Error('SyntaxError: Unbalanced brackets or parentheses')
  }
  if (current.trim()) stmts.push(current.trim())

  const merged = []
  for (let i = 0; i < stmts.length; i++) {
    const s = stmts[i].trim()
    if (/^else\b/.test(s) && merged.length > 0) {
      merged[merged.length - 1] += ' ' + s
    } else {
      merged.push(s)
    }
  }
  return merged
}

const RETURN_SIGNAL = Symbol('RETURN')

function executeJsBlock(blockSrc, env, maxSteps = 5000) {
  const stmts = splitTopLevelStatements(blockSrc)
  let steps = 0

  for (let i = 0; i < stmts.length; i++) {
    if (++steps > maxSteps) throw new Error('RangeError: Maximum loop execution limit exceeded')
    const res = executeJsStatement(stmts[i], env, () => {
      if (++steps > maxSteps) throw new Error('RangeError: Maximum loop execution limit exceeded')
    })
    if (res && typeof res === 'object' && res.type === RETURN_SIGNAL) {
      return res
    }
  }
  return undefined
}

function extractBalancedHeader(stmt, keyword) {
  const afterKw = stmt.slice(keyword.length).trim()
  if (!afterKw.startsWith('(')) return null
  let depth = 0
  let inQuote = null
  for (let i = 0; i < afterKw.length; i++) {
    const ch = afterKw[i]
    const prev = i > 0 ? afterKw[i - 1] : ''
    if (inQuote) {
      if (ch === inQuote && prev !== '\\') inQuote = null
      continue
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      inQuote = ch
      continue
    }
    if (ch === '(') depth++
    else if (ch === ')') {
      depth--
      if (depth === 0) {
        return {
          header: afterKw.slice(1, i).trim(),
          rest: afterKw.slice(i + 1).trim(),
        }
      }
    }
  }
  return null
}

function unwrapBraces(bodyStr) {
  const s = bodyStr.trim()
  if (s.startsWith('{') && s.endsWith('}')) {
    return s.slice(1, -1).trim()
  }
  return s
}

function executeJsStatement(rawStmt, env, tick) {
  tick()
  const stmt = rawStmt.trim()
  if (!stmt) return undefined

  // 1. return statement
  if (/^return\b/.test(stmt)) {
    const expr = stmt.replace(/^return\b/, '').replace(/;$/, '').trim()
    return { type: RETURN_SIGNAL, value: expr ? evalJsExpr(expr, env) : undefined }
  }

  // 2. for loop (`for (let char of s)` or `for (let i = 0; i < n; i++)`)
  if (/^for\s*\(/.test(stmt)) {
    const parsed = extractBalancedHeader(stmt, 'for')
    if (!parsed) throw new Error(`SyntaxError: Invalid for loop: ${stmt}`)
    const bodySrc = unwrapBraces(parsed.rest)
    const ofMatch = parsed.header.match(/^(?:let|const|var)\s+([a-zA-Z_$][\w$]*)\s+of\s+([\s\S]+)$/)
    if (ofMatch) {
      const varName = ofMatch[1]
      const iterable = evalJsExpr(ofMatch[2], env)
      const items = typeof iterable === 'string' ? iterable.split('') : Array.from(iterable || [])
      for (const item of items) {
        tick()
        env[varName] = item
        const r = executeJsBlock(bodySrc, env)
        if (r && r.type === RETURN_SIGNAL) return r
      }
      return undefined
    }

    const parts = parsed.header.split(';')
    if (parts.length === 3) {
      const [initStmt, condExpr, stepStmt] = parts
      if (initStmt.trim()) executeJsStatement(initStmt.trim(), env, tick)
      while (condExpr.trim() ? Boolean(evalJsExpr(condExpr.trim(), env)) : true) {
        tick()
        const r = executeJsBlock(bodySrc, env)
        if (r && r.type === RETURN_SIGNAL) return r
        if (stepStmt.trim()) executeJsStatement(stepStmt.trim(), env, tick)
      }
      return undefined
    }
  }

  // 3. while loop
  if (/^while\s*\(/.test(stmt)) {
    const parsed = extractBalancedHeader(stmt, 'while')
    if (!parsed) throw new Error(`SyntaxError: Invalid while loop: ${stmt}`)
    const bodySrc = unwrapBraces(parsed.rest)
    while (evalJsExpr(parsed.header, env)) {
      tick()
      const r = executeJsBlock(bodySrc, env)
      if (r && r.type === RETURN_SIGNAL) return r
    }
    return undefined
  }

  // 4. if / else statement
  if (/^if\s*\(/.test(stmt)) {
    const parsed = extractBalancedHeader(stmt, 'if')
    if (!parsed) throw new Error(`SyntaxError: Invalid if statement: ${stmt}`)
    const { thenPart, elsePart } = splitIfElseBody(parsed.rest)
    if (evalJsExpr(parsed.header, env)) {
      return executeJsBlock(unwrapBraces(thenPart), env)
    } else if (elsePart) {
      return executeJsBlock(unwrapBraces(elsePart), env)
    }
    return undefined
  }

  // 5. Variable declaration: let / const / var x = expr, y = expr
  const declMatch = stmt.match(/^(?:let|const|var)\s+([\s\S]+)$/)
  if (declMatch) {
    const varsRaw = declMatch[1].replace(/;$/, '').trim()
    const decls = splitTopLevelCommas(varsRaw)
    for (const d of decls) {
      const singleMatch = d.trim().match(/^([a-zA-Z_$][\w$]*)\s*(?:=\s*([\s\S]+))?$/)
      if (singleMatch) {
        const varName = singleMatch[1]
        const rhs = singleMatch[2] ? singleMatch[2].trim() : undefined
        env[varName] = rhs !== undefined ? evalJsExpr(rhs, env) : undefined
      }
    }
    return undefined
  }

  // 6. Increment / decrement: i++, i--, ++i, --i
  const incMatch = stmt.match(/^([a-zA-Z_$][\w$]*)\s*(\+\+|--)$/) || stmt.match(/^(\+\+|--)\s*([a-zA-Z_$][\w$]*)$/)
  if (incMatch) {
    const isPostfix = stmt.endsWith('++') || stmt.endsWith('--')
    const varName = isPostfix ? incMatch[1] : incMatch[2]
    const op = isPostfix ? incMatch[2] : incMatch[1]
    env[varName] = Number(env[varName] || 0) + (op === '++' ? 1 : -1)
    return undefined
  }

  // 7. Compound assignment: x += expr, x -= expr
  const compMatch = stmt.match(/^([a-zA-Z_$][\w$]*)\s*(\+=|-=|\*=|\/=)\s*([\s\S]+)$/)
  if (compMatch) {
    const [, varName, op, rhsRaw] = compMatch
    const rhs = evalJsExpr(rhsRaw.replace(/;$/, '').trim(), env)
    if (op === '+=') env[varName] = env[varName] + rhs
    else if (op === '-=') env[varName] = env[varName] - rhs
    else if (op === '*=') env[varName] = env[varName] * rhs
    else if (op === '/=') env[varName] = env[varName] / rhs
    return undefined
  }

  // 8. Array element assignment: arr[idx] = expr
  const arrAssignMatch = stmt.match(/^([a-zA-Z_$][\w$]*)\[([^\]]+)\]\s*=\s*([\s\S]+)$/)
  if (arrAssignMatch) {
    const [, arrName, idxExpr, rhsExpr] = arrAssignMatch
    const target = env[arrName]
    const idx = evalJsExpr(idxExpr, env)
    const val = evalJsExpr(rhsExpr.replace(/;$/, '').trim(), env)
    if (target && typeof target === 'object') target[idx] = val
    return undefined
  }

  // 9. Simple assignment: x = expr
  const assignMatch = stmt.match(/^([a-zA-Z_$][\w$]*)\s*=\s*([^=][\s\S]*)$/)
  if (assignMatch) {
    const [, varName, rhs] = assignMatch
    env[varName] = evalJsExpr(rhs.replace(/;$/, '').trim(), env)
    return undefined
  }

  // 10. Expression statement (e.g., stack.push(char))
  evalJsExpr(stmt.replace(/;$/, '').trim(), env)
  return undefined
}

function splitIfElseBody(rest) {
  const s = rest.trim()
  if (s.startsWith('{')) {
    let depth = 0
    let inQuote = null
    for (let i = 0; i < s.length; i++) {
      const ch = s[i]
      const prev = i > 0 ? s[i - 1] : ''
      if (inQuote) {
        if (ch === inQuote && prev !== '\\') inQuote = null
        continue
      }
      if (ch === '"' || ch === "'" || ch === '`') {
        inQuote = ch
        continue
      }
      if (ch === '{') depth++
      else if (ch === '}') {
        depth--
        if (depth === 0) {
          const thenPart = s.slice(0, i + 1).trim()
          const after = s.slice(i + 1).trim()
          if (/^else\b/.test(after)) {
            return { thenPart, elsePart: after.replace(/^else\b/, '').trim() }
          }
          return { thenPart, elsePart: null }
        }
      }
    }
  }
  // Single-line then body potentially followed by else
  const elseIdx = s.search(/\belse\b/)
  if (elseIdx !== -1) {
    return {
      thenPart: s.slice(0, elseIdx).trim(),
      elsePart: s.slice(elseIdx + 4).trim(),
    }
  }
  return { thenPart: s, elsePart: null }
}

function splitByOperatorOutsideParens(expr, op) {
  let depthParen = 0
  let depthBracket = 0
  let depthBrace = 0
  let inQuote = null
  let lastIndex = -1

  for (let i = 0; i <= expr.length - op.length; i++) {
    const ch = expr[i]
    const prev = i > 0 ? expr[i - 1] : ''

    if (inQuote) {
      if (ch === inQuote && prev !== '\\') inQuote = null
      continue
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      inQuote = ch
      continue
    }
    if (ch === '(') depthParen++
    else if (ch === ')') depthParen--
    else if (ch === '[') depthBracket++
    else if (ch === ']') depthBracket--
    else if (ch === '{') depthBrace++
    else if (ch === '}') depthBrace--

    if (depthParen === 0 && depthBracket === 0 && depthBrace === 0) {
      if (expr.slice(i, i + op.length) === op) {
        const before = i > 0 ? expr[i - 1] : ''
        const after = expr[i + op.length] || ''
        if ((op === '+' || op === '-') && i === 0) continue
        if ((op === '+' || op === '-') && /[+\-*/%=<>!&|,([]/.test(before.trim())) continue
        if (op === '<' && (after === '=' || before === '<')) continue
        if (op === '>' && (after === '=' || before === '>')) continue
        if (op === '==' && (after === '=' || before === '!' || before === '=')) continue
        if (op === '!=' && after === '=') continue
        lastIndex = i
      }
    }
  }

  if (lastIndex !== -1) {
    return [expr.slice(0, lastIndex).trim(), expr.slice(lastIndex + op.length).trim()]
  }
  return null
}

function splitTopLevelCommas(str) {
  const res = []
  let cur = ''
  let depth = 0
  let inQuote = null
  for (let i = 0; i < str.length; i++) {
    const ch = str[i]
    const prev = i > 0 ? str[i - 1] : ''
    if (inQuote) {
      cur += ch
      if (ch === inQuote && prev !== '\\') inQuote = null
      continue
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      inQuote = ch
      cur += ch
      continue
    }
    if (ch === '(' || ch === '[' || ch === '{') depth++
    else if (ch === ')' || ch === ']' || ch === '}') depth--
    if (ch === ',' && depth === 0) {
      res.push(cur.trim())
      cur = ''
    } else {
      cur += ch
    }
  }
  if (cur.trim()) res.push(cur.trim())
  return res
}

function evalJsExpr(rawExpr, env) {
  const expr = String(rawExpr || '').trim()
  if (!expr) return undefined

  // Strip outer balanced parens
  if (expr.startsWith('(') && expr.endsWith(')')) {
    let depth = 0
    let balanced = true
    let inQuote = null
    for (let i = 0; i < expr.length; i++) {
      const ch = expr[i]
      const prev = i > 0 ? expr[i - 1] : ''
      if (inQuote) {
        if (ch === inQuote && prev !== '\\') inQuote = null
        continue
      }
      if (ch === '"' || ch === "'" || ch === '`') {
        inQuote = ch
        continue
      }
      if (ch === '(') depth++
      else if (ch === ')') depth--
      if (depth === 0 && i < expr.length - 1) {
        balanced = false
        break
      }
    }
    if (balanced) return evalJsExpr(expr.slice(1, -1), env)
  }

  // Literals
  if (expr === 'true') return true
  if (expr === 'false') return false
  if (expr === 'null') return null
  if (expr === 'undefined') return undefined
  if (/^-?\d+(\.\d+)?$/.test(expr)) return Number(expr)
  if ((expr.startsWith('"') && expr.endsWith('"')) || (expr.startsWith("'") && expr.endsWith("'"))) {
    return expr.slice(1, -1)
  }

  // Array literal `[...]`
  if (expr.startsWith('[') && expr.endsWith(']')) {
    const inner = expr.slice(1, -1).trim()
    if (!inner) return []
    return splitTopLevelCommas(inner).map((item) => evalJsExpr(item, env))
  }

  // Object literal `{...}`
  if (expr.startsWith('{') && expr.endsWith('}')) {
    const inner = expr.slice(1, -1).trim()
    if (!inner) return {}
    const obj = {}
    for (const pair of splitTopLevelCommas(inner)) {
      const colonIdx = pair.indexOf(':')
      if (colonIdx !== -1) {
        const kRaw = pair.slice(0, colonIdx).trim()
        const vRaw = pair.slice(colonIdx + 1).trim()
        const key = (kRaw.startsWith('"') || kRaw.startsWith("'")) ? kRaw.slice(1, -1) : kRaw
        obj[key] = evalJsExpr(vRaw, env)
      }
    }
    return obj
  }

  // Binary operators by precedence (lowest to highest)
  const opsGroups = [
    ['||'],
    ['&&'],
    ['===', '!==', '==', '!='],
    ['<=', '>=', '<', '>'],
    ['+', '-'],
    ['*', '/', '%'],
  ]

  for (const group of opsGroups) {
    for (const op of group) {
      const split = splitByOperatorOutsideParens(expr, op)
      if (split) {
        const [leftRaw, rightRaw] = split
        if (op === '||') return Boolean(evalJsExpr(leftRaw, env)) || Boolean(evalJsExpr(rightRaw, env))
        if (op === '&&') return Boolean(evalJsExpr(leftRaw, env)) && Boolean(evalJsExpr(rightRaw, env))
        const l = evalJsExpr(leftRaw, env)
        const r = evalJsExpr(rightRaw, env)
        switch (op) {
          case '===': return l === r
          case '!==': return l !== r
          case '==': return l == r
          case '!=': return l != r
          case '<=': return l <= r
          case '>=': return l >= r
          case '<': return l < r
          case '>': return l > r
          case '+': return l + r
          case '-': return l - r
          case '*': return l * r
          case '/': return l / r
          case '%': return l % r
        }
      }
    }
  }

  // Unary `!` or `-`
  if (expr.startsWith('!')) return !evalJsExpr(expr.slice(1), env)
  if (expr.startsWith('-')) return -evalJsExpr(expr.slice(1), env)

  // Built-in Math helpers: Math.floor, Math.max, Math.min, Math.abs, Math.ceil
  const mathMatch = expr.match(/^Math\.(floor|ceil|round|max|min|abs)\(([\s\S]*)\)$/)
  if (mathMatch) {
    const fn = mathMatch[1]
    const callArgs = splitTopLevelCommas(mathMatch[2]).map((a) => evalJsExpr(a, env))
    return Math[fn](...callArgs)
  }

  // Method calls: `arr.reduce(...)`, `stack.push(...)`, `stack.pop()`, `str.split('').reverse().join('')`
  const methodChainMatch = expr.match(/^([a-zA-Z_$][\w$]*)\.([a-zA-Z_$][\w$]*)\(([\s\S]*)\)$/)
  if (methodChainMatch) {
    const [, objName, methodName, argsRaw] = methodChainMatch
    const target = env[objName]
    if (target === undefined || target === null) {
      throw new Error(`TypeError: Cannot read properties of undefined (reading '${methodName}')`)
    }
    if (methodName === 'reduce' && Array.isArray(target)) {
      const reduceParts = splitTopLevelCommas(argsRaw)
      const arrowSrc = reduceParts[0]
      const initVal = reduceParts.length > 1 ? evalJsExpr(reduceParts[1], env) : 0
      const arrowMatch = arrowSrc.match(/^\(\s*([a-zA-Z_$][\w$]*)\s*,\s*([a-zA-Z_$][\w$]*)\s*\)\s*=>\s*([\s\S]+)$/)
      if (arrowMatch) {
        const [, accName, curName, bodyExpr] = arrowMatch
        return target.reduce((acc, cur) => {
          const childEnv = { ...env, [accName]: acc, [curName]: cur }
          return evalJsExpr(bodyExpr, childEnv)
        }, initVal)
      }
    }
    const callArgs = argsRaw.trim() ? splitTopLevelCommas(argsRaw).map((a) => evalJsExpr(a, env)) : []
    if (typeof target[methodName] === 'function') {
      return target[methodName](...callArgs)
    }
  }

  // Property access: `arr.length`, `str.length`
  const propMatch = expr.match(/^([a-zA-Z_$][\w$]*)\.([a-zA-Z_$][\w$]*)$/)
  if (propMatch) {
    const [, objName, propName] = propMatch
    const target = env[objName]
    return target != null ? target[propName] : undefined
  }

  // Index access: `arr[idx]`, `map[char]`
  const idxMatch = expr.match(/^([a-zA-Z_$][\w$]*)\[([\s\S]+)\]$/)
  if (idxMatch) {
    const [, objName, idxExpr] = idxMatch
    const target = env[objName]
    const idx = evalJsExpr(idxExpr, env)
    return target != null ? target[idx] : undefined
  }

  // Variable lookup
  if (expr in env) return env[expr]

  throw new Error(`ReferenceError: ${expr} is not defined`)
}

// ============================================================================
// 2. PYTHON 3 SUBSET INTERPRETER (CodePlayground)
// ============================================================================

/**
 * Executes a Python 3 script in-browser and returns captured stdout lines.
 * Supports variables, lists, dicts, comprehensions (`sum(...)`), `def` functions,
 * `for` / `while` / `if-elif-else`, `print()` with f-strings, and arithmetic.
 *
 * @param {string} code
 * @returns {string}
 */
export function executePythonCode(code) {
  const rawLines = String(code || '').replace(/\r\n/g, '\n').split('\n')
  const logs = []
  const env = Object.create(null)
  const functions = Object.create(null)

  // Collapse multi-line list/dict literals so top-level assignments parse cleanly
  const lines = collapseMultilineStructures(rawLines)

  function evalPyExpr(raw, localEnv = env) {
    const s = String(raw || '').trim()
    if (!s) return ''

    // String repetition: "=" * 45
    const repMatch = s.match(/^(["'])(.*?)\1\s*\*\s*(\d+)$/)
    if (repMatch) {
      return repMatch[2].repeat(Number(repMatch[3]))
    }

    // f-string: f"..." or f'...'
    if ((s.startsWith('f"') && s.endsWith('"')) || (s.startsWith("f'") && s.endsWith("'"))) {
      const inner = s.slice(2, -1).replace(/\\n/g, '\n')
      return inner.replace(/\{([^}]+)\}/g, (_, exprPart) => {
        const [valExpr, fmtSpec] = exprPart.split(':')
        const val = evalPyExpr(valExpr.trim(), localEnv)
        if (fmtSpec) {
          if (fmtSpec.endsWith('f')) {
            const decimals = parseInt(fmtSpec.replace('.', ''), 10) || 2
            return Number(val).toFixed(decimals)
          }
          if (fmtSpec.startsWith('<')) {
            const width = parseInt(fmtSpec.slice(1), 10) || 0
            return String(val).padEnd(width, ' ')
          }
        }
        return Array.isArray(val) ? `[${val.join(', ')}]` : String(val ?? '')
      })
    }

    // Regular string
    if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
      return s.slice(1, -1).replace(/\\n/g, '\n')
    }

    if (s === 'True') return true
    if (s === 'False') return false
    if (s === 'None') return null
    if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s)

    // List literal `[...]`
    if (s.startsWith('[') && s.endsWith(']')) {
      const inner = s.slice(1, -1).trim()
      if (!inner) return []
      return splitTopLevelCommas(inner).map((el) => evalPyExpr(el, localEnv))
    }

    // Dict literal `{...}`
    if (s.startsWith('{') && s.endsWith('}')) {
      const inner = s.slice(1, -1).trim()
      if (!inner) return {}
      const obj = {}
      for (const pair of splitTopLevelCommas(inner)) {
        const colonIdx = pair.indexOf(':')
        if (colonIdx !== -1) {
          const k = evalPyExpr(pair.slice(0, colonIdx).trim(), localEnv)
          const v = evalPyExpr(pair.slice(colonIdx + 1).trim(), localEnv)
          obj[k] = v
        }
      }
      return obj
    }

    // sum(expr for var in iterable)
    const sumGenMatch = s.match(/^sum\(\s*([\s\S]+?)\s+for\s+([a-zA-Z_]\w*)\s+in\s+([a-zA-Z_]\w*)\s*\)$/)
    if (sumGenMatch) {
      const [, itemExpr, iterVar, listName] = sumGenMatch
      const list = localEnv[listName] ?? env[listName] ?? []
      return list.reduce((acc, item) => {
        const child = { ...localEnv, [iterVar]: item }
        return acc + Number(evalPyExpr(itemExpr, child) || 0)
      }, 0)
    }

    // sum(list)
    const sumListMatch = s.match(/^sum\(\s*([\s\S]+)\s*\)$/)
    if (sumListMatch) {
      const arr = evalPyExpr(sumListMatch[1], localEnv)
      return Array.isArray(arr) ? arr.reduce((a, b) => a + Number(b || 0), 0) : 0
    }

    // len(x)
    const lenMatch = s.match(/^len\(\s*([\s\S]+)\s*\)$/)
    if (lenMatch) {
      const target = evalPyExpr(lenMatch[1], localEnv)
      return target?.length ?? 0
    }

    // User-defined function call `fn(arg1, arg2)`
    const fnCallMatch = s.match(/^([a-zA-Z_]\w*)\(([\s\S]*)\)$/)
    if (fnCallMatch && functions[fnCallMatch[1]]) {
      const fnDef = functions[fnCallMatch[1]]
      const callArgs = fnCallMatch[2].trim()
        ? splitTopLevelCommas(fnCallMatch[2]).map((a) => evalPyExpr(a, localEnv))
        : []
      const fnEnv = { ...env }
      fnDef.params.forEach((p, idx) => {
        fnEnv[p] = callArgs[idx]
      })
      const ret = runPyBlock(fnDef.body, fnEnv)
      return ret && ret.type === RETURN_SIGNAL ? ret.value : null
    }

    // Comparisons & arithmetic (`//` integer division handled first)
    const pyOps = [
      ['==', '!=', '<=', '>=', '<', '>'],
      ['+', '-'],
      ['//', '*', '/', '%'],
    ]
    for (const group of pyOps) {
      for (const op of group) {
        const split = splitByOperatorOutsideParens(s, op)
        if (split) {
          const l = evalPyExpr(split[0], localEnv)
          const r = evalPyExpr(split[1], localEnv)
          switch (op) {
            case '==': return l === r
            case '!=': return l !== r
            case '<=': return l <= r
            case '>=': return l >= r
            case '<': return l < r
            case '>': return l > r
            case '+': return l + r
            case '-': return l - r
            case '//': return Math.floor(Number(l) / Number(r))
            case '*': return typeof l === 'string' ? l.repeat(Number(r)) : l * r
            case '/': return l / r
            case '%': return l % r
          }
        }
      }
    }

    // Strip outer parens
    if (s.startsWith('(') && s.endsWith(')')) {
      return evalPyExpr(s.slice(1, -1), localEnv)
    }

    // Indexing `arr[mid]` or `c["credits"]`
    const idxMatch = s.match(/^([a-zA-Z_]\w*)\[([\s\S]+)\]$/)
    if (idxMatch) {
      const target = localEnv[idxMatch[1]] ?? env[idxMatch[1]]
      const key = evalPyExpr(idxMatch[2], localEnv)
      return target != null ? target[key] : undefined
    }

    if (s in localEnv) return localEnv[s]
    if (s in env) return env[s]
    return s
  }

  function runPyBlock(blockLines, localEnv) {
    let i = 0
    let guard = 0
    while (i < blockLines.length) {
      if (++guard > 5000) throw new Error('RuntimeError: Maximum execution steps exceeded')
      const lineObj = blockLines[i]
      const trimmed = lineObj.text.trim()
      if (!trimmed || trimmed.startsWith('#')) {
        i++
        continue
      }

      // Function definition
      const defMatch = trimmed.match(/^def\s+([a-zA-Z_]\w*)\s*\(([^)]*)\)\s*:$/)
      if (defMatch) {
        const fnName = defMatch[1]
        const params = defMatch[2].split(',').map((p) => p.trim()).filter(Boolean)
        const { subBlock, nextIndex } = collectIndentedBlock(blockLines, i + 1, lineObj.indent)
        functions[fnName] = { params, body: subBlock }
        i = nextIndex
        continue
      }

      // Return statement
      if (/^return\b/.test(trimmed)) {
        const retExpr = trimmed.replace(/^return\b/, '').trim()
        if (retExpr.includes(',')) {
          const tupleVals = splitTopLevelCommas(retExpr).map((p) => evalPyExpr(p, localEnv))
          return { type: RETURN_SIGNAL, value: tupleVals }
        }
        return { type: RETURN_SIGNAL, value: evalPyExpr(retExpr, localEnv) }
      }

      // print(...)
      const printMatch = trimmed.match(/^print\(([\s\S]*)\)$/)
      if (printMatch) {
        const args = printMatch[1].trim() ? splitTopLevelCommas(printMatch[1]) : []
        const rendered = args.map((a) => {
          const val = evalPyExpr(a, localEnv)
          return Array.isArray(val) ? `[${val.join(', ')}]` : String(val ?? '')
        })
        logs.push(rendered.join(' '))
        i++
        continue
      }

      // for var in iterable:
      const forMatch = trimmed.match(/^for\s+([a-zA-Z_]\w*)\s+in\s+([\s\S]+):$/)
      if (forMatch) {
        const [, iterVar, iterExpr] = forMatch
        const { subBlock, nextIndex } = collectIndentedBlock(blockLines, i + 1, lineObj.indent)
        let list = []
        const rangeMatch = iterExpr.trim().match(/^range\(([^)]+)\)$/)
        if (rangeMatch) {
          const rArgs = splitTopLevelCommas(rangeMatch[1]).map((a) => Number(evalPyExpr(a, localEnv)))
          const start = rArgs.length > 1 ? rArgs[0] : 0
          const end = rArgs.length > 1 ? rArgs[1] : rArgs[0]
          const step = rArgs[2] || 1
          for (let k = start; step > 0 ? k < end : k > end; k += step) list.push(k)
        } else {
          list = evalPyExpr(iterExpr.trim(), localEnv) || []
        }
        for (const item of list) {
          localEnv[iterVar] = item
          const r = runPyBlock(subBlock, localEnv)
          if (r && r.type === RETURN_SIGNAL) return r
        }
        i = nextIndex
        continue
      }

      // while condition:
      const whileMatch = trimmed.match(/^while\s+([\s\S]+):$/)
      if (whileMatch) {
        const condExpr = whileMatch[1].trim()
        const { subBlock, nextIndex } = collectIndentedBlock(blockLines, i + 1, lineObj.indent)
        let loopSteps = 0
        while (evalPyExpr(condExpr, localEnv)) {
          if (++loopSteps > 2000) throw new Error('RuntimeError: Infinite while loop terminated')
          const r = runPyBlock(subBlock, localEnv)
          if (r && r.type === RETURN_SIGNAL) return r
        }
        i = nextIndex
        continue
      }

      // if / elif / else chain
      if (/^if\s+[\s\S]+:$/.test(trimmed)) {
        const branches = []
        let curIdx = i
        while (curIdx < blockLines.length) {
          const curLine = blockLines[curIdx]
          if (curLine.indent !== lineObj.indent) break
          const t = curLine.text.trim()
          if (t.startsWith('if ') && t.endsWith(':')) {
            const cond = t.slice(3, -1).trim()
            const { subBlock, nextIndex } = collectIndentedBlock(blockLines, curIdx + 1, lineObj.indent)
            branches.push({ cond, subBlock })
            curIdx = nextIndex
          } else if (t.startsWith('elif ') && t.endsWith(':')) {
            const cond = t.slice(5, -1).trim()
            const { subBlock, nextIndex } = collectIndentedBlock(blockLines, curIdx + 1, lineObj.indent)
            branches.push({ cond, subBlock })
            curIdx = nextIndex
          } else if (t === 'else:') {
            const { subBlock, nextIndex } = collectIndentedBlock(blockLines, curIdx + 1, lineObj.indent)
            branches.push({ cond: 'True', subBlock })
            curIdx = nextIndex
            break
          } else {
            break
          }
        }
        for (const b of branches) {
          if (evalPyExpr(b.cond, localEnv)) {
            const r = runPyBlock(b.subBlock, localEnv)
            if (r && r.type === RETURN_SIGNAL) return r
            break
          }
        }
        i = curIdx
        continue
      }

      // Compound assignment `steps += 1`
      const compMatch = trimmed.match(/^([a-zA-Z_]\w*)\s*(\+=|-=|\*=)\s*([\s\S]+)$/)
      if (compMatch) {
        const [, varName, op, rhsRaw] = compMatch
        const val = evalPyExpr(rhsRaw, localEnv)
        if (op === '+=') localEnv[varName] = (localEnv[varName] ?? 0) + val
        else if (op === '-=') localEnv[varName] = (localEnv[varName] ?? 0) - val
        else if (op === '*=') localEnv[varName] = (localEnv[varName] ?? 0) * val
        i++
        continue
      }

      // Tuple unpacking assignment: `idx, total_steps = binary_search(...)`
      const tupleAssign = trimmed.match(/^([a-zA-Z_]\w*\s*,\s*[a-zA-Z_]\w*)\s*=\s*([\s\S]+)$/)
      if (tupleAssign) {
        const names = tupleAssign[1].split(',').map((n) => n.trim())
        const res = evalPyExpr(tupleAssign[2], localEnv)
        if (Array.isArray(res)) {
          names.forEach((n, idx) => {
            localEnv[n] = res[idx]
          })
        }
        i++
        continue
      }

      // Simple assignment `x = expr`
      const assignMatch = trimmed.match(/^([a-zA-Z_]\w*)\s*=\s*([^=][\s\S]*)$/)
      if (assignMatch) {
        localEnv[assignMatch[1]] = evalPyExpr(assignMatch[2], localEnv)
        i++
        continue
      }

      // Standalone expression
      evalPyExpr(trimmed, localEnv)
      i++
    }
    return null
  }

  runPyBlock(lines, env)
  return logs.length > 0 ? logs.join('\n') : '>>> تم تنفيذ الكود بنجاح (0 مخرجات طباعة).'
}

function collapseMultilineStructures(rawLines) {
  const result = []
  let buffer = ''
  let baseIndent = 0
  let depth = 0

  for (const raw of rawLines) {
    const commentStripped = raw.replace(/^\s*#.*$/, '')
    if (!commentStripped.trim() && depth === 0) continue
    const indent = raw.match(/^\s*/)[0].length
    const trimmed = raw.trim()

    if (depth === 0) {
      baseIndent = indent
      buffer = trimmed
    } else {
      buffer += ' ' + trimmed
    }

    for (const ch of trimmed) {
      if (ch === '[' || ch === '{' || ch === '(') depth++
      else if (ch === ']' || ch === '}' || ch === ')') depth = Math.max(0, depth - 1)
    }

    if (depth === 0 && buffer) {
      result.push({ indent: baseIndent, text: buffer })
      buffer = ''
    }
  }
  if (buffer) result.push({ indent: baseIndent, text: buffer })
  return result
}

function collectIndentedBlock(lines, startIdx, parentIndent) {
  const subBlock = []
  let i = startIdx
  while (i < lines.length) {
    if (lines[i].indent <= parentIndent) break
    subBlock.push(lines[i])
    i++
  }
  return { subBlock, nextIndex: i }
}

// ============================================================================
// 3. RELATIONAL SQL ENGINE (CodePlayground)
// ============================================================================

const INITIAL_SQL_DB = {
  students: [
    { id: 20220299, name: 'عبد الله الغول', major: 'هندسة البرمجيات', gpa: 95.8, completed_hours: 120 },
    { id: 20220140, name: 'سارة خالد', major: 'علوم الحاسوب', gpa: 94.2, completed_hours: 104 },
    { id: 20220101, name: 'أحمد محمود', major: 'هندسة البرمجيات', gpa: 91.5, completed_hours: 98 },
    { id: 20220215, name: 'نور الدين علي', major: 'الوسائط وتطوير الويب', gpa: 88.7, completed_hours: 90 },
    { id: 20220188, name: 'محمد النجار', major: 'نظم المعلومات', gpa: 86.0, completed_hours: 82 },
    { id: 20220350, name: 'لينا دحلان', major: 'علوم الحاسوب', gpa: 84.5, completed_hours: 76 },
    { id: 20220412, name: 'عمر النجار', major: 'هندسة البرمجيات', gpa: 79.0, completed_hours: 68 },
  ],
  courses: [
    { id: 1, code: 'ITCS2301', title: 'هياكل البيانات', credits: 3 },
    { id: 2, code: 'ITIS2305', title: 'نظم قواعد البيانات', credits: 3 },
    { id: 3, code: 'ITSE3302', title: 'هندسة البرمجيات 1', credits: 3 },
    { id: 4, code: 'ITMM3301', title: 'تطوير تطبيقات الويب', credits: 3 },
  ],
  enrollments: [
    { student_id: 20220299, course_id: 1, semester: 'خريف 2025', grade: 98 },
    { student_id: 20220299, course_id: 2, semester: 'خريف 2025', grade: 96 },
    { student_id: 20220140, course_id: 1, semester: 'خريف 2025', grade: 94 },
    { student_id: 20220215, course_id: 4, semester: 'خريف 2025', grade: 93 },
    { student_id: 20220101, course_id: 3, semester: 'خريف 2025', grade: 92 },
    { student_id: 20220188, course_id: 2, semester: 'خريف 2025', grade: 85 },
    { student_id: 20220350, course_id: 1, semester: 'خريف 2025', grade: 81 },
  ],
}

/**
 * Executes a SQL SELECT query against the in-memory Al-Azhar university relational tables.
 * Supports SELECT projections/aliases, COUNT/AVG/ROUND/MAX/MIN/SUM aggregates,
 * JOINs across Students/Courses/Enrollments, WHERE filters, GROUP BY, ORDER BY, and LIMIT.
 *
 * @param {string} rawSql
 * @returns {{ columns: string[], rows: string[][] }}
 */
export function executeSqlQuery(rawSql) {
  const cleaned = String(rawSql || '')
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\s+/g, ' ')
    .replace(/;\s*$/, '')
    .trim()

  if (!cleaned) throw new Error('Empty SQL query')
  if (!/^select\b/i.test(cleaned)) {
    throw new Error('Only SELECT queries are supported in the interactive academic sandbox')
  }

  const selectMatch = cleaned.match(
    /^SELECT\s+([\s\S]+?)\s+FROM\s+([a-zA-Z_]\w*)(?:\s+([a-zA-Z_]\w*))?([\s\S]*)$/i
  )
  if (!selectMatch) {
    throw new Error('SyntaxError: Expected SELECT <columns> FROM <table>')
  }

  const selectClause = selectMatch[1].trim()
  const baseTableName = selectMatch[2].toLowerCase()
  const baseAlias = (selectMatch[3] && !/^(where|join|inner|left|group|order|limit)$/i.test(selectMatch[3]))
    ? selectMatch[3].toLowerCase()
    : baseTableName

  const tail = (selectMatch[3] && /^(where|join|inner|left|group|order|limit)$/i.test(selectMatch[3]))
    ? `${selectMatch[3]} ${selectMatch[4] || ''}`.trim()
    : (selectMatch[4] || '').trim()

  if (!INITIAL_SQL_DB[baseTableName]) {
    throw new Error(`Unknown table "${selectMatch[2]}". Available tables: Students, Courses, Enrollments`)
  }

  // Build initial rows with both prefixed (`s.name`) and unprefixed (`name`) keys
  let workingRows = INITIAL_SQL_DB[baseTableName].map((r) => {
    const row = {}
    for (const [k, v] of Object.entries(r)) {
      row[k] = v
      row[`${baseTableName}.${k}`] = v
      row[`${baseAlias}.${k}`] = v
    }
    return row
  })

  // Parse JOIN clauses
  const joinRegex = /(?:INNER\s+|LEFT\s+)?JOIN\s+([a-zA-Z_]\w*)(?:\s+([a-zA-Z_]\w*))?\s+ON\s+([a-zA-Z_.]+\s*=\s*[a-zA-Z_.]+)/gi
  let joinMatch
  while ((joinMatch = joinRegex.exec(tail)) !== null) {
    const joinTable = joinMatch[1].toLowerCase()
    const joinAlias = joinMatch[2] ? joinMatch[2].toLowerCase() : joinTable
    const [leftCol, rightCol] = joinMatch[3].split('=').map((s) => s.trim().toLowerCase())
    const targetRows = INITIAL_SQL_DB[joinTable]
    if (!targetRows) throw new Error(`Unknown joined table "${joinMatch[1]}"`)

    const nextRows = []
    for (const existing of workingRows) {
      for (const candidate of targetRows) {
        const candRow = {}
        for (const [k, v] of Object.entries(candidate)) {
          candRow[`${joinTable}.${k}`] = v
          candRow[`${joinAlias}.${k}`] = v
          if (!(k in existing)) candRow[k] = v
        }
        const merged = { ...existing, ...candRow }
        if (merged[leftCol] !== undefined && merged[leftCol] === merged[rightCol]) {
          nextRows.push(merged)
        }
      }
    }
    workingRows = nextRows
  }

  // Extract WHERE, GROUP BY, ORDER BY, LIMIT clauses
  const whereMatch = tail.match(/\bWHERE\s+([\s\S]+?)(?=\bGROUP\s+BY\b|\bORDER\s+BY\b|\bLIMIT\b|$)/i)
  const groupMatch = tail.match(/\bGROUP\s+BY\s+([\s\S]+?)(?=\bORDER\s+BY\b|\bLIMIT\b|$)/i)
  const orderMatch = tail.match(/\bORDER\s+BY\s+([\s\S]+?)(?=\bLIMIT\b|$)/i)
  const limitMatch = tail.match(/\bLIMIT\s+(\d+)/i)

  if (whereMatch) {
    const condStr = whereMatch[1].trim()
    workingRows = workingRows.filter((row) => evaluateSqlWhere(row, condStr))
  }

  const selectSpecs = splitTopLevelCommas(selectClause).map(parseSelectSpec)

  // Handle GROUP BY or global aggregation
  const hasAggregates = selectSpecs.some((s) => s.aggFunc)
  let projectedObjects = []

  if (groupMatch || hasAggregates) {
    const groupCol = groupMatch ? groupMatch[1].trim().toLowerCase() : '__all__'
    const groups = new Map()
    for (const r of workingRows) {
      const key = groupCol === '__all__' ? '__all__' : r[groupCol]
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key).push(r)
    }

    for (const [, groupRows] of groups.entries()) {
      const outObj = {}
      for (const spec of selectSpecs) {
        outObj[spec.alias] = computeAggregateOrColumn(spec, groupRows)
      }
      projectedObjects.push(outObj)
    }
  } else {
    if (selectClause.trim() === '*') {
      const cols = Object.keys(INITIAL_SQL_DB[baseTableName][0] || {})
      projectedObjects = workingRows.map((r) => {
        const o = {}
        cols.forEach((c) => { o[c] = r[c] })
        return o
      })
    } else {
      projectedObjects = workingRows.map((r) => {
        const o = {}
        for (const spec of selectSpecs) {
          o[spec.alias] = r[spec.colKey] ?? r[spec.colKey.split('.').pop()] ?? ''
        }
        return o
      })
    }
  }

  // ORDER BY
  if (orderMatch) {
    const orderParts = orderMatch[1].trim().split(/\s+/)
    const orderColRaw = orderParts[0].toLowerCase()
    const orderColShort = orderColRaw.split('.').pop()
    const desc = /^desc$/i.test(orderParts[1] || '')
    projectedObjects.sort((a, b) => {
      const va = a[orderColRaw] ?? a[orderColShort] ?? 0
      const vb = b[orderColRaw] ?? b[orderColShort] ?? 0
      const na = Number(va)
      const nb = Number(vb)
      const cmp = (!Number.isNaN(na) && !Number.isNaN(nb))
        ? na - nb
        : String(va).localeCompare(String(vb))
      return desc ? -cmp : cmp
    })
  }

  // LIMIT
  if (limitMatch) {
    projectedObjects = projectedObjects.slice(0, Number(limitMatch[1]))
  }

  const columns = selectClause.trim() === '*'
    ? Object.keys(INITIAL_SQL_DB[baseTableName][0] || {})
    : selectSpecs.map((s) => s.alias)

  const rows = projectedObjects.map((obj) =>
    columns.map((c) => String(obj[c] ?? ''))
  )

  return { columns, rows }
}

function parseSelectSpec(raw) {
  const asMatch = raw.match(/^([\s\S]+?)\s+AS\s+([a-zA-Z_]\w*)$/i)
  const expr = (asMatch ? asMatch[1] : raw).trim()
  const alias = (asMatch ? asMatch[2] : expr.split('.').pop()).trim()

  const roundAvgMatch = expr.match(/^ROUND\(\s*AVG\(\s*([a-zA-Z_.*]+)\s*\)\s*,\s*(\d+)\s*\)$/i)
  if (roundAvgMatch) {
    return { expr, alias, aggFunc: 'AVG', colKey: roundAvgMatch[1].toLowerCase(), roundDecimals: Number(roundAvgMatch[2]) }
  }

  const aggMatch = expr.match(/^(COUNT|AVG|MAX|MIN|SUM)\(\s*([a-zA-Z_.*]+)\s*\)$/i)
  if (aggMatch) {
    return { expr, alias, aggFunc: aggMatch[1].toUpperCase(), colKey: aggMatch[2].toLowerCase() }
  }

  return { expr, alias, aggFunc: null, colKey: expr.toLowerCase() }
}

function computeAggregateOrColumn(spec, groupRows) {
  if (!spec.aggFunc) {
    const first = groupRows[0] || {}
    return first[spec.colKey] ?? first[spec.colKey.split('.').pop()] ?? ''
  }
  if (spec.aggFunc === 'COUNT') return groupRows.length
  const vals = groupRows
    .map((r) => Number(r[spec.colKey] ?? r[spec.colKey.split('.').pop()]))
    .filter((n) => Number.isFinite(n))
  if (vals.length === 0) return 0
  if (spec.aggFunc === 'SUM') return vals.reduce((a, b) => a + b, 0)
  if (spec.aggFunc === 'MAX') return Math.max(...vals).toFixed(2).replace(/\.00$/, '')
  if (spec.aggFunc === 'MIN') return Math.min(...vals).toFixed(2).replace(/\.00$/, '')
  if (spec.aggFunc === 'AVG') {
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length
    return spec.roundDecimals !== undefined ? avg.toFixed(spec.roundDecimals) : avg.toFixed(2)
  }
  return ''
}

function evaluateSqlWhere(row, condStr) {
  if (/\bOR\b/i.test(condStr)) {
    return condStr.split(/\bOR\b/i).some((part) => evaluateSqlWhere(row, part.trim()))
  }
  if (/\bAND\b/i.test(condStr)) {
    return condStr.split(/\bAND\b/i).every((part) => evaluateSqlWhere(row, part.trim()))
  }

  const m = condStr.match(/^([a-zA-Z_.]+)\s*(>=|<=|!=|<>|=|>|<|LIKE)\s*([\s\S]+)$/i)
  if (!m) return true
  const colKey = m[1].trim().toLowerCase()
  const op = m[2].toUpperCase()
  let rhsRaw = m[3].trim()
  const isString = (rhsRaw.startsWith("'") && rhsRaw.endsWith("'")) || (rhsRaw.startsWith('"') && rhsRaw.endsWith('"'))
  const rhsVal = isString ? rhsRaw.slice(1, -1) : Number(rhsRaw)
  const lhsVal = row[colKey] ?? row[colKey.split('.').pop()]

  if (op === 'LIKE') {
    const pattern = String(rhsVal).replace(/%/g, '.*')
    return new RegExp(`^${pattern}$`, 'i').test(String(lhsVal ?? ''))
  }
  const l = isString ? String(lhsVal ?? '') : Number(lhsVal)
  switch (op) {
    case '>=': return l >= rhsVal
    case '<=': return l <= rhsVal
    case '>': return l > rhsVal
    case '<': return l < rhsVal
    case '=': return l === rhsVal
    case '!=':
    case '<>': return l !== rhsVal
    default: return true
  }
}

// ============================================================================
// 4. C++17 STREAM & CONTAINER INTERPRETER (CodePlayground)
// ============================================================================

/**
 * Parses and executes C++ `main()` code in-browser (vectors, arrays, loops,
 * sorting, arithmetic, and `cout <<` stream chains).
 *
 * @param {string} code
 * @returns {string}
 */
export function executeCppCode(code) {
  const clean = stripJsComments(String(code || ''))
  const mainMatch = clean.match(/int\s+main\s*\([^)]*\)\s*\{([\s\S]*)\}/)
  const body = mainMatch ? mainMatch[1] : clean

  const env = Object.create(null)
  let outputBuffer = ''

  const stmts = splitCppStatements(body)

  for (const rawStmt of stmts) {
    const stmt = rawStmt.trim()
    if (!stmt || /^return\b/.test(stmt) || /^using\s+namespace/.test(stmt) || /^#include/.test(stmt)) {
      continue
    }

    // 1. vector<int> name = { ... }
    const vecMatch = stmt.match(/^(?:std::)?vector<\s*(?:int|double|float|string)\s*>\s+([a-zA-Z_]\w*)\s*=\s*\{([^}]*)\}/)
    if (vecMatch) {
      const name = vecMatch[1]
      const items = vecMatch[2].split(',').map((x) => evalCppExpr(x.trim(), env)).filter((x) => x !== undefined && x !== '')
      env[name] = items
      continue
    }

    // 2. Scalar declaration: int/double/string x = expr
    const scalarMatch = stmt.match(/^(?:int|double|float|long|auto|string|std::string)\s+([a-zA-Z_]\w*)\s*=\s*([\s\S]+)$/)
    if (scalarMatch) {
      env[scalarMatch[1]] = evalCppExpr(scalarMatch[2], env)
      continue
    }

    // 3. quickSort(vec, ...) or sort(vec.begin(), vec.end())
    const sortMatch = stmt.match(/^(?:quickSort|mergeSort|bubbleSort|sort|std::sort)\s*\(\s*([a-zA-Z_]\w*)/)
    if (sortMatch && Array.isArray(env[sortMatch[1]])) {
      env[sortMatch[1]] = [...env[sortMatch[1]]].sort((a, b) => Number(a) - Number(b))
      continue
    }

    // 4. Range-based for loop: `for (int g : grades) cout << g << " "`
    const rangeForMatch = stmt.match(/^for\s*\(\s*(?:const\s+)?(?:int|auto|double|string)\s*&?\s*([a-zA-Z_]\w*)\s*:\s*([a-zA-Z_]\w*)\s*\)\s*([\s\S]+)$/)
    if (rangeForMatch) {
      const [, iterVar, vecName, loopBody] = rangeForMatch
      const arr = env[vecName] || []
      for (const item of arr) {
        env[iterVar] = item
        outputBuffer += runCppCoutOrAssign(loopBody.replace(/^\{|\}$/g, '').trim(), env)
      }
      continue
    }

    // 5. Standard for loop: `for (int i = 0; i < n; i++) ...`
    const stdForMatch = stmt.match(/^for\s*\(\s*(?:int\s+)?([a-zA-Z_]\w*)\s*=\s*([^;]+)\s*;\s*\1\s*(<=|<)\s*([^;]+)\s*;\s*\1\+\+\s*\)\s*([\s\S]+)$/)
    if (stdForMatch) {
      const [, iterVar, startStr, op, endStr, loopBody] = stdForMatch
      const start = Number(evalCppExpr(startStr, env))
      const end = Number(evalCppExpr(endStr, env))
      for (let k = start; op === '<=' ? k <= end : k < end; k++) {
        env[iterVar] = k
        outputBuffer += runCppCoutOrAssign(loopBody.replace(/^\{|\}$/g, '').trim(), env)
      }
      continue
    }

    // 6. cout << ...
    outputBuffer += runCppCoutOrAssign(stmt, env)
  }

  return (
    `g++ -O3 -std=c++17 main.cpp && ./a.out\n` +
    `${outputBuffer.trimEnd()}\n\n` +
    `Program finished with exit code 0`
  )
}

function splitCppStatements(body) {
  const res = []
  let cur = ''
  let depthParen = 0
  let depthBrace = 0
  let inQuote = null

  for (let i = 0; i < body.length; i++) {
    const ch = body[i]
    const prev = i > 0 ? body[i - 1] : ''
    if (inQuote) {
      cur += ch
      if (ch === inQuote && prev !== '\\') inQuote = null
      continue
    }
    if (ch === '"' || ch === "'") {
      inQuote = ch
      cur += ch
      continue
    }
    if (ch === '(') depthParen++
    else if (ch === ')') depthParen--
    else if (ch === '{') depthBrace++
    else if (ch === '}') depthBrace--

    if (ch === ';' && depthParen === 0 && depthBrace === 0) {
      if (cur.trim()) res.push(cur.trim())
      cur = ''
    } else {
      cur += ch
    }
  }
  if (cur.trim()) res.push(cur.trim())
  return res
}

function runCppCoutOrAssign(stmt, env) {
  let out = ''
  const subStmts = stmt.split(';').map((s) => s.trim()).filter(Boolean)
  for (const sub of subStmts) {
    if (/^(?:std::)?cout\s*<</.test(sub)) {
      const chain = sub.replace(/^(?:std::)?cout\s*<</, '').split('<<')
      for (const partRaw of chain) {
        const part = partRaw.trim()
        if (part === 'endl' || part === 'std::endl' || part === '"\\n"' || part === "'\\n'") {
          out += '\n'
        } else {
          out += String(evalCppExpr(part, env) ?? '')
        }
      }
    } else {
      const assign = sub.match(/^([a-zA-Z_]\w*)\s*=\s*([\s\S]+)$/)
      if (assign) env[assign[1]] = evalCppExpr(assign[2], env)
    }
  }
  return out
}

function evalCppExpr(raw, env) {
  const s = String(raw || '').trim()
  if (!s) return ''
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1).replace(/\\n/g, '\n')
  }
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s)
  const sizeMatch = s.match(/^([a-zA-Z_]\w*)\.size\(\)$/)
  if (sizeMatch && Array.isArray(env[sizeMatch[1]])) return env[sizeMatch[1]].length

  for (const op of ['+', '-', '*', '/', '%']) {
    const split = splitByOperatorOutsideParens(s, op)
    if (split) {
      const l = evalCppExpr(split[0], env)
      const r = evalCppExpr(split[1], env)
      if (op === '+') return l + r
      if (op === '-') return l - r
      if (op === '*') return l * r
      if (op === '/') return l / r
      if (op === '%') return l % r
    }
  }

  const idxMatch = s.match(/^([a-zA-Z_]\w*)\[([^\]]+)\]$/)
  if (idxMatch && Array.isArray(env[idxMatch[1]])) {
    return env[idxMatch[1]][Number(evalCppExpr(idxMatch[2], env))]
  }

  if (s in env) return env[s]
  return s
}

import { SyntaxDiagnostic } from '../types';

interface BlockFrame {
  indent: number;
  type: string;
  line: number;
}

export function checkRenpySyntax(code: string): SyntaxDiagnostic[] {
  const diagnostics: SyntaxDiagnostic[] = [];
  const lines = code.split('\n');

  const blockStack: BlockFrame[] = [{ indent: 0, type: 'root', line: 0 }];
  let prevHeaderLine: { line: number; indent: number; text: string } | null = null;
  let inMultilineComment = false;
  let inPythonBlock = false;
  let pythonBlockIndent = -1;

  // Common keywords that start blocks with ':'
  const blockKeywords = [
    'label',
    'menu',
    'python',
    'init',
    'screen',
    'transform',
    'if',
    'elif',
    'else',
    'while',
    'for',
    'style',
    'layeredimage',
  ];

  // Common typo dictionary
  const commonTypos: Record<string, string> = {
    scence: 'scene',
    scne: 'scene',
    sho: 'show',
    shw: 'show',
    jummp: 'jump',
    jmp: 'jump',
    cal: 'call',
    retun: 'return',
    retunr: 'return',
    pas: 'pass',
    defne: 'define',
    defualt: 'default',
    defaut: 'default',
    charecter: 'Character',
    charactor: 'Character',
    hid: 'hide',
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const lineNum = i + 1;

    // Handle multiline comments if any (Ren'py python block """ comments)
    if (rawLine.includes('"""') || rawLine.includes("'''")) {
      const count = (rawLine.match(/("""|''')/g) || []).length;
      if (count % 2 !== 0) {
        inMultilineComment = !inMultilineComment;
      }
    }
    if (inMultilineComment) continue;

    // Strip comments for syntax evaluation
    let codePart = rawLine;
    let commentIndex = -1;
    let inQuote: '"' | "'" | null = null;

    for (let c = 0; c < rawLine.length; c++) {
      const char = rawLine[c];
      const prevChar = c > 0 ? rawLine[c - 1] : '';

      if ((char === '"' || char === "'") && prevChar !== '\\') {
        if (!inQuote) inQuote = char;
        else if (inQuote === char) inQuote = null;
      } else if (char === '#' && !inQuote) {
        commentIndex = c;
        break;
      }
    }

    if (commentIndex !== -1) {
      codePart = rawLine.slice(0, commentIndex);
    }

    const trimmed = codePart.trim();
    if (!trimmed) {
      continue; // empty line
    }

    // Calculate indentation (spaces, tab counts as 4 spaces)
    let currentIndent = 0;
    for (let c = 0; c < codePart.length; c++) {
      if (codePart[c] === ' ') currentIndent += 1;
      else if (codePart[c] === '\t') currentIndent += 4;
      else break;
    }

    // 1. Check if previous line required indentation
    if (prevHeaderLine) {
      if (currentIndent <= prevHeaderLine.indent) {
        diagnostics.push({
          id: `indent-expected-${lineNum}`,
          line: lineNum,
          column: 1,
          severity: 'error',
          rule: 'renpy-indentation',
          messageTh: `พบข้อผิดพลาดการย่อหน้า (Indentation Error): บรรทัดนี้ต้องย่อหน้า (Tab หรือ 4 Spaces) ต่อจาก '${prevHeaderLine.text}' ที่บรรทัด ${prevHeaderLine.line}`,
          messageEn: `Indentation Error: Expected an indented block following '${prevHeaderLine.text}' on line ${prevHeaderLine.line}.`,
          fixSuggestion: {
            labelTh: 'เพิ่มการย่อหน้า 4 เคาะ',
            labelEn: 'Add 4-space indentation',
            newText: '    ' + rawLine.trimStart(),
          },
        });
      }
      prevHeaderLine = null;
    }

    // Maintain block stack indentation
    while (blockStack.length > 1 && currentIndent < blockStack[blockStack.length - 1].indent) {
      const popped = blockStack.pop();
      if (popped?.type === 'python') {
        inPythonBlock = false;
        pythonBlockIndent = -1;
      }
    }

    // Check inconsistent indentation levels
    const validIndents = blockStack.map((b) => b.indent);
    if (!validIndents.includes(currentIndent) && currentIndent > blockStack[blockStack.length - 1].indent) {
      // It's a new indented level, will be pushed if header or allowed
    } else if (!validIndents.includes(currentIndent) && currentIndent > 0) {
      diagnostics.push({
        id: `indent-mismatch-${lineNum}`,
        line: lineNum,
        column: 1,
        severity: 'warning',
        rule: 'renpy-indent-alignment',
        messageTh: `การย่อหน้าไม่ตรงระดับ (${currentIndent} ช่อง): Ren'Py แนะนำให้ใช้การย่อหน้าชุดละ 4 ช่องอย่างสม่ำเสมอ`,
        messageEn: `Unaligned indentation (${currentIndent} spaces): Ren'Py recommends consistent 4-space steps.`,
      });
    }

    // 2. Check Missing Colons on Statements
    const firstWordMatch = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_-]*)/);
    const firstWord = firstWordMatch ? firstWordMatch[1] : '';

    // Check for typo in first keyword
    if (commonTypos[firstWord.toLowerCase()]) {
      const correctWord = commonTypos[firstWord.toLowerCase()];
      diagnostics.push({
        id: `typo-${lineNum}`,
        line: lineNum,
        column: currentIndent + 1,
        endColumn: currentIndent + 1 + firstWord.length,
        severity: 'error',
        rule: 'renpy-keyword-typo',
        messageTh: `คำสั่งสะกดผิด: '${firstWord}' อาจตั้งใจพิมพ์เป็น '${correctWord}'`,
        messageEn: `Typo in keyword: '${firstWord}' is likely meant to be '${correctWord}'.`,
        fixSuggestion: {
          labelTh: `เปลี่ยนเป็น '${correctWord}'`,
          labelEn: `Change to '${correctWord}'`,
          newText: rawLine.replace(firstWord, correctWord),
        },
      });
    }

    // Label statement check
    if (firstWord === 'label') {
      if (!trimmed.endsWith(':')) {
        diagnostics.push({
          id: `missing-colon-label-${lineNum}`,
          line: lineNum,
          column: codePart.length,
          severity: 'error',
          rule: 'renpy-missing-colon',
          messageTh: `คำสั่ง label ต้องลงท้ายด้วยเครื่องหมายโคลอน (:) เช่น 'label ${trimmed.slice(5).trim()}:'`,
          messageEn: `Label statement must end with a colon (:), e.g. 'label ${trimmed.slice(5).trim()}:'`,
          fixSuggestion: {
            labelTh: 'เติมเครื่องหมาย :',
            labelEn: 'Add colon :',
            newText: rawLine + ':',
          },
        });
      }
    }

    // Menu statement check
    if (firstWord === 'menu') {
      if (!trimmed.endsWith(':')) {
        diagnostics.push({
          id: `missing-colon-menu-${lineNum}`,
          line: lineNum,
          column: codePart.length,
          severity: 'error',
          rule: 'renpy-missing-colon',
          messageTh: `คำสั่ง menu ต้องลงท้ายด้วยเครื่องหมายโคลอน (:) เช่น 'menu:'`,
          messageEn: `Menu statement must end with a colon (:), e.g. 'menu:'`,
          fixSuggestion: {
            labelTh: 'เติม :',
            labelEn: 'Add :',
            newText: rawLine.trimEnd() + ':',
          },
        });
      }
    }

    // Screen / Transform check
    if (['screen', 'transform'].includes(firstWord)) {
      if (!trimmed.endsWith(':')) {
        diagnostics.push({
          id: `missing-colon-${firstWord}-${lineNum}`,
          line: lineNum,
          column: codePart.length,
          severity: 'error',
          rule: 'renpy-missing-colon',
          messageTh: `คำสั่ง ${firstWord} ต้องลงท้ายด้วยโคลอน (:)`,
          messageEn: `${firstWord} definition must end with a colon (:).`,
          fixSuggestion: {
            labelTh: 'เติม :',
            labelEn: 'Add :',
            newText: rawLine.trimEnd() + ':',
          },
        });
      }
    }

    // Control flow colons (if, elif, else, while, for)
    if (['if', 'elif', 'else', 'while', 'for'].includes(firstWord)) {
      if (!trimmed.endsWith(':')) {
        diagnostics.push({
          id: `missing-colon-control-${lineNum}`,
          line: lineNum,
          column: codePart.length,
          severity: 'error',
          rule: 'renpy-missing-colon',
          messageTh: `คำสั่งควบคุม '${firstWord}' ต้องลงท้ายด้วยเครื่องหมายโคลอน (:)`,
          messageEn: `Control statement '${firstWord}' must end with a colon (:).`,
          fixSuggestion: {
            labelTh: 'เติม :',
            labelEn: 'Add :',
            newText: rawLine.trimEnd() + ':',
          },
        });
      }
    }

    // Python block detection
    if (trimmed === 'python:' || trimmed.startsWith('init ') && trimmed.endsWith('python:')) {
      inPythonBlock = true;
      pythonBlockIndent = currentIndent;
    }

    // Flag next line expecting indentation if this ends with colon
    if (trimmed.endsWith(':')) {
      blockStack.push({ indent: currentIndent + 4, type: firstWord || 'block', line: lineNum });
      prevHeaderLine = { line: lineNum, indent: currentIndent, text: trimmed };
    }

    // 3. String & Quotes Validation
    // Count unescaped double quotes and single quotes
    let doubleQuotes = 0;
    let singleQuotes = 0;
    for (let c = 0; c < codePart.length; c++) {
      const char = codePart[c];
      const prev = c > 0 ? codePart[c - 1] : '';
      if (char === '"' && prev !== '\\') doubleQuotes++;
      if (char === "'" && prev !== '\\') singleQuotes++;
    }

    if (doubleQuotes % 2 !== 0) {
      diagnostics.push({
        id: `unclosed-double-quote-${lineNum}`,
        line: lineNum,
        column: codePart.lastIndexOf('"') + 1,
        severity: 'error',
        rule: 'renpy-unclosed-quote',
        messageTh: 'พบเครื่องหมายคำพูดคู่ (") ไม่ได้ปิด: ข้อความบทสนทนาหรือสตริงต้องปิดด้วย "',
        messageEn: 'Unclosed double quote ("): Dialogue or string must end with a matching quote.',
        fixSuggestion: {
          labelTh: 'ปิดเครื่องหมายคำพูด "',
          labelEn: 'Close quote with "',
          newText: rawLine + '"',
        },
      });
    }

    // 4. Ren'Py Text Tags & Tag Balance Validation in dialogue
    if (trimmed.includes('{') || trimmed.includes('}')) {
      const openCurly = (trimmed.match(/\{/g) || []).length;
      const closeCurly = (trimmed.match(/\}/g) || []).length;
      if (openCurly !== closeCurly) {
        diagnostics.push({
          id: `unbalanced-curly-tag-${lineNum}`,
          line: lineNum,
          column: currentIndent + 1,
          severity: 'error',
          rule: 'renpy-tag-unbalanced',
          messageTh: `พบแท็กข้อความ Ren'Py ไม่สมบูรณ์ (เครื่องหมาย { และ } ไม่เท่ากัน)`,
          messageEn: `Unbalanced Ren'Py text tag brackets: count of '{' and '}' do not match.`,
        });
      }

      // Check specific paired tags: {b}...{/b}, {i}...{/i}, {color=...}...{/color}, {size=...}...{/size}
      const pairableTags = ['b', 'i', 'u', 's', 'color', 'size', 'font', 'alpha', 'cps'];
      for (const tag of pairableTags) {
        const openRegex = new RegExp(`\\{${tag}(?:=[^}]+)?\\}`, 'g');
        const closeRegex = new RegExp(`\\{/${tag}\\}`, 'g');
        const openMatches = (trimmed.match(openRegex) || []).length;
        const closeMatches = (trimmed.match(closeRegex) || []).length;

        if (openMatches > closeMatches) {
          diagnostics.push({
            id: `unclosed-tag-${tag}-${lineNum}`,
            line: lineNum,
            column: trimmed.indexOf(`{${tag}`) + 1,
            severity: 'warning',
            rule: 'renpy-unclosed-tag',
            messageTh: `แท็กข้อความ {${tag}} เปิดไว้แต่ไม่มีแท็กปิด {/${tag}}`,
            messageEn: `Text tag '{${tag}}' opened without closing tag '{/${tag}}'.`,
            fixSuggestion: {
              labelTh: `เพิ่ม {/${tag}} ท้ายบรรทัด`,
              labelEn: `Add {/${tag}} at end of line`,
              newText: rawLine.replace(/"$/, `{/${tag}}"`) === rawLine ? rawLine + `{/${tag}}` : rawLine.replace(/"$/, `{/${tag}}"`),
            },
          });
        }
      }
    }

    // 5. Check variable interpolation [var_name]
    if (trimmed.includes('[') && (trimmed.includes('"') || trimmed.includes("'"))) {
      const openBracket = (trimmed.match(/\[/g) || []).length;
      const closeBracket = (trimmed.match(/\]/g) || []).length;
      if (openBracket > closeBracket) {
        diagnostics.push({
          id: `unclosed-var-tag-${lineNum}`,
          line: lineNum,
          column: trimmed.indexOf('[') + 1,
          severity: 'error',
          rule: 'renpy-var-interpolation',
          messageTh: 'พบการแทรกตัวแปร [ตัวแปร] ไม่สมบูรณ์ (ขาดเครื่องหมายวงเล็บปิด ])',
          messageEn: 'Unclosed variable interpolation: missing closing bracket `]`.',
        });
      }
    }

    // 6. Python one-liner ($ ...) check
    if (trimmed.startsWith('$')) {
      const pyCode = trimmed.slice(1).trim();

      // Check for accidental double equal assignment e.g. `$ score == 10`
      if (/^[a-zA-Z_][a-zA-Z0-9_.]*\s*==\s*[^=]+$/.test(pyCode)) {
        diagnostics.push({
          id: `py-double-equals-${lineNum}`,
          line: lineNum,
          column: currentIndent + 1,
          severity: 'warning',
          rule: 'python-assignment-equality',
          messageTh: `คำสั่ง Python '$ ${pyCode}' ใช้ '==' (เปรียบเทียบ) แทนที่จะเป็น '=' (กำหนดค่า)`,
          messageEn: `Python line uses '==' (equality check) instead of '=' (variable assignment).`,
          fixSuggestion: {
            labelTh: "เปลี่ยน '==' เป็น '='",
            labelEn: "Change '==' to '='",
            newText: rawLine.replace('==', '='),
          },
        });
      }

      // Check brackets in python expression
      checkParenthesesBalance(pyCode, lineNum, currentIndent + 1, diagnostics);
    }

    // 7. Check menu item inside menu
    const currentFrame = blockStack[blockStack.length - 1];
    if (currentFrame && currentFrame.type === 'menu' && currentIndent > currentFrame.indent - 4) {
      // Menu items are usually: "Choice 1": or "Choice 1" if condition:
      if (!trimmed.endsWith(':') && !trimmed.startsWith('set ') && !trimmed.startsWith('$') && !trimmed.startsWith('#')) {
        // If it's a choice without colon
        if (trimmed.startsWith('"') || trimmed.startsWith("'")) {
          diagnostics.push({
            id: `menu-choice-missing-colon-${lineNum}`,
            line: lineNum,
            column: codePart.length,
            severity: 'error',
            rule: 'renpy-menu-choice',
            messageTh: 'ตัวเลือกในเมนู (Menu Choice) ต้องลงท้ายด้วยเครื่องหมายโคลอน (:) เช่น "ตัวเลือกที่ 1":',
            messageEn: 'Menu choices must end with a colon (:), e.g. "Option 1":',
            fixSuggestion: {
              labelTh: 'เติม :',
              labelEn: 'Add :',
              newText: rawLine.trimEnd() + ':',
            },
          });
        }
      }
    }

    // 8. Say dialogue without quotes warning
    // e.g. "e Hello player" instead of 'e "Hello player"'
    const dialogueAttempt = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s+([a-zA-Z\u0E00-\u0E7F].*)$/);
    if (
      dialogueAttempt &&
      !['scene', 'show', 'hide', 'play', 'stop', 'queue', 'voice', 'jump', 'call', 'window', 'with', 'pause', 'default', 'define', 'return', 'pass', 'init', 'python', 'label', 'menu', 'screen', 'transform', 'image', 'style', 'translate'].includes(dialogueAttempt[1])
    ) {
      const rest = dialogueAttempt[2];
      if (!rest.startsWith('"') && !rest.startsWith("'") && !rest.endsWith(':') && !rest.startsWith('=')) {
        diagnostics.push({
          id: `unquoted-dialogue-${lineNum}`,
          line: lineNum,
          column: currentIndent + dialogueAttempt[1].length + 1,
          severity: 'warning',
          rule: 'renpy-say-quotes',
          messageTh: `บทสนทนาของ '${dialogueAttempt[1]}' ต้องอยู่ในเครื่องหมายคำพูดคู่ เช่น ${dialogueAttempt[1]} "${rest}"`,
          messageEn: `Dialogue for '${dialogueAttempt[1]}' should be quoted, e.g. ${dialogueAttempt[1]} "${rest}"`,
          fixSuggestion: {
            labelTh: `ใส่อัญประกาศ "${rest}"`,
            labelEn: `Wrap in quotes "${rest}"`,
            newText: `${codePart.slice(0, currentIndent)}${dialogueAttempt[1]} "${rest}"`,
          },
        });
      }
    }

    // 9. Jump or Call target syntax
    if (['jump', 'call'].includes(firstWord)) {
      const target = trimmed.slice(firstWord.length).trim().split(/\s+/)[0];
      if (target.startsWith('"') || target.startsWith("'")) {
        diagnostics.push({
          id: `jump-target-quotes-${lineNum}`,
          line: lineNum,
          column: currentIndent + 1,
          severity: 'warning',
          rule: 'renpy-jump-target',
          messageTh: `คำสั่ง ${firstWord} ชื่อ label ไม่ต้องใส่อัญประกาศ เช่น '${firstWord} ${target.replace(/['"]/g, '')}'`,
          messageEn: `${firstWord} target label should not be enclosed in quotes: '${firstWord} ${target.replace(/['"]/g, '')}'`,
          fixSuggestion: {
            labelTh: 'ลบเครื่องหมายคำพูดออกจากชื่อ label',
            labelEn: 'Remove quotes from label name',
            newText: rawLine.replace(target, target.replace(/['"]/g, '')),
          },
        });
      }
    }
  }

  // Final check: did code end expecting an indented block?
  if (prevHeaderLine) {
    diagnostics.push({
      id: `file-ended-unindented`,
      line: prevHeaderLine.line,
      column: 1,
      severity: 'error',
      rule: 'renpy-unclosed-block',
      messageTh: `โค้ดสิ้นสุดลงโดยยังมีบล็อก '${prevHeaderLine.text}' ที่ต้องการเนื้อหาที่ย่อหน้าต่อ`,
      messageEn: `File ended expecting an indented block following '${prevHeaderLine.text}'.`,
    });
  }

  return diagnostics;
}

function checkParenthesesBalance(code: string, lineNum: number, startCol: number, diagnostics: SyntaxDiagnostic[]) {
  const stack: { char: string; index: number }[] = [];
  const pairs: Record<string, string> = { ')': '(', ']': '[', '}': '{' };

  for (let i = 0; i < code.length; i++) {
    const c = code[i];
    if (c === '(' || c === '[' || c === '{') {
      stack.push({ char: c, index: i });
    } else if (c === ')' || c === ']' || c === '}') {
      if (stack.length === 0 || stack[stack.length - 1].char !== pairs[c]) {
        diagnostics.push({
          id: `py-unmatched-paren-${lineNum}-${i}`,
          line: lineNum,
          column: startCol + i,
          severity: 'error',
          rule: 'python-paren-mismatch',
          messageTh: `พบวงเล็บปิด '${c}' ไม่ตรงคู่วงเล็บเปิดในนิพจน์ Python`,
          messageEn: `Unmatched closing parenthesis/bracket '${c}' in Python expression.`,
        });
        return;
      }
      stack.pop();
    }
  }

  if (stack.length > 0) {
    const unclosed = stack[stack.length - 1];
    diagnostics.push({
      id: `py-unclosed-paren-${lineNum}`,
      line: lineNum,
      column: startCol + unclosed.index,
      severity: 'error',
      rule: 'python-unclosed-paren',
      messageTh: `พบวงเล็บเปิด '${unclosed.char}' ใน Python ที่ไม่ได้ปิด`,
      messageEn: `Unclosed '${unclosed.char}' in Python expression.`,
    });
  }
}

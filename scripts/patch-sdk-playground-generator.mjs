import fs from 'node:fs';
import path from 'node:path';

const target = process.argv[2] ?? '/root/dev-portal/SDK-Generator/src/generators/playground-generator.ts';

function applyReplace(fileText, from, to, label) {
  const idx = fileText.indexOf(from);
  if (idx === -1) {
    return { text: fileText, changed: false, label };
  }
  const next = fileText.replace(from, to);
  return { text: next, changed: next !== fileText, label };
}

function applyRegex(fileText, re, to, label) {
  if (!re.test(fileText)) {
    return { text: fileText, changed: false, label };
  }
  const next = fileText.replace(re, to);
  return { text: next, changed: next !== fileText, label };
}

const abs = path.resolve(target);
let text = fs.readFileSync(abs, 'utf8');

const changes = [];

// Layout: use main tokens
({ text, ...changes[changes.length] } = applyReplace(
  text,
  '<body className="min-h-screen bg-surface-0 text-surface-900 antialiased">',
  '<body className="min-h-screen bg-background text-foreground antialiased">',
  'layout body tokens',
));

// EndpointPanel: header wrapper -> sticky blurred + borderless
({ text, ...changes[changes.length] } = applyReplace(
  text,
  '<div className="border-b border-surface-200 bg-surface-50 px-6 py-4">',
  '<div className="bg-surface-50/70 backdrop-blur supports-[backdrop-filter]:bg-surface-50/50 px-6 py-4 sticky top-0 z-10">',
  'endpoint header borderless',
));

// Deprecated pill remove border
({ text, ...changes[changes.length] } = applyReplace(
  text,
  'bg-amber-500/10 text-amber-500 rounded border border-amber-500/20',
  'bg-amber-500/10 text-amber-500 rounded',
  'deprecated pill borderless',
));

// Left column: remove split divider border
({ text, ...changes[changes.length] } = applyReplace(
  text,
  '<div className="flex-1 overflow-y-auto border-r border-surface-200">',
  '<div className="flex-1 overflow-y-auto">',
  'remove request/response divider',
));

// URL bar container: remove border
({ text, ...changes[changes.length] } = applyReplace(
  text,
  '<div className="flex-1 flex items-center bg-surface-100 border border-surface-200 rounded-lg overflow-hidden">',
  '<div className="flex-1 flex items-center bg-surface-100 rounded-lg overflow-hidden">',
  'url bar borderless',
));

// URL method segment: remove border-r
({ text, ...changes[changes.length] } = applyReplace(
  text,
  'text-surface-500 bg-surface-50 border-r border-surface-200 flex-shrink-0',
  'text-surface-500 bg-surface-50 flex-shrink-0',
  'url method segment borderless',
));

// Send button: black text (enabled + disabled)
({ text, ...changes[changes.length] } = applyReplace(
  text,
  "? 'bg-surface-200 text-surface-400 cursor-not-allowed'\n                    : 'bg-brand-600 text-white hover:bg-brand-700 active:scale-[0.98] shadow-sm shadow-brand-600/25',",
  "? 'bg-surface-200 text-black cursor-not-allowed'\n                    : 'bg-brand-600 text-black hover:bg-brand-700 active:scale-[0.98] shadow-sm shadow-brand-600/25',",
  'send button black text',
));

// Auth card wrapper: remove border + soften
({ text, ...changes[changes.length] } = applyReplace(
  text,
  '<div className="mt-3 p-3 bg-surface-50 border border-surface-200 rounded-lg space-y-2 animate-fade-in">',
  '<div className="mt-3 p-3 bg-surface-50/70 rounded-xl space-y-2 animate-fade-in">',
  'auth card borderless',
));

// Auth select: remove border, use ring
({ text, ...changes[changes.length] } = applyReplace(
  text,
  'className="px-2 py-1.5 text-xs bg-surface-100 border border-surface-200 rounded-md text-surface-700 focus:outline-none focus:border-brand-500"',
  'className="px-2 py-1.5 text-xs bg-surface-100 rounded-md text-surface-700 focus:outline-none focus:ring-1 focus:ring-brand-500/30"',
  'auth select borderless',
));

// Auth input: remove border, keep ring
({ text, ...changes[changes.length] } = applyReplace(
  text,
  'className="flex-1 px-2.5 py-1.5 text-xs bg-surface-100 border border-surface-200 rounded-md text-surface-900 placeholder:text-surface-400 font-mono focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500/30"',
  'className="flex-1 px-2.5 py-1.5 text-xs bg-surface-100 rounded-md text-surface-900 placeholder:text-surface-400 font-mono focus:outline-none focus:ring-1 focus:ring-brand-500/30"',
  'auth input borderless',
));

// Request textarea: remove border
({ text, ...changes[changes.length] } = applyReplace(
  text,
  'bg-surface-100 border border-surface-200 rounded-lg',
  'bg-surface-100 rounded-lg',
  'request textarea borderless',
));

// Response schema container: remove border
({ text, ...changes[changes.length] } = applyReplace(
  text,
  '<div className="bg-surface-50 border border-surface-200 rounded-lg p-3">',
  '<div className="bg-surface-50 rounded-lg p-3">',
  'response schema borderless',
));

// SchemaView nested: remove border-l
({ text, ...changes[changes.length] } = applyReplace(
  text,
  "depth > 0 && 'ml-4 pl-3 border-l border-surface-200'",
  "depth > 0 && 'ml-4 pl-3'",
  'schema view borderless',
));

// Response viewer panel: widen + soften background
({ text, ...changes[changes.length] } = applyReplace(
  text,
  '<div className="w-[480px] flex-shrink-0 flex flex-col bg-surface-0 min-h-0">',
  '<div className="w-[640px] flex-shrink-0 flex flex-col bg-surface-0/30 min-h-0">',
  'response panel width',
));

// Response panel header: borderless + blur + padding
({ text, ...changes[changes.length] } = applyReplace(
  text,
  '<div className="px-4 py-2.5 border-b border-surface-200 bg-surface-50">',
  '<div className="px-4 py-3 bg-surface-50/70 backdrop-blur supports-[backdrop-filter]:bg-surface-50/50">',
  'response header borderless',
));

// ResponseViewer: borderless statusBg
({ text, ...changes[changes.length] } = applyRegex(
  text,
  /return 'bg-emerald-500\/10 border-emerald-500\/20';/g,
  "return 'bg-emerald-500/10';",
  'response statusBg 2xx',
));
({ text, ...changes[changes.length] } = applyRegex(
  text,
  /return 'bg-amber-500\/10 border-amber-500\/20';/g,
  "return 'bg-amber-500/10';",
  'response statusBg 3xx',
));
({ text, ...changes[changes.length] } = applyRegex(
  text,
  /return 'bg-orange-500\/10 border-orange-500\/20';/g,
  "return 'bg-orange-500/10';",
  'response statusBg 4xx',
));
({ text, ...changes[changes.length] } = applyRegex(
  text,
  /return 'bg-red-500\/10 border-red-500\/20';/g,
  "return 'bg-red-500/10';",
  'response statusBg 5xx',
));

// ResponseViewer: status pill remove border
({ text, ...changes[changes.length] } = applyReplace(
  text,
  "'text-xs font-bold font-mono px-2 py-0.5 rounded border',",
  "'text-xs font-bold font-mono px-2 py-0.5 rounded',",
  'response status pill borderless',
));

// ResponseViewer: remove status bar border-b
({ text, ...changes[changes.length] } = applyReplace(
  text,
  '<div className="flex items-center gap-3 px-4 py-2.5 border-b border-surface-200">',
  '<div className="flex items-center gap-3 px-4 py-3">',
  'response status bar divider removal',
));

// ResponseViewer: remove tabs row border-b
({ text, ...changes[changes.length] } = applyReplace(
  text,
  '<div className="flex items-center border-b border-surface-200 px-4">',
  '<div className="flex items-center px-4">',
  'response tabs divider removal',
));

// ResponseViewer: remove tab underline borders
({ text, ...changes[changes.length] } = applyReplace(
  text,
  "'px-3 py-2 text-xs font-medium border-b-2 transition-colors',",
  "'px-3 py-2 text-xs font-medium transition-colors',",
  'response tab underline removal',
));
({ text, ...changes[changes.length] } = applyReplace(
  text,
  "? 'text-brand-500 border-brand-500'",
  "? 'text-brand-500'",
  'response tab active border removal',
));

// Body tab inactive: remove border-transparent mention (optional)
({ text, ...changes[changes.length] } = applyReplace(
  text,
  ": 'text-surface-400 border-transparent hover:text-surface-600',",
  ": 'text-surface-400 hover:text-surface-600',",
  'response tab inactive border removal',
));

({ text, ...changes[changes.length] } = applyReplace(
  text,
  ": 'text-surface-400 border-transparent hover:text-surface-600',",
  ": 'text-surface-400 hover:text-surface-600',",
  'response tab inactive border removal (2)',
));

// Headers tab inactive already has border-transparent in your pasted content
({ text, ...changes[changes.length] } = applyReplace(
  text,
  ": 'text-surface-400 border-transparent hover:text-surface-600',",
  ": 'text-surface-400 hover:text-surface-600',",
  'response headers tab inactive border removal',
));

fs.writeFileSync(abs, text, 'utf8');

const touched = changes.filter((c) => c?.changed).map((c) => c.label);
const missed = changes.filter((c) => c && !c.changed).map((c) => c.label);

console.log(`Patched: ${abs}`);
console.log(`Applied (${touched.length}):`);
for (const l of touched) console.log(`- ${l}`);
console.log(`Skipped (${missed.length}) (pattern not found; may already be applied or template changed):`);
for (const l of missed) console.log(`- ${l}`);

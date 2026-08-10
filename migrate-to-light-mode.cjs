const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('./src');

const replacements = [
  // Backgrounds
  { from: /bg-\[\#0A0C10\]/g, to: "bg-slate-50 dark:bg-[#0A0C10]" },
  { from: /bg-\[\#1A1D23\]/g, to: "bg-white dark:bg-[#1A1D23]" },
  { from: /bg-\[\#11141B\]/g, to: "bg-slate-50 dark:bg-[#11141B]" },
  { from: /bg-\[\#11141B\]\/60/g, to: "bg-white/80 dark:bg-[#11141B]/60" },
  { from: /bg-\[\#15181e\]/g, to: "bg-slate-100 dark:bg-[#15181e]" },
  { from: /bg-\[\#1f232b\]/g, to: "bg-slate-200 dark:bg-[#1f232b]" },
  { from: /bg-slate-900\/50/g, to: "bg-white/50 dark:bg-slate-900/50" },
  { from: /bg-slate-900\/20/g, to: "bg-white/30 dark:bg-slate-900/20" },
  { from: /bg-slate-900\/60/g, to: "bg-white/60 dark:bg-slate-900/60" },
  { from: /bg-slate-900(?![\/\-])/g, to: "bg-white dark:bg-slate-900" },
  { from: /bg-slate-800(?![\/\-])/g, to: "bg-slate-100 dark:bg-slate-800" },
  { from: /bg-slate-700(?![\/\-])/g, to: "bg-slate-200 dark:bg-slate-700" },

  // Hovers (Background)
  { from: /hover:bg-slate-800\/80/g, to: "hover:bg-slate-100/80 dark:hover:bg-slate-800/80" },
  { from: /hover:bg-slate-800(?![\/\-])/g, to: "hover:bg-slate-100 dark:hover:bg-slate-800" },
  { from: /hover:bg-slate-700(?![\/\-])/g, to: "hover:bg-slate-200 dark:hover:bg-slate-700" },

  // Borders
  { from: /border-slate-800\/50/g, to: "border-slate-200/80 dark:border-slate-800/50" },
  { from: /border-slate-800(?![\/\-])/g, to: "border-slate-200 dark:border-slate-800" },
  { from: /border-slate-700(?![\/\-])/g, to: "border-slate-300 dark:border-slate-700" },
  { from: /border-slate-600(?![\/\-])/g, to: "border-slate-300 dark:border-slate-600" },
  { from: /hover:border-slate-700/g, to: "hover:border-slate-300 dark:hover:border-slate-700" },

  // Text
  { from: /text-white/g, to: "text-slate-900 dark:text-white" },
  { from: /text-slate-200/g, to: "text-slate-800 dark:text-slate-200" },
  { from: /text-slate-300/g, to: "text-slate-700 dark:text-slate-300" },
  { from: /text-slate-400/g, to: "text-slate-500 dark:text-slate-400" },
  { from: /text-slate-500/g, to: "text-slate-500 dark:text-slate-500" },
  { from: /hover:text-white/g, to: "hover:text-slate-900 dark:hover:text-white" },
  { from: /hover:text-slate-200/g, to: "hover:text-slate-800 dark:hover:text-slate-200" },
  { from: /hover:text-slate-300/g, to: "hover:text-slate-700 dark:hover:text-slate-300" },
];

let changedFiles = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content;

  // We need to avoid double replacing if a file was already processed.
  // To keep it simple, we just run it and hope there are no overlaps like replacing a class that was just inserted.
  // Actually, we should be careful. 
  // Let's do a replace that only matches if not preceded by `dark:`
  
  replacements.forEach(r => {
    // Regex negative lookbehind for `dark:` 
    // to prevent modifying classes we already prefixed in a previous run
    const safeFrom = new RegExp(`(?<!dark:)${r.from.source}`, 'g');
    newContent = newContent.replace(safeFrom, r.to);
  });

  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    changedFiles++;
    console.log(`Updated ${file}`);
  }
});

console.log(`Finished updating ${changedFiles} files.`);

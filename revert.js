const fs = require('fs');
let content = fs.readFileSync('src/pages/DeputyDashboard.jsx', 'utf8');

content = content.replace(/glass-card/g, 'bg-white');
content = content.replace(/bg-\[var\(--glass-bg\)\]/g, 'bg-slate-50');
content = content.replace(/bg-white\/5/g, 'bg-slate-100');
content = content.replace(/text-white/g, 'text-slate-800');
content = content.replace(/text-slate-400/g, 'text-slate-500');
content = content.replace(/text-slate-300/g, 'text-slate-600');
content = content.replace(/bg-\[var\(--neon-purple\)\]\/20/g, 'bg-indigo-50');
content = content.replace(/text-\[var\(--neon-purple\)\]/g, 'text-indigo-700');
content = content.replace(/border-white\/10/g, 'border-slate-200');
content = content.replace(/border-white\/5/g, 'border-slate-100');
content = content.replace(/shadow-lg/g, 'shadow-sm');

fs.writeFileSync('src/pages/DeputyDashboard.jsx', content);

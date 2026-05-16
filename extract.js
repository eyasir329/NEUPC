const fs = require('fs');

const path = 'app/account/member/bootcamps/[bootcampId]/_components/BootcampLearningClient.js';
let content = fs.readFileSync(path, 'utf8');

const s1 = '<div className="grid grid-cols-1 gap-8 lg:grid-cols-3">';
const [beforeGrid, rest] = content.split(s1);

// Inside the grid, we have:
//   <div className="space-y-8 lg:col-span-2">
//      {/* Module Finish Track */} ... {activeTrackModule && ... }
//      {/* Syllabus */} <div className="rounded-xl border ... p-6">...</div>
//   </div>
//   <div className="space-y-8">
//      {/* Video Duration */} ...
//   </div>

const updatedGrid = `      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {activeTrackModule && (
` + content.split('{activeTrackModule && (')[1].split('<div className="rounded-xl border border-[#27272a] bg-[#18181b] p-6">')[0] + `
        <div className="rounded-xl border border-[#27272a] bg-[#18181b] p-5">
` + content.split('<div className="sticky top-24 rounded-xl border border-[#27272a] bg-[#18181b] p-5">')[1].split('        </div>\n      </div>\n    </motion.div>')[0] + `
      </div>

      <div className="rounded-xl border border-[#27272a] bg-[#18181b] p-6">
` + content.split('<div className="rounded-xl border border-[#27272a] bg-[#18181b] p-6">')[1].split('        </div>\n\n        <div className="space-y-8">')[0] + `
    </motion.div>`;

const newContent = beforeGrid + updatedGrid;
fs.writeFileSync(path, newContent);
console.log("Rewritten!");

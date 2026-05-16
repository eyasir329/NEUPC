const fs = require('fs');
const path = 'app/account/member/bootcamps/[bootcampId]/_components/BootcampLearningClient.js';
let data = fs.readFileSync(path, 'utf8');

// The line generating the grid:
// <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
//   <div className="space-y-8 lg:col-span-2">
let original = `<div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">`;
let replacement = `      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">`;
data = data.replace(original, replacement);

// Next we have "Course Curriculum" wrapped inside the left column, separated by {activeTrackModule && (...)} followed by <div className="space-y-4">
// But wait, Course Curriculum has <div className="space-y-4">
// Let's replace:
//           <div className="space-y-4">
//             <div className="flex items-center justify-between">
//               <h3 className="text-xl font-semibold text-[#fafafa]">
//                 Course Curriculum
let syllabusStart = `          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-semibold text-[#fafafa]">
                Course Curriculum`;

let syllabusNew = `      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-[#fafafa]">
            Course Curriculum`;

data = data.replace(syllabusStart, syllabusNew);

// After the syllabus, the left column closes, and the right column opens:
//               ))}
//             </div>
//           </div>
//         </div>
//
//         <div className="space-y-8">
//           <div className="sticky top-24 rounded-xl border border-[#27272a] bg-[#18181b] p-5">
//             <h3 className="mb-6 flex items-center gap-2 font-semibold text-[#fafafa]">
//               <Video className="h-5 w-5 text-[#8b5cf6]" />
//               Video Duration

let oldRightColumn = `              ))}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="sticky top-24 rounded-xl border border-[#27272a] bg-[#18181b] p-5">`;

let newRightColumn = `              ))}
            </div>
          </div>

          {/* Moved Video Duration Up */}`;

// Wait, I need to extract Video Duration and put it next to Module Finish Track!
fs.writeFileSync('temp_extracted.js', data);

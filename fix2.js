const fs = require('fs');

const path = 'app/account/member/bootcamps/[bootcampId]/_components/BootcampLearningClient.js';
let content = fs.readFileSync(path, 'utf8');

// The classes to replace:
content = content.replace('grid grid-cols-1 lg:grid-cols-3 gap-8', 'flex flex-col gap-8');
content = content.replace('space-y-8 lg:col-span-2', 'space-y-8');
content = content.replace('sticky top-24 ', ''); // remove sticky top from video duration

// Now, we want to pop the video duration up.
// Actually, if we just make it side-by-side using flex...
fs.writeFileSync(path, content);

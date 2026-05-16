const fs = require('fs');

const path = 'app/account/member/bootcamps/[bootcampId]/_components/BootcampLearningClient.js';
let content = fs.readFileSync(path, 'utf8');

// The layout right now:
const gridStart = '<div className="grid grid-cols-1 gap-8 lg:grid-cols-3">';
if(content.includes(gridStart)) {
  console.log("Found grid layout.");
}

const fs = require('fs');

const path = 'app/account/member/bootcamps/[bootcampId]/_components/BootcampLearningClient.js';
let content = fs.readFileSync(path, 'utf8');

const s1 = content.indexOf('<div className="grid grid-cols-1');
const s2 = content.indexOf('<div className="space-y-8 lg:col-span-2">');
const syllabusStart = content.indexOf('<div className="space-y-4">\n            <div className="flex items-center justify-between">');
// Find end of left column
const syllabusEnd = content.indexOf('</div>\n          </div>\n        </div>', syllabusStart);
const rightColStart = content.indexOf('<div className="space-y-8">', syllabusEnd);

// Find end of Video Duration
const videoDurStart = content.indexOf('<div className="sticky top-24', rightColStart);
const endMotion = content.indexOf('</motion.div>', videoDurStart);

const header = content.substring(0, s1);
const moduleTrack = content.substring(s2 + '<div className="space-y-8 lg:col-span-2">'.length, syllabusStart);
const syllabusHtml = content.substring(syllabusStart, syllabusEnd + '</div>\n          </div>\n        </div>'.length);

const videoDurInnerEnd = content.lastIndexOf('</div>', endMotion);
const videoDurContent = content.substring(videoDurStart, videoDurInnerEnd);

const newHTML = header + `

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
${moduleTrack}
        </div>
        <div>
${videoDurContent.replace('sticky top-24', '')}
        </div>
      </div>

      <div>
${syllabusHtml.replace('</div>\n          </div>\n        </div>', '</div>\n          </div>\n')}
      </div>
    </motion.div>
  );
}

export default BootcampLearningClient;
`;

fs.writeFileSync(path, newHTML);

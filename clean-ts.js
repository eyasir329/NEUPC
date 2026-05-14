const fs = require('fs');

const files = [
  'app/account/member/daily-activity/_components/ActivityViz.js',
  'app/account/member/daily-activity/_components/MiniCalendar.js',
  'app/account/member/daily-activity/_components/TaskList.js',
  'app/account/member/daily-activity/_components/DailyActivityClient.js'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace TypeScript typings
    content = content.replace(/: any/g, '');
    content = content.replace(/<any>/g, '');
    content = content.replace(/\\(num: number\\)/g, '(num)');
    content = content.replace(/({ level, count }: { level: number; count: number; key\?: number \| string })/g, '({ level, count })');
    content = content.replace(/\\(g: any\\)/g, '(g)');
    content = content.replace(/\\(task: any\\)/g, '(task)');
    
    // Fix imports in ActivityViz.js
    if (file.includes('ActivityViz.js')) {
      content = content.replace(/from '\.\.\/lib\/utils'/g, "from '../../../../_lib/utils'");
    }

    // Fix imports in DailyActivityClient.js
    if (file.includes('DailyActivityClient.js')) {
      content = content.replace(/from '\.\/ActivityViz'/g, "from './ActivityViz'");
      content = content.replace(/from 'motion\/react'/g, "from 'framer-motion'");
      content = content.replace(/from '\.\/ui-mocks'/g, "from '../../_components/_ui'");
      content = content.replace(/from '\.\/TaskList'/g, "from './TaskList'");
      content = content.replace(/from '\.\/MiniCalendar'/g, "from './MiniCalendar'");
    }
    
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Cleaned ${file}`);
  } else {
    console.log(`File not found: ${file}`);
  }
});

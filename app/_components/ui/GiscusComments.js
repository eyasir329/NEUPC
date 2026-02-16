'use client';

import { useEffect, useRef } from 'react';

export default function GiscusComments() {
  const commentsRef = useRef(null);

  useEffect(() => {
    // Check if giscus is already loaded
    if (commentsRef.current && !commentsRef.current.querySelector('iframe')) {
      const script = document.createElement('script');
      script.src = 'https://giscus.app/client.js';
      script.setAttribute('data-repo', 'eyasir329/neupc');
      script.setAttribute('data-repo-id', 'YOUR_REPO_ID'); // Replace with your repo ID from giscus.app
      script.setAttribute('data-category', 'General');
      script.setAttribute('data-category-id', 'YOUR_CATEGORY_ID'); // Replace with your category ID
      script.setAttribute('data-mapping', 'pathname');
      script.setAttribute('data-strict', '0');
      script.setAttribute('data-reactions-enabled', '1');
      script.setAttribute('data-emit-metadata', '0');
      script.setAttribute('data-input-position', 'top');
      script.setAttribute('data-theme', 'dark');
      script.setAttribute('data-lang', 'en');
      script.setAttribute('data-loading', 'lazy');
      script.crossOrigin = 'anonymous';
      script.async = true;

      commentsRef.current.appendChild(script);
    }
  }, []);

  return <div ref={commentsRef} className="giscus-container" />;
}

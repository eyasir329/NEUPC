/**
 * @file Wave
 * @module Wave
 */

function Wave() {
  return (
    <div className="relative -mt-1">
      <svg
        className="h-12 w-full rotate-180 md:h-16 lg:h-20"
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="waveGradient2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop
              offset="0%"
              className="text-secondary-500/20"
              stopColor="currentColor"
            />
            <stop
              offset="50%"
              className="text-primary-500/20"
              stopColor="currentColor"
            />
            <stop
              offset="100%"
              className="text-secondary-500/20"
              stopColor="currentColor"
            />
          </linearGradient>
        </defs>
        <path
          d="M0,64 C200,90 400,90 600,64 C800,38 1000,38 1200,64 L1200,120 L0,120 Z"
          fill="url(#waveGradient2)"
        />
        <path
          d="M0,80 C300,50 500,50 800,80 C1000,100 1100,100 1200,80 L1200,120 L0,120 Z"
          fill="rgba(0,0,0,0.3)"
        />
      </svg>
    </div>
  );
}

export default Wave;

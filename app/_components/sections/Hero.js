import Link from 'next/link';
import SVG from '../ui/SVG';

function Hero() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-20 sm:px-6 lg:px-8">
      <div className="grid w-full max-w-7xl grid-cols-1 items-center gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Left Content */}
        <div className="text-center lg:text-left">
          {/* Main Heading */}
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-6xl xl:text-7xl">
            <span className="block">Programming Club</span>
            <span className="mt-2 block text-3xl font-semibold sm:text-4xl md:text-5xl lg:text-5xl xl:text-6xl">
              (NEUPC)
            </span>
          </h1>

          {/* Divider */}
          <div className="mx-auto my-8 h-1 w-24 bg-linear-to-r from-transparent via-white to-transparent lg:mx-0"></div>

          {/* Subheading */}
          <div className="space-y-3">
            <h2 className="text-lg font-medium text-gray-100 sm:text-xl md:text-2xl lg:text-2xl">
              Department of Computer Science and Engineering
            </h2>
            <p className="text-base font-light text-gray-200 sm:text-lg md:text-xl lg:text-xl">
              Netrokona University, Netrokona, Bangladesh
            </p>
          </div>

          {/* Call to Action Buttons */}
          <div className="mt-12 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6 lg:justify-start">
            <Link
              href="/join"
              className="w-full rounded-lg bg-white px-8 py-3 text-base font-semibold text-gray-900 shadow-lg transition-all hover:bg-gray-100 hover:shadow-xl sm:w-auto md:px-10 md:py-4 md:text-lg"
            >
              Join Now
            </Link>
            <Link
              href="/about"
              className="w-full rounded-lg border-2 border-white bg-transparent px-8 py-3 text-base font-semibold text-white shadow-lg transition-all hover:bg-white hover:text-gray-900 sm:w-auto md:px-10 md:py-4 md:text-lg"
            >
              Learn More
            </Link>
          </div>
        </div>

        {/* Right SVG Illustration */}
        <div className="flex items-center justify-center">
          <SVG />
        </div>
      </div>
    </div>
  );
}

export default Hero;

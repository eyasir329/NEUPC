import Image from 'next/image';
import bg_img from '@/public/bg.webp';
import Hero from './_components/sections/Hero';
import About from './_components/sections/About';
import Events from './_components/sections/Events';
import Wave from './_components/ui/Wave';
import Join from './_components/sections/Join';
import Achievements from './_components/sections/Achievements';
import Blogs from './_components/sections/Blogs';

export const metadata = {
  title: 'Home',
  description: 'This is the home page',
};

export default function page() {
  return (
    <main className="relative min-h-screen">
      {/* Background Image */}
      <Image
        src={bg_img}
        placeholder="blur"
        quality={80}
        sizes="100vw"
        className="fixed inset-0 -z-10 h-full w-full object-cover object-top"
        alt="Mountains and forests with two cabins"
      />

      {/* Multiple Overlay Layers */}

      {/* Base Gradient Overlay for Better Text Readability */}
      <div className="fixed inset-0 -z-10 bg-linear-to-b from-black/50 via-black/30 to-black/60"></div>

      {/* Radial Gradient Overlay - Center Spotlight */}
      <div
        className="fixed inset-0 -z-10"
        style={{
          background:
            'radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.7) 100%)',
        }}
      ></div>

      {/* Diagonal Gradient Overlay */}
      <div className="fixed inset-0 -z-10 bg-linear-to-br from-blue-900/20 via-transparent to-purple-900/20"></div>

      {/* Vignette Effect */}
      <div className="fixed inset-0 -z-10 shadow-[inset_0_0_100px_rgba(0,0,0,0.5)]"></div>

      {/* Dot Pattern Overlay */}
      <div
        className="fixed inset-0 -z-10 opacity-30"
        style={{
          backgroundImage:
            'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '30px 30px',
        }}
      ></div>

      {/* Animated Gradient Overlay */}
      <div className="fixed inset-0 -z-10 animate-pulse bg-linear-to-tr from-blue-600/10 via-transparent to-purple-600/10 opacity-50"></div>

      {/* Noise Texture Overlay */}
      <div
        className="fixed inset-0 -z-10 opacity-20"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
        }}
      ></div>

      {/* Hero Section */}
      <Hero />

      {/* Wave Divider */}
      <Wave />

      {/* About Section */}
      <section className="relative overflow-hidden pb-12 md:pb-16">
        {/* Background Elements */}
        <div className="absolute inset-0 bg-linear-to-b from-transparent via-black/20 to-transparent"></div>
        <div className="from-primary-500/10 via-secondary-500/10 to-primary-500/10 pointer-events-none absolute inset-0 bg-linear-to-br opacity-30"></div>

        {/* Decorative Blur Circles */}
        <div className="from-secondary-500/20 to-primary-500/20 absolute -top-40 -right-40 h-96 w-96 rounded-full bg-linear-to-br blur-3xl"></div>
        <div className="from-primary-500/20 to-secondary-500/20 absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-linear-to-br blur-3xl"></div>

        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="mb-12 text-center md:mb-16 lg:mb-20">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-2.5 text-sm font-medium shadow-lg backdrop-blur-md transition-all hover:bg-white/15 hover:shadow-xl md:mb-6">
              <span className="text-2xl">🎓</span>
              <span className="text-primary-300">Who We Are</span>
            </div>
            <h2 className="mb-4 text-4xl font-bold text-white md:mb-6 md:text-5xl lg:text-6xl">
              About NEUPC
            </h2>
            <div className="from-primary-500 via-secondary-300 to-primary-500 shadow-glow mx-auto h-1.5 w-32 rounded-full bg-linear-to-r md:w-40"></div>
            <p className="mx-auto mt-6 max-w-2xl text-base text-gray-300 md:text-lg lg:text-xl">
              Building a Strong Programming Community at National University
            </p>
          </div>
        </div>
        <About />
      </section>

      {/* Wave Divider */}
      <Wave />

      <Events />

      <Wave />

      {/* Achievement Section */}
      <Achievements />

      <Wave />

      {/* Blogs Section */}

      <Blogs />
      <Wave />

      {/* Join Us Section */}
      <Join />

      {/* Final Wave Divider */}
      <Wave />
    </main>
  );
}

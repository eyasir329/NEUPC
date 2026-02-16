import Link from 'next/link';
import {
  Mail,
  Phone,
  MapPin,
  Facebook,
  Github,
  Linkedin,
  Youtube,
  Twitter,
  ArrowRight,
  Code2,
} from 'lucide-react';

export default function Footer({ session }) {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary-950 border-primary-800 border-t">
      <div className="container-custom">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 gap-8 py-12 md:grid-cols-2 md:py-16 lg:grid-cols-4 lg:gap-12">
          {/* About Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Code2 className="text-primary-500 h-8 w-8" />
              <h3 className="font-heading text-primary-50 text-xl font-bold">
                NEUPC
              </h3>
            </div>
            <p className="text-primary-300 text-sm leading-relaxed">
              Netrokona University Programming Club - Empowering students with
              competitive programming, web development, and cutting-edge
              technology skills.
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href="https://facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary-800 text-primary-200 hover:bg-primary-500 flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200 hover:text-white"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary-800 text-primary-200 hover:bg-primary-500 flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200 hover:text-white"
                aria-label="GitHub"
              >
                <Github className="h-4 w-4" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary-800 text-primary-200 hover:bg-primary-500 flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200 hover:text-white"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary-800 text-primary-200 hover:bg-primary-500 flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200 hover:text-white"
                aria-label="YouTube"
              >
                <Youtube className="h-4 w-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-primary-800 text-primary-200 hover:bg-primary-500 flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200 hover:text-white"
                aria-label="Twitter"
              >
                <Twitter className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading text-primary-50 mb-4 text-base font-semibold">
              Quick Links
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/about"
                  className="text-primary-300 hover:text-secondary-400 group flex items-center gap-2 text-sm transition-colors duration-200"
                >
                  <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-1" />
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  href="/events"
                  className="text-primary-300 hover:text-secondary-400 group flex items-center gap-2 text-sm transition-colors duration-200"
                >
                  <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-1" />
                  Events
                </Link>
              </li>
              <li>
                <Link
                  href="/achievements"
                  className="text-primary-300 hover:text-secondary-400 group flex items-center gap-2 text-sm transition-colors duration-200"
                >
                  <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-1" />
                  Achievements
                </Link>
              </li>
              <li>
                <Link
                  href="/committee"
                  className="text-primary-300 hover:text-secondary-400 group flex items-center gap-2 text-sm transition-colors duration-200"
                >
                  <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-1" />
                  Committee
                </Link>
              </li>
              <li>
                <Link
                  href="/gallery"
                  className="text-primary-300 hover:text-secondary-400 group flex items-center gap-2 text-sm transition-colors duration-200"
                >
                  <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-1" />
                  Gallery
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-heading text-primary-50 mb-4 text-base font-semibold">
              Resources
            </h4>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/blogs"
                  className="text-primary-300 hover:text-secondary-400 group flex items-center gap-2 text-sm transition-colors duration-200"
                >
                  <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-1" />
                  Blogs
                </Link>
              </li>
              <li>
                <Link
                  href="/roadmaps"
                  className="text-primary-300 hover:text-secondary-400 group flex items-center gap-2 text-sm transition-colors duration-200"
                >
                  <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-1" />
                  Roadmaps
                </Link>
              </li>
              <li>
                <Link
                  href="/join"
                  className="text-primary-300 hover:text-secondary-400 group flex items-center gap-2 text-sm transition-colors duration-200"
                >
                  <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-1" />
                  Join Us
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="text-primary-300 hover:text-secondary-400 group flex items-center gap-2 text-sm transition-colors duration-200"
                >
                  <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-1" />
                  Contact
                </Link>
              </li>
              <li>
                <Link
                  href="/developers"
                  className="text-primary-300 hover:text-secondary-400 group flex items-center gap-2 text-sm transition-colors duration-200"
                >
                  <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-1" />
                  Developers
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-heading text-primary-50 mb-4 text-base font-semibold">
              Contact Us
            </h4>
            <ul className="space-y-4">
              <li>
                <a
                  href="mailto:contact@neupc.edu"
                  className="text-primary-300 hover:text-secondary-400 group flex items-start gap-3 text-sm transition-colors duration-200"
                >
                  <Mail className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>contact@neupc.edu</span>
                </a>
              </li>
              <li>
                <a
                  href="tel:+8801234567890"
                  className="text-primary-300 hover:text-secondary-400 group flex items-start gap-3 text-sm transition-colors duration-200"
                >
                  <Phone className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>+880 123 456 7890</span>
                </a>
              </li>
              <li>
                <div className="text-primary-300 flex items-start gap-3 text-sm">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    Netrokona University
                    <br />
                    Netrokona, Bangladesh
                  </span>
                </div>
              </li>
            </ul>
            {!session?.user && (
              <div className="mt-6">
                <Link
                  href="/join"
                  className="from-primary-600 to-primary-700 hover:from-primary-500 hover:to-primary-600 group inline-flex items-center gap-2 rounded-lg bg-linear-to-r px-4 py-2 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:shadow-lg"
                >
                  <Mail className="h-4 w-4" />
                  <span>Subscribe</span>
                  <ArrowRight className="h-3 w-3 transition-transform duration-200 group-hover:translate-x-1" />
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-primary-800 border-t py-6">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <p className="text-primary-400 text-center text-sm md:text-left">
              © {currentYear} Netrokona University Programming Club. All rights
              reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link
                href="/developers"
                className="text-primary-400 hover:text-secondary-400 text-sm transition-colors duration-200"
              >
                Made with ❤️ by NEUPC Developers
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

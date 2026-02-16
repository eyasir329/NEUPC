import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import bg_img from '@/public/bg.webp';

// Event data (in production, this would come from a database or API)
const events = [
  {
    id: 1,
    title: 'Intra University Programming Contest 2026',
    description:
      'An internal competitive programming contest designed to improve problem-solving skills and prepare students for ICPC and national contests.',
    fullDescription:
      'Join us for an exciting day of competitive programming! This internal contest is designed to help students sharpen their problem-solving abilities, learn new algorithms, and prepare for major competitions like ICPC and NCPC. The contest will feature problems ranging from beginner to advanced levels, ensuring that programmers of all skill levels can participate and learn. Winners will receive certificates and prizes. This is a great opportunity to test your skills, collaborate with peers, and get feedback from experienced mentors.',
    date: '2026-03-12',
    time: '10:00 AM',
    duration: '4 hours',
    location: 'CSE Lab-1, Netrokona University',
    image: bg_img,
    category: 'Contest',
    eligibility: 'All CSE students',
    prerequisites: 'Basic programming knowledge in C/C++',
    registrationDeadline: '2026-03-10',
  },
  {
    id: 2,
    title: 'Competitive Programming Bootcamp (Beginner to Advanced)',
    description:
      'A 5-day intensive bootcamp covering C++, STL, data structures, graph theory, and dynamic programming.',
    fullDescription:
      'This comprehensive 5-day bootcamp is perfect for students who want to take their competitive programming skills to the next level. Starting from C++ basics, we will cover the Standard Template Library (STL), essential data structures, graph algorithms, and dynamic programming techniques. Each day includes hands-on practice sessions, problem-solving workshops, and interactive discussions with experienced competitive programmers. By the end of the bootcamp, you will have a solid foundation to tackle advanced algorithmic challenges.',
    date: '2026-02-20',
    time: '2:30 PM',
    duration: '5 days (3 hours/day)',
    location: 'Seminar Room, Dept. of CSE',
    image: bg_img,
    category: 'Bootcamp',
    eligibility: 'All students interested in competitive programming',
    prerequisites: 'None (beginner-friendly)',
    registrationDeadline: '2026-02-18',
  },
  {
    id: 3,
    title: 'ICPC Preparation Workshop',
    description:
      'A special workshop focused on team strategy, advanced algorithms, and real ICPC problem-solving sessions.',
    fullDescription:
      'This workshop is specifically designed for students preparing for the ACM ICPC (International Collegiate Programming Contest). We will cover team dynamics, time management strategies, advanced algorithmic techniques, and simulate real ICPC contest environments. Experienced ICPC participants and coaches will share their insights and tips. The workshop includes mock contests, strategy sessions, and post-contest analysis to help teams optimize their performance.',
    date: '2026-04-05',
    time: '3:00 PM',
    duration: '6 hours',
    location: 'CSE Smart Classroom',
    image: bg_img,
    category: 'Workshop',
    eligibility: 'Students planning to participate in ICPC',
    prerequisites: 'Intermediate programming skills',
    registrationDeadline: '2026-04-03',
  },
  {
    id: 4,
    title: 'Web Development Fundamentals Workshop',
    description:
      'Introduction to modern web development including HTML, CSS, JavaScript, and React basics.',
    fullDescription:
      'Dive into the world of web development with this comprehensive fundamentals workshop. Learn how to build modern, responsive websites from scratch using HTML5, CSS3, and JavaScript. We will also introduce you to React, one of the most popular JavaScript libraries for building user interfaces. The workshop includes practical projects, live coding sessions, and best practices for writing clean, maintainable code. Perfect for students who want to start their journey in web development.',
    date: '2026-01-25',
    time: '11:00 AM',
    duration: '5 hours',
    location: 'Computer Lab-2',
    image: bg_img,
    category: 'Workshop',
    eligibility: 'All students',
    prerequisites: 'Basic computer skills',
    registrationDeadline: '2026-01-23',
  },
  {
    id: 5,
    title: 'Women in Engineering Programming Session',
    description:
      'A dedicated programming practice session organized by the WIE branch to encourage and empower female students in competitive programming.',
    fullDescription:
      'The WIE (Women in Engineering) branch of NEUPC is hosting a special programming practice session to create a supportive and inclusive environment for female students in competitive programming. This session will feature mentorship from experienced female programmers, collaborative problem-solving, and discussions on overcoming challenges in tech. We aim to build confidence, foster community, and encourage more women to pursue programming and technical careers. All female students, regardless of skill level, are welcome.',
    date: '2026-02-10',
    time: '1:30 PM',
    duration: '3 hours',
    location: 'CSE Lab-3',
    image: bg_img,
    category: 'WIE Session',
    eligibility: 'Female students from all departments',
    prerequisites: 'Interest in programming',
    registrationDeadline: '2026-02-08',
  },
  {
    id: 6,
    title: 'Career Guidance & Tech Talk 2026',
    description:
      'An interactive session on career paths in software engineering, competitive programming, and research opportunities.',
    fullDescription:
      'Join us for an enlightening session on career opportunities in the tech industry. Industry professionals, successful alumni, and researchers will share their experiences and insights on various career paths including software development, competitive programming, research, and entrepreneurship. Learn about industry trends, job market expectations, skills to develop, and how to prepare for technical interviews. The session includes a Q&A segment where you can ask questions and get personalized advice.',
    date: '2026-03-28',
    time: '12:00 PM',
    duration: '2.5 hours',
    location: 'Main Auditorium, Netrokona University',
    image: bg_img,
    category: 'Tech Talk',
    eligibility: 'All students',
    prerequisites: 'None',
    registrationDeadline: '2026-03-26',
  },
  {
    id: 7,
    title: 'Weekly Problem Solving Marathon',
    description:
      'A 3-hour problem-solving marathon to practice algorithmic challenges and improve coding speed.',
    fullDescription:
      'Our weekly problem-solving marathon is a regular practice session designed to keep your competitive programming skills sharp. Each week features a curated set of problems covering various algorithmic topics and difficulty levels. This is a great opportunity to practice regularly, learn from peers, and track your progress over time. The session is conducted online through our Codeforces group, making it accessible for everyone. Participate weekly to see consistent improvement in your problem-solving abilities.',
    date: '2026-01-18',
    time: '4:00 PM',
    duration: '3 hours',
    location: 'Online (Codeforces Group)',
    image: bg_img,
    category: 'Practice Session',
    eligibility: 'All programming club members',
    prerequisites: 'Codeforces account',
    registrationDeadline: 'Open enrollment',
  },
  {
    id: 8,
    title: 'Annual Programming Fest 2026',
    description:
      'A full-day programming festival featuring contests, project showcases, quiz competitions, and awards.',
    fullDescription:
      'The Annual Programming Fest is our biggest event of the year! This full-day celebration of programming and technology features multiple exciting activities including competitive programming contests, project showcases, coding quizzes, tech talks, and award ceremonies. Students will have the opportunity to present their projects, compete for prizes, network with industry professionals, and celebrate achievements. The fest also includes fun activities, games, and refreshments. Join us for a memorable day filled with learning, competition, and community building.',
    date: '2026-05-15',
    time: '9:00 AM',
    duration: 'Full day',
    location: 'Netrokona University Campus',
    image: bg_img,
    category: 'Festival',
    eligibility: 'All university students',
    prerequisites: 'None',
    registrationDeadline: '2026-05-10',
  },
];

export async function generateMetadata({ params }) {
  const eventId = parseInt(params.eventId);
  const event = events.find((e) => e.id === eventId);

  if (!event) {
    return {
      title: 'Event Not Found - NEUPC',
    };
  }

  return {
    title: `${event.title} - NEUPC Events`,
    description: event.description,
  };
}

export async function generateStaticParams() {
  return events.map((event) => ({
    eventId: event.id.toString(),
  }));
}

function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function page({ params }) {
  const eventId = parseInt(params.eventId) || 1; // Default to 1 if parsing fails
  const event = events.find((e) => e.id === eventId);

  if (!event) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-linear-to-b from-gray-900 via-black to-gray-900">
      {/* Hero Section */}
      <section className="from-primary-500 to-secondary-500 relative overflow-hidden bg-linear-to-r py-16 text-white md:py-24 lg:py-28">
        {/* Decorative Elements */}
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute -top-20 -left-20 h-72 w-72 animate-pulse rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute -right-20 -bottom-20 h-72 w-72 animate-pulse rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/5 blur-3xl"></div>

        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="mb-6 flex flex-wrap items-center gap-4">
              {/* Back Button */}
              <Link
                href="/events"
                className="group inline-flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2.5 text-sm font-medium backdrop-blur-sm transition-all hover:gap-3 hover:bg-white/20"
              >
                <svg
                  className="h-4 w-4 transition-transform group-hover:-translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back to Events
              </Link>

              {/* Category Badge */}
              <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-5 py-2 text-sm font-semibold backdrop-blur-sm">
                <span className="text-2xl">🎯</span>
                {event.category}
              </div>
            </div>

            {/* Event Title */}
            <h1 className="mb-6 text-3xl leading-tight font-bold md:text-4xl lg:text-5xl xl:text-6xl">
              {event.title}
            </h1>

            {/* Quick Info */}
            <div className="text-primary-100 flex flex-wrap gap-4 md:gap-6">
              <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 backdrop-blur-sm">
                <svg
                  className="text-primary-200 h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span className="text-sm md:text-base">
                  {formatDate(event.date)}
                </span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 backdrop-blur-sm">
                <svg
                  className="text-primary-200 h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-sm md:text-base">{event.time}</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 backdrop-blur-sm">
                <svg
                  className="text-primary-200 h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="text-sm md:text-base">{event.location}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Event Image */}
      <section className="relative -mt-20 pb-12 md:-mt-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">
            <div className="group relative overflow-hidden rounded-2xl shadow-2xl ring-4 ring-white/10 transition-all hover:ring-8 hover:ring-white/20">
              <div className="absolute inset-0 z-10 bg-linear-to-t from-black/50 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100"></div>
              <Image
                src={event.image}
                alt={event.title}
                width={1200}
                height={600}
                className="h-56 w-full object-cover transition-transform duration-500 group-hover:scale-105 sm:h-72 md:h-96 lg:h-125"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Event Details */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Main Content */}
              <div className="space-y-6 lg:col-span-2">
                {/* Description Section */}
                <div className="group rounded-2xl bg-white/10 p-6 backdrop-blur-md transition-all hover:bg-white/15 md:p-8">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="bg-primary-500/20 flex h-12 w-12 items-center justify-center rounded-full">
                      <svg
                        className="text-primary-300 h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white md:text-3xl">
                      About This Event
                    </h2>
                  </div>
                  <div className="space-y-4">
                    <p className="text-lg leading-relaxed text-gray-200">
                      {event.description}
                    </p>
                    <p className="leading-relaxed text-gray-300">
                      {event.fullDescription}
                    </p>
                  </div>
                </div>

                {/* Event Highlights */}
                <div className="group from-primary-500/20 to-secondary-500/20 hover:from-primary-500/30 hover:to-secondary-500/30 overflow-hidden rounded-2xl bg-linear-to-br p-6 backdrop-blur-md transition-all md:p-8">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="bg-secondary-500/20 flex h-12 w-12 items-center justify-center rounded-full">
                      <svg
                        className="text-secondary-300 h-6 w-6"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                        />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-bold text-white">
                      Event Highlights
                    </h2>
                  </div>
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="group/item flex items-start gap-3 rounded-xl bg-white/10 p-4 transition-all hover:bg-white/20">
                      <div className="bg-primary-500/30 mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform group-hover/item:scale-110">
                        <svg
                          className="text-primary-300 h-5 w-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div>
                        <h3 className="mb-1 font-semibold text-white">
                          Duration
                        </h3>
                        <p className="text-sm text-gray-300">
                          {event.duration}
                        </p>
                      </div>
                    </div>
                    <div className="group/item flex items-start gap-3 rounded-xl bg-white/10 p-4 transition-all hover:bg-white/20">
                      <div className="bg-secondary-500/30 mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform group-hover/item:scale-110">
                        <svg
                          className="text-secondary-300 h-5 w-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div>
                        <h3 className="mb-1 font-semibold text-white">
                          Eligibility
                        </h3>
                        <p className="text-sm text-gray-300">
                          {event.eligibility}
                        </p>
                      </div>
                    </div>
                    <div className="group/item flex items-start gap-3 rounded-xl bg-white/10 p-4 transition-all hover:bg-white/20">
                      <div className="bg-primary-500/30 mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform group-hover/item:scale-110">
                        <svg
                          className="text-primary-300 h-5 w-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div>
                        <h3 className="mb-1 font-semibold text-white">
                          Prerequisites
                        </h3>
                        <p className="text-sm text-gray-300">
                          {event.prerequisites}
                        </p>
                      </div>
                    </div>
                    <div className="group/item flex items-start gap-3 rounded-xl bg-white/10 p-4 transition-all hover:bg-white/20">
                      <div className="bg-secondary-500/30 mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-transform group-hover/item:scale-110">
                        <svg
                          className="text-secondary-300 h-5 w-5"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                      <div>
                        <h3 className="mb-1 font-semibold text-white">
                          Registration Deadline
                        </h3>
                        <p className="text-sm text-gray-300">
                          {event.registrationDeadline === 'Open enrollment'
                            ? 'Open enrollment'
                            : formatDate(event.registrationDeadline)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6 lg:col-span-1">
                {/* Registration Card */}
                <div className="from-primary-500 to-secondary-500 hover:shadow-3xl sticky top-6 z-10 overflow-hidden rounded-2xl bg-linear-to-br p-6 text-white shadow-2xl transition-all">
                  <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/10 blur-2xl"></div>
                  <div className="relative">
                    <div className="mb-4 flex items-center gap-2">
                      <span className="shrink-0 text-3xl">🎟️</span>
                      <h3 className="text-xl font-bold wrap-break-word">
                        Register Now
                      </h3>
                    </div>
                    <p className="text-primary-100 mb-6 text-sm leading-relaxed wrap-break-word">
                      Don&apos;t miss this opportunity to enhance your skills
                      and connect with fellow programmers!
                    </p>
                    <div className="space-y-3">
                      <button className="group text-primary-500 w-full rounded-lg bg-white px-6 py-3 font-semibold shadow-lg transition-all hover:scale-105 hover:bg-gray-50 hover:shadow-xl">
                        <span className="flex items-center justify-center gap-2">
                          Register for Event
                          <svg
                            className="h-5 w-5 transition-transform group-hover:translate-x-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M13 7l5 5m0 0l-5 5m5-5H6"
                            />
                          </svg>
                        </span>
                      </button>
                      <Link
                        href="/events"
                        className="block w-full rounded-lg border-2 border-white bg-transparent px-6 py-3 text-center font-semibold transition-all hover:bg-white/10 hover:shadow-lg"
                      >
                        View All Events
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Info Card */}
                <div className="group rounded-2xl bg-white/10 p-6 backdrop-blur-md transition-all hover:bg-white/15">
                  <div className="mb-4 flex items-center gap-2">
                    <span className="shrink-0 text-2xl">💬</span>
                    <h3 className="text-lg font-bold wrap-break-word text-white">
                      Need Help?
                    </h3>
                  </div>
                  <p className="mb-4 text-sm leading-relaxed wrap-break-word text-gray-300">
                    Have questions about this event? Contact us for more
                    information.
                  </p>
                  <Link
                    href="/contact"
                    className="group/link bg-primary-500/20 text-primary-300 hover:bg-primary-500/30 hover:text-primary-200 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all"
                  >
                    Contact Us
                    <svg
                      className="h-4 w-4 transition-transform group-hover/link:translate-x-1"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                </div>

                {/* Share Card */}
                <div className="group rounded-2xl bg-white/10 p-6 backdrop-blur-md transition-all hover:bg-white/15">
                  <div className="mb-4 flex items-center gap-2">
                    <span className="shrink-0 text-2xl">🔗</span>
                    <h3 className="text-lg font-bold wrap-break-word text-white">
                      Share Event
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <button className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 transition-all hover:bg-white/20">
                      <svg
                        className="h-5 w-5 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                      </svg>
                    </button>
                    <button className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 transition-all hover:bg-white/20">
                      <svg
                        className="h-5 w-5 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                      </svg>
                    </button>
                    <button className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 transition-all hover:bg-white/20">
                      <svg
                        className="h-5 w-5 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative overflow-hidden py-16 md:py-20">
        <div className="via-primary-500/5 absolute inset-0 bg-linear-to-b from-transparent to-transparent"></div>
        <div className="bg-primary-500/10 absolute top-0 left-1/4 h-64 w-64 rounded-full blur-3xl"></div>
        <div className="bg-secondary-500/10 absolute right-1/4 bottom-0 h-64 w-64 rounded-full blur-3xl"></div>

        <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl overflow-hidden rounded-2xl bg-white/10 p-8 text-center backdrop-blur-md md:p-12 lg:p-16">
            <div className="mb-6 text-5xl md:text-6xl">🎉</div>
            <h2 className="mb-4 text-2xl font-bold text-white md:text-3xl lg:text-4xl">
              Interested in More Events?
            </h2>
            <p className="mx-auto mb-8 max-w-2xl text-base leading-relaxed text-gray-300 md:text-lg">
              Join NEUPC to get notified about upcoming events, workshops, and
              contests! Be part of a thriving community of passionate
              programmers.
            </p>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/join"
                className="group from-primary-500 to-secondary-500 inline-flex items-center justify-center gap-2 rounded-lg bg-linear-to-r px-8 py-3.5 font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl md:px-10"
              >
                Join the Club
                <svg
                  className="h-5 w-5 transition-transform group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </Link>
              <Link
                href="/events"
                className="group inline-flex items-center justify-center gap-2 rounded-lg border-2 border-white/20 bg-white/10 px-8 py-3.5 font-semibold text-white backdrop-blur-sm transition-all hover:scale-105 hover:border-white/40 hover:bg-white/20 md:px-10"
              >
                Browse All Events
                <svg
                  className="h-5 w-5 transition-transform group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

export default page;

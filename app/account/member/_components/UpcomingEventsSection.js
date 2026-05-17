'use client';

import { motion } from 'framer-motion';
import { CalendarDays, MapPin, Users, ArrowRight, Clock } from 'lucide-react';
import Link from 'next/link';

export default function UpcomingEventsSection({ upcomingEvents }) {
  return (
    <div className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-lg shadow-black/20">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/10">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 rounded-2xl shrink-0">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-light text-zinc-100 uppercase tracking-widest">Upcoming Events</h3>
            <p className="text-xs text-zinc-500 mt-1">Workshops, contests, and meetups you can join</p>
          </div>
        </div>
        <Link 
          href="/account/member/events"
          className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-100 transition-colors shrink-0"
        >
          View All <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {upcomingEvents.map((event) => (
          <EventCard 
            key={event.id}
            date={event.date}
            title={event.title}
            time={event.time}
            location={event.location}
            attendees={`${event.attendees} going`}
            type={event.category}
            status={event.status}
          />
        ))}
      </div>
    </div>
  );
}

function EventCard({ date, title, time, location, attendees, type, status }) {
  const [month, day] = date.split(' ');
  const cleanDay = day?.replace(',', '');
  
  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      className="group flex gap-5 p-5 bg-white/5 border border-white/10 hover:border-indigo-500/30 hover:bg-white/10 rounded-2xl transition-colors cursor-pointer"
    >
      <div className="flex flex-col items-center justify-center w-16 h-16 bg-zinc-900/50 backdrop-blur-xl border border-white/10 shrink-0 shadow-lg shadow-black/40 rounded-2xl group-hover:border-indigo-500/30 transition-colors">
        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{month}</span>
        <span className="text-xl font-light text-zinc-100 leading-none mt-1">{cleanDay}</span>
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2 min-w-0">
          <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-widest bg-zinc-900/50 backdrop-blur-xl border border-white/10 text-zinc-500 shrink-0">{type}</span>
          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-widest border shrink-0 ${status === 'Registered' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30'}`}>
            {status}
          </span>
        </div>
        <h4 className="text-base font-bold text-zinc-100 mb-2 truncate group-hover:text-indigo-400 transition-colors">{title}</h4>
        
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-500 font-medium">
          <span className="flex items-center gap-1.5 shrink-0"><Clock className="w-3.5 h-3.5" /> {time}</span>
          <span className="flex items-center gap-1.5 truncate max-w-[140px]"><MapPin className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">{location}</span></span>
          <span className="flex items-center gap-1.5 shrink-0"><Users className="w-3.5 h-3.5" /> {attendees}</span>
        </div>
      </div>
    </motion.div>
  );
}

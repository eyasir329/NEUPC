import { requireRole } from '@/app/_lib/auth-guard';
import GenerateCertificatesClient from './_components/GenerateCertificatesClient';

export const metadata = { title: 'Generate Certificates | Executive | NEUPC' };

const TEMP_EVENTS = [
  { id: 'e1', title: 'Inter-University Programming Contest 2026',   start_date: '2026-03-15T09:00:00' },
  { id: 'e2', title: 'Hackathon 24H — Build & Innovate',            start_date: '2026-02-28T08:00:00' },
  { id: 'e3', title: 'Web Development Workshop — React & Next.js',  start_date: '2026-03-22T10:00:00' },
  { id: 'e4', title: 'Algorithm Masterclass — Dynamic Programming',  start_date: '2026-04-05T14:00:00' },
  { id: 'e5', title: 'Freshman Orientation — NEUPC Welcome Day',     start_date: '2026-01-15T10:00:00' },
];

const TEMP_CONTESTS = [
  { id: 'c1', title: 'IUPC Internal Qualifier 2026',        start_time: '2026-02-15T10:00:00' },
  { id: 'c2', title: 'NEUPC Monthly Contest — March 2026',  start_time: '2026-03-08T14:00:00' },
  { id: 'c3', title: 'Beginner Friendly Contest — February', start_time: '2026-02-05T15:00:00' },
  { id: 'c4', title: 'Team Training Round — January',        start_time: '2026-01-20T10:00:00' },
];

const TEMP_CERTIFICATES = [
  {
    id: 'cert1',
    certificate_number: 'NEUPC-2026-0001',
    title: 'Certificate of Participation — IUPC 2026',
    certificate_type: 'participation',
    issue_date: '2026-03-16',
    created_at: '2026-03-16T10:00:00',
    recipient: { id: 'u1', full_name: 'Mehedi Hasan', email: 'mehedi.hasan@student.neu.edu.bd' },
  },
  {
    id: 'cert2',
    certificate_number: 'NEUPC-2026-0002',
    title: 'Certificate of Achievement — IUPC 2026 (1st Place)',
    certificate_type: 'achievement',
    issue_date: '2026-03-16',
    created_at: '2026-03-16T10:30:00',
    recipient: { id: 'u3', full_name: 'Ahmed Khan', email: 'ahmed.khan@student.neu.edu.bd' },
  },
  {
    id: 'cert3',
    certificate_number: 'NEUPC-2026-0003',
    title: 'Certificate of Completion — Web Dev Workshop',
    certificate_type: 'completion',
    issue_date: '2026-03-23',
    created_at: '2026-03-23T14:00:00',
    recipient: { id: 'u2', full_name: 'Fatima Rahman', email: 'fatima.rahman@student.neu.edu.bd' },
  },
  {
    id: 'cert4',
    certificate_number: 'NEUPC-2026-0004',
    title: 'Certificate of Completion — Web Dev Workshop',
    certificate_type: 'completion',
    issue_date: '2026-03-23',
    created_at: '2026-03-23T14:05:00',
    recipient: { id: 'u4', full_name: 'Nusrat Jahan', email: 'nusrat.jahan@student.neu.edu.bd' },
  },
  {
    id: 'cert5',
    certificate_number: 'NEUPC-2026-0005',
    title: 'Certificate of Participation — Hackathon 24H',
    certificate_type: 'participation',
    issue_date: '2026-03-02',
    created_at: '2026-03-02T11:00:00',
    recipient: { id: 'u5', full_name: 'Rakib Islam', email: 'rakib.islam@student.neu.edu.bd' },
  },
];

const TEMP_USERS = [
  { id: 'u1', full_name: 'Mehedi Hasan',  email: 'mehedi.hasan@student.neu.edu.bd'  },
  { id: 'u2', full_name: 'Fatima Rahman', email: 'fatima.rahman@student.neu.edu.bd' },
  { id: 'u3', full_name: 'Ahmed Khan',    email: 'ahmed.khan@student.neu.edu.bd'    },
  { id: 'u4', full_name: 'Nusrat Jahan',  email: 'nusrat.jahan@student.neu.edu.bd'  },
  { id: 'u5', full_name: 'Rakib Islam',   email: 'rakib.islam@student.neu.edu.bd'   },
  { id: 'u6', full_name: 'Sadia Sultana', email: 'sadia.sultana@student.neu.edu.bd' },
  { id: 'u7', full_name: 'Imran Hossain', email: 'imran.hossain@student.neu.edu.bd' },
  { id: 'u8', full_name: 'Tania Khanam',  email: 'tania.khanam@student.neu.edu.bd'  },
];

export default async function GenerateCertificatesPage() {
  const { user } = await requireRole(['executive', 'admin']);
  return (
    <GenerateCertificatesClient
      events={TEMP_EVENTS}
      contests={TEMP_CONTESTS}
      certificates={TEMP_CERTIFICATES}
      users={TEMP_USERS}
      userId={user.id}
    />
  );
}

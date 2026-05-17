import { requireRole } from '@/app/_lib/auth-guard';
import MembersClient from './_components/MembersClient';

export const metadata = { title: 'Member Approval | Executive | NEUPC' };

const TEMP_PENDING = [
  {
    id: 'r1',
    name: 'Tanvir Ahmed',
    email: 'tanvir.ahmed@student.neu.edu.bd',
    student_id: '2023-1-60-032',
    batch: '2023',
    department: 'CSE',
    phone: '01712345678',
    interests: ['Competitive Programming', 'Web Development'],
    codeforces_handle: 'tanvir_cp',
    github: 'tanvir-ahmed',
    reason: 'I want to improve my problem solving skills and represent my university in contests.',
    status: 'pending',
    created_at: '2026-02-16T10:30:00',
  },
  {
    id: 'r2',
    name: 'Sumaiya Akter',
    email: 'sumaiya.akter@student.neu.edu.bd',
    student_id: '2023-1-60-047',
    batch: '2023',
    department: 'CSE',
    phone: '01898765432',
    interests: ['AI/ML', 'Web Development'],
    codeforces_handle: '',
    github: 'sumaiya-dev',
    reason: 'NEUPC has a great community and I want to learn from experienced members.',
    status: 'pending',
    created_at: '2026-02-17T14:15:00',
  },
  {
    id: 'r3',
    name: 'Rafiul Islam',
    email: 'rafiul.islam@student.neu.edu.bd',
    student_id: '2024-1-60-011',
    batch: '2024',
    department: 'CSE',
    phone: '01611223344',
    interests: ['Competitive Programming', 'Open Source'],
    codeforces_handle: 'rafiul_codes',
    github: 'rafiulislam',
    reason: 'I participated in school-level olympiads and want to continue in university-level contests.',
    status: 'pending',
    created_at: '2026-02-18T09:45:00',
  },
];

const TEMP_MEMBERS = [
  {
    id: 'u1',
    email: 'mehedi.hasan@student.neu.edu.bd',
    full_name: 'Mehedi Hasan',
    avatar_url: null,
    account_status: 'active',
    created_at: '2025-09-01T10:00:00',
    member_profiles: [{ student_id: '2022-1-60-015', academic_session: '2022', department: 'CSE', github: 'mehedi-hasan', codeforces_handle: 'mehedi_cf' }],
  },
  {
    id: 'u2',
    email: 'fatima.rahman@student.neu.edu.bd',
    full_name: 'Fatima Rahman',
    avatar_url: null,
    account_status: 'active',
    created_at: '2025-09-05T11:00:00',
    member_profiles: [{ student_id: '2022-1-60-029', academic_session: '2022', department: 'CSE', github: 'fatima-r', codeforces_handle: '' }],
  },
  {
    id: 'u3',
    email: 'ahmed.khan@student.neu.edu.bd',
    full_name: 'Ahmed Khan',
    avatar_url: null,
    account_status: 'active',
    created_at: '2025-09-10T09:00:00',
    member_profiles: [{ student_id: '2022-1-60-038', academic_session: '2022', department: 'CSE', github: 'ahmedkhan-dev', codeforces_handle: 'ahmed_khan_cf' }],
  },
  {
    id: 'u4',
    email: 'nusrat.jahan@student.neu.edu.bd',
    full_name: 'Nusrat Jahan',
    avatar_url: null,
    account_status: 'active',
    created_at: '2025-10-01T08:00:00',
    member_profiles: [{ student_id: '2023-1-60-005', academic_session: '2023', department: 'CSE', github: 'nusrat-j', codeforces_handle: '' }],
  },
  {
    id: 'u5',
    email: 'rakib.islam@student.neu.edu.bd',
    full_name: 'Rakib Islam',
    avatar_url: null,
    account_status: 'active',
    created_at: '2025-10-15T12:00:00',
    member_profiles: [{ student_id: '2023-1-60-019', academic_session: '2023', department: 'CSE', github: 'rakib-dev', codeforces_handle: 'rakib_cp' }],
  },
  {
    id: 'u6',
    email: 'sadia.sultana@student.neu.edu.bd',
    full_name: 'Sadia Sultana',
    avatar_url: null,
    account_status: 'active',
    created_at: '2025-11-01T10:00:00',
    member_profiles: [{ student_id: '2023-1-60-031', academic_session: '2023', department: 'CSE', github: '', codeforces_handle: '' }],
  },
  {
    id: 'u7',
    email: 'imran.hossain@student.neu.edu.bd',
    full_name: 'Imran Hossain',
    avatar_url: null,
    account_status: 'pending',
    created_at: '2026-01-10T09:00:00',
    member_profiles: [{ student_id: '2024-1-60-022', academic_session: '2024', department: 'CSE', github: 'imran-h', codeforces_handle: 'imran_cf' }],
  },
  {
    id: 'u8',
    email: 'tania.khanam@student.neu.edu.bd',
    full_name: 'Tania Khanam',
    avatar_url: null,
    account_status: 'active',
    created_at: '2026-01-20T14:00:00',
    member_profiles: [{ student_id: '2024-1-60-008', academic_session: '2024', department: 'CSE', github: 'tania-k', codeforces_handle: '' }],
  },
];

export default async function MembersPage() {
  await requireRole(['executive', 'admin']);
  return <MembersClient pendingRequests={TEMP_PENDING} allMembers={TEMP_MEMBERS} />;
}

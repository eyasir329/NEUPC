'use client';

import { useState, useTransition, useMemo } from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  ShieldOff,
  Ban,
  LockKeyhole,
} from 'lucide-react';
import {
  suspendUserAction,
  banUserAction,
  lockUserAction,
  activateUserAction,
  changeUserRoleAction,
  updateUserAction,
  approveMemberAction,
  approveMembershipAction,
  rejectGuestAction,
  rejectMemberAction,
} from '@/app/_lib/user-actions';
import { ROLES, MODAL_CONFIG } from './constants';
import StatCard from './StatCard';
import ConfirmModal from './ConfirmModal';
import Toast from './Toast';
import GuestPendingApprovals from './GuestPendingApprovals';
import MembershipApprovals from './MembershipApprovals';
import UsersTable from './UsersTable';
import FilterBar from './FilterBar';
import ModalForm from './ModalForm';

// ─── main component ──────────────────────────────────────────

export default function UserManagementClient({ initialUsers, stats }) {
  const [users, setUsers] = useState(initialUsers);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [modal, setModal] = useState(null); // { type, user }
  const [approvalModal, setApprovalModal] = useState(null); // { type, user } for approve/reject
  const [reason, setReason] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [selectedRole, setSelectedRole] = useState('member');
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editStudentId, setEditStudentId] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [toast, setToast] = useState(null);
  const [isPending, startTransition] = useTransition();

  // Extract pending users (those with status === 'Pending' who have NOT submitted a membership application)
  const pendingGuestUsers = useMemo(
    () => users.filter((u) => u.status === 'Pending' && !u.hasProfile),
    [users]
  );

  // Rejected guests who submitted an appeal (status_changed_by === their own id)
  const rejectedGuestAppeals = useMemo(
    () =>
      users.filter(
        (u) =>
          u.status === 'Rejected' &&
          u.role === 'Guest' &&
          u.statusChangedBy === u.id
      ),
    [users]
  );

  // Extract membership pending users - have a member_profiles entry with approved = false
  const pendingMembershipUsers = useMemo(
    () => users.filter((u) => u.hasProfile && u.isApproved === false),
    [users]
  );

  // console.log('Initial users from server:', initialUsers);

  // ── filter ──
  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchSearch =
        !search ||
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()) ||
        u.studentId?.toLowerCase().includes(search.toLowerCase());
      const matchRole = filterRole === 'All' || u.role === filterRole;
      const matchStatus = filterStatus === 'All' || u.status === filterStatus;
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, search, filterRole, filterStatus]);

  // ── toast helper ──
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── optimistic update helper ──
  const updateUserLocally = (userId, changes) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, ...changes } : u))
    );
  };

  // ── open modal ──
  const handleAction = (type, user) => {
    setModal({ type, user });
    setReason('');
    setExpiresAt('');
    setSelectedRole(user.role?.toLowerCase() || 'member');
    setEditName(user.name || '');
    setEditEmail(user.email || '');
    setEditStudentId(user.studentId || '');
    setEditAvatar(user.avatar || '');
  };

  // ── close modal ──
  const closeModal = () => setModal(null);
  const closeApprovalModal = () => {
    setApprovalModal(null);
    setReason('');
  };

  // ── approve/reject handlers ──
  const handleApproveGuest = (user) => {
    setApprovalModal({ type: 'approve', source: 'guest', user });
  };

  const handleApproveMembership = (user) => {
    setApprovalModal({ type: 'approve', source: 'membership', user });
  };

  const handleRejectGuest = (user) => {
    setApprovalModal({ type: 'reject', source: 'guest', user });
    setReason('');
  };

  const handleRejectMember = (user) => {
    setApprovalModal({ type: 'reject', source: 'membership', user });
    setReason('');
  };

  // ── submit ──
  const handleConfirm = () => {
    if (!modal) return;
    const { type, user } = modal;

    // Reason is required for suspend, ban, lock (not activate)
    if (
      (type === 'suspend' || type === 'ban' || type === 'lock') &&
      !reason.trim()
    ) {
      showToast('A reason is required for this action.', 'error');
      return;
    }
    // Expiry date is required for suspend
    if (type === 'suspend' && !expiresAt) {
      showToast('Suspension expiry date is required.', 'error');
      return;
    }

    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.append('userId', user.id);

        if (type === 'activate') {
          fd.append('reason', reason.trim() || 'Account activated by admin');
          await activateUserAction(fd);
          updateUserLocally(user.id, { status: 'Active' });
          showToast(`${user.name}'s account has been activated.`);
        } else if (type === 'suspend') {
          fd.append('reason', reason.trim());
          fd.append('expiresAt', new Date(expiresAt).toISOString());
          await suspendUserAction(fd);
          updateUserLocally(user.id, { status: 'Suspended' });
          showToast(`${user.name} has been suspended.`);
        } else if (type === 'ban') {
          fd.append('reason', reason.trim());
          await banUserAction(fd);
          updateUserLocally(user.id, { status: 'Banned' });
          showToast(`${user.name} has been banned.`);
        } else if (type === 'lock') {
          fd.append('reason', reason.trim());
          await lockUserAction(fd);
          updateUserLocally(user.id, { status: 'Locked' });
          showToast(`${user.name}'s account has been locked.`);
        } else if (type === 'role') {
          fd.append('role', selectedRole);
          await changeUserRoleAction(fd);
          const capRole =
            selectedRole.charAt(0).toUpperCase() + selectedRole.slice(1);
          updateUserLocally(user.id, { role: capRole });
          showToast(`${user.name}'s role changed to ${capRole}.`);
        } else if (type === 'edit') {
          fd.append('name', editName);
          fd.append('email', editEmail);
          fd.append('studentId', editStudentId);
          fd.append('avatar', editAvatar);
          await updateUserAction(fd);
          updateUserLocally(user.id, {
            name: editName,
            email: editEmail,
            studentId: editStudentId,
            avatar: editAvatar,
          });
          showToast(`${editName}'s profile has been updated.`);
        }

        closeModal();
      } catch (err) {
        showToast(err.message || 'Something went wrong.', 'error');
        closeModal();
      }
    });
  };

  // ── approval confirm ──
  const handleApprovalConfirm = () => {
    if (!approvalModal) return;
    const { type, user } = approvalModal;

    // Validate rejection reason is provided
    if (type === 'reject' && !reason.trim()) {
      showToast('Rejection reason is required.', 'error');
      return;
    }

    startTransition(async () => {
      try {
        const fd = new FormData();
        fd.append('userId', user.id);

        if (type === 'approve') {
          if (approvalModal.source === 'membership') {
            await approveMembershipAction(fd);
            updateUserLocally(user.id, {
              status: 'Active',
              isApproved: true,
              role: 'Member',
            });
            showToast(`${user.name}'s membership has been approved.`);
          } else {
            await approveMemberAction(fd);
            updateUserLocally(user.id, { status: 'Active', role: 'Guest' });
            showToast(`${user.name} has been approved as a guest.`);
          }
        } else if (type === 'reject') {
          fd.append('reason', reason.trim());
          if (approvalModal.source === 'guest') {
            await rejectGuestAction(fd);
            // Guest rejection: account is rejected, remove from pending list
            updateUserLocally(user.id, {
              status: 'Rejected',
              statusChangedBy: 'admin',
            });
          } else {
            await rejectMemberAction(fd);
            // Membership rejection: user stays active as a guest, just clear their profile
            updateUserLocally(user.id, {
              hasProfile: false,
              isApproved: null,
            });
          }
          showToast(`${user.name} has been rejected.`);
        }

        closeApprovalModal();
      } catch (err) {
        showToast(err.message || 'Something went wrong.', 'error');
      }
    });
  };

  // ── modal config ──
  const cfg = modal ? MODAL_CONFIG[modal.type] : null;

  return (
    <>
      {/* ── stats ── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard
          icon={Users}
          label="Total Users"
          value={stats.total || 0}
          color="bg-blue-500/15 text-blue-400"
        />
        <StatCard
          icon={CheckCircle2}
          label="Active"
          value={stats.active || 0}
          color="bg-emerald-500/15 text-emerald-400"
        />
        <StatCard
          icon={Clock}
          label="Pending"
          value={stats.pending || 0}
          color="bg-amber-500/15 text-amber-400"
        />
        <StatCard
          icon={ShieldOff}
          label="Suspended"
          value={stats.suspended || 0}
          color="bg-orange-500/15 text-orange-400"
        />
        <StatCard
          icon={Ban}
          label="Banned"
          value={stats.banned || 0}
          color="bg-red-500/15 text-red-400"
        />
        <StatCard
          icon={LockKeyhole}
          label="Locked"
          value={stats.locked || 0}
          color="bg-purple-500/15 text-purple-400"
        />
      </div>

      {/* ── pending approvals ── */}
      {(pendingGuestUsers.length > 0 || rejectedGuestAppeals.length > 0) && (
        <GuestPendingApprovals
          pendingUsers={pendingGuestUsers}
          appealUsers={rejectedGuestAppeals}
          onApprove={handleApproveGuest}
          onReject={handleRejectGuest}
          isPending={isPending}
        />
      )}

      {/* ── membership approvals ── */}
      {pendingMembershipUsers.length > 0 && (
        <MembershipApprovals
          membershipUsers={pendingMembershipUsers}
          onApprove={handleApproveMembership}
          onReject={handleRejectMember}
          isPending={isPending}
        />
      )}

      {/* ── filters bar ── */}
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        filterRole={filterRole}
        onRoleChange={setFilterRole}
        filterStatus={filterStatus}
        onStatusChange={setFilterStatus}
        filteredCount={filtered.length}
        totalCount={users.length}
      />

      {/* ── table ── */}
      <UsersTable filtered={filtered} users={users} onAction={handleAction} />

      {/* ── confirm modal ── */}
      {modal && cfg && (
        <ConfirmModal
          open
          onClose={closeModal}
          onConfirm={handleConfirm}
          title={
            modal.type === 'edit'
              ? `Edit User: ${modal.user.name}`
              : `${cfg.title}`
          }
          description={cfg.description}
          danger={cfg.danger}
          isPending={isPending}
        >
          <ModalForm
            cfg={cfg}
            reason={reason}
            onReasonChange={setReason}
            expiresAt={expiresAt}
            onExpiresAtChange={setExpiresAt}
            selectedRole={selectedRole}
            onRoleChange={setSelectedRole}
            editName={editName}
            onNameChange={setEditName}
            editEmail={editEmail}
            onEmailChange={setEditEmail}
            editStudentId={editStudentId}
            onStudentIdChange={setEditStudentId}
            editAvatar={editAvatar}
            onAvatarChange={setEditAvatar}
          />
        </ConfirmModal>
      )}

      {/* ── approval modal ── */}
      {approvalModal && (
        <ConfirmModal
          open
          onClose={closeApprovalModal}
          onConfirm={handleApprovalConfirm}
          title={
            approvalModal.type === 'approve'
              ? `Approve ${approvalModal.user.name}?`
              : `Reject ${approvalModal.user.name}?`
          }
          description={
            approvalModal.type === 'approve'
              ? 'This will activate the user account.'
              : 'This will reject the user account application. Provide a reason.'
          }
          danger={approvalModal.type === 'reject'}
          isPending={isPending}
        >
          {approvalModal.type === 'reject' && (
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-medium text-gray-300">
                Rejection Reason <span className="text-red-400">*required</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                placeholder="Explain why this application is being rejected…"
                className={`w-full rounded-xl border bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-600 transition-colors outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 ${
                  !reason.trim()
                    ? 'border-red-500/30'
                    : 'border-white/10 hover:border-white/20'
                }`}
              />
            </div>
          )}
        </ConfirmModal>
      )}

      {/* ── toast ── */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}

/**
 * @file Member modal component
 * @module MemberModal
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import {
  X,
  Loader,
  Search,
  Calendar,
  FileText,
  BookOpen,
  Award,
  Github,
  Linkedin,
  Camera,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { uploadUserImageAction } from '@/app/_lib/actions/user-actions';
import { Avatar } from '@/app/account/_components/ui';

function formatDateForInput(iso) {
  if (!iso) return '';
  const date = new Date(iso);
  return date.toISOString().split('T')[0];
}

export default function MemberModal({
  type,
  member,
  positions,
  users,
  onClose,
  onCreate,
  onUpdate,
  isLoading,
  defaultIsCurrent = true,
}) {
  const isCreate = type === 'create';

  const profile = useMemo(() => {
    const profiles = member?.users?.member_profiles;
    if (!profiles) return null;
    if (Array.isArray(profiles)) {
      return profiles[0] || null;
    }
    return profiles;
  }, [member]);

  const [formData, setFormData] = useState({
    user_id: member?.user_id || '',
    position_id: member?.position_id || '',
    term_start: formatDateForInput(member?.term_start),
    term_end: formatDateForInput(member?.term_end),
    is_current: member
      ? member.is_current
        ? 'true'
        : 'false'
      : defaultIsCurrent
        ? 'true'
        : 'false',
    bio: member?.bio || '',
    academic_session: profile?.academic_session || '',
    department: profile?.department || '',
    github: profile?.github || '',
    linkedin: profile?.linkedin || '',
  });

  const [searchUser, setSearchUser] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const userPickerRef = useRef(null);

  const filteredUsers = useMemo(() => {
    if (!searchUser.trim()) return users || [];
    const query = searchUser.toLowerCase();
    return (users || []).filter(
      (u) =>
        u.full_name?.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query)
    );
  }, [searchUser, users]);

  const selectedUser = useMemo(
    () => users?.find((u) => u.id === formData.user_id),
    [formData.user_id, users]
  );

  const [isUploading, setIsUploading] = useState(false);
  const [tempAvatar, setTempAvatar] = useState(null);
  const fileInputRef = useRef(null);
  const router = useRouter();

  const appointedUser = isCreate ? selectedUser : member?.users;

  const handleAvatarClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB.');
      return;
    }

    const targetUserId = appointedUser?.id;
    if (!targetUserId) {
      toast.error('Please select a user first.');
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading('Uploading avatar for member...');

    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      formDataUpload.append('userId', targetUserId);
      formDataUpload.append('updateDb', 'true');

      const result = await uploadUserImageAction(formDataUpload);
      if (result?.error) {
        throw new Error(result.error);
      }
      if (!result?.url) {
        throw new Error('Image upload failed.');
      }

      setTempAvatar(result.url);

      if (member?.users) {
        member.users.avatar_url = result.url;
      }
      if (selectedUser) {
        selectedUser.avatar_url = result.url;
      }

      toast.success('Avatar updated successfully!', { id: toastId });
      router.refresh();
    } catch (err) {
      toast.error(err.message || 'Failed to upload avatar.', { id: toastId });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectUser = (userId) => {
    setFormData((prev) => ({ ...prev, user_id: userId }));
    setSearchUser('');
    setShowUserDropdown(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        userPickerRef.current &&
        !userPickerRef.current.contains(event.target)
      ) {
        setShowUserDropdown(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setShowUserDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    const form = new FormData();

    if (isCreate) {
      form.append(
        'id',
        `cm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      );
      form.append('user_id', formData.user_id);
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'user_id') {
          form.append(key, value);
        }
      });
      onCreate?.(form);
    } else {
      form.append('id', member.id);
      Object.entries(formData).forEach(([key, value]) => {
        if (key !== 'user_id') {
          form.append(key, value);
        }
      });
      onUpdate(form);
    }
  };

  return (
    <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-md">
      <div className="animate-in fade-in zoom-in-95 max-h-[90vh] w-full max-w-md overflow-hidden overflow-y-auto rounded-2xl border border-white/8 bg-gray-900/90 shadow-2xl backdrop-blur-lg duration-200">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/8 bg-gray-900/95 px-6 py-4 backdrop-blur-md">
          <div>
            <h2 className="text-base font-bold text-white">
              {isCreate ? 'Assign Committee Member' : 'Edit Member Assignment'}
            </h2>
            <p className="mt-1 font-mono text-[11px] text-indigo-400">
              {isCreate
                ? '// Appoint a user to a position'
                : `// Editing member: ${member?.users?.full_name}`}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/6 bg-white/2 text-gray-400 transition-all hover:bg-white/8 hover:text-white active:scale-95"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 p-6">
          {/* User Selection */}
          {isCreate && (
            <div ref={userPickerRef} className="relative">
              <label className="mb-1.5 block text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                Select User <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Search className="h-4 w-4 text-gray-500" />
                </div>
                <input
                  type="text"
                  placeholder="Search user by name or email..."
                  value={
                    selectedUser && !showUserDropdown
                      ? `${selectedUser.full_name} (${selectedUser.email})`
                      : searchUser
                  }
                  onChange={(e) => {
                    setSearchUser(e.target.value);
                    setShowUserDropdown(true);
                  }}
                  onFocus={() => setShowUserDropdown(true)}
                  required={!formData.user_id}
                  className="w-full rounded-xl border border-white/8 bg-white/3 py-2.5 pr-3.5 pl-10 text-sm text-white placeholder-gray-600 transition-all outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20"
                />
              </div>

              {/* Dropdown Results */}
              {showUserDropdown && filteredUsers.length > 0 && (
                <div className="absolute top-full right-0 left-0 z-20 mt-1.5 max-h-48 divide-y divide-white/6 overflow-y-auto rounded-xl border border-white/8 bg-gray-950/95 shadow-2xl backdrop-blur-md">
                  {filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => handleSelectUser(user.id)}
                      className="flex w-full flex-col gap-0.5 px-4 py-3 text-left transition-all hover:bg-white/5"
                    >
                      <span className="text-xs font-semibold text-white">
                        {user.full_name}
                      </span>
                      <span className="text-[10px] text-gray-500">
                        {user.email}
                      </span>
                    </button>
                  ))}
                </div>
              )}

              {showUserDropdown && filteredUsers.length === 0 && searchUser && (
                <div className="absolute top-full right-0 left-0 z-20 mt-1.5 rounded-xl border border-white/8 bg-gray-950/95 p-3.5 text-xs text-gray-500">
                  No users matched search criteria
                </div>
              )}
            </div>
          )}

          {/* Appointed User Display Card */}
          {appointedUser && (
            <div className="relative flex items-center gap-3.5 rounded-xl border border-white/8 bg-white/3 p-3.5">
              {/* Interactive Avatar Container */}
              <div
                onClick={handleAvatarClick}
                className="group relative h-11 w-11 shrink-0 cursor-pointer overflow-hidden rounded-full border border-white/10 shadow-lg"
              >
                {/* Hidden input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarUpload}
                  accept="image/*"
                  className="hidden"
                />

                {/* Hover Camera Overlay */}
                {!isUploading && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <Camera className="h-4 w-4 text-indigo-400" />
                  </div>
                )}

                {/* Upload spinner */}
                {isUploading && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-full bg-black/75 text-white">
                    <Loader className="h-4 w-4 animate-spin text-indigo-400" />
                  </div>
                )}

                {/* Avatar Visual representation */}
                <Avatar
                  name={appointedUser?.full_name || 'Unknown'}
                  size="sm"
                  src={tempAvatar || appointedUser?.avatar_url}
                />
              </div>

              <div className="min-w-0 flex-1">
                <span className="block text-[9px] font-bold tracking-wider text-gray-500 uppercase">
                  {isCreate
                    ? 'Selected Member Candidate'
                    : 'Currently Appointed Member'}
                </span>
                <p className="mt-0.5 truncate text-sm font-semibold text-white">
                  {appointedUser?.full_name}
                </p>
                <p className="mt-0.5 truncate text-xs text-gray-400">
                  {appointedUser?.email}
                </p>
                <span className="mt-1 block text-[8px] font-bold tracking-widest text-indigo-400/80 uppercase">
                  Click avatar to change picture
                </span>
              </div>
            </div>
          )}

          {/* Position */}
          <div>
            <label className="mb-1.5 block text-[10px] font-bold tracking-wider text-gray-400 uppercase">
              Assign Committee Role <span className="text-rose-400">*</span>
            </label>
            <select
              name="position_id"
              value={formData.position_id}
              onChange={handleChange}
              required
              className="w-full cursor-pointer rounded-xl border border-white/8 bg-white/3 px-3.5 py-2.5 text-sm text-white transition-all outline-none focus:border-indigo-500/50"
              style={{ colorScheme: 'dark' }}
            >
              <option value="" disabled>
                Select role position
              </option>
              {positions.map((pos) => (
                <option key={pos.id} value={pos.id}>
                  {pos.title} ({pos.category})
                </option>
              ))}
            </select>
          </div>

          {/* Term Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block flex items-center gap-1 text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                <Calendar className="h-3.5 w-3.5 text-gray-500" />
                Term Start <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                name="term_start"
                value={formData.term_start}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-white/8 bg-white/3 px-3.5 py-2.5 text-sm text-white transition-all outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20"
                style={{ colorScheme: 'dark' }}
              />
            </div>

            <div>
              <label className="mb-1.5 block flex items-center gap-1 text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                <Calendar className="h-3.5 w-3.5 text-gray-500" />
                Term End
              </label>
              <input
                type="date"
                name="term_end"
                value={formData.term_end}
                onChange={handleChange}
                className="w-full rounded-xl border border-white/8 bg-white/3 px-3.5 py-2.5 text-sm text-white transition-all outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20"
                style={{ colorScheme: 'dark' }}
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="mb-1.5 block text-[10px] font-bold tracking-wider text-gray-400 uppercase">
              Appointment Status
            </label>
            <select
              name="is_current"
              value={formData.is_current}
              onChange={handleChange}
              className="w-full cursor-pointer rounded-xl border border-white/8 bg-white/3 px-3.5 py-2.5 text-sm text-white transition-all outline-none focus:border-indigo-500/50"
              style={{ colorScheme: 'dark' }}
            >
              <option value="true">Current Term (Active)</option>
              <option value="false">Past Term (Archived)</option>
            </select>
          </div>

          {/* Academic Info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block flex items-center gap-1 text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                <BookOpen className="h-3.5 w-3.5 text-gray-500" />
                Academic Session
              </label>
              <input
                type="text"
                name="academic_session"
                value={formData.academic_session}
                onChange={handleChange}
                placeholder="e.g. 2021-22"
                className="w-full rounded-xl border border-white/8 bg-white/3 px-3.5 py-2.5 text-sm text-white placeholder-gray-600 transition-all outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block flex items-center gap-1 text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                <Award className="h-3.5 w-3.5 text-gray-500" />
                Department
              </label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder="e.g. Department of CSE"
                className="w-full rounded-xl border border-white/8 bg-white/3 px-3.5 py-2.5 text-sm text-white placeholder-gray-600 transition-all outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* Social Profiles */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block flex items-center gap-1 text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                <Github className="h-3.5 w-3.5 text-gray-500" />
                GitHub Link
              </label>
              <input
                type="text"
                name="github"
                value={formData.github}
                onChange={handleChange}
                placeholder="github.com/username"
                className="w-full rounded-xl border border-white/8 bg-white/3 px-3.5 py-2.5 text-sm text-white placeholder-gray-600 transition-all outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label className="mb-1.5 block flex items-center gap-1 text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                <Linkedin className="h-3.5 w-3.5 text-gray-500" />
                LinkedIn Link
              </label>
              <input
                type="text"
                name="linkedin"
                value={formData.linkedin}
                onChange={handleChange}
                placeholder="linkedin.com/in/username"
                className="w-full rounded-xl border border-white/8 bg-white/3 px-3.5 py-2.5 text-sm text-white placeholder-gray-600 transition-all outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="mb-1.5 block flex items-center gap-1 text-[10px] font-bold tracking-wider text-gray-400 uppercase">
              <FileText className="h-3.5 w-3.5 text-gray-500" />
              Member Bio / Profile
            </label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleChange}
              rows={3}
              placeholder="Provide a short biography or description for this committee member..."
              className="w-full resize-none rounded-xl border border-white/8 bg-white/3 px-3.5 py-2.5 text-sm text-white placeholder-gray-600 transition-all outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20"
            />
          </div>

          {/* Actions */}
          <div className="mt-2 flex gap-3 border-t border-white/8 pt-5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-white/8 bg-white/5 py-2.5 text-xs font-semibold text-gray-300 transition-all hover:bg-white/10 hover:text-white active:scale-95"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || (isCreate && !formData.user_id)}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-xs font-semibold text-white transition-all hover:bg-indigo-500 hover:shadow-[0_0_20px_rgba(99,102,241,0.35)] active:scale-95 disabled:pointer-events-none disabled:opacity-50"
            >
              {isLoading && <Loader className="h-3.5 w-3.5 animate-spin" />}
              {isCreate ? 'Assign Member' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

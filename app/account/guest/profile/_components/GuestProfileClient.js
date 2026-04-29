/**
 * @file Guest profile client — editable profile view for updating
 *   personal information, avatar, and contact details.
 * @module GuestProfileClient
 */

'use client';

import { useState, useTransition } from 'react';
import { useScrollLock } from '@/app/_lib/hooks';
import {
  User,
  Shield,
  CheckCircle2,
  XCircle,
  Calendar,
  Save,
  X,
  Sparkles,
  LogOut,
  AlertTriangle,
  Clock,
  Trash2,
  Loader2,
  Upload,
  Pencil,
  Bell,
  Award,
  Github,
} from 'lucide-react';
import { updateGuestInfoAction } from '@/app/_lib/guest-actions';
import {
  uploadAvatarAction,
  removeAvatarAction,
} from '@/app/_lib/avatar-actions';
import { signOutAction } from '@/app/_lib/actions';
import {
  PageHead,
  CardHead,
  Stat,
  StatRow,
  Badge,
  Btn,
  LockedRow,
} from '../../_components/ui';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}
function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function profileCompletion(user) {
  const fields = [
    !!user.full_name,
    !!user.email,
    !!user.phone,
    !!user.avatar_url,
    !!(user.email_verified || user.is_email_verified),
  ];
  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
}

function DeleteModal({ onClose }) {
  const [confirmed, setConfirmed] = useState('');
  useScrollLock();
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="gp-card w-full max-w-md"
        style={{ borderColor: 'oklch(0.45 0.15 25)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="gp-card-body">
          <div className="flex items-center gap-3" style={{ marginBottom: 14 }}>
            <div
              className="grid place-items-center"
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'oklch(0.68 0.18 25 / 0.12)',
                border: '1px solid oklch(0.68 0.18 25 / 0.3)',
                color: 'oklch(0.85 0.16 25)',
              }}
            >
              <AlertTriangle size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600, margin: 0 }}>Delete account</h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--gp-text-3)' }}>
                This action is irreversible.
              </p>
            </div>
          </div>
          <p style={{ fontSize: 13, color: 'var(--gp-text-2)', lineHeight: 1.5, marginBottom: 14 }}>
            Deleting your account permanently removes your data, registrations, and any pending applications. Type{' '}
            <span className="gp-mono" style={{ color: 'oklch(0.85 0.16 25)' }}>
              DELETE
            </span>{' '}
            to confirm.
          </p>
          <input
            value={confirmed}
            onChange={(e) => setConfirmed(e.target.value)}
            placeholder="Type DELETE to confirm"
            className="gp-input"
            style={{ marginBottom: 12 }}
          />
          <div className="flex gap-2">
            <button
              disabled={confirmed !== 'DELETE'}
              className="gp-btn gp-btn-danger flex-1 justify-center"
              style={{ opacity: confirmed === 'DELETE' ? 1 : 0.4 }}
            >
              Delete account
            </button>
            <button onClick={onClose} className="gp-btn flex-1 justify-center">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function EditInfoForm({ user, onCancel, onSaved }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await updateGuestInfoAction(fd);
      if (result?.error) {
        setError(result.error);
      } else {
        setSuccess(true);
        setTimeout(onSaved, 600);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-3 sm:grid-cols-2">
      <div>
        <label className="gp-field-label">Full name *</label>
        <input className="gp-input" name="full_name" defaultValue={user.full_name ?? ''} required />
      </div>
      <div>
        <label className="gp-field-label">Phone</label>
        <input className="gp-input" name="phone" defaultValue={user.phone ?? ''} placeholder="+880 1xxx xxxxxx" />
      </div>
      {error && (
        <div
          className="sm:col-span-2"
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            background: 'oklch(0.68 0.18 25 / 0.1)',
            border: '1px solid oklch(0.68 0.18 25 / 0.3)',
            color: 'oklch(0.85 0.16 25)',
            fontSize: 12,
          }}
        >
          <XCircle size={12} style={{ display: 'inline', marginRight: 6 }} /> {error}
        </div>
      )}
      {success && (
        <div
          className="sm:col-span-2"
          style={{
            padding: '8px 12px',
            borderRadius: 8,
            background: 'oklch(0.74 0.14 155 / 0.12)',
            border: '1px solid oklch(0.74 0.14 155 / 0.3)',
            color: 'oklch(0.85 0.14 155)',
            fontSize: 12,
          }}
        >
          <CheckCircle2 size={12} style={{ display: 'inline', marginRight: 6 }} /> Profile updated.
        </div>
      )}
      <div className="sm:col-span-2 flex gap-2">
        <button type="submit" disabled={isPending} className="gp-btn gp-btn-primary">
          <Save size={13} /> {isPending ? 'Saving…' : 'Save changes'}
        </button>
        <button type="button" onClick={onCancel} className="gp-btn">
          <X size={13} /> Cancel
        </button>
      </div>
    </form>
  );
}

function AvatarUploader({ user, initials }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const isImage = user.avatar_url?.startsWith('/api/image/');

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.set('file', file);
      const result = await uploadAvatarAction(fd);
      if (result?.error) setError(result.error);
    } catch {
      setError('Upload failed.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function handleRemove() {
    setError(null);
    setUploading(true);
    try {
      const result = await removeAvatarAction();
      if (result?.error) setError(result.error);
    } catch {
      setError('Failed to remove avatar.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        {isImage ? (
          <img
            src={user.avatar_url}
            alt={user.full_name ?? 'Avatar'}
            style={{
              width: 72,
              height: 72,
              borderRadius: 14,
              border: '1px solid var(--gp-line)',
              objectFit: 'cover',
            }}
          />
        ) : (
          <div
            className="grid place-items-center"
            style={{
              width: 72,
              height: 72,
              borderRadius: 14,
              background:
                'linear-gradient(135deg, oklch(0.5 0.15 var(--gp-accent-h)), oklch(0.35 0.1 var(--gp-accent-h)))',
              fontSize: 22,
              fontWeight: 600,
              color: '#fff',
            }}
          >
            {initials}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1.5">
        <label className="gp-btn gp-btn-sm" style={{ cursor: 'pointer' }}>
          {uploading ? <Loader2 size={11} className="animate-spin" /> : <Upload size={11} />} Upload
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="hidden"
            disabled={uploading}
            onChange={handleFileChange}
          />
        </label>
        {isImage && (
          <button
            type="button"
            onClick={handleRemove}
            disabled={uploading}
            className="gp-btn gp-btn-sm gp-btn-danger"
          >
            <Trash2 size={11} /> Remove
          </button>
        )}
      </div>
      {error && <p style={{ fontSize: 10.5, color: 'oklch(0.85 0.16 25)' }}>{error}</p>}
    </div>
  );
}

function FieldDisplay({ label, value, suffix }) {
  return (
    <div>
      <div
        className="gp-mono"
        style={{
          fontSize: 10.5,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: 'var(--gp-text-4)',
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div className="flex items-center gap-2" style={{ fontSize: 13.5 }}>
        {value}
        {suffix}
      </div>
    </div>
  );
}

export default function GuestProfileClient({ user, stats }) {
  const [editing, setEditing] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const initials = (user.full_name ?? user.email ?? 'G')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const completion = profileCompletion(user);
  const verified = user.email_verified || user.is_email_verified;

  return (
    <div className="gp-page">
      {showDelete && <DeleteModal onClose={() => setShowDelete(false)} />}

      <PageHead
        eyebrow="Account"
        title="My profile"
        sub="Manage your account information and visibility."
        actions={
          !editing && (
            <Btn onClick={() => setEditing(true)}>
              <Pencil size={13} /> Edit profile
            </Btn>
          )
        }
      />

      {/* Profile overview */}
      <div className="gp-card" style={{ padding: 22, marginBottom: 16 }}>
        <div className="flex items-center gap-5 flex-wrap">
          <AvatarUploader user={user} initials={initials} />
          <div className="flex-1 min-w-55">
            <div className="flex flex-wrap items-center gap-2.5" style={{ marginBottom: 4 }}>
              <h2 style={{ margin: 0, fontSize: 19, fontWeight: 600, letterSpacing: '-0.015em' }}>
                {user.full_name || 'Guest user'}
              </h2>
              <Badge variant="success">
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: 'oklch(0.85 0.14 155)',
                  }}
                />
                {user.account_status ?? 'active'}
              </Badge>
              <Badge variant="accent">Guest account</Badge>
            </div>
            <div
              className="gp-mono"
              style={{ fontSize: 12.5, color: 'var(--gp-text-3)', marginBottom: 10 }}
            >
              {user.email} · Joined {formatDate(user.created_at)}
            </div>
            <div className="flex items-center gap-3 flex-wrap" style={{ fontSize: 11.5, color: 'var(--gp-text-3)' }}>
              <span>Profile completeness</span>
              <div className="gp-progress" style={{ width: 200 }}>
                <div className="gp-progress-fill" style={{ width: `${completion}%` }} />
              </div>
              <b className="gp-mono" style={{ color: 'var(--gp-text)' }}>
                {completion}%
              </b>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div
              className="gp-mono"
              style={{
                fontSize: 11,
                color: 'var(--gp-text-4)',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 4,
              }}
            >
              Last active
            </div>
            <div style={{ fontSize: 12.5, fontWeight: 500 }}>{formatDateTime(user.last_login)}</div>
          </div>
        </div>
        {editing && (
          <div style={{ marginTop: 18, paddingTop: 18, borderTop: '1px solid var(--gp-line)' }}>
            <EditInfoForm
              user={user}
              onCancel={() => setEditing(false)}
              onSaved={() => setEditing(false)}
            />
          </div>
        )}
      </div>

      <StatRow cols={4}>
        <Stat icon={Calendar} label="Registered" value={stats.eventsRegistered} />
        <Stat icon={CheckCircle2} label="Attended" value={stats.eventsAttended} />
        <Stat icon={Award} label="Certificates" value={stats.certificates} />
        <Stat icon={Bell} label="Notifications" value={stats.notices} />
      </StatRow>

      <div className="grid gap-4 sm:grid-cols-2" style={{ marginBottom: 16 }}>
        <div className="gp-card">
          <CardHead
            icon={User}
            title="Personal information"
            action={
              !editing && (
                <Btn variant="ghost" size="sm" onClick={() => setEditing(true)}>
                  <Pencil size={11} /> Edit
                </Btn>
              )
            }
          />
          <div className="gp-card-body grid gap-4">
            <FieldDisplay label="Full name" value={user.full_name || '—'} />
            <FieldDisplay
              label="Email"
              value={user.email}
              suffix={
                verified ? (
                  <Badge variant="success" style={{ fontSize: 9, padding: '1px 5px' }}>
                    verified
                  </Badge>
                ) : (
                  <Badge style={{ fontSize: 9, padding: '1px 5px' }}>unverified</Badge>
                )
              }
            />
            <FieldDisplay label="Phone" value={user.phone || '—'} />
            <FieldDisplay
              label="Account role"
              value="Guest"
              suffix={<Badge variant="accent">Upgrade available</Badge>}
            />
          </div>
        </div>

        <div className="gp-card">
          <CardHead icon={Shield} title="Security" />
          <div className="gp-card-body grid gap-4">
            <FieldDisplay
              label="Sign-in method"
              value={
                <span className="flex items-center gap-2">
                  <Github size={14} /> Google OAuth · Managed externally
                </span>
              }
            />
            <FieldDisplay label="Last login" value={formatDateTime(user.last_login)} />
            <div>
              <div
                className="gp-mono"
                style={{
                  fontSize: 10.5,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--gp-text-4)',
                  marginBottom: 4,
                }}
              >
                2FA
              </div>
              <LockedRow label="Two-factor authentication" reason="Available to members for added security." />
            </div>
            {user.suspension_expires_at &&
              new Date(user.suspension_expires_at) > new Date() && (
                <div
                  className="flex items-start gap-3"
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: 'oklch(0.78 0.13 75 / 0.1)',
                    border: '1px solid oklch(0.78 0.13 75 / 0.3)',
                  }}
                >
                  <Clock size={14} style={{ color: 'oklch(0.85 0.13 75)', marginTop: 2 }} />
                  <div style={{ fontSize: 12.5 }}>
                    <div style={{ fontWeight: 600, color: 'oklch(0.85 0.13 75)' }}>Account suspended</div>
                    <div style={{ color: 'var(--gp-text-3)' }}>
                      Expires: {formatDateTime(user.suspension_expires_at)}
                    </div>
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>

      {/* Upgrade banner */}
      <div
        className="gp-card"
        style={{
          padding: 18,
          marginBottom: 16,
          background: 'linear-gradient(135deg, var(--gp-surface), oklch(0.18 0.02 var(--gp-accent-h)))',
          borderColor: 'var(--gp-accent-line)',
        }}
      >
        <div className="flex items-center gap-3.5 flex-wrap" style={{ marginBottom: 14 }}>
          <div
            className="grid place-items-center"
            style={{
              width: 36,
              height: 36,
              borderRadius: 9,
              background: 'var(--gp-accent-soft)',
              border: '1px solid var(--gp-accent-line)',
              color: 'var(--gp-accent-text)',
            }}
          >
            <Sparkles size={18} />
          </div>
          <div className="flex-1">
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
              Upgrade to full membership
            </div>
            <div style={{ fontSize: 12, color: 'var(--gp-text-3)' }}>
              Unlock the complete NEUPC experience.
            </div>
          </div>
          <Btn href="/account/guest/membership-application" variant="primary">
            Apply now →
          </Btn>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            'Contest participation & rankings',
            'Performance analytics dashboard',
            'Members-only resources & editorials',
            'Achievement badges & certificates',
            'Advanced notification system',
            'Mentor access & guidance',
          ].map((t) => (
            <div
              key={t}
              className="flex items-center gap-2"
              style={{ fontSize: 12.5, color: 'var(--gp-text-2)' }}
            >
              <CheckCircle2 size={13} style={{ color: 'var(--gp-accent-text)' }} /> {t}
            </div>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div className="gp-card">
        <CardHead
          title={
            <span style={{ color: 'oklch(0.85 0.16 25)', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <LogOut size={14} /> Danger zone
            </span>
          }
        />
        <div className="gp-card-body grid gap-3">
          <div className="gp-row-between">
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Sign out</div>
              <div style={{ fontSize: 11.5, color: 'var(--gp-text-3)' }}>
                End your current session.
              </div>
            </div>
            <form action={signOutAction}>
              <button type="submit" className="gp-btn">
                <LogOut size={12} /> Sign out
              </button>
            </form>
          </div>
          <div className="gp-row-between">
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>Delete account</div>
              <div style={{ fontSize: 11.5, color: 'var(--gp-text-3)' }}>
                Permanently remove your account and all associated data.
              </div>
            </div>
            <button onClick={() => setShowDelete(true)} className="gp-btn gp-btn-danger">
              <X size={12} /> Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

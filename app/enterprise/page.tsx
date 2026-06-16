'use client';

import { motion } from 'motion/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { GlowCard } from '../../components/ui/glow-card';
import { GradientBorderButton } from '../../components/ui/gradient-border-button';
import { Footer } from '../../components/ui/footer';
import { Skeleton } from '../../components/ui/skeleton';

interface MemberItem {
  _id: string;
  name?: string;
  email: string;
  role: 'user' | 'admin' | 'enterprise_admin';
  status: 'active' | 'disabled';
  createdAt: string;
}

interface MeetingItem {
  _id: string;
  meetingId: string;
  title: string;
  hostEmail: string;
  joinCount: number;
  createdAt: string;
}

interface OrgDetails {
  _id: string;
  name: string;
  domain?: string;
  logoUrl?: string;
  billingPlan: string;
  ssoSettings: {
    enabled: boolean;
    idpEntityId?: string;
    ssoUrl?: string;
    certificate?: string;
  };
  policies: {
    recordingAllowed: boolean;
    chatEnabled: boolean;
    requirePassword: boolean;
  };
}

interface OrgStats {
  totalMembers: number;
  totalMeetings: number;
  activeMeetings: number;
  totalParticipantJoins: number;
  meetingsByDay: Array<{ day: string; count: number }>;
}

export default function EnterpriseDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'analytics' | 'members' | 'policies' | 'sso' | 'settings'>('analytics');

  // Data states
  const [org, setOrg] = useState<OrgDetails | null>(null);
  const [stats, setStats] = useState<OrgStats | null>(null);
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [meetings, setMeetings] = useState<MeetingItem[]>([]);

  // Action states
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form states
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'user' | 'enterprise_admin'>('user');
  const [orgName, setOrgName] = useState('');
  const [orgLogoUrl, setOrgLogoUrl] = useState('');
  const [orgDomain, setOrgDomain] = useState('');

  // SSO Form states
  const [ssoEnabled, setSsoEnabled] = useState(false);
  const [ssoIdpEntityId, setSsoIdpEntityId] = useState('');
  const [ssoUrl, setSsoUrl] = useState('');
  const [ssoCert, setSsoCert] = useState('');

  useEffect(() => {
    document.body.classList.add('landing-page');
    return () => {
      document.body.classList.remove('landing-page');
    };
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/sign-in?callbackUrl=/enterprise');
    } else if (status === 'authenticated') {
      const user = session?.user as any;
      if (user.role !== 'enterprise_admin' && user.role !== 'admin') {
        router.push('/dashboard');
      } else {
        void fetchAllData();
      }
    }
  }, [status, session, router]);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [orgRes, statsRes, membersRes, meetingsRes] = await Promise.all([
        fetch('/api/enterprise/org'),
        fetch('/api/enterprise/stats'),
        fetch('/api/enterprise/members'),
        fetch('/api/enterprise/meetings'),
      ]);

      if (orgRes.ok) {
        const d = await orgRes.json();
        setOrg(d.organization);
        setOrgName(d.organization.name);
        setOrgLogoUrl(d.organization.logoUrl || '');
        setOrgDomain(d.organization.domain || '');
        setSsoEnabled(d.organization.ssoSettings?.enabled || false);
        setSsoIdpEntityId(d.organization.ssoSettings?.idpEntityId || '');
        setSsoUrl(d.organization.ssoSettings?.ssoUrl || '');
        setSsoCert(d.organization.ssoSettings?.certificate || '');
      } else {
        throw new Error('Could not retrieve organization info');
      }

      if (statsRes.ok) {
        const d = await statsRes.json();
        setStats(d.stats);
      }

      if (membersRes.ok) {
        const d = await membersRes.json();
        setMembers(d.members || []);
      }

      if (meetingsRes.ok) {
        const d = await meetingsRes.json();
        setMeetings(d.meetings || []);
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Failed to load enterprise data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading('settings-update');
      const response = await fetch('/api/enterprise/org', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: orgName,
          logoUrl: orgLogoUrl,
          domain: orgDomain || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update organization settings');

      showToast('Settings saved successfully');
      setOrg(data.organization);
    } catch (err: any) {
      showToast(err.message || 'Failed to update settings', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdatePolicies = async (updatedPolicies: Partial<OrgDetails['policies']>) => {
    if (!org) return;
    try {
      setActionLoading('policies-update');
      const response = await fetch('/api/enterprise/org', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          policies: {
            ...org.policies,
            ...updatedPolicies,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to update policies');

      showToast('Meeting policies updated');
      setOrg(data.organization);
    } catch (err: any) {
      showToast(err.message || 'Failed to update policies', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateSSO = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading('sso-update');
      const response = await fetch('/api/enterprise/org', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ssoSettings: {
            enabled: ssoEnabled,
            idpEntityId: ssoIdpEntityId,
            ssoUrl,
            certificate: ssoCert,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to save SSO settings');

      showToast('SSO settings saved successfully');
      setOrg(data.organization);
    } catch (err: any) {
      showToast(err.message || 'Failed to save SSO settings', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;

    try {
      setActionLoading('member-invite');
      const response = await fetch('/api/enterprise/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to add member');

      showToast(`Successfully added ${inviteEmail} to organization`);
      setInviteEmail('');
      
      // Refresh members list
      const membersRes = await fetch('/api/enterprise/members');
      if (membersRes.ok) {
        const d = await membersRes.json();
        setMembers(d.members || []);
      }
      
      // Refresh stats
      void fetch('/api/enterprise/stats').then((res) => {
        if (res.ok) res.json().then((d) => setStats(d.stats));
      });
    } catch (err: any) {
      showToast(err.message || 'Failed to add member', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveMember = async (userId: string, email: string) => {
    if (!confirm(`Are you sure you want to remove ${email} from the organization?`)) return;

    try {
      setActionLoading(`member-remove-${userId}`);
      const response = await fetch(`/api/enterprise/members?userId=${userId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to remove member');

      showToast('Member removed successfully');
      setMembers((prev) => prev.filter((m) => m._id !== userId));

      // Refresh stats
      void fetch('/api/enterprise/stats').then((res) => {
        if (res.ok) res.json().then((d) => setStats(d.stats));
      });
    } catch (err: any) {
      showToast(err.message || 'Failed to remove member', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="page-shell-wide space-y-10">
        <section className="relative overflow-hidden rounded-[2.75rem] border border-white/70 bg-white/75 p-6 shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur sm:p-10">
          <Skeleton className="h-3 w-28" />
          <Skeleton className="mt-4 h-12 w-full max-w-2xl" />
          <div className="mt-8 grid gap-4 md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={`ent-skeleton-stat-${index}`} className="h-28 rounded-[1.75rem]" />
            ))}
          </div>
          <div className="mt-10 h-96 rounded-[1.75rem]">
            <Skeleton className="h-full w-full rounded-[1.75rem]" />
          </div>
        </section>
      </div>
    );
  }

  if (status !== 'authenticated' || !org) {
    return null;
  }

  return (
    <div className="page-shell-wide space-y-10 pb-16">
      <motion.section
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative overflow-hidden rounded-[2.75rem] border border-white/70 bg-white/75 p-6 shadow-[0_30px_90px_rgba(15,23,42,0.12)] backdrop-blur sm:p-10"
      >
        {/* Glow gradients background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(16,185,129,0.15),transparent_45%),radial-gradient(circle_at_86%_24%,rgba(14,165,233,0.12),transparent_42%),radial-gradient(circle_at_68%_82%,rgba(245,158,11,0.12),transparent_46%)]" />

        <div className="relative z-10 space-y-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                {org.logoUrl && (
                  <img src={org.logoUrl} alt="Logo" className="h-10 w-10 object-contain rounded-lg" />
                )}
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">
                    Enterprise Portal
                  </p>
                  <h1 className="font-display text-4xl font-semibold leading-tight text-slate-950 sm:text-5xl">
                    🏢 {org.name}
                  </h1>
                </div>
              </div>
              <p className="text-base text-slate-600">
                Configure SSO, set company-wide meeting policies, and manage your workforce roster.
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <GlowCard className="p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Total Members</p>
                <p className="mt-3 font-display text-3xl font-semibold text-slate-950">{stats.totalMembers}</p>
                <p className="mt-1 text-sm text-slate-500">Employees in workspace</p>
              </GlowCard>
              <GlowCard className="p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Org Rooms</p>
                <p className="mt-3 font-display text-3xl font-semibold text-slate-950">{stats.totalMeetings}</p>
                <p className="mt-1 text-sm text-slate-500">Meetings hosted by members</p>
              </GlowCard>
              <GlowCard className="p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Total Joins</p>
                <p className="mt-3 font-display text-3xl font-semibold text-slate-950">{stats.totalParticipantJoins}</p>
                <p className="mt-1 text-sm text-slate-500">Total attendee connections</p>
              </GlowCard>
              <GlowCard className="p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">Live Sessions</p>
                <p className="mt-3 font-display text-3xl font-semibold text-emerald-600">{stats.activeMeetings}</p>
                <p className="mt-1 text-sm text-slate-500">Active corporate calls</p>
              </GlowCard>
            </div>
          )}

          {/* Tabs Switcher */}
          <div className="flex border-b border-slate-200 overflow-x-auto whitespace-nowrap">
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-6 py-3 text-sm font-semibold transition border-b-2 -mb-[2px] ${
                activeTab === 'analytics'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              📊 Analytics
            </button>
            <button
              onClick={() => setActiveTab('members')}
              className={`px-6 py-3 text-sm font-semibold transition border-b-2 -mb-[2px] ${
                activeTab === 'members'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              👥 Member Roster
            </button>
            <button
              onClick={() => setActiveTab('policies')}
              className={`px-6 py-3 text-sm font-semibold transition border-b-2 -mb-[2px] ${
                activeTab === 'policies'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              🔒 Security Policies
            </button>
            <button
              onClick={() => setActiveTab('sso')}
              className={`px-6 py-3 text-sm font-semibold transition border-b-2 -mb-[2px] ${
                activeTab === 'sso'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              🔑 SSO / SAML
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-6 py-3 text-sm font-semibold transition border-b-2 -mb-[2px] ${
                activeTab === 'settings'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              ⚙️ Organization Settings
            </button>
          </div>

          {/* Tab Contents */}
          <div className="mt-6">
            {activeTab === 'analytics' && stats && (
              <div className="grid gap-6 md:grid-cols-[1.5fr_1fr]">
                <GlowCard className="p-6">
                  <h3 className="font-display text-lg font-semibold text-slate-950">Meeting volume (last 7 days)</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Daily created video rooms across your workspace</p>
                  
                  {/* CSS Bar Chart */}
                  <div className="mt-8 flex h-56 items-end justify-between gap-4 px-2">
                    {stats.meetingsByDay.map((dayItem) => {
                      // Find max count to scale heights
                      const maxCount = Math.max(...stats.meetingsByDay.map((d) => d.count), 1);
                      const heightPercent = (dayItem.count / maxCount) * 100;
                      
                      return (
                        <div key={dayItem.day} className="flex flex-col items-center flex-1 group">
                          <div className="relative w-full flex justify-center">
                            {dayItem.count > 0 && (
                              <span className="absolute -top-7 rounded bg-slate-900 px-1.5 py-0.5 text-[10px] text-white opacity-0 group-hover:opacity-100 transition">
                                {dayItem.count}
                              </span>
                            )}
                            <div
                              style={{ height: `${Math.max(heightPercent, 4)}%` }}
                              className={`w-full rounded-t-lg bg-gradient-to-t from-emerald-500 to-teal-400 group-hover:from-emerald-400 group-hover:to-teal-300 transition-all duration-300 min-h-[8px]`}
                            />
                          </div>
                          <span className="mt-2 text-xs font-semibold text-slate-500">{dayItem.day}</span>
                        </div>
                      );
                    })}
                  </div>
                </GlowCard>

                <div className="space-y-4">
                  <GlowCard className="p-6">
                    <h3 className="font-display text-lg font-semibold text-slate-950">Active workspace members</h3>
                    <div className="mt-4 divide-y divide-slate-100 max-h-56 overflow-y-auto">
                      {members.slice(0, 5).map((member) => (
                        <div key={member._id} className="py-2.5 flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-xs text-slate-900">{member.name || 'Invited User'}</div>
                            <div className="text-[10px] text-slate-500">{member.email}</div>
                          </div>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] uppercase font-bold text-slate-600">
                            {member.role === 'enterprise_admin' ? 'Admin' : 'Member'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </GlowCard>

                  <GlowCard className="p-6">
                    <h3 className="font-display text-lg font-semibold text-slate-950">Enterprise Settings</h3>
                    <div className="mt-3 space-y-2 text-xs text-slate-600">
                      <div className="flex justify-between">
                        <span>Domain Restrict:</span>
                        <span className="font-semibold text-slate-900 font-mono">
                          {org.domain ? `@${org.domain}` : 'Disabled'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Single Sign-On (SSO):</span>
                        <span className={`font-semibold ${org.ssoSettings?.enabled ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {org.ssoSettings?.enabled ? 'Active' : 'Not setup'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Billing Plan:</span>
                        <span className="font-semibold uppercase text-cyan-600">{org.billingPlan}</span>
                      </div>
                    </div>
                  </GlowCard>
                </div>
              </div>
            )}

            {activeTab === 'members' && (
              <div className="space-y-6">
                <GlowCard className="p-5">
                  <h3 className="font-display text-lg font-semibold text-slate-950">Invite new team member</h3>
                  <form onSubmit={handleInviteMember} className="mt-4 flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Work email address
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="employee@company.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        className="input-modern mt-1.5 w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        Portal access role
                      </label>
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value as any)}
                        className="input-modern mt-1.5 w-full"
                      >
                        <option value="user">Workspace Member</option>
                        <option value="enterprise_admin">Enterprise Admin</option>
                      </select>
                    </div>
                    <GradientBorderButton type="submit" variant="create" disabled={actionLoading === 'member-invite'}>
                      {actionLoading === 'member-invite' ? 'Adding...' : 'Add Member'}
                    </GradientBorderButton>
                  </form>
                </GlowCard>

                <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
                  <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-slate-800 font-semibold">
                      <tr>
                        <th className="px-6 py-4">Employee</th>
                        <th className="px-6 py-4">Role</th>
                        <th className="px-6 py-4">Roster Join Date</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {members.map((member) => (
                        <tr key={member._id} className="hover:bg-slate-50/50 transition">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-slate-900">{member.name || 'Invited Roster'}</div>
                            <div className="text-xs text-slate-500">{member.email}</div>
                          </td>
                          <td className="px-6 py-4 font-semibold text-xs">
                            {member.role === 'enterprise_admin' ? (
                              <span className="rounded bg-teal-50 px-2 py-1 text-teal-800">
                                Enterprise Admin
                              </span>
                            ) : (
                              <span className="rounded bg-slate-100 px-2 py-1 text-slate-600">
                                Workspace Member
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500">
                            {new Date(member.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-500/20">
                              🟢 Active
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              disabled={actionLoading === `member-remove-${member._id}` || member.email === session?.user?.email}
                              onClick={() => handleRemoveMember(member._id, member.email)}
                              className="text-red-500 hover:text-red-700 font-semibold text-xs disabled:opacity-50 transition"
                            >
                              {actionLoading === `member-remove-${member._id}` ? 'Removing...' : 'Remove'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'policies' && (
              <div className="grid gap-6 md:grid-cols-2">
                <GlowCard className="p-6 space-y-6">
                  <div>
                    <h3 className="font-display text-lg font-semibold text-slate-950">Room configuration policies</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Set defaults and overrides that apply automatically to meetings created by employees.
                    </p>
                  </div>

                  <div className="space-y-4 pt-2">
                    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                      <div>
                        <div className="font-semibold text-sm text-slate-950">Allow Meeting Recording</div>
                        <div className="text-[11px] text-slate-500">Toggle if employees can save recordings of their meetings.</div>
                      </div>
                      <button
                        onClick={() => handleUpdatePolicies({ recordingAllowed: !org.policies.recordingAllowed })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                          org.policies.recordingAllowed ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          org.policies.recordingAllowed ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                      <div>
                        <div className="font-semibold text-sm text-slate-950">Enable Text Chat</div>
                        <div className="text-[11px] text-slate-500">Toggle if textual messaging features are turned on in conference calls.</div>
                      </div>
                      <button
                        onClick={() => handleUpdatePolicies({ chatEnabled: !org.policies.chatEnabled })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                          org.policies.chatEnabled ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          org.policies.chatEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/50">
                      <div>
                        <div className="font-semibold text-sm text-slate-950">Require Passwords for Joins</div>
                        <div className="text-[11px] text-slate-500">Force room creator to lock meeting with pin credentials by default.</div>
                      </div>
                      <button
                        onClick={() => handleUpdatePolicies({ requirePassword: !org.policies.requirePassword })}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                          org.policies.requirePassword ? 'bg-emerald-500' : 'bg-slate-300'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          org.policies.requirePassword ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                  </div>
                </GlowCard>

                <GlowCard className="p-6">
                  <h3 className="font-display text-lg font-semibold text-slate-950">Corporate Room Logs</h3>
                  <p className="text-xs text-slate-500 mt-1">Audit log of conference rooms hosted under this organization</p>
                  
                  <div className="mt-4 divide-y divide-slate-100 max-h-[290px] overflow-y-auto">
                    {meetings.length === 0 ? (
                      <p className="py-6 text-center text-xs text-slate-400 italic">No meetings hosted yet</p>
                    ) : (
                      meetings.map((meeting) => (
                        <div key={meeting._id} className="py-3 flex items-center justify-between">
                          <div>
                            <div className="font-semibold text-xs text-slate-900">{meeting.title}</div>
                            <div className="text-[10px] font-mono text-slate-400">{meeting.meetingId}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] text-slate-500">{meeting.hostEmail}</div>
                            <div className="text-[10px] font-semibold text-emerald-600">{meeting.joinCount} joins</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </GlowCard>
              </div>
            )}

            {activeTab === 'sso' && (
              <GlowCard className="p-6 max-w-2xl">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div>
                    <h3 className="font-display text-lg font-semibold text-slate-950">Single Sign-On (SAML / Okta)</h3>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">
                      Configure corporate Single Sign-On mapping credentials.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSsoEnabled(!ssoEnabled)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                      ssoEnabled ? 'bg-emerald-500' : 'bg-slate-300'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      ssoEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>

                <form onSubmit={handleUpdateSSO} className="mt-6 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Identity Provider (IdP) Entity ID
                    </label>
                    <input
                      type="text"
                      disabled={!ssoEnabled}
                      placeholder="e.g. urn:example:idp"
                      value={ssoIdpEntityId}
                      onChange={(e) => setSsoIdpEntityId(e.target.value)}
                      className="input-modern mt-1.5 w-full disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                      SAML SSO Sign-In URL
                    </label>
                    <input
                      type="url"
                      disabled={!ssoEnabled}
                      placeholder="e.g. https://idp.example.com/sso/saml"
                      value={ssoUrl}
                      onChange={(e) => setSsoUrl(e.target.value)}
                      className="input-modern mt-1.5 w-full disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Public Certificate (PEM format)
                    </label>
                    <textarea
                      rows={5}
                      disabled={!ssoEnabled}
                      placeholder="-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"
                      value={ssoCert}
                      onChange={(e) => setSsoCert(e.target.value)}
                      className="input-modern mt-1.5 w-full font-mono text-xs disabled:opacity-50"
                    />
                  </div>

                  <div className="pt-4 flex justify-end">
                    <GradientBorderButton type="submit" variant="create" disabled={actionLoading === 'sso-update'}>
                      {actionLoading === 'sso-update' ? 'Saving Config...' : 'Save SSO Settings'}
                    </GradientBorderButton>
                  </div>
                </form>
              </GlowCard>
            )}

            {activeTab === 'settings' && (
              <GlowCard className="p-6 max-w-2xl">
                <h3 className="font-display text-lg font-semibold text-slate-950">Workspace branding & details</h3>
                <p className="text-xs text-slate-500 mt-0.5">Customize corporate profile identity in rooms</p>

                <form onSubmit={handleUpdateSettings} className="mt-6 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Company / Organization Name
                    </label>
                    <input
                      type="text"
                      required
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      className="input-modern mt-1.5 w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Branding Logo URL
                    </label>
                    <input
                      type="url"
                      placeholder="e.g. https://domain.com/logo.png"
                      value={orgLogoUrl}
                      onChange={(e) => setOrgLogoUrl(e.target.value)}
                      className="input-modern mt-1.5 w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Associated Domain restriction
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. company.com"
                      value={orgDomain}
                      onChange={(e) => setOrgDomain(e.target.value)}
                      className="input-modern mt-1.5 w-full"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block">
                      Restricting this domain auto-maps matching employees to this workspace on login.
                    </span>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <GradientBorderButton type="submit" variant="create" disabled={actionLoading === 'settings-update'}>
                      {actionLoading === 'settings-update' ? 'Saving Settings...' : 'Save Settings'}
                    </GradientBorderButton>
                  </div>
                </form>
              </GlowCard>
            )}
          </div>
        </div>
      </motion.section>

      {/* Floating Toast Notification */}
      {message && (
        <div
          className={`fixed bottom-5 right-5 z-[100] flex items-center gap-2 rounded-xl px-5 py-3.5 text-white shadow-xl ${
            message.type === 'error' ? 'bg-red-500/90' : 'bg-slate-900/90'
          }`}
        >
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      <Footer />
    </div>
  );
}

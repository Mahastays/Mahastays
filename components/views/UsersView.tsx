'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  Search,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Filter,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Crown,
  Phone,
  Mail,
  Calendar,
  CreditCard,
  ShoppingBag,
  Lock,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import ConfirmDeleteModal from '../modals/ConfirmDeleteModal';
import DashboardSkeleton from '../common/DashboardSkeleton';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  fetchAdminUsers,
  deleteAdminUserAsync,
  updateUserStatusAsync,
  AdminUserItem,
} from '../../store/slices/usersSlice';
import { toast } from '../ui/Toast';

export default function UsersView() {
  const router = useRouter();
  const { role, activeViewMode } = useAuth();
  const isAdmin = activeViewMode === 'admin' && role !== 'vendor';

  const dispatch = useAppDispatch();
  const { items: users, total, page, limit, totalPages, loading, error } = useAppSelector(
    (state) => state.users
  );

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [userToDelete, setUserToDelete] = useState<AdminUserItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Fetch users on page, filter, or search change
  useEffect(() => {
    dispatch(
      fetchAdminUsers({
        page: currentPage,
        limit: 15,
        q: searchQuery.trim() || undefined,
        status: statusFilter === 'all' ? undefined : statusFilter,
      })
    );
  }, [dispatch, currentPage, statusFilter, searchQuery]);

  const showNotification = (msg: string) => {
    setActionSuccessMessage(msg);
    setTimeout(() => setActionSuccessMessage(null), 3000);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      setIsDeleting(true);
      await dispatch(deleteAdminUserAsync(userToDelete.id)).unwrap();
      showNotification(`User ${userToDelete.fullName} (${userToDelete.userCode}) deleted successfully.`);
      toast.success(`User ${userToDelete.fullName} (${userToDelete.userCode}) deleted successfully.`, 'User Deleted');
      setUserToDelete(null);
      // Refetch page
      dispatch(
        fetchAdminUsers({
          page: currentPage,
          limit: 15,
          q: searchQuery.trim() || undefined,
          status: statusFilter === 'all' ? undefined : statusFilter,
        })
      );
    } catch (err: any) {
      toast.error(err || 'Failed to delete user', 'Delete Failed');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleStatus = async (user: AdminUserItem) => {
    const nextStatus = user.status === 'active' ? 'suspended' : 'active';
    const confirmMsg =
      nextStatus === 'suspended'
        ? `Are you sure you want to suspend ${user.fullName}? They will be logged out of all active sessions.`
        : `Reinstate ${user.fullName} to active status?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await dispatch(
        updateUserStatusAsync({
          id: user.id,
          status: nextStatus,
          reason: nextStatus === 'suspended' ? 'Administrative policy review' : undefined,
        })
      ).unwrap();
      showNotification(`User account marked as ${nextStatus}.`);
      toast.success(`User account marked as ${nextStatus}.`, 'Status Updated');
    } catch (err: any) {
      toast.error(err || 'Failed to update user status', 'Update Failed');
    }
  };

  // Quick stats computed from current list or totals
  const activeCount = users.filter((u) => u.status === 'active').length;
  const clubCount = users.filter((u) => u.membership?.isClubMember).length;

  if (!isAdmin) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 font-poppins">
            Access Restricted
          </h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            Only system administrators have permission to access registered customer rosters and confidential user profiles.
          </p>
          <div className="pt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition"
            >
              <span>Return to Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading && users.length === 0) {
    return <DashboardSkeleton type="table" />;
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {actionSuccessMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-900 text-white text-xs font-semibold shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{actionSuccessMessage}</span>
        </div>
      )}

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Travelers</span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{total}</div>
          <p className="text-[11px] text-slate-400 mt-1">Platform registered users</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Accounts</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{activeCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">Ready to book stays &amp; tours</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Club Members</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 flex items-center justify-center">
              <Crown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{clubCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">8% privilege discount enrolled</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Page Limit</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
              15
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">15 / Page</div>
          <p className="text-[11px] text-slate-400 mt-1">Strict pagination per requirement</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, email, phone, ID..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => {
              setStatusFilter('all');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            All Users
          </button>
          <button
            onClick={() => {
              setStatusFilter('active');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              statusFilter === 'active'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Active Only
          </button>
          <button
            onClick={() => {
              setStatusFilter('suspended');
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
              statusFilter === 'suspended'
                ? 'bg-rose-600 text-white'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Suspended
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-3 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-500">Loading user accounts from database...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center space-y-3 max-w-sm mx-auto p-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
              <Users className="w-6 h-6 text-slate-400" />
            </div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">No users found</h4>
            <p className="text-xs text-slate-500">
              {searchQuery ? 'No accounts matched your search criteria.' : 'No registered users in this category yet.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 text-slate-400 uppercase text-[10px] font-bold tracking-wider">
                  <th className="py-3.5 px-5">User</th>
                  <th className="py-3.5 px-4">Contact &amp; Verification</th>
                  <th className="py-3.5 px-4">Membership</th>
                  <th className="py-3.5 px-4">Bookings Activity</th>
                  <th className="py-3.5 px-4">Joined</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-5 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {users.map((u) => {
                  const phoneStr = u.phone
                    ? `${u.phone.countryCode || '+91'} ${u.phone.nationalNumber}`
                    : u.phoneNumber
                    ? `${u.phoneCountryCode || '+91'} ${u.phoneNumber}`
                    : null;
                  const isClub = Boolean(u.membership?.isClubMember);
                  const tierName = (u.membership?.tier || 'standard').toUpperCase();

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition group"
                    >
                      {/* User Cell */}
                      <td className="py-3.5 px-5">
                        <div className="flex items-center gap-3">
                          <div
                            onClick={() => router.push(`/dashboard/users/${u.id}`)}
                            className="w-9 h-9 rounded-xl bg-gradient-to-br from-rose-500 to-amber-500 text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0 cursor-pointer hover:scale-105 transition-transform"
                            title="Open Full Profile & History"
                          >
                            {u.fullName ? u.fullName.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <div
                              onClick={() => router.push(`/dashboard/users/${u.id}`)}
                              className="font-bold text-slate-900 dark:text-slate-100 hover:text-rose-600 transition cursor-pointer"
                            >
                              {u.fullName || 'Valued Guest'}
                            </div>
                            <div
                              onClick={() => router.push(`/dashboard/users/${u.id}`)}
                              className="text-[10px] text-slate-400 font-mono mt-0.5 hover:text-slate-600 cursor-pointer"
                            >
                              ID: {u.userCode || u.id.slice(-6).toUpperCase()}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact Cell */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-800 dark:text-slate-200">{u.email}</span>
                            {u.verification?.isEmailVerified ? (
                              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-1.5 py-0.2 rounded border border-emerald-200/60 dark:border-emerald-800">
                                ✓
                              </span>
                            ) : null}
                          </div>
                          <div className="text-slate-500 dark:text-slate-400 text-[11px] flex items-center gap-1.5">
                            {phoneStr ? (
                              <>
                                <span>{phoneStr}</span>
                                {u.verification?.isPhoneVerified || u.phone?.isVerified ? (
                                  <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-1 py-0.2 rounded">
                                    OTP ✓
                                  </span>
                                ) : null}
                              </>
                            ) : (
                              <span className="text-slate-400 italic">No phone</span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Membership Cell */}
                      <td className="py-3.5 px-4">
                        {isClub ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800 shadow-2xs">
                            <Crown className="w-3 h-3 text-amber-500" />
                            {tierName} CLUB
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            STANDARD
                          </span>
                        )}
                      </td>

                      {/* Bookings Activity */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">
                            {u.metrics?.totalBookingsCount ?? u.totalBookingsCount ?? 0} Reservations
                          </div>
                          <div className="text-[11px] text-slate-500">
                            Spent: ₹{(u.metrics?.totalSpentInr ?? 0).toLocaleString('en-IN')}
                          </div>
                        </div>
                      </td>

                      {/* Joined Date */}
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {u.createdAt
                          ? new Date(u.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })
                          : '—'}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {u.status === 'active' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800">
                            ● Active
                          </span>
                        ) : u.status === 'suspended' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-200/60 dark:border-rose-800">
                            ● Suspended
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 capitalize">{u.status}</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View details */}
                          <button
                            onClick={() => router.push(`/dashboard/users/${u.id}`)}
                            title="View Full Profile Details & Lifetime History (Separate Page)"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Suspend / Activate */}
                          <button
                            onClick={() => handleToggleStatus(u)}
                            title={u.status === 'active' ? 'Suspend User' : 'Activate User'}
                            className={`p-1.5 rounded-lg transition cursor-pointer ${
                              u.status === 'active'
                                ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40'
                                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                            }`}
                          >
                            {u.status === 'active' ? (
                              <AlertTriangle className="w-3.5 h-3.5" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                          </button>

                          {/* Delete User Button - Full Control */}
                          <button
                            onClick={() => setUserToDelete(u)}
                            title="Delete User (Full Admin Control)"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Strict Pagination Bar: Exactly 15 users per page */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            Showing <span className="font-bold text-slate-800 dark:text-slate-200">{users.length > 0 ? (currentPage - 1) * limit + 1 : 0}</span> to{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">{Math.min(currentPage * limit, total)}</span> of{' '}
            <span className="font-bold text-slate-800 dark:text-slate-200">{total}</span> registered users (
            <span className="text-rose-600 font-semibold">{limit} per page</span>)
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || loading}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-3 py-1 rounded-lg bg-white dark:bg-slate-800 font-semibold text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
              Page {currentPage} of {Math.max(1, totalPages)}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || loading}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 transition cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Delete User Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={Boolean(userToDelete)}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleDeleteUser}
        title="Delete User Account?"
        itemName={userToDelete?.fullName}
        message={
          <p>
            Are you sure you want to permanently delete{' '}
            <strong className="text-slate-800 dark:text-slate-200">{userToDelete?.fullName}</strong> ({userToDelete?.email})?
            This will remove user credentials, wishlists, and tickets permanently.
          </p>
        }
        confirmButtonText="Delete User"
        isLoading={isDeleting}
      />
    </div>
  );
}


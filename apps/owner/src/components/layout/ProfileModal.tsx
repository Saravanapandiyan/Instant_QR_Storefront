import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User as UserIcon,
  Mail,
  Phone,
  Lock,
  Eye,
  EyeOff,
  X,
  AlertCircle,
  CheckCircle2,
  Shield,
} from 'lucide-react';
import { Button, Input } from '../ui';
import { authApi } from '../../features/auth/api/authApi';
import { useAuthStore } from '../../store/useAuthStore';
import { toast } from '../ui';
import type { User } from '@instant-qr/shared-types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// 1. Profile Details Schema
const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters long'),
  email: z.string().email('Please enter a valid email address'),
  countryCode: z.string().optional(),
  phone: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

// 2. Change Password Schema
const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters long'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New passwords do not match',
    path: ['confirmPassword'],
  });

type PasswordFormValues = z.infer<typeof passwordSchema>;

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose }) => {
  const { user, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'details' | 'security'>('details');

  const [profileServerError, setProfileServerError] = useState<string | null>(null);
  const [passwordServerError, setPasswordServerError] = useState<string | null>(null);

  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Form 1: Profile Details
  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    reset: resetProfile,
    formState: { errors: profileErrors, isSubmitting: isProfileSubmitting },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      email: '',
      countryCode: '+91',
      phone: '',
    },
  });

  // Form 2: Change Password
  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    formState: { errors: passwordErrors, isSubmitting: isPasswordSubmitting },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Sync current user state
  useEffect(() => {
    if (isOpen && user) {
      setProfileServerError(null);
      setPasswordServerError(null);
      resetProfile({
        name: user.name || '',
        email: user.email || '',
        countryCode: user.countryCode || '+91',
        phone: user.phone || '',
      });
      resetPassword({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    }
  }, [isOpen, user, resetProfile, resetPassword]);

  if (!isOpen) return null;

  const onProfileSubmit = async (values: ProfileFormValues) => {
    setProfileServerError(null);
    try {
      const updated = await authApi.updateProfile({
        name: values.name.trim(),
        email: values.email.trim(),
        countryCode: values.countryCode?.trim() || undefined,
        phone: values.phone?.trim() || undefined,
      });
      setUser(updated);
      toast.success('Profile details updated successfully!', 'Saved');
    } catch (err: any) {
      setProfileServerError(err.message || 'Failed to update profile.');
    }
  };

  const onPasswordSubmit = async (values: PasswordFormValues) => {
    setPasswordServerError(null);
    try {
      await authApi.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      toast.success('Password changed successfully!', 'Security Updated');
      resetPassword({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err: any) {
      setPasswordServerError(err.message || 'Failed to change password.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-backdrop backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog Card */}
      <div className="relative w-full max-w-lg bg-surface rounded-[12px] border border-border shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] bg-primary-soft text-primary-soft-text flex items-center justify-center font-bold text-sm shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-text">Account Profile</h2>
                <span className="px-1.5 py-0.5 rounded-[4px] bg-primary-soft text-primary-soft-text text-[10px] font-semibold">
                  {user?.role || 'Admin'}
                </span>
              </div>
              <p className="text-xs text-muted">
                Manage your credentials, contact phone, and security password.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 rounded-[6px] text-muted hover:text-text hover:bg-surface-2 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-border bg-surface-2/40 px-5 pt-2 gap-4 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'details'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted hover:text-text'
            }`}
          >
            <UserIcon size={14} />
            <span>Profile Details</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={`pb-2.5 text-xs font-semibold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'security'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted hover:text-text'
            }`}
          >
            <Shield size={14} />
            <span>Change Password</span>
          </button>
        </div>

        {/* Body Container */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'details' ? (
            <form onSubmit={handleSubmitProfile(onProfileSubmit)} className="space-y-4" noValidate>
              {profileServerError && (
                <div className="p-3 rounded-[8px] bg-danger/10 border border-danger/25 text-danger text-xs flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{profileServerError}</span>
                </div>
              )}

              {/* Full Name */}
              <Input
                label="Full Name"
                placeholder="e.g. Babu Store Owner"
                required
                error={profileErrors.name?.message}
                {...registerProfile('name')}
              />

              {/* Email Address */}
              <Input
                label="Email Address"
                type="email"
                placeholder="e.g. babu@yopmail.com"
                required
                error={profileErrors.email?.message}
                {...registerProfile('email')}
              />

              {/* Country Code & Phone Number */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-text">
                  Phone Number
                </label>
                <div className="grid grid-cols-4 gap-2">
                  <div className="col-span-1">
                    <input
                      type="text"
                      placeholder="+91"
                      className="w-full px-3 py-2 rounded-[8px] border border-border bg-surface text-text text-xs text-center focus:outline-none focus:border-primary"
                      {...registerProfile('countryCode')}
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="tel"
                      placeholder="e.g. 9876543210"
                      className="w-full px-3 py-2 rounded-[8px] border border-border bg-surface text-text text-xs focus:outline-none focus:border-primary"
                      {...registerProfile('phone')}
                    />
                  </div>
                </div>
                {profileErrors.phone?.message && (
                  <p className="text-[11px] text-danger mt-1">
                    {profileErrors.phone.message}
                  </p>
                )}
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-border">
                <Button type="button" variant="ghost" size="md" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isProfileSubmitting}
                  icon={<CheckCircle2 size={15} />}
                >
                  Save Profile
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmitPassword(onPasswordSubmit)} className="space-y-4" noValidate>
              {passwordServerError && (
                <div className="p-3 rounded-[8px] bg-danger/10 border border-danger/25 text-danger text-xs flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{passwordServerError}</span>
                </div>
              )}

              {/* Current Password */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-text">
                  Current Password <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? 'text' : 'password'}
                    placeholder="Enter your current password"
                    className="w-full pl-3 pr-9 py-2 rounded-[8px] border border-border bg-surface text-text text-xs focus:outline-none focus:border-primary"
                    {...registerPassword('currentPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-muted hover:text-text cursor-pointer"
                  >
                    {showCurrentPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {passwordErrors.currentPassword?.message && (
                  <p className="text-[11px] text-danger mt-1">
                    {passwordErrors.currentPassword.message}
                  </p>
                )}
              </div>

              {/* New Password */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-text">
                  New Password <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPass ? 'text' : 'password'}
                    placeholder="Enter new secure password (min 6 chars)"
                    className="w-full pl-3 pr-9 py-2 rounded-[8px] border border-border bg-surface text-text text-xs focus:outline-none focus:border-primary"
                    {...registerPassword('newPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPass(!showNewPass)}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-muted hover:text-text cursor-pointer"
                  >
                    {showNewPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {passwordErrors.newPassword?.message && (
                  <p className="text-[11px] text-danger mt-1">
                    {passwordErrors.newPassword.message}
                  </p>
                )}
              </div>

              {/* Confirm New Password */}
              <div className="space-y-1">
                <label className="block text-xs font-medium text-text">
                  Confirm New Password <span className="text-danger">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPass ? 'text' : 'password'}
                    placeholder="Re-enter your new password"
                    className="w-full pl-3 pr-9 py-2 rounded-[8px] border border-border bg-surface text-text text-xs focus:outline-none focus:border-primary"
                    {...registerPassword('confirmPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPass(!showConfirmPass)}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-muted hover:text-text cursor-pointer"
                  >
                    {showConfirmPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {passwordErrors.confirmPassword?.message && (
                  <p className="text-[11px] text-danger mt-1">
                    {passwordErrors.confirmPassword.message}
                  </p>
                )}
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-border">
                <Button type="button" variant="ghost" size="md" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  isLoading={isPasswordSubmitting}
                  icon={<Lock size={14} />}
                >
                  Change Password
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, ArrowLeft, Music2, Shield } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api';

interface MemberVerification {
  member_code: string;
  full_name: string;
  first_name: string;
  last_name: string;
  profile_photo_url?: string;
  role: string;
  membership_status: string;
  approval_status: string;
  date_joined?: string;
  department_name?: string;
  verified: boolean;
  is_choir_member: boolean;
  voice_group?: string;
  is_director: boolean;
}

const VerifyMemberPage: React.FC = () => {
  const { memberCode } = useParams<{ memberCode: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState<MemberVerification | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyMember = async () => {
      if (!memberCode) {
        setError('Invalid verification code');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/verify/${memberCode}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Member not found');
        }

        setMember(data.member);
      } catch (err: any) {
        setError(err.message || 'Verification failed');
      } finally {
        setLoading(false);
      }
    };

    verifyMember();
  }, [memberCode]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center p-6">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-purple-400 mx-auto mb-4" />
          <p className="text-gray-300 text-lg">Verifying member...</p>
        </div>
      </div>
    );
  }

  if (error || !member) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-slate-900/50 backdrop-blur-lg border border-red-900/30 rounded-2xl p-8 text-center">
          <XCircle size={64} className="text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Verification Failed</h1>
          <p className="text-gray-400 mb-6">{error || 'Member not found'}</p>
          <button
            onClick={() => navigate('/')}
            className="btn-primary w-full"
          >
            <ArrowLeft size={18} /> Back to Home
          </button>
        </div>
      </div>
    );
  }

  const isVerified = member.verified && member.approval_status === 'approved';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-slate-900/50 backdrop-blur-lg border border-purple-900/30 rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-700 to-indigo-700 px-8 py-6 text-center relative">
          <div className="absolute top-4 right-4">
            {isVerified ? (
              <CheckCircle size={32} className="text-green-400" />
            ) : (
              <XCircle size={32} className="text-amber-400" />
            )}
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">Member Verification</h1>
          <p className="text-purple-200 text-sm">LUS4G Church Official Verification</p>
        </div>

        {/* Profile Section */}
        <div className="p-8">
          <div className="flex items-start gap-6 mb-8">
            <img
              src={member.profile_photo_url || 'https://placehold.co/150x180?text=No+Photo'}
              alt={member.full_name}
              className="w-36 h-44 object-cover rounded-xl border-4 border-purple-900/50"
            />
            <div className="flex-1">
              <h2 className="text-3xl font-bold text-white mb-2">{member.full_name}</h2>
              <div className="flex flex-wrap gap-2 mb-4">
                <span className="px-4 py-1.5 rounded-full bg-purple-700 text-white text-sm font-semibold">
                  {member.member_code}
                </span>
                <span className="px-4 py-1.5 rounded-full bg-indigo-600 text-white text-sm font-semibold capitalize flex items-center gap-1">
                  {member.is_choir_member && <Music2 size={14} />}
                  {member.role.replace('_', ' ')}
                </span>
                {isVerified ? (
                  <span className="px-4 py-1.5 rounded-full bg-green-600 text-white text-sm font-semibold flex items-center gap-1">
                    <CheckCircle size={14} /> Verified
                  </span>
                ) : (
                  <span className="px-4 py-1.5 rounded-full bg-amber-600 text-white text-sm font-semibold">
                    Pending
                  </span>
                )}
                {member.is_director && (
                  <span className="px-4 py-1.5 rounded-full bg-yellow-600 text-white text-sm font-semibold flex items-center gap-1">
                    <Shield size={14} /> Choir Director
                  </span>
                )}
              </div>
              <div className="space-y-2">
                <InfoRow label="Membership Status" value={member.membership_status.replace('_', ' ')} />
                <InfoRow label="Approval Status" value={member.approval_status} />
                {member.department_name && (
                  <InfoRow label="Department" value={member.department_name} />
                )}
                {member.is_choir_member && member.voice_group && (
                  <InfoRow label="Voice Group" value={member.voice_group} />
                )}
                {member.date_joined && (
                  <InfoRow
                    label="Date Joined"
                    value={new Date(member.date_joined).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Verification Status */}
          <div
            className={`rounded-xl p-6 mb-6 ${
              isVerified
                ? 'bg-green-900/20 border border-green-700/30'
                : 'bg-amber-900/20 border border-amber-700/30'
            }`}
          >
            <div className="flex items-center gap-3 mb-2">
              {isVerified ? (
                <CheckCircle size={24} className="text-green-400" />
              ) : (
                <XCircle size={24} className="text-amber-400" />
              )}
              <h3 className="text-xl font-bold text-white">
                {isVerified ? 'Member Verified' : 'Verification Pending'}
              </h3>
            </div>
            <p className={isVerified ? 'text-green-300' : 'text-amber-300'}>
              {isVerified
                ? 'This member is a verified and approved member of LUS4G Church.'
                : 'This member registration is pending approval by church administration.'}
            </p>
          </div>

          {/* Security Notice */}
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/30 mb-6">
            <p className="text-gray-400 text-sm text-center">
              This verification was performed on{' '}
              <span className="text-purple-400 font-semibold">
                {new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button onClick={() => navigate('/')} className="btn-outline flex-1">
              <ArrowLeft size={18} /> Back to Home
            </button>
            <button onClick={() => window.print()} className="btn-primary flex-1">
              Print Verification
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex justify-between text-sm">
    <span className="text-gray-400">{label}:</span>
    <span className="text-white font-medium capitalize">{value}</span>
  </div>
);

export default VerifyMemberPage;

import React, { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { User } from '@/lib/api';

interface PrintableRegistrationFormProps {
  member: User;
  verificationUrl: string;
}

const PrintableRegistrationForm = forwardRef<HTMLDivElement, PrintableRegistrationFormProps>(
  ({ member, verificationUrl }, ref) => {
    const isChoirMember = member.role === 'choir_member' || member.role === 'choir';
    
    return (
      <div ref={ref} className="bg-white p-12 max-w-4xl mx-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
        {/* Header with Logo */}
        <div className="flex items-center justify-between mb-8 pb-6 border-b-4 border-purple-700">
          <div className="flex items-center gap-4">
            <img 
              src="/church-logo.png" 
              alt="Church Logo" 
              className="h-20 w-20 object-contain"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
            <div>
              <h1 className="text-3xl font-bold text-purple-900">LUS4G Church</h1>
              <p className="text-gray-600">Member Registration Form</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Registration Date</p>
            <p className="font-semibold">{new Date(member.created_at).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
          </div>
        </div>

        {/* Member Photo and Basic Info */}
        <div className="flex gap-6 mb-8">
          <div className="flex-shrink-0">
            <img 
              src={member.profile_photo_url || 'https://placehold.co/200x250?text=No+Photo'} 
              alt={`${member.first_name} ${member.last_name}`}
              className="w-40 h-48 object-cover border-4 border-gray-300 rounded-lg"
            />
          </div>
          
          <div className="flex-1">
            <div className="bg-purple-50 p-4 rounded-lg mb-4">
              <h2 className="text-2xl font-bold text-purple-900 mb-1">
                {member.first_name} {member.middle_name ? member.middle_name + ' ' : ''}{member.last_name}
              </h2>
              <div className="flex gap-4 mt-2">
                <span className="bg-purple-700 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  {member.member_code || 'Pending'}
                </span>
                <span className="bg-indigo-600 text-white px-3 py-1 rounded-full text-sm font-semibold capitalize">
                  {member.role?.replace('_', ' ')}
                </span>
                <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-semibold capitalize">
                  {member.approval_status || member.status}
                </span>
              </div>
            </div>

            {/* Personal Information Grid */}
            <div className="grid grid-cols-2 gap-4">
              <InfoField label="Gender" value={member.gender} />
              <InfoField 
                label="Date of Birth" 
                value={member.date_of_birth ? new Date(member.date_of_birth).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                }) : 'N/A'} 
              />
              <InfoField label="Phone" value={member.phone} />
              <InfoField label="Email" value={member.email} />
            </div>
          </div>
        </div>

        {/* Detailed Information */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-purple-300">
            Contact & Personal Information
          </h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <InfoField label="Address" value={member.address} />
            <InfoField label="City" value={member.city} />
            <InfoField label="WhatsApp" value={member.whatsapp_number} />
            <InfoField label="Occupation" value={member.occupation} />
            <InfoField label="Marital Status" value={member.marital_status} />
            <InfoField 
              label="Baptized" 
              value={(member.baptism_status ?? member.baptized) === true ? 'Yes' : 
                     (member.baptism_status ?? member.baptized) === false ? 'No' : 'N/A'} 
            />
            {member.department_name && (
              <InfoField label="Department" value={member.department_name} />
            )}
          </div>
        </div>

        {/* Emergency Contact */}
        {(member.emergency_name || member.emergency_contact_name) && (
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-purple-300">
              Emergency Contact
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <InfoField label="Name" value={member.emergency_name || member.emergency_contact_name} />
              <InfoField label="Phone" value={member.emergency_phone || member.emergency_contact_phone} />
              <InfoField label="Relationship" value={member.emergency_relation} />
            </div>
          </div>
        )}

        {/* Choir Information */}
        {isChoirMember && (
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-indigo-300">
              Choir Information
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <InfoField label="Voice Group" value={member.voice_group || member.voice_type} />
              <InfoField label="Main Role" value={member.main_role} />
              <InfoField label="Experience Level" value={member.experience_level} />
              <InfoField 
                label="Instruments" 
                value={(member.instruments || []).join(', ') || 'None'} 
              />
              <InfoField 
                label="Choir Activities" 
                value={(member.choir_activities || []).join(', ') || 'None'} 
                className="col-span-2"
              />
            </div>
          </div>
        )}

        {/* Bio */}
        {member.bio && (
          <div className="mb-8">
            <h3 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b-2 border-purple-300">
              Biography
            </h3>
            <p className="text-gray-700 leading-relaxed">{member.bio}</p>
          </div>
        )}

        {/* QR Code Section */}
        <div className="flex justify-between items-start mb-12">
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Verification QR Code</h3>
            <p className="text-sm text-gray-600 mb-4">
              Scan this code to verify member information online
            </p>
            <div className="border-4 border-purple-200 p-4 inline-block rounded-lg bg-white">
              <QRCodeSVG 
                value={verificationUrl} 
                size={140} 
                level="H"
                includeMargin={true}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2 max-w-xs break-words">
              {verificationUrl}
            </p>
          </div>

          {/* Account Information */}
          <div className="flex-1 text-right">
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <h4 className="font-semibold text-gray-700 mb-2">Account Status</h4>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Approved:</span> {member.approved_at ? 
                  new Date(member.approved_at).toLocaleDateString() : 'Pending'}</p>
                <p><span className="font-medium">Last Login:</span> {member.last_login ? 
                  new Date(member.last_login).toLocaleDateString() : 'Never'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Signature Section */}
        <div className="border-t-2 border-gray-300 pt-8">
          <h3 className="text-xl font-bold text-gray-800 mb-6">Approval Signatures</h3>
          
          <div className="grid grid-cols-2 gap-8 mb-8">
            {/* Pastor Signature */}
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-4">Pastor Approval</p>
              <div className="border-b-2 border-gray-400 mb-2" style={{ height: '60px' }}></div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Pastor Signature</span>
                <span>Date: _______________</span>
              </div>
            </div>

            {/* Choir Director Signature (only for choir members) */}
            {isChoirMember && (
              <div>
                <p className="text-sm font-semibold text-gray-700 mb-4">Choir Director Approval</p>
                <div className="border-b-2 border-gray-400 mb-2" style={{ height: '60px' }}></div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Choir Director Signature</span>
                  <span>Date: _______________</span>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center mt-12 text-sm text-gray-500 border-t pt-4">
            <p>This is an official registration document of LUS4G Church</p>
            <p>Generated on {new Date().toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</p>
          </div>
        </div>
      </div>
    );
  }
);

// Helper component for displaying information fields
const InfoField: React.FC<{ label: string; value?: string | null; className?: string }> = ({ 
  label, 
  value, 
  className = '' 
}) => {
  if (!value) return null;
  
  return (
    <div className={className}>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-sm text-gray-900 font-medium">{value}</p>
    </div>
  );
};

PrintableRegistrationForm.displayName = 'PrintableRegistrationForm';

export default PrintableRegistrationForm;

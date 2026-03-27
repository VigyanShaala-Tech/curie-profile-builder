
import React from 'react';
import { Profile } from '../types';

interface Props {
  profile: Profile;
  updateProfile: (updates: Partial<Profile>) => void;
  readOnly?: boolean;
  validationErrors?: Record<string, string>;
}

const IdentityForm: React.FC<Props> = ({ profile, updateProfile, readOnly, validationErrors = {} as Record<string, string> }) => {
  return (
    <div className={`space-y-6 animate-in fade-in duration-500 ${readOnly ? 'opacity-60 pointer-events-none' : ''}`}>
      <div className="space-y-6 transition-all duration-300">
        <div>
          <label className="block text-sm font-bold text-[#2c4869] mb-2 tracking-tight">Full name <span className="text-red-500 ml-1">*</span></label>
          <input 
            type="text" 
            value={profile.fullName}
            onChange={(e) => updateProfile({ fullName: e.target.value })}
            placeholder="e.g. Ananya Iyer"
            disabled={readOnly}
            className={`w-full px-4 py-3 rounded-xl border ${validationErrors.fullName ? 'border-red-500 ring-2 ring-red-100' : 'border-slate-200 focus:ring-2 focus:ring-[#f58434]'} focus:border-transparent outline-none transition-all disabled:bg-slate-50 font-medium`}
          />
          {validationErrors.fullName && <p className="text-red-500 text-xs mt-1">{validationErrors.fullName}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {(!readOnly || profile.gender) && (
            <div>
              <label className="block text-sm font-bold text-[#2c4869] mb-2 tracking-tight">Gender Identity</label>
              <select 
                value={profile.gender}
                onChange={(e) => updateProfile({ gender: e.target.value })}
                disabled={readOnly}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#f58434] focus:border-transparent outline-none transition-all disabled:bg-slate-50 font-medium text-sm"
              >
                <option value="">Select Gender</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Transgender">Transgender</option>
                <option value="Prefer not to say">Prefer not to say</option>
                <option value="Other">Other</option>
              </select>
            </div>
          )}
          {(!readOnly || profile.pronouns) && (
            <div>
              <label className="block text-sm font-bold text-[#2c4869] mb-2 tracking-tight">Preferred Pronouns</label>
              <input 
                type="text" 
                value={profile.pronouns}
                onChange={(e) => updateProfile({ pronouns: e.target.value })}
                placeholder="e.g. she/her, they/them"
                disabled={readOnly}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#f58434] focus:border-transparent outline-none transition-all disabled:bg-slate-50 font-medium"
              />
            </div>
          )}
        </div>
        <div>
          <label className="block text-sm font-bold text-[#2c4869] mb-2 tracking-tight">WhatsApp Number <span className="text-red-500 ml-1">*</span></label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold border-r border-slate-200 pr-3">+91</span>
            <input 
              type="tel" 
              value={profile.whatsappNumber}
              placeholder="10-digit number"
              readOnly
              className={`w-full pl-16 pr-4 py-3 rounded-xl border ${validationErrors.whatsappNumber ? 'border-red-500 ring-2 ring-red-100' : 'border-slate-200'} bg-slate-100 text-slate-500 font-medium cursor-not-allowed`}
            />
          </div>
          {validationErrors.whatsappNumber && <p className="text-red-500 text-xs mt-1">{validationErrors.whatsappNumber}</p>}
        </div>
        <div>
          <label className="block text-sm font-bold text-[#2c4869] mb-2 tracking-tight">Email address</label>
          <input 
            type="email" 
            value={profile.email}
            onChange={(e) => updateProfile({ email: e.target.value })}
            placeholder="e.g. name@university.edu"
            disabled={readOnly}
            className={`w-full px-4 py-3 rounded-xl border ${validationErrors.email ? 'border-red-500 ring-2 ring-red-100' : 'border-slate-200 focus:ring-2 focus:ring-[#f58434]'} focus:border-transparent outline-none transition-all disabled:bg-slate-50 font-medium`}
          />
          {validationErrors.email && <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>}
        </div>
        <div>
          <label className="block text-sm font-bold text-[#2c4869] mb-2 tracking-tight">Current location</label>
          <input 
            type="text" 
            value={profile.location}
            onChange={(e) => updateProfile({ location: e.target.value })}
            placeholder="e.g. Pune, Maharashtra"
            disabled={readOnly}
            className={`w-full px-4 py-3 rounded-xl border ${validationErrors.location ? 'border-red-500 ring-2 ring-red-100' : 'border-slate-200 focus:ring-2 focus:ring-[#f58434]'} focus:border-transparent outline-none transition-all disabled:bg-slate-50 font-medium`}
          />
          {validationErrors.location && <p className="text-red-500 text-xs mt-1">{validationErrors.location}</p>}
        </div>
      </div>
    </div>
  );
};

export default IdentityForm;

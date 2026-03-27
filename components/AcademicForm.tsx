
import React from 'react';
import { Profile } from '../types';
import { DEGREE_OPTIONS, STEM_HIERARCHY } from '../constants';

interface Props {
  profile: Profile;
  updateProfile: (updates: Partial<Profile>) => void;
  readOnly?: boolean;
  validationErrors?: Record<string, string>;
}

const AcademicForm: React.FC<Props> = ({ profile, updateProfile, readOnly, validationErrors = {} as Record<string, string> }) => {
  const topLevels = Object.keys(STEM_HIERARCHY);
  const categories = profile.topLevelCategory ? [...Object.keys(STEM_HIERARCHY[profile.topLevelCategory]), 'Other'] : [];
  const subFields = (profile.topLevelCategory && profile.specializationCategory && profile.specializationCategory !== 'Other') 
    ? [...STEM_HIERARCHY[profile.topLevelCategory][profile.specializationCategory], 'Other'] 
    : (profile.specializationCategory ? ['Other'] : []);

  return (
    <div className={`space-y-6 animate-in slide-in-from-right-4 duration-500 pb-10 ${readOnly ? 'opacity-60 pointer-events-none' : ''}`}>
      <div className="space-y-6 transition-all duration-300">
        
        <div>
          <label className="block text-sm font-bold text-[#2c4869] mb-2 tracking-tight">What is your current academic status? <span className="text-red-500 ml-1">*</span></label>
          <div className="flex gap-3">
            <button
              type="button"
              disabled={readOnly}
              onClick={() => updateProfile({ academicStatus: 'studying', yearOfStudy: profile.yearOfStudy === 'Alumnus' ? '' : profile.yearOfStudy })}
              className={`flex-1 py-3 rounded-xl border font-black text-sm transition-all ${
                profile.academicStatus === 'studying' 
                ? 'bg-[#2c4869] border-[#2c4869] text-white shadow-md' 
                : 'bg-white border-slate-200 text-[#2c4869] hover:border-[#2c4869]/30'
              }`}
            >
              Currently Studying
            </button>
            <button
              type="button"
              disabled={readOnly}
              onClick={() => updateProfile({ academicStatus: 'graduated', yearOfStudy: 'Alumnus' })}
              className={`flex-1 py-3 rounded-xl border font-black text-sm transition-all ${
                profile.academicStatus === 'graduated' 
                ? 'bg-[#2c4869] border-[#2c4869] text-white shadow-md' 
                : 'bg-white border-slate-200 text-[#2c4869] hover:border-[#2c4869]/30'
              }`}
            >
              Graduated / Alumni
            </button>
          </div>
          {validationErrors.academicStatus && <p className="text-red-500 text-xs mt-1">{validationErrors.academicStatus}</p>}
        </div>

        {profile.academicStatus && (
          <>
            <div>
              <label className="block text-sm font-bold text-[#2c4869] mb-2 tracking-tight">
                {profile.academicStatus === 'studying' ? 'Current College or University' : 'College or University you graduated from'} <span className="text-red-500 ml-1">*</span>
              </label>
              <input 
                type="text" 
                value={profile.collegeName}
                onChange={(e) => updateProfile({ collegeName: e.target.value })}
                placeholder="e.g. Lucknow University, IIT K, or your Institution"
                disabled={readOnly}
                className={`w-full px-4 py-3 rounded-xl border ${validationErrors.collegeName ? 'border-red-500 ring-2 ring-red-100' : 'border-slate-200 focus:ring-2 focus:ring-[#f58434]'} outline-none transition-all font-medium`}
              />
              {validationErrors.collegeName && <p className="text-red-500 text-xs mt-1">{validationErrors.collegeName}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-[#2c4869] mb-2 tracking-tight">
                  {profile.academicStatus === 'studying' ? 'Degree being pursued' : 'Highest degree completed'} <span className="text-red-500 ml-1">*</span>
                </label>
                <select 
                  value={profile.degreeType}
                  onChange={(e) => updateProfile({ degreeType: e.target.value })}
                  disabled={readOnly}
                  className={`w-full px-4 py-3 rounded-xl border ${validationErrors.degreeType ? 'border-red-500 ring-2 ring-red-100' : 'border-slate-200 focus:ring-2 focus:ring-[#f58434]'} outline-none transition-all text-sm font-medium`}
                >
                  <option value="">Select Degree</option>
                  {DEGREE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                {validationErrors.degreeType && <p className="text-red-500 text-xs mt-1">{validationErrors.degreeType}</p>}
              </div>
              
              {profile.academicStatus === 'studying' && (!readOnly || profile.yearOfStudy) && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <label className="block text-sm font-bold text-[#2c4869] mb-2 tracking-tight">Current year of study</label>
                  <select 
                    value={profile.yearOfStudy}
                    onChange={(e) => updateProfile({ yearOfStudy: e.target.value })}
                    disabled={readOnly}
                    className={`w-full px-4 py-3 rounded-xl border ${validationErrors.yearOfStudy ? 'border-red-500 ring-2 ring-red-100' : 'border-slate-200 focus:ring-2 focus:ring-[#f58434]'} outline-none transition-all text-sm font-medium`}
                  >
                    <option value="">Select Year</option>
                    {[1, 2, 3, 4, 5].map(y => (
                      <option key={y} value={`${y}${y === 1 ? 'st' : y === 2 ? 'nd' : y === 3 ? 'rd' : 'th'} Year`}>
                        {y}{y === 1 ? 'st' : y === 2 ? 'nd' : y === 3 ? 'rd' : 'th'} Year
                      </option>
                    ))}
                  </select>
                  {validationErrors.yearOfStudy && <p className="text-red-500 text-xs mt-1">{validationErrors.yearOfStudy}</p>}
                </div>
              )}

              {profile.academicStatus === 'graduated' && (!readOnly || profile.graduationYear) && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <label className="block text-sm font-bold text-[#2c4869] mb-2 tracking-tight">Year of graduation</label>
                  <input 
                    type="text" 
                    value={profile.graduationYear || ''}
                    onChange={(e) => updateProfile({ graduationYear: e.target.value })}
                    placeholder="e.g. 2023"
                    disabled={readOnly}
                    className={`w-full px-4 py-3 rounded-xl border ${validationErrors.graduationYear ? 'border-red-500 ring-2 ring-red-100' : 'border-slate-200 focus:ring-2 focus:ring-[#f58434]'} outline-none transition-all font-medium`}
                  />
                  {validationErrors.graduationYear && <p className="text-red-500 text-xs mt-1">{validationErrors.graduationYear}</p>}
                </div>
              )}
            </div>

            {(!readOnly || profile.cgpa) && (
              <div>
                <label className="block text-sm font-bold text-[#2c4869] mb-2 tracking-tight">
                  {profile.academicStatus === 'studying' ? 'Current CGPA / Percentage' : 'Final CGPA / Percentage'}
                </label>
                <input 
                  type="text" 
                  value={profile.cgpa}
                  onChange={(e) => updateProfile({ cgpa: e.target.value })}
                  placeholder="e.g. 8.5/10 or 75%"
                  disabled={readOnly}
                  className={`w-full px-4 py-3 rounded-xl border ${validationErrors.cgpa ? 'border-red-500 ring-2 ring-red-100' : 'border-slate-200 focus:ring-2 focus:ring-[#f58434]'} outline-none transition-all font-medium`}
                />
                {validationErrors.cgpa && <p className="text-red-500 text-xs mt-1">{validationErrors.cgpa}</p>}
              </div>
            )}

            <div className={`p-5 bg-white rounded-2xl border ${validationErrors.topLevelCategory ? 'border-red-500 ring-2 ring-red-100' : 'border-slate-100'} shadow-sm space-y-5 transition-all`}>
              <div>
                <label className={`block text-xs font-black uppercase tracking-widest mb-3 ${validationErrors.topLevelCategory ? 'text-red-500' : 'text-[#2c4869]/40'}`}>Broad STEM Stream <span className="text-red-500 ml-1">*</span></label>
                <div className="flex gap-3">
                  {topLevels.map(level => (
                    <button
                      key={level}
                      type="button"
                      disabled={readOnly}
                      onClick={() => updateProfile({ 
                        topLevelCategory: level, 
                        specializationCategory: '', 
                        specialization: '',
                        customCategory: '',
                        customSpecialization: ''
                      })}
                      className={`flex-1 py-3 rounded-xl border font-black text-sm transition-all ${
                        profile.topLevelCategory === level 
                        ? 'bg-[#f58434] border-[#f58434] text-white shadow-md' 
                        : 'bg-white border-slate-200 text-[#2c4869] hover:border-[#f58434]/30'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
                {validationErrors.topLevelCategory && <p className="text-red-500 text-xs mt-1">{validationErrors.topLevelCategory}</p>}
              </div>
              
              {profile.topLevelCategory && (
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-[#2c4869] mb-2 tracking-tight">
                    Subject area
                    <span className="block text-[10px] font-semibold text-[#2c4869]/60 normal-case tracking-normal mt-0.5">
                      {profile.academicStatus === 'studying' ? "The one you're most interested in" : "The one you specialized in"}
                    </span>
                  </label>
                  <select 
                    value={profile.specializationCategory}
                    onChange={(e) => updateProfile({ specializationCategory: e.target.value, specialization: '', customCategory: '', customSpecialization: '' })}
                    disabled={readOnly}
                    className={`w-full px-4 py-3 rounded-xl border ${validationErrors.specializationCategory ? 'border-red-500 ring-2 ring-red-100' : 'border-slate-200 focus:ring-2 focus:ring-[#f58434]'} outline-none transition-all text-sm font-medium`}
                  >
                    <option value="">Select Area</option>
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                  {validationErrors.specializationCategory && <p className="text-red-500 text-xs mt-1">{validationErrors.specializationCategory}</p>}

                  {profile.specializationCategory === 'Other' && (
                    <div className="animate-in slide-in-from-top-2 duration-300">
                      <label className="block text-[10px] font-black text-[#f58434] uppercase tracking-widest mb-1.5 ml-1">Please specify your subject area</label>
                      <input 
                        type="text" 
                        value={profile.customCategory}
                        onChange={(e) => updateProfile({ customCategory: e.target.value })}
                        placeholder="e.g. Quantum Computing, Ethnobotany..."
                        disabled={readOnly}
                        className="w-full px-4 py-3 rounded-xl border border-[#f58434]/30 bg-[#f58434]/5 focus:ring-2 focus:ring-[#f58434] outline-none transition-all font-medium text-sm"
                      />
                    </div>
                  )}
                </div>
              )}

              {profile.specializationCategory && (
                <div className="space-y-3">
                  <label className="block text-sm font-bold text-[#2c4869] mb-2 tracking-tight">
                    Specialization
                    <span className="block text-[10px] font-semibold text-[#2c4869]/60 normal-case tracking-normal mt-0.5">
                      {profile.academicStatus === 'studying' ? "The one you would like to pursue or you are currently pursuing" : "The one you specialized in"}
                    </span>
                  </label>
                  <select 
                    value={profile.specialization}
                    onChange={(e) => updateProfile({ specialization: e.target.value, customSpecialization: '' })}
                    disabled={readOnly}
                    className={`w-full px-4 py-3 rounded-xl border ${validationErrors.specialization ? 'border-red-500 ring-2 ring-red-100' : 'border-slate-200 focus:ring-2 focus:ring-[#f58434]'} outline-none transition-all text-sm font-medium`}
                  >
                    <option value="">Select Specialization</option>
                    {subFields.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                  </select>
                  {validationErrors.specialization && <p className="text-red-500 text-xs mt-1">{validationErrors.specialization}</p>}

                  {profile.specialization === 'Other' && (
                    <div className="animate-in slide-in-from-top-2 duration-300">
                      <label className="block text-[10px] font-black text-[#f58434] uppercase tracking-widest mb-1.5 ml-1">Please specify your specialization</label>
                      <input 
                        type="text" 
                        value={profile.customSpecialization}
                        onChange={(e) => updateProfile({ customSpecialization: e.target.value })}
                        placeholder="e.g. Deep Learning for Healthcare, Polymer Chemistry..."
                        disabled={readOnly}
                        className="w-full px-4 py-3 rounded-xl border border-[#f58434]/30 bg-[#f58434]/5 focus:ring-2 focus:ring-[#f58434] outline-none transition-all font-medium text-sm"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AcademicForm;

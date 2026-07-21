import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Users, 
  Settings, 
  Trash2, 
  MapPin, 
  Phone, 
  Info, 
  Sparkles, 
  RefreshCw, 
  Check, 
  FileText, 
  Calendar, 
  CreditCard,
  Briefcase,
  X
} from 'lucide-react';
import { Household, Member, RELATIONSHIPS, GENDERS } from '../types';
import { cn } from '../lib/utils';

interface HouseholdsTabProps {
  households: Household[];
  allMembers: Member[];
  selectedHouseholdId: string | null;
  onSelectHousehold: (id: string | null) => void;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  filteredHouseholds: Household[];
  onAddHouseholdClick: () => void;
  onEditHouseholdClick: (h: Household) => void;
  onDeleteHousehold: (id: string, name: string) => void;
  onAiAnalyze: () => void;
  isAiAnalyzing: boolean;
  aiAnalysis: any;
  aiError: string | null;
  onApplyAiNotes: () => void;
  selectedHouseholdMembers: Member[];
  
  // Inline member form properties
  showMemberForm: boolean;
  onShowMemberFormChange: (show: boolean) => void;
  editingMemberId: string | null;
  onEditMemberClick: (m: Member) => void;
  onDeleteMember: (mId: string, name: string, hId?: string) => void;
  onSaveMember: (e: React.FormEvent) => void;
  isSavingMember: boolean;

  // Form Fields
  mName: string;
  onMNameChange: (v: string) => void;
  mRelation: string;
  onMRelationChange: (v: string) => void;
  mBirth: string;
  onMBirthChange: (v: string) => void;
  mGender: string;
  onMGenderChange: (v: string) => void;
  mResidenceStatus: string;
  onMResidenceStatusChange: (v: string) => void;
  mPhone: string;
  onMPhoneChange: (v: string) => void;
  mAddress: string;
  onMAddressChange: (v: string) => void;
  mNotes: string;
  onMNotesChange: (v: string) => void;
}

export default function HouseholdsTab({
  households,
  allMembers,
  selectedHouseholdId,
  onSelectHousehold,
  searchQuery,
  onSearchQueryChange,
  filteredHouseholds,
  onAddHouseholdClick,
  onEditHouseholdClick,
  onDeleteHousehold,
  onAiAnalyze,
  isAiAnalyzing,
  aiAnalysis,
  aiError,
  onApplyAiNotes,
  selectedHouseholdMembers,

  showMemberForm,
  onShowMemberFormChange,
  editingMemberId,
  onEditMemberClick,
  onDeleteMember,
  onSaveMember,
  isSavingMember,

  mName,
  onMNameChange,
  mRelation,
  onMRelationChange,
  mBirth,
  onMBirthChange,
  mGender,
  onMGenderChange,
  mResidenceStatus,
  onMResidenceStatusChange,
  mPhone,
  onMPhoneChange,
  mAddress,
  onMAddressChange,
  mNotes,
  onMNotesChange
}: HouseholdsTabProps) {
  const currentYear = new Date().getFullYear();
  const activeHousehold = households.find(h => h.id === selectedHouseholdId);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* LEFT SIDE: HOUSEHOLDS LIST (5 cols) */}
      <div className="lg:col-span-5 space-y-4">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-900">Danh Sách Hộ Gia Đình</h3>
            <button
              onClick={onAddHouseholdClick}
              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2.5 px-4 rounded-xl shadow-md shadow-blue-100 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Thêm Hộ Gia Đình
            </button>
          </div>

          {/* Search & filters */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Tìm theo tên chủ hộ, mã hộ, SĐT, CCCD..."
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border-none rounded-2xl text-sm font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* List Cards */}
        <div className="space-y-3 overflow-y-auto max-h-[500px] pr-1">
          {filteredHouseholds.length === 0 ? (
            <div className="bg-white p-8 rounded-3xl text-center text-slate-400 font-medium border border-slate-100">
              Không tìm thấy hộ dân cư phù hợp.
            </div>
          ) : (
            filteredHouseholds.map(h => {
              const hMembers = allMembers.filter(m => m.householdId === h.id);
              const isSelected = selectedHouseholdId === h.id;
              return (
                <motion.div
                  key={h.id}
                  onClick={() => onSelectHousehold(h.id)}
                  className={cn(
                    "bg-white p-5 rounded-3xl border transition-all cursor-pointer flex flex-col gap-3 relative group",
                    isSelected 
                      ? "border-blue-500 shadow-md ring-2 ring-blue-50/50" 
                      : "border-slate-100 hover:border-slate-200 shadow-sm"
                  )}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-sm shrink-0">
                        {h.ownerName.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-slate-900 leading-tight truncate">{h.ownerName}</h4>
                        <p className="text-xs text-slate-400 font-bold mt-0.5 tracking-wider uppercase">{h.householdCode}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Members Count Badge */}
                      <span className="bg-slate-100 text-slate-600 text-[10px] font-extrabold uppercase tracking-wider px-2 py-1 rounded-lg flex items-center gap-1 shrink-0 whitespace-nowrap">
                        <Users className="w-3 h-3" /> {hMembers.length} Nhân khẩu
                      </span>

                      {/* Quick Delete & Edit Action Indicators */}
                      <div className="flex gap-0.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-150 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditHouseholdClick(h);
                          }}
                          className="p-1 hover:bg-slate-100 text-slate-500 hover:text-blue-600 rounded-lg transition-all cursor-pointer"
                          title="Sửa hộ khẩu"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteHousehold(h.id, h.ownerName);
                          }}
                          className="p-1 hover:bg-slate-100 text-slate-500 hover:text-red-500 rounded-lg transition-all cursor-pointer"
                          title="Xóa hộ khẩu"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-500">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{h.address}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{h.phone}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT SIDE: HOUSEHOLD DETAIL & MEMBER MANAGEMENT (7 cols) */}
      <div className="lg:col-span-7">
        <AnimatePresence mode="wait">
          {!selectedHouseholdId ? (
            /* Placeholder Dashboard info */
            <motion.div
              key="placeholder-panel"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6"
            >
              <div className="text-center py-8 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center mx-auto">
                  <Info className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">Chọn hộ gia đình để quản lý</h3>
                  <p className="text-sm text-slate-400 max-w-sm mx-auto mt-1">
                    Chọn bất kỳ hộ khẩu nào ở danh sách bên trái để xem thông tin chi tiết, chỉnh sửa nhân khẩu và nhận phân tích thông minh từ trợ lý AI.
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6 space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Phổ biến diện cư dân đặc biệt (Ghi chú)</h4>
                <div className="flex flex-wrap gap-2">
                  {Array.from(new Set(allMembers.map(m => m.notes).filter(Boolean))).slice(0, 8).map(note => {
                    const count = allMembers.filter(m => m.notes === note).length;
                    return (
                      <span key={note} className="bg-slate-50 border border-slate-100 text-slate-600 px-3 py-1.5 rounded-xl text-xs font-semibold">
                        {note}: <strong className="text-slate-800">{count}</strong>
                      </span>
                    );
                  })}
                </div>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl text-xs text-slate-500 leading-relaxed space-y-2">
                <p className="font-bold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600 animate-pulse" /> Trợ lý AI có thể làm gì?
                </p>
                <p>
                  Khi bạn chọn một hộ gia đình, nút AI sẽ quét tự động cơ cấu giới tính, độ tuổi và nghề nghiệp của các nhân khẩu. Nó sẽ tư vấn chi tiết cho tổ dân phố về an sinh xã hội (tiêm chủng trẻ em, chăm sóc người già), gợi ý các nhiệm vụ truyền thông xã hội và viết tóm tắt ghi chú cộng đồng hoàn hảo.
                </p>
              </div>
            </motion.div>
          ) : (
            /* Active Household Detailed Panel */
            activeHousehold && (
              <motion.div
                key={`household-detail-${activeHousehold.id}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-6"
              >
                {/* Main Info Card */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <span className="bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg">
                        {activeHousehold.householdCode}
                      </span>
                      <h2 className="text-2xl font-black text-slate-950 mt-1">{activeHousehold.ownerName}</h2>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => onEditHouseholdClick(activeHousehold)}
                        className="bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold py-2 px-3.5 rounded-xl border border-slate-150 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Settings className="w-4 h-4 text-slate-500" /> Sửa hộ
                      </button>
                      <button
                        onClick={() => onDeleteHousehold(activeHousehold.id, activeHousehold.ownerName)}
                        className="bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold py-2 px-3.5 rounded-xl border border-red-100 transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" /> Xóa
                      </button>
                    </div>
                  </div>

                  {/* Household Contact and Metadata */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-start gap-2.5">
                      <MapPin className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
                      <div>
                        <p className="text-slate-400 text-xs font-semibold">Địa chỉ hộ khẩu</p>
                        <p className="text-slate-800 font-medium mt-0.5">{activeHousehold.address}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Phone className="w-4 h-4 text-slate-400 mt-1 shrink-0" />
                      <div>
                        <p className="text-slate-400 text-xs font-semibold">Số điện thoại liên hệ</p>
                        <p className="text-slate-800 font-medium mt-0.5">{activeHousehold.phone}</p>
                      </div>
                    </div>
                  </div>

                  {/* Household Notes */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ghi chú chi tiết của hộ</span>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                      {activeHousehold.notes || 'Không có ghi chú đặc biệt nào.'}
                    </div>
                  </div>
                </div>

                {/* AI Helper Integration Card */}
                <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-3xl shadow-xl shadow-indigo-100/50 space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-indigo-500/10 rounded-xl text-indigo-300">
                        <Sparkles className="w-5 h-5 animate-pulse text-indigo-400" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black tracking-wide">Trợ lý Dân phố AI</h4>
                        <p className="text-[10px] text-slate-400">Phân tích cư dân & Khuyến nghị Tiêm chủng, An sinh</p>
                      </div>
                    </div>

                    <button
                      onClick={onAiAnalyze}
                      disabled={isAiAnalyzing}
                      className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5"
                    >
                      {isAiAnalyzing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 text-amber-300" />}
                      {isAiAnalyzing ? 'Đang phân tích...' : 'AI Phân Tích Hộ'}
                    </button>
                  </div>

                  {aiError && (
                    <p className="text-xs text-red-300 font-medium bg-red-500/10 p-3 rounded-xl border border-red-500/20">{aiError}</p>
                  )}

                  {/* Show AI results */}
                  {aiAnalysis && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-indigo-950/40 p-4 rounded-2xl space-y-4 border border-indigo-700/20 text-slate-200"
                    >
                      <div className="space-y-1">
                        <p className="text-xs font-extrabold text-indigo-300 uppercase tracking-wider">Khuyến nghị đề xuất của AI:</p>
                        <p className="text-sm leading-relaxed text-slate-300">{aiAnalysis.suggestedNotes}</p>
                      </div>

                      <div className="space-y-2">
                        <p className="text-xs font-extrabold text-indigo-300 uppercase tracking-wider">Phân loại nhãn hộ:</p>
                        <div className="flex flex-wrap gap-1.5">
                          {aiAnalysis.tags.map((t: string) => (
                            <span key={t} className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-1 rounded-lg text-[10px] font-bold">
                              #{t}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={onApplyAiNotes}
                          className="bg-white hover:bg-slate-100 text-indigo-950 text-xs font-bold py-2 px-4 rounded-xl shadow-lg transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <Check className="w-4 h-4 text-emerald-600" /> Áp dụng Ghi chú này
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Member Section */}
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-900">Danh Sách Nhân Khẩu ({selectedHouseholdMembers.length})</h3>
                    {!showMemberForm && (
                      <button
                        onClick={() => {
                          onMNameChange('');
                          onMRelationChange('Con');
                          onMBirthChange('');
                          onMGenderChange('Nam');
                          onMResidenceStatusChange('Có mặt tại địa phương');
                          onMPhoneChange('');
                          onMAddressChange('');
                          onMNotesChange('');
                          onShowMemberFormChange(true);
                        }}
                        className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2 px-3.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Thêm Nhân Khẩu
                      </button>
                    )}
                  </div>

                  {/* Member Form Panel */}
                  {showMemberForm && (
                    <motion.form 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      onSubmit={onSaveMember}
                      className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4"
                    >
                      <div className="flex justify-between items-center pb-2 border-b border-slate-200/50">
                        <h4 className="text-sm font-bold text-slate-800">
                          {editingMemberId ? 'Sửa Nhân Khẩu' : 'Thêm Nhân Khẩu Mới'}
                        </h4>
                        <button
                          type="button"
                          onClick={() => onShowMemberFormChange(false)}
                          className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Họ và tên *</label>
                          <input
                            required
                            type="text"
                            placeholder="Ví dụ: Nguyễn Minh Quân"
                            value={mName}
                            onChange={(e) => onMNameChange(e.target.value)}
                            className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Quan hệ với chủ hộ *</label>
                          <select
                            required
                            value={mRelation}
                            onChange={(e) => onMRelationChange(e.target.value)}
                            className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            {RELATIONSHIPS.map(rel => (
                              <option key={rel} value={rel}>{rel}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ngày sinh *</label>
                          <input
                            required
                            type="date"
                            value={mBirth}
                            onChange={(e) => onMBirthChange(e.target.value)}
                            className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Giới tính *</label>
                          <div className="flex gap-2">
                            {GENDERS.map(g => (
                              <button
                                key={g}
                                type="button"
                                onClick={() => onMGenderChange(g)}
                                className={cn(
                                  "flex-1 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer",
                                  mGender === g 
                                    ? "bg-slate-900 text-white border-slate-900" 
                                    : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                                )}
                              >
                                {g}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Tình trạng cư trú *</label>
                          <select
                            required
                            value={mResidenceStatus}
                            onChange={(e) => onMResidenceStatusChange(e.target.value)}
                            className="w-full px-3 py-2.5 bg-white rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
                          >
                            <option value="Có mặt tại địa phương">Có mặt tại địa phương</option>
                            <option value="Đi làm ăn xa">Đi làm ăn xa</option>
                            <option value="Đã mất">Đã mất</option>
                          </select>
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Số điện thoại riêng (nếu có)</label>
                          <input
                            type="text"
                            placeholder="Ví dụ: 0912xxxxxx"
                            value={mPhone}
                            onChange={(e) => onMPhoneChange(e.target.value)}
                            className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Địa chỉ thường trú / cư trú riêng (nếu khác địa chỉ hộ)</label>
                          <input
                            type="text"
                            placeholder="Nhập địa chỉ cư trú riêng (bỏ trống nếu trùng với địa chỉ hộ khẩu)"
                            value={mAddress}
                            onChange={(e) => onMAddressChange(e.target.value)}
                            className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                        </div>

                        <div className="md:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ghi chú (diện chính sách, hoàn cảnh...) *</label>
                          <textarea
                            required
                            rows={2}
                            placeholder="Ví dụ: Thương binh, bệnh binh, bộ đội tại ngũ, hộ nghèo, gia đình chính sách... (nếu không có hãy điền '-')"
                            value={mNotes}
                            onChange={(e) => onMNotesChange(e.target.value)}
                            className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => onShowMemberFormChange(false)}
                          className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 cursor-pointer"
                        >
                          Hủy bỏ
                        </button>
                        <button
                          type="submit"
                          disabled={isSavingMember}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-4 rounded-xl shadow-md transition-all cursor-pointer"
                        >
                          {isSavingMember ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Lưu nhân khẩu'}
                        </button>
                      </div>
                    </motion.form>
                  )}

                  {/* Members list view */}
                  <div className="space-y-3">
                    {selectedHouseholdMembers.length === 0 ? (
                      <p className="text-center py-6 text-sm text-slate-400 font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        Chưa có nhân khẩu nào đăng ký trong hộ. Hãy click 'Thêm Nhân Khẩu' ở trên.
                      </p>
                    ) : (
                      selectedHouseholdMembers.map(m => {
                        const age = m.birthDate ? (currentYear - parseInt(m.birthDate.split('-')[0])) : null;
                        return (
                          <div key={m.id} className="bg-slate-50 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 border border-slate-100 group">
                            <div className="space-y-1.5 flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-slate-800 leading-tight">{m.fullName}</p>
                                <span className={cn(
                                  "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0",
                                  m.relationship === 'Chủ hộ' ? "bg-amber-100 text-amber-700" : "bg-blue-50 text-blue-600"
                                )}>
                                  {m.relationship}
                                </span>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] font-medium text-slate-500">
                                <span className="flex items-center gap-1 shrink-0"><Calendar className="w-3 h-3 text-slate-400" /> {m.birthDate} ({age} tuổi)</span>
                                <span className="flex items-center gap-1 shrink-0">
                                  Giới tính: <strong className="text-slate-700">{m.gender}</strong>
                                </span>
                                <span className="flex items-center gap-1 shrink-0 col-span-2 md:col-span-1">
                                  Cư trú: 
                                  <span className={cn(
                                    "px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 border ml-0.5",
                                    m.residenceStatus === 'Có mặt tại địa phương' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                                    m.residenceStatus === 'Đi làm ăn xa' ? "bg-amber-50 text-amber-700 border-amber-100" :
                                    "bg-rose-50 text-rose-700 border-rose-100"
                                  )}>
                                    {m.residenceStatus}
                                  </span>
                                </span>
                                <span className="flex items-center gap-1 shrink-0 col-span-2 md:col-span-1" title={m.notes}>
                                  <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" /> 
                                  Ghi chú: <strong className="text-slate-700 font-bold max-w-[150px] truncate">{m.notes || '---'}</strong>
                                </span>
                              </div>

                              {m.address && (
                                <div className="pt-2 mt-2 border-t border-slate-200/50">
                                  <p className="text-[11px] text-slate-500 flex items-start gap-1.5 leading-relaxed">
                                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                    <span><strong className="text-slate-700 font-bold">Địa chỉ:</strong> {m.address}</span>
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1.5 md:opacity-0 group-hover:opacity-100 transition-opacity justify-end border-t md:border-none pt-2 md:pt-0 border-slate-200/50">
                              <button
                                onClick={() => onEditMemberClick(m)}
                                className="p-1.5 hover:bg-slate-200 text-slate-500 hover:text-blue-600 rounded-lg transition-all cursor-pointer"
                                title="Sửa nhân khẩu"
                              >
                                <Settings className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onDeleteMember(m.id, m.fullName, m.householdId)}
                                className="p-1.5 hover:bg-slate-200 text-slate-500 hover:text-red-500 rounded-lg transition-all cursor-pointer"
                                title="Xóa nhân khẩu"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </motion.div>
            )
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

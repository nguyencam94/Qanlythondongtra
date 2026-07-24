import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Users, 
  Settings, 
  Trash2, 
  MapPin, 
  Phone, 
  Sparkles, 
  RefreshCw, 
  Check, 
  FileText, 
  Calendar, 
  X,
  ArrowLeft,
  ChevronRight,
  Home,
  UserCheck,
  Folder,
  FolderOpen,
  ChevronDown,
  ChevronUp,
  LayoutGrid,
  Map
} from 'lucide-react';
import { Household, Member, RELATIONSHIPS, GENDERS } from '../types';
import { cn } from '../lib/utils';

// Helper function to extract location/area folder from address
export function extractLocationGroup(address: string): string {
  if (!address || !address.trim()) return 'Chưa phân khu / Chưa nhập địa chỉ';

  const clean = address.trim();
  const parts = clean.split(',').map(p => p.trim()).filter(Boolean);

  const locationKeywords = ['xóm', 'tổ', 'đội', 'cụm', 'tòa', 'khu', 'đường', 'phố', 'thôn', 'ấp', 'khu dân cư', 'chung cư'];

  for (const part of parts) {
    const lower = part.toLowerCase();
    if (locationKeywords.some(kw => lower.includes(kw))) {
      return part;
    }
  }

  if (parts.length > 1) {
    return parts[0];
  }
  return clean;
}

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

  // Folder & View mode state
  const [selectedFolder, setSelectedFolder] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'folder' | 'grid'>('folder');
  const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});

  // Group households by location folder extracted from address
  const groupedHouseholds = useMemo(() => {
    const groups: Record<string, Household[]> = {};
    filteredHouseholds.forEach((h) => {
      const groupName = extractLocationGroup(h.address);
      if (!groups[groupName]) groups[groupName] = [];
      groups[groupName].push(h);
    });
    return groups;
  }, [filteredHouseholds]);

  // List of location folder names sorted by number of households
  const locationGroups = useMemo(() => {
    return Object.keys(groupedHouseholds).sort((a, b) => {
      return groupedHouseholds[b].length - groupedHouseholds[a].length;
    });
  }, [groupedHouseholds]);

  const toggleFolderCollapse = (groupName: string) => {
    setCollapsedFolders(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  // IF NO HOUSEHOLD IS SELECTED: RENDER STANDALONE HOUSEHOLD LIST PAGE WITH FOLDERS
  if (!selectedHouseholdId || !activeHousehold) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="space-y-6"
      >
        {/* TOP BAR & ACTIONS */}
        <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg md:text-xl font-black text-slate-900 flex items-center gap-2">
                <Home className="w-5 h-5 text-blue-600 shrink-0" />
                Danh Sách Hộ Gia Đình
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Quản lý {filteredHouseholds.length} hộ khẩu được nhóm theo {locationGroups.length} khu vực / xóm
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
              <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1">
                <button
                  onClick={() => setViewMode('folder')}
                  className={cn(
                    "px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                    viewMode === 'folder' 
                      ? "bg-white text-blue-600 shadow-xs" 
                      : "text-slate-500 hover:text-slate-800"
                  )}
                  title="Giao diện nhóm theo Thư mục Khu vực"
                >
                  <Folder className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Thư mục</span>
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                    viewMode === 'grid' 
                      ? "bg-white text-blue-600 shadow-xs" 
                      : "text-slate-500 hover:text-slate-800"
                  )}
                  title="Giao diện dạng Lưới tất cả"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Lưới</span>
                </button>
              </div>

              <button
                onClick={onAddHouseholdClick}
                className="bg-blue-600 hover:bg-blue-700 text-white text-xs md:text-sm font-bold py-2 px-3.5 md:py-2.5 md:px-4 rounded-xl md:rounded-2xl shadow-md shadow-blue-100 transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Thêm Hộ Mới</span><span className="sm:hidden">Thêm</span>
              </button>
            </div>
          </div>

          {/* SEARCH INPUT */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Tìm theo họ tên chủ hộ, mã hộ khẩu, số điện thoại, xóm/địa chỉ..."
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 md:py-3 bg-slate-50 border border-slate-100 rounded-xl md:rounded-2xl text-xs md:text-sm font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchQueryChange('')}
                className="absolute right-3 top-3 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* LOCATION FOLDER CHIPS / QUICK FILTER BAR */}
          {locationGroups.length > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar text-xs">
              <span className="text-slate-400 font-bold shrink-0 text-[11px] flex items-center gap-1 mr-1">
                <Map className="w-3.5 h-3.5 text-blue-500" /> Khu vực:
              </span>
              <button
                onClick={() => setSelectedFolder('ALL')}
                className={cn(
                  "px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer border text-xs flex items-center gap-1.5",
                  selectedFolder === 'ALL'
                    ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                )}
              >
                Tất cả ({filteredHouseholds.length})
              </button>

              {locationGroups.map((groupName) => {
                const count = groupedHouseholds[groupName].length;
                const isSelected = selectedFolder === groupName;
                return (
                  <button
                    key={groupName}
                    onClick={() => setSelectedFolder(isSelected ? 'ALL' : groupName)}
                    className={cn(
                      "px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer border text-xs flex items-center gap-1.5",
                      isSelected
                        ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                        : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                    )}
                  >
                    <Folder className="w-3.5 h-3.5 text-amber-500" />
                    <span>{groupName}</span>
                    <span className={cn("px-1.5 py-0.2 rounded-md text-[10px]", isSelected ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700")}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* HOUSEHOLDS LIST / FOLDERS VIEW */}
        {filteredHouseholds.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl md:rounded-3xl text-center border border-slate-100 shadow-sm space-y-3">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <p className="text-slate-600 font-bold text-sm">Không tìm thấy hộ gia đình nào phù hợp</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Thử tìm kiếm với từ khóa khác hoặc bấm nút "Thêm Hộ Gia Đình Mới" để bắt đầu tạo hộ khẩu.
            </p>
          </div>
        ) : viewMode === 'grid' || selectedFolder !== 'ALL' ? (
          /* GRID VIEW or SPECIFIC FOLDER VIEW */
          <div className="space-y-4">
            {selectedFolder !== 'ALL' && (
              <div className="bg-blue-50/70 border border-blue-100 p-3.5 rounded-2xl flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-blue-600 shrink-0" />
                  <div>
                    <h4 className="font-bold text-slate-900 text-sm">Thư mục khu vực: {selectedFolder}</h4>
                    <p className="text-xs text-slate-500">
                      Đang hiển thị {groupedHouseholds[selectedFolder]?.length || 0} hộ khẩu thuộc khu vực này
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedFolder('ALL')}
                  className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  Xem tất cả
                </button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
              {(selectedFolder === 'ALL' ? filteredHouseholds : (groupedHouseholds[selectedFolder] || [])).map((h) => {
                const hMembers = allMembers.filter(m => m.householdId === h.id);
                return (
                  <motion.div
                    key={h.id}
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.15 }}
                    onClick={() => onSelectHousehold(h.id)}
                    className="bg-white p-4 md:p-5 rounded-2xl md:rounded-3xl border border-slate-100 hover:border-blue-300 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-3 group relative"
                  >
                    {/* Top Meta Bar */}
                    <div className="flex items-center justify-between gap-2 border-b border-slate-50 pb-2.5">
                      <span className="bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg">
                        {h.householdCode}
                      </span>
                      <span className="bg-slate-100 text-slate-600 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg flex items-center gap-1">
                        <Users className="w-3 h-3" /> {hMembers.length} Nhân khẩu
                      </span>
                    </div>

                    {/* Owner Name & Initial Avatar */}
                    <div className="flex items-start gap-3 my-1">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm shadow-blue-200">
                        {h.ownerName.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-extrabold text-slate-900 text-base leading-snug break-words group-hover:text-blue-600 transition-colors">
                          {h.ownerName}
                        </h4>
                        <span className="inline-block text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100/60 px-1.5 py-0.5 rounded mt-0.5">
                          Chủ hộ
                        </span>
                      </div>
                    </div>

                    {/* Address & Phone */}
                    <div className="space-y-1.5 text-xs text-slate-500 pt-1">
                      <div className="flex items-start gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="break-words leading-relaxed text-slate-600 line-clamp-2">{h.address}</span>
                      </div>
                      {h.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="text-slate-600 font-medium">{h.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Footer Action Bar */}
                    <div className="pt-3 mt-1 border-t border-slate-100 flex items-center justify-between text-xs">
                      <span className="text-blue-600 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Xem chi tiết hộ <ChevronRight className="w-4 h-4" />
                      </span>

                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onEditHouseholdClick(h)}
                          className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-blue-600 rounded-lg transition-all cursor-pointer"
                          title="Sửa hộ khẩu"
                        >
                          <Settings className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteHousehold(h.id, h.ownerName)}
                          className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-red-500 rounded-lg transition-all cursor-pointer"
                          title="Xóa hộ khẩu"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ) : (
          /* GROUPED FOLDERS VIEW */
          <div className="space-y-6">
            {locationGroups.map((groupName) => {
              const groupHouseholds = groupedHouseholds[groupName];
              const isCollapsed = collapsedFolders[groupName];
              const totalMembersInGroup = groupHouseholds.reduce((acc, h) => {
                return acc + allMembers.filter(m => m.householdId === h.id).length;
              }, 0);

              return (
                <div 
                  key={groupName}
                  className="bg-white rounded-2xl md:rounded-3xl border border-slate-100 shadow-xs overflow-hidden"
                >
                  {/* FOLDER HEADER BANNER */}
                  <div 
                    onClick={() => toggleFolderCollapse(groupName)}
                    className="p-4 md:p-5 bg-gradient-to-r from-slate-50 via-blue-50/30 to-white flex items-center justify-between gap-3 cursor-pointer select-none border-b border-slate-100 hover:bg-slate-100/80 transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center justify-center shrink-0">
                        {isCollapsed ? <Folder className="w-5 h-5" /> : <FolderOpen className="w-5 h-5" />}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-extrabold text-slate-900 text-base md:text-lg leading-tight truncate">
                            Thư mục: {groupName}
                          </h4>
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-black uppercase px-2 py-0.5 rounded-md">
                            {groupHouseholds.length} Hộ
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                          <span>Tổng số {totalMembersInGroup} nhân khẩu</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFolder(groupName);
                        }}
                        className="hidden sm:inline-flex text-xs font-bold text-blue-600 hover:bg-blue-50 px-2.5 py-1 rounded-lg transition-all"
                      >
                        Chỉ xem thư mục này
                      </button>
                      <div className="p-1 text-slate-400 hover:text-slate-600">
                        {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                      </div>
                    </div>
                  </div>

                  {/* FOLDER CONTENT (HOUSEHOLDS GRID) */}
                  <AnimatePresence initial={false}>
                    {!isCollapsed && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-4 md:p-5 bg-slate-50/50"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                          {groupHouseholds.map((h) => {
                            const hMembers = allMembers.filter(m => m.householdId === h.id);
                            return (
                              <motion.div
                                key={h.id}
                                whileHover={{ y: -2 }}
                                transition={{ duration: 0.15 }}
                                onClick={() => onSelectHousehold(h.id)}
                                className="bg-white p-4 md:p-5 rounded-2xl md:rounded-3xl border border-slate-100 hover:border-blue-300 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-3 group relative"
                              >
                                {/* Top Meta Bar */}
                                <div className="flex items-center justify-between gap-2 border-b border-slate-50 pb-2.5">
                                  <span className="bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg">
                                    {h.householdCode}
                                  </span>
                                  <span className="bg-slate-100 text-slate-600 text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-lg flex items-center gap-1">
                                    <Users className="w-3 h-3" /> {hMembers.length} Nhân khẩu
                                  </span>
                                </div>

                                {/* Owner Name & Initial Avatar */}
                                <div className="flex items-start gap-3 my-1">
                                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shrink-0 shadow-sm shadow-blue-200">
                                    {h.ownerName.charAt(0)}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <h4 className="font-extrabold text-slate-900 text-base leading-snug break-words group-hover:text-blue-600 transition-colors">
                                      {h.ownerName}
                                    </h4>
                                    <span className="inline-block text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100/60 px-1.5 py-0.5 rounded mt-0.5">
                                      Chủ hộ
                                    </span>
                                  </div>
                                </div>

                                {/* Address & Phone */}
                                <div className="space-y-1.5 text-xs text-slate-500 pt-1">
                                  <div className="flex items-start gap-2">
                                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                    <span className="break-words leading-relaxed text-slate-600 line-clamp-2">{h.address}</span>
                                  </div>
                                  {h.phone && (
                                    <div className="flex items-center gap-2">
                                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                      <span className="text-slate-600 font-medium">{h.phone}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Footer Action Bar */}
                                <div className="pt-3 mt-1 border-t border-slate-100 flex items-center justify-between text-xs">
                                  <span className="text-blue-600 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                                    Xem chi tiết hộ <ChevronRight className="w-4 h-4" />
                                  </span>

                                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                    <button
                                      onClick={() => onEditHouseholdClick(h)}
                                      className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-blue-600 rounded-lg transition-all cursor-pointer"
                                      title="Sửa hộ khẩu"
                                    >
                                      <Settings className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => onDeleteHousehold(h.id, h.ownerName)}
                                      className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-red-500 rounded-lg transition-all cursor-pointer"
                                      title="Xóa hộ khẩu"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    );
  }

  // IF A HOUSEHOLD IS SELECTED: RENDER DEDICATED SEPARATE HOUSEHOLD DETAIL PAGE
  return (
    <motion.div 
      key={`household-page-${activeHousehold.id}`}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6"
    >
      {/* BREADCRUMB / BACK NAVIGATION BAR */}
      <div className="bg-white p-4 rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={() => onSelectHousehold(null)}
          className="inline-flex items-center gap-2 text-slate-700 hover:text-blue-600 font-bold text-xs md:text-sm bg-slate-50 hover:bg-slate-100 px-4 py-2.5 rounded-xl md:rounded-2xl transition-all border border-slate-200 cursor-pointer w-fit shadow-xs"
        >
          <ArrowLeft className="w-4 h-4 text-slate-500" /> Quay lại Danh sách Hộ khẩu
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onEditHouseholdClick(activeHousehold)}
            className="bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold py-2 px-3.5 rounded-xl border border-slate-200 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Settings className="w-4 h-4 text-slate-500" /> Chỉnh sửa thông tin hộ
          </button>
          <button
            onClick={() => onDeleteHousehold(activeHousehold.id, activeHousehold.ownerName)}
            className="bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold py-2 px-3.5 rounded-xl border border-red-100 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-red-500" /> Xóa hộ
          </button>
        </div>
      </div>

      {/* DETAILED CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: HOUSEHOLD INFORMATION & AI ASSISTANT (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Main Info Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5">
            <div className="pb-4 border-b border-slate-100 space-y-2">
              <span className="bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg inline-block">
                Mã hộ: {activeHousehold.householdCode}
              </span>
              <h2 className="text-2xl font-black text-slate-950 leading-tight">
                {activeHousehold.ownerName}
              </h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Chủ hộ gia đình</p>
            </div>

            {/* Household Contact and Metadata */}
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3 bg-slate-50 p-3.5 rounded-2xl">
                <MapPin className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-slate-400 text-xs font-semibold">Địa chỉ thường trú</p>
                  <p className="text-slate-800 font-medium mt-0.5 leading-relaxed">{activeHousehold.address}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-50 p-3.5 rounded-2xl">
                <Phone className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-slate-400 text-xs font-semibold">Số điện thoại liên hệ</p>
                  <p className="text-slate-800 font-bold mt-0.5">{activeHousehold.phone || 'Chưa cập nhật'}</p>
                </div>
              </div>
            </div>

            {/* Household Notes */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-400" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ghi chú chi tiết của hộ</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl text-xs md:text-sm text-slate-600 leading-relaxed whitespace-pre-wrap border border-slate-100">
                {activeHousehold.notes || 'Không có ghi chú đặc biệt nào.'}
              </div>
            </div>
          </div>

          {/* AI Helper Integration Card */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-6 rounded-3xl shadow-xl shadow-indigo-100/50 space-y-4">
            <div className="flex justify-between items-center flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-500/20 rounded-xl text-indigo-300">
                  <Sparkles className="w-5 h-5 animate-pulse text-indigo-300" />
                </div>
                <div>
                  <h4 className="text-sm font-black tracking-wide">Trợ lý Dân phố AI</h4>
                  <p className="text-[10px] text-slate-300">Phân tích cư dân & Khuyến nghị Tiêm chủng, An sinh</p>
                </div>
              </div>

              <button
                onClick={onAiAnalyze}
                disabled={isAiAnalyzing}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white text-xs font-bold py-2 px-3.5 rounded-xl transition-all shadow-md cursor-pointer flex items-center gap-1.5 shrink-0"
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
        </div>

        {/* RIGHT COLUMN: MEMBER MANAGEMENT & MEMBER LIST (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-blue-600 shrink-0" />
                  Danh Sách Nhân Khẩu Trong Hộ
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  Tổng số {selectedHouseholdMembers.length} thành viên đang đăng ký
                </p>
              </div>

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
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold py-2.5 px-4 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-sm"
                >
                  <Plus className="w-4 h-4" /> Thêm Nhân Khẩu Mới
                </button>
              )}
            </div>

            {/* Member Form Panel */}
            {showMemberForm && (
              <motion.form 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                onSubmit={onSaveMember}
                className="bg-slate-50 p-5 rounded-2xl border border-slate-200/80 space-y-4"
              >
                <div className="flex justify-between items-center pb-2 border-b border-slate-200">
                  <h4 className="text-sm font-bold text-slate-800">
                    {editingMemberId ? 'Sửa Thông Tin Nhân Khẩu' : 'Thêm Nhân Khẩu Mới Vao Hộ'}
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
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-700"
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
                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
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
                <div className="text-center py-8 text-sm text-slate-400 font-medium bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-1">
                  <p>Chưa có nhân khẩu nào đăng ký trong hộ.</p>
                  <p className="text-xs text-slate-400">Hãy bấm nút "Thêm Nhân Khẩu Mới" ở góc phải để nhập thông tin.</p>
                </div>
              ) : (
                selectedHouseholdMembers.map(m => {
                  const age = m.birthDate ? (currentYear - parseInt(m.birthDate.split('-')[0])) : null;
                  return (
                    <div key={m.id} className="bg-slate-50 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 border border-slate-100 group hover:border-slate-200 transition-all">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900 leading-tight text-sm md:text-base">{m.fullName}</p>
                          <span className={cn(
                            "text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0",
                            m.relationship === 'Chủ hộ' ? "bg-amber-100 text-amber-800" : "bg-blue-50 text-blue-600"
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
        </div>
      </div>
    </motion.div>
  );
}

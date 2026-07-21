import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Search, 
  Users, 
  Plus, 
  Calendar, 
  CreditCard, 
  Briefcase, 
  Phone, 
  MapPin, 
  Settings, 
  Trash2,
  Home,
  FileText,
  User
} from 'lucide-react';
import { Household, Member, RELATIONSHIPS } from '../types';
import { cn } from '../lib/utils';

interface MembersTabProps {
  households: Household[];
  allMembers: Member[];
  onEditMember: (m: Member) => void;
  onDeleteMember: (mId: string, name: string, hId?: string) => void;
  onAddMemberClick: () => void;
  onSelectHouseholdAndNavigate: (hId: string) => void;
}

export default function MembersTab({
  households,
  allMembers,
  onEditMember,
  onDeleteMember,
  onAddMemberClick,
  onSelectHouseholdAndNavigate
}: MembersTabProps) {
  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGender, setFilterGender] = useState('All');
  const [filterRelation, setFilterRelation] = useState('All');
  const [filterAgeGroup, setFilterAgeGroup] = useState('All');
  const [filterNotes, setFilterNotes] = useState('All');
  const [filterResidence, setFilterResidence] = useState('All');

  const currentYear = new Date().getFullYear();

  // Get distinct list of special notes/categories for the filter dropdown
  const distinctNotes = Array.from(
    new Set(allMembers.map(m => m.notes?.trim()).filter(n => n && n !== '-'))
  ).sort();

  // Global Resident filter logic
  const filteredMembers = allMembers.filter(m => {
    // 1. Text search
    const q = searchQuery.toLowerCase().trim();
    if (q) {
      const matchMember = m.fullName.toLowerCase().includes(q) ||
                          (m.residenceStatus && m.residenceStatus.toLowerCase().includes(q)) ||
                          (m.phone && m.phone.includes(q)) ||
                          (m.notes && m.notes.toLowerCase().includes(q));

      if (!matchMember) {
        // Also query household details
        const hh = households.find(h => h.id === m.householdId);
        if (hh) {
          const matchHH = hh.ownerName.toLowerCase().includes(q) || hh.householdCode.toLowerCase().includes(q);
          if (!matchHH) return false;
        } else {
          return false;
        }
      }
    }

    // 2. Gender
    if (filterGender !== 'All' && m.gender !== filterGender) return false;

    // 3. Relation
    if (filterRelation !== 'All') {
      if (filterRelation === 'Chủ hộ') {
        if (m.relationship !== 'Chủ hộ') return false;
      } else if (filterRelation === 'Vợ/Chồng') {
        if (m.relationship !== 'Vợ' && m.relationship !== 'Chồng') return false;
      } else if (filterRelation === 'Con') {
        if (!m.relationship.startsWith('Con')) return false;
      } else {
        if (m.relationship === 'Chủ hộ' || m.relationship === 'Vợ' || m.relationship === 'Chồng' || m.relationship.startsWith('Con')) return false;
      }
    }

    // 4. Age groups
    const birthYear = parseInt(m.birthDate?.split('-')[0]);
    const age = birthYear ? (currentYear - birthYear) : 0;
    if (filterAgeGroup !== 'All') {
      if (filterAgeGroup === 'children' && age >= 16) return false;
      if (filterAgeGroup === 'adults' && (age < 16 || age >= 60)) return false;
      if (filterAgeGroup === 'elders' && age < 60) return false;
    }

    // 5. Notes / Special category
    if (filterNotes !== 'All' && m.notes !== filterNotes) return false;

    // 6. Residence Status
    if (filterResidence !== 'All' && m.residenceStatus !== filterResidence) return false;

    return true;
  });

  return (
    <div className="space-y-6">
      {/* Control panel and filters */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
              <Users className="w-5.5 h-5.5 text-blue-600" />
              Sổ Danh Sách Nhân Khẩu Toàn Khu
            </h3>
            <p className="text-xs text-slate-400 font-semibold mt-0.5">
              Tổng số: <strong className="text-slate-700">{allMembers.length}</strong> cư dân. Tìm thấy: <strong className="text-blue-600">{filteredMembers.length}</strong> kết quả.
            </p>
          </div>

          <button
            onClick={onAddMemberClick}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-3 px-5 rounded-2xl shadow-md shadow-blue-100 transition-all flex items-center gap-2 cursor-pointer self-start md:self-auto"
          >
            <Plus className="w-4 h-4" /> Đăng Ký Nhân Khẩu Mới
          </button>
        </div>

        {/* Filters bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
          {/* Text search */}
          <div className="relative lg:col-span-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
            <input
              type="text"
              placeholder="Họ tên, SĐT, Cư trú..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-semibold placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Gender Select */}
          <div>
            <select
              value={filterGender}
              onChange={(e) => setFilterGender(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-semibold text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="All">-- Tất cả Giới tính --</option>
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
              <option value="Khác">Khác</option>
            </select>
          </div>

          {/* Relationship select */}
          <div>
            <select
              value={filterRelation}
              onChange={(e) => setFilterRelation(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-semibold text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="All">-- Mọi Quan hệ --</option>
              <option value="Chủ hộ">Chủ hộ</option>
              <option value="Vợ/Chồng">Vợ / Chồng</option>
              <option value="Con">Con cái</option>
              <option value="Khác">Họ hàng & Khác</option>
            </select>
          </div>

          {/* Age Group */}
          <div>
            <select
              value={filterAgeGroup}
              onChange={(e) => setFilterAgeGroup(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-semibold text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="All">-- Mọi Độ tuổi --</option>
              <option value="children">Trẻ em & Thiếu niên (&lt;16t)</option>
              <option value="adults">Độ tuổi lao động (16-59t)</option>
              <option value="elders">Người cao tuổi (&gt;=60t)</option>
            </select>
          </div>

          {/* Notes select */}
          <div>
            <select
              value={filterNotes}
              onChange={(e) => setFilterNotes(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-semibold text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="All">-- Mọi Ghi chú --</option>
              {distinctNotes.map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>

          {/* Residence Status select */}
          <div>
            <select
              value={filterResidence}
              onChange={(e) => setFilterResidence(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-semibold text-slate-600 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="All">-- Mọi Cư trú --</option>
              <option value="Có mặt tại địa phương">Có mặt tại địa phương</option>
              <option value="Đi làm ăn xa">Đi làm ăn xa</option>
              <option value="Đã mất">Đã mất</option>
            </select>
          </div>
        </div>
      </div>

      {/* Roster table view / cards view */}
      {filteredMembers.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl text-center text-slate-400 font-bold border border-slate-100 shadow-sm">
          Không tìm thấy cư dân nào phù hợp với bộ lọc tìm kiếm.
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  <th className="py-4 px-6">Họ tên cư dân</th>
                  <th className="py-4 px-6">Quan hệ chủ hộ</th>
                  <th className="py-4 px-6">Ngày sinh (Tuổi)</th>
                  <th className="py-4 px-6">Giới tính</th>
                  <th className="py-4 px-6">Tình trạng cư trú</th>
                  <th className="py-4 px-6">Ghi chú (diện cư dân)</th>
                  <th className="py-4 px-6">Hộ khẩu liên kết</th>
                  <th className="py-4 px-6 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-600">
                {filteredMembers.map(m => {
                  const birthYear = parseInt(m.birthDate?.split('-')[0]);
                  const age = birthYear ? (currentYear - birthYear) : null;
                  const hh = households.find(h => h.id === m.householdId);

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6">
                        <p className="font-bold text-slate-800 text-sm">{m.fullName}</p>
                        {m.phone && <span className="text-[10px] text-slate-400 block mt-0.5 font-semibold">SĐT: {m.phone}</span>}
                      </td>
                      <td className="py-4 px-6">
                        <span className={cn(
                          "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0",
                          m.relationship === 'Chủ hộ' ? "bg-amber-100 text-amber-700" : "bg-blue-50 text-blue-600"
                        )}>
                          {m.relationship}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {m.birthDate} ({age} tuổi)</span>
                      </td>
                      <td className="py-4 px-6">
                        <strong className="text-slate-800">{m.gender}</strong>
                      </td>
                      <td className="py-4 px-6">
                        <span className={cn(
                          "inline-block px-2.5 py-1 rounded-xl text-[10px] font-black border",
                          m.residenceStatus === 'Có mặt tại địa phương' ? "bg-emerald-50 text-emerald-700 border-emerald-200/50" :
                          m.residenceStatus === 'Đi làm ăn xa' ? "bg-amber-50 text-amber-700 border-amber-200/50" :
                          "bg-rose-50 text-rose-700 border-rose-200/50"
                        )}>
                          {m.residenceStatus}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center gap-1 text-slate-700 bg-slate-50 border border-slate-100/80 px-2.5 py-1.5 rounded-xl text-[11px] font-bold max-w-[180px] truncate" title={m.notes}>
                          <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" /> {m.notes || '---'}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        {hh ? (
                          <button
                            onClick={() => onSelectHouseholdAndNavigate(hh.id)}
                            className="bg-blue-50/60 hover:bg-blue-100/80 text-blue-600 px-3 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-1 border border-blue-100/30 transition-all cursor-pointer shadow-sm"
                            title="Bấm để mở chi tiết hộ gia đình"
                          >
                            <Home className="w-3.5 h-3.5" />
                            {hh.householdCode} ({hh.ownerName})
                          </button>
                        ) : (
                          <span className="text-red-400 italic">Mất liên kết hộ</span>
                        )}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex gap-1 justify-end">
                          <button
                            onClick={() => onEditMember(m)}
                            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-blue-600 rounded-lg transition-all cursor-pointer"
                            title="Chỉnh sửa thông tin"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteMember(m.id, m.fullName, m.householdId)}
                            className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-red-500 rounded-lg transition-all cursor-pointer"
                            title="Xóa nhân khẩu"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Roster Cards */}
          <div className="lg:hidden p-4 space-y-3.5">
            {filteredMembers.map(m => {
              const birthYear = parseInt(m.birthDate?.split('-')[0]);
              const age = birthYear ? (currentYear - birthYear) : null;
              const hh = households.find(h => h.id === m.householdId);

              return (
                <div key={m.id} className="bg-slate-50/40 p-4 rounded-2xl border border-slate-100 space-y-3 relative group">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="font-bold text-slate-900 text-sm leading-snug">{m.fullName}</p>
                      <span className={cn(
                        "inline-block px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider",
                        m.relationship === 'Chủ hộ' ? "bg-amber-100 text-amber-700" : "bg-blue-50 text-blue-600"
                      )}>
                        {m.relationship}
                      </span>
                    </div>

                    <div className="flex gap-1">
                      <button
                        onClick={() => onEditMember(m)}
                        className="p-1.5 bg-white text-slate-500 hover:text-blue-600 rounded-lg transition-all shadow-sm cursor-pointer"
                      >
                        <Settings className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDeleteMember(m.id, m.fullName, m.householdId)}
                        className="p-1.5 bg-white text-slate-500 hover:text-red-500 rounded-lg transition-all shadow-sm cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] font-medium text-slate-500 pt-2 border-t border-slate-100/80">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" /> {m.birthDate} ({age} tuổi)</span>
                    <span>Giới tính: <strong className="text-slate-800">{m.gender}</strong></span>
                    <span className="flex items-center gap-1 col-span-2">
                      Tình trạng:
                      <span className={cn(
                        "inline-block px-2 py-0.5 rounded-full text-[9px] font-black border ml-1",
                        m.residenceStatus === 'Có mặt tại địa phương' ? "bg-emerald-50 text-emerald-700 border-emerald-100" :
                        m.residenceStatus === 'Đi làm ăn xa' ? "bg-amber-50 text-amber-700 border-amber-100" :
                        "bg-rose-50 text-rose-700 border-rose-100"
                      )}>
                        {m.residenceStatus}
                      </span>
                    </span>
                    <span className="flex items-center gap-1 col-span-2"><FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" /> Ghi chú: <strong className="text-slate-800">{m.notes || '---'}</strong></span>
                    {m.phone && <span className="flex items-center gap-1 col-span-2"><Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" /> SĐT: {m.phone}</span>}
                  </div>

                  {hh && (
                    <div className="pt-2 border-t border-slate-100/50">
                      <button
                        onClick={() => onSelectHouseholdAndNavigate(hh.id)}
                        className="w-full bg-blue-50/50 hover:bg-blue-100/70 text-blue-600 py-2 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1.5 border border-blue-100/20 transition-all cursor-pointer shadow-sm"
                      >
                        <Home className="w-3.5 h-3.5" />
                        Liên kết Hộ: {hh.householdCode} ({hh.ownerName})
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

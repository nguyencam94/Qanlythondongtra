import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  CreditCard, 
  Plus, 
  Trash2, 
  Search, 
  Check, 
  X, 
  Settings, 
  Info,
  Calendar,
  FileText,
  TrendingUp,
  Award,
  Users,
  Home
} from 'lucide-react';
import { Household, Member, FeeCampaign, FeePayment } from '../types';
import { cn } from '../lib/utils';

interface FeesTabProps {
  households: Household[];
  allMembers: Member[];
  feeCampaigns: FeeCampaign[];
  feePayments: FeePayment[];
  selectedCampaignId: string | null;
  onSelectCampaign: (id: string | null) => void;
  onAddCampaignClick: () => void;
  onDeleteCampaign: (id: string, title: string) => void;
  onTogglePaymentStatus: (householdId: string, campaignId: string, defaultAmount: number, memberId?: string) => void;
  onOpenPaymentEdit: (householdId: string, campaignId: string, currentAmount: number, currentNotes: string, memberId?: string) => void;
}

export default function FeesTab({
  households,
  allMembers,
  feeCampaigns,
  feePayments,
  selectedCampaignId,
  onSelectCampaign,
  onAddCampaignClick,
  onDeleteCampaign,
  onTogglePaymentStatus,
  onOpenPaymentEdit
}: FeesTabProps) {
  const [ledgerSearchQuery, setLedgerSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'members' | 'households'>('members');

  // Selected Campaign Details
  const activeCampaign = feeCampaigns.find(c => c.id === selectedCampaignId);

  // Filtered ledger households
  const filteredLedgerHouseholds = households.filter(h => {
    const q = ledgerSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return h.ownerName.toLowerCase().includes(q) || h.householdCode.toLowerCase().includes(q);
  });

  // Filtered ledger members with household details
  const filteredLedgerMembers = allMembers.map(m => {
    const h = households.find(hh => hh.id === m.householdId);
    return {
      ...m,
      householdCode: h?.householdCode || 'N/A',
      address: m.address || h?.address || 'N/A',
      ownerName: h?.ownerName || 'Chưa rõ'
    };
  }).filter(m => {
    const q = ledgerSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return m.fullName.toLowerCase().includes(q) || m.householdCode.toLowerCase().includes(q) || m.relationship.toLowerCase().includes(q);
  });

  // Calculate campaign metrics for selection listing
  const campaignSummaryList = feeCampaigns.map(c => {
    const paymentsForCampaign = feePayments.filter(p => p.campaignId === c.id);
    const paidPayments = paymentsForCampaign.filter(p => p.status === 'paid');
    const totalCollected = paidPayments.reduce((sum, p) => sum + p.paidAmount, 0);
    const paidCount = paidPayments.length;
    const totalCount = households.length;
    const completionRate = totalCount > 0 ? (paidCount / totalCount) * 100 : 0;
    return {
      ...c,
      totalCollected,
      paidCount,
      completionRate
    };
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-fade-in">
      {/* LEFT COLUMN: Campaign Listing (4 cols) */}
      <div className="lg:col-span-4 space-y-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-50">
            <div>
              <h3 className="text-base font-black text-slate-900">Danh Mục Khoản Thu</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Thời gian thực</p>
            </div>
            <button
              onClick={onAddCampaignClick}
              className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-wider py-2 px-3 rounded-xl shadow-md transition-all flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Tạo Khoản Thu
            </button>
          </div>

          <div className="space-y-3 max-h-[550px] overflow-y-auto pr-1">
            {campaignSummaryList.length === 0 ? (
              <p className="text-center py-8 text-xs text-slate-400 font-bold">Chưa có khoản thu đóng nộp nào.</p>
            ) : (
              campaignSummaryList.map(c => {
                const isSelected = selectedCampaignId === c.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => onSelectCampaign(c.id)}
                    className={cn(
                      "p-4 rounded-2xl border transition-all cursor-pointer flex flex-col gap-2 relative group",
                      isSelected 
                        ? "border-blue-500 bg-blue-50/20 shadow-sm" 
                        : "border-slate-100 hover:border-slate-200 bg-white"
                    )}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-slate-800 text-xs leading-tight truncate group-hover:text-blue-600 transition-colors">
                          {c.title}
                        </h4>
                        <span className={cn(
                          "inline-block text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md mt-1.5",
                          c.type === 'mandatory' ? "bg-red-50 text-red-600 border border-red-100/50" : "bg-emerald-50 text-emerald-600 border border-emerald-100/50"
                        )}>
                          {c.type === 'mandatory' ? 'Bắt buộc' : 'Đóng góp tự nguyện'}
                        </span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteCampaign(c.id, c.title);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-red-500 transition-all cursor-pointer shrink-0"
                        title="Xóa khoản thu"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-[10px] text-slate-500 font-medium">
                      Định mức: <strong className="text-slate-700">{c.amount > 0 ? `${c.amount.toLocaleString('vi-VN')} đ` : 'Tùy tâm'}</strong>
                    </div>

                    {/* Progress slider */}
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[9px] font-extrabold text-slate-400 uppercase tracking-widest">
                        <span>Hoàn thành: {c.completionRate.toFixed(0)}%</span>
                        <span>Đã thu: {c.totalCollected.toLocaleString('vi-VN')} đ</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                        <div style={{ width: `${c.completionRate}%` }} className="bg-blue-600 h-full rounded-full" />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Ledger Table for selected Campaign (8 cols) */}
      <div className="lg:col-span-8">
        {!selectedCampaignId || !activeCampaign ? (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-12 text-center space-y-3">
            <CreditCard className="w-12 h-12 text-slate-300 mx-auto animate-pulse" />
            <h3 className="text-base font-black text-slate-800">Bảng Sổ Chi Tiết Đóng Góp</h3>
            <p className="text-xs text-slate-400 font-semibold max-w-sm mx-auto">
              Vui lòng chọn một khoản thu hoặc chiến dịch đóng góp ở cột bên trái để theo dõi tiến độ và ghi nhận đóng góp chi tiết của từng hộ cư dân.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden space-y-6 p-6">
            {/* Header info card */}
            <div className="flex flex-col md:flex-row justify-between gap-4 pb-4 border-b border-slate-50">
              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900 leading-tight">{activeCampaign.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  {activeCampaign.description || 'Chưa có mô tả chi tiết cho khoản thu đóng góp này.'}
                </p>
              </div>

              {/* Quick stats panel */}
              <div className="flex gap-3 shrink-0">
                <div className="bg-blue-50/50 p-3 rounded-2xl text-center border border-blue-100/20 shrink-0 min-w-[100px]">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Tổng Đã Thu</span>
                  <strong className="text-sm font-black text-blue-600 mt-1 block">
                    {feePayments
                      .filter(p => p.campaignId === activeCampaign.id && p.status === 'paid')
                      .reduce((sum, p) => sum + p.paidAmount, 0)
                      .toLocaleString('vi-VN')} đ
                  </strong>
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl text-center border border-slate-100 shrink-0 min-w-[90px]">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Tỷ Lệ Nộp</span>
                  <strong className="text-sm font-black text-slate-700 mt-1 block">
                    {(() => {
                      const paid = feePayments.filter(p => p.campaignId === activeCampaign.id && p.status === 'paid').length;
                      const denominator = viewMode === 'members' ? allMembers.length : households.length;
                      const rate = denominator > 0 ? (paid / denominator) * 100 : 0;
                      return `${rate.toFixed(0)}%`;
                    })()}
                  </strong>
                </div>
              </div>
            </div>

            {/* Ledger controller */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              {/* Segmented Control for View Mode */}
              <div className="flex bg-slate-100 p-1 rounded-2xl w-full md:w-auto">
                <button
                  onClick={() => setViewMode('members')}
                  className={cn(
                    "flex-1 md:flex-initial py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap",
                    viewMode === 'members'
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  <Users className="w-3.5 h-3.5" /> Theo Nhân Khẩu (Khẩu)
                </button>
                <button
                  onClick={() => setViewMode('households')}
                  className={cn(
                    "flex-1 md:flex-initial py-2 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap",
                    viewMode === 'households'
                      ? "bg-white text-blue-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  )}
                >
                  <Home className="w-3.5 h-3.5" /> Theo Hộ Gia Đình
                </button>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                <input
                  type="text"
                  placeholder={viewMode === 'members' ? "Tìm theo nhân khẩu, mã hộ..." : "Tìm theo chủ hộ, mã hộ..."}
                  value={ledgerSearchQuery}
                  onChange={(e) => setLedgerSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border-none rounded-xl text-xs font-semibold placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Ledger table */}
            <div className="overflow-x-auto border border-slate-100 rounded-2xl">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                    <th className="py-3 px-4">{viewMode === 'members' ? 'Nhân khẩu (Khẩu)' : 'Hộ cư dân'}</th>
                    <th className="py-3 px-4 text-center">Trạng thái đóng nộp</th>
                    <th className="py-3 px-4 text-right">Số tiền nộp</th>
                    <th className="py-3 px-4">Ghi chú & Ngày nộp</th>
                    <th className="py-3 px-4 text-center">Tùy chỉnh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-600">
                  {viewMode === 'members' ? (
                    filteredLedgerMembers.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-xs text-slate-400 font-bold">Không tìm thấy nhân khẩu phù hợp.</td>
                      </tr>
                    ) : (
                      filteredLedgerMembers.map(m => {
                        const payment = feePayments.find(p => p.memberId === m.id && p.campaignId === activeCampaign.id);
                        const isPaid = payment?.status === 'paid';
                        const paidAmount = payment?.paidAmount || 0;
                        const defaultAmount = activeCampaign.amount;

                        return (
                          <tr key={m.id} className="hover:bg-slate-50/30 transition-colors">
                            {/* Member Name and Info */}
                            <td className="py-4 px-4">
                              <p className="font-bold text-slate-800 text-sm">{m.fullName}</p>
                              <div className="flex flex-wrap gap-2 text-[10px] text-slate-400 font-bold mt-0.5 uppercase tracking-wide">
                                <span className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">{m.relationship}</span>
                                <span>•</span>
                                <span>Hộ: {m.ownerName} ({m.householdCode})</span>
                                <span>•</span>
                                <span className="truncate max-w-[120px]">{m.address}</span>
                              </div>
                            </td>

                            {/* Payment Status badge (Toggle handler clickable) */}
                            <td className="py-4 px-4 text-center">
                              <button
                                onClick={() => onTogglePaymentStatus(m.householdId, activeCampaign.id, defaultAmount, m.id)}
                                className={cn(
                                  "px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5 mx-auto hover:scale-[1.03] active:scale-[0.97]",
                                  isPaid 
                                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200" 
                                    : "bg-red-50 text-red-700 border border-red-200"
                                )}
                              >
                                {isPaid ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" /> Đã nộp
                                  </>
                                ) : (
                                  <>
                                    <X className="w-3.5 h-3.5" /> Chưa nộp
                                  </>
                                )}
                              </button>
                            </td>

                            {/* Amount */}
                            <td className="py-4 px-4 text-right font-black font-mono">
                              {isPaid ? (
                                <span className="text-emerald-600">{paidAmount.toLocaleString('vi-VN')} đ</span>
                              ) : (
                                <span className="text-slate-300">0 đ</span>
                              )}
                            </td>

                            {/* Notes and Date */}
                            <td className="py-4 px-4 text-[11px]">
                              {isPaid ? (
                                <div className="space-y-0.5">
                                  {payment.notes && <p className="text-slate-700 font-semibold italic">"{payment.notes}"</p>}
                                  <p className="text-slate-400 text-[10px] flex items-center gap-0.5">
                                    <Calendar className="w-3 h-3" /> Đã đóng
                                  </p>
                                </div>
                              ) : (
                                <span className="text-slate-300 italic">Chưa nộp tiền</span>
                              )}
                            </td>

                            {/* Custom Adjustment Dialog triggers */}
                            <td className="py-4 px-4 text-center">
                              <button
                                onClick={() => onOpenPaymentEdit(m.householdId, activeCampaign.id, paidAmount, payment?.notes || '', m.id)}
                                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-blue-600 rounded-lg transition-all cursor-pointer inline-flex items-center"
                                title="Tùy chỉnh số tiền thực tế hoặc ghi chú đóng nộp"
                              >
                                <Settings className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )
                  ) : (
                    filteredLedgerHouseholds.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-8 text-xs text-slate-400 font-bold">Không tìm thấy hộ dân phù hợp.</td>
                      </tr>
                    ) : (
                      filteredLedgerHouseholds.map(h => {
                        const payment = feePayments.find(p => p.householdId === h.id && !p.memberId && p.campaignId === activeCampaign.id);
                        const isPaid = payment?.status === 'paid';
                        const paidAmount = payment?.paidAmount || 0;
                        const defaultAmount = activeCampaign.amount;

                        return (
                          <tr key={h.id} className="hover:bg-slate-50/30 transition-colors">
                            {/* Household Name and Info */}
                            <td className="py-4 px-4">
                              <p className="font-bold text-slate-800 text-sm">{h.ownerName}</p>
                              <div className="flex gap-2 text-[10px] text-slate-400 font-bold mt-0.5 uppercase tracking-wide">
                                <span>{h.householdCode}</span>
                                <span>•</span>
                                <span className="truncate max-w-[120px]">{h.address}</span>
                              </div>
                            </td>

                            {/* Payment Status badge (Toggle handler clickable) */}
                            <td className="py-4 px-4 text-center">
                              <button
                                onClick={() => onTogglePaymentStatus(h.id, activeCampaign.id, defaultAmount)}
                                className={cn(
                                  "px-3 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest transition-all cursor-pointer flex items-center gap-1.5 mx-auto hover:scale-[1.03] active:scale-[0.97]",
                                  isPaid 
                                    ? "bg-emerald-100 text-emerald-800 border border-emerald-200" 
                                    : "bg-red-50 text-red-700 border border-red-200"
                                )}
                              >
                                {isPaid ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" /> Đã nộp
                                  </>
                                ) : (
                                  <>
                                    <X className="w-3.5 h-3.5" /> Chưa nộp
                                  </>
                                )}
                              </button>
                            </td>

                            {/* Amount */}
                            <td className="py-4 px-4 text-right font-black font-mono">
                              {isPaid ? (
                                <span className="text-emerald-600">{paidAmount.toLocaleString('vi-VN')} đ</span>
                              ) : (
                                <span className="text-slate-300">0 đ</span>
                              )}
                            </td>

                            {/* Notes and Date */}
                            <td className="py-4 px-4 text-[11px]">
                              {isPaid ? (
                                <div className="space-y-0.5">
                                  {payment.notes && <p className="text-slate-700 font-semibold italic">"{payment.notes}"</p>}
                                  <p className="text-slate-400 text-[10px] flex items-center gap-0.5">
                                    <Calendar className="w-3 h-3" /> Đã đóng
                                  </p>
                                </div>
                              ) : (
                                <span className="text-slate-300 italic">Chưa nộp tiền</span>
                              )}
                            </td>

                            {/* Custom Adjustment Dialog triggers */}
                            <td className="py-4 px-4 text-center">
                              <button
                                onClick={() => onOpenPaymentEdit(h.id, activeCampaign.id, paidAmount, payment?.notes || '')}
                                className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-blue-600 rounded-lg transition-all cursor-pointer inline-flex items-center"
                                title="Tùy chỉnh số tiền thực tế hoặc ghi chú đóng nộp"
                              >
                                <Settings className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import React from 'react';
import { motion } from 'motion/react';
import { 
  Home, 
  Users, 
  TrendingUp, 
  CreditCard, 
  Award, 
  FileText,
  Info,
  RefreshCw,
  Plus
} from 'lucide-react';
import { Household, Member, FeeCampaign, FeePayment } from '../types';
import { cn } from '../lib/utils';

interface OverviewTabProps {
  households: Household[];
  allMembers: Member[];
  feeCampaigns: FeeCampaign[];
  feePayments: FeePayment[];
  onSwitchTab: (tab: 'overview' | 'households' | 'members' | 'fees') => void;
  onSeedDatabase: () => void;
  isSeeding: boolean;
}

export default function OverviewTab({
  households,
  allMembers,
  feeCampaigns,
  feePayments,
  onSwitchTab,
  onSeedDatabase,
  isSeeding
}: OverviewTabProps) {
  const totalHouseholds = households.length;
  const totalResidents = allMembers.length;
  const averageResidents = totalHouseholds > 0 ? (totalResidents / totalHouseholds).toFixed(1) : '0';

  // Financial statistics
  const totalCollectedFunds = feePayments
    .filter(p => p.status === 'paid')
    .reduce((sum, p) => sum + p.paidAmount, 0);

  // Demographic details
  const maleCount = allMembers.filter(m => m.gender === 'Nam').length;
  const femaleCount = allMembers.filter(m => m.gender === 'Nữ').length;
  const otherCount = allMembers.filter(m => m.gender === 'Khác').length;

  const currentYear = new Date().getFullYear();
  const childrenCount = allMembers.filter(m => {
    const birthYear = parseInt(m.birthDate?.split('-')[0]);
    return birthYear && (currentYear - birthYear < 16);
  }).length;

  const eldersCount = allMembers.filter(m => {
    const birthYear = parseInt(m.birthDate?.split('-')[0]);
    return birthYear && (currentYear - birthYear >= 60);
  }).length;

  const workerCount = totalResidents - childrenCount - eldersCount;

  // Special categories list calculation (from notes)
  const categoryCounts = allMembers.reduce((acc, m) => {
    const note = m.notes ? m.notes.trim() : '';
    if (note && note !== '-' && note.toLowerCase() !== 'không') {
      acc[note] = (acc[note] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const topCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  // Campaign rates
  const campaignStats = feeCampaigns.map(c => {
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
    <div className="space-y-6">
      {/* 4 Bento Cards at Top */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => onSwitchTab('households')}
          className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md hover:border-slate-200 transition-all"
        >
          <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
            <Home className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Hộ gia đình</p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">{totalHouseholds}</h3>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
          onClick={() => onSwitchTab('members')}
          className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md hover:border-slate-200 transition-all"
        >
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng nhân khẩu</p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">{totalResidents}</h3>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4"
        >
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Bình quân hộ</p>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">
              {averageResidents} <span className="text-xs font-medium text-slate-400">người</span>
            </h3>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.15 }}
          onClick={() => onSwitchTab('fees')}
          className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 cursor-pointer hover:shadow-md hover:border-slate-200 transition-all"
        >
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <CreditCard className="w-6 h-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Quỹ đã thu nộp</p>
            <h3 className="text-lg font-black text-slate-900 mt-0.5 truncate text-amber-600">
              {totalCollectedFunds.toLocaleString('vi-VN')} <span className="text-[10px] font-bold">đ</span>
            </h3>
          </div>
        </motion.div>
      </section>

      {/* Empty State Seeding prompt */}
      {totalHouseholds === 0 && (
        <div className="bg-blue-50/40 border border-blue-100 rounded-3xl p-8 text-center space-y-4">
          <Info className="w-12 h-12 text-blue-500 mx-auto" />
          <div>
            <h3 className="text-lg font-bold text-blue-900">Chưa có dữ liệu dân cư nào!</h3>
            <p className="text-sm text-blue-700 max-w-lg mx-auto mt-1">
              Hệ thống hiện tại chưa có thông tin dân cư và đóng góp. Để trải nghiệm đầy đủ giao diện bento phân tích và quản lý thu nộp, hãy click khởi tạo dữ liệu mẫu.
            </p>
          </div>
          <button
            onClick={onSeedDatabase}
            disabled={isSeeding}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg shadow-blue-100 transition-all flex items-center gap-2 mx-auto cursor-pointer disabled:opacity-50"
          >
            {isSeeding ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
            Khởi tạo toàn bộ dữ liệu mẫu
          </button>
        </div>
      )}

      {totalHouseholds > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Demographics & Genders (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Gender Analysis Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-50">
                <Award className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-black text-slate-900">Phân Tích Cơ Cấu Giới Tính</h3>
              </div>

              <div className="space-y-4">
                {/* Horizontal Progress bar graph representation */}
                <div className="h-6 w-full rounded-full overflow-hidden flex bg-slate-100">
                  {maleCount > 0 && (
                    <div 
                      style={{ width: `${(maleCount / totalResidents) * 100}%` }} 
                      className="bg-blue-500 hover:opacity-90 transition-all"
                      title={`Nam: ${maleCount} người`}
                    />
                  )}
                  {femaleCount > 0 && (
                    <div 
                      style={{ width: `${(femaleCount / totalResidents) * 100}%` }} 
                      className="bg-pink-500 hover:opacity-90 transition-all"
                      title={`Nữ: ${femaleCount} người`}
                    />
                  )}
                  {otherCount > 0 && (
                    <div 
                      style={{ width: `${(otherCount / totalResidents) * 100}%` }} 
                      className="bg-purple-500 hover:opacity-90 transition-all"
                      title={`Khác: ${otherCount} người`}
                    />
                  )}
                </div>

                {/* Details list */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-blue-50/50 rounded-2xl border border-blue-100/20">
                    <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Nam giới</span>
                    <strong className="text-xl font-black text-blue-600 block mt-1">{maleCount}</strong>
                    <span className="text-[11px] font-bold text-slate-500">
                      {totalResidents > 0 ? ((maleCount / totalResidents) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="p-3 bg-pink-50/50 rounded-2xl border border-pink-100/20">
                    <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Nữ giới</span>
                    <strong className="text-xl font-black text-pink-600 block mt-1">{femaleCount}</strong>
                    <span className="text-[11px] font-bold text-slate-500">
                      {totalResidents > 0 ? ((femaleCount / totalResidents) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="p-3 bg-purple-50/50 rounded-2xl border border-purple-100/20">
                    <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Khác</span>
                    <strong className="text-xl font-black text-purple-600 block mt-1">{otherCount}</strong>
                    <span className="text-[11px] font-bold text-slate-500">
                      {totalResidents > 0 ? ((otherCount / totalResidents) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Age Group Analysis Card */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-50">
                <Users className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-slate-900">Phân Tích Cơ Cấu Độ Tuổi</h3>
              </div>

              <div className="space-y-4">
                {/* Kids (< 16) */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
                      Trẻ em & Thiếu niên (Dưới 16 tuổi)
                    </span>
                    <span>{childrenCount} người ({totalResidents > 0 ? ((childrenCount / totalResidents) * 100).toFixed(0) : 0}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div style={{ width: `${totalResidents > 0 ? (childrenCount / totalResidents) * 100 : 0}%` }} className="bg-cyan-400 h-full rounded-full" />
                  </div>
                </div>

                {/* Working age (16-59) */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                      Độ tuổi lao động (16 - 59 tuổi)
                    </span>
                    <span>{workerCount} người ({totalResidents > 0 ? ((workerCount / totalResidents) * 100).toFixed(0) : 0}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div style={{ width: `${totalResidents > 0 ? (workerCount / totalResidents) * 100 : 0}%` }} className="bg-emerald-500 h-full rounded-full" />
                  </div>
                </div>

                {/* Seniors (>= 60) */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
                      Người cao tuổi (Từ 60 tuổi trở lên)
                    </span>
                    <span>{eldersCount} người ({totalResidents > 0 ? ((eldersCount / totalResidents) * 100).toFixed(0) : 0}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div style={{ width: `${totalResidents > 0 ? (eldersCount / totalResidents) * 100 : 0}%` }} className="bg-amber-500 h-full rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Special resident categories & Financial summaries (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Special resident categories */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-50">
                <FileText className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-black text-slate-900">Diện Cư Dân Đặc Biệt (Ghi Chú)</h3>
              </div>

              {topCategories.length === 0 ? (
                <p className="text-xs text-slate-400 font-medium py-2">Chưa có thống kê ghi chú/diện đặc biệt.</p>
              ) : (
                <div className="space-y-3.5">
                  {topCategories.map(([cat, count], idx) => {
                    const percent = totalResidents > 0 ? (count / totalResidents) * 100 : 0;
                    return (
                      <div key={cat} className="space-y-1">
                        <div className="flex justify-between items-center text-xs font-semibold">
                          <span className="text-slate-700 truncate max-w-[180px]">{idx + 1}. {cat}</span>
                          <span className="text-slate-500 font-bold shrink-0">{count} nhân khẩu ({percent.toFixed(0)}%)</span>
                        </div>
                        <div className="w-full bg-slate-50 h-1.5 rounded-full overflow-hidden">
                          <div style={{ width: `${percent}%` }} className="bg-indigo-500 h-full rounded-full" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Contribution Progress report */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2 pb-1 border-b border-slate-50">
                <CreditCard className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-black text-slate-900">Tiến Độ Thu Đóng Góp</h3>
              </div>

              {campaignStats.length === 0 ? (
                <p className="text-xs text-slate-400 font-medium py-2">Chưa có quỹ/khoản thu nộp nào được thiết lập.</p>
              ) : (
                <div className="space-y-4">
                  {campaignStats.slice(0, 3).map(c => {
                    return (
                      <div key={c.id} className="space-y-1.5">
                        <div className="flex justify-between text-xs font-semibold">
                          <span className="text-slate-700 truncate max-w-[200px]" title={c.title}>{c.title}</span>
                          <span className="text-slate-500 font-bold shrink-0">{c.completionRate.toFixed(0)}%</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div 
                            style={{ width: `${c.completionRate}%` }} 
                            className={cn(
                              "h-full rounded-full",
                              c.completionRate >= 80 ? "bg-emerald-500" : c.completionRate >= 40 ? "bg-amber-500" : "bg-red-500"
                            )}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] font-medium text-slate-400">
                          <span>Đã nộp: {c.paidCount}/{totalHouseholds} hộ</span>
                          <span>Thu: {c.totalCollected.toLocaleString('vi-VN')} đ</span>
                        </div>
                      </div>
                    );
                  })}
                  {campaignStats.length > 3 && (
                    <button 
                      onClick={() => onSwitchTab('fees')}
                      className="text-center w-full block text-xs font-bold text-blue-600 hover:text-blue-700 pt-2 border-t border-slate-50"
                    >
                      Xem tất cả {campaignStats.length} quỹ thu nộp...
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

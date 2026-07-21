import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LogIn, 
  LogOut, 
  RefreshCw, 
  User as UserIcon,
  Home,
  Check,
  X,
  Plus,
  Settings,
  ArrowLeft,
  Trash2,
  Tag,
  Sparkles,
  Search,
  Phone,
  MapPin,
  FileText,
  Users,
  Info,
  Calendar,
  Shield,
  CreditCard,
  Briefcase,
  TrendingUp,
  Award,
  AlertTriangle
} from 'lucide-react';
import { auth, db, signInWithGoogle, logOut, handleFirestoreError, OperationType } from './lib/firebase.ts';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  getDocs,
  setDoc, 
  updateDoc, 
  collection, 
  onSnapshot, 
  query, 
  addDoc, 
  deleteDoc, 
  serverTimestamp,
  collectionGroup
} from 'firebase/firestore';
import { Household, Member, RELATIONSHIPS, GENDERS, BASIC_HOUSEHOLDS, BASIC_MEMBERS } from './types';
import { generateHouseholdAnalysis } from './services/geminiService';
import { cn } from './lib/utils.ts';

enum AppState {
  LOADING,
  UNAUTHENTICATED,
  DASHBOARD
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [appState, setAppState] = useState<AppState>(AppState.LOADING);
  
  // Data State
  const [households, setHouseholds] = useState<Household[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string | null>(null);
  const [selectedHouseholdMembers, setSelectedHouseholdMembers] = useState<Member[]>([]);
  const [isSeeding, setIsSeeding] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGender, setFilterGender] = useState<string>('All');
  const [filterOccupation, setFilterOccupation] = useState<string>('All');

  // Form states for Household
  const [showHouseholdModal, setShowHouseholdModal] = useState(false);
  const [editingHouseholdId, setEditingHouseholdId] = useState<string | null>(null);
  const [hCode, setHCode] = useState('');
  const [hOwner, setHOwner] = useState('');
  const [hAddress, setHAddress] = useState('');
  const [hPhone, setHPhone] = useState('');
  const [hNotes, setHNotes] = useState('');
  const [isSavingHousehold, setIsSavingHousehold] = useState(false);

  // Form states for Member
  const [showMemberForm, setShowMemberForm] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [mName, setMName] = useState('');
  const [mRelation, setMRelation] = useState('Chủ hộ');
  const [mBirth, setMBirth] = useState('');
  const [mGender, setMGender] = useState<'Nam' | 'Nữ' | 'Khác'>('Nam');
  const [mIdCard, setMIdCard] = useState('');
  const [mOccupation, setMOccupation] = useState('');
  const [mPhone, setMPhone] = useState('');
  const [mAddress, setMAddress] = useState('');
  const [mNotes, setMNotes] = useState('');
  const [isSavingMember, setIsSavingMember] = useState(false);

  // Custom Delete Confirmation State
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'household' | 'member';
    householdId: string;
    memberId?: string;
    name: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // AI Assistant State
  const [aiAnalysis, setAiAnalysis] = useState<{ suggestedNotes: string; tags: string[] } | null>(null);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // 1. Auth Listener
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setAppState(AppState.UNAUTHENTICATED);
        setIsAdminUser(false);
        setHouseholds([]);
        setAllMembers([]);
        setSelectedHouseholdId(null);
      }
    });
    return () => unsubAuth();
  }, []);

  // 2. Main Data Listeners
  useEffect(() => {
    if (!user) return;

    let unsubHouseholds: () => void = () => {};
    let unsubMembers: () => void = () => {};

    const setupListeners = async () => {
      try {
        // Check Admin Status
        const adminDoc = await getDoc(doc(db, 'admins', user.uid));
        const isEmailAdmin = user.email === 'nguyencam94@gmail.com';
        setIsAdminUser(adminDoc.exists() || isEmailAdmin);

        // Real-time Households Listener
        const householdsQuery = query(collection(db, 'households'));
        unsubHouseholds = onSnapshot(householdsQuery, (snapshot) => {
          const list: Household[] = [];
          snapshot.forEach(doc => {
            list.push({ id: doc.id, ...doc.data() } as Household);
          });
          setHouseholds(list);
          setAppState(AppState.DASHBOARD);
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'households'));

        // Real-time ALL Members Listener (Collection Group)
        const allMembersQuery = query(collectionGroup(db, 'members'));
        unsubMembers = onSnapshot(allMembersQuery, (snapshot) => {
          const list: Member[] = [];
          snapshot.forEach(doc => {
            list.push({ id: doc.id, ...doc.data() } as Member);
          });
          setAllMembers(list);
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'members'));

      } catch (error) {
        console.error('Error setting up data listeners:', error);
      }
    };

    setupListeners();
    return () => {
      unsubHouseholds();
      unsubMembers();
    };
  }, [user]);

  // 3. Listener for selected Household Members
  useEffect(() => {
    if (!selectedHouseholdId || !user) {
      setSelectedHouseholdMembers([]);
      return;
    }

    const membersPath = `households/${selectedHouseholdId}/members`;
    const unsubSelectedMembers = onSnapshot(
      collection(db, membersPath),
      (snapshot) => {
        const list: Member[] = [];
        snapshot.forEach(doc => {
          list.push({ id: doc.id, ...doc.data() } as Member);
        });
        // Sort with head of household first
        list.sort((a, b) => {
          if (a.relationship === 'Chủ hộ') return -1;
          if (b.relationship === 'Chủ hộ') return 1;
          return a.fullName.localeCompare(b.fullName);
        });
        setSelectedHouseholdMembers(list);
        setAiAnalysis(null); // Clear previous AI tips when household changes
        setAiError(null);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, membersPath)
    );

    return () => unsubSelectedMembers();
  }, [selectedHouseholdId, user]);

  // 4. Automated Database Seeding
  const handleSeedDatabase = async () => {
    if (isSeeding) return;
    setIsSeeding(true);
    try {
      for (const h of BASIC_HOUSEHOLDS) {
        // Create household
        const hRef = doc(collection(db, 'households'));
        const hData = {
          householdCode: h.householdCode,
          ownerName: h.ownerName,
          address: h.address,
          phone: h.phone,
          notes: h.notes,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        await setDoc(hRef, hData);

        // Filter and create members
        const hMembers = BASIC_MEMBERS.filter(m => m.householdId === h.id);
        for (const m of hMembers) {
          const mRef = doc(collection(db, `households/${hRef.id}/members`));
          const mData = {
            householdId: hRef.id,
            fullName: m.fullName,
            relationship: m.relationship,
            birthDate: m.birthDate,
            gender: m.gender,
            idCard: m.idCard,
            occupation: m.occupation,
            phone: m.phone || '',
            address: m.address || h.address || '',
            notes: m.notes || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          await setDoc(mRef, mData);
        }
      }
      alert('Đã khởi tạo dữ liệu mẫu thành công!');
    } catch (error) {
      console.error('Error seeding database:', error);
      alert('Không thể tạo dữ liệu mẫu. Chi tiết: ' + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsSeeding(false);
    }
  };

  // 5. Create / Update Household
  const handleSaveHousehold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingHousehold) return;

    if (!hCode.trim() || !hOwner.trim() || !hAddress.trim() || !hPhone.trim()) {
      alert('Vui lòng điền đầy đủ các thông tin bắt buộc.');
      return;
    }

    setIsSavingHousehold(true);
    const path = 'households';
    try {
      const data = {
        householdCode: hCode.trim(),
        ownerName: hOwner.trim(),
        address: hAddress.trim(),
        phone: hPhone.trim(),
        notes: hNotes.trim(),
        updatedAt: serverTimestamp()
      };

      if (editingHouseholdId) {
        await updateDoc(doc(db, path, editingHouseholdId), data);
        alert('Cập nhật hộ khẩu thành công!');
      } else {
        const docRef = await addDoc(collection(db, path), {
          ...data,
          createdAt: serverTimestamp()
        });
        setSelectedHouseholdId(docRef.id);
        alert('Thêm hộ khẩu mới thành công!');
      }
      resetHouseholdForm();
    } catch (error) {
      handleFirestoreError(error, editingHouseholdId ? OperationType.UPDATE : OperationType.CREATE, path);
    } finally {
      setIsSavingHousehold(false);
    }
  };

  const handleEditHouseholdClick = (h: Household) => {
    setEditingHouseholdId(h.id);
    setHCode(h.householdCode);
    setHOwner(h.ownerName);
    setHAddress(h.address);
    setHPhone(h.phone);
    setHNotes(h.notes);
    setShowHouseholdModal(true);
  };

  const handleDeleteHousehold = (id: string, name: string) => {
    setDeleteTarget({
      type: 'household',
      householdId: id,
      name: name
    });
  };

  const executeDelete = async () => {
    if (!deleteTarget || isDeleting) return;

    setIsDeleting(true);
    try {
      if (deleteTarget.type === 'household') {
        const id = deleteTarget.householdId;
        // Delete sub-members first by querying the subcollection directly
        const membersSnapshot = await getDocs(collection(db, 'households', id, 'members'));
        for (const docObj of membersSnapshot.docs) {
          await deleteDoc(doc(db, `households/${id}/members`, docObj.id));
        }
        
        // Delete Household itself
        await deleteDoc(doc(db, 'households', id));
        if (selectedHouseholdId === id) {
          setSelectedHouseholdId(null);
        }
      } else if (deleteTarget.type === 'member') {
        const id = deleteTarget.householdId;
        const mId = deleteTarget.memberId!;
        const path = `households/${id}/members/${mId}`;
        await deleteDoc(doc(db, path));
      }
      setDeleteTarget(null);
    } catch (error) {
      const path = deleteTarget.type === 'household' 
        ? `households/${deleteTarget.householdId}` 
        : `households/${deleteTarget.householdId}/members/${deleteTarget.memberId}`;
      handleFirestoreError(error, OperationType.DELETE, path);
    } finally {
      setIsDeleting(false);
    }
  };

  const resetHouseholdForm = () => {
    setEditingHouseholdId(null);
    setHCode('');
    setHOwner('');
    setHAddress('');
    setHPhone('');
    setHNotes('');
    setShowHouseholdModal(false);
  };

  // 6. Create / Update Member
  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHouseholdId || isSavingMember) return;

    if (!mName.trim() || !mRelation.trim() || !mBirth.trim() || !mOccupation.trim()) {
      alert('Vui lòng điền đầy đủ thông tin nhân khẩu.');
      return;
    }

    setIsSavingMember(true);
    const membersPath = `households/${selectedHouseholdId}/members`;
    try {
      const data = {
        householdId: selectedHouseholdId,
        fullName: mName.trim(),
        relationship: mRelation,
        birthDate: mBirth,
        gender: mGender,
        idCard: mIdCard.trim(),
        occupation: mOccupation.trim(),
        phone: mPhone.trim(),
        address: mAddress.trim(),
        notes: mNotes.trim(),
        updatedAt: serverTimestamp()
      };

      if (editingMemberId) {
        await updateDoc(doc(db, membersPath, editingMemberId), data);
        alert('Cập nhật nhân khẩu thành công!');
      } else {
        await addDoc(collection(db, membersPath), {
          ...data,
          createdAt: serverTimestamp()
        });
        alert('Thêm nhân khẩu thành công!');
      }
      resetMemberForm();
    } catch (error) {
      handleFirestoreError(error, editingMemberId ? OperationType.UPDATE : OperationType.CREATE, membersPath);
    } finally {
      setIsSavingMember(false);
    }
  };

  const handleEditMemberClick = (m: Member) => {
    setEditingMemberId(m.id);
    setMName(m.fullName);
    setMRelation(m.relationship);
    setMBirth(m.birthDate);
    setMGender(m.gender);
    setMIdCard(m.idCard);
    setMOccupation(m.occupation);
    setMPhone(m.phone || '');
    setMAddress(m.address || '');
    setMNotes(m.notes || '');
    setShowMemberForm(true);
  };

  const handleDeleteMember = (mId: string, name: string, hId?: string) => {
    const householdId = hId || selectedHouseholdId;
    if (!householdId) {
      alert('Không tìm thấy ID hộ gia đình tương ứng.');
      return;
    }
    setDeleteTarget({
      type: 'member',
      householdId: householdId,
      memberId: mId,
      name: name
    });
  };

  const resetMemberForm = () => {
    setEditingMemberId(null);
    setMName('');
    setMRelation('Con trai');
    setMBirth('');
    setMGender('Nam');
    setMIdCard('');
    setMOccupation('');
    setMPhone('');
    setMAddress('');
    setMNotes('');
    setShowMemberForm(false);
  };

  // 7. AI Analysis & Advisory Helper
  const handleAiAnalyze = async () => {
    const activeHousehold = households.find(h => h.id === selectedHouseholdId);
    if (!activeHousehold) return;

    setIsAiAnalyzing(true);
    setAiError(null);
    try {
      const result = await generateHouseholdAnalysis(
        activeHousehold.ownerName,
        activeHousehold.address,
        selectedHouseholdMembers.map(m => ({
          fullName: m.fullName,
          relationship: m.relationship,
          birthDate: m.birthDate,
          gender: m.gender,
          occupation: m.occupation
        })),
        activeHousehold.notes
      );
      setAiAnalysis(result);
    } catch (error) {
      console.error('AI analysis failure:', error);
      setAiError('Có lỗi xảy ra khi trợ lý AI đang phân tích dữ liệu. Vui lòng thử lại sau.');
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  const handleApplyAiNotes = async () => {
    if (!selectedHouseholdId || !aiAnalysis) return;
    const path = `households/${selectedHouseholdId}`;
    try {
      await updateDoc(doc(db, 'households', selectedHouseholdId), {
        notes: aiAnalysis.suggestedNotes,
        updatedAt: serverTimestamp()
      });
      // Update local state to show updated note instantly
      setHouseholds(prev => prev.map(h => h.id === selectedHouseholdId ? { ...h, notes: aiAnalysis.suggestedNotes } : h));
      alert('Đã lưu và cập nhật ghi chú đề xuất của AI thành công!');
      setAiAnalysis(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  // 8. Filters & Search logic
  const filteredHouseholds = households.filter(h => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;

    // Search inside household attributes
    const matchH = h.ownerName.toLowerCase().includes(q) ||
                   h.householdCode.toLowerCase().includes(q) ||
                   h.address.toLowerCase().includes(q) ||
                   h.phone.includes(q);

    if (matchH) return true;

    // Search inside this household's members
    const hMembers = allMembers.filter(m => m.householdId === h.id);
    return hMembers.some(m => 
      m.fullName.toLowerCase().includes(q) ||
      m.idCard.includes(q) ||
      m.occupation.toLowerCase().includes(q)
    );
  });

  // Calculate statistics from loaded dataset
  const totalHouseholds = households.length;
  const totalResidents = allMembers.length;
  const averageResidents = totalHouseholds > 0 ? (totalResidents / totalHouseholds).toFixed(1) : '0';
  const maleCount = allMembers.filter(m => m.gender === 'Nam').length;
  const femaleCount = allMembers.filter(m => m.gender === 'Nữ').length;
  const otherGenderCount = allMembers.filter(m => m.gender === 'Khác').length;

  // Age group stats
  const currentYear = new Date().getFullYear();
  const childrenCount = allMembers.filter(m => {
    const birthYear = parseInt(m.birthDate.split('-')[0]);
    return birthYear && (currentYear - birthYear < 16);
  }).length;
  const eldersCount = allMembers.filter(m => {
    const birthYear = parseInt(m.birthDate.split('-')[0]);
    return birthYear && (currentYear - birthYear >= 60);
  }).length;

  // Selected Household Object
  const activeHousehold = households.find(h => h.id === selectedHouseholdId);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 selection:bg-blue-500 selection:text-white">
      {/* 1. LOADING SCREEN */}
      {appState === AppState.LOADING && (
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-900 text-white gap-4">
          <RefreshCw className="w-10 h-10 animate-spin text-blue-500" />
          <p className="font-medium text-slate-400 animate-pulse">Đang tải cơ sở dữ liệu cư dân...</p>
        </div>
      )}

      {/* 2. UNAUTHENTICATED SCREEN */}
      {appState === AppState.UNAUTHENTICATED && (
        <div className="flex min-h-screen items-center justify-center bg-slate-900 px-6 py-12">
          <div className="w-full max-w-md space-y-8 bg-slate-800 p-8 rounded-3xl border border-slate-700 shadow-2xl text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-400">
              <Home className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-3xl font-black tracking-tight text-white">Quản lý Cư dân</h2>
              <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                Hệ thống quản lý hộ khẩu, nhân khẩu và phân tích an sinh khu dân cư hiện đại. Hỗ trợ dữ liệu thời gian thực và trợ lý trí tuệ nhân tạo.
              </p>
            </div>
            <button
              onClick={signInWithGoogle}
              className="w-full flex items-center justify-center gap-3 bg-white hover:bg-slate-50 text-slate-900 font-bold py-4 px-4 rounded-2xl transition-all shadow-lg cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <LogIn className="w-5 h-5 text-blue-600" />
              Đăng nhập bằng Google
            </button>
            <div className="text-xs text-slate-500 pt-4 border-t border-slate-700/50">
              Hệ thống thuộc an ninh nội bộ. Vui lòng đăng nhập để tiếp tục.
            </div>
          </div>
        </div>
      )}

      {/* 3. DASHBOARD MAIN */}
      {appState === AppState.DASHBOARD && user && (
        <div className="min-h-screen flex flex-col">
          {/* HEADER BAR */}
          <header className="bg-white border-b border-slate-100 px-6 py-4 sticky top-0 z-40 shadow-sm">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-600 rounded-2xl text-white shadow-md shadow-blue-100">
                  <Home className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl font-black tracking-tight text-slate-900">Ban Quản Lý Khu Dân Cư</h1>
                  <p className="text-xs text-slate-400 uppercase font-bold tracking-widest">Hệ thống Số hóa & An sinh Xã hội</p>
                </div>
              </div>

              {/* User Actions */}
              <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                {isAdminUser && (
                  <span className="bg-amber-50 text-amber-600 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 border border-amber-100">
                    <Shield className="w-3.5 h-3.5" /> Quản trị viên
                  </span>
                )}
                <div className="flex items-center gap-2 bg-slate-50 pl-3 pr-1.5 py-1.5 rounded-2xl border border-slate-100">
                  <span className="text-xs font-bold text-slate-700">{user.displayName || user.email}</span>
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="avatar" className="w-7 h-7 rounded-full object-cover border border-slate-200" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-black">
                      {user.displayName?.charAt(0) || 'U'}
                    </div>
                  )}
                </div>
                <button
                  onClick={logOut}
                  title="Đăng xuất"
                  className="p-3 bg-red-50 hover:bg-red-100 text-red-500 rounded-2xl transition-all cursor-pointer"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </header>

          {/* MAIN CONTAINER */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 md:py-8 space-y-6">
            
            {/* STATS OVERVIEW PANEL (Bento Grid) */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4"
              >
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  <Home className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng số hộ khẩu</p>
                  <h3 className="text-2xl font-black text-slate-900 mt-0.5">{totalHouseholds}</h3>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 }}
                className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4"
              >
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tổng số nhân khẩu</p>
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
                  <h3 className="text-2xl font-black text-slate-900 mt-0.5">{averageResidents} <span className="text-xs font-medium text-slate-400">người</span></h3>
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.15 }}
                className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 col-span-2 md:col-span-1"
              >
                <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
                  <Award className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Cơ cấu dân tộc/độ tuổi</p>
                  <div className="flex gap-2 mt-1 text-[11px] font-semibold text-slate-600">
                    <span className="bg-purple-50 px-1.5 py-0.5 rounded text-purple-700">Nam: {maleCount}</span>
                    <span className="bg-pink-50 px-1.5 py-0.5 rounded text-pink-700">Nữ: {femaleCount}</span>
                    <span className="bg-blue-50 px-1.5 py-0.5 rounded text-blue-700">Trẻ em: {childrenCount}</span>
                  </div>
                </div>
              </motion.div>
            </section>

            {/* SEED ACTION FOR EMPTY STATE */}
            {totalHouseholds === 0 && (
              <div className="bg-blue-50/50 border border-blue-100 rounded-3xl p-8 text-center space-y-4">
                <Info className="w-12 h-12 text-blue-500 mx-auto" />
                <div>
                  <h3 className="text-lg font-bold text-blue-900">Chào mừng đến với Quản lý Cư dân!</h3>
                  <p className="text-sm text-blue-700 max-w-lg mx-auto mt-1">
                    Cơ sở dữ liệu của bạn hiện chưa có thông tin hộ gia đình nào. Hãy thêm hộ gia đình đầu tiên để bắt đầu quản lý cư dân của bạn.
                  </p>
                </div>
                <button
                  onClick={() => {
                    resetHouseholdForm();
                    setShowHouseholdModal(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-2xl shadow-lg shadow-blue-100 transition-all flex items-center gap-2 mx-auto cursor-pointer"
                >
                  <Plus className="w-5 h-5" />
                  Thêm Hộ Gia Đình
                </button>
              </div>
            )}

            {/* SPLIT LAYOUT DASHBOARD */}
            {totalHouseholds > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* LEFT SIDE: HOUSEHOLDS LIST (5 cols) */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-bold text-slate-900">Danh Sách Hộ Gia Đình</h3>
                      <button
                        onClick={() => {
                          resetHouseholdForm();
                          setShowHouseholdModal(true);
                        }}
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
                        onChange={(e) => setSearchQuery(e.target.value)}
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
                            layoutId={`household-card-${h.id}`}
                            onClick={() => setSelectedHouseholdId(h.id)}
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
                                      handleEditHouseholdClick(h);
                                    }}
                                    className="p-1 hover:bg-slate-100 text-slate-500 hover:text-blue-600 rounded-lg transition-all cursor-pointer"
                                    title="Sửa hộ khẩu"
                                  >
                                    <Settings className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteHousehold(h.id, h.ownerName);
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
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Phổ biến nghề nghiệp cư dân</h4>
                          <div className="flex flex-wrap gap-2">
                            {Array.from(new Set(allMembers.map(m => m.occupation).filter(Boolean))).slice(0, 8).map(occ => {
                              const count = allMembers.filter(m => m.occupation === occ).length;
                              return (
                                <span key={occ} className="bg-slate-50 border border-slate-100 text-slate-600 px-3 py-1.5 rounded-xl text-xs font-semibold">
                                  {occ}: <strong className="text-slate-800">{count}</strong>
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
                                  onClick={() => handleEditHouseholdClick(activeHousehold)}
                                  className="bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold py-2 px-3.5 rounded-xl border border-slate-150 transition-all flex items-center gap-1 cursor-pointer"
                                >
                                  <Settings className="w-4 h-4 text-slate-500" /> Sửa hộ
                                </button>
                                <button
                                  onClick={() => handleDeleteHousehold(activeHousehold.id, activeHousehold.ownerName)}
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
                                onClick={handleAiAnalyze}
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
                                    {aiAnalysis.tags.map(t => (
                                      <span key={t} className="bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2 py-1 rounded-lg text-[10px] font-bold">
                                        #{t}
                                      </span>
                                    ))}
                                  </div>
                                </div>

                                <div className="pt-2 flex justify-end">
                                  <button
                                    onClick={handleApplyAiNotes}
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
                                    setEditingMemberId(null);
                                    setMName('');
                                    setMRelation('Chủ hộ');
                                    setMBirth('');
                                    setMGender('Nam');
                                    setMIdCard('');
                                    setMOccupation('');
                                    setMPhone('');
                                    setShowMemberForm(true);
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
                                onSubmit={handleSaveMember}
                                className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4"
                              >
                                <div className="flex justify-between items-center pb-2 border-b border-slate-200/50">
                                  <h4 className="text-sm font-bold text-slate-800">
                                    {editingMemberId ? 'Sửa Nhân Khẩu' : 'Thêm Nhân Khẩu Mới'}
                                  </h4>
                                  <button
                                    type="button"
                                    onClick={() => setShowMemberForm(false)}
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
                                      onChange={(e) => setMName(e.target.value)}
                                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Quan hệ với chủ hộ *</label>
                                    <select
                                      required
                                      value={mRelation}
                                      onChange={(e) => setMRelation(e.target.value)}
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
                                      onChange={(e) => setMBirth(e.target.value)}
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
                                          onClick={() => setMGender(g)}
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
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Số CCCD / CMND</label>
                                    <input
                                      type="text"
                                      placeholder="Ví dụ: 001078001234"
                                      value={mIdCard}
                                      onChange={(e) => setMIdCard(e.target.value)}
                                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Nghề nghiệp *</label>
                                    <input
                                      required
                                      type="text"
                                      placeholder="Ví dụ: Học sinh, Kế toán..."
                                      value={mOccupation}
                                      onChange={(e) => setMOccupation(e.target.value)}
                                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                  </div>

                                  <div className="md:col-span-2">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Số điện thoại riêng (nếu có)</label>
                                    <input
                                      type="text"
                                      placeholder="Ví dụ: 0912xxxxxx"
                                      value={mPhone}
                                      onChange={(e) => setMPhone(e.target.value)}
                                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                  </div>

                                  <div className="md:col-span-2">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Địa chỉ thường trú / cư trú của nhân khẩu</label>
                                    <input
                                      type="text"
                                      placeholder="Nhập địa chỉ cư trú riêng (bỏ trống nếu trùng với địa chỉ hộ khẩu)"
                                      value={mAddress}
                                      onChange={(e) => setMAddress(e.target.value)}
                                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                  </div>

                                  <div className="md:col-span-2">
                                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Ghi chú riêng cho nhân khẩu</label>
                                    <textarea
                                      rows={2}
                                      placeholder="Ví dụ: Đảng viên, Tiền sử dị ứng vắc-xin, Sinh viên giỏi..."
                                      value={mNotes}
                                      onChange={(e) => setMNotes(e.target.value)}
                                      className="w-full px-3 py-2 bg-white rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                                    />
                                  </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                  <button
                                    type="button"
                                    onClick={resetMemberForm}
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
                                  // Calculate age
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
                                          {m.idCard && (
                                            <span className="flex items-center gap-1 shrink-0 col-span-2 md:col-span-1"><CreditCard className="w-3 h-3 text-slate-400" /> CCCD: {m.idCard}</span>
                                          )}
                                          <span className="flex items-center gap-1 shrink-0"><Briefcase className="w-3 h-3 text-slate-400" /> {m.occupation}</span>
                                        </div>

                                        {/* Address & Notes Display for each Member */}
                                        {(m.address || m.notes) && (
                                          <div className="pt-2 mt-2 border-t border-slate-200/50 space-y-1.5">
                                            {m.address && (
                                              <p className="text-[11px] text-slate-500 flex items-start gap-1.5 leading-relaxed">
                                                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                                                <span><strong className="text-slate-700 font-bold">Địa chỉ:</strong> {m.address}</span>
                                              </p>
                                            )}
                                            {m.notes && (
                                              <p className="text-[11px] text-slate-600 flex items-start gap-1.5 leading-relaxed bg-slate-100/50 p-2 rounded-xl border border-slate-200/20">
                                                <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                                                <span><strong className="text-slate-700 font-bold">Ghi chú:</strong> {m.notes}</span>
                                              </p>
                                            )}
                                          </div>
                                        )}
                                      </div>

                                      {/* Actions */}
                                      <div className="flex items-center gap-1.5 md:opacity-0 group-hover:opacity-100 transition-opacity justify-end border-t md:border-none pt-2 md:pt-0 border-slate-200/50">
                                        <button
                                          onClick={() => handleEditMemberClick(m)}
                                          className="p-1.5 hover:bg-slate-200 text-slate-500 hover:text-blue-600 rounded-lg transition-all cursor-pointer"
                                          title="Sửa nhân khẩu"
                                        >
                                          <Settings className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteMember(m.id, m.fullName, m.householdId)}
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
            )}
          </main>

          {/* FOOTER */}
          <footer className="bg-white border-t border-slate-100 py-6 mt-12 text-center text-xs text-slate-400 font-semibold tracking-wider">
            HỆ THỐNG QUẢN LÝ DÂN CƯ SỐ HOÁ & TRỢ LÝ AI © 2026
          </footer>
        </div>
      )}

      {/* 4. HOUSEHOLD MODAL */}
      <AnimatePresence>
        {showHouseholdModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 p-6 md:p-8 space-y-6 overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                <h3 className="text-xl font-black text-slate-900">
                  {editingHouseholdId ? 'Cập Nhật Sổ Hộ Khẩu' : 'Thêm Sổ Hộ Khẩu Mới'}
                </h3>
                <button
                  onClick={resetHouseholdForm}
                  className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveHousehold} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">Mã số Hộ khẩu / Số sổ *</label>
                  <input
                    required
                    type="text"
                    placeholder="Ví dụ: HK-2041"
                    value={hCode}
                    onChange={(e) => setHCode(e.target.value)}
                    className="w-full p-3.5 bg-slate-50 border-none rounded-2xl font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">Họ tên chủ hộ *</label>
                  <input
                    required
                    type="text"
                    placeholder="Ví dụ: Nguyễn Văn Hùng"
                    value={hOwner}
                    onChange={(e) => setHOwner(e.target.value)}
                    className="w-full p-3.5 bg-slate-50 border-none rounded-2xl font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">Địa chỉ căn hộ / nhà riêng *</label>
                  <input
                    required
                    type="text"
                    placeholder="Ví dụ: Căn hộ 1205, Tòa A1, Khu đô thị An Bình"
                    value={hAddress}
                    onChange={(e) => setHAddress(e.target.value)}
                    className="w-full p-3.5 bg-slate-50 border-none rounded-2xl font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">Số điện thoại liên hệ *</label>
                  <input
                    required
                    type="text"
                    placeholder="Ví dụ: 0912345678"
                    value={hPhone}
                    onChange={(e) => setHPhone(e.target.value)}
                    className="w-full p-3.5 bg-slate-50 border-none rounded-2xl font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-1.5">Ghi chú chi tiết</label>
                  <textarea
                    placeholder="Ví dụ: Gia đình văn hóa tiêu biểu, có người cao tuổi cần quan tâm, v.v."
                    value={hNotes}
                    onChange={(e) => setHNotes(e.target.value)}
                    rows={4}
                    className="w-full p-3.5 bg-slate-50 border-none rounded-2xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={resetHouseholdForm}
                    className="flex-1 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingHousehold}
                    className="flex-1 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-blue-100"
                  >
                    {isSavingHousehold ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                    {editingHouseholdId ? 'Lưu cập nhật' : 'Tạo mới hộ khẩu'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. CUSTOM CONFIRMATION MODAL */}
      <AnimatePresence>
        {deleteTarget && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 p-6 md:p-8 text-center space-y-6"
            >
              <div className="mx-auto w-14 h-14 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-slate-900">
                  Xác nhận xóa dữ liệu
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  {deleteTarget.type === 'household' ? (
                    <span>
                      Bạn có chắc chắn muốn xóa hộ gia đình của chủ hộ <strong className="text-slate-800 font-bold">{deleteTarget.name}</strong> cùng toàn bộ nhân khẩu bên trong không? Thao tác này sẽ <strong className="text-red-500 font-bold">không thể khôi phục</strong>.
                    </span>
                  ) : (
                    <span>
                      Bạn có chắc chắn muốn xóa nhân khẩu <strong className="text-slate-800 font-bold">{deleteTarget.name}</strong> khỏi hộ gia đình này không? Thao tác này sẽ <strong className="text-red-500 font-bold">không thể khôi phục</strong>.
                    </span>
                  )}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setDeleteTarget(null)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-2xl transition-all cursor-pointer disabled:opacity-50"
                >
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={executeDelete}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-red-100 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  Đồng ý xóa
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

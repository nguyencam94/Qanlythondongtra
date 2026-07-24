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
import { Household, Member, RELATIONSHIPS, GENDERS, BASIC_HOUSEHOLDS, BASIC_MEMBERS, FeeCampaign, FeePayment, BASIC_CAMPAIGNS } from './types';
import { generateHouseholdAnalysis } from './services/geminiService';
import { cn } from './lib/utils.ts';
import OverviewTab from './components/OverviewTab';
import HouseholdsTab from './components/HouseholdsTab';
import MembersTab from './components/MembersTab';
import FeesTab from './components/FeesTab';

enum AppState {
  LOADING,
  UNAUTHENTICATED,
  DASHBOARD
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [appState, setAppState] = useState<AppState>(AppState.LOADING);
  
  // Navigation State
  const [activeTab, setActiveTab] = useState<'overview' | 'households' | 'members' | 'fees'>('overview');

  // Data State
  const [households, setHouseholds] = useState<Household[]>([]);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [feeCampaigns, setFeeCampaigns] = useState<FeeCampaign[]>([]);
  const [feePayments, setFeePayments] = useState<FeePayment[]>([]);

  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string | null>(null);
  const [selectedHouseholdMembers, setSelectedHouseholdMembers] = useState<Member[]>([]);
  const [isSeeding, setIsSeeding] = useState(false);

  // Selected Campaign State (for Quản lý thu nộp)
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGender, setFilterGender] = useState<string>('All');
  const [filterRelationship, setFilterRelationship] = useState<string>('All');
  const [filterAgeGroup, setFilterAgeGroup] = useState<string>('All');

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
  const [mHouseholdId, setMHouseholdId] = useState(''); // When adding a member globally
  const [mName, setMName] = useState('');
  const [mRelation, setMRelation] = useState('Chủ hộ');
  const [mBirth, setMBirth] = useState('');
  const [mGender, setMGender] = useState<'Nam' | 'Nữ' | 'Khác'>('Nam');
  const [mResidenceStatus, setMResidenceStatus] = useState<'Có mặt tại địa phương' | 'Đi làm ăn xa' | 'Đã mất'>('Có mặt tại địa phương');
  const [mPhone, setMPhone] = useState('');
  const [mAddress, setMAddress] = useState('');
  const [mNotes, setMNotes] = useState('');
  const [isSavingMember, setIsSavingMember] = useState(false);

  // Form states for Fee Campaign
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [camTitle, setCamTitle] = useState('');
  const [camDesc, setCamDesc] = useState('');
  const [camType, setCamType] = useState<'mandatory' | 'voluntary'>('mandatory');
  const [camAmount, setCamAmount] = useState('0');
  const [isSavingCampaign, setIsSavingCampaign] = useState(false);

  // Form states for Recording Payment
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [payHouseholdId, setPayHouseholdId] = useState('');
  const [payCampaignId, setPayCampaignId] = useState('');
  const [payMemberId, setPayMemberId] = useState('');
  const [payAmount, setPayAmount] = useState('0');
  const [payNotes, setPayNotes] = useState('');
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  // Custom Delete Confirmation State
  const [deleteTarget, setDeleteTarget] = useState<{
    type: 'household' | 'member' | 'campaign';
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
    let unsubCampaigns: () => void = () => {};
    let unsubPayments: () => void = () => {};

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

        // Real-time Fee Campaigns Listener
        const campaignsQuery = query(collection(db, 'fee_campaigns'));
        unsubCampaigns = onSnapshot(campaignsQuery, (snapshot) => {
          const list: FeeCampaign[] = [];
          snapshot.forEach(doc => {
            list.push({ id: doc.id, ...doc.data() } as FeeCampaign);
          });
          setFeeCampaigns(list);
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'fee_campaigns'));

        // Real-time Fee Payments Listener
        const paymentsQuery = query(collection(db, 'fee_payments'));
        unsubPayments = onSnapshot(paymentsQuery, (snapshot) => {
          const list: FeePayment[] = [];
          snapshot.forEach(doc => {
            list.push({ id: doc.id, ...doc.data() } as FeePayment);
          });
          setFeePayments(list);
        }, (err) => handleFirestoreError(err, OperationType.LIST, 'fee_payments'));

      } catch (error) {
        console.error('Error setting up data listeners:', error);
      }
    };

    setupListeners();
    return () => {
      unsubHouseholds();
      unsubMembers();
      unsubCampaigns();
      unsubPayments();
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
        // Create household with static IDs to align references
        const hRef = doc(db, 'households', h.id);
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
          const mRef = doc(collection(db, `households/${h.id}/members`));
          const mData = {
            householdId: h.id,
            fullName: m.fullName,
            relationship: m.relationship,
            birthDate: m.birthDate,
            gender: m.gender,
            residenceStatus: m.residenceStatus,
            phone: m.phone || '',
            address: m.address || h.address || '',
            notes: m.notes || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          };
          await setDoc(mRef, mData);
        }
      }

      // Seed campaigns
      for (const c of BASIC_CAMPAIGNS) {
        const cRef = doc(db, 'fee_campaigns', c.id);
        await setDoc(cRef, {
          title: c.title,
          description: c.description,
          type: c.type,
          amount: c.amount,
          createdAt: serverTimestamp()
        });
      }

      // Seed payments for seeded households and campaigns
      const samplePayments = [
        { householdId: 'h1', campaignId: 'c1', status: 'paid', paidAmount: 150000, notes: 'Đã nộp đủ bằng chuyển khoản ngân hàng' },
        { householdId: 'h1', campaignId: 'c2', status: 'paid', paidAmount: 150000, notes: 'Đóng góp Quỹ khuyến học' },
        { householdId: 'h1', campaignId: 'c3', status: 'paid', paidAmount: 500000, notes: 'Đã hoàn thành' },
        { householdId: 'h2', campaignId: 'c2', status: 'paid', paidAmount: 50000, notes: 'Đóng góp tự nguyện' },
        { householdId: 'h2', campaignId: 'c1', status: 'unpaid', paidAmount: 0, notes: '' },
        { householdId: 'h2', campaignId: 'c3', status: 'unpaid', paidAmount: 0, notes: '' },
        { householdId: 'h3', campaignId: 'c1', status: 'paid', paidAmount: 150000, notes: 'Nộp tiền mặt' },
        { householdId: 'h3', campaignId: 'c2', status: 'paid', paidAmount: 20000, notes: 'Ủng hộ khuyến học' },
        { householdId: 'h3', campaignId: 'c3', status: 'unpaid', paidAmount: 0, notes: '' }
      ];

      for (const p of samplePayments) {
        const pRef = doc(collection(db, 'fee_payments'));
        await setDoc(pRef, {
          householdId: p.householdId,
          campaignId: p.campaignId,
          status: p.status,
          paidAmount: p.paidAmount,
          notes: p.notes,
          paidAt: p.status === 'paid' ? serverTimestamp() : null
        });
      }

      alert('Đã khởi tạo toàn bộ dữ liệu mẫu (Cư dân, Hộ khẩu & các khoản Thu nộp) thành công!');
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
    const targetHouseholdId = mHouseholdId || selectedHouseholdId;
    if (!targetHouseholdId || isSavingMember) {
      alert('Vui lòng chọn Hộ gia đình tương ứng.');
      return;
    }

    if (!mName.trim() || !mRelation.trim() || !mBirth.trim() || !mNotes.trim()) {
      alert('Vui lòng điền đầy đủ thông tin nhân khẩu (bao gồm cả Ghi chú diện cư dân).');
      return;
    }

    setIsSavingMember(true);
    const membersPath = `households/${targetHouseholdId}/members`;
    try {
      const data = {
        householdId: targetHouseholdId,
        fullName: mName.trim(),
        relationship: mRelation,
        birthDate: mBirth,
        gender: mGender,
        residenceStatus: mResidenceStatus,
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
    setMHouseholdId(m.householdId);
    setMName(m.fullName);
    setMRelation(m.relationship);
    setMBirth(m.birthDate);
    setMGender(m.gender);
    setMResidenceStatus(m.residenceStatus || 'Có mặt tại địa phương');
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
    setMHouseholdId('');
    setMName('');
    setMRelation('Con trai');
    setMBirth('');
    setMGender('Nam');
    setMResidenceStatus('Có mặt tại địa phương');
    setMPhone('');
    setMAddress('');
    setMNotes('');
    setShowMemberForm(false);
  };

  const handleEditMember = (member: Member) => {
    setSelectedHouseholdId(member.householdId);
    handleEditMemberClick(member);
    setActiveTab('households');
  };

  const handleAddMemberClickGlobal = () => {
    resetMemberForm();
    setActiveTab('households');
    setShowMemberForm(true);
  };

  const handleSelectHouseholdAndNavigate = (householdId: string) => {
    setSelectedHouseholdId(householdId);
    setActiveTab('households');
  };

  // 6.5. Campaign & Payment Management Handlers
  const resetCampaignForm = () => {
    setCamTitle('');
    setCamDesc('');
    setCamType('mandatory');
    setCamAmount('0');
    setShowCampaignModal(false);
  };

  const handleSaveCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingCampaign) return;

    if (!camTitle.trim()) {
      alert('Vui lòng nhập tên khoản thu nộp.');
      return;
    }

    setIsSavingCampaign(true);
    try {
      const amountNum = parseFloat(camAmount) || 0;
      await addDoc(collection(db, 'fee_campaigns'), {
        title: camTitle.trim(),
        description: camDesc.trim(),
        type: camType,
        amount: amountNum,
        createdAt: serverTimestamp()
      });
      alert('Đã tạo khoản thu đóng góp mới thành công!');
      resetCampaignForm();
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'fee_campaigns');
    } finally {
      setIsSavingCampaign(false);
    }
  };

  const handleDeleteCampaign = async (id: string, title: string) => {
    if (window.confirm(`Bạn có chắc muốn xóa khoản thu "${title}"? Tất cả lịch sử nộp tiền liên quan cũng sẽ bị ảnh hưởng.`)) {
      try {
        await deleteDoc(doc(db, 'fee_campaigns', id));
        const paymentsToDelete = feePayments.filter(p => p.campaignId === id);
        for (const p of paymentsToDelete) {
          await deleteDoc(doc(db, 'fee_payments', p.id));
        }
        alert('Xóa thành công!');
        if (selectedCampaignId === id) {
          setSelectedCampaignId(null);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `fee_campaigns/${id}`);
      }
    }
  };

  const handleTogglePaymentStatus = async (householdId: string, campaignId: string, defaultAmount: number, memberId?: string) => {
    try {
      const existing = feePayments.find(p => {
        if (memberId) {
          return p.memberId === memberId && p.campaignId === campaignId;
        } else {
          return p.householdId === householdId && !p.memberId && p.campaignId === campaignId;
        }
      });

      if (existing) {
        const newStatus = existing.status === 'paid' ? 'unpaid' : 'paid';
        const newAmount = newStatus === 'paid' ? defaultAmount : 0;
        await updateDoc(doc(db, 'fee_payments', existing.id), {
          status: newStatus,
          paidAmount: newAmount,
          paidAt: newStatus === 'paid' ? serverTimestamp() : null
        });
      } else {
        const paymentData: any = {
          householdId,
          campaignId,
          status: 'paid',
          paidAmount: defaultAmount,
          notes: 'Đã nộp đủ',
          paidAt: serverTimestamp()
        };
        if (memberId) {
          paymentData.memberId = memberId;
        }
        await addDoc(collection(db, 'fee_payments'), paymentData);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'fee_payments');
    }
  };

  const handleUpdatePaymentDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingPayment) return;

    setIsSavingPayment(true);
    try {
      const amountNum = parseFloat(payAmount) || 0;
      const status = amountNum > 0 ? 'paid' : 'unpaid';
      const existing = feePayments.find(p => {
        if (payMemberId) {
          return p.memberId === payMemberId && p.campaignId === payCampaignId;
        } else {
          return p.householdId === payHouseholdId && !p.memberId && p.campaignId === payCampaignId;
        }
      });

      const data: any = {
        householdId: payHouseholdId,
        campaignId: payCampaignId,
        status,
        paidAmount: amountNum,
        notes: payNotes.trim(),
        paidAt: status === 'paid' ? serverTimestamp() : null
      };

      if (payMemberId) {
        data.memberId = payMemberId;
      }

      if (existing) {
        await updateDoc(doc(db, 'fee_payments', existing.id), data);
      } else {
        await addDoc(collection(db, 'fee_payments'), data);
      }
      alert('Cập nhật chi tiết đóng nộp thành công!');
      setShowPaymentModal(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'fee_payments');
    } finally {
      setIsSavingPayment(false);
    }
  };

  const handleOpenPaymentEdit = (householdId: string, campaignId: string, currentAmount: number, currentNotes: string, memberId?: string) => {
    setPayHouseholdId(householdId);
    setPayCampaignId(campaignId);
    setPayAmount(currentAmount.toString());
    setPayNotes(currentNotes);
    setPayMemberId(memberId || '');
    setShowPaymentModal(true);
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
      m.residenceStatus.toLowerCase().includes(q) ||
      (m.notes && m.notes.toLowerCase().includes(q))
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
          <header className="bg-white border-b border-slate-100 px-3 py-2.5 md:px-6 md:py-4 sticky top-0 z-40 shadow-sm">
            <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 md:gap-4">
              <div className="flex items-center gap-2 md:gap-3 min-w-0">
                <div className="p-1.5 md:p-2 bg-blue-600 rounded-xl md:rounded-2xl text-white shadow-sm md:shadow-md shadow-blue-100 shrink-0">
                  <Home className="w-4 h-4 md:w-5 md:h-5" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xs sm:text-sm md:text-base font-black tracking-tight text-slate-900 truncate">
                    Ban CTMT Thôn Đông Trà
                  </h1>
                  <p className="text-[9px] md:text-[11px] text-slate-400 uppercase font-bold tracking-wider truncate">
                    Nền Tảng Quản Lý Dân Cư
                  </p>
                </div>
              </div>

              {/* User Actions */}
              <div className="flex items-center gap-1.5 md:gap-2.5 shrink-0">
                <div className="flex items-center gap-1.5 md:gap-2 bg-slate-50 px-2 py-1 md:px-2.5 md:py-1.5 rounded-xl md:rounded-2xl border border-slate-100">
                  <span className="text-[11px] md:text-xs font-black text-slate-700 uppercase">
                    {(user.email || 'c').charAt(0).toLowerCase()}
                  </span>
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="avatar" className="w-5 h-5 md:w-6 md:h-6 rounded-full object-cover border border-slate-200 shrink-0" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] md:text-xs font-black shrink-0">
                      {(user.email || 'c').charAt(0).toLowerCase()}
                    </div>
                  )}
                </div>

                {isAdminUser && (
                  <span className="bg-amber-50 text-amber-600 p-1.5 md:p-2 rounded-lg md:rounded-xl text-xs font-bold flex items-center justify-center border border-amber-100 shrink-0" title="Quản trị viên">
                    <Shield className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  </span>
                )}

                <button
                  onClick={logOut}
                  title="Đăng xuất"
                  className="p-1.5 md:p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-xl md:rounded-2xl transition-all cursor-pointer shrink-0"
                >
                  <LogOut className="w-4 h-4 md:w-4 md:h-4" />
                </button>
              </div>
            </div>
          </header>

          {/* PAGE NAVIGATION TABS */}
          <nav className="bg-white border-b border-slate-100 px-2 md:px-6 py-1 md:py-2 sticky top-[49px] md:top-[73px] z-30 shadow-sm">
            <div className="max-w-7xl mx-auto grid grid-cols-4 md:flex md:flex-wrap gap-1 md:gap-2">
              <button
                onClick={() => setActiveTab('overview')}
                className={cn(
                  "py-2 md:py-3 px-1 md:px-5 text-[11px] md:text-sm font-bold transition-all border-b-2 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 cursor-pointer text-center",
                  activeTab === 'overview'
                    ? "border-blue-600 text-blue-600 font-extrabold bg-blue-50/50 md:bg-transparent rounded-t-lg md:rounded-none"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-200"
                )}
              >
                <TrendingUp className="w-4 h-4 shrink-0" />
                <span className="hidden md:inline">Tổng quan & Báo cáo</span>
                <span className="md:hidden">Tổng quan</span>
              </button>
              <button
                onClick={() => {
                  setActiveTab('households');
                  setSelectedHouseholdId(null);
                }}
                className={cn(
                  "py-2 md:py-3 px-1 md:px-5 text-[11px] md:text-sm font-bold transition-all border-b-2 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 cursor-pointer text-center",
                  activeTab === 'households'
                    ? "border-blue-600 text-blue-600 font-extrabold bg-blue-50/50 md:bg-transparent rounded-t-lg md:rounded-none"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-200"
                )}
              >
                <Home className="w-4 h-4 shrink-0" />
                <span className="hidden md:inline">Quản lý Hộ khẩu</span>
                <span className="md:hidden">Hộ khẩu</span>
              </button>
              <button
                onClick={() => setActiveTab('members')}
                className={cn(
                  "py-2 md:py-3 px-1 md:px-5 text-[11px] md:text-sm font-bold transition-all border-b-2 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 cursor-pointer text-center",
                  activeTab === 'members'
                    ? "border-blue-600 text-blue-600 font-extrabold bg-blue-50/50 md:bg-transparent rounded-t-lg md:rounded-none"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-200"
                )}
              >
                <Users className="w-4 h-4 shrink-0" />
                <span className="hidden md:inline">Quản lý Nhân khẩu</span>
                <span className="md:hidden">Nhân khẩu</span>
              </button>
              <button
                onClick={() => setActiveTab('fees')}
                className={cn(
                  "py-2 md:py-3 px-1 md:px-5 text-[11px] md:text-sm font-bold transition-all border-b-2 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 cursor-pointer text-center",
                  activeTab === 'fees'
                    ? "border-blue-600 text-blue-600 font-extrabold bg-blue-50/50 md:bg-transparent rounded-t-lg md:rounded-none"
                    : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-200"
                )}
              >
                <CreditCard className="w-4 h-4 shrink-0" />
                <span className="hidden md:inline">Quản lý Thu nộp</span>
                <span className="md:hidden">Thu nộp</span>
              </button>
            </div>
          </nav>

          {/* MAIN CONTAINER */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-6 md:py-8">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && (
                <OverviewTab
                  households={households}
                  allMembers={allMembers}
                  feeCampaigns={feeCampaigns}
                  feePayments={feePayments}
                  onSwitchTab={setActiveTab}
                  onSeedDatabase={handleSeedDatabase}
                  isSeeding={isSeeding}
                />
              )}

              {activeTab === 'households' && (
                <HouseholdsTab
                  households={households}
                  allMembers={allMembers}
                  selectedHouseholdId={selectedHouseholdId}
                  onSelectHousehold={setSelectedHouseholdId}
                  searchQuery={searchQuery}
                  onSearchQueryChange={setSearchQuery}
                  filteredHouseholds={filteredHouseholds}
                  onAddHouseholdClick={() => {
                    setEditingHouseholdId(null);
                    setHCode('');
                    setHOwner('');
                    setHAddress('');
                    setHPhone('');
                    setHNotes('');
                    setShowHouseholdModal(true);
                  }}
                  onEditHouseholdClick={handleEditHouseholdClick}
                  onDeleteHousehold={handleDeleteHousehold}
                  onAiAnalyze={handleAiAnalyze}
                  isAiAnalyzing={isAiAnalyzing}
                  aiAnalysis={aiAnalysis}
                  aiError={aiError}
                  onApplyAiNotes={handleApplyAiNotes}
                  selectedHouseholdMembers={selectedHouseholdMembers}
                  
                  showMemberForm={showMemberForm}
                  onShowMemberFormChange={setShowMemberForm}
                  editingMemberId={editingMemberId}
                  onEditMemberClick={handleEditMemberClick}
                  onDeleteMember={handleDeleteMember}
                  onSaveMember={handleSaveMember}
                  isSavingMember={isSavingMember}

                  mName={mName}
                  onMNameChange={setMName}
                  mRelation={mRelation}
                  onMRelationChange={setMRelation}
                  mBirth={mBirth}
                  onMBirthChange={setMBirth}
                  mGender={mGender}
                  onMGenderChange={setMGender}
                  mResidenceStatus={mResidenceStatus}
                  onMResidenceStatusChange={setMResidenceStatus}
                  mPhone={mPhone}
                  onMPhoneChange={setMPhone}
                  mAddress={mAddress}
                  onMAddressChange={setMAddress}
                  mNotes={mNotes}
                  onMNotesChange={setMNotes}
                />
              )}

              {activeTab === 'members' && (
                <MembersTab
                  households={households}
                  allMembers={allMembers}
                  onEditMember={handleEditMember}
                  onDeleteMember={handleDeleteMember}
                  onAddMemberClick={handleAddMemberClickGlobal}
                  onSelectHouseholdAndNavigate={handleSelectHouseholdAndNavigate}
                />
              )}

              {activeTab === 'fees' && (
                <FeesTab
                  households={households}
                  allMembers={allMembers}
                  feeCampaigns={feeCampaigns}
                  feePayments={feePayments}
                  selectedCampaignId={selectedCampaignId}
                  onSelectCampaign={setSelectedCampaignId}
                  onAddCampaignClick={() => setShowCampaignModal(true)}
                  onDeleteCampaign={handleDeleteCampaign}
                  onTogglePaymentStatus={handleTogglePaymentStatus}
                  onOpenPaymentEdit={handleOpenPaymentEdit}
                />
              )}
            </AnimatePresence>
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

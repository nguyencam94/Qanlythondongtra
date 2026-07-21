export interface UserProfile {
  userId: string;
  email: string;
  displayName: string;
  photoURL: string;
}

export interface Household {
  id: string; // doc ID
  householdCode: string; // Mã sổ hộ khẩu hoặc Mã hộ (ví dụ: HK-2041)
  ownerName: string; // Họ tên chủ hộ
  address: string; // Địa chỉ
  phone: string; // Số điện thoại
  notes: string; // Ghi chú chi tiết
  createdAt?: any;
  updatedAt?: any;
}

export interface Member {
  id: string; // doc ID
  householdId: string; // ID của hộ khẩu tương ứng
  fullName: string; // Họ và tên nhân khẩu
  relationship: string; // Quan hệ với chủ hộ (Chủ hộ, Vợ, Con trai, v.v.)
  birthDate: string; // Ngày sinh
  gender: 'Nam' | 'Nữ' | 'Khác'; // Giới tính
  residenceStatus: 'Có mặt tại địa phương' | 'Đi làm ăn xa' | 'Đã mất'; // Tình trạng cư trú
  notes: string; // Ghi chú (thương binh, bệnh binh, bộ đội tại ngũ, hộ nghèo, gia đình chính sách, v.v.)
  phone?: string; // Số điện thoại riêng (nếu có)
  address?: string; // Địa chỉ riêng (nếu khác địa chỉ hộ)
  createdAt?: any;
  updatedAt?: any;
}

export const RELATIONSHIPS = [
  'Chủ hộ',
  'Vợ',
  'Chồng',
  'Con trai',
  'Con gái',
  'Bố',
  'Mẹ',
  'Anh trai',
  'Em trai',
  'Chị gái',
  'Em gái',
  'Cháu',
  'Họ hàng khác'
];

export const GENDERS = ['Nam', 'Nữ', 'Khác'] as const;

export const RESIDENCE_STATUSES = [
  'Có mặt tại địa phương',
  'Đi làm ăn xa',
  'Đã mất'
] as const;

// Mock/Seed Data
export const BASIC_HOUSEHOLDS: Household[] = [
  {
    id: 'h1',
    householdCode: 'HK-2041',
    ownerName: 'Nguyễn Văn Hùng',
    address: 'Căn hộ 1205, Tòa A1, Khu đô thị An Bình',
    phone: '0912345678',
    notes: 'Gia đình văn hóa tiêu biểu, tham gia đầy đủ các hoạt động dân phố và đóng góp các loại phí đúng hạn.'
  },
  {
    id: 'h2',
    householdCode: 'HK-2042',
    ownerName: 'Trần Thị Mai',
    address: 'Căn hộ 1502, Tòa A1, Khu đô thị An Bình',
    phone: '0987654321',
    notes: 'Có em bé sơ sinh (sinh năm 2024). Cần chú ý ưu tiên truyền thông các đợt tiêm chủng y tế của phường.'
  },
  {
    id: 'h3',
    householdCode: 'HK-2043',
    ownerName: 'Phạm Minh Đức',
    address: 'Căn hộ 0804, Tòa A2, Khu đô thị An Bình',
    phone: '0905556677',
    notes: 'Kinh doanh tự do thiết bị máy tính, thường xuyên đi công tác vắng nhà vào cuối tuần.'
  }
];

export const BASIC_MEMBERS: Member[] = [
  // Hộ 1
  {
    id: 'm1',
    householdId: 'h1',
    fullName: 'Nguyễn Văn Hùng',
    relationship: 'Chủ hộ',
    birthDate: '1978-05-12',
    gender: 'Nam',
    residenceStatus: 'Có mặt tại địa phương',
    address: 'Căn hộ 1205, Tòa A1, Khu đô thị An Bình',
    notes: 'Gia đình chính sách, tổ trưởng tổ dân phố'
  },
  {
    id: 'm2',
    householdId: 'h1',
    fullName: 'Lê Thị Thu Hương',
    relationship: 'Vợ',
    birthDate: '1982-08-20',
    gender: 'Nữ',
    residenceStatus: 'Có mặt tại địa phương',
    address: 'Căn hộ 1205, Tòa A1, Khu đô thị An Bình',
    notes: 'Thương binh hạng 3/4, giáo viên'
  },
  {
    id: 'm3',
    householdId: 'h1',
    fullName: 'Nguyễn Minh Quân',
    relationship: 'Con trai',
    birthDate: '2008-03-15',
    gender: 'Nam',
    residenceStatus: 'Có mặt tại địa phương',
    address: 'Căn hộ 1205, Tòa A1, Khu đô thị An Bình',
    notes: 'Đoàn viên thanh niên'
  },
  // Hộ 2
  {
    id: 'm4',
    householdId: 'h2',
    fullName: 'Trần Thị Mai',
    relationship: 'Chủ hộ',
    birthDate: '1990-11-02',
    gender: 'Nữ',
    residenceStatus: 'Có mặt tại địa phương',
    address: 'Căn hộ 1502, Tòa A1, Khu đô thị An Bình',
    notes: 'Hộ nghèo'
  },
  {
    id: 'm5',
    householdId: 'h2',
    fullName: 'Phạm Văn Nam',
    relationship: 'Chồng',
    birthDate: '1988-04-25',
    gender: 'Nam',
    residenceStatus: 'Đi làm ăn xa',
    address: 'Căn hộ 1502, Tòa A1, Khu đô thị An Bình',
    notes: 'Bộ đội tại ngũ'
  },
  {
    id: 'm6',
    householdId: 'h2',
    fullName: 'Phạm Thảo Chi',
    relationship: 'Con gái',
    birthDate: '2024-01-10',
    gender: 'Nữ',
    residenceStatus: 'Có mặt tại địa phương',
    address: 'Căn hộ 1502, Tòa A1, Khu đô thị An Bình',
    notes: 'Trẻ em dưới 6 tuổi'
  },
  // Hộ 3
  {
    id: 'm7',
    householdId: 'h3',
    fullName: 'Phạm Minh Đức',
    relationship: 'Chủ hộ',
    birthDate: '1985-09-30',
    gender: 'Nam',
    residenceStatus: 'Có mặt tại địa phương',
    address: 'Căn hộ 0804, Tòa A2, Khu đô thị An Bình',
    notes: 'Bệnh binh'
  }
];

export interface FeeCampaign {
  id: string;
  title: string;
  description: string;
  type: 'mandatory' | 'voluntary'; // bắt buộc hoặc tự nguyện đóng góp
  amount: number; // số tiền (0 nếu là tự nguyện đóng góp tùy tâm)
  createdAt?: any;
}

export interface FeePayment {
  id: string;
  householdId: string;
  memberId?: string; // ID của nhân khẩu nếu thu theo nhân khẩu
  campaignId: string;
  status: 'paid' | 'unpaid';
  paidAmount: number;
  paidAt?: any;
  notes?: string;
}

export const BASIC_CAMPAIGNS: FeeCampaign[] = [
  {
    id: 'c1',
    title: 'Phí dịch vụ chung cư hằng tháng',
    description: 'Bao gồm phí thang máy, an ninh, thu gom rác thải sinh hoạt và thắp sáng công cộng.',
    type: 'mandatory',
    amount: 150000
  },
  {
    id: 'c2',
    title: 'Ủng hộ Quỹ Khuyến Học dân phố',
    description: 'Quỹ khen thưởng cho các cháu học sinh đạt thành tích xuất sắc và hỗ trợ trẻ em nghèo hiếu học.',
    type: 'voluntary',
    amount: 0 // Tùy tâm đóng góp
  },
  {
    id: 'c3',
    title: 'Phí bảo trì tòa nhà hằng năm',
    description: 'Kinh phí dự phòng cho việc sửa chữa và cải tạo các hạng mục cơ sở hạ tầng dùng chung.',
    type: 'mandatory',
    amount: 500000
  },
  {
    id: 'c4',
    title: 'Ủng hộ đồng bào bị ảnh hưởng bởi thiên tai',
    description: 'Quyên góp khẩn cấp hỗ trợ đồng bào vùng lũ lụt vượt qua khó khăn, ổn định cuộc sống.',
    type: 'voluntary',
    amount: 0
  }
];


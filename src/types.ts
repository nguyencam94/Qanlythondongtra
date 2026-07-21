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
  idCard: string; // Số CCCD / CMND
  occupation: string; // Nghề nghiệp
  phone?: string; // Số điện thoại riêng (nếu có)
  address?: string; // Địa chỉ riêng (nếu khác địa chỉ hộ)
  notes?: string; // Ghi chú riêng (ví dụ: tiền sử bệnh, học tập, ghi chú đặc biệt)
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
    idCard: '001078001234',
    occupation: 'Kỹ sư CNTT',
    address: 'Căn hộ 1205, Tòa A1, Khu đô thị An Bình',
    notes: 'Tổ trưởng tổ dân phố nhiệt tình, có trách nhiệm cao với các công việc chung.'
  },
  {
    id: 'm2',
    householdId: 'h1',
    fullName: 'Lê Thị Thu Hương',
    relationship: 'Vợ',
    birthDate: '1982-08-20',
    gender: 'Nữ',
    idCard: '001082005678',
    occupation: 'Giáo viên trường THCS',
    address: 'Căn hộ 1205, Tòa A1, Khu đô thị An Bình',
    notes: 'Giảng dạy bộ môn Toán, thường xuyên hỗ trợ các lớp học tình thương tại địa bàn.'
  },
  {
    id: 'm3',
    householdId: 'h1',
    fullName: 'Nguyễn Minh Quân',
    relationship: 'Con trai',
    birthDate: '2008-03-15',
    gender: 'Nam',
    idCard: '001208009999',
    occupation: 'Học sinh cấp 3',
    address: 'Căn hộ 1205, Tòa A1, Khu đô thị An Bình',
    notes: 'Đoàn viên năng nổ, tích cực tham gia các phong trào thanh thiếu niên hè.'
  },
  // Hộ 2
  {
    id: 'm4',
    householdId: 'h2',
    fullName: 'Trần Thị Mai',
    relationship: 'Chủ hộ',
    birthDate: '1990-11-02',
    gender: 'Nữ',
    idCard: '038090001111',
    occupation: 'Nhân viên kế toán',
    address: 'Căn hộ 1502, Tòa A1, Khu đô thị An Bình',
    notes: 'Phụ trách thủ quỹ chi hội phụ nữ, cần lưu ý cập nhật liên lạc khi họp dân phố.'
  },
  {
    id: 'm5',
    householdId: 'h2',
    fullName: 'Phạm Văn Nam',
    relationship: 'Chồng',
    birthDate: '1988-04-25',
    gender: 'Nam',
    idCard: '038088002222',
    occupation: 'Kỹ sư công trình xây dựng',
    address: 'Căn hộ 1502, Tòa A1, Khu đô thị An Bình',
    notes: 'Thường xuyên đi công tác xa nhà, ít khi có mặt trong tuần.'
  },
  {
    id: 'm6',
    householdId: 'h2',
    fullName: 'Phạm Thảo Chi',
    relationship: 'Con gái',
    birthDate: '2024-01-10',
    gender: 'Nữ',
    idCard: 'Chưa có',
    occupation: 'Nhỏ tuổi',
    address: 'Căn hộ 1502, Tòa A1, Khu đô thị An Bình',
    notes: 'Đang trong độ tuổi tiêm chủng mở rộng. Cần ưu tiên thông báo y tế.'
  },
  // Hộ 3
  {
    id: 'm7',
    householdId: 'h3',
    fullName: 'Phạm Minh Đức',
    relationship: 'Chủ hộ',
    birthDate: '1985-09-30',
    gender: 'Nam',
    idCard: '012085004444',
    occupation: 'Chủ cửa hàng máy tính',
    address: 'Căn hộ 0804, Tòa A2, Khu đô thị An Bình',
    notes: 'Kinh doanh tự do, hỗ trợ kỹ thuật cài đặt hệ thống camera giám sát của tổ dân phố.'
  }
];

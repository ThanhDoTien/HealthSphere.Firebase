// ==========================================
// FILE: src/components/dashboard/AddMealForm.tsx
// MỤC ĐÍCH: Form Ghi chép Bữa ăn (Add Meal Form)
// TỔNG QUAN CHỨC NĂNG: Cung cấp giao diện để người dùng thêm thủ công một bữa ăn mới.
// Form quản lý lỗi nhập liệu, gửi yêu cầu lưu dữ liệu lên hệ cơ sở dữ liệu Firebase (Firestore),
// và song song đó thực hiện đồng bộ hóa sang Backend API mở rộng của ứng dụng.
// ==========================================

'use client'; // Client Component phục vụ việc quản lý trạng thái form

// Các thư viện quản lý Form và Validate dữ liệu
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Thư viện tương tác với cơ sở dữ liệu Firebase
import { collection, addDoc } from 'firebase/firestore';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';

// Các mã cục bộ của hệ thống
import { useFirestore } from '@/firebase';
import { errorEmitter } from '@/firebase/error-emitter'; // Phóng bão lỗi nếu hệ thống từ chối quyền
import { FirestorePermissionError } from '@/firebase/errors';
import { useTranslation } from '@/context/LanguageContext';

// ----------------------------------------------------
// 1. ĐỊNH NGHĨA CẤU TRÚC KIỂM TRA DỮ LIỆU (SCHEMA)
// ----------------------------------------------------
// Dùng thư viện Zod để xây dựng quy tắc: 
// Ví dụ: Tên món ăn không được để trống, Calo phải là số dương...
const FormSchema = z.object({
  name: z.string().min(1, 'Meal name is required.'),
  calories: z.coerce.number().min(0, 'Calories must be a positive number.'),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Please enter a valid date.',
  }),
});

// Nội suy Type script từ cấu trúc Zod Zchema ở trên
type FormValues = z.infer<typeof FormSchema>;

// Input đầu vào của Component này yêu cầu phải cung cấp userId
interface AddMealFormProps {
  userId: string;
}

// Lấy địa chỉ của máy chủ Backend API (hoặc URL dự phòng)
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || "https://healthsphere-8kji.onrender.com";

export default function AddMealForm({ userId }: AddMealFormProps) {
  // Khởi tạo các hook cơ bản cần thiết
  const { toast } = useToast();
  const firestore = useFirestore(); // Bắt kết nối với DB Firebase
  const { t } = useTranslation();

  // ----------------------------------------------------
  // 2. KHỞI TẠO FRAMEWORK QUẢN LÝ FORM
  // ----------------------------------------------------
  const {
    register, // Đăng ký các thẻ HTML <input> thường vào Form
    handleSubmit, // Xử lý sự kiện Gửi (Submit)
    control, // Quản lý trạng thái các thẻ phức tạp như <Select> (Drop-down)
    reset, // Dùng để dọn dẹp trắng trơn các ô nhập liệu sau khi đăng thành công
    formState: { errors, isSubmitting }, // Chứa trạng thái "Đang gửi" hoặc mã lỗi (nếu có)
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema), // Gắn Zod làm người phán xử lỗi
    defaultValues: {
      date: new Date().toISOString().split('T')[0], // Mặc định là ngày hôm nay
      mealType: 'breakfast', // Mặc định là bữa sáng
      name: '',
      calories: undefined,
    },
  });

  // ----------------------------------------------------
  // 3. HÀM XỬ LÝ SỰ KIỆN GỬI DỮ LIỆU
  // ----------------------------------------------------
  const onSubmit = async (data: FormValues) => {
    // A. Chuẩn bị dữ liệu để lưu vào Cơ sở dữ liệu chính (Firebase)
    // Dữ liệu sẽ lưu vào thư mục: users / [Mã-User] / meals
    const mealLogRef = collection(firestore, `users/${userId}/meals`);
    const mealLogData = {
      userId,
      ...data, // Bung toàn bộ data từ object form vào đây (ngày, calo, tên, loại bữa ăn)
    };

    try {
      // B. Thực hiện lưu vào Firebase (Real-time DB)
      await addDoc(mealLogRef, mealLogData);
      
      // ----------------------------------------------------------------  
      // C. ĐỒNG BỘ backend nâng cao (Phục vụ cho các AI/logic phức tạp)
      //    Định dạng JSON cần phải chuẩn hóa theo yêu cầu bên BE 
      // ----------------------------------------------------------------
      const syncPayload = {
        id: 0,
        userId: userId, 
        mealName: data.name,
        calories: data.calories,
        protein: 0,    // Mặc định tạm do hiện tại form chưa yêu cầu nhập
        carbs: 0,      // Mặc định tạm
        fat: 0,        // Mặc định tạm
        imageUrl: "",  // Bỏ trống (Hình ảnh chỉ được dùng nếu thêm bằng AI Scan)
        type: data.mealType,
        createdAt: new Date().toISOString()
      };

      // Gửi ngầm gói data dự phòng ("fire-and-forget", nếu lỗi chỉ ghi log chứ không sập App)
      fetch(`${BACKEND_URL}/api/MealLogs`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(syncPayload),
      }).catch(err => console.error("Sync error:", err));

      // D. Hiển thị thông báo chiến thắng cho User và reset Form
      toast({
        title: t('form.common.success'),
        description: t('form.add_meal.success', { name: data.name }),
      });
      reset({
        ...data,
        name: '',
        calories: undefined // Xóa tên và Calo đi, giữ lại Ngày cho tiện thao tác liên hoàn
      });
      
    } catch (error: any) {
      // Xử lý Lỗi (Ví dụ: Mất mạng, hoặc User bị cấm ghi vào DB do quyền Firebase)
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: mealLogRef.path,
          operation: 'create',
          requestResourceData: mealLogData,
        })
      );
      toast({
        variant: 'destructive', // Hiện thẻ toast màu đỏ
        title: t('form.common.error'),
        description: t('form.add_meal.error'),
      });
    }
  };

  // ----------------------------------------------------
  // 4. GIAO DIỆN (HTML / JSX)
  // ----------------------------------------------------
  return (
    // Gọi hàm handleSubmit bao bọc hàm onSubmit của chúng ta để tự động chặn hành vi tải lại trang (preventDefault)
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Khối nhập Ngày (Date) */}
        <div className="grid gap-1.5">
          <Label htmlFor="date">{t('form.common.date')}</Label>
          <Input id="date" type="date" {...register('date')} />
          {/* Vùng hiện chữ báo lỗi màu đỏ */}
          {errors.date && <p className="mt-1 text-sm text-destructive">{errors.date.message}</p>}
        </div>

        {/* Khối nhập Tên Món (Food Name) */}
        <div className="grid gap-1.5">
          <Label htmlFor="name">{t('form.add_meal.nameLabel')}</Label>
          <Input id="name" type="text" placeholder={t('form.add_meal.namePlaceholder')} {...register('name')} />
          {errors.name && <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>}
        </div>

        {/* Khối nhập Caloc (Calories Amount) */}
        <div className="grid gap-1.5">
          <Label htmlFor="calories">{t('form.add_meal.caloriesLabel')}</Label>
          <Input id="calories" type="number" placeholder={t('form.add_meal.caloriesPlaceholder')} {...register('calories')} />
          {errors.calories && <p className="mt-1 text-sm text-destructive">{errors.calories.message}</p>}
        </div>

        {/* Khối chọn Loại Bữa Ăn (Meal Type) - Dùng Controller do SelectBox không phải thẻ HTML thuần */}
        <div className="grid gap-1.5">
          <Label htmlFor="mealType">{t('form.add_meal.typeLabel')}</Label>
          <Controller
            control={control}
            name="mealType"
            render={({ field }) => (
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <SelectTrigger>
                  <SelectValue placeholder={t('form.add_meal.typePlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="breakfast">{t('form.add_meal.typeBreakfast')}</SelectItem>
                  <SelectItem value="lunch">{t('form.add_meal.typeLunch')}</SelectItem>
                  <SelectItem value="dinner">{t('form.add_meal.typeDinner')}</SelectItem>
                  <SelectItem value="snack">{t('form.add_meal.typeSnack')}</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
          {errors.mealType && <p className="mt-1 text-sm text-destructive">{errors.mealType.message}</p>}
        </div>
      </div>
      
      {/* Nút lưu Form - Tự vô hiệu hóa mờ đi khi đang chờ (isSubmitting = true) */}
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? t('form.add_meal.loadingButton') : t('form.add_meal.button')}
      </Button>
    </form>
  );
}

/**
 * Backend validation utilities - mirror frontend rules.
 * Validation must exist on both frontend and backend.
 */

const EGYPT_PHONE_REGEX = /^0(10|11|12|15)\d{8}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEgyptPhone(value: string): { valid: boolean; message?: string } {
  if (!value || typeof value !== "string") {
    return { valid: false, message: "رقم الهاتف مطلوب" };
  }
  const digits = value.replace(/\D/g, "");
  if (digits.length !== 11) {
    return { valid: false, message: "رقم الهاتف يجب أن يكون 11 رقماً" };
  }
  if (!EGYPT_PHONE_REGEX.test(digits)) {
    return { valid: false, message: "يجب أن يبدأ الرقم بـ 010 أو 011 أو 012 أو 015" };
  }
  return { valid: true };
}

export function validateEmail(value: string): { valid: boolean; message?: string } {
  if (!value?.trim()) {
    return { valid: false, message: "البريد الإلكتروني مطلوب" };
  }
  if (!EMAIL_REGEX.test(value.trim())) {
    return { valid: false, message: "أدخل بريداً إلكترونياً صحيحاً" };
  }
  return { valid: true };
}

export function validateTripTitle(value: string): { valid: boolean; message?: string } {
  if (!value?.trim()) return { valid: false, message: "العنوان مطلوب" };
  if (value.trim().length < 5) return { valid: false, message: "العنوان يجب أن يكون 5 أحرف على الأقل" };
  if (/^\d+$/.test(value.replace(/\s/g, ""))) return { valid: false, message: "العنوان لا يمكن أن يكون أرقاماً فقط" };
  return { valid: true };
}

export function validateDescription(value: string): { valid: boolean; message?: string } {
  const len = (value || "").length;
  if (len < 30) return { valid: false, message: "الوصف يجب أن يكون 30 حرفاً على الأقل" };
  if (len > 2000) return { valid: false, message: "الوصف يجب ألا يتجاوز 2000 حرف" };
  return { valid: true };
}

export function validatePrice(value: string | number): { valid: boolean; message?: string } {
  const num = typeof value === "string" ? parseFloat(String(value).replace(/[^\d.]/g, "")) : Number(value);
  if (isNaN(num) || num <= 0) return { valid: false, message: "السعر يجب أن يكون رقماً أكبر من صفر" };
  if (num < 10) return { valid: false, message: "السعر منخفض جداً" };
  if (num > 500000) return { valid: false, message: "السعر يتجاوز الحد المسموح" };
  return { valid: true };
}

export function validateSeats(value: number | string, minBooked = 0): { valid: boolean; message?: string } {
  const num = typeof value === "string" ? parseInt(String(value), 10) : Number(value);
  if (isNaN(num) || num <= 0) return { valid: false, message: "عدد المقاعد يجب أن يكون أكبر من صفر" };
  if (num < minBooked) return { valid: false, message: `عدد المقاعد لا يمكن أن يكون أقل من المقاعد المحجوزة (${minBooked})` };
  return { valid: true };
}

export function validateStartDate(value: string | Date): { valid: boolean; message?: string } {
  if (!value) return { valid: true };
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (d < today) return { valid: false, message: "تاريخ البداية لا يمكن أن يكون في الماضي" };
  return { valid: true };
}

export function validateReturnDate(endValue: string | Date, startValue: string | Date): { valid: boolean; message?: string } {
  if (!endValue || !startValue) return { valid: true };
  const end = new Date(endValue);
  const start = new Date(startValue);
  if (end < start) return { valid: false, message: "تاريخ العودة لا يمكن أن يكون قبل تاريخ البداية" };
  return { valid: true };
}

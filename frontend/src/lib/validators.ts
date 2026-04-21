/**
 * Shared validation utilities - reuse across forms.
 * Validation must exist on both frontend and backend.
 */

const EGYPT_PHONE_REGEX = /^0(10|11|12|15)\d{8}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** 
 * Phone validation: 
 * - If 11 digits, must follow Egypt 01x format
 * - If starts with +, allow 10-15 digits (international)
 */
export function validatePhone(value: string): { valid: boolean; message?: string } {
  const digits = value.replace(/\D/g, "");
  const isInternational = value.trim().startsWith("+") || value.trim().startsWith("00");

  if (isInternational) {
    if (digits.length < 10 || digits.length > 15) {
      return { valid: false, message: "رقم الهاتف الدولي يجب أن يكون بين 10 و 15 رقماً" };
    }
    return { valid: true };
  }

  if (digits.length !== 11) {
    return { valid: false, message: "رقم الهاتف يجب أن يكون 11 رقماً" };
  }
  if (!EGYPT_PHONE_REGEX.test(digits)) {
    return { valid: false, message: "يجب أن يبدأ الرقم بـ 010 أو 011 أو 012 أو 015" };
  }
  return { valid: true };
}

/** Luhn Algorithm for credit card validation */
export function validateCardNumber(value: string): { valid: boolean; message?: string } {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) {
    return { valid: false, message: "رقم البطاقة غير صحيح (يجب أن يكون بين 13 و 19 رقماً)" };
  }
  
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i));
    if (shouldDouble) {
      if ((digit *= 2) > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  
  if (sum % 10 !== 0) {
    return { valid: false, message: "رقم البطاقة غير صحيح" };
  }
  return { valid: true };
}

/** Expiry date: MM/YY, not in the past */
export function validateExpiryDate(value: string): { valid: boolean; message?: string } {
  const match = value.match(/^(0[1-9]|1[0-2])\/?([2-9][0-9])$/);
  if (!match) {
    return { valid: false, message: "التاريخ غير صحيح (MM/YY)" };
  }
  
  const month = parseInt(match[1]);
  const year = parseInt("20" + match[2]);
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  
  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return { valid: false, message: "البطاقة منتهية الصلاحية" };
  }
  return { valid: true };
}

/** CVV: 3 or 4 digits */
export function validateCVV(value: string): { valid: boolean; message?: string } {
  const digits = value.replace(/\D/g, "");
  if (digits.length < 3 || digits.length > 4) {
    return { valid: false, message: "رمز الأمان يجب أن يكون 3 أو 4 أرقام" };
  }
  return { valid: true };
}


/** Email: valid format, required */
export function validateEmail(value: string): { valid: boolean; message?: string } {
  if (!value?.trim()) {
    return { valid: false, message: "البريد الإلكتروني مطلوب" };
  }
  if (!EMAIL_REGEX.test(value.trim())) {
    return { valid: false, message: "أدخل بريداً إلكترونياً صحيحاً" };
  }
  return { valid: true };
}

/** Password: min 8 chars, 1 uppercase, 1 number */
export function validatePassword(value: string): { valid: boolean; message?: string } {
  if (!value || value.length < 8) {
    return { valid: false, message: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" };
  }
  if (!/[A-Z]/.test(value)) {
    return { valid: false, message: "كلمة المرور يجب أن تحتوي على حرف إنجليزي كبير واحد على الأقل" };
  }
  if (!/\d/.test(value)) {
    return { valid: false, message: "كلمة المرور يجب أن تحتوي على رقم واحد على الأقل" };
  }
  return { valid: true };
}

/** Trip title: min 5 chars, cannot be numbers only */
export function validateTripTitle(value: string): { valid: boolean; message?: string } {
  if (!value?.trim()) {
    return { valid: false, message: "العنوان مطلوب" };
  }
  if (value.trim().length < 5) {
    return { valid: false, message: "العنوان يجب أن يكون 5 أحرف على الأقل" };
  }
  if (/^\d+$/.test(value.replace(/\s/g, ""))) {
    return { valid: false, message: "العنوان لا يمكن أن يكون أرقاماً فقط" };
  }
  return { valid: true };
}

/** Description: 30-2000 chars */
export function validateDescription(value: string): { valid: boolean; message?: string } {
  const len = (value || "").length;
  if (len < 30) {
    return { valid: false, message: "الوصف يجب أن يكون 30 حرفاً على الأقل" };
  }
  if (len > 2000) {
    return { valid: false, message: "الوصف يجب ألا يتجاوز 2000 حرف" };
  }
  return { valid: true };
}

/** Price: number, > 0, reasonable range (e.g. 10 - 500000) */
export function validatePrice(value: string | number): { valid: boolean; message?: string } {
  const num = typeof value === "string" ? parseFloat(value.replace(/[^\d.]/g, "")) : value;
  if (isNaN(num) || num <= 0) {
    return { valid: false, message: "السعر يجب أن يكون رقماً أكبر من صفر" };
  }
  if (num < 10) {
    return { valid: false, message: "السعر منخفض جداً (أقل من 10)" };
  }
  if (num > 500000) {
    return { valid: false, message: "السعر يتجاوز الحد المسموح (500000)" };
  }
  return { valid: true };
}

/** Seats: > 0 */
export function validateSeats(value: number | string, minBooked = 0): { valid: boolean; message?: string } {
  const num = typeof value === "string" ? parseInt(value, 10) : value;
  if (isNaN(num) || num <= 0) {
    return { valid: false, message: "عدد المقاعد يجب أن يكون أكبر من صفر" };
  }
  if (num < minBooked) {
    return { valid: false, message: `عدد المقاعد لا يمكن أن يكون أقل من المقاعد المحجوزة (${minBooked})` };
  }
  return { valid: true };
}

/** Start date: cannot be in the past */
export function validateStartDate(value: string): { valid: boolean; message?: string } {
  if (!value) return { valid: true };
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (d < today) {
    return { valid: false, message: "تاريخ البداية لا يمكن أن يكون في الماضي" };
  }
  return { valid: true };
}

/** Return date: cannot be before start date */
export function validateReturnDate(endValue: string, startValue: string): { valid: boolean; message?: string } {
  if (!endValue || !startValue) return { valid: true };
  const end = new Date(endValue);
  const start = new Date(startValue);
  if (end < start) {
    return { valid: false, message: "تاريخ العودة لا يمكن أن يكون قبل تاريخ البداية" };
  }
  return { valid: true };
}

/** Image: image type only, max 5MB */
export function validateImageFile(file: File): { valid: boolean; message?: string } {
  const allowed = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
  if (!allowed.includes(file.type)) {
    return { valid: false, message: "يجب أن يكون الملف صورة فقط (jpeg, png, gif, webp)" };
  }
  const maxBytes = 5 * 1024 * 1024; // 5MB
  if (file.size > maxBytes) {
    return { valid: false, message: "حجم الصورة يجب ألا يتجاوز 5 ميجابايت" };
  }
  return { valid: true };
}

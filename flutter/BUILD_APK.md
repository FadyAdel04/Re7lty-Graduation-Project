# بناء APK لتطبيق Re7lty (مشروع التخرج)

## 1) تجهيز ملف البيئة

```bash
cd flutter
copy .env.example .env
```

عدّل `.env`:

| المتغير | الوصف |
|---------|--------|
| `BACKEND_URL` | رابط الـ Backend المنشور (HTTPS) — **يعمل من أي شبكة** |
| `API_BASE_URL_DEV` | للتطوير فقط (محاكي أو IP اللابتوب) |
| `WEB_APP_URL` | موقع الويب (للمشاركة، ليس API) |
| `CLERK_PUBLISHABLE_KEY` | من Clerk |
| `MAPBOX_ACCESS_TOKEN` | من Mapbox |

**بعد نشر Backend على Vercel:**
`BACKEND_URL=https://your-backend.vercel.app`

**تجربة على هاتف + لابتوب (نفس الواي فاي):**
1. شغّل `npm run dev` في `backend`
2. من الإعدادات في التطبيق → **رابط الخادم** → `http://192.168.x.x:5000`  
   أو ضع نفس القيمة في `API_BASE_URL_DEV` للتطوير

## 2) تشغيل الـ Backend

```bash
cd backend
npm install
npm run dev
```

تأكد أن:

- MongoDB متصل
- Cloudinary مُعد (لرفع الصور/الفيديو)
- Clerk keys في `.env` الخاص بالـ backend

## 3) بناء APK

```bash
cd flutter
flutter pub get
flutter build apk --release
```

الملف الناتج:

`build/app/outputs/flutter-apk/app-release.apk`

## 4) تثبيت على الهاتف

- فعّل **مصادر غير معروفة** على Android
- انسخ `app-release.apk` للهاتف وثبّته
- أو: `flutter install --release` مع توصيل USB وتفعيل USB debugging

## 5) قبل العرض (Checklist)

- [ ] Backend شغال والهاتف يصل له (جرّب من متصفح الهاتف: `http://IP:5000/api/health` إن وُجد)
- [ ] تسجيل دخول Clerk يعمل
- [ ] الخريطة تظهر (Mapbox token صحيح)
- [ ] رفع صورة رحلة يعمل (Cloudinary)
- [ ] حساب شركة: لوحة التحكم + تعديل الإعدادات

## 6) ملاحظات العرض

- `DevicePreview` معطّل تلقائياً في `--release`
- للتوقيع الرسمي لاحقاً: أنشئ keystore وعدّل `android/app/build.gradle.kts` (حالياً يستخدم debug signing للتجربة)

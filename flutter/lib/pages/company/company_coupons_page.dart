import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:intl/intl.dart';
import '../../services/api_service.dart';
import '../../theme/app_colors.dart';

class CompanyCouponsPage extends ConsumerStatefulWidget {
  const CompanyCouponsPage({super.key});

  @override
  ConsumerState<CompanyCouponsPage> createState() => _CompanyCouponsPageState();
}

class _CompanyCouponsPageState extends ConsumerState<CompanyCouponsPage> {
  bool _isLoading = true;
  bool _isCreating = false;
  List<dynamic> _coupons = [];

  // Form fields
  final _codeCtrl = TextEditingController();
  final _valueCtrl = TextEditingController();
  final _limitCtrl = TextEditingController();
  String _discountType = 'percentage'; // 'percentage' | 'fixed'
  DateTime? _expiryDate;

  @override
  void initState() {
    super.initState();
    _loadCoupons();
  }

  @override
  void dispose() {
    _codeCtrl.dispose();
    _valueCtrl.dispose();
    _limitCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadCoupons() async {
    setState(() => _isLoading = true);
    try {
      final api = ref.read(apiServiceProvider);
      final res = await api.get('/coupons/my-coupons');
      if (res.statusCode == 200) {
        setState(() => _coupons = res.data as List);
      }
    } catch (e) {
      debugPrint('Error loading coupons: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _createCoupon() async {
    if (_codeCtrl.text.isEmpty || _valueCtrl.text.isEmpty || _expiryDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('يرجى ملء جميع الحقول المطلوبة', style: GoogleFonts.cairo()),
        backgroundColor: Colors.orange,
        behavior: SnackBarBehavior.floating,
      ));
      return;
    }

    setState(() => _isCreating = true);
    try {
      final api = ref.read(apiServiceProvider);
      await api.post('/coupons', data: {
        'code': _codeCtrl.text.toUpperCase(),
        'discountType': _discountType,
        'discountValue': double.tryParse(_valueCtrl.text) ?? 0,
        'expiryDate': _expiryDate!.toIso8601String(),
        if (_limitCtrl.text.isNotEmpty) 'usageLimit': int.tryParse(_limitCtrl.text),
      });

      _codeCtrl.clear();
      _valueCtrl.clear();
      _limitCtrl.clear();
      setState(() => _expiryDate = null);

      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('تم إنشاء الكوبون بنجاح ✓', style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
        backgroundColor: Colors.green,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      ));
      await _loadCoupons();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('فشل إنشاء الكوبون', style: GoogleFonts.cairo()),
        backgroundColor: Colors.red,
        behavior: SnackBarBehavior.floating,
      ));
    } finally {
      if (mounted) setState(() => _isCreating = false);
    }
  }

  Future<void> _deleteCoupon(String id) async {
    try {
      final api = ref.read(apiServiceProvider);
      await api.delete('/coupons/$id');
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        content: Text('تم حذف الكوبون', style: GoogleFonts.cairo()),
        backgroundColor: Colors.orange,
        behavior: SnackBarBehavior.floating,
      ));
      await _loadCoupons();
    } catch (e) {
      debugPrint('Delete coupon error: $e');
    }
  }

  Future<void> _pickExpiryDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime.now().add(const Duration(days: 30)),
      firstDate: DateTime.now(),
      lastDate: DateTime(2030),
      builder: (context, child) => Theme(
        data: Theme.of(context).copyWith(
          colorScheme: const ColorScheme.light(primary: Colors.indigo),
        ),
        child: child!,
      ),
    );
    if (picked != null) setState(() => _expiryDate = picked);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Text('كوبونات الخصم', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 18)),
        centerTitle: true,
        leading: IconButton(icon: const Icon(Icons.arrow_back_ios_new, size: 18), onPressed: () => Navigator.pop(context)),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_outlined, color: Colors.indigo),
            onPressed: _loadCoupons,
          ),
        ],
        bottom: const PreferredSize(preferredSize: Size.fromHeight(1), child: Divider(height: 1)),
      ),
      body: RefreshIndicator(
        onRefresh: _loadCoupons,
        color: Colors.indigo,
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            // ===== Create Coupon Card =====
            Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(20),
                gradient: const LinearGradient(colors: [Color(0xFF4F46E5), Color(0xFF7C3AED)], begin: Alignment.topLeft, end: Alignment.bottomRight),
                boxShadow: [BoxShadow(color: Colors.indigo.withOpacity(0.25), blurRadius: 20, offset: const Offset(0, 8))],
              ),
              child: Column(
                children: [
                  Padding(
                    padding: const EdgeInsets.all(20),
                    child: Row(
                      children: [
                        const Icon(Icons.add_circle_outline, color: Colors.white, size: 22),
                        const SizedBox(width: 10),
                        Text('إنشاء كوبون جديد', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.white)),
                      ],
                    ),
                  ),
                  Container(
                    decoration: const BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.only(bottomLeft: Radius.circular(20), bottomRight: Radius.circular(20)),
                    ),
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildLabel('كود الخصم (مثل: RAMADAN20)'),
                        const SizedBox(height: 8),
                        TextFormField(
                          controller: _codeCtrl,
                          textCapitalization: TextCapitalization.characters,
                          style: GoogleFonts.cairo(fontWeight: FontWeight.bold, letterSpacing: 2),
                          decoration: _inputDecoration('ادخل الكود...'),
                          onChanged: (v) => _codeCtrl.value = _codeCtrl.value.copyWith(text: v.toUpperCase()),
                        ),
                        const SizedBox(height: 16),
                        _buildLabel('نوع الخصم'),
                        const SizedBox(height: 8),
                        Container(
                          decoration: BoxDecoration(
                            color: Colors.grey[50],
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: Colors.grey.shade200),
                          ),
                          child: Row(
                            children: [
                              Expanded(
                                child: GestureDetector(
                                  onTap: () => setState(() => _discountType = 'percentage'),
                                  child: Container(
                                    margin: const EdgeInsets.all(4),
                                    padding: const EdgeInsets.symmetric(vertical: 12),
                                    decoration: BoxDecoration(
                                      color: _discountType == 'percentage' ? Colors.indigo : Colors.transparent,
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: Text('نسبة مئوية (%)', textAlign: TextAlign.center,
                                        style: GoogleFonts.cairo(fontSize: 13, fontWeight: FontWeight.bold, color: _discountType == 'percentage' ? Colors.white : Colors.grey[600])),
                                  ),
                                ),
                              ),
                              Expanded(
                                child: GestureDetector(
                                  onTap: () => setState(() => _discountType = 'fixed'),
                                  child: Container(
                                    margin: const EdgeInsets.all(4),
                                    padding: const EdgeInsets.symmetric(vertical: 12),
                                    decoration: BoxDecoration(
                                      color: _discountType == 'fixed' ? Colors.indigo : Colors.transparent,
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: Text('مبلغ ثابت (ج.م)', textAlign: TextAlign.center,
                                        style: GoogleFonts.cairo(fontSize: 13, fontWeight: FontWeight.bold, color: _discountType == 'fixed' ? Colors.white : Colors.grey[600])),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(height: 16),
                        _buildLabel('قيمة الخصم'),
                        const SizedBox(height: 8),
                        TextFormField(
                          controller: _valueCtrl,
                          keyboardType: const TextInputType.numberWithOptions(decimal: true),
                          style: GoogleFonts.cairo(),
                          decoration: _inputDecoration('0'),
                        ),
                        const SizedBox(height: 16),
                        _buildLabel('تاريخ الانتهاء'),
                        const SizedBox(height: 8),
                        InkWell(
                          onTap: _pickExpiryDate,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                            decoration: BoxDecoration(
                              color: Colors.grey[50],
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: Colors.grey.shade200),
                            ),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  _expiryDate != null ? DateFormat('dd/MM/yyyy').format(_expiryDate!) : 'mm/dd/yyyy',
                                  style: GoogleFonts.cairo(color: _expiryDate != null ? Colors.black87 : Colors.grey[400], fontSize: 14),
                                ),
                                const Icon(Icons.calendar_today_outlined, size: 18, color: Colors.grey),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        _buildLabel('حد الاستخدام (اختياري)'),
                        const SizedBox(height: 8),
                        TextFormField(
                          controller: _limitCtrl,
                          keyboardType: TextInputType.number,
                          style: GoogleFonts.cairo(),
                          decoration: _inputDecoration('مثلاً: 100 مرة'),
                        ),
                        const SizedBox(height: 20),
                        SizedBox(
                          width: double.infinity,
                          height: 52,
                          child: ElevatedButton.icon(
                            onPressed: _isCreating ? null : _createCoupon,
                            icon: _isCreating
                                ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                                : const Icon(Icons.local_offer_outlined),
                            label: Text('إنشاء الكوبون', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 15)),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.indigo,
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                              elevation: 0,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 28),

            // ===== Coupons List =====
            if (_isLoading)
              const Center(child: Padding(
                padding: EdgeInsets.all(40),
                child: CircularProgressIndicator(color: Colors.indigo),
              ))
            else if (_coupons.isEmpty)
              Center(
                child: Column(
                  children: [
                    const SizedBox(height: 40),
                    Icon(Icons.local_offer_outlined, size: 64, color: Colors.grey.withOpacity(0.3)),
                    const SizedBox(height: 12),
                    Text('لا توجد كوبونات خصم حالياً', style: GoogleFonts.cairo(color: Colors.grey, fontWeight: FontWeight.bold)),
                  ],
                ),
              )
            else
              ...(_coupons.asMap().entries.map((entry) {
                final coupon = entry.value;
                final usageCount = coupon['usageCount'] ?? 0;
                final usageLimit = coupon['usageLimit'];
                final isPercentage = coupon['discountType'] == 'percentage';
                DateTime? expiry;
                try { expiry = DateTime.parse(coupon['expiryDate'] ?? ''); } catch (_) {}
                final isExpired = expiry != null && expiry.isBefore(DateTime.now());

                return Container(
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 12, offset: const Offset(0, 4))],
                    border: isExpired ? Border.all(color: Colors.red.withOpacity(0.2)) : null,
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(18),
                    child: Column(
                      children: [
                        Row(
                          children: [
                            Container(
                              width: 48,
                              height: 48,
                              decoration: BoxDecoration(
                                color: isExpired ? Colors.red.withOpacity(0.1) : Colors.indigo.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(14),
                              ),
                              child: Icon(Icons.local_offer, color: isExpired ? Colors.red : Colors.indigo, size: 22),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Text(coupon['code'] ?? '', style: GoogleFonts.cairo(fontWeight: FontWeight.w900, fontSize: 16)),
                                      const SizedBox(width: 8),
                                      if (isExpired)
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                                          decoration: BoxDecoration(color: Colors.red.withOpacity(0.1), borderRadius: BorderRadius.circular(6)),
                                          child: Text('منتهي', style: GoogleFonts.cairo(fontSize: 11, color: Colors.red, fontWeight: FontWeight.bold)),
                                        ),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                                        decoration: BoxDecoration(color: Colors.green.withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
                                        child: Text(
                                          '${coupon['discountValue']}${isPercentage ? '%' : ' ج.م'}',
                                          style: GoogleFonts.cairo(fontSize: 13, color: Colors.green[700], fontWeight: FontWeight.bold),
                                        ),
                                      ),
                                      if (expiry != null) ...[
                                        const SizedBox(width: 8),
                                        Icon(Icons.calendar_today, size: 12, color: Colors.grey[400]),
                                        const SizedBox(width: 4),
                                        Text(DateFormat('dd/MM/yyyy').format(expiry), style: GoogleFonts.cairo(fontSize: 12, color: Colors.grey)),
                                      ],
                                    ],
                                  ),
                                ],
                              ),
                            ),
                            IconButton(
                              icon: const Icon(Icons.delete_outline, color: Colors.red),
                              onPressed: () => _confirmDelete(coupon['_id'] ?? ''),
                            ),
                          ],
                        ),
                        if (usageLimit != null) ...[
                          const SizedBox(height: 12),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('الاستخدام: $usageCount / $usageLimit', style: GoogleFonts.cairo(fontSize: 12, color: Colors.grey)),
                              Text('${((usageCount / usageLimit) * 100).toStringAsFixed(0)}%', style: GoogleFonts.cairo(fontSize: 12, color: Colors.indigo, fontWeight: FontWeight.bold)),
                            ],
                          ),
                          const SizedBox(height: 6),
                          ClipRRect(
                            borderRadius: BorderRadius.circular(4),
                            child: LinearProgressIndicator(
                              value: (usageCount / usageLimit).clamp(0.0, 1.0),
                              backgroundColor: Colors.grey[100],
                              valueColor: const AlwaysStoppedAnimation<Color>(Colors.indigo),
                              minHeight: 6,
                            ),
                          ),
                        ] else ...[
                          const SizedBox(height: 8),
                          Row(
                            children: [
                              Icon(Icons.all_inclusive, size: 14, color: Colors.grey[400]),
                              const SizedBox(width: 4),
                              Text('استخدام: $usageCount مرة (بدون حد)', style: GoogleFonts.cairo(fontSize: 12, color: Colors.grey)),
                            ],
                          ),
                        ],
                      ],
                    ),
                  ),
                ).animate().fadeIn(delay: (entry.key * 80).ms).slideY(begin: 0.1);
              }).toList()),
          ],
        ),
      ),
    );
  }

  void _confirmDelete(String id) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Text('حذف الكوبون', style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
        content: Text('هل أنت متأكد من حذف هذا الكوبون؟', style: GoogleFonts.cairo()),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: Text('إلغاء', style: GoogleFonts.cairo())),
          ElevatedButton(
            onPressed: () { Navigator.pop(context); _deleteCoupon(id); },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12))),
            child: Text('حذف', style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  Widget _buildLabel(String text) => Text(text, style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.grey[700]));

  InputDecoration _inputDecoration(String hint) => InputDecoration(
    hintText: hint,
    hintStyle: GoogleFonts.cairo(color: Colors.grey[400], fontSize: 13),
    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade200)),
    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade200)),
    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Colors.indigo, width: 2)),
    filled: true,
    fillColor: Colors.grey[50],
  );
}

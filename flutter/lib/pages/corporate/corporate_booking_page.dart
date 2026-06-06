import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:dio/dio.dart';
import '../../theme/app_colors.dart';
import '../../core/exceptions.dart';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../services/api_service.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../services/pending_payment_store.dart';

class CorporateBookingPage extends ConsumerStatefulWidget {
  final Map<String, dynamic> trip;
  CorporateBookingPage({super.key, required this.trip});

  @override
  ConsumerState<CorporateBookingPage> createState() => _CorporateBookingPageState();
}

class _CorporateBookingPageState extends ConsumerState<CorporateBookingPage> {
  int _currentStep = 0;
  int _passengers = 1;
  List<int> _selectedSeats = [];
  List<int> _occupiedSeats = [];
  bool _isLoading = false;
  
  late TextEditingController _phoneController;
  late TextEditingController _emailController;
  late TextEditingController _firstNameController;
  late TextEditingController _lastNameController;
  late TextEditingController _notesController;
  late TextEditingController _cardNumberController;
  late TextEditingController _expiryController;
  late TextEditingController _cvvController;
  
  String _paymentMethod = 'card';
  double _userBalance = 0.0;
  
  // Coupon state
  late TextEditingController _couponController;
  String? _appliedCouponCode;
  double _discountAmount = 0.0;
  bool _isValidatingCoupon = false;
  String? _couponError;
  String? _couponSuccess;

  @override
  void initState() {
    super.initState();
    _phoneController = TextEditingController();
    _emailController = TextEditingController();
    _firstNameController = TextEditingController();
    _lastNameController = TextEditingController();
    _notesController = TextEditingController();
    _cardNumberController = TextEditingController();
    _expiryController = TextEditingController();
    _cvvController = TextEditingController();
    _couponController = TextEditingController();
    _fetchUserBalance();
  }

  Future<void> _fetchUserBalance() async {
    try {
      final api = ref.read(apiServiceProvider);
      final response = await api.get('/users/me'); 
      if (response.statusCode == 200) {
        setState(() {
          _userBalance = (response.data['walletBalance'] ?? 0.0).toDouble();
        });
      }
    } catch (e) {
      debugPrint('Error fetching balance: $e');
    }
  }

  @override
  void dispose() {
    _phoneController.dispose();
    _emailController.dispose();
    _firstNameController.dispose();
    _lastNameController.dispose();
    _notesController.dispose();
    _cardNumberController.dispose();
    _expiryController.dispose();
    _cvvController.dispose();
    _couponController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bgColor = isDark ? AppColors.darkBackground : Colors.white;
    final cardColor = isDark ? AppColors.cardDark : Colors.white;
    final textColor = isDark ? Colors.white : Colors.black87;

    return Scaffold(
      backgroundColor: bgColor,
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(130), // Increased height
        child: Container(
          padding: const EdgeInsets.only(bottom: 15),
          decoration: const BoxDecoration(
            color: Color(0xFF4F46E5),
            borderRadius: BorderRadius.vertical(bottom: Radius.circular(25)),
          ),
          child: SafeArea(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildHeader(widget.trip['title'] ?? 'تأكيد الحجز'),
                const SizedBox(height: 12),
                _buildStepIndicator(),
              ],
            ),
          ),
        ),
      ),
      body: _buildStepContent(isDark, textColor, cardColor),
      bottomNavigationBar: _buildBottomNav(isDark, bgColor, textColor),
    );
  }

  Widget _buildHeader(String title) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          IconButton(onPressed: () => Navigator.pop(context), icon: const Icon(Icons.close, color: Colors.white70)),
          Expanded(
            child: Text(
              title, 
              style: GoogleFonts.cairo(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
            ),
          ),
          const Icon(Icons.verified_user_outlined, color: Colors.white70),
        ],
      ),
    );
  }

  Widget _buildStepIndicator() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 40),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          _stepCircle(0, 'البيانات'),
          _stepLine(),
          _stepCircle(1, 'المقاعد'),
          _stepLine(),
          _stepCircle(2, 'الدفع'),
        ],
      ),
    );
  }

  Widget _stepCircle(int index, String label) {
    bool active = _currentStep >= index;
    bool current = _currentStep == index;
    return Column(
      children: [
        Container(
          width: 25,
          height: 25,
          decoration: BoxDecoration(
            color: active ? Colors.white : Colors.white24,
            shape: BoxShape.circle,
            border: current ? Border.all(color: Colors.white, width: 2) : null,
          ),
          child: Center(
            child: active && _currentStep > index 
              ? const Icon(Icons.check, color: Color(0xFF4F46E5), size: 14)
              : Text('${index + 1}', style: TextStyle(color: active ? const Color(0xFF4F46E5) : Colors.white, fontSize: 12, fontWeight: FontWeight.bold)),
          ),
        ),
        const SizedBox(height: 4),
        Text(label, style: GoogleFonts.cairo(color: Colors.white, fontSize: 10)),
      ],
    );
  }

  Widget _stepLine() => Expanded(child: Container(height: 1, color: Colors.white24, margin: const EdgeInsets.only(bottom: 15)));

  Widget _buildStepContent(bool isDark, Color textColor, Color cardColor) {
    switch (_currentStep) {
      case 0: return _buildUserDataStep(isDark, textColor, cardColor);
      case 1: return _buildSeatSelectionStep(isDark, textColor, cardColor);
      case 2: return _buildPaymentStep(isDark, textColor, cardColor);
      default: return Container();
    }
  }

  // --- STEP 1: USER DATA ---
  Widget _buildUserDataStep(bool isDark, Color textColor, Color cardColor) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: cardColor,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: isDark ? Colors.white10 : Colors.grey.shade100),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Center(child: Text('بيانات المسافرين وعددهم', style: GoogleFonts.cairo(fontSize: 18, fontWeight: FontWeight.bold, color: textColor))),
                const SizedBox(height: 24),
                _buildNumberField('عدد المسافرين', _passengers, (v) => setState(() => _passengers = v), isDark, textColor),
                const SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(child: _buildTextField('الاسم الأول', _firstNameController, 'xxxxx', isDark, textColor)),
                    const SizedBox(width: 12),
                    Expanded(child: _buildTextField('اسم العائلة', _lastNameController, 'xxxxx', isDark, textColor)),
                  ],
                ),
                const SizedBox(height: 16),
                _buildTextField('رقم الهاتف (11 رقماً)', _phoneController, '010xxxxxxxx', isDark, textColor),
                const SizedBox(height: 16),
                _buildTextField('البريد الإلكتروني', _emailController, 'xxxxx@xxx.com', isDark, textColor),
                const SizedBox(height: 16),
                _buildTextField('ملاحظات (اختياري)', _notesController, 'هل تود إخبارنا بشيء؟', isDark, textColor, maxLines: 3),
              ],
            ),
          ),
        ],
      ).animate().fadeIn(),
    );
  }

  Widget _buildNumberField(String label, int val, Function(int) onChanged, bool isDark, Color textColor) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(color: isDark ? Colors.white.withOpacity(0.05) : Colors.grey.shade50, borderRadius: BorderRadius.circular(15)),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: GoogleFonts.cairo(fontSize: 14, color: textColor)),
          Row(
            children: [
              IconButton(onPressed: () => val > 1 ? onChanged(val - 1) : null, icon: Icon(Icons.remove, color: textColor)),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                decoration: BoxDecoration(color: isDark ? Colors.white10 : Colors.white, borderRadius: BorderRadius.circular(10)),
                child: Text('$val', style: TextStyle(fontWeight: FontWeight.bold, color: textColor)),
              ),
              IconButton(onPressed: () => onChanged(val + 1), icon: Icon(Icons.add, color: textColor)),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTextField(String label, TextEditingController ctrl, String hint, bool isDark, Color textColor, {int maxLines = 1, List<TextInputFormatter>? formatters, TextInputType? keyboardType}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: GoogleFonts.cairo(fontSize: 12, color: textColor.withOpacity(0.7))),
        const SizedBox(height: 6),
        TextField(
          controller: ctrl,
          maxLines: maxLines,
          inputFormatters: formatters,
          keyboardType: keyboardType,
          style: GoogleFonts.cairo(fontSize: 13, color: textColor),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(fontSize: 13, color: isDark ? Colors.white24 : Colors.grey),
            filled: true,
            fillColor: isDark ? Colors.white.withOpacity(0.05) : Colors.grey.shade50,
            contentPadding: const EdgeInsets.all(12),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: isDark ? Colors.white10 : Colors.grey.shade200)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: isDark ? Colors.white10 : Colors.grey.shade200)),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: AppColors.primaryOrange)),
          ),
        ),
      ],
    );
  }

  // --- STEP 2: SEATS ---
  Widget _buildSeatSelectionStep(bool isDark, Color textColor, Color cardColor) {
    // 50 seats bus layout
    final totalSeats = 50;
    final bookedSeats = _occupiedSeats;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          Text('اختر مقاعدك', style: GoogleFonts.cairo(fontSize: 18, fontWeight: FontWeight.bold, color: textColor)),
          Text('اختر $_passengers مقعد (تم اختيار ${_selectedSeats.length})', style: GoogleFonts.cairo(color: _selectedSeats.length == _passengers ? Colors.green : Colors.blue, fontSize: 13)),
          const SizedBox(height: 24),
          _buildSeatLegend(textColor),
          const SizedBox(height: 30),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 30),
            decoration: BoxDecoration(
              color: isDark ? Colors.white.withOpacity(0.05) : Colors.grey.shade50,
              borderRadius: BorderRadius.circular(40),
              border: Border.all(color: isDark ? Colors.white10 : Colors.grey.shade200),
            ),
            child: Column(
              children: [
                // Driver area indicator
                Container(
                  width: 60,
                  height: 30,
                  alignment: Alignment.center,
                  decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(10)),
                  child: const Icon(Icons.drive_eta, color: Colors.black54),
                ),
                const SizedBox(height: 20),
                ...List.generate(13, (rowIndex) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: List.generate(5, (colIndex) {
                        // The bus aisle is colIndex == 2, except for the last row (rowIndex == 12)
                        if (rowIndex < 12 && colIndex == 2) return const SizedBox(width: 30);
                        
                        int seatNum = 0;
                        if (rowIndex < 12) {
                          if (colIndex < 2) seatNum = rowIndex * 4 + colIndex + 1;
                          if (colIndex > 2) seatNum = rowIndex * 4 + colIndex;
                        } else {
                          // Last row has 5 seats (49 to 53)
                          seatNum = 12 * 4 + colIndex + 1;
                        }
                        
                        if (seatNum > totalSeats) return const SizedBox(width: 45); // Hide extra seats
                        
                        bool isBooked = bookedSeats.contains(seatNum);
                        bool isSelected = _selectedSeats.contains(seatNum);

                        return GestureDetector(
                          onTap: () {
                            if (isBooked) return;
                            setState(() {
                              if (isSelected) {
                                _selectedSeats.remove(seatNum);
                              } else {
                                if (_selectedSeats.length < _passengers) {
                                  _selectedSeats.add(seatNum);
                                } else {
                                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('لقد اخترت الحد الأقصى للمقاعد ($_passengers)')));
                                }
                              }
                            });
                          },
                          child: Container(
                            width: 40,
                            height: 40,
                            margin: const EdgeInsets.symmetric(horizontal: 4),
                            decoration: BoxDecoration(
                              color: isBooked ? (isDark ? Colors.white12 : Colors.grey[300]) : (isSelected ? const Color(0xFFF97316) : (isDark ? Colors.white10 : Colors.white)),
                              borderRadius: BorderRadius.circular(8),
                              border: Border.all(color: isSelected ? const Color(0xFFF97316) : (isDark ? Colors.white12 : Colors.grey.shade300)),
                            ),
                            child: Center(
                              child: Text('$seatNum', 
                                style: TextStyle(
                                  color: isSelected ? Colors.white : (isBooked ? Colors.grey : textColor),
                                  fontWeight: FontWeight.bold,
                                )),
                            ),
                          ),
                        );
                      }),
                    ),
                  );
                }),
              ],
            ),
          ),
        ],
      ),
    ).animate().fadeIn();
  }

  Widget _buildSeatLegend(Color textColor) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        _legendItem(const Color(0xFF4F46E5), 'متاح', textColor),
        const SizedBox(width: 16),
        _legendItem(Colors.grey.shade300, 'محجوز', textColor),
      ],
    );
  }

  Widget _legendItem(Color color, String label, Color textColor) {
    return Row(
      children: [
        Container(width: 12, height: 12, decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(3))),
        const SizedBox(width: 6),
        Text(label, style: GoogleFonts.cairo(fontSize: 11, color: textColor)),
      ],
    );
  }

  // --- STEP 3: PAYMENT ---
  Widget _buildPaymentStep(bool isDark, Color textColor, Color cardColor) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('الدفع', style: GoogleFonts.cairo(fontSize: 20, fontWeight: FontWeight.bold, color: textColor)),
          const SizedBox(height: 20),
          _buildPaymentToggle(isDark, textColor),
          const SizedBox(height: 24),
          if (_paymentMethod == 'card') ...[
            _buildTextField(
              'رقم البطاقة', 
              _cardNumberController, 
              '0000 0000 0000 0000', 
              isDark, 
              textColor,
              keyboardType: TextInputType.number,
              formatters: [_CardNumberFormatter()],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(child: _buildTextField(
                  'MM/YY', 
                  _expiryController, 
                  '12/26', 
                  isDark, 
                  textColor,
                  keyboardType: TextInputType.number,
                  formatters: [_ExpiryDateFormatter()],
                )),
                const SizedBox(width: 12),
                Expanded(child: _buildTextField(
                  'CVV', 
                  _cvvController, 
                  '***', 
                  isDark, 
                  textColor,
                  keyboardType: TextInputType.number,
                  formatters: [FilteringTextInputFormatter.digitsOnly, LengthLimitingTextInputFormatter(3)],
                )),
              ],
            ),
          ] else ...[
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: AppColors.primaryOrange.withOpacity(0.1),
                borderRadius: BorderRadius.circular(15),
                border: Border.all(color: AppColors.primaryOrange.withOpacity(0.3)),
              ),
              child: Row(
                children: [
                  const Icon(Icons.account_balance_wallet, color: AppColors.primaryOrange, size: 30),
                  const SizedBox(width: 15),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('رصيدك الحالي', style: GoogleFonts.cairo(fontSize: 12, color: textColor.withOpacity(0.7))),
                      Text('${_userBalance.toStringAsFixed(2)} ج.م', style: GoogleFonts.cairo(fontSize: 18, fontWeight: FontWeight.bold, color: textColor)),
                    ],
                  ),
                ],
              ),
            ),
            if (_userBalance < _totalPrice)
              Padding(
                padding: const EdgeInsets.only(top: 12),
                child: Text('رصيدك غير كافٍ لإتمام العملية', style: GoogleFonts.cairo(color: Colors.red, fontSize: 12)),
              ),
          ],
          const SizedBox(height: 24),
          _buildCouponSection(isDark, textColor, cardColor),
          const SizedBox(height: 20),
          _buildPriceSummary(isDark, textColor, cardColor),
        ],
      ),
    ).animate().fadeIn();
  }

  Widget _buildPaymentToggle(bool isDark, Color textColor) {
    return Container(
      padding: const EdgeInsets.all(4),
      decoration: BoxDecoration(color: isDark ? Colors.white10 : Colors.grey.shade100, borderRadius: BorderRadius.circular(15)),
      child: Row(
        children: [
          Expanded(
            child: GestureDetector(
              onTap: () => setState(() => _paymentMethod = 'card'),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: _paymentMethod == 'card' ? (isDark ? AppColors.cardDark : Colors.white) : Colors.transparent,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: _paymentMethod == 'card' ? [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4)] : null,
                ),
                child: Center(child: Text('بطاقة بنكية', style: TextStyle(fontWeight: _paymentMethod == 'card' ? FontWeight.bold : FontWeight.normal, color: _paymentMethod == 'card' ? textColor : textColor.withOpacity(0.5)))),
              ),
            ),
          ),
          Expanded(
            child: GestureDetector(
              onTap: () => setState(() => _paymentMethod = 'wallet'),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: _paymentMethod == 'wallet' ? (isDark ? AppColors.cardDark : Colors.white) : Colors.transparent,
                  borderRadius: BorderRadius.circular(12),
                  boxShadow: _paymentMethod == 'wallet' ? [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4)] : null,
                ),
                child: Center(child: Text('محفظة', style: TextStyle(fontWeight: _paymentMethod == 'wallet' ? FontWeight.bold : FontWeight.normal, color: _paymentMethod == 'wallet' ? textColor : textColor.withOpacity(0.5)))),
              ),
            ),
          ),
        ],
      ),
    );
  }

  double get _basePrice {
    final priceStr = widget.trip['price']?.toString() ?? '0';
    return (double.tryParse(priceStr.replaceAll(RegExp(r'[^0-9.]'), '')) ?? 0.0) * _passengers;
  }

  double get _totalPrice => _basePrice - _discountAmount;

  Future<void> _validateCoupon() async {
    final code = _couponController.text.trim();
    if (code.isEmpty) return;
    setState(() {
      _isValidatingCoupon = true;
      _couponError = null;
      _couponSuccess = null;
    });
    try {
      final api = ref.read(apiServiceProvider);
      final res = await api.post('/coupons/validate', data: {
        'code': code,
        'tripId': widget.trip['_id'],
        'amount': _basePrice,
      });
      if (res.statusCode == 200) {
        final data = res.data;
        final discount = (data['discountAmount'] ?? 0).toDouble();
        setState(() {
          _appliedCouponCode = code;
          _discountAmount = discount;
          _couponSuccess = 'تم تطبيق الخصم بنجاح! وفرت ${discount.toStringAsFixed(0)} ج.م';
        });
      }
    } catch (e) {
      setState(() {
        _appliedCouponCode = null;
        _discountAmount = 0;
        _couponError = 'كود الخصم غير صحيح أو منتهي الصلاحية';
      });
    } finally {
      setState(() => _isValidatingCoupon = false);
    }
  }

  Widget _buildCouponSection(bool isDark, Color textColor, Color cardColor) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? Colors.white.withOpacity(0.05) : Colors.grey.shade50,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(
          color: _appliedCouponCode != null ? Colors.green.shade300 : (isDark ? Colors.white10 : Colors.grey.shade200),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.local_offer_outlined, color: _appliedCouponCode != null ? Colors.green : const Color(0xFF4F46E5), size: 20),
              const SizedBox(width: 8),
              Text('كود الخصم', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, color: textColor, fontSize: 14)),
            ],
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _couponController,
                  enabled: _appliedCouponCode == null,
                  style: GoogleFonts.cairo(fontSize: 13, color: textColor, letterSpacing: 2),
                  textCapitalization: TextCapitalization.characters,
                  decoration: InputDecoration(
                    hintText: 'أدخل كود الخصم',
                    hintStyle: GoogleFonts.cairo(color: Colors.grey, fontSize: 13),
                    filled: true,
                    fillColor: isDark ? Colors.white.withOpacity(0.05) : Colors.white,
                    contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: isDark ? Colors.white10 : Colors.grey.shade200)),
                    enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: isDark ? Colors.white10 : Colors.grey.shade200)),
                    focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: Color(0xFF4F46E5))),
                    suffixIcon: _appliedCouponCode != null
                        ? const Icon(Icons.check_circle, color: Colors.green)
                        : null,
                  ),
                ),
              ),
              const SizedBox(width: 10),
              _appliedCouponCode != null
                  ? GestureDetector(
                      onTap: () {
                        setState(() {
                          _appliedCouponCode = null;
                          _discountAmount = 0;
                          _couponController.clear();
                          _couponSuccess = null;
                          _couponError = null;
                        });
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        decoration: BoxDecoration(
                          color: Colors.red.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(10),
                          border: Border.all(color: Colors.red.withOpacity(0.3)),
                        ),
                        child: Text('إلغاء', style: GoogleFonts.cairo(color: Colors.red, fontWeight: FontWeight.bold, fontSize: 13)),
                      ),
                    )
                  : GestureDetector(
                      onTap: _isValidatingCoupon ? null : _validateCoupon,
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                        decoration: BoxDecoration(
                          color: const Color(0xFF4F46E5),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: _isValidatingCoupon
                            ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                            : Text('تطبيق', style: GoogleFonts.cairo(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 13)),
                      ),
                    ),
            ],
          ),
          if (_couponError != null) ...[  
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.error_outline, color: Colors.red, size: 16),
                const SizedBox(width: 6),
                Text(_couponError!, style: GoogleFonts.cairo(color: Colors.red, fontSize: 12)),
              ],
            ),
          ],
          if (_couponSuccess != null) ...[  
            const SizedBox(height: 8),
            Row(
              children: [
                const Icon(Icons.check_circle_outline, color: Colors.green, size: 16),
                const SizedBox(width: 6),
                Text(_couponSuccess!, style: GoogleFonts.cairo(color: Colors.green, fontSize: 12, fontWeight: FontWeight.bold)),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildPriceSummary(bool isDark, Color textColor, Color cardColor) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? Colors.white.withOpacity(0.05) : Colors.grey.shade50,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: isDark ? Colors.white10 : Colors.grey.shade100),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
               Text('التكلفة (x$_passengers)', style: GoogleFonts.cairo(fontSize: 14, color: textColor)),
               Text('${(_basePrice / _passengers).toStringAsFixed(0)} ج.م', style: TextStyle(fontWeight: FontWeight.bold, color: textColor)),
            ],
          ),
          if (_discountAmount > 0) ...[  
            const SizedBox(height: 8),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    const Icon(Icons.local_offer, color: Colors.green, size: 14),
                    const SizedBox(width: 6),
                    Text('خصم كود "$_appliedCouponCode"', style: GoogleFonts.cairo(fontSize: 13, color: Colors.green)),
                  ],
                ),
                Text('- ${_discountAmount.toStringAsFixed(0)} ج.م', style: GoogleFonts.cairo(color: Colors.green, fontWeight: FontWeight.bold)),
              ],
            ),
          ],
          Divider(height: 30, color: isDark ? Colors.white10 : Colors.grey.shade200),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
               Text('الإجمالي', style: GoogleFonts.cairo(fontSize: 16, fontWeight: FontWeight.bold, color: textColor)),
               Text('${_totalPrice.toStringAsFixed(0)} ج.م', style: GoogleFonts.cairo(fontSize: 22, fontWeight: FontWeight.w900, color: const Color(0xFF4F46E5))),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBottomNav(bool isDark, Color bgColor, Color textColor) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: isDark ? AppColors.cardDark : Colors.white,
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)],
      ),
      child: Row(
        children: [
          if (_currentStep > 0)
            Expanded(
              child: OutlinedButton(
                onPressed: _isLoading ? null : () => setState(() => _currentStep--),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
                  side: BorderSide(color: isDark ? Colors.white24 : Colors.grey.shade300),
                ),
                child: Text('رجوع', style: GoogleFonts.cairo(color: textColor)),
              ),
            ),
          if (_currentStep > 0) const SizedBox(width: 12),
          Expanded(
            flex: 2,
            child: ElevatedButton(
              onPressed: _isLoading ? null : () async {
                if (_currentStep == 0) {
                  // Validate step 0
                  if (_phoneController.text.isEmpty || _firstNameController.text.isEmpty || _lastNameController.text.isEmpty) {
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('برجاء إكمال جميع البيانات المطلوبة')));
                    return;
                  }
                  await _fetchOccupiedSeats();
                  setState(() => _currentStep++);
                } else if (_currentStep == 1) {
                  if (_selectedSeats.length != _passengers) {
                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('الرجاء اختيار $_passengers مقاعد')));
                    return;
                  }
                  setState(() => _currentStep++);
                } else {
                  await _submitBooking();
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF4F46E5),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
              ),
              child: _isLoading 
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : Text(
                      _currentStep == 2 ? 'تأكيد الحجز والدفع الآن' : 'الخطوة التالية',
                      style: GoogleFonts.cairo(fontWeight: FontWeight.bold),
                    ),
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _submitBooking() async {
    // Basic Frontend Validation
    if (_phoneController.text.isEmpty || _firstNameController.text.isEmpty || _lastNameController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('برجاء إكمال جميع البيانات المطلوبة (الاسم والهاتف)')));
      return;
    }

    if (_phoneController.text.length < 11) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('رقم الهاتف يجب أن يكون 11 رقماً')));
      return;
    }

    if (_paymentMethod == 'card') {
      if (_cardNumberController.text.replaceAll(' ', '').length < 16) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('رقم البطاقة غير مكتمل')));
        return;
      }
      if (_expiryController.text.length < 5) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('تاريخ انتهاء البطاقة غير صحيح')));
        return;
      }
      if (_cvvController.text.length < 3) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('رقم CVV غير صحيح')));
        return;
      }
    } else if (_paymentMethod == 'wallet') {
      if (_userBalance < _totalPrice) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('رصيد المحفظة غير كافٍ')));
        return;
      }
    }

    setState(() => _isLoading = true);
    try {
      final api = ref.read(apiServiceProvider);
      
      // 1. Create Booking
      final bookingResponse = await api.post('/bookings', data: {
        'tripId': widget.trip['_id'],
        'numberOfPeople': _passengers,
        'bookingDate': widget.trip['startDate'] ?? DateTime.now().toIso8601String(),
        'userPhone': _phoneController.text.trim(),
        'firstName': _firstNameController.text.trim(),
        'lastName': _lastNameController.text.trim(),
        'email': _emailController.text.trim(),
        'specialRequests': _notesController.text.trim(),
        'selectedSeats': _selectedSeats.map((s) => s.toString()).toList(),
        'paymentMethod': _paymentMethod,
      });

      if (bookingResponse.statusCode == 201) {
        if (_paymentMethod == 'wallet') {
          _showSuccess(isPaymentPending: false);
          return;
        }

        final bookingId = bookingResponse.data['booking']['_id'];
        
        // 2. Create Payment Intention (Paymob)
        final paymobResponse = await api.post('/paymob/create-payment-intention', data: {
          'bookingId': bookingId,
          'paymentMethod': 'card',
        });

        if (paymobResponse.statusCode == 200) {
          final iframeId = paymobResponse.data['iframeId'] ?? 870420; 
          final paymentKey = paymobResponse.data['paymentKey'];
          final url = Uri.parse('https://accept.paymob.com/api/acceptance/iframes/$iframeId?payment_token=$paymentKey');
          
          if (await canLaunchUrl(url)) {
            await PendingPaymentStore.set(bookingId);
            await launchUrl(url, mode: LaunchMode.externalApplication);
            if (mounted) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    'أكمل الدفع في المتصفح ثم ارجع للتطبيق — سنتحقق تلقائياً من الحالة.',
                    style: GoogleFonts.cairo(fontWeight: FontWeight.bold),
                  ),
                  backgroundColor: Colors.orange.shade800,
                  behavior: SnackBarBehavior.floating,
                  duration: const Duration(seconds: 6),
                ),
              );
            }
          } else {
            throw Exception('لا يمكن فتح صفحة الدفع');
          }
        } else {
          throw Exception('حدث خطأ في تهيئة الدفع');
        }
      } else {
         // Show specific error from backend if available
         final errorMsg = bookingResponse.data != null && bookingResponse.data['error'] != null 
            ? bookingResponse.data['error'] 
            : 'حدث خطأ غير متوقع (400)';
         throw Exception(errorMsg);
      }
    } catch (e) {
      if (mounted) {
        String msg;
        if (e is DioException) {
          msg = handleDioError(e).message;
        } else {
          msg = e.toString().replaceAll('Exception: ', '');
        }
        
        _showErrorSnackBar(msg);
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }



  Future<void> _fetchOccupiedSeats() async {
    setState(() => _isLoading = true);
    try {
      final api = ref.read(apiServiceProvider);
      final response = await api.get('/bookings/trip/${widget.trip['_id']}');
      if (response.statusCode == 200) {
        final List bookings = response.data;
        final List<int> occupied = [];
        for (var b in bookings) {
          if (b['selectedSeats'] != null) {
            for (var s in b['selectedSeats']) {
              final seatNum = int.tryParse(s.toString());
              if (seatNum != null) occupied.add(seatNum);
            }
          }
        }
        setState(() {
          _occupiedSeats = occupied;
        });
      }
    } catch (e) {
      debugPrint('Error fetching occupied seats: $e');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  void _showErrorSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Row(
          children: [
            const Icon(Icons.error_outline, color: Colors.white),
            const SizedBox(width: 12),
            Expanded(child: Text(message, style: GoogleFonts.cairo(color: Colors.white, fontWeight: FontWeight.bold))),
          ],
        ),
        backgroundColor: Colors.red.shade800,
        behavior: SnackBarBehavior.floating,
        margin: const EdgeInsets.all(16),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        duration: const Duration(seconds: 4),
      ),
    );
  }

  void _showSuccess({bool isPaymentPending = false}) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Icon(isPaymentPending ? Icons.hourglass_top : Icons.check_circle, color: isPaymentPending ? Colors.orange : Colors.green, size: 60),
        content: Text(
          isPaymentPending 
            ? 'تم حفظ حجزك وهو بانتظار إتمام عملية الدفع. يرجى إتمام الدفع عبر الصفحة التي فُتحت.'
            : 'تم تأكيد حجزك بنجاح! شكراً لاختيارك رحلتي.', 
          textAlign: TextAlign.center, 
          style: GoogleFonts.cairo()
        ),
        actions: [
          TextButton(onPressed: () {
            Navigator.pop(context); // Close dialog
            Navigator.pop(context); // Go back from booking page
          }, child: const Text('حسناً')),
        ],
      ),
    );
  }
}

class _CardNumberFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(TextEditingValue oldValue, TextEditingValue newValue) {
    var text = newValue.text.replaceAll(' ', '');
    if (text.length > 16) text = text.substring(0, 16);
    
    var buffer = StringBuffer();
    for (int i = 0; i < text.length; i++) {
      buffer.write(text[i]);
      var nonZeroIndex = i + 1;
      if (nonZeroIndex % 4 == 0 && nonZeroIndex != text.length) {
        buffer.write(' ');
      }
    }
    
    var string = buffer.toString();
    return newValue.copyWith(
      text: string,
      selection: TextSelection.collapsed(offset: string.length),
    );
  }
}

class _ExpiryDateFormatter extends TextInputFormatter {
  @override
  TextEditingValue formatEditUpdate(TextEditingValue oldValue, TextEditingValue newValue) {
    var text = newValue.text.replaceAll('/', '');
    if (text.length > 4) text = text.substring(0, 4);
    
    var buffer = StringBuffer();
    for (int i = 0; i < text.length; i++) {
      buffer.write(text[i]);
      var nonZeroIndex = i + 1;
      if (nonZeroIndex == 2 && nonZeroIndex != text.length) {
        buffer.write('/');
      }
    }
    
    var string = buffer.toString();
    return newValue.copyWith(
      text: string,
      selection: TextSelection.collapsed(offset: string.length),
    );
  }
}

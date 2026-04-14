import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../theme/app_colors.dart';

class CorporateBookingPage extends StatefulWidget {
  final Map<String, dynamic> trip;
  CorporateBookingPage({super.key, required this.trip}); // Removed const

  @override
  State<CorporateBookingPage> createState() => _CorporateBookingPageState();
}

class _CorporateBookingPageState extends State<CorporateBookingPage> {
  int _currentStep = 0;
  int _passengers = 1;
  int? _selectedSeat;
  
  late TextEditingController _phoneController;
  late TextEditingController _emailController;
  late TextEditingController _firstNameController;
  late TextEditingController _lastNameController;
  late TextEditingController _notesController;

  @override
  void initState() {
    super.initState();
    _phoneController = TextEditingController();
    _emailController = TextEditingController();
    _firstNameController = TextEditingController();
    _lastNameController = TextEditingController();
    _notesController = TextEditingController();
  }

  @override
  void dispose() {
    _phoneController.dispose();
    _emailController.dispose();
    _firstNameController.dispose();
    _lastNameController.dispose();
    _notesController.dispose();
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
        preferredSize: const Size.fromHeight(100),
        child: Container(
          decoration: BoxDecoration( // Removed const
            color: Color(0xFF4F46E5), // Indigo blue header
            borderRadius: BorderRadius.vertical(bottom: Radius.circular(20)),
          ),
          child: SafeArea(
            child: Column(
              children: [
                _buildHeader(widget.trip['title'] ?? 'تأكيد الحجز'),
                const SizedBox(height: 10),
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
                    Expanded(child: _buildTextField('الاسم الأول', _firstNameController, 'Youssef', isDark, textColor)),
                    const SizedBox(width: 12),
                    Expanded(child: _buildTextField('اسم العائلة', _lastNameController, 'Elkhyoty', isDark, textColor)),
                  ],
                ),
                const SizedBox(height: 16),
                _buildTextField('رقم الهاتف (11 رقماً)', _phoneController, '01015985881', isDark, textColor),
                const SizedBox(height: 16),
                _buildTextField('البريد الإلكتروني', _emailController, 'youssef@gmail.com', isDark, textColor),
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

  Widget _buildTextField(String label, TextEditingController ctrl, String hint, bool isDark, Color textColor, {int maxLines = 1}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: GoogleFonts.cairo(fontSize: 12, color: textColor.withOpacity(0.7))),
        const SizedBox(height: 6),
        TextField(
          controller: ctrl,
          maxLines: maxLines,
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
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        children: [
          Text('اختر مقاعدك', style: GoogleFonts.cairo(fontSize: 18, fontWeight: FontWeight.bold, color: textColor)),
          Text('اختر $_passengers مقعد (تم اختيار ${_selectedSeat != null ? 1 : 0})', style: GoogleFonts.cairo(color: Colors.blue, fontSize: 13)),
          const SizedBox(height: 24),
          _buildSeatLegend(textColor),
          const SizedBox(height: 30),
          Container(
            padding: const EdgeInsets.all(30),
            decoration: BoxDecoration(
              color: isDark ? Colors.white.withOpacity(0.05) : Colors.grey.shade50,
              borderRadius: BorderRadius.circular(40),
              border: Border.all(color: isDark ? Colors.white10 : Colors.grey.shade200),
            ),
            child: Wrap(
              spacing: 15,
              runSpacing: 15,
              alignment: WrapAlignment.center,
              children: List.generate(28, (index) {
                bool isSelected = _selectedSeat == index;
                bool isBooked = index == 14; // Mock booked seat
                return GestureDetector(
                  onTap: () => !isBooked ? setState(() => _selectedSeat = index) : null,
                  child: Container(
                    width: 45,
                    height: 45,
                    decoration: BoxDecoration(
                      color: isBooked ? (isDark ? Colors.white12 : Colors.grey[300]) : (isSelected ? const Color(0xFFF97316) : (isDark ? Colors.white10 : Colors.white)),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: isSelected ? const Color(0xFFF97316) : (isDark ? Colors.white12 : Colors.grey.shade300)),
                    ),
                    child: Center(
                      child: Text('${index + 1}', 
                        style: TextStyle(
                          color: isSelected ? Colors.white : (isBooked ? Colors.grey : textColor),
                          fontWeight: FontWeight.bold,
                        )),
                    ),
                  ),
                );
              }),
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
          _buildTextField('رقم البطاقة', TextEditingController(), '0000 0000 0000 0000', isDark, textColor),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(child: _buildTextField('MM/YY', TextEditingController(), '12/26', isDark, textColor)),
              const SizedBox(width: 12),
              Expanded(child: _buildTextField('CVV', TextEditingController(), '***', isDark, textColor)),
            ],
          ),
          const SizedBox(height: 32),
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
          Expanded(child: Container(
            padding: const EdgeInsets.symmetric(vertical: 12),
            decoration: BoxDecoration(color: isDark ? AppColors.cardDark : Colors.white, borderRadius: BorderRadius.circular(12)),
            child: Center(child: Text('بطاقة بنكية', style: TextStyle(fontWeight: FontWeight.bold, color: textColor))),
          )),
          Expanded(child: Center(child: Text('محفظة', style: TextStyle(color: textColor.withOpacity(0.5))))),
        ],
      ),
    );
  }

  double get _totalPrice {
    final priceStr = widget.trip['price']?.toString() ?? '0';
    final price = double.tryParse(priceStr.replaceAll(RegExp(r'[^0-9.]'), '')) ?? 0.0;
    return price * _passengers;
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
               Text('${(_totalPrice / _passengers).toStringAsFixed(0)} ج.م', style: TextStyle(fontWeight: FontWeight.bold, color: textColor)),
            ],
          ),
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
                onPressed: () => setState(() => _currentStep--),
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
              onPressed: () {
                if (_currentStep < 2) {
                  setState(() => _currentStep++);
                } else {
                  _showSuccess();
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF4F46E5),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(15)),
              ),
              child: Text(
                _currentStep == 2 ? 'تأكيد الحجز والدفع الآن' : 'الخطوة التالية',
                style: GoogleFonts.cairo(fontWeight: FontWeight.bold),
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showSuccess() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Icon(Icons.check_circle, color: Colors.green, size: 60),
        content: Text('تم تأكيد حجزك بنجاح! شكراً لاختيارك رحلتي.', textAlign: TextAlign.center, style: GoogleFonts.cairo()),
        actions: [
          TextButton(onPressed: () {
            Navigator.pop(context);
            Navigator.pop(context);
          }, child: const Text('حسناً')),
        ],
      ),
    );
  }
}

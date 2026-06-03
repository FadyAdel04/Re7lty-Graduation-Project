import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'dart:io';
import '../../services/api_service.dart';
import '../../providers/api_provider.dart';
import '../../theme/app_colors.dart';

class CompanySettingsPage extends ConsumerStatefulWidget {
  const CompanySettingsPage({super.key});

  @override
  ConsumerState<CompanySettingsPage> createState() => _CompanySettingsPageState();
}

class _CompanySettingsPageState extends ConsumerState<CompanySettingsPage> {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = true;
  bool _isSaving = false;

  // Form controllers
  final _nameCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  final _tagsCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _whatsappCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _websiteCtrl = TextEditingController();
  final _addressCtrl = TextEditingController();

  String _logoUrl = '';
  File? _newLogoFile;
  String _selectedColor = 'from-orange-500 to-red-500';

  final List<Map<String, dynamic>> _colorPresets = [
    {'label': 'برتقالي', 'value': 'from-orange-500 to-red-500', 'colors': [Color(0xFFF97316), Color(0xFFEF4444)]},
    {'label': 'أزرق', 'value': 'from-blue-500 to-cyan-500', 'colors': [Color(0xFF3B82F6), Color(0xFF06B6D4)]},
    {'label': 'أخضر', 'value': 'from-green-500 to-emerald-500', 'colors': [Color(0xFF22C55E), Color(0xFF10B981)]},
    {'label': 'بنفسجي', 'value': 'from-purple-500 to-pink-500', 'colors': [Color(0xFFA855F7), Color(0xFFEC4899)]},
    {'label': 'ذهبي', 'value': 'from-yellow-500 to-orange-500', 'colors': [Color(0xFFEAB308), Color(0xFFF97316)]},
    {'label': 'رمادي', 'value': 'from-gray-700 to-gray-900', 'colors': [Color(0xFF374151), Color(0xFF111827)]},
  ];

  @override
  void initState() {
    super.initState();
    _loadCompanyData();
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _descCtrl.dispose();
    _tagsCtrl.dispose();
    _phoneCtrl.dispose();
    _whatsappCtrl.dispose();
    _emailCtrl.dispose();
    _websiteCtrl.dispose();
    _addressCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadCompanyData() async {
    setState(() => _isLoading = true);
    try {
      final api = ref.read(apiServiceProvider);
      final res = await api.get('/corporate/companies/me');
      if (res.statusCode == 200) {
        final data = res.data as Map<String, dynamic>;
        _nameCtrl.text = data['name'] ?? '';
        _descCtrl.text = data['description'] ?? '';
        _tagsCtrl.text = (data['tags'] as List?)?.join(', ') ?? '';
        _logoUrl = data['logo'] ?? '';
        _selectedColor = data['color'] ?? 'from-orange-500 to-red-500';
        final contact = data['contactInfo'] as Map<String, dynamic>? ?? {};
        _phoneCtrl.text = contact['phone'] ?? '';
        _whatsappCtrl.text = contact['whatsapp'] ?? '';
        _emailCtrl.text = contact['email'] ?? '';
        _websiteCtrl.text = contact['website'] ?? '';
        _addressCtrl.text = contact['address'] ?? '';
      }
    } catch (e) {
      debugPrint('Error loading company: $e');
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _pickLogo() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery, imageQuality: 80);
    if (picked != null) setState(() => _newLogoFile = File(picked.path));
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _isSaving = true);
    try {
      final api = ref.read(apiServiceProvider);
      var logo = _logoUrl;
      if (_newLogoFile != null) {
        logo = await ref.read(mediaUploadServiceProvider).uploadImageFile(_newLogoFile!);
      }
      final tags = _tagsCtrl.text.split(',').map((t) => t.trim()).where((t) => t.isNotEmpty).toList();
      await api.put('/corporate/companies/me', data: {
        'name': _nameCtrl.text,
        'description': _descCtrl.text,
        'tags': tags,
        'color': _selectedColor,
        if (logo.isNotEmpty) 'logo': logo,
        'contactInfo': {
          'phone': _phoneCtrl.text,
          'whatsapp': _whatsappCtrl.text,
          'email': _emailCtrl.text,
          'website': _websiteCtrl.text,
          'address': _addressCtrl.text,
        }
      });
      if (mounted) {
        setState(() {
          if (logo.isNotEmpty) _logoUrl = logo;
          _newLogoFile = null;
        });
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('تم حفظ التعديلات بنجاح ✓', style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
          backgroundColor: Colors.green,
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ));
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('حدث خطأ أثناء الحفظ', style: GoogleFonts.cairo()),
          backgroundColor: Colors.red,
        ));
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Text('إعدادات الشركة', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 18)),
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new, size: 18),
          onPressed: () => Navigator.pop(context),
        ),
        bottom: const PreferredSize(
          preferredSize: Size.fromHeight(1),
          child: Divider(height: 1),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: AppColors.primaryOrange))
          : Form(
              key: _formKey,
              child: ListView(
                padding: const EdgeInsets.all(20),
                children: [
                  _buildSection(
                    title: 'المعلومات الأساسية',
                    icon: Icons.business_outlined,
                    color: Colors.indigo,
                    children: [
                      _buildField(
                        controller: _nameCtrl,
                        label: 'اسم الشركة *',
                        hint: 'شركة دولية',
                        validator: (v) => v!.isEmpty ? 'مطلوب' : null,
                      ),
                      const SizedBox(height: 16),
                      _buildField(
                        controller: _descCtrl,
                        label: 'وصف الشركة *',
                        hint: 'رحلات شاملة للأكل والتنقلات جميعها',
                        maxLines: 3,
                        validator: (v) => v!.isEmpty ? 'مطلوب' : null,
                      ),
                      const SizedBox(height: 16),
                      _buildField(
                        controller: _tagsCtrl,
                        label: 'تصنيفات الرحلات',
                        hint: 'مثال: سفاري, شواطئ, تخييم, عائلي',
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  _buildSection(
                    title: 'الشعار والهوية',
                    icon: Icons.palette_outlined,
                    color: Colors.purple,
                    children: [
                      // Logo picker
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('شعار الشركة', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.grey[700])),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              Container(
                                width: 80,
                                height: 80,
                                decoration: BoxDecoration(
                                  color: Colors.grey[100],
                                  borderRadius: BorderRadius.circular(16),
                                  border: Border.all(color: Colors.grey.shade200),
                                  image: _newLogoFile != null
                                      ? DecorationImage(image: FileImage(_newLogoFile!), fit: BoxFit.cover)
                                      : (_logoUrl.isNotEmpty ? DecorationImage(image: NetworkImage(_logoUrl), fit: BoxFit.cover) : null),
                                ),
                                child: _newLogoFile == null && _logoUrl.isEmpty
                                    ? Icon(Icons.business, color: Colors.grey[400], size: 32)
                                    : null,
                              ),
                              const SizedBox(width: 16),
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  OutlinedButton.icon(
                                    onPressed: _pickLogo,
                                    icon: const Icon(Icons.upload_outlined, size: 18),
                                    label: Text('رفع شعار جديد', style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
                                    style: OutlinedButton.styleFrom(
                                      foregroundColor: Colors.indigo,
                                      side: const BorderSide(color: Colors.indigo),
                                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                    ),
                                  ),
                                  if (_logoUrl.isNotEmpty) ...[
                                    const SizedBox(height: 4),
                                    Text('Logo', style: GoogleFonts.cairo(fontSize: 11, color: Colors.grey)),
                                  ],
                                ],
                              ),
                            ],
                          ),
                        ],
                      ),
                      const SizedBox(height: 20),
                      // Color picker
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('طابع الشركة اللوني *', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.grey[700])),
                          const SizedBox(height: 12),
                          Wrap(
                            spacing: 10,
                            runSpacing: 10,
                            children: _colorPresets.map((preset) {
                              final isSelected = _selectedColor == preset['value'];
                              final colors = preset['colors'] as List<Color>;
                              return GestureDetector(
                                onTap: () => setState(() => _selectedColor = preset['value']),
                                child: Container(
                                  width: 50,
                                  height: 50,
                                  decoration: BoxDecoration(
                                    gradient: LinearGradient(colors: colors),
                                    borderRadius: BorderRadius.circular(14),
                                    border: isSelected
                                        ? Border.all(color: Colors.black, width: 3)
                                        : Border.all(color: Colors.transparent),
                                    boxShadow: isSelected
                                        ? [BoxShadow(color: colors[0].withOpacity(0.4), blurRadius: 8, offset: const Offset(0, 3))]
                                        : [],
                                  ),
                                  child: isSelected
                                      ? const Icon(Icons.check, color: Colors.white, size: 20)
                                      : null,
                                ),
                              );
                            }).toList(),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),
                  _buildSection(
                    title: 'بيانات التواصل',
                    icon: Icons.contact_phone_outlined,
                    color: Colors.green,
                    children: [
                      _buildField(controller: _phoneCtrl, label: 'رقم الهاتف *', hint: '01xxxxxxxxx', keyboardType: TextInputType.phone, validator: (v) => v!.isEmpty ? 'مطلوب' : null, prefixIcon: Icons.phone_outlined),
                      const SizedBox(height: 16),
                      _buildField(controller: _whatsappCtrl, label: 'واتساب *', hint: '01xxxxxxxxx', keyboardType: TextInputType.phone, validator: (v) => v!.isEmpty ? 'مطلوب' : null, prefixIcon: Icons.chat_outlined),
                      const SizedBox(height: 16),
                      _buildField(controller: _emailCtrl, label: 'البريد الإلكتروني *', hint: 'company@example.com', keyboardType: TextInputType.emailAddress, validator: (v) => v!.isEmpty ? 'مطلوب' : null, prefixIcon: Icons.email_outlined),
                      const SizedBox(height: 16),
                      _buildField(controller: _websiteCtrl, label: 'الموقع الإلكتروني', hint: 'www.company.com', prefixIcon: Icons.language_outlined),
                      const SizedBox(height: 16),
                      _buildField(controller: _addressCtrl, label: 'العنوان', hint: 'المدينة، الحي...', prefixIcon: Icons.location_on_outlined),
                    ],
                  ),
                  const SizedBox(height: 32),
                  // Save button
                  SizedBox(
                    height: 56,
                    child: ElevatedButton(
                      onPressed: _isSaving ? null : _save,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.indigo,
                        foregroundColor: Colors.white,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        elevation: 0,
                      ),
                      child: _isSaving
                          ? const CircularProgressIndicator(color: Colors.white, strokeWidth: 2)
                          : Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.save_outlined, size: 20),
                                const SizedBox(width: 8),
                                Text('حفظ التعديلات', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 16)),
                              ],
                            ),
                    ),
                  ),
                  const SizedBox(height: 40),
                ],
              ),
            ),
    );
  }

  Widget _buildSection({required String title, required IconData icon, required Color color, required List<Widget> children}) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 12, offset: const Offset(0, 4))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: color.withOpacity(0.05),
              borderRadius: const BorderRadius.only(topLeft: Radius.circular(20), topRight: Radius.circular(20)),
              border: Border(bottom: BorderSide(color: color.withOpacity(0.1))),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(10)),
                  child: Icon(icon, color: color, size: 20),
                ),
                const SizedBox(width: 12),
                Text(title, style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 15, color: color)),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: children),
          ),
        ],
      ),
    );
  }

  Widget _buildField({
    required TextEditingController controller,
    required String label,
    required String hint,
    int maxLines = 1,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
    IconData? prefixIcon,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 13, color: Colors.grey[700])),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          maxLines: maxLines,
          keyboardType: keyboardType,
          validator: validator,
          style: GoogleFonts.cairo(fontSize: 14),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: GoogleFonts.cairo(color: Colors.grey[400], fontSize: 13),
            prefixIcon: prefixIcon != null ? Icon(prefixIcon, size: 20, color: Colors.grey) : null,
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade200)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: BorderSide(color: Colors.grey.shade200)),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(12), borderSide: const BorderSide(color: Colors.indigo, width: 2)),
            filled: true,
            fillColor: Colors.grey[50],
          ),
        ),
      ],
    );
  }
}

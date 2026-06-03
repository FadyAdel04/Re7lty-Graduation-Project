import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../models/user.dart';
import '../../providers/api_provider.dart';
import '../../theme/app_colors.dart';

/// Edit bio & location for own profile.
class ProfileEditSheet extends ConsumerStatefulWidget {
  final User user;

  const ProfileEditSheet({super.key, required this.user});

  @override
  ConsumerState<ProfileEditSheet> createState() => _ProfileEditSheetState();
}

class _ProfileEditSheetState extends ConsumerState<ProfileEditSheet> {
  late final TextEditingController _bioCtrl;
  late final TextEditingController _locationCtrl;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _bioCtrl = TextEditingController(text: widget.user.bio ?? '');
    _locationCtrl = TextEditingController(text: widget.user.location ?? '');
  }

  @override
  void dispose() {
    _bioCtrl.dispose();
    _locationCtrl.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() => _saving = true);
    try {
      await ref.read(userServiceProvider).updateProfile({
        'bio': _bioCtrl.text.trim(),
        'location': _locationCtrl.text.trim(),
      });
      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('فشل الحفظ: $e')));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(8)),
            ),
          ),
          const SizedBox(height: 16),
          Text('تعديل الملف الشخصي', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 18), textAlign: TextAlign.right),
          const SizedBox(height: 16),
          TextField(
            controller: _bioCtrl,
            maxLines: 4,
            textAlign: TextAlign.right,
            decoration: InputDecoration(
              labelText: 'نبذة عنك',
              labelStyle: GoogleFonts.cairo(),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _locationCtrl,
            textAlign: TextAlign.right,
            decoration: InputDecoration(
              labelText: 'الموقع',
              labelStyle: GoogleFonts.cairo(),
              prefixIcon: const Icon(Icons.location_on_outlined),
              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
            ),
          ),
          const SizedBox(height: 20),
          FilledButton(
            onPressed: _saving ? null : _save,
            style: FilledButton.styleFrom(
              backgroundColor: AppColors.primaryOrange,
              padding: const EdgeInsets.symmetric(vertical: 14),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
            child: _saving
                ? const SizedBox(height: 22, width: 22, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                : Text('حفظ', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, color: Colors.white)),
          ),
        ],
      ),
    );
  }
}

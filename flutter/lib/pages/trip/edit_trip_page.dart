import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';

import '../../models/trip.dart';
import '../../providers/api_provider.dart';
import '../../providers/trip_provider.dart';
import '../../theme/app_colors.dart';

class EditTripPage extends ConsumerStatefulWidget {
  final String tripId;

  const EditTripPage({super.key, required this.tripId});

  @override
  ConsumerState<EditTripPage> createState() => _EditTripPageState();
}

class _EditTripPageState extends ConsumerState<EditTripPage> {
  final _formKey = GlobalKey<FormState>();
  final _titleCtrl = TextEditingController();
  final _destinationCtrl = TextEditingController();
  final _durationCtrl = TextEditingController();
  final _budgetCtrl = TextEditingController();
  final _descCtrl = TextEditingController();

  Trip? _trip;
  bool _loading = true;
  bool _saving = false;
  File? _newImageFile;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _titleCtrl.dispose();
    _destinationCtrl.dispose();
    _durationCtrl.dispose();
    _budgetCtrl.dispose();
    _descCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final trip = await ref.read(tripServiceProvider).getTripById(widget.tripId);
      _trip = trip;
      _titleCtrl.text = trip.title;
      _destinationCtrl.text = trip.destination ?? trip.city ?? '';
      _durationCtrl.text = trip.duration ?? '';
      _budgetCtrl.text = trip.budget ?? '';
      _descCtrl.text = trip.description ?? '';
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('تعذر تحميل الرحلة', style: GoogleFonts.cairo())),
        );
        context.pop();
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _pickImage() async {
    final picked = await ImagePicker().pickImage(source: ImageSource.gallery, imageQuality: 80);
    if (picked != null) setState(() => _newImageFile = File(picked.path));
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate() || _trip == null) return;

    setState(() => _saving = true);
    try {
      String? imageUrl = _trip!.image;
      if (_newImageFile != null) {
        imageUrl = await ref.read(mediaUploadServiceProvider).uploadImageFile(_newImageFile!);
      }

      final payload = {
        'title': _titleCtrl.text.trim(),
        'destination': _destinationCtrl.text.trim(),
        'city': _destinationCtrl.text.trim(),
        'duration': _durationCtrl.text.trim(),
        'budget': _budgetCtrl.text.trim(),
        'description': _descCtrl.text.trim(),
        'postType': _trip!.postType,
        if (imageUrl != null) 'image': imageUrl,
      };

      await ref.read(tripServiceProvider).updateTrip(widget.tripId, payload);
      ref.invalidate(tripDetailProvider(widget.tripId));

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('تم حفظ التعديلات', style: GoogleFonts.cairo()), backgroundColor: Colors.green),
        );
        context.pop();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('فشل الحفظ: $e', style: GoogleFonts.cairo()), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('تعديل الرحلة', style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
        actions: [
          if (!_loading)
            TextButton(
              onPressed: _saving ? null : _save,
              child: _saving
                  ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(strokeWidth: 2))
                  : Text('حفظ', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, color: AppColors.primaryOrange)),
            ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : Form(
              key: _formKey,
              child: ListView(
                padding: const EdgeInsets.all(20),
                children: [
                  GestureDetector(
                    onTap: _pickImage,
                    child: Container(
                      height: 160,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade200,
                        borderRadius: BorderRadius.circular(12),
                        image: _newImageFile != null
                            ? DecorationImage(image: FileImage(_newImageFile!), fit: BoxFit.cover)
                            : (_trip?.image != null
                                ? DecorationImage(image: NetworkImage(_trip!.image!), fit: BoxFit.cover)
                                : null),
                      ),
                      child: _trip?.image == null && _newImageFile == null
                          ? const Center(child: Icon(Icons.add_photo_alternate_outlined, size: 40, color: Colors.grey))
                          : null,
                    ),
                  ),
                  const SizedBox(height: 20),
                  _field(_titleCtrl, 'العنوان', required: true),
                  _field(_destinationCtrl, 'الوجهة', required: true),
                  _field(_durationCtrl, 'المدة', hint: 'مثال: 3 أيام'),
                  _field(_budgetCtrl, 'الميزانية', hint: 'مثال: متوسطة'),
                  _field(_descCtrl, 'الوصف', maxLines: 5),
                ],
              ),
            ),
    );
  }

  Widget _field(TextEditingController ctrl, String label, {bool required = false, int maxLines = 1, String? hint}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: TextFormField(
        controller: ctrl,
        maxLines: maxLines,
        validator: required ? (v) => (v == null || v.trim().isEmpty) ? 'مطلوب' : null : null,
        decoration: InputDecoration(
          labelText: label,
          hintText: hint,
          labelStyle: GoogleFonts.cairo(),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),
    );
  }
}

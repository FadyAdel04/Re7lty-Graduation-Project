import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../../services/api_service.dart';
import '../../theme/app_colors.dart';

class QrScannerPage extends ConsumerStatefulWidget {
  const QrScannerPage({super.key});

  @override
  ConsumerState<QrScannerPage> createState() => _QrScannerPageState();
}

class _QrScannerPageState extends ConsumerState<QrScannerPage> {
  MobileScannerController? _scannerController;
  bool _isScanning = false;
  bool _isVerifying = false;
  Map<String, dynamic>? _verifiedBooking;
  String? _errorMsg;
  String? _scannedText;

  @override
  void dispose() {
    _scannerController?.dispose();
    super.dispose();
  }

  void _startScanning() {
    setState(() {
      _isScanning = true;
      _verifiedBooking = null;
      _errorMsg = null;
      _scannedText = null;
    });
    _scannerController = MobileScannerController(detectionSpeed: DetectionSpeed.noDuplicates);
  }

  void _stopScanning() {
    _scannerController?.stop();
    setState(() => _isScanning = false);
  }

  void _resetScanner() {
    setState(() {
      _verifiedBooking = null;
      _errorMsg = null;
      _scannedText = null;
      _isScanning = false;
    });
    _scannerController?.dispose();
    _scannerController = null;
  }

  Future<void> _scanFromGallery() async {
    final picked = await ImagePicker().pickImage(source: ImageSource.gallery);
    if (picked == null) return;

    setState(() {
      _isVerifying = true;
      _errorMsg = null;
      _verifiedBooking = null;
    });

    try {
      final controller = MobileScannerController();
      final capture = await controller.analyzeImage(picked.path);
      await controller.dispose();

      final raw = capture?.barcodes.firstOrNull?.rawValue;
      if (raw == null || raw.isEmpty) {
        setState(() => _errorMsg = 'لم يتم العثور على رمز QR في الصورة');
        return;
      }
      await _verifyQrCode(raw);
    } catch (_) {
      setState(() => _errorMsg = 'تعذر قراءة الصورة. جرّب صورة أوضح.');
    } finally {
      if (mounted) setState(() => _isVerifying = false);
    }
  }

  Future<void> _verifyQrCode(String rawText) async {
    if (_isVerifying) return;
    _stopScanning();

    setState(() {
      _isVerifying = true;
      _scannedText = rawText;
      _errorMsg = null;
      _verifiedBooking = null;
    });

    try {
      // Extract reference from URL or use raw text
      String reference = rawText.trim();
      if (rawText.contains('/verify-booking/')) {
        reference = rawText.split('/verify-booking/').last.split('?').first.split('#').first.replaceAll(RegExp(r'/+$'), '').trim();
      }

      final api = ref.read(apiServiceProvider);
      final res = await api.get('/bookings/verify/$reference');

      if (res.statusCode == 200) {
        setState(() => _verifiedBooking = res.data);
      } else {
        setState(() => _errorMsg = 'هذا الحجز غير صالح أو ملغي');
      }
    } catch (e) {
      setState(() => _errorMsg = 'حدث خطأ أثناء التحقق. يرجى المحاولة مرة أخرى.');
    } finally {
      if (mounted) setState(() => _isVerifying = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        title: Text('التحقق من QR', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 18)),
        centerTitle: true,
        leading: IconButton(icon: const Icon(Icons.arrow_back_ios_new, size: 18), onPressed: () => Navigator.pop(context)),
        bottom: const PreferredSize(preferredSize: Size.fromHeight(1), child: Divider(height: 1)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            // Scanner widget or result
            AnimatedSwitcher(
              duration: const Duration(milliseconds: 400),
              child: _isScanning ? _buildScanner() : _buildScanButton(),
            ),
            const SizedBox(height: 24),
            // Result section
            if (_isVerifying)
              const Center(child: Padding(
                padding: EdgeInsets.all(40),
                child: CircularProgressIndicator(color: Colors.indigo),
              )),
            if (_verifiedBooking != null) _buildSuccessCard(_verifiedBooking!),
            if (_errorMsg != null) _buildErrorCard(_errorMsg!),
          ],
        ),
      ),
    );
  }

  Widget _buildScanButton() {
    return Column(
      key: const ValueKey('scan-button'),
      children: [
        // Icon illustration
        Container(
          width: 200,
          height: 200,
          decoration: BoxDecoration(
            gradient: const LinearGradient(colors: [Color(0xFF0EA5E9), Color(0xFF4F46E5)], begin: Alignment.topLeft, end: Alignment.bottomRight),
            borderRadius: BorderRadius.circular(30),
            boxShadow: [BoxShadow(color: Colors.indigo.withOpacity(0.3), blurRadius: 20, offset: const Offset(0, 10))],
          ),
          child: Stack(
            alignment: Alignment.center,
            children: [
              // Corner decorations
              Positioned(top: 16, right: 16, child: _qrCorner()),
              Positioned(top: 16, left: 16, child: Transform.scale(scaleX: -1, child: _qrCorner())),
              Positioned(bottom: 16, right: 16, child: Transform.scale(scaleY: -1, child: _qrCorner())),
              Positioned(bottom: 16, left: 16, child: Transform.scale(scaleX: -1, scaleY: -1, child: _qrCorner())),
              const Icon(Icons.qr_code_scanner_outlined, size: 64, color: Colors.white70),
            ],
          ),
        ),
        const SizedBox(height: 24),
        Text('مسح رمز QR', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 20)),
        const SizedBox(height: 8),
        Text('امسح رمز QR الخاص بتذكرة المسافر\nللتحقق من صحة الحجز', textAlign: TextAlign.center, style: GoogleFonts.cairo(color: Colors.grey, fontSize: 14, height: 1.6)),
        const SizedBox(height: 32),
        SizedBox(
          width: double.infinity,
          height: 56,
          child: ElevatedButton.icon(
            onPressed: _startScanning,
            icon: const Icon(Icons.camera_alt_outlined, size: 22),
            label: Text('فتح الكاميرا للمسح', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 16)),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF4F46E5),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
              elevation: 0,
            ),
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          width: double.infinity,
          height: 48,
          child: OutlinedButton.icon(
            onPressed: _isVerifying ? null : _scanFromGallery,
            icon: const Icon(Icons.photo_library_outlined, size: 20),
            label: Text('رفع صورة QR', style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
            style: OutlinedButton.styleFrom(
              foregroundColor: const Color(0xFF4F46E5),
              side: const BorderSide(color: Color(0xFF4F46E5)),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
          ),
        ),
        if (_verifiedBooking != null || _errorMsg != null) ...[
          const SizedBox(height: 12),
          SizedBox(
            width: double.infinity,
            height: 48,
            child: OutlinedButton.icon(
              onPressed: _resetScanner,
              icon: const Icon(Icons.refresh_outlined, size: 18),
              label: Text('مسح جديد', style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
              style: OutlinedButton.styleFrom(
                foregroundColor: Colors.indigo,
                side: const BorderSide(color: Colors.indigo),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
              ),
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildScanner() {
    return Column(
      key: const ValueKey('scanner'),
      children: [
        Text('وجه الكاميرا نحو رمز QR', style: GoogleFonts.cairo(color: Colors.grey, fontSize: 13)),
        const SizedBox(height: 16),
        ClipRRect(
          borderRadius: BorderRadius.circular(20),
          child: SizedBox(
            width: double.infinity,
            height: 300,
            child: MobileScanner(
              controller: _scannerController!,
              onDetect: (capture) {
                final barcode = capture.barcodes.firstOrNull;
                if (barcode?.rawValue != null) {
                  _verifyQrCode(barcode!.rawValue!);
                }
              },
            ),
          ),
        ),
        const SizedBox(height: 16),
        SizedBox(
          width: double.infinity,
          height: 48,
          child: OutlinedButton.icon(
            onPressed: _stopScanning,
            icon: const Icon(Icons.close, size: 18),
            label: Text('إلغاء المسح', style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
            style: OutlinedButton.styleFrom(
              foregroundColor: Colors.red,
              side: const BorderSide(color: Colors.red),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSuccessCard(Map<String, dynamic> data) {
    final booking = data['booking'] as Map<String, dynamic>? ?? data;
    return Container(
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.green.withOpacity(0.3)),
        boxShadow: [BoxShadow(color: Colors.green.withOpacity(0.1), blurRadius: 16, offset: const Offset(0, 6))],
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.green.withOpacity(0.08),
              borderRadius: const BorderRadius.only(topLeft: Radius.circular(20), topRight: Radius.circular(20)),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(color: Colors.green, shape: BoxShape.circle),
                  child: const Icon(Icons.check, color: Colors.white, size: 22),
                ),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('حجز صالح ✓', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.green[700])),
                    Text('تم التحقق بنجاح', style: GoogleFonts.cairo(fontSize: 12, color: Colors.green[600])),
                  ],
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                _buildInfoRow('اسم المسافر', booking['userName'] ?? 'غير معروف', Icons.person_outline),
                _buildInfoRow('الرحلة', booking['tripTitle'] ?? '', Icons.map_outlined),
                _buildInfoRow('عدد الأشخاص', '${booking['numberOfPeople'] ?? 1}', Icons.group_outlined),
                _buildInfoRow('حالة الدفع', booking['paymentStatus'] ?? 'غير محدد', Icons.payment_outlined),
                _buildInfoRow('حالة الحجز', booking['status'] ?? '', Icons.bookmark_outlined),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
            child: SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton.icon(
                onPressed: _resetScanner,
                icon: const Icon(Icons.qr_code_scanner_outlined, size: 18),
                label: Text('مسح تذكرة أخرى', style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.indigo,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  elevation: 0,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorCard(String error) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: Colors.red.withOpacity(0.3)),
        boxShadow: [BoxShadow(color: Colors.red.withOpacity(0.1), blurRadius: 16, offset: const Offset(0, 6))],
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(color: Colors.red.withOpacity(0.1), shape: BoxShape.circle),
            child: const Icon(Icons.cancel_outlined, color: Colors.red, size: 32),
          ),
          const SizedBox(height: 12),
          Text('حجز غير صالح', style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 16, color: Colors.red[700])),
          const SizedBox(height: 8),
          Text(error, textAlign: TextAlign.center, style: GoogleFonts.cairo(color: Colors.grey, fontSize: 13)),
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            height: 48,
            child: ElevatedButton.icon(
              onPressed: _resetScanner,
              icon: const Icon(Icons.refresh_outlined, size: 18),
              label: Text('المحاولة مرة أخرى', style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
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
    );
  }

  Widget _buildInfoRow(String label, String value, IconData icon) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Row(
        children: [
          Icon(icon, size: 18, color: Colors.indigo.withOpacity(0.7)),
          const SizedBox(width: 10),
          Text('$label:', style: GoogleFonts.cairo(fontSize: 13, color: Colors.grey[600])),
          const Spacer(),
          Text(value, style: GoogleFonts.cairo(fontWeight: FontWeight.bold, fontSize: 13)),
        ],
      ),
    );
  }

  Widget _qrCorner() {
    return Container(
      width: 24,
      height: 24,
      decoration: BoxDecoration(
        border: const Border(top: BorderSide(color: Colors.white, width: 3), right: BorderSide(color: Colors.white, width: 3)),
        borderRadius: const BorderRadius.only(topRight: Radius.circular(4)),
      ),
    );
  }
}

import 'dart:async';
import 'package:audioplayers/audioplayers.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../models/memory.dart';
import '../../theme/app_colors.dart';

/// Slideshow viewer for a saved travel memory (web TravelMemories player).
class MemoryViewerPage extends StatefulWidget {
  final TravelMemory memory;
  final bool canDelete;
  final Future<void> Function()? onDelete;

  const MemoryViewerPage({
    super.key,
    required this.memory,
    this.canDelete = false,
    this.onDelete,
  });

  @override
  State<MemoryViewerPage> createState() => _MemoryViewerPageState();
}

class _MemoryViewerPageState extends State<MemoryViewerPage> {
  static const _totalDurationSec = 15;

  /// Background tracks (index matches memory.trackIndex from backend).
  static const _tracks = [
    'https://assets.mixkit.co/music/preview/mixkit-serene-view-443.mp3',
    'https://assets.mixkit.co/music/preview/mixkit-spirit-of-the-wild-448.mp3',
    'https://assets.mixkit.co/music/preview/mixkit-a-very-happy-christmas-897.mp3',
    'https://assets.mixkit.co/music/preview/mixkit-dreaming-big-31.mp3',
    'https://assets.mixkit.co/music/preview/mixkit-deep-meditation-563.mp3',
  ];

  late final PageController _pageController;
  late final AudioPlayer _audioPlayer;
  Timer? _slideTimer;
  Timer? _progressTimer;
  int _index = 0;
  bool _paused = false;
  bool _muted = false;
  double _progress = 0;

  Duration get _slideDuration {
    final n = widget.memory.items.length;
    if (n <= 0) return const Duration(seconds: 5);
    return Duration(milliseconds: ((_totalDurationSec * 1000) / n).round());
  }

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    _audioPlayer = AudioPlayer();
    _playMusic();
    _startSlideshow();
    _startProgress();
  }

  Future<void> _playMusic() async {
    final idx = widget.memory.trackIndex.clamp(0, _tracks.length - 1);
    try {
      await _audioPlayer.setReleaseMode(ReleaseMode.loop);
      await _audioPlayer.setVolume(_muted ? 0 : 0.45);
      await _audioPlayer.play(UrlSource(_tracks[idx]));
    } catch (_) {}
  }

  void _startSlideshow() {
    _slideTimer?.cancel();
    if (widget.memory.items.length <= 1) return;
    _slideTimer = Timer.periodic(_slideDuration, (_) {
      if (!mounted || _paused) return;
      if (_index >= widget.memory.items.length - 1) {
        Navigator.pop(context);
        return;
      }
      final next = _index + 1;
      _pageController.animateToPage(
        next,
        duration: const Duration(milliseconds: 450),
        curve: Curves.easeInOut,
      );
    });
  }

  void _startProgress() {
    _progressTimer?.cancel();
    const tick = Duration(milliseconds: 50);
    final step = 100 / (_totalDurationSec * 1000 / tick.inMilliseconds);
    _progressTimer = Timer.periodic(tick, (_) {
      if (!mounted || _paused) return;
      setState(() {
        _progress = (_progress + step).clamp(0, 100);
        if (_progress >= 100) _progress = 100;
      });
    });
  }

  Future<void> _toggleMute() async {
    setState(() => _muted = !_muted);
    await _audioPlayer.setVolume(_muted ? 0 : 0.45);
  }

  @override
  void dispose() {
    _slideTimer?.cancel();
    _progressTimer?.cancel();
    _audioPlayer.dispose();
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final items = widget.memory.items;
    if (items.isEmpty) {
      return Scaffold(
        appBar: AppBar(),
        body: const Center(child: Text('لا توجد صور في هذه الذكرى')),
      );
    }

    return Scaffold(
      backgroundColor: Colors.black,
      body: GestureDetector(
        onTapDown: (_) => setState(() => _paused = true),
        onTapUp: (_) => setState(() => _paused = false),
        onTapCancel: () => setState(() => _paused = false),
        child: Stack(
          fit: StackFit.expand,
          children: [
            PageView.builder(
              controller: _pageController,
              itemCount: items.length,
              onPageChanged: (i) => setState(() => _index = i),
              itemBuilder: (context, i) {
                final item = items[i];
                return Stack(
                  fit: StackFit.expand,
                  children: [
                    CachedNetworkImage(
                      imageUrl: item.url,
                      fit: BoxFit.cover,
                      errorWidget: (_, __, ___) => Container(color: Colors.grey.shade900),
                    ),
                    Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.bottomCenter,
                          end: Alignment.topCenter,
                          colors: [
                            Colors.black.withOpacity(0.85),
                            Colors.transparent,
                            Colors.black.withOpacity(0.4),
                          ],
                        ),
                      ),
                    ),
                    Positioned(
                      right: 20,
                      left: 20,
                      bottom: 48,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            widget.memory.monthLabel,
                            style: GoogleFonts.cairo(color: Colors.white70, fontSize: 12, fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            item.tripTitle,
                            style: GoogleFonts.cairo(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w900),
                            textAlign: TextAlign.right,
                          ),
                          const SizedBox(height: 4),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.end,
                            children: [
                              Text(item.destination, style: GoogleFonts.cairo(color: Colors.white70, fontSize: 14)),
                              const SizedBox(width: 4),
                              const Icon(Icons.location_on, color: AppColors.primaryOrange, size: 16),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                );
              },
            ),
            SafeArea(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
                child: Row(
                  children: [
                    if (widget.canDelete && widget.onDelete != null)
                      IconButton(
                        onPressed: () async {
                          final confirm = await showDialog<bool>(
                            context: context,
                            builder: (ctx) => AlertDialog(
                              title: Text('حذف الذكرى؟', style: GoogleFonts.cairo(fontWeight: FontWeight.bold)),
                              actions: [
                                TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('إلغاء')),
                                TextButton(
                                  onPressed: () => Navigator.pop(ctx, true),
                                  child: const Text('حذف', style: TextStyle(color: Colors.red)),
                                ),
                              ],
                            ),
                          );
                          if (confirm == true) {
                            await _audioPlayer.stop();
                            await widget.onDelete!();
                            if (mounted) Navigator.pop(context, true);
                          }
                        },
                        icon: const Icon(Icons.delete_outline, color: Colors.white),
                      ),
                    IconButton(
                      onPressed: _toggleMute,
                      icon: Icon(_muted ? Icons.volume_off : Icons.volume_up, color: Colors.white),
                    ),
                    const Spacer(),
                    IconButton(
                      onPressed: () => Navigator.pop(context),
                      icon: const Icon(Icons.close, color: Colors.white, size: 28),
                    ),
                  ],
                ),
              ),
            ),
            Positioned(
              top: MediaQuery.paddingOf(context).top + 52,
              left: 12,
              right: 12,
              child: ClipRRect(
                borderRadius: BorderRadius.circular(4),
                child: LinearProgressIndicator(
                  value: _progress / 100,
                  minHeight: 3,
                  backgroundColor: Colors.white24,
                  valueColor: const AlwaysStoppedAnimation(AppColors.primaryOrange),
                ),
              ),
            ),
            Positioned(
              top: MediaQuery.paddingOf(context).top + 64,
              left: 16,
              right: 16,
              child: Row(
                children: List.generate(items.length, (i) {
                  return Expanded(
                    child: Container(
                      height: 3,
                      margin: const EdgeInsets.symmetric(horizontal: 2),
                      decoration: BoxDecoration(
                        color: i <= _index ? AppColors.primaryOrange : Colors.white24,
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  );
                }),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

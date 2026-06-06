import 'dart:io';

import 'package:flutter/material.dart';
import 'package:video_player/video_player.dart';

/// Full-screen preview for a local or network video file.
class VideoPreviewDialog extends StatefulWidget {
  final String path;

  const VideoPreviewDialog({super.key, required this.path});

  static Future<void> show(BuildContext context, String path) {
    return showDialog(
      context: context,
      builder: (_) => VideoPreviewDialog(path: path),
    );
  }

  @override
  State<VideoPreviewDialog> createState() => _VideoPreviewDialogState();
}

class _VideoPreviewDialogState extends State<VideoPreviewDialog> {
  VideoPlayerController? _controller;
  bool _failed = false;

  @override
  void initState() {
    super.initState();
    _init();
  }

  Future<void> _init() async {
    try {
      final c = widget.path.startsWith('http')
          ? VideoPlayerController.networkUrl(Uri.parse(widget.path))
          : VideoPlayerController.file(File(widget.path));
      await c.initialize();
      c.setLooping(true);
      await c.play();
      if (mounted) setState(() => _controller = c);
    } catch (_) {
      if (mounted) setState(() => _failed = true);
    }
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.black,
      insetPadding: const EdgeInsets.all(16),
      child: AspectRatio(
        aspectRatio: _controller?.value.isInitialized == true
            ? _controller!.value.aspectRatio
            : 16 / 9,
        child: Stack(
          alignment: Alignment.center,
          children: [
            if (_failed)
              const Text('تعذر تشغيل الفيديو', style: TextStyle(color: Colors.white))
            else if (_controller?.value.isInitialized == true)
              VideoPlayer(_controller!)
            else
              const CircularProgressIndicator(color: Colors.white),
            Positioned(
              top: 8,
              left: 8,
              child: IconButton(
                icon: const Icon(Icons.close, color: Colors.white),
                onPressed: () => Navigator.pop(context),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

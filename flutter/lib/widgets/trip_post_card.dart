import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:carousel_slider/carousel_slider.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart';
import 'package:intl/intl.dart' as intl;
import '../models/trip.dart';
import '../providers/theme_provider.dart';
import '../services/trip_service.dart';
import '../providers/trip_provider.dart';
import '../providers/api_provider.dart';

import '../theme/app_colors.dart';
import 'package:clerk_flutter/clerk_flutter.dart';

class TripPostCard extends ConsumerStatefulWidget {
  final Trip trip;
  const TripPostCard({super.key, required this.trip});

  @override
  ConsumerState<TripPostCard> createState() => _TripPostCardState();
}

class _TripPostCardState extends ConsumerState<TripPostCard> {
  final TextEditingController _commentController = TextEditingController();
  int _currentImageIndex = 0;
  bool _isLiked = false;
  bool _isSaved = false;
  bool _showHeartOverlay = false;
  late int _likeCount;

  @override
  void initState() {
    super.initState();
    _isLiked = widget.trip.isLoved;
    _likeCount = widget.trip.likes;
  }

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  void _handleLike() async {
    final previouslyLiked = _isLiked;
    final success = await ref.read(tripServiceProvider).toggleLike(widget.trip.id);
    
    if (mounted) {
      setState(() {
        _isLiked = success;
        // Adjust count based on actual change to avoid double counting
        if (success && !previouslyLiked) _likeCount++; 
        else if (!success && previouslyLiked) _likeCount = (_likeCount > 0) ? _likeCount - 1 : 0;
      });
    }
  }

  void _handleSendComment() async {
    final content = _commentController.text.trim();
    if (content.isEmpty) return;

    final success = await ref.read(tripServiceProvider).addComment(widget.trip.id, content);
    if (success) {
      _commentController.clear();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('تم إرسال تعليقك بنجاح!')),
        );
      }
    } else {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('فشل إرسال التعليق. حاول مرة أخرى.')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final images = _getAllTripImages();

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: isDark ? AppColors.cardDark : Colors.white,
        borderRadius: BorderRadius.circular(30),
        boxShadow: [
          if (!isDark) BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 1. Header with Avatar and Location
          _buildHeader(context),

          // 2. Main Image with Badges
          _buildMainImage(images),

          // 3. Horizontal Thumbnails List
          if (images.length > 1) _buildThumbnails(images),

          // 4. Title and Description
          _buildContent(),

          // 5. Actions Footer
          _buildFooter(),

          // 6. Inline Comment Input
          _buildCommentInput(context, isDark),
        ],
      ),
    );
  }

  Widget _buildCommentInput(BuildContext context, bool isDark) {
    final clerkUser = ClerkAuth.of(context).user;
    final userAvatar = clerkUser?.imageUrl;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        border: Border(
          top: BorderSide(
            color: isDark ? Colors.white10 : Colors.black12,
            width: 0.5,
          ),
        ),
      ),
      child: Row(
        children: [
          CircleAvatar(
            radius: 16,
            backgroundImage: userAvatar != null ? NetworkImage(userAvatar) : null,
            child: userAvatar == null ? const Icon(Icons.person, size: 20) : null,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              height: 40,
              decoration: BoxDecoration(
                color: isDark ? AppColors.darkBackground : Colors.grey[100],
                borderRadius: BorderRadius.circular(20),
              ),
              child: TextField(
                controller: _commentController,
                decoration: const InputDecoration(
                  hintText: 'اكتب تعليقك هنا...',
                  hintStyle: TextStyle(fontSize: 13, color: Colors.grey),
                  border: InputBorder.none,
                ),
                style: const TextStyle(fontSize: 13),
              ),
            ),
          ),
          const SizedBox(width: 8),
          IconButton(
            icon: const Icon(Icons.send_rounded, color: AppColors.primaryOrange, size: 20),
            onPressed: _handleSendComment,
          ),
        ],
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          CircleAvatar(
            radius: 22,
            backgroundImage: NetworkImage(widget.trip.authorImage ?? 'https://images.unsplash.com/photo-1519046904884-53103b34b206'),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.trip.author ?? 'فارس محمود',
                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                ),
                Row(
                  children: [
                    const Icon(Icons.location_on, size: 12, color: AppColors.primaryOrange),
                    const SizedBox(width: 4),
                    Text(
                      '${widget.trip.city ?? "دهب"} | ${_getTimeAgo(widget.trip.postedAt)}',
                      style: TextStyle(color: Colors.grey.shade500, fontSize: 11),
                    ),
                  ],
                ),
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.person_add_outlined, size: 20, color: AppColors.primaryOrange),
            onPressed: () async {
              await ref.read(userServiceProvider).toggleFollow(widget.trip.ownerId ?? '');
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('تمت متابعة المستخدم')),
                );
              }
            },
          ),
        ],
      ),
    );
  }

  Widget _buildMainImage(List<String> images) {
    if (images.isEmpty) return const SizedBox.shrink();
    return Container(
      height: 250,
      margin: const EdgeInsets.symmetric(horizontal: 12),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(25),
        child: Stack(
          children: [
            GestureDetector(
              onDoubleTap: () {
                if (!_isLiked) _handleLike();
                setState(() => _showHeartOverlay = true);
                Future.delayed(const Duration(milliseconds: 800), () {
                  if (mounted) setState(() => _showHeartOverlay = false);
                });
              },
              child: CachedNetworkImage(
                imageUrl: images[_currentImageIndex],
                width: double.infinity,
                height: double.infinity,
                fit: BoxFit.cover,
              ),
            ),
            if (_showHeartOverlay)
              Center(
                child: Icon(
                  Icons.favorite,
                  color: Colors.white.withOpacity(0.9),
                  size: 100,
                ).animate().scale(duration: 400.ms, curve: Curves.elasticOut).fadeOut(delay: 400.ms),
              ),
            Positioned(
              top: 12,
              right: 12,
              child: _floatingBadge(
                icon: Icons.star,
                text: widget.trip.rating.toString(),
                color: Colors.black54,
              ),
            ),
            Positioned(
              bottom: 12,
              right: 12,
              child: _floatingBadge(
                icon: Icons.calendar_today,
                text: widget.trip.season ?? 'ربيع',
                color: AppColors.primaryOrange,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _floatingBadge({required IconData icon, required String text, required Color color}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(15)),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: Colors.white, size: 12),
          const SizedBox(width: 4),
          Text(text, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
        ],
      ),
    );
  }

  Widget _buildThumbnails(List<String> images) {
    if (images.length < 2) return const SizedBox.shrink();
    return Container(
      height: 60,
      margin: const EdgeInsets.only(top: 12, right: 12, left: 12),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: images.length,
        itemBuilder: (context, index) => GestureDetector(
          onTap: () => setState(() => _currentImageIndex = index),
          child: Container(
            width: 60,
            margin: const EdgeInsets.only(left: 8),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: _currentImageIndex == index ? AppColors.primaryOrange : Colors.transparent,
                width: 2,
              ),
              image: DecorationImage(image: NetworkImage(images[index]), fit: BoxFit.cover),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildContent() {
    return Padding(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            widget.trip.title,
            style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(
            widget.trip.description ?? 'استعد لرحلة تأخذك إلى عالم من السحر والجمال...',
            style: TextStyle(color: Colors.grey.shade500, fontSize: 13, height: 1.5),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildFooter() {
    return Padding(
      padding: const EdgeInsets.only(left: 16, right: 16, bottom: 20),
      child: Row(
        children: [
          GestureDetector(
            onTap: () => context.push('/trip/${widget.trip.id}'),
            child: const Text(
              'المزيد',
              style: TextStyle(color: AppColors.primaryOrange, fontWeight: FontWeight.bold),
            ),
          ),
          const Spacer(),
          _statIcon(Icons.share_outlined, '', () {
            Share.share('تحقق من هذه الرحلة الرائعة: ${widget.trip.title}\nhttps://re7lty.com/trip/${widget.trip.id}');
          }),
          const SizedBox(width: 16),
          _statIcon(_isSaved ? Icons.bookmark : Icons.bookmark_border, '', () {
            setState(() => _isSaved = !_isSaved);
          }),
          const SizedBox(width: 16),
          _statIcon(Icons.chat_bubble_outline, widget.trip.comments.length.toString(), () {
            context.push('/trip/${widget.trip.id}/comments');
          }),
          const SizedBox(width: 16),
          _statIcon(
            _isLiked ? Icons.favorite : Icons.favorite_border,
            '$_likeCount',
            _handleLike,
            color: _isLiked ? Colors.red : null,
          ),
        ],
      ),
    );
  }

  Widget _statIcon(IconData icon, String count, VoidCallback onTap, {Color? color}) {
    return GestureDetector(
      onTap: onTap,
      child: Row(
        children: [
          Icon(icon, size: 22, color: color ?? Colors.grey.shade500),
          if (count.isNotEmpty) ...[
            const SizedBox(width: 4),
            Text(count, style: TextStyle(color: Colors.grey.shade500, fontSize: 13)),
          ],
        ],
      ),
    );
  }

  String _getTimeAgo(DateTime date) {
    final diff = DateTime.now().difference(date);
    if (diff.inDays > 7) return intl.DateFormat('d MMMM').format(date);
    if (diff.inDays > 0) return 'منذ ${diff.inDays} يوم';
    if (diff.inHours > 0) return 'منذ ${diff.inHours} ساعة';
    if (diff.inMinutes > 0) return 'منذ ${diff.inMinutes} دقيقة';
    return 'الآن';
  }

  List<String> _getAllTripImages() {
    List<String> images = [];
    if (widget.trip.image != null) images.add(widget.trip.image!);
    if (widget.trip.activities != null) {
      for (var activity in widget.trip.activities) {
        if (activity.images != null) images.addAll(activity.images!);
      }
    }
    if (images.isEmpty) {
      images.add('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800');
    }
    return images.take(10).toList();
  }
}



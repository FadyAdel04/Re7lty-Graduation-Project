import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:carousel_slider/carousel_slider.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart';
import 'package:intl/intl.dart' as intl;
import 'dart:convert';
import '../models/trip.dart';
import '../providers/theme_provider.dart';
import '../services/trip_service.dart';
import '../providers/trip_provider.dart';
import '../providers/api_provider.dart';

import '../theme/app_colors.dart';
import 'package:clerk_flutter/clerk_flutter.dart';
import 'report_trip_dialog.dart';

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
    setState(() {
      _isLiked = !_isLiked;
      if (_isLiked) _likeCount++;
      else _likeCount = (_likeCount > 0) ? _likeCount - 1 : 0;
    });

    final success = await ref.read(tripServiceProvider).toggleLike(widget.trip.id);
    
    if (mounted && !success) {
      // Revert if API fails
      setState(() {
        _isLiked = previouslyLiked;
        if (_isLiked) _likeCount++;
        else _likeCount = (_likeCount > 0) ? _likeCount - 1 : 0;
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
          if (!isDark) BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 15, offset: const Offset(0, 8)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 1. Header with Avatar and Badges
          _buildHeader(context, isDark),

          // 2. Main Image Carousel
          _buildImageCarousel(images),

          // 3. Title and Description
          _buildContent(),

          // 4. Actions Footer
          _buildFooter(isDark),

          // 5. Inline Comment Input
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

  Widget _buildHeader(BuildContext context, bool isDark) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          GestureDetector(
             onTap: () => context.push('/profile/${widget.trip.ownerId}'),
             child: CircleAvatar(
               radius: 24,
               backgroundImage: NetworkImage(widget.trip.authorImage ?? 'https://images.unsplash.com/photo-1519046904884-53103b34b206'),
             ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      widget.trip.author ?? 'مستكشف رحلتي',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15),
                    ),
                    const SizedBox(width: 4),
                    if (widget.trip.authorBadge != 'none')
                      _buildUserBadge(widget.trip.authorBadge),
                  ],
                ),
                Row(
                  children: [
                    if (widget.trip.city != null || widget.trip.destination != null) ...[
                      const Icon(Icons.location_on, size: 12, color: AppColors.primaryOrange),
                      const SizedBox(width: 4),
                      Text(
                        '${widget.trip.city ?? widget.trip.destination ?? ""}',
                        style: TextStyle(color: isDark ? Colors.white70 : Colors.grey.shade500, fontSize: 11, fontWeight: FontWeight.w600),
                      ),
                    ],
                    Text(
                      ' • ${_getTimeAgo(widget.trip.postedAt)}',
                      style: TextStyle(color: isDark ? Colors.white38 : Colors.grey.shade400, fontSize: 11),
                    ),
                  ],
                ),
              ],
            ),
          ),
          _buildPostTypeBadge(widget.trip.postType, isDark),
          PopupMenuButton<String>(
            icon: const Icon(Icons.more_vert, size: 20),
            onSelected: (value) {
              if (value == 'delete') {
                _showDeleteConfirmation(context);
              } else if (value == 'report') {
                ReportTripDialog.show(
                  context,
                  tripId: widget.trip.id,
                  tripTitle: widget.trip.title,
                );
              }
            },
            itemBuilder: (context) {
              final isOwner =
                  ClerkAuth.of(context).user?.id == widget.trip.ownerId;
              return [
                if (!isOwner)
                  const PopupMenuItem(
                    value: 'report',
                    child: Row(
                      children: [
                        Icon(Icons.flag_outlined, color: Colors.orange, size: 20),
                        SizedBox(width: 8),
                        Text('إبلاغ عن المحتوى'),
                      ],
                    ),
                  ),
                if (isOwner)
                  const PopupMenuItem(
                    value: 'delete',
                    child: Row(
                      children: [
                        Icon(Icons.delete_outline, color: Colors.red, size: 20),
                        SizedBox(width: 8),
                        Text('حذف المنشور', style: TextStyle(color: Colors.red)),
                      ],
                    ),
                  ),
              ];
            },
          ),
        ],
      ),
    );
  }

  void _showDeleteConfirmation(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('حذف المنشور'),
        content: const Text('هل أنت متأكد من حذف هذا المنشور نهائياً؟'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('إلغاء')),
          ElevatedButton(
            onPressed: () async {
              final success = await ref.read(tripServiceProvider).deleteTrip(widget.trip.id);
              if (mounted) {
                Navigator.pop(context);
                if (success) {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('تم حذف المنشور بنجاح')));
                  ref.invalidate(feedProvider);
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('فشل حذف المنشور')));
                }
              }
            },
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white),
            child: const Text('حذف'),
          ),
        ],
      ),
    );
  }

  Widget _buildUserBadge(String type) {
    Color color = Colors.blue;
    IconData icon = Icons.check;
    
    if (type == 'pro') { color = Colors.deepPurple; icon = Icons.bolt; }
    if (type == 'top_traveler') { color = Colors.orange; icon = Icons.workspace_premium; }
    if (type == 'company') { color = Colors.teal; icon = Icons.business; }

    return Container(
      padding: const EdgeInsets.all(2),
      decoration: BoxDecoration(color: color, shape: BoxShape.circle),
      child: Icon(icon, size: 8, color: Colors.white),
    );
  }

  Widget _buildPostTypeBadge(String type, bool isDark) {
    String label = 'رحلة';
    Color color = AppColors.primaryOrange;
    if (type == 'quick') { label = 'سريع'; color = Colors.blue; }
    if (type == 'ask') { label = 'سؤال'; color = Colors.green; }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(10),
      ),
      child: Text(
        label,
        style: TextStyle(color: color, fontSize: 10, fontWeight: FontWeight.bold),
      ),
    );
  }

  Widget _buildImageCarousel(List<String> images) {
    return Stack(
      alignment: Alignment.bottomCenter,
      children: [
        CarouselSlider(
          options: CarouselOptions(
            height: 300,
            viewportFraction: 0.95,
            enlargeCenterPage: true,
            enableInfiniteScroll: images.length > 1,
            onPageChanged: (index, reason) => setState(() => _currentImageIndex = index),
          ),
          items: images.map((url) {
            return Builder(
              builder: (BuildContext context) {
                return GestureDetector(
                  onDoubleTap: () {
                    if (!_isLiked) _handleLike();
                    setState(() => _showHeartOverlay = true);
                    Future.delayed(const Duration(milliseconds: 800), () {
                      if (mounted) setState(() => _showHeartOverlay = false);
                    });
                  },
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(25),
                    child: Stack(
                      children: [
                        if (url.startsWith('data:'))
                          Image.memory(
                            base64Decode(url.split(',').last),
                            width: double.infinity,
                            height: double.infinity,
                            fit: BoxFit.cover,
                          )
                        else
                          CachedNetworkImage(
                            imageUrl: url,
                            width: double.infinity,
                            height: double.infinity,
                            fit: BoxFit.cover,
                            placeholder: (context, url) => Container(color: Colors.grey[200]),
                            errorWidget: (context, url, error) => Container(color: Colors.grey[300], child: const Icon(Icons.broken_image, color: Colors.grey)),
                          ),
                        if (_showHeartOverlay)
                          Center(
                            child: const Icon(
                              Icons.favorite,
                              color: Colors.white,
                              size: 100,
                            ).animate().scale(duration: 400.ms, curve: Curves.elasticOut).fadeOut(delay: 400.ms),
                          ),
                      ],
                    ),
                  ),
                );
              },
            );
          }).toList(),
        ),
        if (images.length > 1)
          Positioned(
            bottom: 20,
            child: AnimatedSmoothIndicator(
              activeIndex: _currentImageIndex,
              count: images.length,
              effect: ExpandingDotsEffect(
                dotWidth: 8,
                dotHeight: 8,
                activeDotColor: AppColors.primaryOrange,
                dotColor: Colors.white.withOpacity(0.5),
              ),
            ),
          ),
        // Floating Badges
        Positioned(
          top: 15,
          right: 25,
          child: _floatingBadge(
            icon: Icons.star,
            text: widget.trip.rating.toString(),
            color: Colors.black54,
          ),
        ),
        Positioned(
          bottom: 40,
          right: 25,
          child: _floatingBadge(
            icon: Icons.calendar_today,
            text: widget.trip.season ?? 'ربيع',
            color: AppColors.primaryOrange,
          ),
        ),
      ],
    );
  }

  Widget _floatingBadge({required IconData icon, required String text, required Color color}) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(15), 
        boxShadow: [BoxShadow(color: Colors.black26, blurRadius: 4)]),
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

  Widget _buildContent() {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 10),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            widget.trip.title,
            style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Text(
            widget.trip.description ?? 'استعد لرحلة تأخذك إلى عالم من السحر والجمال...',
            style: TextStyle(color: isDark ? Colors.white60 : Colors.grey.shade600, fontSize: 13, height: 1.4),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildFooter(bool isDark) {
    return Padding(
      padding: const EdgeInsets.only(left: 16, right: 16, bottom: 16),
      child: Row(
        children: [
          if (widget.trip.postType == 'detailed')
            GestureDetector(
              onTap: () => context.push('/trip/${widget.trip.id}'),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: isDark ? Colors.white10 : Colors.grey[100],
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Text(
                  'عرض التفاصيل',
                  style: TextStyle(color: AppColors.primaryOrange, fontWeight: FontWeight.bold, fontSize: 12),
                ),
              ),
            ),
          const Spacer(),
          _statIcon(Icons.share_outlined, '', () {
            Share.share('تحقق من هذه الرحلة الرائعة: ${widget.trip.title}\nhttps://re7lty.com/trip/${widget.trip.id}');
          }),
          const SizedBox(width: 16),
          _statIcon(_isSaved ? Icons.bookmark : Icons.bookmark_border, '', () {
            setState(() => _isSaved = !_isSaved);
          }, color: _isSaved ? AppColors.primaryOrange : null),
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
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return GestureDetector(
      onTap: onTap,
      child: Row(
        children: [
          Icon(icon, size: 22, color: color ?? (isDark ? Colors.white54 : Colors.grey.shade500)),
          if (count.isNotEmpty && count != '0') ...[
            const SizedBox(width: 4),
            Text(count, style: TextStyle(color: isDark ? Colors.white54 : Colors.grey.shade500, fontSize: 12, fontWeight: FontWeight.w500)),
          ],
        ],
      ),
    );
  }

  String _getTimeAgo(DateTime date) {
    final diff = DateTime.now().difference(date);
    if (diff.inDays > 7) return intl.DateFormat('d MMM').format(date);
    if (diff.inDays > 0) return 'منذ ${diff.inDays}ي';
    if (diff.inHours > 0) return 'منذ ${diff.inHours}س';
    if (diff.inMinutes > 0) return 'منذ ${diff.inMinutes}د';
    return 'الآن';
  }

  List<String> _getAllTripImages() {
    List<String> images = [];
    if (widget.trip.image != null && widget.trip.image!.isNotEmpty) images.add(widget.trip.image!);
    
    // Add activity images
    for (var activity in widget.trip.activities) {
      if (activity.images.isNotEmpty) {
        images.addAll(activity.images);
      }
    }
    
    // Fallback if no images
    if (images.isEmpty) {
      images.add('https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=800');
    }
    
    return images.take(5).toList(); // Limit to 5 for performance in feed
  }
}

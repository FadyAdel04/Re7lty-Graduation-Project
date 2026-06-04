import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../theme/app_colors.dart';
import '../../providers/api_provider.dart';
import '../../models/notification.dart';
import '../../utils/navigation_utils.dart';
import 'package:cached_network_image/cached_network_image.dart';

final notificationsProvider = FutureProvider<List<AppNotification>>((ref) async {
  return ref.watch(userServiceProvider).getNotifications();
});

class NotificationsPage extends ConsumerWidget {
  const NotificationsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notificationsAsync = ref.watch(notificationsProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.darkBackground : const Color(0xFFF1F5F9),
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(130),
        child: _buildCustomHeader(context, ref, isDark),
      ),
      body: notificationsAsync.when(
        data: (notifications) {
          if (notifications.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.notifications_none, size: 64, color: Colors.grey[400]),
                  const SizedBox(height: 16),
                  const Text('لا توجد إشعارات حالياً', style: TextStyle(color: Colors.grey, fontSize: 16)),
                ],
              ),
            );
          }
          return RefreshIndicator(
            onRefresh: () => ref.refresh(notificationsProvider.future),
            child: ListView.builder(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
              itemCount: notifications.length,
              itemBuilder: (context, index) => _buildNotificationCard(context, ref, notifications[index], isDark),
            ),
          );
        },
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.primaryOrange)),
        error: (err, stack) => Center(child: Text('Error: $err')),
      ),
    );
  }

  Widget _buildCustomHeader(BuildContext context, WidgetRef ref, bool isDark) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 60, 16, 20),
      decoration: BoxDecoration(
        color: isDark ? AppColors.darkBackground : const Color(0xFFF1F5F9),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          IconButton(
            icon: Icon(Icons.arrow_back_ios_new, color: isDark ? Colors.white : const Color(0xFF1E293B), size: 20),
            onPressed: () => context.pop(),
          ),
          ElevatedButton.icon(
            onPressed: () async {
              await ref.read(userServiceProvider).markAllNotificationsAsRead();
              ref.invalidate(notificationsProvider);
            },
            icon: const Icon(Icons.check, size: 16),
            label: const Text('تحديد الكل كمقروء', style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.transparent,
              foregroundColor: const Color(0xFF6366F1),
              elevation: 0,
              side: const BorderSide(color: Color(0xFFF59E0B), width: 1.2),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
            ),
          ),
          Text(
            'الإشعارات',
            style: GoogleFonts.cairo(
              fontSize: 22,
              fontWeight: FontWeight.w900,
              color: isDark ? Colors.white : const Color(0xFF1E293B),
            ),
          ),
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFF6366F1),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.notifications_none, color: Colors.white, size: 24),
          ),
        ],
      ),
    );
  }

  Future<void> _onNotificationTap(BuildContext context, WidgetRef ref, AppNotification notification) async {
    try {
      await ref.read(userServiceProvider).markNotificationAsRead(notification.id);
      ref.invalidate(notificationsProvider);
    } catch (_) {}

    if (!context.mounted) return;

    switch (notification.type) {
      case 'follow':
        pushUserProfile(context, notification.senderId);
        break;
      case 'comment':
      case 'love':
      case 'save':
      case 'tag':
        if (notification.tripId != null && notification.tripId!.isNotEmpty) {
          pushTrip(context, notification.tripId);
        } else if (notification.senderId.isNotEmpty) {
          pushUserProfile(context, notification.senderId);
        }
        break;
      case 'message':
        if (notification.link != null && notification.link!.startsWith('/')) {
          context.push(notification.link!);
        } else {
          context.push('/messages');
        }
        break;
      default:
        if (notification.tripId != null && notification.tripId!.isNotEmpty) {
          pushTrip(context, notification.tripId);
        } else if (notification.senderId.isNotEmpty) {
          pushUserProfile(context, notification.senderId);
        }
    }
  }

  Widget _buildNotificationCard(BuildContext context, WidgetRef ref, AppNotification notification, bool isDark) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: () => _onNotificationTap(context, ref, notification),
        borderRadius: BorderRadius.circular(25),
        child: Container(
          margin: const EdgeInsets.only(bottom: 16),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: isDark ? AppColors.cardDark : Colors.white.withOpacity(0.8),
            borderRadius: BorderRadius.circular(25),
            border: notification.isRead ? null : Border.all(color: const Color(0xFF6366F1).withOpacity(0.1), width: 1),
            boxShadow: [
              BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 15, offset: const Offset(0, 5))
            ],
          ),
          child: Row(
            children: [
              Stack(
                children: [
                  Container(
                    width: 55,
                    height: 55,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 2),
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(30),
                      child: notification.senderAvatar != null
                          ? CachedNetworkImage(imageUrl: notification.senderAvatar!, fit: BoxFit.cover)
                          : Container(color: Colors.grey[200], child: const Icon(Icons.person, color: Colors.grey)),
                    ),
                  ),
                  if (!notification.isRead)
                    Positioned(
                      top: 0,
                      right: 0,
                      child: Container(
                        width: 12,
                        height: 12,
                        decoration: BoxDecoration(
                          color: const Color(0xFF6366F1),
                          shape: BoxShape.circle,
                          border: Border.all(color: Colors.white, width: 2),
                        ),
                      ),
                    ),
                ],
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      notification.message,
                      style: GoogleFonts.cairo(
                        fontSize: 14,
                        fontWeight: notification.isRead ? FontWeight.normal : FontWeight.bold,
                        color: isDark ? Colors.white : const Color(0xFF334155),
                        height: 1.4,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      _getTimeAgo(notification.createdAt),
                      style: TextStyle(color: Colors.grey[400], fontSize: 11),
                    ),
                  ],
                ),
              ),
              Icon(Icons.chevron_left, color: Colors.grey.shade400, size: 20),
            ],
          ),
        ),
      ),
    );
  }

  String _getTimeAgo(DateTime date) {
    final diff = DateTime.now().difference(date);
    if (diff.inDays > 0) return 'منذ ${diff.inDays} يوم';
    if (diff.inHours > 0) return 'منذ ${diff.inHours} ساعة';
    if (diff.inMinutes > 0) return 'منذ ${diff.inMinutes} دقيقة';
    return 'الآن';
  }
}

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

void pushUserProfile(BuildContext context, String? userId) {
  final id = userId?.trim();
  if (id == null || id.isEmpty) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('لا يمكن فتح هذا الملف الشخصي')),
    );
    return;
  }
  context.push('/user/$id');
}

void pushTrip(BuildContext context, String? tripId) {
  final id = tripId?.trim();
  if (id == null || id.isEmpty) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('لا يمكن فتح هذه الرحلة')),
    );
    return;
  }
  context.push('/trip/$id');
}

String translateSeason(String? season) {
  switch (season?.toLowerCase()) {
    case 'summer':
      return 'صيف';
    case 'winter':
      return 'شتاء';
    case 'spring':
      return 'ربيع';
    case 'autumn':
    case 'fall':
      return 'خريف';
    default:
      return season?.isNotEmpty == true ? season! : 'ربيع';
  }
}

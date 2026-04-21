import 'package:re7lty_app/theme/app_colors.dart';
import 'package:flutter/material.dart';
import '../models/user.dart';
import '../providers/theme_provider.dart';
import 'package:go_router/go_router.dart';

class UserSearchCard extends StatelessWidget {
  final User user;
  const UserSearchCard({super.key, required this.user});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return ListTile(
      onTap: () => context.push('/user/${user.id}'),
      leading: CircleAvatar(
        radius: 20,
        backgroundColor: AppColors.primaryOrange.withOpacity(0.1),
        backgroundImage: user.avatar != null && user.avatar!.isNotEmpty 
            ? NetworkImage(user.avatar!) 
            : null,
        child: (user.avatar == null || user.avatar!.isEmpty) 
            ? Text((user.fullName != null && user.fullName!.isNotEmpty) ? user.fullName![0].toUpperCase() : '?', style: const TextStyle(color: AppColors.primaryOrange)) 
            : null,
      ),
      title: Text(
        user.fullName ?? '',
        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
      ),
      subtitle: Text(
        user.username ?? '@${(user.fullName ?? "user").toLowerCase().replaceAll(' ', '_')}',
        style: TextStyle(color: Colors.grey.shade600, fontSize: 11),
      ),
      trailing: ElevatedButton(
        onPressed: () {},
        style: ElevatedButton.styleFrom(
          backgroundColor: AppColors.primaryOrange,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 16),
          minimumSize: const Size(0, 32),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
        ),
        child: const Text('متابعة', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
      ),
    );
  }
}




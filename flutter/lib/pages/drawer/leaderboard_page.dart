import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/trip_provider.dart';

class LeaderboardPage extends ConsumerWidget {
  const LeaderboardPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tripsAsync = ref.watch(tripsProvider(const TripFilter()));

    return Scaffold(
      appBar: AppBar(
        title: const Text('لوحة المتصدرين', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: tripsAsync.when(
        data: (tripsData) {
          if (tripsData.isEmpty) {
            return const Center(child: Text('لا يوجد متصدرون حالياً'));
          }

          final trips = List.from(tripsData);
          trips.sort((a, b) {
            final scoreA = a.likes * 1 + a.comments.length * 2 + a.saves * 1.5;
            final scoreB = b.likes * 1 + b.comments.length * 2 + b.saves * 1.5;
            return scoreB.compareTo(scoreA);
          });

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: trips.length > 10 ? 10 : trips.length,
            itemBuilder: (context, index) {
              final isTop3 = index < 3;
              final color = index == 0 ? Colors.amber : (index == 1 ? Colors.grey.shade500 : (index == 2 ? Colors.brown.shade400 : Colors.white));
              final trip = trips[index];
              final score = (trip.likes * 1 + trip.comments.length * 2 + trip.saves * 1.5).toStringAsFixed(0);
              final userName = trip.author ?? 'مستخدم غير معروف';

              return Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: isTop3 ? color.withOpacity(0.1) : Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: isTop3 ? color : Colors.grey.shade200),
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      backgroundColor: isTop3 ? color : Colors.grey.shade200,
                      child: Text('${index + 1}', style: TextStyle(fontWeight: FontWeight.bold, color: isTop3 ? Colors.white : Colors.black)),
                    ),
                    const SizedBox(width: 16),
                    CircleAvatar(
                      radius: 20,
                      backgroundImage: NetworkImage('https://ui-avatars.com/api/?name=${Uri.encodeComponent(userName)}&background=random&format=png'),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(userName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                          Text(trip.title, style: const TextStyle(color: Colors.grey, fontSize: 12, overflow: TextOverflow.ellipsis)),
                          Text('$score نقطة تفاعل', style: const TextStyle(color: Colors.orange, fontSize: 12, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                    if (isTop3) Icon(Icons.stars, color: color, size: 28),
                  ],
                ),
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, st) => Center(child: Text('حدث خطأ: $e')),
      ),
    );
  }
}


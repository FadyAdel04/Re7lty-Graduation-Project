import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../services/api_service.dart';

final corporateTripsProvider = FutureProvider<List<dynamic>>((ref) async {
  final api = ref.watch(apiServiceProvider);
  final response = await api.get('/corporate/trips?limit=20');
  if (response.statusCode == 200) {
    return response.data['trips'] as List<dynamic>;
  }
  throw Exception('Failed to load corporate trips');
});

class CorporateTripsPage extends ConsumerWidget {
  const CorporateTripsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tripsAsync = ref.watch(corporateTripsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('شركات السياحة', style: TextStyle(fontWeight: FontWeight.bold)),
      ),
      body: tripsAsync.when(
        data: (trips) {
          if (trips.isEmpty) {
            return const Center(child: Text('لا توجد رحلات شركات حالياً'));
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: trips.length,
            itemBuilder: (context, index) {
              final trip = trips[index];
              final title = trip['title'] ?? 'رحلة بدون اسم';
              final price = trip['price']?.toString() ?? 'غير محدد';
              final companyObj = trip['companyId'] as Map?;
              final companyName = (companyObj != null && companyObj['name'] != null) ? companyObj['name'] : 'شركة مجهولة';
              final imgUrl = (trip['images'] != null && trip['images'].isNotEmpty) 
                  ? trip['images'][0] 
                  : 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=400';

              return Card(
                elevation: 2,
                margin: const EdgeInsets.only(bottom: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    ClipRRect(
                      borderRadius: const BorderRadius.vertical(top: Radius.circular(16)),
                      child: Image.network(
                        imgUrl,
                        height: 150,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) => 
                            Container(height: 150, color: Colors.grey.shade200, child: const Icon(Icons.broken_image, size: 50, color: Colors.grey)),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Expanded(child: Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold), overflow: TextOverflow.ellipsis)),
                              const SizedBox(width: 8),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(color: Colors.orange.shade100, borderRadius: BorderRadius.circular(8)),
                                child: const Text('مميز', style: TextStyle(color: Colors.orange, fontSize: 10, fontWeight: FontWeight.bold)),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(companyName, style: const TextStyle(color: Colors.grey, fontSize: 13)),
                          const SizedBox(height: 12),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text('يبدأ من $price ج.م', style: const TextStyle(color: Colors.green, fontWeight: FontWeight.bold)),
                              ElevatedButton(
                                onPressed: () {},
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.orange,
                                  foregroundColor: Colors.white,
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                ),
                                child: const Text('التفاصيل'),
                              ),
                            ],
                          )
                        ],
                      ),
                    )
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


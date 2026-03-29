import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/trip_provider.dart';
import '../../widgets/trip_card.dart';
import 'package:go_router/go_router.dart';
import '../../providers/story_provider.dart';
import 'package:flutter_animate/flutter_animate.dart';

class HomePage extends ConsumerWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tripsAsync = ref.watch(tripsProvider(const TripFilter()));

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      drawer: Drawer(
        child: ListView(
          padding: EdgeInsets.zero,
          children: [
            DrawerHeader(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [const Color(0xFF0F172A), Colors.blueGrey.shade800],
                  begin: Alignment.topLeft,
                ),
              ),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  CircleAvatar(radius: 30, backgroundColor: Colors.white, child: Text('R', style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.orange))),
                  SizedBox(height: 12),
                  Text('رحلتي (Re7lty)', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                ],
              ),
            ),
            ListTile(
              leading: const Icon(Icons.business_center),
              title: const Text('شركات السياحة', style: TextStyle(fontWeight: FontWeight.bold)),
              onTap: () {
                Navigator.pop(context);
                context.push('/corporate-trips');
              },
            ),
            ListTile(
              leading: const Icon(Icons.leaderboard),
              title: const Text('لوحة المتصدرين', style: TextStyle(fontWeight: FontWeight.bold)),
              onTap: () {
                Navigator.pop(context);
                context.push('/leaderboard');
              },
            ),
            ListTile(
              leading: const Icon(Icons.support_agent),
              title: const Text('الدعم الفني', style: TextStyle(fontWeight: FontWeight.bold)),
              onTap: () {
                Navigator.pop(context);
                context.push('/support');
              },
            ),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.settings),
              title: const Text('الإعدادات', style: TextStyle(fontWeight: FontWeight.bold)),
              onTap: () {
                Navigator.pop(context);
                context.push('/settings');
              },
            ),
          ],
        ),
      ),
      appBar: AppBar(
        flexibleSpace: Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [Colors.orange.shade50, Colors.white],
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
            ),
          ),
        ),
        title: GestureDetector(
          onTap: () => context.push('/search'),
          child: Container(
            height: 40,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.grey.shade300),
            ),
            child: const Row(
              children: [
                Icon(Icons.search, size: 20, color: Colors.grey),
                SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'ابحث عن رحلة، مكان...', 
                    style: TextStyle(fontSize: 14, color: Colors.grey),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
        ),
        actions: [
          IconButton(icon: const Icon(Icons.notifications_outlined), onPressed: () {}),
          const SizedBox(width: 4),
        ],
      ),
      floatingActionButton: ElevatedButton.icon(
        onPressed: () => context.push('/ai-chat'),
        icon: const Icon(Icons.auto_awesome, color: Colors.white),
        label: const Text('مخطط الذكاء الاصطناعي !', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold)),
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFFF97316),
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          elevation: 8,
          shadowColor: Colors.orange.withOpacity(0.5),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
        ),
      ).animate().slideX(begin: 1.0).fadeIn(delay: 300.ms),
      body: RefreshIndicator(
        onRefresh: () async {
          ref.refresh(tripsProvider(const TripFilter()));
        },
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: 16),
              const _StoriesSection(),

              const SizedBox(height: 24),

              // Leaderboard - Top Users (المتصدرين)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  children: [
                    const Icon(Icons.leaderboard_rounded, color: Colors.orange),
                    const SizedBox(width: 8),
                    const Text('المتصدرين للرحلات', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                height: 120,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  itemCount: 4,
                  itemBuilder: (context, index) {
                    final names = ['أحمد خالد', 'سارة محمد', 'يوسف', 'مصطفى'];
                    final points = ['🏆 2400', '💎 1800', '🥇 950', '🥈 400'];
                    return Container(
                      width: 100,
                      margin: const EdgeInsets.symmetric(horizontal: 8),
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20),
                        border: Border.all(color: index == 0 ? Colors.orange : Colors.grey.shade200, width: index == 0 ? 2 : 1),
                        boxShadow: [BoxShadow(color: Colors.grey.shade100, blurRadius: 10, offset: const Offset(0, 4))],
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Stack(
                            alignment: Alignment.topRight,
                            children: [
                              CircleAvatar(
                                radius: 24,
                                backgroundColor: Colors.orange.shade50,
                                child: Text('${index + 1}', style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.orange)),
                              ),
                              if (index == 0)
                                const Icon(Icons.stars, color: Colors.amber, size: 16),
                            ],
                          ),
                          const SizedBox(height: 8),
                          Text(names[index], style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13), overflow: TextOverflow.ellipsis),
                          Text(points[index], style: const TextStyle(color: Colors.orange, fontSize: 11, fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ).animate().scale(delay: (index * 100).ms);
                  },
                ),
              ),

              const SizedBox(height: 32),

              // Featured Trips Section
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('رحلات متميزة', style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold)),
                    TextButton(onPressed: () {}, child: const Text('عرض الكل', style: TextStyle(color: Colors.orange, fontWeight: FontWeight.bold))),
                  ],
                ),
              ),
              const SizedBox(height: 8),
              SizedBox(
                height: 340,
                child: tripsAsync.when(
                  data: (trips) => ListView.builder(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    itemCount: trips.length,
                    itemBuilder: (context, index) {
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 16), // Shadow space
                        child: TripCard(trip: trips[index]),
                      );
                    },
                  ),
                  loading: () => const Center(child: CircularProgressIndicator()),
                  error: (err, stack) => Center(child: Text('Error: $err')),
                ),
              ),

              const SizedBox(height: 16),

              // Corporate Trips Banner (رحلات شركات)
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: const Color(0xFF0F172A),
                  borderRadius: BorderRadius.circular(24),
                  image: DecorationImage(
                    image: const NetworkImage('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=600'),
                    fit: BoxFit.cover,
                    colorFilter: ColorFilter.mode(Colors.black.withOpacity(0.75), BlendMode.darken),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(color: Colors.orange, borderRadius: BorderRadius.circular(20)),
                      child: const Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.business_center_rounded, color: Colors.white, size: 16),
                          SizedBox(width: 8),
                          Text('رحلات الشركات السياحية', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 12)),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    const Text('اكتشف برامج سياحية احترافية 💼', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    const Text('رحلات منظمة ومضمونة من أفضل الشركات المعتمدة وبأسعار تنافسية.', style: TextStyle(color: Colors.white70, fontSize: 13, height: 1.5)),
                    const SizedBox(height: 20),
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () {},
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.white,
                          foregroundColor: Colors.black87,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        ),
                        child: const Text('استعرض رحلات الشركات', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                      ),
                    ),
                  ],
                ),
              ).animate().fadeIn().slideY(begin: 0.1),
              
              const SizedBox(height: 80), // Extra padding for FAB
            ],
          ),
        ),
      ),
    );
  }
}

class _StoriesSection extends ConsumerWidget {
  const _StoriesSection();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final storiesAsync = ref.watch(followingStoriesProvider);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
          child: Text('قصص المسافرين', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18)),
        ),
        SizedBox(
          height: 100,
          child: storiesAsync.when(
            data: (groups) => ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 12),
              itemCount: groups.length + 1,
              itemBuilder: (context, index) {
                if (index == 0) {
                  return _buildAddStory();
                }
                return _StoryCircle(group: groups[index - 1]);
              },
            ),
            loading: () => const Center(child: CircularProgressIndicator()),
            error: (err, stack) => const SizedBox.shrink(),
          ),
        ),
      ],
    );
  }

  Widget _buildAddStory() {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8),
      child: Column(
        children: [
          Stack(
            children: [
              CircleAvatar(radius: 32, backgroundColor: Colors.grey[200], child: const Icon(Icons.person, color: Colors.grey)),
              Positioned(
                bottom: 0,
                right: 0,
                child: Container(
                  padding: const EdgeInsets.all(2),
                  decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
                  child: const CircleAvatar(radius: 10, backgroundColor: Colors.orange, child: Icon(Icons.add, size: 14, color: Colors.white)),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          const Text('قصتك', style: TextStyle(fontSize: 12)),
        ],
      ),
    );
  }
}

class _StoryCircle extends StatelessWidget {
  final group;
  const _StoryCircle({required this.group});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 8),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(2.5),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: group.hasUnseen
                  ? const LinearGradient(colors: [Colors.orange, Colors.pink, Colors.purple])
                  : null,
              border: group.hasUnseen ? null : Border.all(color: Colors.grey[300]!, width: 1),
            ),
            child: CircleAvatar(
              radius: 30,
              backgroundColor: Colors.white,
              child: CircleAvatar(
                radius: 28,
                backgroundImage: group.imageUrl != null ? NetworkImage(group.imageUrl!) : null,
                child: group.imageUrl == null ? const Icon(Icons.person) : null,
              ),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            group.fullName.split(' ')[0],
            style: const TextStyle(fontSize: 11),
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ).animate().scale(delay: 100.ms, duration: 400.ms, curve: Curves.easeOutBack),
    );
  }
}

import 'package:flutter/material.dart';

class AppColors {
  static const backgroundDark = Color(0xFF0B0F14); // True Black من صورك
  static const darkBackground = Color(0xFF0B0F14); // لضمان التوافق مع الاسمين
  static const primaryBlue = Color(0xFF2563EB);
  static const primaryOrange = Color(0xFFFF7043); // البرتقالي المميز لرحلتي
  static const cardDark = Color(0xFF1B1F24);
  
  static const blueGradient = LinearGradient(
    colors: [Color(0xFF2563EB), Color(0xFF3B82F6)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
  
  static const orangeGradient = LinearGradient(
    colors: [Color(0xFFFF7043), Color(0xFFFFA726)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}


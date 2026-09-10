import 'package:flutter/material.dart';

abstract final class AppTypography {
  static TextTheme textTheme(Color primary, Color secondary) {
    return TextTheme(
      headlineLarge: TextStyle(
        fontSize: 38,
        fontWeight: FontWeight.w600,
        letterSpacing: -1.2,
        height: 1.12,
        color: primary,
      ),
      headlineMedium: TextStyle(
        fontSize: 28,
        fontWeight: FontWeight.w600,
        height: 1.2,
        color: primary,
      ),
      titleLarge: TextStyle(
        fontSize: 22,
        fontWeight: FontWeight.w600,
        height: 1.25,
        color: primary,
      ),
      titleMedium: TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.w600,
        height: 1.3,
        color: primary,
      ),
      bodyLarge: TextStyle(
        fontSize: 16,
        height: 1.45,
        color: primary,
      ),
      bodyMedium: TextStyle(
        fontSize: 14,
        height: 1.45,
        color: secondary,
      ),
      labelLarge: TextStyle(
        fontSize: 14,
        fontWeight: FontWeight.w600,
        color: primary,
      ),
    );
  }
}

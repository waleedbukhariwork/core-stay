import 'package:codecore_mobile/app/theme/app_colors.dart';
import 'package:codecore_mobile/app/theme/app_radii.dart';
import 'package:codecore_mobile/app/theme/app_typography.dart';
import 'package:flutter/material.dart';

abstract final class AppTheme {
  static ThemeData get light => _theme(AppColors.light, Brightness.light);

  static ThemeData get dark => _theme(AppColors.dark, Brightness.dark);

  static ThemeData _theme(AppColors colors, Brightness brightness) {
    final textTheme = AppTypography.textTheme(
      colors.textPrimary,
      colors.textSecondary,
    );

    return ThemeData(
      useMaterial3: true,
      brightness: brightness,
      scaffoldBackgroundColor: colors.background,
      colorScheme: ColorScheme(
        brightness: brightness,
        primary: colors.accent,
        onPrimary: brightness == Brightness.dark
            ? const Color(0xFF04221C)
            : const Color(0xFFFFFFFF),
        secondary: colors.accent,
        onSecondary: brightness == Brightness.dark
            ? const Color(0xFF04221C)
            : const Color(0xFFFFFFFF),
        error: colors.error,
        onError: const Color(0xFFFFFFFF),
        surface: colors.surface,
        onSurface: colors.textPrimary,
      ),
      textTheme: textTheme,
      appBarTheme: AppBarTheme(
        backgroundColor: colors.background,
        foregroundColor: colors.textPrimary,
        elevation: 0,
        centerTitle: false,
      ),
      cardTheme: CardThemeData(
        color: colors.surface,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadii.lg),
          side: BorderSide(color: colors.border),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: const Size(48, 48),
          backgroundColor: colors.accent,
          foregroundColor: brightness == Brightness.dark
              ? const Color(0xFF04221C)
              : const Color(0xFFFFFFFF),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppRadii.md),
          ),
        ),
      ),
      extensions: [colors],
    );
  }
}

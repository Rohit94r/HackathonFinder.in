/**
 * Where a visitor's dark-mode choice is stored. Only "dark" is ever stored;
 * light is the default. Shared by the pre-paint script in app/layout.tsx and useTheme.
 */
export const THEME_KEY = 'hf_theme';

/** Set to "paused" when a visitor pauses the homepage animations (see MotionToggle). */
export const MOTION_KEY = 'hf_motion';

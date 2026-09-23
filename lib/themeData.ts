export interface ThemeOption {
  id: 'woody' | 'sky' | 'sand' | 'midnight';
  name: string;
  tagline: string;
  description: string;
  accent: string;
  accentLight: string;
  accentRgb: string;
  glassBg: string;
  glassBorder: string;
  textPrimary: string;
  textMuted: string;
  chipActiveBg: string;
  chipActiveBorder: string;
}

export const THEMES: Record<string, ThemeOption> = {
  woody: {
    id: 'woody',
    name: 'Woody & Warm',
    tagline: 'Mahogany · Amber Glass · Warm Cream',
    description: 'Deep warm mahogany wood tones with amber glass transparency and soft cream accents.',
    accent: '#d48b54',
    accentLight: '#f5c6a5',
    accentRgb: '212, 139, 84',
    glassBg: 'rgba(38, 25, 20, 0.48)',
    glassBorder: 'rgba(212, 139, 84, 0.22)',
    textPrimary: '#fefae0',
    textMuted: '#c5b49e',
    chipActiveBg: 'rgba(212, 139, 84, 0.22)',
    chipActiveBorder: 'rgba(212, 139, 84, 0.45)',
  },
  sky: {
    id: 'sky',
    name: 'Sky & Stone',
    tagline: 'Muted Slate · Pebble Grey · Frosted Glass',
    description: 'Calm Nordic slate blue with frosted glass surfaces and cool pebble grey accents.',
    accent: '#7da1b8',
    accentLight: '#b8d5e8',
    accentRgb: '125, 161, 184',
    glassBg: 'rgba(20, 28, 38, 0.48)',
    glassBorder: 'rgba(125, 161, 184, 0.22)',
    textPrimary: '#f1f5f9',
    textMuted: '#94a3b8',
    chipActiveBg: 'rgba(125, 161, 184, 0.22)',
    chipActiveBorder: 'rgba(125, 161, 184, 0.45)',
  },
  sand: {
    id: 'sand',
    name: 'Elegance & Sand',
    tagline: 'Terracotta · Warm Sand · Coastal Beige',
    description: 'Natural earthen terracotta, warm beach sands, and raw coastal timber finishes.',
    accent: '#c27d66',
    accentLight: '#e4b2a3',
    accentRgb: '194, 125, 102',
    glassBg: 'rgba(36, 26, 23, 0.48)',
    glassBorder: 'rgba(194, 125, 102, 0.22)',
    textPrimary: '#faf4ee',
    textMuted: '#c2b0a3',
    chipActiveBg: 'rgba(194, 125, 102, 0.22)',
    chipActiveBorder: 'rgba(194, 125, 102, 0.45)',
  },
  midnight: {
    id: 'midnight',
    name: 'Midnight Slate',
    tagline: 'Frosted Obsidian · Deep Charcoal · Muted Gold',
    description: 'Dark obsidian glass with subtle brushed gold accents and quiet matte shadows.',
    accent: '#c5a880',
    accentLight: '#e5d7c3',
    accentRgb: '197, 168, 128',
    glassBg: 'rgba(16, 18, 22, 0.58)',
    glassBorder: 'rgba(197, 168, 128, 0.22)',
    textPrimary: '#f8fafc',
    textMuted: '#9aa0a6',
    chipActiveBg: 'rgba(197, 168, 128, 0.22)',
    chipActiveBorder: 'rgba(197, 168, 128, 0.45)',
  },
};

export interface WallpaperItem {
  id: string;
  title: string;
  subtitle: string;
  path: string;
  moodSounds: string[];
  fallbackGradient: string;
}

export const WALLPAPERS: WallpaperItem[] = [
  {
    id: 'nordic_valley',
    title: 'Misty Nordic Valley',
    subtitle: 'Faroe Islands · Rolling Fog · Solitary Cabin',
    path: '/wallpapers/misty_nordic_valley_1790157520994.jpg',
    moodSounds: ['rain', 'ambient'],
    fallbackGradient: 'linear-gradient(135deg, #0e1a14 0%, #172a21 50%, #08110c 100%)',
  },
  {
    id: 'golden_meadow',
    title: 'Sunset Golden Meadow',
    subtitle: 'Makoto Shinkai · Retro Coupe · Golden Sunbeams',
    path: '/wallpapers/golden_retro_meadow_1790157534075.jpg',
    moodSounds: ['lofi', 'custom'],
    fallbackGradient: 'linear-gradient(135deg, #2b1f11 0%, #4a341a 50%, #171109 100%)',
  },
  {
    id: 'vibrant_hills',
    title: 'Studio Ghibli Lush Hills',
    subtitle: 'Vibrant Green Grass · Summer Clouds · Pure Air',
    path: '/wallpapers/vibrant_green_hills_1790157546811.jpg',
    moodSounds: ['forest', 'ambient'],
    fallbackGradient: 'linear-gradient(135deg, #102613 0%, #1e4524 50%, #0a170b 100%)',
  },
  {
    id: 'lone_tree',
    title: 'Minimalist Lone Tree',
    subtitle: 'Curving Meadow · Pastel Teal Sky · Solitude',
    path: '/wallpapers/minimalist_lone_tree_1790157557493.jpg',
    moodSounds: ['forest', 'ambient'],
    fallbackGradient: 'linear-gradient(135deg, #102525 0%, #1a3d3c 50%, #0a1717 100%)',
  },
  {
    id: 'fuji_starry',
    title: 'Mount Fuji Starry Twilight',
    subtitle: 'Lake Kawaguchi · Shooting Stars · Deep Indigo',
    path: '/wallpapers/fuji_starry_lake_1790157567609.jpg',
    moodSounds: ['lofi', 'ambient'],
    fallbackGradient: 'linear-gradient(135deg, #1b1736 0%, #2f2757 50%, #100e21 100%)',
  },
  {
    id: 'fuji_sakura',
    title: 'Torii Shrine & Pink Sakura',
    subtitle: 'Mount Fuji Sunset · Glowing Lanterns · Cherry Blossoms',
    path: '/wallpapers/fuji_shrine_sakura_1790157578575.jpg',
    moodSounds: ['lofi', 'custom'],
    fallbackGradient: 'linear-gradient(135deg, #331526 0%, #52223e 50%, #1c0c15 100%)',
  },
  {
    id: 'fuji_twilight',
    title: 'Torii Gate Dusk Overlook',
    subtitle: 'Suruga Bay Twilight · Purple Horizon · Snow Crest',
    path: '/wallpapers/fuji_torii_twilight_1790157590243.jpg',
    moodSounds: ['lofi', 'ambient'],
    fallbackGradient: 'linear-gradient(135deg, #251636 0%, #41265c 50%, #160d21 100%)',
  },
  {
    id: 'fuji_torii_bw',
    title: 'Monochrome Torii & Fuji',
    subtitle: 'Fine-Art Monochrome · High Contrast · Dramatic Peak',
    path: '/wallpapers/fuji_torii_monochrome_1790157603849.jpg',
    moodSounds: ['whitenoise', 'ambient'],
    fallbackGradient: 'linear-gradient(135deg, #1a1a1a 0%, #333333 50%, #0d0d0d 100%)',
  },
  {
    id: 'fuji_reflection_bw',
    title: 'Night Mirror Reflection',
    subtitle: 'Minimalist Lake Reflection · Starry Night · Pristine Snow',
    path: '/wallpapers/fuji_night_monochrome_1790157614910.jpg',
    moodSounds: ['whitenoise', 'ambient'],
    fallbackGradient: 'linear-gradient(135deg, #121212 0%, #262626 50%, #080808 100%)',
  },
  {
    id: 'fuji_kanji_bw',
    title: "Kanji '愛' Lake Fuji",
    subtitle: 'Sakura Shoreline · Love Symbol · Pure Monochrome',
    path: '/wallpapers/fuji_kanji_monochrome_1790157627455.jpg',
    moodSounds: ['whitenoise', 'custom'],
    fallbackGradient: 'linear-gradient(135deg, #1f1f1f 0%, #363636 50%, #0f0f0f 100%)',
  },
];

export interface AppSettings {
  focusDuration: number; // in minutes (default 25)
  shortBreakDuration: number; // in minutes (default 5)
  longBreakDuration: number; // in minutes (default 15)
  cyclesBeforeLongBreak: number; // default 4
  autoStartBreaks: boolean;
  autoStartFocus: boolean;
  sfxEnabled: boolean;
  tickEnabled: boolean;
  sfxVolume: number;
  ambientVolume: number;
  wallpaperCycleSeconds: number; // 0 for off, 30, 60, 120, 300, 600, 900
  wallpaperCycleIntervalMinutes: number; // for backward compatibility
  wallpaperQueueMode: 'mood' | 'shuffle' | 'sequential';
  wallpaperQuality: 'crisp' | 'vibrant' | 'cinema' | 'monochrome';
  wallpaperMotion: 'static' | 'kenburns';
  scrimDimLevel: number; // 0.1 to 0.75
  themeId: 'woody' | 'sky' | 'sand' | 'midnight';
}

export const DEFAULT_SETTINGS: AppSettings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  cyclesBeforeLongBreak: 4,
  autoStartBreaks: false,
  autoStartFocus: false,
  sfxEnabled: true,
  tickEnabled: false,
  sfxVolume: 0.7,
  ambientVolume: 0.5,
  wallpaperCycleSeconds: 300,
  wallpaperCycleIntervalMinutes: 5,
  wallpaperQueueMode: 'mood',
  wallpaperQuality: 'crisp',
  wallpaperMotion: 'static',
  scrimDimLevel: 0.38,
  themeId: 'woody',
};

import React from 'react';
import { themeTokens } from '@ymenet/theme';

export interface CategoryIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  active?: boolean;
  accentColor?: string;
  outlineColor?: string;
}

export const BagIcon: React.FC<CategoryIconProps> = ({
  size = 48,
  active = false,
  accentColor = themeTokens.colors.iconAccent,
  outlineColor = themeTokens.colors.iconOutline,
  className = '',
  ...props
}) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width={size} height={size} fill="none" className={className} {...props}>
    <path d="M16 22 C16 18, 18 16, 22 16 H42 C46 16, 48 18, 48 22 L45 50 C44.5 53, 43 54, 40 54 H24 C21 54, 19.5 53, 19 50 Z" stroke={outlineColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill={themeTokens.colors.background} />
    <path d="M23 16.5 C23 27, 41 27, 41 16.5 Z" fill={accentColor} stroke={outlineColor} strokeWidth="2.5" strokeLinejoin="round" />
  </svg>
);

export const FashionIcon: React.FC<CategoryIconProps> = ({
  size = 48,
  active = false,
  accentColor = themeTokens.colors.iconAccent,
  outlineColor = themeTokens.colors.iconOutline,
  className = '',
  ...props
}) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width={size} height={size} fill="none" className={className} {...props}>
    <path d="M21 44 H43 V50 C43 51.5, 41.5 53, 40 53 H24 C22.5 53, 21 51.5, 21 50 Z" fill={accentColor} />
    <path d="M24 14 C27 18, 37 18, 40 14 L50 19 L46 29 L42 27 V51 C42 53, 40 54, 38 54 H26 C24 54, 22 53, 22 51 V27 L18 29 L14 19 L24 14 Z" stroke={outlineColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M24 14 C27 19, 37 19, 40 14" stroke={outlineColor} strokeWidth="3" strokeLinecap="round" />
    <path d="M21 44 H43" stroke={outlineColor} strokeWidth="2.5" />
  </svg>
);

export const MobilesIcon: React.FC<CategoryIconProps> = ({
  size = 48,
  active = false,
  accentColor = themeTokens.colors.iconAccent,
  outlineColor = themeTokens.colors.iconOutline,
  className = '',
  ...props
}) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width={size} height={size} fill="none" className={className} {...props}>
    <rect x="18" y="10" width="28" height="44" rx="6" stroke={outlineColor} strokeWidth="3" fill={themeTokens.colors.background} />
    <path d="M19.5 44 H44.5 V49 C44.5 51.2, 42.7 52.5, 40.5 52.5 H23.5 C21.3 52.5, 19.5 51.2, 19.5 49 Z" fill={accentColor} />
    <line x1="28" y1="15" x2="36" y2="15" stroke={outlineColor} strokeWidth="2.5" strokeLinecap="round" />
    <line x1="19.5" y1="44" x2="44.5" y2="44" stroke={outlineColor} strokeWidth="2.5" />
  </svg>
);

export const ElectronicsIcon: React.FC<CategoryIconProps> = ({
  size = 48,
  active = false,
  accentColor = themeTokens.colors.iconAccent,
  outlineColor = themeTokens.colors.iconOutline,
  className = '',
  ...props
}) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width={size} height={size} fill="none" className={className} {...props}>
    <rect x="15" y="14" width="34" height="25" rx="3" stroke={outlineColor} strokeWidth="3" fill={themeTokens.colors.background} />
    <rect x="19" y="18" width="26" height="17" rx="1" stroke={outlineColor} strokeWidth="1.5" fill="none" opacity="0.3" />
    <path d="M10 41 H54 C55.5 41, 56 42.5, 54.5 45 L52 49 C51 51, 49 51, 47 51 H17 C15 51, 13 51, 12 49 L9.5 45 C8 42.5, 8.5 41, 10 41 Z" fill={accentColor} stroke={outlineColor} strokeWidth="3" strokeLinejoin="round" />
    <path d="M28 41 H36 V43 H28 Z" fill={outlineColor} />
  </svg>
);

export const BeautyIcon: React.FC<CategoryIconProps> = ({
  size = 48,
  active = false,
  accentColor = themeTokens.colors.iconAccent,
  outlineColor = themeTokens.colors.iconOutline,
  className = '',
  ...props
}) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width={size} height={size} fill="none" className={className} {...props}>
    <path d="M26 28 V20 C26 20, 26 19, 27 18 L36 12 C37.5 11, 38 12.5, 38 14 V28 Z" fill={accentColor} />
    <path d="M26 28 V20 C26 20, 26 19, 27 18 L36 12 C37.5 11, 38 12.5, 38 14 V28 Z" stroke={outlineColor} strokeWidth="3" strokeLinejoin="round" />
    <rect x="23" y="28" width="18" height="26" rx="3" stroke={outlineColor} strokeWidth="3" fill={themeTokens.colors.background} />
    <path d="M23 35 H41" stroke={outlineColor} strokeWidth="2.5" />
  </svg>
);

export const HomeIcon: React.FC<CategoryIconProps> = ({
  size = 48,
  active = false,
  accentColor = themeTokens.colors.iconAccent,
  outlineColor = themeTokens.colors.iconOutline,
  className = '',
  ...props
}) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width={size} height={size} fill="none" className={className} {...props}>
    <path d="M23 14 H41 L43 23 H21 Z" fill={accentColor} />
    <path d="M23 14 H41 L45 32 H19 L23 14 Z" stroke={outlineColor} strokeWidth="3" strokeLinejoin="round" fill="none" />
    <path d="M21 23 H43" stroke={outlineColor} strokeWidth="2.5" />
    <line x1="32" y1="32" x2="32" y2="50" stroke={outlineColor} strokeWidth="3" strokeLinecap="round" />
    <path d="M23 50 H41" stroke={outlineColor} strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export const AppliancesIcon: React.FC<CategoryIconProps> = ({
  size = 48,
  active = false,
  accentColor = themeTokens.colors.iconAccent,
  outlineColor = themeTokens.colors.iconOutline,
  className = '',
  ...props
}) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width={size} height={size} fill="none" className={className} {...props}>
    <rect x="10" y="14" width="44" height="28" rx="3" stroke={outlineColor} strokeWidth="3" fill={themeTokens.colors.background} />
    <path d="M11.5 36.5 H52.5 V39 C52.5 40.5, 51 41.5, 49.5 41.5 H14.5 C13 41.5, 11.5 40.5, 11.5 39 Z" fill={accentColor} />
    <line x1="11.5" y1="36.5" x2="52.5" y2="36.5" stroke={outlineColor} strokeWidth="2" />
    <path d="M22 42 L16 52 M42 42 L48 52" stroke={outlineColor} strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export const ToysIcon: React.FC<CategoryIconProps> = ({
  size = 48,
  active = false,
  accentColor = themeTokens.colors.iconAccent,
  outlineColor = themeTokens.colors.iconOutline,
  className = '',
  ...props
}) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width={size} height={size} fill="none" className={className} {...props}>
    <circle cx="21" cy="17" r="5" stroke={outlineColor} strokeWidth="2.5" fill={themeTokens.colors.background} />
    <circle cx="43" cy="17" r="5" stroke={outlineColor} strokeWidth="2.5" fill={themeTokens.colors.background} />
    <path d="M21 28 C17 34, 16 46, 23 51 C27 53, 37 53, 41 51 C48 46, 47 34, 43 28 Z" stroke={outlineColor} strokeWidth="3" fill={themeTokens.colors.background} />
    <ellipse cx="32" cy="23" rx="11" ry="9" stroke={outlineColor} strokeWidth="3" fill={themeTokens.colors.background} />
    <circle cx="32" cy="40" r="7.5" fill={accentColor} stroke={outlineColor} strokeWidth="2" />
    <circle cx="28" cy="21" r="1.2" fill={outlineColor} />
    <circle cx="36" cy="21" r="1.2" fill={outlineColor} />
    <ellipse cx="32" cy="24" rx="2.5" ry="1.8" stroke={outlineColor} strokeWidth="1.5" fill={themeTokens.colors.background} />
  </svg>
);

export const NutritionIcon: React.FC<CategoryIconProps> = ({
  size = 48,
  active = false,
  accentColor = themeTokens.colors.iconAccent,
  outlineColor = themeTokens.colors.iconOutline,
  className = '',
  ...props
}) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width={size} height={size} fill="none" className={className} {...props}>
    <rect x="22" y="10" width="20" height="7" rx="2" stroke={outlineColor} strokeWidth="3" fill={themeTokens.colors.background} />
    <rect x="18" y="17" width="28" height="35" rx="5" stroke={outlineColor} strokeWidth="3" fill={themeTokens.colors.background} />
    <rect x="19.5" y="27" width="25" height="15" fill={accentColor} />
    <line x1="19.5" y1="27" x2="44.5" y2="27" stroke={outlineColor} strokeWidth="2.5" />
    <line x1="19.5" y1="42" x2="44.5" y2="42" stroke={outlineColor} strokeWidth="2.5" />
  </svg>
);

export const AutoIcon: React.FC<CategoryIconProps> = ({
  size = 48,
  active = false,
  accentColor = themeTokens.colors.iconAccent,
  outlineColor = themeTokens.colors.iconOutline,
  className = '',
  ...props
}) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width={size} height={size} fill="none" className={className} {...props}>
    <path d="M14 36 C14 20, 24 12, 42 12 C52 12, 54 22, 54 32 C54 44, 44 52, 30 52 C20 52, 14 46, 14 36 Z" stroke={outlineColor} strokeWidth="3" strokeLinejoin="round" fill={themeTokens.colors.background} />
    <path d="M34 22 H47 C50.5 22, 51.5 26, 50 33 L46 38 H34 Z" fill={accentColor} stroke={outlineColor} strokeWidth="2.5" strokeLinejoin="round" />
    <path d="M22 44 H28" stroke={outlineColor} strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export const SportsIcon: React.FC<CategoryIconProps> = ({
  size = 48,
  active = false,
  accentColor = themeTokens.colors.iconAccent,
  outlineColor = themeTokens.colors.iconOutline,
  className = '',
  ...props
}) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width={size} height={size} fill="none" className={className} {...props}>
    <path d="M44 12 L50 18" stroke={outlineColor} strokeWidth="3.5" strokeLinecap="round" />
    <path d="M44 18 L18 44 C16 46, 16 49, 18 51 L20 53 C22 55, 25 55, 27 53 L53 27 C54.5 25.5, 54.5 23, 53 21.5 L47 15.5" stroke={outlineColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill={themeTokens.colors.background} />
    <line x1="46" y1="14" x2="48" y2="16" stroke={outlineColor} strokeWidth="2" />
    <circle cx="16" cy="24" r="6.5" fill={accentColor} stroke={outlineColor} strokeWidth="2.5" />
    <path d="M12 24 C14 21, 18 21, 20 24" stroke={outlineColor} strokeWidth="1.8" fill="none" />
  </svg>
);

export const FurnitureIcon: React.FC<CategoryIconProps> = ({
  size = 48,
  active = false,
  accentColor = themeTokens.colors.iconAccent,
  outlineColor = themeTokens.colors.iconOutline,
  className = '',
  ...props
}) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width={size} height={size} fill="none" className={className} {...props}>
    <path d="M20 18 C20 14, 44 14, 44 18 V34 H20 Z" stroke={outlineColor} strokeWidth="3" strokeLinejoin="round" fill={themeTokens.colors.background} />
    <rect x="18" y="34" width="28" height="9" rx="2" fill={accentColor} stroke={outlineColor} strokeWidth="2.5" />
    <path d="M11 28 C11 26, 13 25, 15 25 H18 V43 H14 C12.3 43, 11 41.7, 11 40 Z" stroke={outlineColor} strokeWidth="3" strokeLinejoin="round" fill={themeTokens.colors.background} />
    <path d="M53 28 C53 26, 51 25, 49 25 H46 V43 H50 C51.7 43, 53 41.7, 53 40 Z" stroke={outlineColor} strokeWidth="3" strokeLinejoin="round" fill={themeTokens.colors.background} />
    <line x1="16" y1="43" x2="12" y2="53" stroke={outlineColor} strokeWidth="3" strokeLinecap="round" />
    <line x1="48" y1="43" x2="52" y2="53" stroke={outlineColor} strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export const BooksIcon: React.FC<CategoryIconProps> = ({
  size = 48,
  active = false,
  accentColor = themeTokens.colors.iconAccent,
  outlineColor = themeTokens.colors.iconOutline,
  className = '',
  ...props
}) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width={size} height={size} fill="none" className={className} {...props}>
    <rect x="18" y="10" width="28" height="44" rx="4" stroke={outlineColor} strokeWidth="3" fill={themeTokens.colors.background} />
    <path d="M19.5 11.5 H25.5 V52.5 H19.5 C18 52.5, 17 51, 17 49.5 V14.5 C17 13, 18 11.5, 19.5 11.5 Z" fill={accentColor} />
    <line x1="25.5" y1="10" x2="25.5" y2="54" stroke={outlineColor} strokeWidth="2.5" />
    <path d="M34 10 V20 L38 17 L42 20 V10" stroke={outlineColor} strokeWidth="2" fill="none" />
  </svg>
);

export const ScooterIcon: React.FC<CategoryIconProps> = ({
  size = 48,
  active = false,
  accentColor = themeTokens.colors.iconAccent,
  outlineColor = themeTokens.colors.iconOutline,
  className = '',
  ...props
}) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width={size} height={size} fill="none" className={className} {...props}>
    <path d="M46 16 L42 30" stroke={outlineColor} strokeWidth="3" strokeLinecap="round" />
    <path d="M42 16 H50" stroke={outlineColor} strokeWidth="3" strokeLinecap="round" />
    <path d="M42 30 L36 38 H22 C16 38, 12 32, 16 26 H28" stroke={outlineColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M16 26 C16 24, 20 23, 28 23 H32 C33 23, 34 24, 34 26 C34 28, 32 28, 30 28 H18 Z" stroke={outlineColor} strokeWidth="2.5" fill={outlineColor} />
    <circle cx="18" cy="46" r="7.5" fill={accentColor} stroke={outlineColor} strokeWidth="3" />
    <circle cx="46" cy="46" r="7.5" fill={accentColor} stroke={outlineColor} strokeWidth="3" />
    <circle cx="18" cy="46" r="2.5" fill={outlineColor} />
    <circle cx="46" cy="46" r="2.5" fill={outlineColor} />
    <line x1="24" y1="44" x2="38" y2="44" stroke={outlineColor} strokeWidth="3" strokeLinecap="round" />
  </svg>
);

export function getCategoryIcon(name: string, active = false, isDarkMode = false, size = 30) {
  const lower = name.toLowerCase();
  const accent = themeTokens.colors.iconAccent;
  const outline = isDarkMode ? themeTokens.colors.iconOutlineLight : themeTokens.colors.iconOutline;

  if (lower.includes('diy') || lower.includes('craft') || lower.includes('supplies')) {
    return <HomeIcon size={size} active={active} accentColor={accent} outlineColor={outline} />;
  }
  if (lower.includes('handicraft') || lower.includes('artisan') || lower.includes('pottery') || lower.includes('ceramic')) {
    return <BagIcon size={size} active={active} accentColor={accent} outlineColor={outline} />;
  }

  if (lower.includes('fashion') || lower.includes('cloth') || lower.includes('saree') || lower.includes('wear')) {
    return <FashionIcon size={size} active={active} accentColor={accent} outlineColor={outline} />;
  }
  if (lower.includes('mobile') || lower.includes('phone')) {
    return <MobilesIcon size={size} active={active} accentColor={accent} outlineColor={outline} />;
  }
  if (lower.includes('electronic') || lower.includes('tech') || lower.includes('gadget')) {
    return <ElectronicsIcon size={size} active={active} accentColor={accent} outlineColor={outline} />;
  }
  if (lower.includes('beauty') || lower.includes('personal') || lower.includes('cosmetic')) {
    return <BeautyIcon size={size} active={active} accentColor={accent} outlineColor={outline} />;
  }
  if (lower.includes('home') || lower.includes('living') || lower.includes('decor') || lower.includes('kitchen')) {
    return <HomeIcon size={size} active={active} accentColor={accent} outlineColor={outline} />;
  }
  if (lower.includes('appliance')) {
    return <AppliancesIcon size={size} active={active} accentColor={accent} outlineColor={outline} />;
  }
  if (lower.includes('toy') || lower.includes('baby') || lower.includes('kids')) {
    return <ToysIcon size={size} active={active} accentColor={accent} outlineColor={outline} />;
  }
  if (lower.includes('nutrition') || lower.includes('food') || lower.includes('drink') || lower.includes('grocery')) {
    return <NutritionIcon size={size} active={active} accentColor={accent} outlineColor={outline} />;
  }
  if (lower.includes('auto') || lower.includes('vehicle') || lower.includes('car')) {
    return <AutoIcon size={size} active={active} accentColor={accent} outlineColor={outline} />;
  }
  if (lower.includes('sport') || lower.includes('fitness') || lower.includes('gym')) {
    return <SportsIcon size={size} active={active} accentColor={accent} outlineColor={outline} />;
  }
  if (lower.includes('furniture') || lower.includes('furnishing')) {
    return <FurnitureIcon size={size} active={active} accentColor={accent} outlineColor={outline} />;
  }
  if (lower.includes('book') || lower.includes('stationery') || lower.includes('education')) {
    return <BooksIcon size={size} active={active} accentColor={accent} outlineColor={outline} />;
  }
  if (lower.includes('scooter') || lower.includes('bike') || lower.includes('two wheeler')) {
    return <ScooterIcon size={size} active={active} accentColor={accent} outlineColor={outline} />;
  }
  return <BagIcon size={size} active={active} accentColor={accent} outlineColor={outline} />;
}

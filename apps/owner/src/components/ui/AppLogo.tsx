import React from 'react';
import { QrCode } from 'lucide-react';
import { useBrandStore } from '../../store/useBrandStore';

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTitle?: boolean;
  center?: boolean;
  className?: string;
  whiteLogo?: boolean;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 'md',
  showTitle = true,
  center = false,
  className = '',
  whiteLogo = false,
}) => {
  const { appName, appLogoUrl } = useBrandStore();

  const dimensions = {
    sm: { box: 'w-7 h-7 rounded-[6px]', icon: 16, text: 'text-sm font-semibold' },
    md: { box: 'w-8 h-8 rounded-[8px]', icon: 18, text: 'text-base font-semibold' },
    lg: { box: 'w-9 h-9 rounded-[8px]', icon: 20, text: 'text-lg font-semibold' },
    xl: { box: 'w-11 h-11 rounded-[10px]', icon: 24, text: 'text-xl font-semibold' },
  }[size];

  return (
    <div
      className={`flex items-center gap-2.5 select-none whitespace-nowrap ${center ? 'justify-center' : ''} ${className}`}
    >
      {appLogoUrl ? (
        <img
          src={appLogoUrl}
          alt={appName}
          className={`${dimensions.box} object-cover`}
        />
      ) : (
        <div
          className={`${dimensions.box} flex items-center justify-center shrink-0 ${
            whiteLogo
              ? 'bg-on-primary text-primary'
              : 'bg-primary text-on-primary'
          }`}
        >
          <QrCode size={dimensions.icon} strokeWidth={2.4} />
        </div>
      )}

      {showTitle && (
        <span
          className={`tracking-tight ${
            whiteLogo ? 'text-on-primary' : 'text-text'
          } ${dimensions.text}`}
        >
          {appName}
        </span>
      )}
    </div>
  );
};

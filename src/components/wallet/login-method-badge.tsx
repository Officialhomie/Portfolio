'use client';

/**
 * Login Method Badge Component
 * Displays the authentication method used by the user
 * Shows: email, Google, Twitter, GitHub, Discord, Apple, etc.
 */

import { useLoginMethod } from '@/hooks/useLoginMethod';
import { Badge } from '@/components/ui/badge';
import { Mail, Wallet, Phone, Globe, MessageSquare, Hash, Send, Music } from 'lucide-react';

export function LoginMethodBadge() {
  const { primaryMethod, loginMethods, hasMultipleMethods } = useLoginMethod();

  if (!primaryMethod) {
    return null;
  }

  // Get icon based on login method
  const getIcon = (type: string) => {
    const iconClass = "w-3 h-3";

    switch (type) {
      case 'email':
        return <Mail className={iconClass} />;
      case 'google':
        return <Globe className={iconClass} />;
      case 'twitter':
        return <MessageSquare className={iconClass} />;
      case 'github':
        return <Globe className={iconClass} />;
      case 'discord':
        return <MessageSquare className={iconClass} />;
      case 'apple':
        return <Globe className={iconClass} />;
      case 'wallet':
        return <Wallet className={iconClass} />;
      case 'phone':
      case 'sms':
        return <Phone className={iconClass} />;
      case 'farcaster':
        return <Hash className={iconClass} />;
      case 'telegram':
        return <Send className={iconClass} />;
      case 'linkedin':
        return <Globe className={iconClass} />;
      case 'tiktok':
        return <Music className={iconClass} />;
      case 'instagram':
        return <Hash className={iconClass} />;
      case 'spotify':
        return <Music className={iconClass} />;
      default:
        return null;
    }
  };

  // Get display name
  const getDisplayName = (type: string) => {
    switch (type) {
      case 'email':
        return 'Email';
      case 'google':
        return 'Google';
      case 'twitter':
        return 'Twitter';
      case 'github':
        return 'GitHub';
      case 'discord':
        return 'Discord';
      case 'apple':
        return 'Apple';
      case 'wallet':
        return 'Wallet';
      case 'phone':
      case 'sms':
        return 'SMS';
      case 'farcaster':
        return 'Farcaster';
      case 'telegram':
        return 'Telegram';
      case 'linkedin':
        return 'LinkedIn';
      case 'tiktok':
        return 'TikTok';
      case 'instagram':
        return 'Instagram';
      case 'spotify':
        return 'Spotify';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  // Get identifier (email, username, or phone)
  const getIdentifier = () => {
    if (primaryMethod.email) {
      return primaryMethod.email;
    }
    if (primaryMethod.username) {
      return `@${primaryMethod.username}`;
    }
    if (primaryMethod.phone) {
      return primaryMethod.phone;
    }
    if (primaryMethod.address) {
      // Truncate wallet address
      const addr = primaryMethod.address;
      return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    }
    return null;
  };

  return (
    <div className="flex items-center gap-2">
      <Badge
        variant="secondary"
        className="flex items-center gap-1.5 px-2 py-1 text-xs"
      >
        {getIcon(primaryMethod.type)}
        <span className="font-medium">{getDisplayName(primaryMethod.type)}</span>
        {getIdentifier() && (
          <>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground font-mono text-[10px]">
              {getIdentifier()}
            </span>
          </>
        )}
      </Badge>

      {hasMultipleMethods && (
        <Badge variant="outline" className="text-xs px-2 py-0.5">
          +{loginMethods.length - 1} more
        </Badge>
      )}
    </div>
  );
}

/**
 * Compact version for small spaces
 */
export function LoginMethodIcon() {
  const { primaryMethod } = useLoginMethod();

  if (!primaryMethod) {
    return null;
  }

  const getIcon = (type: string) => {
    const iconClass = "w-4 h-4";

    switch (type) {
      case 'email':
        return <Mail className={iconClass} />;
      case 'google':
        return <Globe className={iconClass} />;
      case 'twitter':
        return <MessageSquare className={iconClass} />;
      case 'github':
        return <Globe className={iconClass} />;
      case 'discord':
        return <MessageSquare className={iconClass} />;
      case 'apple':
        return <Globe className={iconClass} />;
      case 'wallet':
        return <Wallet className={iconClass} />;
      case 'phone':
      case 'sms':
        return <Phone className={iconClass} />;
      case 'farcaster':
        return <Hash className={iconClass} />;
      case 'telegram':
        return <Send className={iconClass} />;
      default:
        return <Mail className={iconClass} />;
    }
  };

  const getDisplayName = (type: string) => {
    switch (type) {
      case 'email':
        return 'Email';
      case 'google':
        return 'Google';
      case 'twitter':
        return 'Twitter';
      case 'github':
        return 'GitHub';
      case 'discord':
        return 'Discord';
      case 'apple':
        return 'Apple';
      case 'wallet':
        return 'Wallet';
      case 'phone':
      case 'sms':
        return 'SMS';
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  return (
    <div
      className="flex items-center justify-center w-8 h-8 rounded-full bg-secondary/50 text-muted-foreground hover:bg-secondary transition-colors"
      title={`Logged in with ${getDisplayName(primaryMethod.type)}`}
    >
      {getIcon(primaryMethod.type)}
    </div>
  );
}

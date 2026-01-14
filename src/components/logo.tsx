"use client";

import darkLogo from "@/assets/logos/dark.svg";
import logo from "@/assets/logos/main.svg";
import Image from "next/image";
import { useEffect, useState } from "react";

export function Logo() {
  const [platformLogo, setPlatformLogo] = useState<string | null>(null);
  const [logoText, setLogoText] = useState<string | null>(null);
  const [primaryColor, setPrimaryColor] = useState<string>('#3b82f6');
  const [loading, setLoading] = useState(true);
  const [hasPlatformLogo, setHasPlatformLogo] = useState(false);

  useEffect(() => {
    const fetchLogo = async () => {
      try {
        const response = await fetch('/api/platform/logo');
        
        // Check if response is ok and has JSON content
        if (!response.ok) {
          setLoading(false);
          setHasPlatformLogo(false);
          return;
        }

        // Check content type before parsing
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          setLoading(false);
          setHasPlatformLogo(false);
          return;
        }

        // Get text first to check if it's valid JSON
        const text = await response.text();
        if (!text || text.trim().length === 0) {
          setLoading(false);
          setHasPlatformLogo(false);
          return;
        }

        // Parse JSON only if we have valid content
        let data;
        try {
          data = JSON.parse(text);
        } catch (parseError) {
          console.warn('Failed to parse logo response:', parseError);
          setLoading(false);
          setHasPlatformLogo(false);
          return;
        }

        if (data.success) {
          if (data.url) {
            setPlatformLogo(data.url);
            setHasPlatformLogo(true);
          } else {
            setHasPlatformLogo(false);
          }
          // Always set text and color for fallback
          setLogoText(data.logoText || null);
          setPrimaryColor(data.primaryColor || '#3b82f6');
        } else {
          setHasPlatformLogo(false);
        }
      } catch (error) {
        // Silently handle errors - fallback to default logo
        console.warn('Failed to fetch platform logo:', error);
        setHasPlatformLogo(false);
      } finally {
        setLoading(false);
      }
    };

    fetchLogo();
  }, []);

  // Don't render default logos until we've confirmed no platform logo exists
  // This prevents the flash of default logo
  if (loading) {
    return (
      <div className="relative h-8 max-w-[10.847rem]">
        {/* Empty placeholder - prevents layout shift without loading default logo */}
      </div>
    );
  }

  // If platform logo exists, use it
  if (hasPlatformLogo && platformLogo) {
    return (
      <div className="relative h-8 max-w-[10.847rem]">
        <Image
          src={platformLogo}
          fill
          alt="Platform logo"
          role="presentation"
          quality={100}
          className="object-contain"
          unoptimized={platformLogo.startsWith('/uploads/')}
          priority
        />
      </div>
    );
  }

  // If no logo image but logoText is available, display text logo
  if (logoText) {
    return (
      <div className="relative h-8 flex items-center">
        <span 
          className="text-xl font-bold tracking-tight whitespace-nowrap"
          style={{ color: primaryColor }}
        >
          {logoText}
        </span>
      </div>
    );
  }

  // Fallback to default logos only if no platform logo or text exists
  return (
    <div className="relative h-8 max-w-[10.847rem]">
      <Image
        src={logo}
        fill
        className="dark:hidden"
        alt="NextAdmin logo"
        role="presentation"
        quality={100}
        priority
      />

      <Image
        src={darkLogo}
        fill
        className="hidden dark:block"
        alt="NextAdmin logo"
        role="presentation"
        quality={100}
        priority
      />
    </div>
  );
}

import { getPlatformSettingsWithDefaults } from "@/lib/platform-settings";
import Image from "next/image";
import darkLogo from "@/assets/logos/dark.svg";
import logo from "@/assets/logos/main.svg";

/**
 * Server-side Logo component
 * Fetches platform logo on the server to prevent flash
 */
export async function LogoServer() {
  const settings = await getPlatformSettingsWithDefaults();

  // If platform logo exists, use it
  if (settings.platformLogo) {
    return (
      <div className="relative h-8 max-w-[10.847rem]">
        <Image
          src={settings.platformLogo}
          fill
          alt="Platform logo"
          role="presentation"
          quality={100}
          className="object-contain"
          unoptimized={settings.platformLogo.startsWith('/uploads/')}
          priority
        />
      </div>
    );
  }

  // Fallback to default logos
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


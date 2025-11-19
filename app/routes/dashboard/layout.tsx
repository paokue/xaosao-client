import { useMemo } from "react";
import { Link, Outlet, useLocation } from "react-router";
import { useTranslation } from "react-i18next";
import { SidebarSeparator } from "~/components/ui/sidebar";
import {
    Bell,
    Boxes,
    HandHeart,
    Heart,
    MessageCircle,
    Search,
    Settings,
    User,
    User2Icon,
    Wallet,
    Wallet2,
} from "lucide-react";

export default function Dashboard() {
    const location = useLocation();
    const { t, i18n } = useTranslation();

    const navigationItems = useMemo(() => [
        { title: t('navigation.discover'), url: "/dashboard", icon: Search },
        { title: t('navigation.match'), url: "/dashboard/matches", icon: Heart },
        { title: t('navigation.chat'), url: "/dashboard/realtime-chat", icon: MessageCircle },
        { title: t('navigation.datingHistory'), url: "/dashboard/dates-history", icon: HandHeart },
        { title: t('navigation.packages'), url: "/dashboard/packages", icon: Boxes },
        { title: t('navigation.wallet'), url: "/dashboard/wallets", icon: Wallet },
        { title: t('navigation.myProfile'), url: "/dashboard/profile", icon: User },
        { title: t('navigation.setting'), url: "/dashboard/setting", icon: Settings },
    ], [t, i18n.language]);

    const mobileNavigationItems = useMemo(() => [
        { title: t('navigation.discover'), url: "/dashboard", icon: Search },
        { title: t('navigation.match'), url: "/dashboard/matches", icon: Heart },
        { title: t('navigation.chat'), url: "/dashboard/realtime-chat", icon: MessageCircle },
        { title: t('navigation.dating'), url: "/dashboard/dates-history", icon: HandHeart },
        { title: t('navigation.wallet'), url: "/dashboard/wallets", icon: Wallet2 },
        // { title: t('navigation.notification'), url: "/dashboard/notification", icon: Bell },
        { title: t('navigation.profile'), url: "/dashboard/profile", icon: User2Icon },
    ], [t, i18n.language]);

    const isActiveRoute = (url: string) => {
        if (url === "/dashboard" && location.pathname === "/dashboard") return true;
        if (url !== "/dashboard" && location.pathname.startsWith(url)) return true;
        return false;
    };

    // 👇 Hide bottom nav if the current route includes "realtime-chat"
    const hideMobileNav =
        location.pathname.includes("realtime-chat") ||
        location.pathname.includes("chat");


    return (
        <div className="flex min-h-screen w-full relative">
            {/* Sidebar for Desktop */}
            <div className="w-1/5 p-6 hidden sm:flex flex-col items-start justify-between sm:sticky sm:top-0 sm:h-screen">
                <div className="w-full">
                    <div className="flex items-center space-x-3">
                        <img
                            src="https://images.pexels.com/photos/5617870/pexels-photo-5617870.jpeg"
                            alt="Profile"
                            className="w-14 h-14 border-2 border-gray-400 rounded-full"
                        />
                        <div>
                            <h2 className="text-lg">Paokue Saolong</h2>
                            <p className="text-xs text-muted-foreground">
                                Find your perfect match
                            </p>
                        </div>
                    </div>

                    <SidebarSeparator className="my-4" />

                    <div className="space-y-2">
                        {navigationItems.map((item) => {
                            const isActive = isActiveRoute(item.url);
                            return (
                                <Link
                                    to={item.url}
                                    key={item.title}
                                    className={`flex items-center justify-start cursor-pointer space-x-3 p-2 rounded-md transition-colors ${isActive
                                        ? "bg-rose-100 text-rose-500 border border-rose-300"
                                        : "hover:bg-rose-50 hover:text-rose-500"
                                        }`}
                                >
                                    <item.icon className="w-4 h-4" />
                                    <p suppressHydrationWarning>{item.title}</p>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="w-full sm:w-4/5 flex flex-col min-h-screen pb-16 sm:pb-0">
                <main className="bg-background flex-1">
                    <Outlet />
                </main>
            </div>

            {/* ✅ Mobile Bottom Navigation (hidden on realtime-chat) */}
            {!hideMobileNav && (
                <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 sm:hidden z-40">
                    <div className="flex items-center justify-around py-1">
                        {mobileNavigationItems.map((item) => {
                            const isActive = isActiveRoute(item.url);
                            return (
                                <Link
                                    to={item.url}
                                    key={item.title}
                                    className="flex flex-col items-center justify-center p-2 min-w-0 flex-1"
                                >
                                    <item.icon
                                        className={`w-4 h-4 mb-1 ${isActive ? "text-rose-500" : "text-gray-600"
                                            }`}
                                    />
                                    <span
                                        className={`text-xs truncate ${isActive ? "text-rose-500" : "text-gray-600"
                                            }`}
                                        suppressHydrationWarning
                                    >
                                        {item.title}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

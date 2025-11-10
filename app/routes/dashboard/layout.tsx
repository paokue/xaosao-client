import { Link, Outlet, useLocation } from "react-router";
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

const navigationItems = [
    { title: "Discover", url: "/dashboard", icon: Search },
    { title: "Match", url: "/dashboard/matches", icon: Heart },
    { title: "Chat", url: "/dashboard/realtime-chat", icon: MessageCircle },
    { title: "Dating history", url: "/dashboard/dates-history", icon: HandHeart },
    { title: "Packages", url: "/dashboard/packages", icon: Boxes },
    { title: "Wallet", url: "/dashboard/wallets", icon: Wallet },
    { title: "My profile", url: "/dashboard/profile", icon: User },
    { title: "Setting", url: "/dashboard/setting", icon: Settings },
];

const mobileNavigationItems = [
    { title: "Discover", url: "/dashboard", icon: Search },
    { title: "Match", url: "/dashboard/matches", icon: Heart },
    { title: "Chat", url: "/dashboard/realtime-chat", icon: MessageCircle },
    { title: "Dating", url: "/dashboard/dates-history", icon: HandHeart },
    { title: "Wallet", url: "/dashboard/wallets", icon: Wallet2 },
    // { title: "Notification", url: "/dashboard/notification", icon: Bell },
    { title: "Profile", url: "/dashboard/profile", icon: User2Icon },
];

export default function Dashboard() {
    const location = useLocation();

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
        <div className="flex h-screen w-full relative">
            {/* Sidebar for Desktop */}
            <div className="w-1/5 p-6 hidden sm:flex flex-col items-start justify-between">
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
                                    <p>{item.title}</p>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="w-full sm:w-4/5 flex flex-col h-screen overflow-scroll pb-16 sm:pb-0">
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

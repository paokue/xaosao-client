import { index, route, type RouteConfig } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),

  // authentication routes
  route("login", "./routes/auth/login.tsx"),
  route("register", "./routes/auth/register.tsx"),
  route("forgot-password", "./routes/auth/forgot-password.tsx"),
  route("reset-password", "./routes/auth/reset-password.tsx"),
  route("verify-otp", "./routes/auth/verify-otp.tsx"),
  route("messages/:chatId", "./routes/message-details.tsx"),
  route("logout", "./routes/logout.ts"),

  route("dashboard", "./routes/dashboard/layout.tsx", [
    index("./routes/dashboard/discover.tsx"),
    route("matches", "./routes/dashboard/matches/matches.tsx"),

    route("dates-history", "./routes/dashboard/booking-history/booking.tsx"),

    // your new chat route
    route("realtime-chat", "./routes/dashboard/chat/chat-wrapper.tsx"),
    route("chat", "./routes/dashboard/chat/single-chat-wrapper.tsx"),

    // profile
    route("profile", "./routes/dashboard/profile/profile.tsx"),
    route(
      "profile-edit/:userId",
      "./routes/dashboard/profile/profile.edit.tsx"
    ),
    route(
      "profile-share/:userId",
      "./routes/dashboard/profile/profile.share.tsx"
    ),

    // user profile:
    route(
      "user-profile/:userId",
      "./routes/dashboard/model-profile/profile.tsx"
    ),
    route(
      "user-profile-share/:userId",
      "./routes/dashboard/model-profile/profile.share.tsx"
    ),

    // booking
    route(
      "book-service/:modelId/:serviceId",
      "./routes/dashboard/model-profile/profile.book.tsx"
    ),
    route(
      "book-service/delete/:id",
      "./routes/dashboard/booking-history/booking.delete.tsx"
    ),
    route(
      "book-service/edit/:id",
      "./routes/dashboard/booking-history/booking.edit.tsx"
    ),
    route(
      "book-service/detail/:id",
      "./routes/dashboard/booking-history/booking.detail.tsx"
    ),
    route(
      "book-service/cancel/:id",
      "./routes/dashboard/booking-history/booking.cancel.tsx"
    ),

    // setting
    route("setting", "./routes/dashboard/setting/setting.tsx"),
    route(
      "setting-detail/:tab",
      "./routes/dashboard/setting/setting-detail.tsx"
    ),

    // wallets
    route("wallets", "./routes/dashboard/wallet/wallet.tsx"),
    route(
      "wallets/delete/:transactionId",
      "./routes/dashboard/wallet/wallet.delete.tsx"
    ),
    route(
      "wallets/edit/:transactionId",
      "./routes/dashboard/wallet/wallet.edit.tsx"
    ),
    route(
      "wallets/detail/:transactionId",
      "./routes/dashboard/wallet/wallet.detail.tsx"
    ),
    route("wallet-topup", "./routes/dashboard/wallet/wallet.topup.tsx"),

    // Packages:
    route("packages", "./routes/dashboard/packages/package.tsx"),
    route("payment/:id", "./routes/dashboard/packages/payment.tsx"),
    route("subscription-history", "./routes/dashboard/packages/history.tsx"),
  ]),
] satisfies RouteConfig;

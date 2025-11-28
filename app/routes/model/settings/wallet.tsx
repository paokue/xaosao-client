import { ArrowLeft, Wallet, DollarSign, TrendingUp, Clock } from "lucide-react";
import { Link } from "react-router";
import type { MetaFunction } from "react-router";

export const meta: MetaFunction = () => {
  return [
    { title: "Wallet - Model Settings" },
    { name: "description", content: "Manage your wallet and transactions" },
  ];
};

export default function WalletSettings() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 to-purple-50 p-4">
      {/* Mobile Header */}
      <div className="mb-6">
        <Link
          to="/model/settings"
          className="inline-flex items-center gap-2 text-rose-600 hover:text-rose-700 mb-4"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Settings</span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-100 rounded-lg">
            <Wallet className="w-6 h-6 text-rose-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-rose-500 to-purple-600 bg-clip-text text-transparent">
              Wallet Management
            </h1>
            <p className="text-sm text-gray-600">Track your earnings and balance</p>
          </div>
        </div>
      </div>

      {/* Balance Card */}
      <div className="bg-gradient-to-br from-rose-500 to-purple-600 rounded-xl shadow-lg p-6 mb-6 text-white">
        <p className="text-rose-100 text-sm mb-2">Total Balance</p>
        <h2 className="text-4xl font-bold mb-4">$0.00</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-4 h-4" />
              <p className="text-xs text-rose-100">Total Earned</p>
            </div>
            <p className="text-lg font-semibold">$0.00</p>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4" />
              <p className="text-xs text-rose-100">Pending</p>
            </div>
            <p className="text-lg font-semibold">$0.00</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button className="bg-white rounded-xl shadow-lg p-4 hover:shadow-xl transition-shadow">
          <div className="p-2 bg-green-100 rounded-lg w-fit mb-2">
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <p className="font-medium text-gray-900">Withdraw</p>
          <p className="text-xs text-gray-500 mt-1">Cash out earnings</p>
        </button>
        <button className="bg-white rounded-xl shadow-lg p-4 hover:shadow-xl transition-shadow">
          <div className="p-2 bg-blue-100 rounded-lg w-fit mb-2">
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <p className="font-medium text-gray-900">History</p>
          <p className="text-xs text-gray-500 mt-1">View transactions</p>
        </button>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Recent Transactions</h3>
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600 mb-1">No transactions yet</p>
          <p className="text-sm text-gray-500">
            Your transaction history will appear here
          </p>
        </div>
      </div>
    </div>
  );
}

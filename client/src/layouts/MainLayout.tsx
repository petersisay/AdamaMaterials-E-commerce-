import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  Menu,
  X,
  LogOut,
  LayoutDashboard,
  MapPin,
  Bell,
  ShieldCheck,
  FileText,
  Store,
  Scale,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import BrandLogo from '../components/BrandLogo';
import ThemeToggle from '../components/ThemeToggle';
import UserProfileModal from '../components/UserProfileModal';
import api from '../services/api';

const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const { items } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Policy Modal state ('TERMS' | 'ESCROW' | 'SELLER_GUIDELINES' | 'ABOUT' | null)
  const [activePolicy, setActivePolicy] = useState<'TERMS' | 'ESCROW' | 'SELLER_GUIDELINES' | 'ABOUT' | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  // Close mobile drawer and notifications popup on route change (Rule 24)
  useEffect(() => {
    setMobileMenuOpen(false);
    setNotificationsOpen(false);
  }, [location.pathname]);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.get('/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications);
        setUnreadNotifications(res.data.unreadCount);
      }
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 20000); // Poll every 20s
      return () => clearInterval(interval);
    }
  }, [user]);

  const markAllNotificationsAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setUnreadNotifications(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  // Determine dashboard link based on role
  const getDashboardLink = () => {
    if (!user) return '/';
    if (user.role === 'BUYER') return '/buyer-dashboard';
    if (user.role === 'SELLER') return '/seller-dashboard';
    if (user.role === 'STAFF') return '/staff-dashboard';
    if (user.role === 'ADMIN') return '/admin-dashboard';
    return '/';
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-200">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full bg-white/95 dark:bg-slate-900/95 border-b border-slate-200 dark:border-slate-800 backdrop-blur-md shadow-xs relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 sm:h-22 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="group py-1">
            <BrandLogo />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            {(!user || user.role === 'BUYER' || user.role === 'SELLER') && (
              <Link
                to="/products"
                className="text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                Catalog
              </Link>
            )}
            <Link
              to="/map"
              className="text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-1.5"
            >
              <MapPin className="w-4 h-4 text-emerald-600" />
              Marketplace Map
            </Link>
            <button
              onClick={() => setActivePolicy('ABOUT')}
              className="text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Store className="w-4 h-4 text-orange-500" />
              About Revola
            </button>
            {user && (
              <Link
                to={getDashboardLink()}
                className="text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors flex items-center gap-1.5"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
            )}
          </nav>

          {/* Actions */}
          <div className="hidden md:flex items-center gap-4">
            {/* Appearance Mode Toggle */}
            <ThemeToggle />
            {user ? (
              <>
                {/* Notifications */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setNotificationsOpen(!notificationsOpen);
                      if (!notificationsOpen && unreadNotifications > 0) {
                        markAllNotificationsAsRead();
                      }
                    }}
                    className="p-2 text-slate-500 hover:text-primary-600 hover:bg-slate-100 rounded-full transition-all relative"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadNotifications > 0 && (
                      <span className="absolute top-1.5 right-1.5 bg-rose-500 text-white text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center animate-pulse">
                        {unreadNotifications}
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {notificationsOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 max-h-96 flex flex-col"
                      >
                        <div className="p-3 border-b border-slate-100 font-semibold text-sm flex justify-between items-center bg-slate-50">
                          <span>Notifications</span>
                          {unreadNotifications > 0 && (
                            <button
                              onClick={markAllNotificationsAsRead}
                              className="text-xs text-primary-600 hover:underline"
                            >
                              Mark all read
                            </button>
                          )}
                        </div>
                        <div className="overflow-y-auto flex-1 divide-y divide-slate-100">
                          {notifications.length === 0 ? (
                            <div className="p-4 text-center text-xs text-slate-400">
                              No notifications yet.
                            </div>
                          ) : (
                            notifications.map((n) => (
                              <div
                                key={n._id}
                                className={`p-3 text-xs transition-colors ${
                                  n.read ? 'bg-white' : 'bg-slate-50/70 font-medium'
                                }`}
                              >
                                <div className="text-slate-800">{n.title}</div>
                                <div className="text-slate-500 mt-0.5">{n.message}</div>
                                <div className="text-[10px] text-slate-400 mt-1">
                                  {new Date(n.createdAt).toLocaleDateString()}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {user.role === 'BUYER' && (
                  <Link
                    to="/cart"
                    className="p-2 text-slate-500 hover:text-primary-600 hover:bg-slate-100 rounded-full transition-all relative"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    {cartCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 bg-accent-500 text-white text-[10px] font-bold w-4.5 h-4.5 rounded-full flex items-center justify-center">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                )}

                <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
                  <button
                    onClick={() => setProfileModalOpen(true)}
                    title="View / Edit Profile"
                    className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-right cursor-pointer group"
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-primary-100 dark:bg-primary-950/60 border border-primary-500/40 flex items-center justify-center shrink-0">
                      {user.avatar ? (
                        <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-black text-primary-600 dark:text-primary-400">
                          {(user.name || user.email || 'U')[0].toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="text-left hidden sm:block">
                      <div className="text-xs font-semibold text-slate-800 dark:text-slate-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                        {user.name}
                      </div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-400 font-bold uppercase">
                        @{user.username || user.email.split('@')[0]} • {user.role}
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={handleLogout}
                    title="Sign Out"
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-full transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-sm font-semibold text-slate-600 hover:text-primary-600 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile header actions (Compact theme toggle + hamburger) */}
          <div className="flex md:hidden items-center gap-1.5">
            <ThemeToggle compact={true} />
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
              aria-label="Open mobile navigation menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="fixed inset-0 bg-black z-50 cursor-pointer"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.25 }}
              className="fixed right-0 top-0 bottom-0 w-80 max-w-full bg-white dark:bg-slate-900 shadow-2xl z-50 flex flex-col p-6 border-l border-slate-200 dark:border-slate-800"
            >
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <BrandLogo />
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Mobile Appearance Mode Switcher */}
              <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Appearance Mode</span>
                <ThemeToggle />
              </div>

              <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
                {(!user || user.role === 'BUYER' || user.role === 'SELLER') && (
                  <Link
                    to="/products"
                    className="text-base font-semibold text-slate-700 dark:text-slate-200 hover:text-primary-600 dark:hover:text-primary-400 py-2 border-b border-slate-100 dark:border-slate-800"
                  >
                    Browse Catalog
                  </Link>
                )}
                <Link
                  to="/map"
                  className="text-base font-semibold text-slate-700 dark:text-slate-200 hover:text-primary-600 dark:hover:text-primary-400 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2"
                >
                  <MapPin className="w-5 h-5 text-emerald-600" />
                  Marketplace Map
                </Link>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setActivePolicy('ABOUT');
                  }}
                  className="text-left text-base font-semibold text-slate-700 dark:text-slate-200 hover:text-primary-600 dark:hover:text-primary-400 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 cursor-pointer"
                >
                  <Store className="w-5 h-5 text-orange-500" />
                  About Revola
                </button>
                {user ? (
                  <>
                    <Link
                      to={getDashboardLink()}
                      className="text-base font-semibold text-slate-700 dark:text-slate-200 hover:text-primary-600 dark:hover:text-primary-400 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2"
                    >
                      <LayoutDashboard className="w-5 h-5" />
                      Dashboard
                    </Link>
                    {user.role === 'BUYER' && (
                      <Link
                        to="/cart"
                        className="text-base font-semibold text-slate-700 dark:text-slate-200 hover:text-primary-600 dark:hover:text-primary-400 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between"
                      >
                        <span className="flex items-center gap-2">
                          <ShoppingCart className="w-5 h-5" />
                          Cart
                        </span>
                        {cartCount > 0 && (
                          <span className="bg-accent-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                            {cartCount}
                          </span>
                        )}
                      </Link>
                    )}
                    <div className="mt-auto p-4 bg-slate-50 dark:bg-slate-800/80 rounded-xl flex items-center justify-between border border-slate-100 dark:border-slate-700/60">
                      <button
                        onClick={() => {
                          setMobileMenuOpen(false);
                          setProfileModalOpen(true);
                        }}
                        className="flex items-center gap-3 text-left cursor-pointer flex-1 min-w-0"
                      >
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-primary-100 dark:bg-primary-950/60 border border-primary-500/40 flex items-center justify-center shrink-0">
                          {user.avatar ? (
                            <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm font-black text-primary-600 dark:text-primary-400">
                              {(user.name || user.email || 'U')[0].toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">{user.name}</div>
                          <div className="text-[10px] text-slate-400 dark:text-slate-400 uppercase font-bold truncate">
                            @{user.username || user.email.split('@')[0]} • {user.role}
                          </div>
                        </div>
                      </button>
                      <button
                        onClick={handleLogout}
                        title="Sign Out"
                        className="text-rose-600 dark:text-rose-400 p-2 rounded-full hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-5 h-5" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="mt-auto flex flex-col gap-3 pt-4">
                    <Link
                      to="/login"
                      className="w-full text-center py-3 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/register"
                      className="w-full text-center py-3 rounded-xl bg-primary-600 text-white text-sm font-bold shadow-md hover:bg-primary-700"
                    >
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col min-h-0 relative">{children}</main>

      <footer className="bg-slate-950 text-slate-400 py-14 border-t border-slate-850">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <div className="mb-4">
              <BrandLogo showTagline={true} />
            </div>
            <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
              Revola — The premier marketplace for reclaimed construction materials, scrap
              metals, plastics, and industrial equipment.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <h4 className="text-white font-bold text-sm mb-2 uppercase tracking-wider text-slate-300">
              Location & Coverage
            </h4>
            <div className="flex items-center gap-2 text-sm text-slate-300">
              <MapPin className="w-4 h-4 text-accent-400 flex-shrink-0" />
              <span className="font-medium">Adama City, Oromia, Ethiopia</span>
            </div>
          </div>
          <div>
            <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-wider text-slate-300">
              Marketplace Policies
            </h4>
            <ul className="text-sm flex flex-col gap-2.5 text-slate-400">
              <li>
                <button
                  onClick={() => setActivePolicy('TERMS')}
                  className="hover:text-amber-400 transition-colors cursor-pointer font-medium"
                >
                  Terms of Service
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActivePolicy('ESCROW')}
                  className="hover:text-amber-400 transition-colors cursor-pointer font-medium"
                >
                  Buyer Escrow Protection
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActivePolicy('SELLER_GUIDELINES')}
                  className="hover:text-amber-400 transition-colors cursor-pointer font-medium"
                >
                  Seller Guidelines
                </button>
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-6 border-t border-slate-800/80 text-center text-xs text-slate-500">
          &copy; {new Date().getFullYear()} Revola Marketplace. All rights reserved.
        </div>
      </footer>

      {/* Interactive Policy Modal Dialog */}
      <AnimatePresence>
        {activePolicy && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActivePolicy(null)}
              className="fixed inset-0 bg-black/70 backdrop-blur-xs cursor-pointer"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 z-10 overflow-hidden flex flex-col max-h-[88vh]"
            >
              {/* Modal Header */}
              <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-amber-400/20 text-amber-400 border border-amber-400/30">
                    {activePolicy === 'TERMS' && <FileText className="w-5 h-5" />}
                    {activePolicy === 'ESCROW' && <ShieldCheck className="w-5 h-5 text-emerald-400" />}
                    {activePolicy === 'SELLER_GUIDELINES' && <Store className="w-5 h-5 text-sky-400" />}
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight text-white">
                      {activePolicy === 'TERMS' && 'Terms of Service'}
                      {activePolicy === 'ESCROW' && 'Buyer Escrow Protection'}
                      {activePolicy === 'SELLER_GUIDELINES' && 'Seller Listing & Payout Guidelines'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      AdaMaterials Managed Marketplace • Adama City
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActivePolicy(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Policy Quick Tabs */}
              <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-2 overflow-x-auto text-xs font-bold">
                <button
                  onClick={() => setActivePolicy('ABOUT')}
                  className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activePolicy === 'ABOUT'
                      ? 'border-primary-600 text-primary-900 font-extrabold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Store className="w-3.5 h-3.5" />
                  About Revola
                </button>
                <button
                  onClick={() => setActivePolicy('TERMS')}
                  className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activePolicy === 'TERMS'
                      ? 'border-primary-600 text-primary-900 font-extrabold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Terms of Service
                </button>
                <button
                  onClick={() => setActivePolicy('ESCROW')}
                  className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activePolicy === 'ESCROW'
                      ? 'border-primary-600 text-primary-900 font-extrabold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Buyer Protection
                </button>
                <button
                  onClick={() => setActivePolicy('SELLER_GUIDELINES')}
                  className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activePolicy === 'SELLER_GUIDELINES'
                      ? 'border-primary-600 text-primary-900 font-extrabold'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Store className="w-3.5 h-3.5 text-sky-600" />
                  Seller Guidelines
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto space-y-4 text-slate-700 text-sm leading-relaxed">
                {activePolicy === 'ABOUT' && (
                  <div className="space-y-4">
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl text-orange-950 text-sm flex items-start gap-3">
                      <Store className="w-5 h-5 flex-shrink-0 text-orange-600 mt-0.5" />
                      <div>
                        <strong className="block font-black text-orange-900 text-base mb-1">
                          Revola — Every Good Thing Deserves a Second Life
                        </strong>
                        <span>
                          Revola is Adama City's premier circular economy marketplace dedicated to buying, selling, and reusing usable materials, structural timber, reclaimed steel, scrap metals, plastics, and appliances.
                        </span>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        🌿 Our Environmental & Economic Mission
                      </h4>
                      <p className="text-xs text-slate-600 mt-1">
                        Construction projects and workshops produce high volumes of reusable materials that often end up in landfills. Revola connects local contractors, scrap depots, merchants, and builders in Adama to circulate usable surplus materials at affordable prices.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        🛡️ 100% Escrow Protection & Local Dispatch
                      </h4>
                      <p className="text-xs text-slate-600 mt-1">
                        When buyers order on Revola, funds are securely held in escrow. Our verified logistics drivers pick up the materials from local Adama depots and deliver them directly to your work site. Sellers only receive payouts after the buyer verifies receipt.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        📍 Serving All 9 Adama Subcities
                      </h4>
                      <p className="text-xs text-slate-600 mt-1">
                        Bole, Aba Geda, Goro, Boku, Kebele 02, Kebele 03, Kebele 04, Industry Zone, and Wonji Road with real-time route tracking and fair localized delivery fees.
                      </p>
                    </div>
                  </div>
                )}
                {activePolicy === 'TERMS' && (
                  <div className="space-y-4">
                    <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-center gap-2.5">
                      <Scale className="w-4 h-4 flex-shrink-0 text-amber-700" />
                      <span>
                        Welcome to AdaMaterials. By registering or trading on the platform, you
                        agree to these legal and operational terms.
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        1. Circular Economy Platform in Adama City
                      </h4>
                      <p className="text-xs text-slate-600 mt-1">
                        AdaMaterials is a managed marketplace dedicated to recycling, repurposing,
                        and trading usable materials (wood pallets, structural steel beams, scrap
                        metals, plastics, and used industrial equipment) across Adama City, Oromia,
                        Ethiopia.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        2. Account Responsibility & Payments
                      </h4>
                      <p className="text-xs text-slate-600 mt-1">
                        Users must provide accurate contact information. All payments must be routed
                        through authorized Chapa payment gateway. Offline cash transactions without
                        platform verification are prohibited.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        3. Prohibited Materials & Clear Title
                      </h4>
                      <p className="text-xs text-slate-600 mt-1">
                        Sellers must hold legitimate legal ownership of all listed items. Stolen
                        goods, hazardous chemical wastes, biological refuse, and counterfeit items
                        are strictly forbidden.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        4. Managed Logistics & Driver Dispatch
                      </h4>
                      <p className="text-xs text-slate-600 mt-1">
                        Deliveries within Adama City are calculated dynamically based on distance
                        zones and bulk item quantities.
                      </p>
                    </div>
                  </div>
                )}

                {activePolicy === 'ESCROW' && (
                  <div className="space-y-4">
                    <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center gap-2.5">
                      <ShieldCheck className="w-4 h-4 flex-shrink-0 text-emerald-700" />
                      <span>
                        100% Guaranteed Escrow: Your money is never sent to the seller until you
                        receive your order in good condition.
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <Lock className="w-4 h-4 text-emerald-600" />
                        1. Escrow Lock Upon Payment
                      </h4>
                      <p className="text-xs text-slate-600 mt-1">
                        When you pay via Chapa, funds are held in secure escrow. The seller cannot
                        withdraw these funds yet.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        2. Physical Inspection On Delivery
                      </h4>
                      <p className="text-xs text-slate-600 mt-1">
                        When the courier delivers the materials to your site in Adama, you inspect
                        the materials (grade, dimensions, and quantity).
                      </p>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        3. Payout Release Only After Delivery Confirmation
                      </h4>
                      <p className="text-xs text-slate-600 mt-1">
                        Only after staff logistics verifies the handover and marks the order as{' '}
                        <strong className="text-emerald-700 font-bold">DELIVERED</strong> do the
                        seller payouts become eligible for withdrawal.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        4. Zero Risk & 100% Refund Protection
                      </h4>
                      <p className="text-xs text-slate-600 mt-1">
                        If the delivered material is damaged, missing, or materially misrepresented
                        by the seller, AdaMaterials holds the funds and executes a full refund.
                      </p>
                    </div>
                  </div>
                )}

                {activePolicy === 'SELLER_GUIDELINES' && (
                  <div className="space-y-4">
                    <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-xl text-sky-900 text-xs flex items-center gap-2.5">
                      <Store className="w-4 h-4 flex-shrink-0 text-sky-700" />
                      <span>
                        Follow these standards to maximize sales and ensure immediate payout
                        approval on AdaMaterials.
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        1. Accurate Condition Grading
                      </h4>
                      <p className="text-xs text-slate-600 mt-1">
                        Accurately select the material condition: <em>Brand New</em>,{' '}
                        <em>Like New (Refurbished)</em>, <em>Used (Functional)</em>, or{' '}
                        <em>Usable Scrap Metal / Plastics</em>.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        2. Real Photos & Honest Specifications
                      </h4>
                      <p className="text-xs text-slate-600 mt-1">
                        Upload clear, well-lit photos showing actual items and any visible wear.
                        Specify precise dimensions, lengths, or estimated weights.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        3. Transparent ETB Pricing & Commission
                      </h4>
                      <p className="text-xs text-slate-600 mt-1">
                        All prices must be in Ethiopian Birr (ETB). A transparent{' '}
                        <strong>10% marketplace commission</strong> is deducted upon successful
                        delivery to support payment verification and dispatch operations.
                      </p>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">
                        4. Fast Driver Hand-off & Payout Disbursal
                      </h4>
                      <p className="text-xs text-slate-600 mt-1">
                        Keep materials stacked and ready for dispatch. Once delivered to the buyer,
                        your payout status changes to{' '}
                        <strong className="text-sky-700 font-bold">ELIGIBLE</strong> and is
                        transferred directly to your bank account.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500">
                <span>AdaMaterials Compliance • Adama, Ethiopia</span>
                <button
                  onClick={() => setActivePolicy(null)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Close Policy
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* User Profile & Account Settings Modal */}
      <UserProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />
    </div>
  );
};

export default MainLayout;

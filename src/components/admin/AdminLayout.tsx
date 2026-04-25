import { ReactNode, useState } from 'react';
import { Link, useLocation, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FilePlus2, 
  Newspaper, 
  Image as ImageIcon, 
  Type, 
  Settings as SettingsIcon,
  LogOut,
  ChevronLeft,
  ChevronRight,
  User
} from 'lucide-react';
import { auth } from '../../lib/firebase';
import { signOut } from 'firebase/auth';
import { toast } from 'sonner';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarItem {
  icon: any;
  label: string;
  path: string;
}

const sidebarItems: SidebarItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
  { icon: FilePlus2, label: 'Add News', path: '/admin/add' },
  { icon: Newspaper, label: 'Manage News', path: '/admin/manage' },
  { icon: ImageIcon, label: 'Media Library', path: '/admin/media' },
  { icon: Type, label: 'Template Gen', path: '/admin/generator' },
  { icon: SettingsIcon, label: 'Settings', path: '/admin/settings' },
];

export default function AdminLayout() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast.success('Logged out successfully');
      navigate('/admin/login');
    } catch (error) {
      toast.error('Failed to logout');
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F1F5F9] text-[#0A2A43]">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 80 : 280 }}
        className="fixed left-0 top-0 bottom-0 bg-[#0A2A43] text-white z-50 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.1)] border-r-2 border-white/5"
      >
        <div className="p-8 bg-[#0A2A43] flex items-center justify-between border-b-2 border-white/5">
          {!isCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-4"
            >
              <div className="w-10 h-10 bg-[#1E90FF] rounded-xl flex items-center justify-center shadow-2xl">
                <span className="text-white font-black">C</span>
              </div>
              <span className="font-black text-xl tracking-tighter uppercase leading-none">CBT<br/><span className="text-[#1E90FF]">ADMIN</span></span>
            </motion.div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2.5 hover:bg-white/10 rounded-xl transition-colors border border-white/10"
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          </button>
        </div>

        <nav className="flex-1 mt-8 space-y-2 px-4">
          {!isCollapsed && <div className="px-4 mb-4 text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Management</div>}
          {sidebarItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-4 px-4 py-4 transition-all group rounded-2xl",
                  isActive 
                    ? "bg-[#1E90FF] text-white shadow-xl shadow-[#1E90FF]/20" 
                    : "text-white/50 hover:bg-white/5 hover:text-white"
                )}
              >
                <Icon className={cn("w-6 h-6 shrink-0", isActive ? "text-white" : "text-white/30 group-hover:text-white/80")} />
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm font-black uppercase tracking-widest"
                  >
                    {item.label}
                  </motion.span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t-2 border-white/5 bg-black/10">
          <div className={cn(
            "flex items-center gap-4",
            isCollapsed ? "justify-center" : ""
          )}>
            <div className="w-12 h-12 rounded-2xl bg-[#1E90FF] flex items-center justify-center font-black text-white shadow-2xl">
              AD
            </div>
            {!isCollapsed && (
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-black truncate uppercase tracking-tight">Cox Admin</p>
                <p className="text-[10px] text-[#1E90FF] font-black uppercase tracking-widest">Administrator</p>
              </div>
            )}
          </div>
          <button
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center gap-4 py-4 mt-6 text-white/40 hover:text-[#E63946] transition-all bg-white/5 rounded-2xl px-4",
              isCollapsed && "justify-center"
            )}
          >
            <LogOut className="w-6 h-6" />
            {!isCollapsed && <span className="text-xs font-black uppercase tracking-widest">Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main
        className="flex-1 flex flex-col"
        style={{ marginLeft: isCollapsed ? 80 : 280 }}
      >
        <header className="h-24 bg-white border-b-2 border-gray-50 px-10 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-6">
            <h2 className="text-2xl font-black text-[#0A2A43] uppercase tracking-tighter">
              {sidebarItems.find(item => location.pathname.startsWith(item.path))?.label || 'Overview'}
            </h2>
            <div className="flex items-center text-[10px] text-[#0A2A43]/40 px-3 py-1.5 bg-[#F1F5F9] rounded-lg font-black uppercase tracking-[0.2em] border border-gray-100">
              <span className="mr-3">Stream Stable</span>
              <div className="w-2 h-2 rounded-full bg-[#1E90FF] animate-pulse shadow-[0_0_12px_rgba(30,144,255,0.6)]"></div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <Link 
              to="/admin/add"
              className="px-8 py-3 bg-[#0A2A43] text-white text-[11px] font-black uppercase tracking-[0.25em] rounded-2xl hover:bg-[#1E90FF] transition-all shadow-2xl active:scale-95 transform"
            >
              + Publish Story
            </Link>
          </div>
        </header>

        <div className="p-10 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Global System Ticker */}
        <div className="h-14 bg-white border-t-2 border-gray-50 flex items-center overflow-hidden">
          <div className="bg-[#0A2A43] h-full px-8 flex items-center text-white font-black text-[10px] uppercase tracking-[0.3em] whitespace-nowrap z-10">
            NETWORK STATUS
          </div>
          <div className="flex-1 px-8 text-xs text-[#0A2A43]/50 font-bold uppercase tracking-widest whitespace-nowrap overflow-hidden italic">
            SECURE ACCESS GRANTED. DATABASE INTEGRITY: 100%. LIVE NODES INITIALIZED AT {new Date().toLocaleTimeString()}.
          </div>
        </div>
      </main>
    </div>
  );
}

import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import ScrollToTopButton from '../components/ScrollToTopButton';

const DashboardLayout = () => {
  return (
    <div className="flex w-full min-h-screen bg-[#f9fafc]">
      <Sidebar />
      <main className="flex-grow p-[40px] relative grain-bg">
        <Outlet />
        <ScrollToTopButton />
      </main>
    </div>
  );
};

export default DashboardLayout;

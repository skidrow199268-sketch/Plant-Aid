
import { Routes, Route, Navigate } from 'react-router-dom';

// Auth Pages
import Login from './pages/Auth/Login/page/Login';
import Register from './pages/Auth/Register/page/Register';
import ForgotPassword from './pages/Auth/ForgotPassword/page/ForgotPassword';

// Dashboard Pages
import DashboardToday from './pages/DashboardToday/page/DashboardToday';
import GardenDashboard from './pages/GardenDashboard/page/GardenDashboard';

// Plant Pages
import PlantDirectory from './pages/PlantDirectory/page/PlantDirectory';
import PlantDetail from './pages/PlantDetail/page/PlantDetail';

// Journal Pages
import JournalLogBook from './pages/JournalLogBook/page/JournalLogBook';


// Growth & Progress
import GrowthJourney from './pages/GrowthJourney/page/GrowthJourney';
import UpcomingPreview from './pages/UpcomingPreview/page/UpcomingPreview';

// Features
import RemindersChecklist from './pages/RemindersChecklist/page/RemindersChecklist';
import TaskManagement from './pages/TaskManagement/page/TaskManagement';
import DiagnosticScan from './pages/DiagnosticScan/page/DiagnosticScan';


// Info Pages
import TipSlider from './pages/TipSlider/page/TipSlider';
import HistoryLogs from './pages/HistoryLogs/page/HistoryLogs';

import PlantAidSettingsView from './pages/Setting/page/Settings';
import { ProtectedRoute } from './pages/Auth/Service/AuthContext';
import ResetConfirm from './pages/Auth/ResetConfirm/page/ResetConfirm';
import Profile from './pages/Profile/page/Profile';

import NotFound from './middleware/NotFound'


export default function App() {
  return (
   <div className="w-full min-h-dvh">
    
      <Routes>
        {/* Auth Routes */}
        <Route path="/auth/login" element={<Login />} />
        <Route path="/auth/register" element={<Register />} />
        <Route path="/auth/forgot-password" element={<ForgotPassword />} />
        <Route path={'/auth/reset-confirm'} element={<ResetConfirm/>} />

       <Route element={<ProtectedRoute/>}>
         {/* Dashboard Routes */}
        <Route path="/dashboard" element={<DashboardToday />} />
        <Route path="/collection" element={<GardenDashboard />} />

        {/* Plant Routes */}
        <Route path="/plants" element={<PlantDirectory />} />
        <Route path="/plants/:plantId" element={<PlantDetail />} />

        {/* Journal Routes */}
        <Route path="/journal" element={<JournalLogBook />} />
      

        {/* Growth & Progress Routes */}
        <Route path="/growth" element={<GrowthJourney />} />
       

        {/* Feature Routes */}
        <Route path="/reminders" element={<RemindersChecklist />} />
        <Route path="/task-management" element={<TaskManagement />} />
        <Route path="/diagnostic-scan" element={<DiagnosticScan />} />
  

        {/* Info Routes */}
        <Route path="/tips" element={<TipSlider />} />
        <Route path="/history-logs" element={<HistoryLogs />} />
        


        {/* Settings */}
        <Route path="/settings" element={<PlantAidSettingsView />} />
            <Route path="/profile" element={<Profile />} />
 

        {/* Default Route */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
       </Route>

       <Route path="*" element={<NotFound />} />

      </Routes>

   </div>


  );
}

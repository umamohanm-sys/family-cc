import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { AuthScreen } from './components/AuthScreen';
import { Layout } from './components/Layout';
import { HomeDashboard } from './components/HomeDashboard';
import { TasksView } from './components/TasksView';
import { CalendarView } from './components/CalendarView';
import { GoalsHabitsView } from './components/GoalsHabitsView';
import { JournalView } from './components/JournalView';
import { FamilyView } from './components/FamilyView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';

const AppShell: React.FC = () => {
  const { isAuthenticated, activeTab } = useApp();

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <Layout>
      {activeTab === 'home' && <HomeDashboard />}
      {activeTab === 'tasks' && <TasksView />}
      {activeTab === 'calendar' && <CalendarView />}
      {activeTab === 'goals' && <GoalsHabitsView />}
      {activeTab === 'journal' && <JournalView />}
      {activeTab === 'family' && <FamilyView />}
      {activeTab === 'reports' && <ReportsView />}
      {activeTab === 'settings' && <SettingsView />}
    </Layout>
  );
};

export function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}

export default App;

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const AdminPanel = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [saccos, setSaccos] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminData();
  }, [activeTab]);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      
      if (activeTab === 'overview') {
        const [statsRes, saccosRes] = await Promise.all([
          fetch('/api/admin/stats'),
          fetch('/api/admin/saccos')
        ]);
        
        const statsData = await statsRes.json();
        const saccosData = await saccosRes.json();
        
        setStats(statsData);
        setSaccos(saccosData);
      } else if (activeTab === 'users') {
        const usersRes = await fetch('/api/admin/users');
        const usersData = await usersRes.json();
        setUsers(usersData.users);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', name: t('admin.analytics') },
    { id: 'saccos', name: t('admin.saccos') },
    { id: 'users', name: t('admin.users') }
  ];

  if (loading && !stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t('admin.title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Manage SACCOs, users, and system analytics
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {activeTab === 'overview' && <OverviewTab stats={stats} saccos={saccos} />}
        {activeTab === 'saccos' && <SaccosTab saccos={saccos} />}
        {activeTab === 'users' && <UsersTab users={users} />}
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab = ({ stats, saccos }) => {
  const { t } = useTranslation();

  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={t('admin.totalSaccos')}
          value={stats.totalSaccos}
          icon="🏦"
          color="blue"
        />
        <StatCard
          title={t('admin.totalUsers')}
          value={stats.totalUsers}
          icon="👥"
          color="green"
        />
        <StatCard
          title={t('admin.totalTransactions')}
          value={stats.totalTransactions}
          icon="💳"
          color="purple"
        />
        <StatCard
          title={t('admin.averageCreditScore')}
          value={Math.round(stats.averageCreditScore)}
          icon="📊"
          color="orange"
        />
      </div>

      {/* Recent Registrations */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('admin.recentRegistrations')}
        </h3>
        <div className="space-y-3">
          {stats.recentRegistrations?.map((user) => (
            <div key={user.id} className="flex items-center justify-between py-2 border-b border-gray-200 dark:border-gray-700 last:border-0">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {new Date(user.createdAt).toLocaleDateString()}
                </p>
                <p className="text-xs text-gray-400">{user.sacco?.name}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SACCO Performance */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          SACCO Performance
        </h3>
        <div className="space-y-4">
          {saccos.map((sacco) => (
            <div key={sacco.id} className="flex items-center justify-between">
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">{sacco.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {sacco._count.users} members
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  License: {sacco.licenseNo}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Created: {new Date(sacco.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// SACCOs Tab Component
const SaccosTab = ({ saccos }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          All SACCOs
        </h3>
      </div>
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {saccos.map((sacco) => (
          <div key={sacco.id} className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-medium text-gray-900 dark:text-white">
                  {sacco.name}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  License: {sacco.licenseNo} • {sacco._count.users} members
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Created: {new Date(sacco.createdAt).toLocaleDateString()}
                </p>
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  View Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Users Tab Component
const UsersTab = ({ users }) => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          All Users
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                SACCO
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Credit Score
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Joined
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">
                      {user.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {user.email}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {user.sacco?.name || 'None'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    (user.creditScore || 0) >= 800 
                      ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                      : (user.creditScore || 0) >= 600
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100'
                      : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'
                  }`}>
                    {user.creditScore || 'N/A'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                  {user.role}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, value, icon, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-200',
    green: 'bg-green-50 text-green-600 dark:bg-green-900 dark:text-green-200',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900 dark:text-purple-200',
    orange: 'bg-orange-50 text-orange-600 dark:bg-orange-900 dark:text-orange-200'
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 card-hover">
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${colorClasses[color]} mr-4`}>
          <span className="text-2xl">{icon}</span>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
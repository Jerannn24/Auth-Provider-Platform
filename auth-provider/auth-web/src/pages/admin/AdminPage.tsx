import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:3000/api';

export default function Adminpage() {
    const [activeTab, setActiveTab] = useState<'apps' | 'groups' | 'users' | 'health'>('apps');

    const [applications, setApplications] = useState<any[]>([]);
    const [groups, setGroups] = useState<any[]>([]);
    const [users, setUsers] = useState<any[]>([]);
    const [healthStatus, setHealthStatus] = useState<{ live: any; ready: any }>({ live: null, ready: null });

    const [selectedPolicies, setSelectedPolicies] = useState<{ appId: string; data: any } | null>(null);
    const [selectedGroupUsers, setSelectedGroupUsers] = useState<{ groupId: string; data: any } | null>(null);
    const [editingGroup, setEditingGroup] = useState<any | null>(null);
    const [editingUser, setEditingUser] = useState<any | null>(null);

    const [newApp, setNewApp] = useState({ name: '', client_id: '', redirect_uris: [] as string[], launch_url: '', logout_notification_url: '' });
    const [groupForm, setGroupForm] = useState({ name: '', description: '' });
    const [userForm, setUserForm] = useState({ email: '', name: '', password: '' });
    const [appGroupInput, setAppGroupInput] = useState<{ [appId: string]: { groupId: string; effect: string } }>({});
    const [groupUserInput, setGroupUserInput] = useState<{ [groupId: string]: { userId: string } }>({});

    useEffect(() => {
        if (activeTab === 'apps') fetchApps();
        if (activeTab === 'groups') fetchGroups();
        if (activeTab === 'users') fetchUsers();
        if (activeTab === 'health') fetchHealth();
    }, [activeTab]);

    const fetchApps = async () => {
        try {
            const res = await fetch(`${API_BASE}/applications`, { credentials: 'include' });
            const data = await res.json();
            if (res.ok && Array.isArray(data)) {
            setApplications(data);
            } else {
            console.error('Fetch Apps Failed:', data);
            setApplications([]); 
            }
        } catch (err) {
            console.error('Fetch Apps Error:', err);
            setApplications([]);
        }
    };

    const fetchGroups = async () => {
        try {
            const res = await fetch(`${API_BASE}/groups`, { credentials: 'include' });
            const data = await res.json();
            if (res.ok && Array.isArray(data)) {
            setGroups(data);
            } else {
            console.error('Fetch Groups Failed:', data);
            setGroups([]);
            }
        } catch (err) {
            console.error('Fetch Groups Error:', err);
            setGroups([]);
        }
    };

    const fetchUsers = async () => {
        try {
            const res = await fetch(`${API_BASE}/users`, { credentials: 'include' });
            const data = await res.json();
            if (res.ok && Array.isArray(data)) {
            setUsers(data);
            } else { 
            console.error('Fetch Users Failed:', data);
            setUsers([]);
            }
        } catch (err) {
            console.error('Fetch Users Error:', err);
            setUsers([]);
        }
    };

    const fetchHealth = async () => {
        try {
        const [liveRes, readyRes] = await Promise.all([
            fetch(`http://localhost:3000/health/live`, { credentials: 'include' }),
            fetch(`http://localhost:3000/health/ready`, { credentials: 'include' }),
        ]);
        setHealthStatus({ live: await liveRes.json(), ready: await readyRes.json() });
        } catch (err) { console.error('Fetch Health Error:', err); }
    };

    const handleCreateApp = async (e: React.FormEvent) => {
        e.preventDefault();
        await fetch(`${API_BASE}/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: newApp.name,
            client_id: newApp.client_id,
            redirect_uris: newApp.redirect_uris,
            launch_url: newApp.launch_url,
            logout_notification_url: newApp.logout_notification_url
        }),
        });
        setNewApp({ name: '', client_id: '', redirect_uris: [] as string[], launch_url: '', logout_notification_url: '' });
        fetchApps();
    };

    const handleAddGroupToApp = async (appId: string) => {
        const input = appGroupInput[appId];
        if (!input?.groupId) return;
        await fetch(`${API_BASE}/applications/${appId}/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId: input.groupId, effect: input.effect || 'ALLOW' }),
        });
        fetchApps();
    };

    const handleUpdateGroupEffect = async (appId: string) => {
        const input = appGroupInput[appId];
        if (!input?.groupId) return;
        await fetch(`${API_BASE}/applications/${appId}/groups`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId: input.groupId, effect: input.effect || 'ALLOW' }),
        });
        fetchApps();
    };

    const handleRemoveGroupFromApp = async (appId: string) => {
        const input = appGroupInput[appId];
        if (!input?.groupId) return;
        await fetch(`${API_BASE}/applications/${appId}/groups`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId: input.groupId }),
        });
        fetchApps();
    };

    const handleGetPolicies = async (appId: string) => {
        const res = await fetch(`${API_BASE}/applications/${appId}/policies`);
        setSelectedPolicies({ appId, data: await res.json() });
    };

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        await fetch(`${API_BASE}/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(groupForm),
        });
        setGroupForm({ name: '', description: '' });
        fetchGroups();
    };

    const handleUpdateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingGroup) return;
        await fetch(`${API_BASE}/groups/${editingGroup.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editingGroup.name, description: editingGroup.description }),
        });
        setEditingGroup(null);
        fetchGroups();
    };

    const handleDeleteGroup = async (groupId: string) => {
        await fetch(`${API_BASE}/groups/${groupId}`, { method: 'DELETE' });
        fetchGroups();
    };

    const handleGetGroupUsers = async (groupId: string) => {
      const res = await fetch(`${API_BASE}/groups/${groupId}/users`);
      setSelectedGroupUsers({ groupId, data: await res.json() });
    };

    const handleAddUserToGroup = async (groupId: string) => {
      const input = groupUserInput[groupId];
      if (!input?.userId) return;
      await fetch(`${API_BASE}/groups/${groupId}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId: input.userId }),
      });
      setGroupUserInput({ ...groupUserInput, [groupId]: { userId: '' } });
      fetchGroups();
    };

    const handleRemoveUserFromGroup = async (groupId: string) => {
      const input = groupUserInput[groupId];
      if (!input?.userId) return;
      await fetch(`${API_BASE}/groups/${groupId}/users`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ userId: input.userId }),
      });
      setGroupUserInput({ ...groupUserInput, [groupId]: { userId: '' } });
      fetchGroups();
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userForm),
        });
        setUserForm({ email: '', name: '', password: '' });
        fetchUsers();
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        await fetch(`${API_BASE}/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: editingUser.email, name: editingUser.name, password: editingUser.password }),
        });
        setEditingUser(null);
        fetchUsers();
    };

    const handleDeleteUser = async (userId: string) => {
        await fetch(`${API_BASE}/users/${userId}`, { method: 'DELETE' });
        fetchUsers();
    };

    const handleToggleUserStatus = async (userId: string, currentStatus: string) => {
        const newStatus = currentStatus === 'ACTIVE';
        await fetch(`${API_BASE}/users/${userId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus }),
        });
        fetchUsers();
    };

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 font-sans">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-950 border-r border-slate-800 p-6 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-8">
            <div className="w-3 h-3 rounded-full bg-indigo-500 animate-pulse"></div>
            <h1 className="text-xl font-bold tracking-wider text-white">AUTH CONTROL</h1>
          </div>
          <nav className="space-y-2">
            {[
              { id: 'apps', label: 'Applications' },
              { id: 'groups', label: 'Groups' },
              { id: 'users', label: 'Users' },
              { id: 'health', label: 'Health Status' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition ${
                  activeTab === tab.id
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8">
        {activeTab === 'apps' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Application Route</h2>
            <form onSubmit={handleCreateApp} className="flex gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <input
                type="text"
                placeholder="New Application Name"
                value={newApp.name}
                onChange={(e) => setNewApp({ ...newApp, name: e.target.value })}
                className="bg-slate-900 border border-slate-700 px-4 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 flex-1"
                required
              />
              <input
                type="text"
                placeholder="New Application Client ID"
                value={newApp.client_id}
                onChange={(e) => setNewApp({ ...newApp, client_id: e.target.value })}
                className="bg-slate-900 border border-slate-700 px-4 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 flex-1"
                required
              />
              <input
                type="text"
                placeholder="New Application Redirect URIs"
                value={newApp.redirect_uris.join(',')}
                onChange={(e) => setNewApp({ ...newApp, redirect_uris: e.target.value.split(',') })}
                className="bg-slate-900 border border-slate-700 px-4 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 flex-1"
                required
              />
              <input
                type="text"
                placeholder="New Application Launch URL"
                value={newApp.launch_url}
                onChange={(e) => setNewApp({ ...newApp, launch_url: e.target.value })}
                className="bg-slate-900 border border-slate-700 px-4 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 flex-1"
                required
              />
              <input
                type="text"
                placeholder="New Application Notification URL"
                value={newApp.logout_notification_url}
                onChange={(e) => setNewApp({ ...newApp, logout_notification_url: e.target.value })}
                className="bg-slate-900 border border-slate-700 px-4 py-2 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500 flex-1"
                required
              />
              <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg text-sm font-medium">
                POST /applications
              </button>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {applications.map((app) => (
                <div key={app.id} className="bg-slate-950 p-6 rounded-xl border border-slate-800 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-white">{app.name}</h3>
                      <p className="text-xs font-mono text-slate-500">ID: {app.id}</p>
                    </div>
                    <button
                      onClick={() => handleGetPolicies(app.id)}
                      className="text-xs bg-slate-900 border border-slate-700 hover:bg-slate-800 text-indigo-400 px-3 py-1.5 rounded-md"
                    >
                      GET /policies
                    </button>
                  </div>

                  {/* Group Mapping Controls */}
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-3">
                    <p className="text-xs font-semibold text-slate-400">Application Group Control</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Group ID"
                        value={appGroupInput[app.id]?.groupId || ''}
                        onChange={(e) => setAppGroupInput({
                          ...appGroupInput,
                          [app.id]: { ...appGroupInput[app.id], groupId: e.target.value }
                        })}
                        className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded text-xs text-white flex-1"
                      />
                      <select
                        value={appGroupInput[app.id]?.effect || 'ALLOW'}
                        onChange={(e) => setAppGroupInput({
                          ...appGroupInput,
                          [app.id]: { ...appGroupInput[app.id], effect: e.target.value }
                        })}
                        className="bg-slate-950 border border-slate-800 text-xs text-white rounded px-2"
                      >
                        <option value="ALLOW">ALLOW</option>
                        <option value="DENY">DENY</option>
                      </select>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button onClick={() => handleAddGroupToApp(app.id)} className="text-xs bg-indigo-600/20 text-indigo-400 px-3 py-1 rounded border border-indigo-500/20 hover:bg-indigo-600/40">
                        POST /groups
                      </button>
                      <button onClick={() => handleUpdateGroupEffect(app.id)} className="text-xs bg-amber-600/20 text-amber-400 px-3 py-1 rounded border border-amber-500/20 hover:bg-amber-600/40">
                        PUT /groups
                      </button>
                      <button onClick={() => handleRemoveGroupFromApp(app.id)} className="text-xs bg-rose-600/20 text-rose-400 px-3 py-1 rounded border border-rose-500/20 hover:bg-rose-600/40">
                        DELETE /groups
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* GROUPS TAB */}
        {activeTab === 'groups' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Group Route</h2>
            
            <form onSubmit={handleCreateGroup} className="flex gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <input
                type="text"
                placeholder="Group Name"
                value={groupForm.name}
                onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
                className="bg-slate-900 border border-slate-700 px-4 py-2 rounded-lg text-sm text-white focus:outline-none"
                required
              />
              <input
                type="text"
                placeholder="Description"
                value={groupForm.description}
                onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })}
                className="bg-slate-900 border border-slate-700 px-4 py-2 rounded-lg text-sm text-white focus:outline-none flex-1"
              />
              <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg text-sm font-medium">
                POST /groups
              </button>
            </form>

            <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 text-xs uppercase">
                  <tr>
                    <th className="p-4">Group ID</th>
                    <th className="p-4">Name</th>
                    <th className="p-4">Description</th>
                    <th className="p-4">User Mapping Control</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-sm">
                  {(Array.isArray(groups) ? groups : []).map((group) => (
                    <tr key={group.id} className="hover:bg-slate-900/50">
                      <td className="p-4 font-mono text-xs text-slate-500">{group.id}</td>
                      <td className="p-4 font-semibold text-white">{group.name}</td>
                      <td className="p-4 text-slate-400">{group.description}</td>

                      {/* User Mapping Control */}
                      <td className="p-4 min-w-[280px]">
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="User ID"
                            value={groupUserInput[group.id]?.userId || ''}
                            onChange={(e) => setGroupUserInput({
                              ...groupUserInput,
                              [group.id]: { userId: e.target.value }
                            })}
                            className="bg-slate-900 border border-slate-800 px-2.5 py-1.5 rounded text-xs text-white w-36 focus:outline-none focus:border-indigo-500"
                          />
                          <button 
                            type="button"
                            onClick={() => handleAddUserToGroup(group.id)} 
                            className="text-xs bg-indigo-600/20 text-indigo-400 px-2.5 py-1.5 rounded border border-indigo-500/20 hover:bg-indigo-600/40"
                          >
                            + Add
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleRemoveUserFromGroup(group.id)} 
                            className="text-xs bg-rose-600/20 text-rose-400 px-2.5 py-1.5 rounded border border-rose-500/20 hover:bg-rose-600/40"
                          >
                            - Remove
                          </button>
                        </div>
                      </td>

                      <td className="p-4 space-x-3">
                        <button onClick={() => handleGetGroupUsers(group.id)} className="text-xs text-indigo-400 hover:underline">
                          GET /users
                        </button>
                        <button onClick={() => setEditingGroup(group)} className="text-xs text-amber-400 hover:underline">
                          PUT /groups
                        </button>
                        <button onClick={() => handleDeleteGroup(group.id)} className="text-xs text-rose-400 hover:underline">
                          DELETE /groups
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">USER Route</h2>
            <form onSubmit={handleCreateUser} className="flex gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <input
                type="email"
                placeholder="User Email"
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                className="bg-slate-900 border border-slate-700 px-4 py-2 rounded-lg text-sm text-white focus:outline-none"
                required
              />
              <input
                type="text"
                placeholder="Username"
                value={userForm.name}
                onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                className="bg-slate-900 border border-slate-700 px-4 py-2 rounded-lg text-sm text-white focus:outline-none flex-1"
              />
              <input
                type="password"
                placeholder="Password"
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                className="bg-slate-900 border border-slate-700 px-4 py-2 rounded-lg text-sm text-white focus:outline-none flex-1"
              />
              <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg text-sm font-medium">
                POST /users
              </button>
            </form>

            <div className="bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 text-xs uppercase">
                  <tr>
                    <th className="p-4">User ID</th>
                    <th className="p-4">Email</th>
                    <th className="p-4">Name</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-sm">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-900/50">
                      <td className="p-4 font-mono text-xs text-slate-500">{user.id}</td>
                      <td className="p-4 font-medium text-white">{user.email}</td>
                      <td className="p-4 text-slate-400">{user.name}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-md ${
                          user.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}>
                          {user.status || 'ACTIVE'}
                        </span>
                      </td>
                      <td className="p-4 space-x-3">
                        <button onClick={() => handleToggleUserStatus(user.id, user.status || 'ACTIVE')} className="text-xs text-amber-400 hover:underline">
                          PUT /status
                        </button>
                        <button onClick={() => setEditingUser(user)} className="text-xs text-indigo-400 hover:underline">
                          PUT /users
                        </button>
                        <button onClick={() => handleDeleteUser(user.id)} className="text-xs text-rose-400 hover:underline">
                          DELETE /users
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* HEALTH TAB */}
        {activeTab === 'health' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Health Route</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-white">Liveness Status</h3>
                  <p className="text-xs font-mono text-slate-500">GET /health/live</p>
                </div>
                <pre className="bg-slate-900 px-3 py-1.5 rounded text-xs font-mono text-emerald-400 border border-slate-800">
                  {healthStatus.live ? JSON.stringify(healthStatus.live.status) : 'Loading...'}
                </pre>
              </div>
              <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 flex justify-between items-center">
                <div>
                  <h3 className="font-bold text-white">Readiness Status</h3>
                  <p className="text-xs font-mono text-slate-500">GET /health/ready</p>
                </div>
                <pre className="bg-slate-900 px-3 py-1.5 rounded text-xs font-mono text-emerald-400 border border-slate-800">
                  {healthStatus.ready ? JSON.stringify(healthStatus.ready.status) : 'Loading...'}
                </pre>
              </div>
            </div>
          </div>
        )}

        {editingGroup && (
          <div className="fixed inset-0 bg-black/60 flex justify-center items-center">
            <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 w-96 space-y-4">
              <h3 className="text-lg font-bold text-white">PUT /groups/{editingGroup.id}</h3>
              <form onSubmit={handleUpdateGroup} className="space-y-3">
                <input
                  type="text"
                  value={editingGroup.name}
                  onChange={(e) => setEditingGroup({ ...editingGroup, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 px-3 py-2 rounded text-sm text-white"
                />
                <input
                  type="text"
                  value={editingGroup.description}
                  onChange={(e) => setEditingGroup({ ...editingGroup, description: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 px-3 py-2 rounded text-sm text-white"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setEditingGroup(null)} className="px-3 py-1.5 text-xs text-slate-400">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 bg-indigo-600 text-white rounded text-xs font-medium">Update Group</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {editingUser && (
          <div className="fixed inset-0 bg-black/60 flex justify-center items-center">
            <div className="bg-slate-950 p-6 rounded-xl border border-slate-800 w-96 space-y-4">
              <h3 className="text-lg font-bold text-white">PUT /users/{editingUser.id}</h3>
              <form onSubmit={handleUpdateUser} className="space-y-3">
                <input
                  type="email"
                  value={editingUser.email}
                  onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 px-3 py-2 rounded text-sm text-white"
                />
                <input
                  type="text"
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 px-3 py-2 rounded text-sm text-white"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setEditingUser(null)} className="px-3 py-1.5 text-xs text-slate-400">Cancel</button>
                  <button type="submit" className="px-4 py-1.5 bg-indigo-600 text-white rounded text-xs font-medium">Update User</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {selectedPolicies && (
          <div className="fixed inset-0 bg-black/60 flex justify-end">
            <div className="w-96 bg-slate-950 p-6 border-l border-slate-800 h-full overflow-y-auto space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-white">GET /applications/{selectedPolicies.appId}/policies</h3>
                <button onClick={() => setSelectedPolicies(null)} className="text-xs text-slate-400 hover:text-white">Close</button>
              </div>
              <pre className="bg-slate-900 p-4 rounded-lg text-xs font-mono text-emerald-400 overflow-x-auto border border-slate-800">
                {JSON.stringify(selectedPolicies.data, null, 2)}
              </pre>
            </div>
          </div>
        )}

        {selectedGroupUsers && (
          <div className="fixed inset-0 bg-black/60 flex justify-end">
            <div className="w-96 bg-slate-950 p-6 border-l border-slate-800 h-full overflow-y-auto space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-white">GET /groups/{selectedGroupUsers.groupId}/users</h3>
                <button onClick={() => setSelectedGroupUsers(null)} className="text-xs text-slate-400 hover:text-white">Close</button>
              </div>
              <pre className="bg-slate-900 p-4 rounded-lg text-xs font-mono text-indigo-400 overflow-x-auto border border-slate-800">
                {JSON.stringify(selectedGroupUsers.data, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
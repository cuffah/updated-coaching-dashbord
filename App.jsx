import React, { useState, useEffect } from 'react';
import { Calendar, Users, FileText, DollarSign, Settings, TrendingUp, Bell, Award, MessageSquare, Zap, Flame, Target, BarChart3, Plus, X, Edit2, Trash2, Check, Copy, ChevronDown, ChevronUp } from 'lucide-react';

const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showSettings, setShowSettings] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [clients, setClients] = useState([]);
  const [leads, setLeads] = useState([]);
  const [notes, setNotes] = useState({ availability: '', general: '' });
  const [reminders, setReminders] = useState([]);
  const [testimonials, setTestimonials] = useState([]);
  const [settings, setSettings] = useState({
    weeklyGoal: 10,
    pricing: {
      oneOnOne: 35,
      teamVod: 40,
      scrimCoaching: 30,
      vodReview: 20,
      package3Session: 100
    }
  });

  useEffect(() => {
    const saved = localStorage.getItem('coachingDashboard');
    if (saved) {
      const data = JSON.parse(saved);
      setBookings(data.bookings || []);
      setClients(data.clients || []);
      setLeads(data.leads || []);
      setNotes(data.notes || { availability: '', general: '' });
      setReminders(data.reminders || []);
      setTestimonials(data.testimonials || []);
      setSettings(data.settings || settings);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('coachingDashboard', JSON.stringify({
      bookings, clients, leads, notes, reminders, testimonials, settings
    }));
  }, [bookings, clients, leads, notes, reminders, testimonials, settings]);

  const calculateStats = () => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const weekBookings = bookings.filter(b => new Date(b.date) >= weekAgo);
    const monthBookings = bookings.filter(b => new Date(b.date) >= monthAgo);

    const weekHours = weekBookings.reduce((sum, b) => sum + (b.duration || 1), 0);
    const monthHours = monthBookings.reduce((sum, b) => sum + (b.duration || 1), 0);

    const weekEarnings = weekBookings.reduce((sum, b) => sum + (b.finalPrice || b.price || 0), 0);
    const monthEarnings = monthBookings.reduce((sum, b) => sum + (b.finalPrice || b.price || 0), 0);

    return { weekHours, monthHours, weekEarnings, monthEarnings };
  };

  const getSessionStreak = () => {
    const sortedBookings = [...bookings].sort((a, b) => new Date(b.date) - new Date(a.date));
    if (sortedBookings.length === 0) return 0;

    let streak = 0;
    let currentWeekStart = new Date();
    currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay());
    currentWeekStart.setHours(0, 0, 0, 0);

    let checkWeek = new Date(currentWeekStart);
    
    while (true) {
      const weekEnd = new Date(checkWeek);
      weekEnd.setDate(weekEnd.getDate() + 7);
      
      const hasSession = sortedBookings.some(b => {
        const bookingDate = new Date(b.date);
        return bookingDate >= checkWeek && bookingDate < weekEnd;
      });
      
      if (!hasSession) break;
      streak++;
      checkWeek.setDate(checkWeek.getDate() - 7);
    }
    
    return streak;
  };

  const getQuickActions = () => {
    const actions = [];
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const overdueReminders = reminders.filter(r => !r.completed && new Date(r.dueDate) < now);
    if (overdueReminders.length > 0) {
      actions.push({ type: 'overdue', count: overdueReminders.length, label: 'Overdue Reminders' });
    }

    const staleClients = clients.filter(c => {
      const clientBookings = bookings.filter(b => b.clientName === c.name);
      if (clientBookings.length === 0) return false;
      const lastSession = new Date(Math.max(...clientBookings.map(b => new Date(b.date))));
      return lastSession < thirtyDaysAgo;
    });
    if (staleClients.length > 0) {
      actions.push({ type: 'stale', count: staleClients.length, label: 'Inactive Clients (30+ days)' });
    }

    const unpaidBookings = bookings.filter(b => b.paymentStatus === 'unpaid');
    if (unpaidBookings.length > 0) {
      actions.push({ type: 'unpaid', count: unpaidBookings.length, label: 'Unpaid Sessions' });
    }

    return actions;
  };

  const get6MonthEarnings = () => {
    const months = [];
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();
    
    // Start from January of current year
    for (let i = 0; i <= currentMonth; i++) {
      const monthStart = new Date(currentYear, i, 1);
      const monthEnd = new Date(currentYear, i + 1, 0);
      
      const monthBookings = bookings.filter(b => {
        const date = new Date(b.date);
        return date >= monthStart && date <= monthEnd;
      });
      
      const earnings = monthBookings.reduce((sum, b) => sum + (b.finalPrice || b.price || 0), 0);
      
      months.push({
        month: monthStart.toLocaleString('default', { month: 'short' }),
        earnings
      });
    }
    
    return months;
  };

  const getLeadSourceAnalytics = () => {
    const sources = {};
    
    leads.forEach(lead => {
      if (!sources[lead.source]) {
        sources[lead.source] = { total: 0, converted: 0 };
      }
      sources[lead.source].total++;
      if (lead.status === 'converted') {
        sources[lead.source].converted++;
      }
    });
    
    return Object.entries(sources).map(([source, data]) => ({
      source,
      total: data.total,
      converted: data.converted,
      rate: data.total > 0 ? ((data.converted / data.total) * 100).toFixed(1) : 0
    })).sort((a, b) => b.rate - a.rate);
  };

  const stats = calculateStats();
  const streak = getSessionStreak();
  const quickActions = getQuickActions();
  const monthlyData = get6MonthEarnings();
  const leadAnalytics = getLeadSourceAnalytics();
  const maxEarnings = Math.max(...monthlyData.map(m => m.earnings), 1);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-4">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                OW2 Coaching Dashboard
              </h1>
              <p className="text-slate-400 mt-1">Bossman Ting Coaching</p>
            </div>
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
            >
              <Settings className="w-6 h-6" />
            </button>
          </div>
        </header>

        <nav className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: 'dashboard', icon: BarChart3, label: 'Dashboard' },
            { id: 'calendar', icon: Calendar, label: 'Calendar' },
            { id: 'bookings', icon: FileText, label: 'Bookings' },
            { id: 'clients', icon: Users, label: 'Clients' },
            { id: 'leads', icon: Target, label: 'Leads' },
            { id: 'reminders', icon: Bell, label: 'Reminders' },
            { id: 'testimonials', icon: MessageSquare, label: 'Testimonials' },
            { id: 'notes', icon: FileText, label: 'Notes' },
            { id: 'projections', icon: TrendingUp, label: 'Projections' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>

        {activeTab === 'dashboard' && (
          <DashboardTab 
            stats={stats} 
            settings={settings} 
            streak={streak}
            quickActions={quickActions}
            monthlyData={monthlyData}
            maxEarnings={maxEarnings}
            leadAnalytics={leadAnalytics}
          />
        )}

        {activeTab === 'calendar' && <CalendarTab bookings={bookings} />}
        
        {activeTab === 'bookings' && (
          <BookingsTab 
            bookings={bookings} 
            setBookings={setBookings} 
            clients={clients}
            settings={settings}
          />
        )}
        
        {activeTab === 'clients' && (
          <ClientsTab 
            clients={clients} 
            setClients={setClients}
            bookings={bookings}
          />
        )}
        
        {activeTab === 'leads' && (
          <LeadsTab leads={leads} setLeads={setLeads} />
        )}

        {activeTab === 'reminders' && (
          <RemindersTab reminders={reminders} setReminders={setReminders} />
        )}

        {activeTab === 'testimonials' && (
          <TestimonialsTab testimonials={testimonials} setTestimonials={setTestimonials} />
        )}
        
        {activeTab === 'notes' && (
          <NotesTab notes={notes} setNotes={setNotes} />
        )}
        
        {activeTab === 'projections' && (
          <ProjectionsTab bookings={bookings} settings={settings} />
        )}

        {showSettings && (
          <SettingsModal 
            settings={settings} 
            setSettings={setSettings}
            onClose={() => setShowSettings(false)}
            onExport={() => {
              const data = { bookings, clients, leads, notes, reminders, testimonials, settings };
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `coaching-data-${new Date().toISOString().split('T')[0]}.json`;
              a.click();
            }}
          />
        )}
      </div>
    </div>
  );
};

const DashboardTab = ({ stats, settings, streak, quickActions, monthlyData, maxEarnings, leadAnalytics }) => (
  <div className="space-y-6">
    {quickActions.length > 0 && (
      <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap className="w-5 h-5 text-yellow-400" />
          <h3 className="font-semibold text-yellow-400">Quick Actions Needed</h3>
        </div>
        <div className="flex flex-wrap gap-3">
          {quickActions.map((action, i) => (
            <div key={i} className="bg-slate-800/50 rounded px-3 py-2 flex items-center gap-2">
              <span className="bg-yellow-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                {action.count}
              </span>
              <span className="text-sm">{action.label}</span>
            </div>
          ))}
        </div>
      </div>
    )}

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        icon={Calendar}
        label="This Week"
        value={`${stats.weekHours}h`}
        subtitle={`$${stats.weekEarnings}`}
        color="purple"
      />
      <StatCard
        icon={TrendingUp}
        label="This Month"
        value={`${stats.monthHours}h`}
        subtitle={`$${stats.monthEarnings}`}
        color="pink"
      />
      <StatCard
        icon={Target}
        label="Weekly Goal"
        value={`${stats.weekHours}/${settings.weeklyGoal}h`}
        subtitle={`${Math.round((stats.weekHours / settings.weeklyGoal) * 100)}% complete`}
        color="blue"
      />
      {streak > 0 && (
        <StatCard
          icon={Flame}
          label="Session Streak"
          value={`${streak} week${streak !== 1 ? 's' : ''}`}
          subtitle="Keep it up!"
          color="orange"
        />
      )}
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-purple-400" />
          Year-to-Date Earnings
        </h3>
        <div className="flex items-end justify-between h-48 gap-2">
          {monthlyData.map((month, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-2">
              <div className="text-xs text-slate-400 font-semibold">
                ${month.earnings}
              </div>
              <div 
                className="w-full bg-gradient-to-t from-purple-600 to-pink-500 rounded-t"
                style={{ height: `${(month.earnings / maxEarnings) * 100}%`, minHeight: '4px' }}
              />
              <div className="text-xs text-slate-500">{month.month}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-pink-400" />
          Lead Source Analytics
        </h3>
        <div className="space-y-3">
          {leadAnalytics.length === 0 ? (
            <p className="text-slate-400 text-sm">No lead data yet</p>
          ) : (
            leadAnalytics.map((source, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{source.source}</span>
                    <span className="text-xs text-slate-400">
                      {source.converted}/{source.total} ({source.rate}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
                      style={{ width: `${source.rate}%` }}
                    />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  </div>
);

const StatCard = ({ icon: Icon, label, value, subtitle, color }) => {
  const colors = {
    purple: 'from-purple-600 to-purple-800',
    pink: 'from-pink-600 to-pink-800',
    blue: 'from-blue-600 to-blue-800',
    orange: 'from-orange-600 to-orange-800'
  };

  return (
    <div className={`bg-gradient-to-br ${colors[color]} rounded-lg p-6 border border-white/10`}>
      <Icon className="w-8 h-8 mb-3 opacity-80" />
      <div className="text-sm opacity-80 mb-1">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs opacity-70 mt-1">{subtitle}</div>
    </div>
  );
};

const CalendarTab = ({ bookings }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();

  const firstDay = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay();

  const getDayBookings = (day) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return bookings.filter(b => b.date === dateStr);
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)))}
              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded transition"
            >
              ←
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded transition"
            >
              Today
            </button>
            <button
              onClick={() => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))}
              className="px-3 py-1 bg-slate-700 hover:bg-slate-600 rounded transition"
            >
              →
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm font-semibold text-slate-400 py-2">
              {day}
            </div>
          ))}

          {[...Array(firstDay)].map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square" />
          ))}

          {[...Array(daysInMonth)].map((_, i) => {
            const day = i + 1;
            const dayBookings = getDayBookings(day);
            const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();
            const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

            return (
              <div
                key={day}
                className={`aspect-square border rounded-lg p-2 ${
                  isToday ? 'border-purple-500 bg-purple-900/30' : 'border-slate-700 bg-slate-900/30'
                }`}
              >
                <div className="text-sm font-semibold mb-1">{day}</div>
                <div className="space-y-1">
                  {dayBookings.slice(0, 2).map((booking, idx) => (
                    <div
                      key={idx}
                      className="text-xs bg-purple-600/50 rounded px-1 py-0.5 truncate"
                      title={`${booking.time} - ${booking.clientName} (${booking.service})`}
                    >
                      {booking.time}
                    </div>
                  ))}
                  {dayBookings.length > 2 && (
                    <button
                      onClick={() => setSelectedDay(dateStr)}
                      className="text-xs text-purple-400 hover:text-purple-300 underline"
                    >
                      +{dayBookings.length - 2} more
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selectedDay && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-800 rounded-lg p-6 max-w-2xl w-full border border-slate-700 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                Bookings for {new Date(selectedDay).toLocaleDateString('default', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </h3>
              <button
                onClick={() => setSelectedDay(null)}
                className="p-2 hover:bg-slate-700 rounded transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-3">
              {bookings
                .filter(b => b.date === selectedDay)
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((booking, idx) => (
                  <div key={idx} className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-lg font-semibold">{booking.time}</span>
                      <span className="bg-purple-600/30 px-2 py-1 rounded text-sm">{booking.service}</span>
                    </div>
                    <div className="text-sm space-y-1">
                      <div><span className="text-slate-400">Client:</span> {booking.clientName}</div>
                      <div><span className="text-slate-400">Duration:</span> {booking.duration}h</div>
                      <div>
                        <span className="text-slate-400">Price:</span>{' '}
                        {booking.discount > 0 ? (
                          <>
                            <span className="line-through text-slate-500">${booking.price}</span>
                            <span className="ml-2 text-green-400 font-semibold">${booking.finalPrice.toFixed(2)}</span>
                            <span className="ml-2 text-xs bg-purple-600/30 px-2 py-0.5 rounded">
                              {booking.discount}% off
                            </span>
                          </>
                        ) : (
                          <span>${booking.price}</span>
                        )}
                      </div>
                      <div>
                        <span className="text-slate-400">Status:</span>{' '}
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          booking.paymentStatus === 'paid' ? 'bg-green-600/30' : 'bg-yellow-600/30'
                        }`}>
                          {booking.paymentStatus}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const BookingsTab = ({ bookings, setBookings, clients, settings }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    clientName: '',
    date: '',
    time: '',
    service: '1-on-1',
    duration: 1,
    price: settings.pricing.oneOnOne,
    discount: 0,
    discountReason: '',
    paymentStatus: 'unpaid',
    notes: '',
    preSessionNotes: '',
    duringSessionNotes: '',
    homework: ''
  });

  const serviceOptions = [
    { value: '1-on-1', label: '1-on-1 Session', price: settings.pricing.oneOnOne },
    { value: 'Team VOD', label: 'Team VOD Review', price: settings.pricing.teamVod },
    { value: 'Scrim Coaching', label: 'Scrim Coaching', price: settings.pricing.scrimCoaching },
    { value: 'VOD Review', label: 'VOD Review', price: settings.pricing.vodReview },
    { value: '3-Session Package', label: '3-Session Package', price: settings.pricing.package3Session }
  ];

  const discountOptions = [0, 10, 15, 20, 25, 50];
  const discountReasons = ['Twitch Sub', 'Referral', 'Returning Client', 'Bundle Deal', 'Promo', 'Other'];

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalPrice = formData.price * (1 - formData.discount / 100);
    
    if (editingId) {
      setBookings(bookings.map(b => b.id === editingId ? { ...formData, id: editingId, finalPrice } : b));
    } else {
      setBookings([...bookings, { ...formData, id: Date.now(), finalPrice }]);
    }
    
    setFormData({
      clientName: '',
      date: '',
      time: '',
      service: '1-on-1',
      duration: 1,
      price: settings.pricing.oneOnOne,
      discount: 0,
      discountReason: '',
      paymentStatus: 'unpaid',
      notes: '',
      preSessionNotes: '',
      duringSessionNotes: '',
      homework: ''
    });
    setShowForm(false);
    setEditingId(null);
  };

  const resetForm = () => {
    setFormData({
      clientName: '',
      date: '',
      time: '',
      service: '1-on-1',
      duration: 1,
      price: settings.pricing.oneOnOne,
      discount: 0,
      discountReason: '',
      paymentStatus: 'unpaid',
      notes: '',
      preSessionNotes: '',
      duringSessionNotes: '',
      homework: ''
    });
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (booking) => {
    setFormData(booking);
    setEditingId(booking.id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (confirm('Delete this booking?')) {
      setBookings(bookings.filter(b => b.id !== id));
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={() => setShowForm(true)}
        className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        New Booking
      </button>

      {showForm && (
        <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold mb-4">
            {editingId ? 'Edit Booking' : 'New Booking'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Client Name</label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2"
                  required
                  list="clients-list"
                />
                <datalist id="clients-list">
                  {clients.map(c => (
                    <option key={c.id} value={c.name} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="block text-sm mb-1">Service</label>
                <select
                  value={formData.service}
                  onChange={(e) => {
                    const option = serviceOptions.find(o => o.value === e.target.value);
                    setFormData({ ...formData, service: e.target.value, price: option.price });
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2"
                >
                  {serviceOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm mb-1">Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Time</label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Duration (hours)</label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseFloat(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Payment Status</label>
                <select
                  value={formData.paymentStatus}
                  onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2"
                >
                  <option value="unpaid">Unpaid</option>
                  <option value="paid">Paid</option>
                </select>
              </div>

              <div>
                <label className="block text-sm mb-1">Discount %</label>
                <select
                  value={formData.discount}
                  onChange={(e) => setFormData({ ...formData, discount: parseInt(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2"
                >
                  {discountOptions.map(d => (
                    <option key={d} value={d}>{d}%</option>
                  ))}
                </select>
              </div>

              {formData.discount > 0 && (
                <div>
                  <label className="block text-sm mb-1">Discount Reason</label>
                  <select
                    value={formData.discountReason}
                    onChange={(e) => setFormData({ ...formData, discountReason: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2"
                  >
                    <option value="">Select reason...</option>
                    {discountReasons.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {formData.discount > 0 && (
              <div className="bg-purple-900/30 border border-purple-600/50 rounded p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-slate-400 line-through">${formData.price}</span>
                    <span className="ml-2 text-xl font-bold text-green-400">
                      ${(formData.price * (1 - formData.discount / 100)).toFixed(2)}
                    </span>
                  </div>
                  <span className="text-sm text-purple-300">
                    {formData.discount}% off {formData.discountReason && `(${formData.discountReason})`}
                  </span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm mb-1">Pre-Session Notes</label>
              <textarea
                value={formData.preSessionNotes}
                onChange={(e) => setFormData({ ...formData, preSessionNotes: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 h-20"
                placeholder="Goals, areas to focus on..."
              />
            </div>

            <div>
              <label className="block text-sm mb-1">During Session Notes</label>
              <textarea
                value={formData.duringSessionNotes}
                onChange={(e) => setFormData({ ...formData, duringSessionNotes: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 h-20"
                placeholder="What we covered, observations..."
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Homework/Action Items</label>
              <textarea
                value={formData.homework}
                onChange={(e) => setFormData({ ...formData, homework: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 h-20"
                placeholder="Practice drills, VODs to review..."
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded transition"
              >
                {editingId ? 'Update' : 'Create'} Booking
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-2">
        {bookings.length === 0 && (
          <div className="text-center text-slate-400 py-8">
            No bookings yet. Create your first booking!
          </div>
        )}
        {bookings.sort((a, b) => new Date(b.date + ' ' + b.time) - new Date(a.date + ' ' + a.time)).map(booking => (
          <div key={booking.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-lg">{booking.clientName}</h3>
                  <span className="text-sm bg-purple-600/30 px-2 py-1 rounded">{booking.service}</span>
                  <span className={`text-sm px-2 py-1 rounded ${
                    booking.paymentStatus === 'paid' ? 'bg-green-600/30' : 'bg-yellow-600/30'
                  }`}>
                    {booking.paymentStatus}
                  </span>
                </div>
                <div className="text-sm text-slate-400 space-y-1">
                  <div>{booking.date} at {booking.time} ({booking.duration}h)</div>
                  {booking.discount > 0 ? (
                    <div className="flex items-center gap-2">
                      <span className="line-through">${booking.price}</span>
                      <span className="text-green-400 font-semibold">${booking.finalPrice.toFixed(2)}</span>
                      <span className="text-xs bg-purple-600/30 px-2 py-0.5 rounded">
                        {booking.discount}% off - {booking.discountReason}
                      </span>
                    </div>
                  ) : (
                    <div>${booking.price}</div>
                  )}
                  {booking.service === '3-Session Package' && (
                    <PackageProgress clientName={booking.clientName} bookings={bookings} />
                  )}
                </div>
                {(booking.preSessionNotes || booking.duringSessionNotes || booking.homework) && (
                  <div className="mt-3 space-y-2 text-sm">
                    {booking.preSessionNotes && (
                      <div>
                        <span className="text-purple-400 font-medium">Pre-session:</span>
                        <p className="text-slate-300">{booking.preSessionNotes}</p>
                      </div>
                    )}
                    {booking.duringSessionNotes && (
                      <div>
                        <span className="text-blue-400 font-medium">Session notes:</span>
                        <p className="text-slate-300">{booking.duringSessionNotes}</p>
                      </div>
                    )}
                    {booking.homework && (
                      <div>
                        <span className="text-green-400 font-medium">Homework:</span>
                        <p className="text-slate-300">{booking.homework}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(booking)}
                  className="p-2 bg-slate-700 hover:bg-slate-600 rounded transition"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(booking.id)}
                  className="p-2 bg-red-900/50 hover:bg-red-800 rounded transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const PackageProgress = ({ clientName, bookings }) => {
  const packageBookings = bookings.filter(b => 
    b.clientName === clientName && b.service === '3-Session Package'
  );
  const completed = Math.min(packageBookings.length, 3);

  return (
    <div className="flex items-center gap-2 mt-2">
      <span className="text-xs text-slate-400">Package progress:</span>
      <div className="flex gap-1">
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className={`w-6 h-6 rounded border-2 flex items-center justify-center text-xs font-bold ${
              i <= completed
                ? 'bg-green-600 border-green-500 text-white'
                : 'bg-slate-700 border-slate-600 text-slate-500'
            }`}
          >
            {i <= completed ? <Check className="w-3 h-3" /> : i}
          </div>
        ))}
      </div>
      <span className="text-xs text-slate-400">{completed}/3 completed</span>
    </div>
  );
};

const ClientsTab = ({ clients, setClients, bookings }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [expandedClient, setExpandedClient] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    discord: '',
    currentRank: 'Bronze',
    startingRank: 'Bronze',
    goalRank: 'Diamond',
    notes: '',
    rankHistory: []
  });

  const ranks = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', 'Master', 'Grandmaster', 'Top 500'];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      setClients(clients.map(c => c.id === editingId ? { ...formData, id: editingId } : c));
    } else {
      const newClient = {
        ...formData,
        id: Date.now(),
        rankHistory: [{ rank: formData.startingRank, date: new Date().toISOString().split('T')[0], note: 'Starting rank' }]
      };
      setClients([...clients, newClient]);
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      discord: '',
      currentRank: 'Bronze',
      startingRank: 'Bronze',
      goalRank: 'Diamond',
      notes: '',
      rankHistory: []
    });
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (client) => {
    setFormData(client);
    setEditingId(client.id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (confirm('Delete this client?')) {
      setClients(clients.filter(c => c.id !== id));
    }
  };

  const addRankUpdate = (clientId, newRank, note = '') => {
    setClients(clients.map(c => {
      if (c.id === clientId) {
        return {
          ...c,
          currentRank: newRank,
          rankHistory: [
            ...c.rankHistory,
            { rank: newRank, date: new Date().toISOString().split('T')[0], note }
          ]
        };
      }
      return c;
    }));
  };

  const getClientStats = (client) => {
    const clientBookings = bookings.filter(b => b.clientName === client.name);
    const totalSessions = clientBookings.length;
    const totalSpent = clientBookings.reduce((sum, b) => sum + (b.finalPrice || b.price || 0), 0);
    const lastSession = clientBookings.length > 0
      ? new Date(Math.max(...clientBookings.map(b => new Date(b.date)))).toLocaleDateString()
      : 'Never';
    
    return { totalSessions, totalSpent, lastSession };
  };

  return (
    <div className="space-y-4">
      <button
        onClick={() => setShowForm(true)}
        className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        New Client
      </button>

      {showForm && (
        <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold mb-4">
            {editingId ? 'Edit Client' : 'New Client'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Discord</label>
                <input
                  type="text"
                  value={formData.discord}
                  onChange={(e) => setFormData({ ...formData, discord: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Starting Rank</label>
                <select
                  value={formData.startingRank}
                  onChange={(e) => setFormData({ ...formData, startingRank: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2"
                >
                  {ranks.map(rank => (
                    <option key={rank} value={rank}>{rank}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm mb-1">Current Rank</label>
                <select
                  value={formData.currentRank}
                  onChange={(e) => setFormData({ ...formData, currentRank: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2"
                >
                  {ranks.map(rank => (
                    <option key={rank} value={rank}>{rank}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm mb-1">Goal Rank</label>
                <select
                  value={formData.goalRank}
                  onChange={(e) => setFormData({ ...formData, goalRank: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2"
                >
                  {ranks.map(rank => (
                    <option key={rank} value={rank}>{rank}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 h-24"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded transition"
              >
                {editingId ? 'Update' : 'Create'} Client
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-2">
        {clients.length === 0 && (
          <div className="text-center text-slate-400 py-8">
            No clients yet. Add your first client!
          </div>
        )}
        {clients.map(client => {
          const stats = getClientStats(client);
          const isExpanded = expandedClient === client.id;

          return (
            <div key={client.id} className="bg-slate-800/50 rounded-lg border border-slate-700">
              <div className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{client.name}</h3>
                      <span className="text-sm bg-purple-600/30 px-2 py-1 rounded">{client.currentRank}</span>
                      {client.discord && (
                        <span className="text-sm text-slate-400">{client.discord}</span>
                      )}
                    </div>
                    <div className="text-sm text-slate-400 space-y-1">
                      <div>Goal: {client.goalRank}</div>
                      <div className="flex gap-4">
                        <span>{stats.totalSessions} sessions</span>
                        <span>${stats.totalSpent.toFixed(2)} total</span>
                        <span>Last: {stats.lastSession}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setExpandedClient(isExpanded ? null : client.id)}
                      className="p-2 bg-slate-700 hover:bg-slate-600 rounded transition"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleEdit(client)}
                      className="p-2 bg-slate-700 hover:bg-slate-600 rounded transition"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(client.id)}
                      className="p-2 bg-red-900/50 hover:bg-red-800 rounded transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-slate-700 p-4 space-y-4">
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Award className="w-4 h-4 text-purple-400" />
                      Rank Progression
                    </h4>
                    <div className="space-y-2">
                      {client.rankHistory.map((entry, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm">
                          <span className="text-slate-400">{entry.date}</span>
                          <span className="bg-purple-600/30 px-2 py-1 rounded">{entry.rank}</span>
                          {entry.note && <span className="text-slate-400">{entry.note}</span>}
                        </div>
                      ))}
                    </div>
                    <div className="mt-3">
                      <RankUpdateForm
                        currentRank={client.currentRank}
                        ranks={ranks}
                        onUpdate={(newRank, note) => addRankUpdate(client.id, newRank, note)}
                      />
                    </div>
                  </div>

                  {client.notes && (
                    <div>
                      <h4 className="font-medium mb-2">Notes</h4>
                      <p className="text-sm text-slate-300">{client.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const RankUpdateForm = ({ currentRank, ranks, onUpdate }) => {
  const [newRank, setNewRank] = useState(currentRank);
  const [note, setNote] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(newRank, note);
    setNote('');
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <select
        value={newRank}
        onChange={(e) => setNewRank(e.target.value)}
        className="bg-slate-900 border border-slate-700 rounded px-3 py-1 text-sm"
      >
        {ranks.map(rank => (
          <option key={rank} value={rank}>{rank}</option>
        ))}
      </select>
      <input
        type="text"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Optional note..."
        className="flex-1 bg-slate-900 border border-slate-700 rounded px-3 py-1 text-sm"
      />
      <button
        type="submit"
        className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-sm transition"
        disabled={newRank === currentRank}
      >
        Update Rank
      </button>
    </form>
  );
};

const LeadsTab = ({ leads, setLeads }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    source: 'Twitch',
    contactInfo: '',
    status: 'new',
    notes: ''
  });

  const sources = ['Twitch', 'Discord', 'Twitter', 'Reddit', 'Friend Referral', 'Other'];
  const statuses = ['new', 'contacted', 'interested', 'converted', 'lost'];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingId) {
      setLeads(leads.map(l => l.id === editingId ? { ...formData, id: editingId } : l));
    } else {
      setLeads([...leads, { ...formData, id: Date.now(), createdAt: new Date().toISOString() }]);
    }
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      source: 'Twitch',
      contactInfo: '',
      status: 'new',
      notes: ''
    });
    setShowForm(false);
    setEditingId(null);
  };

  const handleEdit = (lead) => {
    setFormData(lead);
    setEditingId(lead.id);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (confirm('Delete this lead?')) {
      setLeads(leads.filter(l => l.id !== id));
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      new: 'bg-blue-600/30',
      contacted: 'bg-yellow-600/30',
      interested: 'bg-purple-600/30',
      converted: 'bg-green-600/30',
      lost: 'bg-red-600/30'
    };
    return colors[status];
  };

  return (
    <div className="space-y-4">
      <button
        onClick={() => setShowForm(true)}
        className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        New Lead
      </button>

      {showForm && (
        <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold mb-4">
            {editingId ? 'Edit Lead' : 'New Lead'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Source</label>
                <select
                  value={formData.source}
                  onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2"
                >
                  {sources.map(source => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm mb-1">Contact Info</label>
                <input
                  type="text"
                  value={formData.contactInfo}
                  onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2"
                  placeholder="Discord, email, etc."
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2"
                >
                  {statuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 h-24"
              />
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded transition"
              >
                {editingId ? 'Update' : 'Create'} Lead
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-2">
        {leads.length === 0 && (
          <div className="text-center text-slate-400 py-8">
            No leads yet. Add your first lead!
          </div>
        )}
        {leads.map(lead => (
          <div key={lead.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-lg">{lead.name}</h3>
                  <span className={`text-sm px-2 py-1 rounded ${getStatusColor(lead.status)}`}>
                    {lead.status}
                  </span>
                  <span className="text-sm bg-slate-700 px-2 py-1 rounded">{lead.source}</span>
                </div>
                <div className="text-sm text-slate-400 space-y-1">
                  {lead.contactInfo && <div>Contact: {lead.contactInfo}</div>}
                  {lead.notes && <div>{lead.notes}</div>}
                  <div className="text-xs">Added: {new Date(lead.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(lead)}
                  className="p-2 bg-slate-700 hover:bg-slate-600 rounded transition"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(lead.id)}
                  className="p-2 bg-red-900/50 hover:bg-red-800 rounded transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const RemindersTab = ({ reminders, setReminders }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    dueDate: '',
    notes: '',
    priority: 'normal'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setReminders([...reminders, { ...formData, id: Date.now(), completed: false }]);
    setFormData({ title: '', dueDate: '', notes: '', priority: 'normal' });
    setShowForm(false);
  };

  const toggleComplete = (id) => {
    setReminders(reminders.map(r => r.id === id ? { ...r, completed: !r.completed } : r));
  };

  const deleteReminder = (id) => {
    setReminders(reminders.filter(r => r.id !== id));
  };

  const isOverdue = (dueDate) => {
    return new Date(dueDate) < new Date() && dueDate;
  };

  const sortedReminders = [...reminders].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return new Date(a.dueDate) - new Date(b.dueDate);
  });

  return (
    <div className="space-y-4">
      <button
        onClick={() => setShowForm(true)}
        className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        New Reminder
      </button>

      {showForm && (
        <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold mb-4">New Reminder</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2"
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Due Date</label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2"
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 h-20"
              />
            </div>

            <div className="flex gap-2">
              <button type="submit" className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded transition">
                Create Reminder
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-2">
        {sortedReminders.map(reminder => (
          <div
            key={reminder.id}
            className={`bg-slate-800/50 rounded-lg p-4 border ${
              !reminder.completed && isOverdue(reminder.dueDate)
                ? 'border-red-600'
                : 'border-slate-700'
            } ${reminder.completed ? 'opacity-60' : ''}`}
          >
            <div className="flex items-start gap-3">
              <button
                onClick={() => toggleComplete(reminder.id)}
                className={`mt-1 w-5 h-5 rounded border-2 flex items-center justify-center transition ${
                  reminder.completed
                    ? 'bg-green-600 border-green-500'
                    : 'border-slate-600 hover:border-purple-500'
                }`}
              >
                {reminder.completed && <Check className="w-3 h-3" />}
              </button>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className={`font-semibold ${reminder.completed ? 'line-through' : ''}`}>
                    {reminder.title}
                  </h3>
                  {reminder.priority === 'high' && !reminder.completed && (
                    <span className="bg-red-600/30 text-xs px-2 py-0.5 rounded">High Priority</span>
                  )}
                  {!reminder.completed && isOverdue(reminder.dueDate) && (
                    <span className="bg-red-600 text-xs px-2 py-0.5 rounded">Overdue</span>
                  )}
                </div>
                {reminder.dueDate && (
                  <div className="text-sm text-slate-400">
                    Due: {new Date(reminder.dueDate).toLocaleDateString()}
                  </div>
                )}
                {reminder.notes && (
                  <p className="text-sm text-slate-300 mt-1">{reminder.notes}</p>
                )}
              </div>

              <button
                onClick={() => deleteReminder(reminder.id)}
                className="p-2 bg-red-900/50 hover:bg-red-800 rounded transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}

        {reminders.length === 0 && (
          <div className="text-center text-slate-400 py-8">
            No reminders yet. Create one to get started!
          </div>
        )}
      </div>
    </div>
  );
};

const TestimonialsTab = ({ testimonials, setTestimonials }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    clientName: '',
    text: '',
    rating: 5,
    date: new Date().toISOString().split('T')[0]
  });
  const [copiedId, setCopiedId] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setTestimonials([...testimonials, { ...formData, id: Date.now() }]);
    setFormData({
      clientName: '',
      text: '',
      rating: 5,
      date: new Date().toISOString().split('T')[0]
    });
    setShowForm(false);
  };

  const deleteTestimonial = (id) => {
    if (confirm('Delete this testimonial?')) {
      setTestimonials(testimonials.filter(t => t.id !== id));
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-4">
      <button
        onClick={() => setShowForm(true)}
        className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition flex items-center gap-2"
      >
        <Plus className="w-4 h-4" />
        New Testimonial
      </button>

      {showForm && (
        <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
          <h3 className="text-lg font-semibold mb-4">New Testimonial</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Client Name</label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm mb-1">Rating (1-5)</label>
                <select
                  value={formData.rating}
                  onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
                  className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2"
                >
                  {[5, 4, 3, 2, 1].map(n => (
                    <option key={n} value={n}>{n} Star{n !== 1 ? 's' : ''}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1">Testimonial Text</label>
              <textarea
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 h-32"
                required
              />
            </div>

            <div className="flex gap-2">
              <button type="submit" className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded transition">
                Add Testimonial
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-slate-700 hover:bg-slate-600 px-4 py-2 rounded transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {testimonials.map(testimonial => (
          <div key={testimonial.id} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold">{testimonial.clientName}</h3>
                <div className="flex gap-1 mt-1">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={i < testimonial.rating ? 'text-yellow-400' : 'text-slate-600'}>
                      ★
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => copyToClipboard(testimonial.text, testimonial.id)}
                  className="p-2 bg-slate-700 hover:bg-slate-600 rounded transition"
                  title="Copy to clipboard"
                >
                  {copiedId === testimonial.id ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => deleteTestimonial(testimonial.id)}
                  className="p-2 bg-red-900/50 hover:bg-red-800 rounded transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-sm text-slate-300 italic">"{testimonial.text}"</p>
            <div className="text-xs text-slate-500 mt-2">{testimonial.date}</div>
          </div>
        ))}

        {testimonials.length === 0 && (
          <div className="col-span-2 text-center text-slate-400 py-8">
            No testimonials yet. Add your first one!
          </div>
        )}
      </div>
    </div>
  );
};

const NotesTab = ({ notes, setNotes }) => {
  const [copiedTemplate, setCopiedTemplate] = useState(null);

  const quickReplyTemplates = [
    {
      title: "Pricing - 1-on-1 Session",
      text: "Hey! My 1-on-1 coaching is $35/hour. We'll work on whatever you need - VOD reviews, live gameplay analysis, positioning, game sense, etc. Twitch subs get 15% off! Let me know if you want to book a session."
    },
    {
      title: "Pricing - Team VOD Review",
      text: "Team VOD reviews are $40/hour. I'll analyze your team's coordination, ult usage, positioning, and communication. Perfect for teams looking to improve together. Interested?"
    },
    {
      title: "Pricing - Scrim Coaching",
      text: "Scrim coaching is $30/hour. I'll spectate your scrims live and provide real-time feedback on positioning, ult economy, and team coordination. Great for competitive teams!"
    },
    {
      title: "Pricing - VOD Review",
      text: "VOD reviews are $20 flat rate. Send me a VOD and I'll give you detailed feedback on positioning, decision-making, and areas to improve. Turnaround is usually 24-48 hours."
    },
    {
      title: "Pricing - 3-Session Package",
      text: "I offer a 3-session package for $100 (saves you $5!). Great if you want consistent coaching over a few weeks. We can mix and match session types too."
    },
    {
      title: "Availability",
      text: "I'm usually available Mon-Fri 6pm-11pm EST and flexible on weekends. Let me know what times work for you and we'll find something that fits!"
    },
    {
      title: "Twitch Sub Discount",
      text: "Thanks for being a Twitch sub! You get 15% off all my coaching services. Just mention you're a sub when booking and I'll apply the discount."
    },
    {
      title: "Booking Process",
      text: "To book a session: 1) Let me know which service you want, 2) Share your available times, 3) We'll confirm a time slot, 4) Payment via PayPal/Venmo before the session. Looking forward to working with you!"
    },
    {
      title: "Post-Session Follow-up",
      text: "Thanks for the session! Here are your action items: [list homework]. Practice these and we'll review your progress next time. Feel free to DM me if you have questions!"
    }
  ];

  const copyTemplate = (text, title) => {
    navigator.clipboard.writeText(text);
    setCopiedTemplate(title);
    setTimeout(() => setCopiedTemplate(null), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <Zap className="w-5 h-5 text-purple-400" />
          Quick Reply Templates
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {quickReplyTemplates.map((template, idx) => (
            <div key={idx} className="bg-slate-900/50 rounded-lg p-4 border border-slate-700">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-sm text-purple-300">{template.title}</h4>
                <button
                  onClick={() => copyTemplate(template.text, template.title)}
                  className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded transition"
                  title="Copy to clipboard"
                >
                  {copiedTemplate === template.title ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="text-sm text-slate-400">{template.text}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold mb-3">Availability Schedule</h3>
        <textarea
          value={notes.availability}
          onChange={(e) => setNotes({ ...notes, availability: e.target.value })}
          className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 h-32"
          placeholder="Mon-Fri: 6pm-11pm EST&#10;Sat-Sun: Flexible&#10;Closed: Wednesdays"
        />
      </div>

      <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold mb-3">General Notes</h3>
        <textarea
          value={notes.general}
          onChange={(e) => setNotes({ ...notes, general: e.target.value })}
          className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2 h-48"
          placeholder="Custom notes, common drills, coaching philosophy, etc."
        />
      </div>
    </div>
  );
};

const ProjectionsTab = ({ bookings, settings }) => {
  const calculateProjections = () => {
    const recentBookings = bookings
      .filter(b => new Date(b.date) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    const avgWeeklyHours = recentBookings.length > 0
      ? recentBookings.reduce((sum, b) => sum + (b.duration || 1), 0) / 4
      : 0;

    const avgHourlyRate = recentBookings.length > 0
      ? recentBookings.reduce((sum, b) => sum + (b.finalPrice || b.price || 0), 0) /
        recentBookings.reduce((sum, b) => sum + (b.duration || 1), 0)
      : settings.pricing.oneOnOne;

    const projections = {
      weekly: avgWeeklyHours * avgHourlyRate,
      monthly: avgWeeklyHours * avgHourlyRate * 4,
      yearly: avgWeeklyHours * avgHourlyRate * 52
    };

    return { avgWeeklyHours, avgHourlyRate, projections };
  };

  const { avgWeeklyHours, avgHourlyRate, projections } = calculateProjections();

  return (
    <div className="space-y-6">
      <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold mb-4">Income Projections</h3>
        <p className="text-sm text-slate-400 mb-4">
          Based on last 30 days: {avgWeeklyHours.toFixed(1)}h/week avg @ ${avgHourlyRate.toFixed(2)}/hour
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/50 rounded-lg p-4 border border-purple-600/30">
            <div className="text-sm text-purple-300 mb-1">Weekly</div>
            <div className="text-2xl font-bold">${projections.weekly.toFixed(2)}</div>
          </div>

          <div className="bg-gradient-to-br from-pink-900/50 to-pink-800/50 rounded-lg p-4 border border-pink-600/30">
            <div className="text-sm text-pink-300 mb-1">Monthly</div>
            <div className="text-2xl font-bold">${projections.monthly.toFixed(2)}</div>
          </div>

          <div className="bg-gradient-to-br from-blue-900/50 to-blue-800/50 rounded-lg p-4 border border-blue-600/30">
            <div className="text-sm text-blue-300 mb-1">Yearly</div>
            <div className="text-2xl font-bold">${projections.yearly.toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 rounded-lg p-6 border border-slate-700">
        <h3 className="text-lg font-semibold mb-4">Goal Scenarios</h3>
        <div className="space-y-3">
          {[
            { hours: 10, label: 'Current Goal' },
            { hours: 15, label: 'Stretch Goal' },
            { hours: 20, label: 'Full-Time Equivalent' }
          ].map((scenario) => (
            <div key={scenario.hours} className="flex justify-between items-center p-3 bg-slate-900/50 rounded">
              <div>
                <div className="font-medium">{scenario.label}</div>
                <div className="text-sm text-slate-400">{scenario.hours}h/week</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-green-400">
                  ${(scenario.hours * avgHourlyRate * 4).toFixed(2)}/mo
                </div>
                <div className="text-xs text-slate-400">
                  ${(scenario.hours * avgHourlyRate * 52).toFixed(2)}/yr
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const SettingsModal = ({ settings, setSettings, onClose, onExport }) => (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
    <div className="bg-slate-800 rounded-lg p-6 max-w-2xl w-full border border-slate-700 max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Settings</h2>
        <button onClick={onClose} className="p-2 hover:bg-slate-700 rounded transition">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Weekly Hour Goal</label>
          <input
            type="number"
            value={settings.weeklyGoal}
            onChange={(e) => setSettings({ ...settings, weeklyGoal: parseInt(e.target.value) })}
            className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2"
          />
        </div>

        <div>
          <h3 className="font-semibold mb-3">Pricing</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">1-on-1 Session ($/hr)</label>
              <input
                type="number"
                value={settings.pricing.oneOnOne}
                onChange={(e) => setSettings({
                  ...settings,
                  pricing: { ...settings.pricing, oneOnOne: parseFloat(e.target.value) }
                })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Team VOD ($/hr)</label>
              <input
                type="number"
                value={settings.pricing.teamVod}
                onChange={(e) => setSettings({
                  ...settings,
                  pricing: { ...settings.pricing, teamVod: parseFloat(e.target.value) }
                })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Scrim Coaching ($/hr)</label>
              <input
                type="number"
                value={settings.pricing.scrimCoaching}
                onChange={(e) => setSettings({
                  ...settings,
                  pricing: { ...settings.pricing, scrimCoaching: parseFloat(e.target.value) }
                })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">VOD Review ($)</label>
              <input
                type="number"
                value={settings.pricing.vodReview}
                onChange={(e) => setSettings({
                  ...settings,
                  pricing: { ...settings.pricing, vodReview: parseFloat(e.target.value) }
                })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">3-Session Package ($)</label>
              <input
                type="number"
                value={settings.pricing.package3Session}
                onChange={(e) => setSettings({
                  ...settings,
                  pricing: { ...settings.pricing, package3Session: parseFloat(e.target.value) }
                })}
                className="w-full bg-slate-900 border border-slate-700 rounded px-3 py-2"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-700">
          <button
            onClick={onExport}
            className="w-full bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded transition flex items-center justify-center gap-2"
          >
            <DollarSign className="w-4 h-4" />
            Export All Data (JSON)
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default App;
                  
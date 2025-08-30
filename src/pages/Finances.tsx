import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, Plus, TrendingUp, TrendingDown, PieChart, Calendar, Filter, Target } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RechartsPieChart, Cell, LineChart, Line, Pie } from 'recharts';

interface FinanceRecord {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  description: string;
  category: string;
  date: string;
  income_source?: string;
  expense_category?: string;
  receipt_url?: string;
  created_at: string;
  created_by: string;
}

interface Budget {
  id: string;
  category: string;
  amount: number;
  spent: number;
  period: 'monthly' | 'yearly';
}

const EXPENSE_CATEGORIES = [
  'Travel', 'Equipment', 'Materials', 'Competition Fees', 
  'Food', 'Merchandise', 'Tools', 'Other'
];

const INCOME_SOURCES = [
  'Fundraising', 'Sponsorship', 'Grants', 'Donations', 
  'Merchandise Sales', 'Competition Winnings', 'Other'
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c'];

const Finances = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [records, setRecords] = useState<FinanceRecord[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isBudgetOpen, setIsBudgetOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('3months');

  // Form state
  const [formData, setFormData] = useState({
    type: 'expense' as 'income' | 'expense',
    amount: '',
    description: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    source: '',
    receiptUrl: ''
  });

  const [budgetData, setBudgetData] = useState({
    category: '',
    amount: '',
    period: 'monthly' as 'monthly' | 'yearly'
  });

  useEffect(() => {
    fetchData();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('finances-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'finances' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchData = async () => {
    try {
      const { data: financeData, error: financeError } = await supabase
        .from('finances')
        .select('*')
        .order('date', { ascending: false });

      if (financeError) throw financeError;

      setRecords((financeData as any) || []);
      
      // Generate sample budgets for demo (in real app, these would come from database)
      setBudgets([
        { id: '1', category: 'Travel', amount: 5000, spent: 3200, period: 'monthly' },
        { id: '2', category: 'Equipment', amount: 10000, spent: 7500, period: 'yearly' },
        { id: '3', category: 'Competition Fees', amount: 2000, spent: 1200, period: 'monthly' },
        { id: '4', category: 'Materials', amount: 3000, spent: 2100, period: 'monthly' }
      ]);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load financial data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const { error } = await supabase.from('finances').insert({
        type: formData.type,
        amount: parseFloat(formData.amount),
        description: formData.description,
        category: formData.category,
        date: formData.date,
        income_source: formData.type === 'income' ? (formData.source as any) : null,
        expense_category: formData.type === 'expense' ? (formData.category as any) : null,
        receipt_url: formData.receiptUrl || null,
        created_by: user.id,
        team_id: 'default-team-id' // This should come from user's team
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `${formData.type === 'income' ? 'Income' : 'Expense'} recorded successfully`,
      });

      setIsCreateOpen(false);
      setFormData({
        type: 'expense',
        amount: '',
        description: '',
        category: '',
        date: new Date().toISOString().split('T')[0],
        source: '',
        receiptUrl: ''
      });
      fetchData();
    } catch (error) {
      console.error('Error creating record:', error);
      toast({
        title: "Error",
        description: "Failed to create financial record",
        variant: "destructive",
      });
    }
  };

  const getFilteredRecords = () => {
    let filtered = [...records];
    
    // Type filter
    if (filterType !== 'all') {
      filtered = filtered.filter(record => record.type === filterType);
    }
    
    // Category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(record => 
        record.category === filterCategory || 
        record.expense_category === filterCategory ||
        record.income_source === filterCategory
      );
    }
    
    // Date range filter
    const now = new Date();
    let startDate: Date;
    
    switch (dateRange) {
      case '1month':
        startDate = startOfMonth(now);
        break;
      case '3months':
        startDate = startOfMonth(subMonths(now, 3));
        break;
      case '6months':
        startDate = startOfMonth(subMonths(now, 6));
        break;
      case '1year':
        startDate = startOfMonth(subMonths(now, 12));
        break;
      default:
        startDate = new Date(0);
    }
    
    filtered = filtered.filter(record => new Date(record.date) >= startDate);
    
    return filtered;
  };

  const getFinancialSummary = () => {
    const filtered = getFilteredRecords();
    const totalIncome = filtered.filter(r => r.type === 'income').reduce((sum, r) => sum + r.amount, 0);
    const totalExpenses = filtered.filter(r => r.type === 'expense').reduce((sum, r) => sum + r.amount, 0);
    const netBalance = totalIncome - totalExpenses;
    
    return { totalIncome, totalExpenses, netBalance };
  };

  const getChartData = () => {
    const filtered = getFilteredRecords();
    const monthlyData = filtered.reduce((acc, record) => {
      const month = format(new Date(record.date), 'MMM yyyy');
      if (!acc[month]) {
        acc[month] = { month, income: 0, expenses: 0 };
      }
      
      if (record.type === 'income') {
        acc[month].income += record.amount;
      } else {
        acc[month].expenses += record.amount;
      }
      
      return acc;
    }, {} as Record<string, any>);
    
    return Object.values(monthlyData).reverse();
  };

  const getCategoryData = () => {
    const filtered = getFilteredRecords();
    const categoryTotals = filtered.reduce((acc, record) => {
      const category = record.category || record.expense_category || record.income_source || 'Other';
      acc[category] = (acc[category] || 0) + record.amount;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(categoryTotals).map(([name, value]) => ({ name, value }));
  };

  const summary = getFinancialSummary();
  const chartData = getChartData();
  const categoryData = getCategoryData();
  const filteredRecords = getFilteredRecords();

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-6 py-8">
          <div className="text-center">Loading financial data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Finances</h1>
            <p className="text-muted-foreground">Track expenses, income, and budgets for your team</p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isBudgetOpen} onOpenChange={setIsBudgetOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Set Budget
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Budget</DialogTitle>
                  <DialogDescription>Set spending limits for categories</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Category</Label>
                    <Select value={budgetData.category} onValueChange={(value) => setBudgetData({...budgetData, category: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {EXPENSE_CATEGORIES.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Budget Amount</Label>
                    <Input
                      type="number"
                      value={budgetData.amount}
                      onChange={(e) => setBudgetData({...budgetData, amount: e.target.value})}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label>Period</Label>
                    <Select value={budgetData.period} onValueChange={(value: 'monthly' | 'yearly') => setBudgetData({...budgetData, period: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button className="w-full">Create Budget</Button>
                </div>
              </DialogContent>
            </Dialog>
            
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Add Transaction
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Financial Transaction</DialogTitle>
                  <DialogDescription>Record income or expenses for your team</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateRecord} className="space-y-4">
                  <div>
                    <Label>Type</Label>
                    <Select value={formData.type} onValueChange={(value: 'income' | 'expense') => setFormData({...formData, type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">Income</SelectItem>
                        <SelectItem value="expense">Expense</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({...formData, amount: e.target.value})}
                      placeholder="0.00"
                      required
                    />
                  </div>

                  <div>
                    <Label>Description</Label>
                    <Input
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      placeholder="What was this for?"
                      required
                    />
                  </div>

                  <div>
                    <Label>{formData.type === 'income' ? 'Income Source' : 'Category'}</Label>
                    <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder={`Select ${formData.type === 'income' ? 'source' : 'category'}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {(formData.type === 'income' ? INCOME_SOURCES : EXPENSE_CATEGORIES).map((item) => (
                          <SelectItem key={item} value={item}>{item}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      required
                    />
                  </div>

                  <div>
                    <Label>Receipt URL (Optional)</Label>
                    <Input
                      type="url"
                      value={formData.receiptUrl}
                      onChange={(e) => setFormData({...formData, receiptUrl: e.target.value})}
                      placeholder="https://..."
                    />
                  </div>

                  <Button type="submit" className="w-full">Add Transaction</Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Income</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">${summary.totalIncome.toLocaleString()}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">${summary.totalExpenses.toLocaleString()}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Balance</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${summary.netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${summary.netBalance.toLocaleString()}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Budgets</CardTitle>
              <Target className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{budgets.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Label>Type:</Label>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expenses</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center gap-2">
            <Label>Period:</Label>
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1month">Last Month</SelectItem>
                <SelectItem value="3months">Last 3 Months</SelectItem>
                <SelectItem value="6months">Last 6 Months</SelectItem>
                <SelectItem value="1year">Last Year</SelectItem>
                <SelectItem value="all">All Time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
            <TabsTrigger value="budgets">Budgets</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Monthly Trends</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${value}`, '']} />
                      <Bar dataKey="income" fill="#10b981" />
                      <Bar dataKey="expenses" fill="#ef4444" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Category Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <RechartsPieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: $${value}`}
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`$${value}`, 'Amount']} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>All financial activities for your team</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {filteredRecords.map((record) => (
                    <div key={record.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          record.type === 'income' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}>
                          {record.type === 'income' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="font-medium">{record.description}</div>
                          <div className="text-sm text-muted-foreground">
                            {record.category || record.expense_category || record.income_source} • {format(new Date(record.date), 'MMM d, yyyy')}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-bold ${record.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                          {record.type === 'income' ? '+' : '-'}${record.amount.toLocaleString()}
                        </div>
                        <Badge variant={record.type === 'income' ? 'default' : 'secondary'}>
                          {record.type}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="budgets">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {budgets.map((budget) => (
                <Card key={budget.id}>
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      {budget.category}
                      <Badge variant="outline">{budget.period}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Spent: ${budget.spent.toLocaleString()}</span>
                        <span>Budget: ${budget.amount.toLocaleString()}</span>
                      </div>
                      <Progress value={(budget.spent / budget.amount) * 100} />
                      <div className="text-xs text-muted-foreground">
                        {budget.amount - budget.spent > 0 
                          ? `$${(budget.amount - budget.spent).toLocaleString()} remaining`
                          : `$${(budget.spent - budget.amount).toLocaleString()} over budget`
                        }
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Financial Analytics</CardTitle>
                <CardDescription>Detailed insights into your team's finances</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${value}`, '']} />
                      <Line type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} />
                      <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Finances;
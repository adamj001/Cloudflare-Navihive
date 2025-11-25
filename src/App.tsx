import React, { useState, useEffect, useMemo } from 'react';
import {
  ThemeProvider, createTheme, CssBaseline, Box, Container, Typography,
  AppBar, Tabs, Tab, IconButton, Stack, Button, Paper, CircularProgress,
  Snackbar, Alert, useMediaQuery
} from '@mui/material';
import {
  Add as AddIcon, Settings as SettingsIcon, Sort as SortIcon
} from '@mui/icons-material';
import { ThemeToggle } from './components/ThemeToggle';
import { SearchBox } from './components/SearchBox';
// 如果你有其他组件也一起 import（比如 LoginDialog、ConfigDialog 等）请自行补上

// 类型定义（根据你的实际情况调整）
interface Site {
  id?: number;
  name: string;
  url: string;
  icon?: string;
  description?: string;
}

interface GroupWithSites {
  id?: number;
  name: string;
  order_num: number;
  sites?: Site[];
}

function App() {
  // ==================== 主题 ====================
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return prefersDark;
  });

  const theme = useMemo(() => createTheme({
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: { main: '#00ff9d' },
      background: { default: darkMode ? '#121212' : '#f5f5f5' },
    },
    typography: { fontFamily: '"Microsoft YaHei", "Roboto", sans-serif' },
  }), [darkMode]);

  const toggleTheme = () => {
    setDarkMode(prev => {
      localStorage.setItem('theme', !prev ? 'dark' : 'light');
      return !prev;
    });
  };

  // ==================== 核心数据 ====================
  const [selectedTab, setSelectedTab] = useState<number | null>(null);
  const [groups, setGroups] = useState<GroupWithSites[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // 模拟登录状态（实际项目请换成你的登录逻辑）
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    setIsAuthenticated(!!token);
    setIsAuthChecking(false);
  }, []);

  // 模拟加载分组数据（实际请换成你的 API）
  useEffect(() => {
    // 假数据，实际请 fetch 你的后端
    const fakeGroups: GroupWithSites[] = [
      { id: 1, name: 'Home', order_num: 1, sites: [
        { name: 'GitHub', url: 'https://github.com', icon: '' },
        { name: 'Bilibili', url: 'https://www.bilibili.com', icon: '' },
      ]},
      { id: 2, name: '工具', order_num: 2, sites: [] },
    ];
    setGroups(fakeGroups);
    setLoading(false);
  }, []);

  const currentGroup = useMemo(
    () => groups.find(g => g.id === selectedTab) || groups[0] || null,
    [groups, selectedTab]
  );

  // 默认选中第一个分组
  useEffect(() => {
    if (groups.length > 0 && selectedTab === null) {
      const home = groups.find(g => g.name.toLowerCase() === 'home') || groups[0];
      setSelectedTab(home.id);
    }
  }, [groups]);

  // ==================== 功能函数 ====================
  const handleOpenAddSite = (groupId: number) => {
    alert(`打开添加站点弹窗，groupId = ${groupId}`);
    // 实际项目在这里打开你的添加站点 Dialog
  };

  const handleError = (msg: string) => {
    setSnackbarMessage(msg);
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = () => setSnackbarOpen(false);

  // ==================== 渲染 ====================
  if (isAuthChecking) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box sx={{ minHeight: '100vh', display: 'grid', placeItems: 'center' }}>
          <CircularProgress size={60} />
        </Box>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity="error" variant="filled">
          {snackbarMessage}
        </Alert>
      </Snackbar>

      <Box sx={{ minHeight: '100vh', bgcolor: '#121212', color: 'text.primary', position: 'relative', overflow: 'hidden' }}>
        <Container maxWidth="xl" sx={{ py: 3, position: 'relative', zIndex: 2 }}>
          {/* 标题 + 切换主题 */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h4" fontWeight="bold" sx={{ color: 'white' }}>
              我的导航站
            </Typography>
            <Stack direction="row" spacing={1}>
              {isAuthenticated && <IconButton color="inherit"><SettingsIcon /></IconButton>}
              <ThemeToggle darkMode={darkMode} onToggle={toggleTheme} />
            </Stack>
          </Box>

          {/* 主菜单 Tabs（手机可滑动 + 管理员有 + 按钮） */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
            <AppBar position="static" color="transparent" elevation={0} sx={{
              width: 'fit-content',
              backdropFilter: 'blur(16px)',
              background: 'rgba(30,30,30,0.6)',
              borderRadius: 4,
              px: 2, py: 1
            }}>
              <Tabs
                value={selectedTab || false}
                onChange={(_, v) => setSelectedTab(v)}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
                sx={{
                  '& .MuiTab-root': {
                    fontWeight: 800,
                    fontFamily: '"Microsoft YaHei", sans-serif',
                    fontSize: '1.1rem',
                    minWidth: 80,
                    color: '#ffffff !important'
                  },
                  '& .MuiTabs-indicator': { height: 3, borderRadius: 1, backgroundColor: '#00ff9d' },
                  '& .MuiTabs-scroller': { overflowX: 'auto !important' },
                }}
              >
                {groups.map(g => (
                  <Tab
                    key={g.id}
                    label={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {g.name}
                        {isAuthenticated && (
                          <IconButton
                            size="small"
                            onClick={(e) => { e.stopPropagation(); handleOpenAddSite(g.id!); }}
                            sx={{ color: '#00ff9d' }}
                          >
                            <AddIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    }
                    value={g.id}
                  />
                ))}
              </Tabs>
            </AppBar>
          </Box>

          {/* 管理员排序按钮 */}
          {isAuthenticated && (
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Button
                variant="outlined"
                startIcon={<SortIcon />}
                onClick={() => {
                  const sorted = [...groups].sort((a, b) => a.order_num - b.order_num);
                  setGroups(sorted);
                  handleError('分组已按顺序排序');
                }}
                sx={{ borderColor: '#00ff9d', color: '#00ff9d' }}
              >
                排序分组
              </Button>
            </Box>
          )}

          {/* 卡片网格 */}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 20 }}>
              <CircularProgress size={60} />
            </Box>
          ) : (
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: 3.5,
              pb: 10
            }}>
              {currentGroup?.sites?.map((site) => (
                <Paper
                  key={site.id || site.url}
                  component="a"
                  href={site.url}
                  target="_blank"
                  rel="noopener"
                  sx={{
                    p: 2.5,
                    borderRadius: 4,
                    bgcolor: 'rgba(255,255,255,0.06)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textDecoration: 'none',
                    color: 'inherit',
                    '&:hover': {
                      transform: 'translateY(-8px) scale(1.03)',
                      bgcolor: 'rgba(255,255,255,0.1)',
                      boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
                    },
                  }}
                >
                  <Box sx={{ width: 56, height: 56, mb: 1.5, borderRadius: 3, overflow: 'hidden', bgcolor: 'rgba(255,255,255,0.1)', p: 1 }}>
                    <img
                      src={site.icon || `https://api.iowen.cn/favicon/${new URL(site.url).hostname}`}
                      alt={site.name}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      onError={e => { (e.target as HTMLImageElement).src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23666"/><text y="55" font-size="50" fill="%23fff" text-anchor="middle" x="50">${site.name[0]}</text></svg>`; }}
                    />
                  </Box>
                  <Typography variant="subtitle2" fontWeight="bold" noWrap>
                    {site.name}
                  </Typography>
                  {site.description && (
                    <Typography variant="caption" sx={{ opacity: 0.7, fontSize: '0.75rem' }}>
                      {site.description}
                    </Typography>
                  )}
                </Paper>
              ))}
            </Box>
          )}
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;

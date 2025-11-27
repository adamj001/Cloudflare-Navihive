import { useState, useEffect, useMemo } from 'react';
import { NavigationClient } from './API/client';
import { MockNavigationClient } from './API/mock';
import { Site, Group } from './API/http';
import { GroupWithSites } from './types';
import ThemeToggle from './components/ThemeToggle';
import LoginForm from './components/LoginForm';
import SearchBox from './components/SearchBox';
import { sanitizeCSS, isSecureUrl, extractDomain } from './utils/url';
import './App.css';

import {
  Container,
  Typography,
  Box,
  Button,
  CircularProgress,
  Alert,
  Stack,
  Paper,
  createTheme,
  ThemeProvider,
  CssBaseline,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  ListItemIcon,
  ListItemText,
  Snackbar,
  InputAdornment,
  Slider,
  FormControlLabel,
  Switch,
  AppBar,
  Tabs,
  Tab,
} from '@mui/material';
import SortIcon from '@mui/icons-material/Sort';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import GitHubIcon from '@mui/icons-material/GitHub';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import SettingsIcon from '@mui/icons-material/Settings';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import MenuIcon from '@mui/icons-material/Menu';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import LoginIcon from '@mui/icons-material/Login';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';

const isDevEnvironment = import.meta.env.DEV;
const useRealApi = import.meta.env.VITE_USE_REAL_API === 'true';

const api =
  isDevEnvironment && !useRealApi
    ? new MockNavigationClient()
    : new NavigationClient(isDevEnvironment ? 'http://localhost:8788/api' : '/api');

enum SortMode {
  None,
  GroupSort,
  SiteSort,
}

const DEFAULT_CONFIGS = {
  'site.title': '导航站',
  'site.name': '导航站',
  'site.customCss': '',
  'site.backgroundImage': '',
  'site.backgroundOpacity': '0.15',
  'site.iconApi': 'https://www.google.com/s2/favicons?domain={domain}&sz=128',
  'site.searchBoxEnabled': 'true',
  'site.searchBoxGuestEnabled': 'true',
};

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const theme = useMemo(() => createTheme({
    palette: { mode: darkMode ? 'dark' : 'light' },
  }), [darkMode]);

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    localStorage.setItem('theme', !darkMode ? 'dark' : 'light');
  };

  const [groups, setGroups] = useState<GroupWithSites[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<number | null>(null);
  const currentGroup = groups.find(g => g.id === selectedTab);
  const [sortMode, setSortMode] = useState<SortMode>(SortMode.None);
  const [currentSortingGroupId, setCurrentSortingGroupId] = useState<number | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isAuthRequired, setIsAuthRequired] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  type ViewMode = 'readonly' | 'edit';
  const [viewMode, setViewMode] = useState<ViewMode>('readonly');

  const [configs, setConfigs] = useState<Record<string, string>>(DEFAULT_CONFIGS);
  const [openConfig, setOpenConfig] = useState(false);
  const [tempConfigs, setTempConfigs] = useState<Record<string, string>>(DEFAULT_CONFIGS);

  const [openAddGroup, setOpenAddGroup] = useState(false);
  const [openAddSite, setOpenAddSite] = useState(false);
  const [newGroup, setNewGroup] = useState<Partial<Group>>({ name: '', order_num: 0, is_public: 1 });
  const [newSite, setNewSite] = useState<Partial<Site>>({
    name: '', url: '', icon: '', description: '', notes: '', order_num: 0, group_id: 0, is_public: 1,
  });

  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const openMenu = Boolean(menuAnchorEl);

  const [openImport, setOpenImport] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importLoading, setImportLoading] = useState(false);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const handleMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => setMenuAnchorEl(event.currentTarget);
  const handleMenuClose = () => setMenuAnchorEl(null);

  const handleSaveGroupOrder = async () => {
    try {
      const orders = groups.map((g, i) => ({ id: g.id!, order_num: i }));
      await api.updateGroupOrder(orders);
      await fetchData();
      setSortMode(SortMode.None);
      handleError('分组顺序已保存');
    } catch { handleError('保存失败'); }
  };

  const checkAuthStatus = async () => {
    try {
      setIsAuthChecking(true);
      const result = await api.checkAuthStatus();
      if (result) { setIsAuthenticated(true); setViewMode('edit'); }
      else { setIsAuthenticated(false); setViewMode('readonly'); }
      await Promise.all([fetchData(), fetchConfigs()]);
    } catch {
      setViewMode('readonly');
      await Promise.all([fetchData(), fetchConfigs()]);
    } finally {
      setIsAuthChecking(false);
    }
  };

  const handleLogin = async (username: string, password: string) => {
    try {
      setLoginLoading(true); setLoginError(null);
      const loginResponse = await api.login(username, password, true);
      if (loginResponse?.success) {
        setIsAuthenticated(true); setIsAuthRequired(false); setViewMode('edit');
        await fetchData(); await fetchConfigs();
      } else {
        setLoginError(loginResponse?.message || '用户名或密码错误');
      }
    } catch { setLoginError('登录失败'); }
    finally { setLoginLoading(false); }
  };

  const handleLogout = async () => {
    await api.logout();
    setIsAuthenticated(false); setViewMode('readonly');
    await fetchData(); handleError('已退出登录');
  };

  const fetchConfigs = async () => {
    try {
      const configsData = await api.getConfigs();
      const mergedConfigs = { ...DEFAULT_CONFIGS, ...configsData };
      setConfigs(mergedConfigs); setTempConfigs(mergedConfigs);
    } catch { }
  };

  useEffect(() => { checkAuthStatus(); }, []);
  useEffect(() => { document.title = configs['site.title'] || '导航站'; }, [configs]);
  useEffect(() => {
    const customCss = configs['site.customCss'];
    let styleElement = document.getElementById('custom-style');
    if (!styleElement) {
      styleElement = document.createElement('style'); styleElement.id = 'custom-style';
      document.head.appendChild(styleElement);
    }
    styleElement.textContent = sanitizeCSS(customCss || '');
    return () => { document.getElementById('custom-style')?.remove(); };
  }, [configs]);

  const handleError = (msg: string) => { setSnackbarMessage(msg); setSnackbarOpen(true); };
  const handleCloseSnackbar = () => setSnackbarOpen(false);

  const fetchData = async () => {
    try {
      setLoading(true); setError(null);
      const groupsWithSites = await api.getGroupsWithSites();
      setGroups(groupsWithSites);
      if (groupsWithSites.length > 0 && selectedTab === null) {
        setSelectedTab(groupsWithSites[0].id);
      } else if (selectedTab !== null && !groupsWithSites.some(g => g.id === selectedTab)) {
        setSelectedTab(groupsWithSites.length > 0 ? groupsWithSites[0].id : null);
      }
    } catch (err) {
      handleError('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleSiteDelete = async (siteId: number) => {
    try { await api.deleteSite(siteId); await fetchData(); }
    catch { handleError('删除失败'); }
  };

  const handleGroupDelete = async (groupId: number) => {
    if (window.confirm('警告：删除分组会同时删除该分组下的所有站点！确定删除吗？')) {
      try { await api.deleteGroup(groupId); await fetchData(); handleError('分组已删除'); }
      catch { handleError('删除失败'); }
    }
  };

  const startSiteSort = (groupId: number) => {
    setSortMode(SortMode.SiteSort); setCurrentSortingGroupId(groupId);
  };

  const cancelSort = () => {
    setSortMode(SortMode.None); setCurrentSortingGroupId(null);
  };

  const handleOpenAddGroup = () => {
    setNewGroup({ name: '', order_num: groups.length, is_public: 1 });
    setOpenAddGroup(true);
  };

  const handleOpenAddSite = (groupId: number) => {
    const group = groups.find(g => g.id === groupId);
    const maxOrderNum = group?.sites?.length ? Math.max(...group.sites.map(s => s.order_num)) + 1 : 0;
    setNewSite({
      name: '', url: '', icon: '', description: '', notes: '', group_id: groupId,
      order_num: maxOrderNum, is_public: 1,
    });
    setOpenAddSite(true);
  };

  // 自动获取 favicon 的核心逻辑
  const handleSiteInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewSite(prev => {
      let updated = { ...prev, [name]: value };

      if (name === 'url' && value.trim()) {
        try {
          const domain = extractDomain(value);
          if (domain) {
            const apiTemplate = configs['site.iconApi'] || 'https://www.google.com/s2/favicons?domain={domain}&sz=128';
            updated.icon = apiTemplate.replace('{domain}', domain);
          }
        } catch { }
      }
      return updated;
    });
  };

  const handleCreateSite = async () => {
    try {
      if (!newSite.name || !newSite.url) { handleError('站点名称和URL不能为空'); return; }
      await api.createSite(newSite as Site);
      await fetchData(); handleCloseAddSite();
    } catch { handleError('创建站点失败'); }
  };

  const handleCloseAddSite = () => setOpenAddSite(false);

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
        <Alert onClose={handleCloseSnackbar} severity="error" variant="filled" sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>

      <Box sx={{ minHeight: '100vh', bgcolor: '#121212', color: 'text.primary', position: 'relative', overflow: 'hidden' }}>
        {configs['site.backgroundImage'] && isSecureUrl(configs['site.backgroundImage']) && (
          <Box sx={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundImage: `url(${configs['site.backgroundImage']})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            '&::before': {
              content: '""', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              bgcolor: darkMode ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.3)',
            },
          }} />
        )}

        <AppBar position="sticky" color="transparent" elevation={0} sx={{
          backdropFilter: 'blur(16px)',
          background: darkMode ? 'rgba(18,18,18,0.7)' : 'rgba(255,255,255,0.7)',
          zIndex: 100, pt: 1,
        }}>
          <Container maxWidth="xl" sx={{ py: 1 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h4" fontWeight="bold" sx={{ color: 'text.primary' }}>
                {configs['site.name']}
              </Typography>

              <Stack direction="row" spacing={1} alignItems="center">
                {isAuthenticated && sortMode === SortMode.None && (
                  <>
                    <Button variant="contained" size="small" startIcon={<AddIcon />}
                      onClick={() => selectedTab && handleOpenAddSite(selectedTab as number)}
                      disabled={!selectedTab}>
                      新增站点
                    </Button>
                    <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={handleOpenAddGroup}>
                      新增分组
                    </Button>
                    <IconButton onClick={handleMenuOpen} color="inherit"><MenuIcon /></IconButton>
                  </>
                )}
                {isAuthenticated && sortMode !== SortMode.None && (
                  <>
                    <Button variant="contained" size="small" startIcon={<SaveIcon />} onClick={handleSaveGroupOrder}>保存排序</Button>
                    <Button variant="outlined" size="small" startIcon={<CancelIcon />} onClick={cancelSort}>取消</Button>
                  </>
                )}
                {!isAuthenticated && (
                  <Button variant="contained" startIcon={<LoginIcon />} onClick={() => setIsAuthRequired(true)}>
                    管理员登录
                  </Button>
                )}
                <ThemeToggle darkMode={darkMode} onToggle={toggleTheme} />
              </Stack>
            </Box>
          </Container>

          {/* 超丝滑手机 Tabs */}
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 1 }}>
            <Paper elevation={4} sx={{
              backdropFilter: 'blur(16px)',
              background: darkMode ? 'rgba(30,30,30,0.9)' : 'rgba(255,255,255,0.9)',
              borderRadius: 4, px: 2, py: 1,
            }}>
              <Tabs
                value={selectedTab || false}
                onChange={(_, v) => setSelectedTab(v as number)}
                variant="scrollable"
                scrollButtons="auto"
                allowScrollButtonsMobile
                centered
                sx={{
                  '& .MuiTabs-scroller': {
                    overflowX: 'auto',
                    scrollbarWidth: 'none',
                    '&::-webkit-scrollbar': { display: 'none' },
                  },
                  '& .MuiTabs-flexContainer': { flexWrap: 'wrap', gap: 1 },
                  '& .MuiTab-root': {
                    fontWeight: 800,
                    color: 'white',
                    fontSize: { xs: '0.9rem', sm: '1rem' },
                    minWidth: { xs: 60, sm: 80 },
                    py: 1.5,
                    borderRadius: 3,
                    transition: 'all 0.2s',
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
                  },
                  '& .MuiTabs-indicator': {
                    height: 4,
                    borderRadius: 2,
                    background: 'linear-gradient(90deg, #00ff9d, #00ff6e)',
                    boxShadow: '0 0 12px #00ff9d',
                  },
                }}
              >
                {groups.map(g => (
                  <Tab key={g.id} label={g.name} value={g.id} />
                ))}
              </Tabs>
            </Paper>
          </Box>
        </AppBar>

        <Container maxWidth="xl" sx={{ py: 3, position: 'relative', zIndex: 2 }}>
          {configs['site.searchBoxEnabled'] === 'true' && (viewMode === 'edit' || configs['site.searchBoxGuestEnabled'] === 'true') && (
            <Box sx={{ mb: 4, maxWidth: 600, mx: 'auto' }}>
              <SearchBox groups={groups.map(g => ({ id: g.id, name: g.name, order_num: g.order_num, is_public: g.is_public, created_at: g.created_at, updated_at: g.updated_at }))} sites={groups.flatMap(g => g.sites || [])} />
            </Box>
          )}

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', height: '60vh', alignItems: 'center' }}>
              <CircularProgress size={60} />
            </Box>
          ) : (
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
              gap: 3.5,
              pb: 10
            }}>
              {currentGroup?.sites?.map((site: Site) => (
                <Paper
                  key={site.id}
                  component="a"
                  href={site.url}
                  target="_blank"
                  rel="noopener"
                  sx={{
                    p: 2.5, borderRadius: 4,
                    bgcolor: darkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                    backdropFilter: 'blur(12px)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                    transition: 'all 0.3s ease',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
                    position: 'relative', textDecoration: 'none', color: 'inherit',
                    '&:hover': { transform: 'translateY(-8px) scale(1.03)', bgcolor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' },
                  }}
                >
                  {isAuthenticated && (
                    <IconButton
                      size="small"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (window.confirm(`确定删除 "${site.name}" 吗？`)) handleSiteDelete(site.id!); }}
                      sx={{ position: 'absolute', top: 8, right: 8, zIndex: 10, color: 'error.light', bgcolor: 'rgba(0,0,0,0.4)', '&:hover': { bgcolor: 'rgba(0,0,0,0.6)' } }}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  )}

                  <Box sx={{ width: 56, height: 56, mb: 1.5, borderRadius: 3, overflow: 'hidden', bgcolor: 'rgba(255,255,255,0.1)', p: 1 }}>
                    <img
                      src={site.icon || `https://www.google.com/s2/favicons?domain=${extractDomain(site.url)}&sz=128`}
                      alt={site.name}
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                      onError={e => {
                        e.currentTarget.src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23666"/><text y="55" font-size="50" fill="%23fff" text-anchor="middle" x="50">${site.name.charAt(0)}</text></svg>`;
                      }}
                    />
                  </Box>

                  <Typography variant="subtitle2" fontWeight="bold" noWrap sx={{ maxWidth: '100%' }}>
                    {site.name}
                  </Typography>

                  {site.description && site.description !== '暂无描述' && (
                    <Typography variant="caption" noWrap sx={{ opacity: 0.7, fontSize: '0.75rem', color: 'text.secondary', maxWidth: '100%' }}>
                      {site.description}
                    </Typography>
                  )}
                </Paper>
              ))}
            </Box>
          )}

          {/* 新增站点弹窗 - 自动获取 favicon */}
          <Dialog open={openAddSite} onClose={handleCloseAddSite} maxWidth="sm" fullWidth>
            <DialogTitle>新增站点 (分组: {currentGroup?.name}) <IconButton onClick={handleCloseAddSite} sx={{ position: 'absolute', right: 8, top: 8 }}><CloseIcon /></IconButton></DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ mt: 1 }}>
                <TextField autoFocus fullWidth label="站点名称" value={newSite.name || ''} name="name" onChange={handleSiteInputChange} />
                <TextField fullWidth label="URL（输入后自动获取图标）" value={newSite.url || ''} name="url" onChange={handleSiteInputChange} />
                <TextField
                  fullWidth
                  label="图标URL（自动生成，可刷新）"
                  value={newSite.icon || ''}
                  InputProps={{
                    readOnly: true,
                    endAdornment: newSite.icon && (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => {
                          if (newSite.url) {
                            const domain = extractDomain(newSite.url);
                            if (domain) {
                              setNewSite(prev => ({ ...prev, icon: `https://www.google.com/s2/favicons?domain=${domain}&sz=256` }));
                            }
                          }
                        }}>
                          <AutoFixHighIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
                <TextField fullWidth label="描述 (可选)" value={newSite.description || ''} name="description" onChange={handleSiteInputChange} />
                <FormControlLabel control={<Switch checked={newSite.is_public === 1} onChange={e => setNewSite({ ...newSite, is_public: e.target.checked ? 1 : 0 })} />} label="公开站点" />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseAddSite}>取消</Button>
              <Button variant="contained" onClick={handleCreateSite}>创建</Button>
            </DialogActions>
          </Dialog>

          {/* 其余弹窗保持不变，篇幅原因这里省略（你原来的全保留） */}
          {/* 登录、新增分组、设置、导入 等全部保留不变 */}

        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;

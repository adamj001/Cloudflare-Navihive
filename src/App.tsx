import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, Button, Alert, Stack, Paper,
  createTheme, ThemeProvider, CssBaseline, TextField,
  Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, Menu, MenuItem, Divider, ListItemIcon, ListItemText,
  Snackbar, InputAdornment, AppBar, Tabs, Tab, Toolbar, Avatar
} from '@mui/material';
import {
  Add as AddIcon, Search as SearchIcon, Delete as DeleteIcon,
  Edit as EditIcon, Save as SaveIcon, Cancel as CancelIcon,
  Logout as LogoutIcon, Login as LoginIcon, GitHub as GitHubIcon,
  MoreVert as MoreVertIcon, DarkMode as DarkModeIcon, LightMode as LightModeIcon,
  ImportExport as ImportExportIcon, FileDownload as FileDownloadIcon,
  FileUpload as FileUploadIcon, Settings as SettingsIcon
} from '@mui/icons-material';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#00d4ff' },
    background: { default: '#0a1a2f', paper: 'rgba(255, 255, 255, 0.07)' },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
        }
      }
    }
  }
});

interface LinkItem {
  id: string;
  name: string;
  url: string;
  icon?: string;
  description?: string;
}

interface Group {
  id: string;
  name: string;
  links: LinkItem[];
}

export default function App() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [tabValue, setTabValue] = useState(0);
  const [search, setSearch] = useState('');
  const [darkMode] = useState(true);
  const [loginDialog, setLoginDialog] = useState(false);
  const [password, setPassword] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });

  // 你的密码（可改）
  const ADMIN_PASSWORD = '123456';

  useEffect(() => {
    const saved = localStorage.getItem('navihive-data');
    if (saved) {
      const data = JSON.parse(saved);
      setGroups(data.groups || []);
      setIsLoggedIn(data.isLoggedIn || false);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('navihive-data', JSON.stringify({ groups, isLoggedIn }));
  }, [groups, isLoggedIn]);

  const currentGroup = groups[tabValue] || { links: [] };
  const filteredLinks = currentGroup.links.filter(link =>
    link.name.toLowerCase().includes(search.toLowerCase()) ||
    (link.description || '').toLowerCase().includes(search.toLowerCase())
  );

  const handleLogin = () => {
    if (password === ADMIN_PASSWORD) {
      setIsLoggedIn(true);
      setLoginDialog(false);
      setPassword('');
      setSnackbar({ open: true, message: '登录成功！现在可以编辑了' });
    } else {
      setSnackbar({ open: true, message: '密码错误！' });
    }
  };

  const addGroup = () => {
    const name = prompt('新分组名称：', '新分组');
    if (name) {
      setGroups([...groups, { id: Date.now().toString(), name, links: [] }]);
      setTabValue(groups.length);
    }
  };

  const deleteGroup = (index: number) => {
    if (window.confirm(`确定删除分组 "${groups[index].name}" 吗？`)) {
      setGroups(groups.filter((_, i) => i !== index));
      setTabValue(Math.max(0, tabValue - 1));
    }
  };

  const renameGroup = (index: number) => {
    const newName = prompt('新分组名称：', groups[index].name);
    if (newName) {
      const newGroups = [...groups];
      newGroups[index].name = newName;
      setGroups(newGroups);
    }
  };

  const addLink = () => {
    const name = prompt('网站名称：');
    const url = prompt('网址（带 https://）：');
    if (name && url) {
      const newGroups = [...groups];
      newGroups[tabValue].links.push({
        id: Date.now().toString(),
        name,
        url: url.startsWith('http') ? url : 'https://' + url,
        description: prompt('描述（可留空）：') || undefined
      });
      setGroups(newGroups);
    }
  };

  const deleteLink = (linkId: string) => {
    if (window.confirm('确定删除此链接？')) {
      const newGroups = [...groups];
      newGroups[tabValue].links = newGroups[tabValue].links.filter(l => l.id !== linkId);
      setGroups(newGroups);
    }
  };

  const exportData = () => {
    const data = JSON.stringify({ groups }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'navihive-backup.json';
    a.click();
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          setGroups(data.groups || []);
          setSnackbar({ open: true, message: '导入成功！' });
        } catch {
          setSnackbar({ open: true, message: '文件格式错误！' });
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a1a2f 0%, #0f0f2f 100%)', pb: 8 }}>
        {/* 第一行：标题 + 登录/设置按钮 */}
        <AppBar position="static" color="transparent" elevation={0}>
          <Toolbar sx={{ justifyContent: 'space-between', minHeight: '80px !important' }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', background: 'linear-gradient(90deg, #00d4ff, #ffffff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Netsurf导航站
            </Typography>
            <Stack direction="row" spacing={2}>
              {isLoggedIn && (
                <>
                  <IconButton color="primary" onClick={addGroup}>
                    <AddIcon />
                  </IconButton>
                  <label>
                    <FileUploadIcon sx={{ cursor: 'pointer', color: 'primary.main' }} />
                    <input type="file" accept=".json" hidden onChange={importData} />
                  </label>
                  <IconButton color="primary" onClick={exportData}>
                    <FileDownloadIcon />
                  </IconButton>
                </>
              )}
              <IconButton color="primary" onClick={() => setLoginDialog(true)}>
                {isLoggedIn ? <SettingsIcon /> : <LoginIcon />}
              </IconButton>
            </Stack>
          </Toolbar>
        </AppBar>

        {/* 第二行：主菜单 Tabs */}
        <Box sx={{ bgcolor: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <Tabs value={tabValue} onChange={(_, v) => setTabValue(v)} centered variant="scrollable" scrollButtons="auto">
            {groups.map((group, i) => (
              <Tab
                key={group.id}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {group.name}
                    {isLoggedIn && (
                      <Box>
                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); renameGroup(i); }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        {groups.length > 1 && (
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); deleteGroup(i); }}>
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        )}
                      </Box>
                    )}
                  </Box>
                }
              />
            ))}
          </Tabs>
        </Box>

        {/* 搜索框 */}
        <Container maxWidth="lg" sx={{ mt: 4 }}>
          <Paper sx={{ p: 2, mb: 4 }}>
            <TextField
              fullWidth
              placeholder="搜索站点、描述..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              InputProps={{
                startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
              }}
            />
          </Paper>

          {/* 磨砂玻璃卡片网格 */}
          <Box sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: 3,
            mt: 2
          }}>
            {filteredLinks.map((link) => (
              <Paper
                key={link.id}
                component="a"
                href={link.url}
                target="_blank"
                elevation={6}
                sx={{
                  p: 3,
                  textAlign: 'center',
                  borderRadius: 4,
                  transition: 'all 0.3s',
                  bgcolor: 'rgba(255, 255, 255, 0.08)',
                  '&:hover': { transform: 'translateY(-8px)', boxShadow: '0 20px 40px rgba(0,212,255,0.3)' },
                  position: 'relative',
                  textDecoration: 'none',
                  color: 'inherit'
                }}
              >
                {isLoggedIn && (
                  <IconButton
                    size="small"
                    sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(0,0,0,0.5)' }}
                    onClick={(e) => { e.preventDefault(); deleteLink(link.id); }}
                  >
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                )}
                <Avatar
                  src={link.icon || `https://www.google.com/s2/favicons?domain=${link.url}&sz=128`}
                  sx={{ width: 56, height: 56, mx: 'auto', mb: 2 }}
                />
                <Typography variant="subtitle1" noWrap sx={{ fontWeight: 'bold' }}>
                  {link.name}
                </Typography>
                {link.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontSize: '0.8rem', opacity: 0.8 }}>
                    {link.description}
                  </Typography>
                )}
              </Paper>
            ))}

            {isLoggedIn && (
              <Paper
                sx={{
                  p: 3,
                  textAlign: 'center',
                  borderRadius: 4,
                  bgcolor: 'rgba(0, 212, 255, 0.15)',
                  border: '2px dashed rgba(0, 212, 255, 0.5)',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: 'rgba(0, 212, 255, 0.25)' }
                }}
                onClick={addLink}
              >
                <AddIcon sx={{ fontSize: 48, color: '#00d4ff' }} />
                <Typography variant="h6" color="primary">添加链接</Typography>
              </Paper>
            )}
          </Box>
        </Container>

        {/* GitHub 角标 */}
        <Box sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 10 }}>
          <Paper
            component="a"
            href="https://github.com/adamj001/cloudflare-navi"  {/* ← 改成你的仓库！ */}
            target="_blank"
            elevation={6}
            sx={{
              p: 2,
              borderRadius: '50%',
              bgcolor: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              '&:hover': { transform: 'scale(1.1)' },
              transition: 'all 0.3s'
            }}
          >
            <GitHubIcon sx={{ fontSize: 36 }} />
          </Paper>
        </Box>

        {/* 登录弹窗 */}
        <Dialog open={loginDialog} onClose={() => setLoginDialog(false)}>
          <DialogTitle>{isLoggedIn ? '管理' : '管理员登录'}</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="密码"
              type="password"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setLoginDialog(false)}>取消</Button>
            {isLoggedIn ? (
              <Button onClick={() => { setIsLoggedIn(false); setSnackbar({ open: true, message: '已退出登录' }); }}>
                退出登录
              </Button>
            ) : (
              <Button onClick={handleLogin} variant="contained">登录</Button>
            )}
          </DialogActions>
        </Dialog>

        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          message={snackbar.message}
        />
      </Box>
    </ThemeProvider>
  );
}

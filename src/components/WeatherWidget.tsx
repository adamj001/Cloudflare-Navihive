import { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Tooltip } from '@mui/material';
import { 
  Sun, Cloud, CloudRain, CloudSnow, CloudLightning, 
  CloudDrizzle, CloudFog, Snowflake 
} from 'lucide-react';

// WMO 天气代码映射到 Lucide 图标 (保持不变)
const getWeatherIcon = (code: number, isDay: number) => {
  if (code === 0) return isDay ? <Sun className="weather-icon-anim" /> : <Sun className="weather-icon-anim" style={{ opacity: 0.8 }} />;
  if (code >= 1 && code <= 3) return <Cloud className="weather-icon-anim" />;
  if (code === 45 || code === 48) return <CloudFog className="weather-icon-anim" />;
  if (code >= 51 && code <= 67) return <CloudDrizzle className="weather-icon-anim" />;
  if (code >= 71 && code <= 77) return <CloudSnow className="weather-icon-anim" />;
  if (code >= 80 && code <= 82) return <CloudRain className="weather-icon-anim" />;
  if (code >= 85 && code <= 86) return <Snowflake className="weather-icon-anim" />;
  if (code >= 95 && code <= 99) return <CloudLightning className="weather-icon-anim" />;
  return <Sun />;
};

const getWeatherDesc = (code: number) => {
  const codes: Record<number, string> = {
    0: '晴朗', 1: '晴间多云', 2: '多云', 3: '阴',
    45: '有雾', 48: '白霜雾', 51: '毛毛雨', 53: '中雨',
    55: '密雨', 61: '小雨', 63: '中雨', 65: '大雨',
    71: '小雪', 73: '中雪', 75: '大雪', 95: '雷雨',
  };
  return codes[code] || '未知天气';
};

export default function WeatherWidget() {
  const [weather, setWeather] = useState<any>(null);
  const [locationName, setLocationName] = useState<string>(''); // ✨ 新增：存储城市名称
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError(true);
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;

          // 1. 获取天气数据 (Open-Meteo)
          const weatherRes = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`
          );
          const weatherData = await weatherRes.json();

          // 2. ✨ 新增：获取城市名称 (BigDataCloud Free API, 无需Key)
          // localityLanguage=zh 强制返回中文
          const cityRes = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=zh`
          );
          const cityData = await cityRes.json();
          
          // 优先取 locality(区/县), 取不到则取 city(市), 再没有就显示"本地"
          const city = cityData.locality || cityData.city || cityData.principalSubdivision || '本地';

          setWeather(weatherData.current_weather);
          setLocationName(city); // 保存城市名

        } catch (e) {
          console.error(e);
          setError(true);
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError(true);
        setLoading(false);
      }
    );
  }, []);

  if (error) return null;

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 1.5,
        py: 0.5,
        borderRadius: '20px',
        bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
        backdropFilter: 'blur(8px)',
        border: '1px solid',
        borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
        transition: 'all 0.3s',
        cursor: 'default', // 鼠标放上去显示默认指针
        '&:hover': {
          bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
        }
      }}
    >
      {loading ? (
        <CircularProgress size={16} thickness={5} />
      ) : (
        <>
          {/* ✨ 修改：Tooltip 内容增加了地点名称 */}
          <Tooltip title={`${locationName}：${getWeatherDesc(weather.weathercode)}，风速 ${weather.windspeed} km/h`}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              color: (theme) => theme.palette.mode === 'dark' ? '#fb8c00' : '#f57c00',
              '& svg': { width: 20, height: 20 }
            }}>
              {getWeatherIcon(weather.weathercode, weather.is_day)}
            </Box>
          </Tooltip>
          
          <Typography variant="body2" fontWeight="bold" sx={{ fontSize: '0.85rem' }}>
            {Math.round(weather.temperature)}°
          </Typography>
        </>
      )}
      
      <style>{`
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-2px); }
          100% { transform: translateY(0px); }
        }
        .weather-icon-anim {
          animation: float 3s ease-in-out infinite;
        }
      `}</style>
    </Box>
  );
}

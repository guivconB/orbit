import { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, CloudLightning, Snowflake } from 'lucide-react';

export function ClockWeatherWidget() {
  const [time, setTime] = useState(new Date());
  const [weather, setWeather] = useState<{ temp: number; condition: number; city: string } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [isEditingCity, setIsEditingCity] = useState(false);
  const [cityInput, setCityInput] = useState('');
  const [cityError, setCityError] = useState('');
  const [refresh, setRefresh] = useState(0);
  const [hasCity, setHasCity] = useState(() => !!localStorage.getItem('orbit_city'));

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // A cidade é escolhida pelo usuário (sem rastrear localização por IP).
        const savedCity = localStorage.getItem('orbit_city');
        if (!savedCity) {
          setHasCity(false);
          setWeather(null);
          return;
        }

        const searchRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(savedCity)}&count=1&language=pt`);
        const searchData = await searchRes.json();
        const place = searchData.results?.[0];
        if (!place) {
          setCityError(`Cidade "${savedCity}" não encontrada.`);
          setHasCity(false);
          setWeather(null);
          return;
        }
        setCityError('');
        setHasCity(true);
        const { latitude: lat, longitude: lon, name: cityName } = place;
        
        // Obter clima
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const weatherData = await weatherRes.json();

        setWeather({
          temp: Math.round(weatherData.current_weather.temperature),
          condition: weatherData.current_weather.weathercode,
          city: cityName
        });
      } catch (err) {
        console.error('Failed to fetch weather', err);
      }
    };

    fetchWeather();
    const weatherTimer = setInterval(fetchWeather, 30 * 60 * 1000); // Atualiza a cada 30 min
    return () => clearInterval(weatherTimer);
  }, [isEditingCity, refresh]);

  const getWeatherIcon = (code: number) => {
    if (code === 0 || code === 1) return <Sun size={32} className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]" />;
    if (code >= 2 && code <= 48) return <Cloud size={32} className="text-slate-300 drop-shadow-[0_0_8px_rgba(203,213,225,0.2)]" />;
    if (code >= 51 && code <= 67) return <CloudRain size={32} className="text-sky-400 drop-shadow-[0_0_8px_rgba(56,189,248,0.3)]" />;
    if (code >= 71 && code <= 82) return <Snowflake size={32} className="text-sky-200 drop-shadow-[0_0_8px_rgba(186,230,253,0.3)]" />;
    if (code >= 95 && code <= 99) return <CloudLightning size={32} className="text-amber-300 drop-shadow-[0_0_8px_rgba(252,211,77,0.3)]" />;
    return <Cloud size={32} className="text-slate-300" />;
  };

  const formatter = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="orbit-card p-6 flex flex-col justify-center items-center h-full min-h-[400px] relative overflow-hidden">
      {/* Glow de fundo sutil */}
      <div className="absolute top-1/4 w-44 h-44 rounded-full bg-accent/10 blur-3xl pointer-events-none" />

      <div className="text-6xl font-bold font-mono tabular-nums tracking-tight text-white mb-2 drop-shadow-sm z-10">
        {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
      </div>
      <div className="text-slate-400 text-xs font-medium capitalize mb-6 text-center z-10 tracking-wide">
        {formatter.format(time)}
      </div>

      {weather ? (
        <div className="flex flex-col items-center bg-black/25 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-5 w-full max-w-[210px] z-10 shadow-inner transition-all hover:border-white/10">
          <div className="mb-2.5">{getWeatherIcon(weather.condition)}</div>
          <div className="text-3xl font-bold font-mono text-white mb-1 tabular-nums">{weather.temp}°C</div>
          
          {isEditingCity ? (
            <form onSubmit={(e) => {
              e.preventDefault();
              if (cityInput.trim()) {
                localStorage.setItem('orbit_city', cityInput.trim());
              } else {
                localStorage.removeItem('orbit_city');
              }
              setIsEditingCity(false);
            }} className="w-full mt-2">
              <input
                autoFocus
                type="text"
                placeholder="Sua cidade..."
                className="w-full text-xs text-center p-1.5 rounded-lg bg-black/40 text-white outline-none border border-white/10 focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all"
                value={cityInput}
                onChange={e => setCityInput(e.target.value)}
                onBlur={() => setIsEditingCity(false)}
              />
            </form>
          ) : (
            <div 
              onClick={() => {
                setCityInput(weather.city);
                setIsEditingCity(true);
              }}
              className="text-slate-400 text-xs text-center cursor-pointer hover:text-slate-200 transition-colors mt-0.5"
              title="Clique para alterar a cidade"
            >
              {weather.city}
            </div>
          )}
        </div>
      ) : !hasCity ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!cityInput.trim()) return;
            localStorage.setItem('orbit_city', cityInput.trim());
            setHasCity(true);
            setRefresh(r => r + 1);
          }}
          className="flex flex-col items-center bg-black/25 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-5 w-full max-w-[220px] gap-2.5 z-10 shadow-inner"
        >
          <span className="text-xs font-medium text-slate-300">Qual é a sua cidade?</span>
          <input
            type="text"
            placeholder="Ex: São Paulo"
            className="w-full text-xs text-center p-2 rounded-lg bg-black/40 text-white outline-none border border-white/10 focus:border-accent focus:ring-1 focus:ring-accent/30 transition-all"
            value={cityInput}
            onChange={e => setCityInput(e.target.value)}
          />
          {cityError && <span className="text-[11px] text-rose-400 text-center">{cityError}</span>}
          <button 
            type="submit" 
            className="text-xs px-3.5 py-1.5 rounded-lg bg-accent hover:opacity-90 text-white font-medium shadow-sm transition-all active:scale-95 cursor-pointer"
          >
            Ver clima
          </button>
        </form>
      ) : (
        <div className="flex flex-col items-center bg-black/25 backdrop-blur-sm border border-white/[0.06] rounded-2xl p-6 w-full max-w-[210px] animate-pulse z-10">
          <div className="w-8 h-8 bg-white/10 rounded-full mb-3" />
          <div className="w-16 h-8 bg-white/10 rounded mb-2" />
          <div className="w-20 h-4 bg-white/10 rounded" />
        </div>
      )}
    </div>
  );
}

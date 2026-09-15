import React, { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, CloudLightning, Snowflake } from 'lucide-react';

export function ClockWeatherWidget() {
  const [time, setTime] = useState(new Date());
  const [weather, setWeather] = useState<{ temp: number; condition: number; city: string } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        // Obter localização por IP
        const locRes = await fetch('http://ip-api.com/json/');
        const locData = await locRes.json();
        
        // Obter clima
        const weatherRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${locData.lat}&longitude=${locData.lon}&current_weather=true`);
        const weatherData = await weatherRes.json();

        setWeather({
          temp: Math.round(weatherData.current_weather.temperature),
          condition: weatherData.current_weather.weathercode,
          city: locData.city
        });
      } catch (err) {
        console.error('Failed to fetch weather', err);
      }
    };

    fetchWeather();
    const weatherTimer = setInterval(fetchWeather, 30 * 60 * 1000); // Atualiza a cada 30 min
    return () => clearInterval(weatherTimer);
  }, []);

  const getWeatherIcon = (code: number) => {
    if (code === 0 || code === 1) return <Sun size={32} className="text-amber-400" />;
    if (code >= 2 && code <= 48) return <Cloud size={32} className="text-slate-400" />;
    if (code >= 51 && code <= 67) return <CloudRain size={32} className="text-blue-400" />;
    if (code >= 71 && code <= 82) return <Snowflake size={32} className="text-sky-300" />;
    if (code >= 95 && code <= 99) return <CloudLightning size={32} className="text-purple-400" />;
    return <Cloud size={32} className="text-slate-400" />;
  };

  const formatter = new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="bg-widget rounded-xl p-4 shadow-lg border border-border flex flex-col justify-center items-center h-full min-h-[400px]">
      <div className="text-6xl font-black tabular-nums tracking-tight text-slate-100 mb-2">
        {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
      </div>
      <div className="text-slate-400 text-sm font-medium capitalize mb-8 text-center">
        {formatter.format(time)}
      </div>

      {weather ? (
        <div className="flex flex-col items-center bg-app rounded-2xl p-6 w-full max-w-[200px]">
          <div className="mb-3">{getWeatherIcon(weather.condition)}</div>
          <div className="text-4xl font-bold text-slate-100 mb-1">{weather.temp}°C</div>
          <div className="text-slate-500 text-sm text-center">{weather.city}</div>
        </div>
      ) : (
        <div className="flex flex-col items-center bg-app rounded-2xl p-6 w-full max-w-[200px] animate-pulse">
          <div className="w-8 h-8 bg-slate-700 rounded-full mb-3" />
          <div className="w-16 h-8 bg-slate-700 rounded mb-2" />
          <div className="w-20 h-4 bg-slate-700 rounded" />
        </div>
      )}
    </div>
  );
}

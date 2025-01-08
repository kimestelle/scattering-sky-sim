import React, { createContext, useContext, useState, useEffect } from "react";

export type WeatherData = {
    humidity: number; // relative humidity (0-1)
    visibility: number; // meters
    cloudCover: number; // fraction (0-1)
    temperature: number; //Kelvin
    windSpeed: number; //m/s
    windDirection: number; //degrees
    altitude: number; //meters
    sunAngle: number;
};

export type LocationData = {
  latitude: number;
  longitude: number;
};

type WeatherContextType = {
  location: LocationData;
  weatherData: WeatherData;
  updateLocation: (location: LocationData) => void;
  updateWeather: (weather: Partial<WeatherData>) => void;
};

const WeatherContext = createContext<WeatherContextType | undefined>(undefined);

export const WeatherProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const defaultLocation: LocationData = { latitude: 40.7128, longitude: -74.0060 }; // New York
  const defaultWeather: WeatherData = {
    humidity: 0.5,
    visibility: 10000,
    cloudCover: 0.2,
    temperature: 288,
    windSpeed: 0,
    windDirection: 0,
    altitude: 0,
    sunAngle: 45,
  };

  const [location, setLocation] = useState<LocationData>(defaultLocation);
  const [fetchedWeatherData, setFetchedWeatherData] = useState<WeatherData | null>(null);
  const [manualUpdates, setManualUpdates] = useState<Partial<WeatherData>>({});

  const updateLocation = (newLocation: LocationData) => {
    setLocation(newLocation);
    setManualUpdates({});
  };

  const updateWeather = (updatedData: Partial<WeatherData>) => {
    setManualUpdates((prev) => ({ ...prev, ...updatedData }));
  };

  const weatherData = {
    ...(fetchedWeatherData || defaultWeather),
    ...manualUpdates,
  };

  useEffect(() => {
    const fetchWeatherData = async () => {
      try {
        const pointsResponse = await fetch(
          `https://api.weather.gov/points/${location.latitude},${location.longitude}`,
          { headers: { "User-Agent": "(kestelle, kestelle@sas.upenn.edu)" } }
        );
        const pointsData = await pointsResponse.json();
        const forecastUrl = pointsData.properties.forecastGridData;

        const gridResponse = await fetch(forecastUrl, {
          headers: { "User-Agent": "(kestelle, kestelle@sas.upenn.edu)" },
        });
        const gridData = await gridResponse.json();

        setFetchedWeatherData({
          humidity: gridData.properties.relativeHumidity.values[0]?.value / 100 || 0.5,
          visibility: gridData.properties.visibility.values[0]?.value || 10000,
          cloudCover: gridData.properties.skyCover.values[0]?.value / 100 || 0.2,
          temperature: gridData.properties.temperature.values[0]?.value || 288,
          windSpeed: gridData.properties.windSpeed.values[0]?.value || 0,
          windDirection: parseFloat(gridData.properties.windDirection.values[0]?.value) || 0,
          altitude: gridData.properties.elevation.value,
          sunAngle: 45,
        });
      } catch (error) {
        console.error("Error fetching weather data:", error);
      }
    };

    fetchWeatherData();
  }, [location]);

  return (
    <WeatherContext.Provider value={{ location, weatherData, updateLocation, updateWeather }}>
      {children}
    </WeatherContext.Provider>
  );
};

export const useWeather = () => {
  const context = useContext(WeatherContext);
  if (!context) {
    throw new Error("useWeather must be used within a WeatherProvider");
  }
  return context;
};

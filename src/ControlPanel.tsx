import { useWeather } from "./WeatherContext";

const ControlPanel = () => {
  const { location, weatherData, updateLocation, updateWeather } = useWeather();

  const predefinedLocations = [
    { name: "New York", latitude: 40.7128, longitude: -74.0060 },
    { name: "Los Angeles", latitude: 34.0522, longitude: -118.2437 },
    { name: "Houston", latitude: 29.7604, longitude: -95.3698 },
  ];

  return (
    <div className="control-panel">
        <h4>Real-time Data:</h4>
        <select
          onChange={(e) => {
            const selected = predefinedLocations.find((loc) => loc.name === e.target.value);
            if (selected) updateLocation({ latitude: selected.latitude, longitude: selected.longitude });
          }}
          value={predefinedLocations.find((loc) => loc.latitude === location.latitude)?.name || "Custom"}
        >
          {predefinedLocations.map((loc) => (
            <option key={loc.name} value={loc.name}>
              {loc.name}
            </option>
          ))}
        </select>
        
        <h4>Manual Adjustments</h4>
        <label>
          Humidity: {weatherData.humidity.toFixed(2)}
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={weatherData.humidity}
            onChange={(e) => updateWeather({ humidity: parseFloat(e.target.value) })}
          />
        </label>

        <label>
          Visibility: {weatherData.visibility.toPrecision(2)}m
          <input
            type="range"
            min="0"
            max="20000"
            step="100"
            value={weatherData.visibility}
            onChange={(e) => updateWeather({ visibility: parseInt(e.target.value) })}
          />
        </label>

        <label>
          Cloud Cover: {weatherData.cloudCover.toFixed(2)}
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={weatherData.cloudCover}
            onChange={(e) => updateWeather({ cloudCover: parseFloat(e.target.value) })}
          />
        </label>

        <label>
          Temperature: {weatherData.temperature.toPrecision(2)}K
          <input
            type="range"
            min="200"
            max="330"
            step="1"
            value={weatherData.temperature}
            onChange={(e) => updateWeather({ temperature: parseInt(e.target.value) })}
          />
        </label>

        <label>
          Wind Speed: {weatherData.windSpeed.toPrecision(2)}m/s
          <input
            type="range"
            min="0"
            max="50"
            step="1"
            value={weatherData.windSpeed}
            onChange={(e) => updateWeather({ windSpeed: parseInt(e.target.value) })}
          />
        </label>

        <label>
          Wind Direction: {weatherData.windDirection.toPrecision(2)}°
          <input
            type="range"
            min="0"
            max="360"
            step="1"
            value={weatherData.windDirection}
            onChange={(e) => updateWeather({ windDirection: parseInt(e.target.value) })}
          />
        </label>

        <label>
          Altitude: {weatherData.altitude.toPrecision(2)}m
          <input
            type="range"
            min="0"
            max="10000"
            step="10"
            value={weatherData.altitude}
            onChange={(e) => updateWeather({ altitude: parseInt(e.target.value) })}
          />
        </label>

        <label>
        Sun Angle: {weatherData.sunAngle.toPrecision(2)}°
        <input
            type="range"
            min="5"
            max="90"
            step="1"
            value={weatherData.sunAngle}
            onChange={(e) => updateWeather({ sunAngle: parseInt(e.target.value) })}
        />
        </label>
    </div>
  );
};

export default ControlPanel;

import { RGBColor } from './App';
import { WeatherData } from './WeatherContext';
import { createNoise3D } from 'simplex-noise';

//path through the atmosphere
const calculatePathLength = (solarAngle: number): number => {
    const scaleHeight = 8e3; //height of atmosphere in meters when 90degrees
    const zenithAngle = (90 - solarAngle) * (Math.PI / 180); //zenith angle in radians
  
    //prevent division by zero near 90deg
    const cosZenith = Math.max(Math.cos(zenithAngle), 0.01);
  
    //approximate path length of sunlight
    const pathLength = scaleHeight / cosZenith;
  
    return Math.min(pathLength, 40e4);
};

//number density of molecules per m^3, physically correct
const numberDensity = 2.504e25;

//calculate the Rayleigh scattering coefficient based on wavelength
const calculateBetaRayleigh = (wavelength: number, refractiveIndex: number): number => {
    const lambda = wavelength * 1e-9; //convert nm to meters
    return (8 * Math.PI ** 3 * (refractiveIndex - 1) ** 2) / (3 * numberDensity * lambda ** 4);
};

//calculate the Mie scattering coefficient (not wavelength-dependent)
const calculateBetaMie = (refractiveIndex: number): number => {
    return (8 * Math.PI ** 3 * (refractiveIndex - 1) ** 2) / (3 * numberDensity);
};

/**rayleigh formula from bruneton and nayret's paper on procedural atmosphere generation
mie formula using schlick's approximation instead of precise infinite series for speed
combined rayleigh and mie
**/
export const calculateScattering = (weatherData: WeatherData, altitude: number): RGBColor => {
      //refractive index from website adjusted with approximate adjustment due to water vapor replacing smaller molecules > diminished scattering
      const refractiveIndex = 1.00029 + 0.00005 * weatherData.humidity;
  
      //wavelengths for red, green, and blue light in nanometers
      const wavelengths = { red: 650, green: 550, blue: 450 };
  
      //sunlight intensity at each wavelength, based on Planck's blackbody radiation (5800 Kelvin)
      const sunIntensity = {
          red: plancksBlackbodyRadiation(680, 5800), //5800 Kelvin
          green: plancksBlackbodyRadiation(520, 5800),
          blue: plancksBlackbodyRadiation(440, 5800),
      };
      console.log('sun intensity: ', sunIntensity);
  
      //scaling factor to handle small numbers and adjust for visualization purposes
      const scalingFactor = 10;
  
      //calculate the scattering coefficients for Rayleigh and Mie
      const betaR = {
          red: calculateBetaRayleigh(wavelengths.red, refractiveIndex) * scalingFactor,
          green: calculateBetaRayleigh(wavelengths.green, refractiveIndex) * scalingFactor,
          blue: calculateBetaRayleigh(wavelengths.blue, refractiveIndex) * scalingFactor,
      };
  
      const betaM = {
          red: calculateBetaMie(refractiveIndex) * scalingFactor, //mie coefficient does not depend on wavelength
          green: calculateBetaMie(refractiveIndex) * scalingFactor,
          blue: calculateBetaMie(refractiveIndex) * scalingFactor,
      };
  
    //   console.log('Beta Rayleigh:', betaR);
    //   console.log('Beta Mie:', betaM);
  
    //   console.log('betaR: ', betaR);
  
      //atmospheric density by altitude with exponential decay
      const altitudeFactor = Math.exp(-altitude / 8500);
    //   console.log('altitude', altitude);
    //   console.log('altitude factor: ', altitudeFactor);
  
      //rayleigh phase function for scattering geometry (both forward and backward scattering)
      const theta = (90 - weatherData.sunAngle) * (Math.PI / 180); //zenith angle
      const rayleighPhase = (3 / (16 * Math.PI)) * (1 + Math.cos(theta) ** 2);
    //   console.log('rayleigh phase: ', rayleighPhase);
  
      //schlick's approximation for Mie scattering phase function (faster than infinite series)
      const calculateMiePhase = (g: number, cosTheta: number): number => {
          return (1 - g ** 2) / (4 * Math.PI * (1 + g * cosTheta) ** 2);
      };
      const gFactor = 0.76; //asymmetry factor (forward scattering)
      const cosTheta = Math.cos((90 - weatherData.sunAngle) * (Math.PI / 180)); //cosine of the scattering angle
      const miePhase = calculateMiePhase(gFactor, cosTheta);
  
      //calculate path length through the atmosphere (longer near the horizon)
      const pathLength = calculatePathLength(weatherData.sunAngle);
    //   console.log('path length: ', pathLength);
  
      //increased scattering near the horizon due to longer path lengths
      const adjustedPathLength = {
          red: pathLength,
          green: pathLength * 1.5, //slight exaggeration to reduce green dominance
          blue: pathLength,
      };

      const rayleighIntensity = {
          red:
              sunIntensity.red *
              Math.exp(-betaR.red * adjustedPathLength.red) *
              betaR.red *
              altitudeFactor *
              rayleighPhase,
          green:
              sunIntensity.green *
              Math.exp(-betaR.green * adjustedPathLength.green) *
              betaR.green *
              altitudeFactor *
              rayleighPhase,
          blue:
              sunIntensity.blue *
              Math.exp(-betaR.blue * adjustedPathLength.blue) *
              betaR.blue *
              altitudeFactor *
              rayleighPhase,
      };
    //   console.log('rayleigh intensity: ', rayleighIntensity);

      const mieIntensity = {
          red:
              sunIntensity.red *
              Math.exp(-betaM.red * pathLength) *
              betaM.red *
              altitudeFactor *
              miePhase,
          green:
              sunIntensity.green *
              Math.exp(-betaM.green * pathLength) *
              betaM.green *
              altitudeFactor *
              miePhase,
          blue:
              sunIntensity.blue *
              Math.exp(-betaM.blue * pathLength) *
              betaM.blue *
              altitudeFactor *
              miePhase,
      };
    //   console.log('mie intensity: ', mieIntensity);
  
      //sum rayleigh and mie
      const intensity = {
          red: rayleighIntensity.red + mieIntensity.red,
          green: rayleighIntensity.green + mieIntensity.green,
          blue: rayleighIntensity.blue + mieIntensity.blue,
      };
    //   console.log('combined intensity: ', intensity);
  
      //normalized intensity (could find a way to make the scaling better, I think I should instead correct for brightness at the end)
      const maxIntensity = Math.max(...Object.values(intensity));
      return {
          r: Math.round((intensity.red / maxIntensity) * 255),
          g: Math.round((intensity.green / maxIntensity) * 255),
          b: Math.round((intensity.blue / maxIntensity) * 255),
      };
  };
  
  //plancks law for blackbody radiation: idealized physical body that absorbs all incident electromagnetic radiation
  const plancksBlackbodyRadiation = (lambda: number, temperature: number): number => {
    const h = 6.626e-34; // Planck's constant (J·s)
    const c = 3e8; // Speed of light (m/s)
    const k = 1.38e-23; // Boltzmann constant (J/K)

    lambda *= 1e-9; // Convert nm to meters

    const numerator = 2 * h * c ** 2;
    const denominator = lambda ** 5 * (Math.exp((h * c) / (lambda * k * temperature)) - 1);

    return (numerator / denominator) * 1e-12; // Scale radiance to visually useful range
  };
  
  export const calculateSunColor = (weatherData: WeatherData): RGBColor => {
    const refractiveIndex = 1.00029 + 0.00005 * weatherData.humidity;

    // Wavelengths for red, green, and blue light in nanometers
    const wavelengths = { red: 650, green: 550, blue: 450 };

    // Path length through the atmosphere (longer near the horizon)
    const pathLength = calculatePathLength(weatherData.sunAngle);

    // Calculate Rayleigh scattering coefficients
    const betaR = {
        r: calculateBetaRayleigh(wavelengths.red, refractiveIndex),
        g: calculateBetaRayleigh(wavelengths.green, refractiveIndex),
        b: calculateBetaRayleigh(wavelengths.blue, refractiveIndex),
    };

    // Calculate Mie scattering coefficients
    const betaM = {
        r: calculateBetaMie(refractiveIndex),
        g: calculateBetaMie(refractiveIndex),
        b: calculateBetaMie(refractiveIndex),
    };

    // Sunlight intensity at each wavelength based on Planck's blackbody radiation (5800 Kelvin)
    const sunIntensity = {
        red: plancksBlackbodyRadiation(680, 5800), // Red
        green: plancksBlackbodyRadiation(520, 5800) * 0.9, // Green
        blue: plancksBlackbodyRadiation(440, 5800), // Blue
    };

    // Attenuation due to Rayleigh scattering
    const rayleighAttenuation = {
        red: Math.exp(-betaR.r * pathLength),
        green: Math.exp(-betaR.g * pathLength * 1.5),
        blue: Math.exp(-betaR.b * pathLength),
    };

    // Attenuation due to Mie scattering
    const mieAttenuation = {
        red: Math.exp(-betaM.r * pathLength),
        green: Math.exp(-betaM.g * pathLength * 1.5),
        blue: Math.exp(-betaM.b * pathLength),
    };

    // Combine intensities with scattering effects
    const color = {
        red: sunIntensity.red * rayleighAttenuation.red * mieAttenuation.red,
        green: sunIntensity.green * rayleighAttenuation.green * mieAttenuation.green,
        blue: sunIntensity.blue * rayleighAttenuation.blue * mieAttenuation.blue,
    };

    console.log('Sun Color (before normalization):', color);

    // Normalize the color intensity
    const maxIntensity = Math.max(color.red, color.green, color.blue);
    const normalizedColor = {
        red: (color.red / maxIntensity) * 255,
        green: (color.green / maxIntensity) * 255,
        blue: (color.blue / maxIntensity) * 255,
    };

    // save weather effects for sky overlay
    // const visibilityFactor = weatherData.visibility / 10000; //normalize
    // console.log('Visibility Factor:', visibilityFactor);
    // const cloudCoverFactor = 1 - weatherData.cloudCover;
    // console.log('Cloud Cover Factor:', cloudCoverFactor);
    const brightnessFactor = Math.max(0, 0.9 + 0.1 * Math.cos((90 - weatherData.sunAngle) * (Math.PI / 180)));

    console.log('Brightness Factor:', brightnessFactor);
    return {
        r: Math.min(255, Math.round(normalizedColor.red * brightnessFactor)),
        g: Math.min(255, Math.round(normalizedColor.green * brightnessFactor)),
        b: Math.min(255, Math.round(normalizedColor.blue * brightnessFactor)),
    };
};

export const drawSunHalo = (
    ctx: CanvasRenderingContext2D,
    sunPositionX: number,
    sunPositionY: number,
    sunColor: RGBColor,
    canvasWidth: number,
    solarAngle: number
) => {
    console.log('Sun Color:', sunColor);

    // Adjust halo size based on solar angle (larger near the horizon)
    const haloSizeFactor = 1 + (90 - solarAngle) / 80; // Gradually increases as the sun gets lower

    const haloGradient = ctx.createRadialGradient(
        sunPositionX,
        sunPositionY,
        canvasWidth * 0.1 * haloSizeFactor, // Inner radius
        sunPositionX,
        sunPositionY,
        canvasWidth * 0.3 * haloSizeFactor // Outer radius
    );

    haloGradient.addColorStop(0, `rgba(${sunColor.r}, ${sunColor.g}, ${sunColor.b}, 0.4)`); // Center
    haloGradient.addColorStop(1, `rgba(${sunColor.r}, ${sunColor.g}, ${sunColor.b}, 0)`); // Fade to transparent

    ctx.fillStyle = haloGradient;
    ctx.beginPath();
    ctx.arc(sunPositionX, sunPositionY, canvasWidth * 0.3 * haloSizeFactor, 0, 2 * Math.PI);
    ctx.fill();
};

export const drawSun = (
    ctx: CanvasRenderingContext2D,
    sunPositionX: number,
    sunPositionY: number,
    sunColor: RGBColor,
    canvasWidth: number,
    solarAngle: number
) => {
    //larger near the horizon
    const sunSizeFactor = 1 + (90 - solarAngle) / 80;

    const sunGradient = ctx.createRadialGradient(
        sunPositionX,
        sunPositionY,
        canvasWidth * 0.05 * sunSizeFactor,
        sunPositionX,
        sunPositionY,
        canvasWidth * 0.1 * sunSizeFactor
    );

    sunGradient.addColorStop(0, `rgba(${sunColor.r}, ${sunColor.g}, ${sunColor.b}, 1)`);
    sunGradient.addColorStop(0.2, `rgba(${sunColor.r}, ${sunColor.g}, ${sunColor.b}, 0.5)`);
    sunGradient.addColorStop(1, `rgba(${sunColor.r}, ${sunColor.g}, ${sunColor.b}, 0)`);

    ctx.fillStyle = sunGradient;
    ctx.beginPath();
    ctx.arc(sunPositionX, sunPositionY, canvasWidth * 0.1 * sunSizeFactor, 0, 2 * Math.PI);
    ctx.fill();
};

const noise3D = createNoise3D();

export const drawClouds = (
    ctx: CanvasRenderingContext2D,
    canvasWidth: number,
    canvasHeight: number,
    cloudOpacity: number,
    offsetX: number,
    time: number,
    windSpeed: number,
    windDirection: number
) => {
    const cloudScale = 0.00005; // Finer scale
    const cloudIntensity = cloudOpacity * 5; // More intense clouds
    const threshold = 0.2; // Threshold for defining clouds

    //wind movement
    const windOffsetX = Math.cos(windDirection) * windSpeed * (time * 0.001);
    const windOffsetY = Math.sin(windDirection) * windSpeed * (time * 0.001);

    for (let x = 0; x < canvasWidth; x += 5) {
        for (let y = 0; y < canvasHeight; y += 5) {
            const noiseValue =
                0.5 * noise3D((x + windOffsetX) * cloudScale, (y + windOffsetY) * cloudScale, time) +
                0.25 * noise3D((x + windOffsetX) * cloudScale * 2, (y + windOffsetY) * cloudScale * 2, time) +
                0.125 * noise3D((x + windOffsetX) * cloudScale * 4, (y + windOffsetY) * cloudScale * 4, time);
            
            const gradient = 1 - Math.abs(noiseValue); // Gradient for smooth edges
            const intensity = Math.max(0, (noiseValue - threshold) * gradient * cloudIntensity * 255);
            
            ctx.fillStyle = `rgba(100, 100, 100, ${intensity / 255})`;
            ctx.fillRect(offsetX + x, y, 5, 5);
        }
    }
};

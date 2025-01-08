import { useEffect, useRef, useState } from "react";
import { calculateScattering, calculateSunColor, drawSun, drawSunHalo } from "./Functions";
import * as THREE from "three";
import CloudShaderMaterial from "./CloudShader";
import ControlPanel from "./ControlPanel";
import { useWeather, WeatherData } from "./WeatherContext";

export type RGBColor = {
  r: number;
  g: number;
  b: number;
}; 

export default function SkyCanvas(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const cloudRef = useRef<HTMLDivElement | null>(null);
  const [time, setTime] = useState(0);
  const { weatherData } = useWeather();


  useEffect(() => {
    const interval = setInterval(() => {
      setTime((prevTime) => prevTime + 1);
      console.log("time:", time);
    }, 500);

    return () => clearInterval(interval);
  }, [time]);
  
  const drawSky = (ctx: CanvasRenderingContext2D, weatherData: WeatherData, offsetX: number) => {
    const canvasWidth = 400;
    const canvasHeight = 500;

    const skyColor = calculateScattering(weatherData, weatherData.altitude || 0);

    const sunColor = calculateSunColor(weatherData);

    console.log("Sun Color:", sunColor);

    const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
    gradient.addColorStop(0, `rgb(${skyColor.r}, ${skyColor.g}, ${skyColor.b})`);
    gradient.addColorStop(
      1,
      `rgb(${(sunColor.r * 2 + skyColor.r) / 3}, ${(sunColor.g * 2 + skyColor.g) / 3}, ${(sunColor.b * 2 + skyColor.b) / 3})`
    );

    ctx.fillStyle = gradient;
    ctx.fillRect(offsetX, 0, canvasWidth, canvasHeight);

    const sunPositionX = offsetX + canvasWidth / 2;
    const sunPositionY = canvasHeight * (1 - weatherData.sunAngle / 90);

    drawSunHalo(ctx, sunPositionX, sunPositionY, sunColor, canvasWidth, weatherData.sunAngle);
    drawSun(ctx, sunPositionX, sunPositionY, sunColor, canvasWidth, weatherData.sunAngle);

    const reflectionGradient = ctx.createLinearGradient(0, canvasHeight, 0, canvasHeight * 1.5);
    reflectionGradient.addColorStop(
      0,
      `rgba(${skyColor.r}, ${skyColor.g}, ${skyColor.b}, 0.5)` 
    );
    reflectionGradient.addColorStop(
      1,
      `rgba(${(sunColor.r + skyColor.r) / 2}, ${(sunColor.g + skyColor.g) / 2}, ${(sunColor.b + skyColor.b) / 2}, 0.2)` // Dimmed reflection
    );
  
    ctx.fillStyle = reflectionGradient;
    ctx.fillRect(offsetX, canvasHeight, canvasWidth, canvasHeight / 2);
  };

  useEffect(() => {
    if (!weatherData || !canvasRef.current) return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;
    
    drawSky(ctx, weatherData, 0);
  }, [weatherData]);

  useEffect(() => {
    if (!cloudRef.current || !weatherData) return;
  
    const cloudContainer = cloudRef.current;
  
    const renderer = new THREE.WebGLRenderer({ alpha: true });
    const width = 400;
    const height = 600;
    renderer.setSize(width, height);
    cloudContainer.appendChild(renderer.domElement);
  
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 1;
  
    const plane = new THREE.PlaneGeometry(2, 2);
    const clouds = new THREE.Mesh(plane, CloudShaderMaterial);
    scene.add(clouds);
  
    const animate = () => {
      if (!renderer.domElement.parentNode) return;
      CloudShaderMaterial.uniforms.time.value = time * 0.01;
      CloudShaderMaterial.uniforms.cloudOpacity.value = weatherData.cloudCover;
      CloudShaderMaterial.uniforms.windDirection.value = new THREE.Vector2(
        Math.cos((weatherData.windDirection || 0) * (Math.PI / 180)),
        Math.sin((weatherData.windDirection || 0) * (Math.PI / 180))
      );
  
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
  
    animate();
  
    return () => {
      renderer.dispose();
      scene.clear();
  
      plane.dispose();
      CloudShaderMaterial.dispose();
  
      if (cloudContainer) {
        cloudContainer.removeChild(renderer.domElement);
      }
    };
  }, [weatherData, time]);
  

  return (
    <div className="container">
      <div className="canvas-wrapper">
        <canvas ref={canvasRef} width={400} height={600} className="canvas" />
        <div ref={cloudRef} className="clouds" />
      </div>
      <div className='control-panel-wrapper'>
        <h2>2D SkySim</h2>
        <p>inexpensive sky color generator based on light scattering physics</p>
        <ControlPanel/>
      </div>
    </div>
  );
}
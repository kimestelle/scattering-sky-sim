# SkySim
Real-time, physically accurate 2D rendering of the sky from location and weather conditions. Lightweight enough for most modern devices. I was originally inspired by the idea of being under the same sky as someone else, and the fact that a beautiful skyview is free public property that everyone shares / enjoys. Why can't we share the sky a little more and make any sky accessible anywhere anytime?

## **Features**
  - **Real-Time Rendering**: Computing Rayleigh and Mie scattering effects dynamically to approximate sky colors based on location, weather, and sun angle (time of day). The sun color was calculated similarly with adjustments due to its brightness and diminished effect of Mie scattering.
  - **Physical Features** A reflective floor as well as a slight gradient representing the reflection of sunlight color from the ground, add physical dimension.
  - **Cloud Generation**: Simple noise FBM to include cloud density and wind conditions.
  - **Interactive Inputs**: Allows users to select North American locations for real-time data.
  - **Extensible Design**: Built with the potential to simulate any sky, including some other planets...  

## **Formulas and Concepts**
  Sky color is influenced by sun rays hitting air molecules and being 'scattered' into rays of the same wavelength as they travel to the viewer's eyes.

### **Rayleigh Scattering**
  Rayleigh scattering is a form of Mie scattering with molecules that are much smaller than light wavelength.
  - Shorter wavelengths (blue) scatter more efficiently, making the sky appear blue during the day.
  - Near the horizon, where the path length is longer, blue light scatters away, leaving other colors more prominent and producing a whiter appearance.
  - At sunset, the path length increases even further, causing red and yellow hues to dominate as blue light is scattered out of view.
  
**Code Steps**:
  1. Fetch the solar angle and calculate the path length the light travels through the atmosphere.
  2. Use wavelength-dependent scattering coefficients to compute intensities for red, green, and blue light.
  3. Normalize the intensities relative to the maximum value, then convert into RGB values.

### **Mie Scattering**
  Mie scattering occurs when larger particles in the atmosphere, such as dust or water droplets, scatter light in a way that is less wavelength-dependent.
  - Softens the effects of Rayleigh scattering, simulating overcast or hazy skies.
  - Contributes to the overall brightness of the sky and the appearance of clouds.
 
**Code Steps**:
  1. Calculate particle size distribution and density from the weather API (e.g., humidity levels and sky visibility).
  2. Approximate scattering using coefficients for wavelength-independent interactions.
  3. Blend the results with Rayleigh scattering to achieve realistic cloud and haze effects.

## **Trial-and-Error**
  I initially thought this would be a 2-hour project, but there was a reason why there's crazy papers and not many examples of this...
1. **Struggling with Sunrise and Sunset Colors**:
  - At first, my sunsets were blue despite having implemented the exact scattering algorithms. I had to review all of my measurement units and constants to ensure they were physically correct (especially the path length, since a long path length scatters the blue and makes way for red) 
   - However, after I was able to degrade the blue enough to get a red sunset, the sky turned green at a solar angle of 15 degrees because I was normalizing color vectors by the largest value and green became dominant at the point where red and blue balanced out. To fix this, I attenuated the green intensity, but this slightly disrupted the overall color balance and resulted in a less accurate implementation. In the future, I plan to revise my normalization method and accurately adjust the blues and reds to what enters the human eye to organically remove this phenomenon.

2. **Cloud Generation Limitations**:
   - Using a Threejs shader to layer simplified noise was one of my only options to produce a product that was computationally inexpensive enough, but I ended up with clouds that looked more like fog than fluff. I plan to experiment with the noise and possibly find ways to combine other forms of noise such as Worley noise to create more texture.

3. **Human Optics**:
   - The cone receptors in human eyes are more sensitive to blue light under bright conditions, so I took that into account in the process when fine-tuning scattering values to create a more visually realistic scene.

4. **NOAA Weather API**:
   - Real-time weather data integration was achieved using the NOAA API. This data matches cloud density, humidity, and sun angle calculations, ensuring the sky responds dynamically to local conditions. Thankfully, the API is free and open to any curious individual to use.

5. **Incomplete Nighttime Physics**:
   - I've yet to implement nighttime colors due to different scattering and light reflection behaviors under low-light conditions. After this is accomplished, I'll be able to open the user experience a bit more to allow the user to select any location on the face of the Earth.

## **Next Steps**
  - 3D globe navigator for users to select any point on Earth.
  - More complex color gradients using other phenomena
  - Render weather effects (e.g., rain, fog) using custom shaders.
  - Display regional skylines (e.g., urban, mountainous) by pulling map data and categories via a map API
  - Simulate Martian skies and other custom planets (Mars has reddish daytime tones and blue sunsets :O )
  - Add nighttime rendering, incorporating different scattering and light reflection physics

## **References and Resources**
  - [Dynamic Atmospheric Scattering] https://inria.hal.science/inria-00288758
  - [Rayleigh Scattering] (https://www.alanzucconi.com/2017/10/10/atmospheric-scattering-3/)
  - [Physics on Atmospheric Scattering] (https://hapax.github.io/physics/everyday/sky/)
  - [NOAA Weather API] (https://www.weather.gov/documentation/services-web-api)

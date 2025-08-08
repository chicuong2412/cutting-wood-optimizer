# 🪵 Free Cutlist Optimizer

A powerful React-based cutting optimization tool designed to find optimal cut layouts for wood and sheet materials, minimizing waste and maximizing efficiency.

## Features

### 🔧 Input Options
- **Stock Materials**: Define your available sheets with dimensions and quantities
- **Required Parts**: Specify the parts you need with dimensions, quantities, and labels
- **Cutting Settings**: 
  - Kerf size (saw blade thickness)
  - Grain direction consideration
  - Edge banding options
  - Material priorities

### 📊 Optimization Engine
- **2D Nesting Algorithm**: Advanced bin packing algorithm for optimal part placement
- **Rotation Support**: Automatically considers part rotation when grain direction allows
- **Kerf Compensation**: Accounts for blade thickness in calculations
- **Multiple Sheet Support**: Optimizes across multiple stock sheets

### 📈 Results & Visualization
- **Cutting Diagrams**: Visual SVG representations of how to cut each sheet
- **Detailed Reports**: 
  - Material usage statistics
  - Waste calculations
  - Efficiency percentages
  - Estimated cutting time
- **Part Lists**: Color-coded parts with positions and dimensions
- **Export Options**: PDF, CSV, and print functionality (UI ready)

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. **Clone or extract the project**
   ```bash
   cd cutting-wood-optimizer
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173` (or the URL shown in terminal)

## Usage

### 1. Define Stock Materials
- Enter the dimensions (length × width) of your available sheets
- Set quantities for each sheet type
- Standard plywood: 1220 × 2440 mm

### 2. Add Required Parts
- Input dimensions for each part you need to cut
- Set quantities for multiple copies
- Add labels for easy identification (e.g., "Shelf", "Side Panel")

### 3. Configure Settings
- **Kerf**: Set your saw blade thickness (typically 3mm for circular saws)
- **Grain Direction**: Enable if wood grain orientation matters
- **Units**: Choose between mm, cm, or inches

### 4. Optimize
- Click "Calculate" to run the optimization
- Wait for the algorithm to find the best layout
- Review results and cutting diagrams

### 5. Use Results
- Follow the visual cutting diagrams
- Each part is color-coded and labeled
- Parts show position coordinates and dimensions
- Export results for workshop use

## Example Use Case

**Cabinet Making Project:**
- Stock: 20 sheets of 1220×2440mm plywood
- Parts needed:
  - 50 shelves (300×600mm)
  - 30 side panels (400×800mm)  
  - 10 backs (600×1200mm)
- Kerf: 3mm
- Result: Optimal cutting plan with minimal waste

## Technology Stack

- **Frontend**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: CSS3 with CSS Grid and Flexbox
- **Algorithm**: Custom 2D bin packing implementation
- **Visualization**: SVG-based cutting diagrams

## Project Structure

```
src/
├── App.tsx                 # Main application component
├── App.css                 # Styling
├── CuttingOptimizer.ts     # Core optimization algorithm
├── CuttingDiagram.tsx      # Visual diagram component
└── main.tsx               # Application entry point
```

## Algorithm Details

The optimization uses a **Bottom-Left Fill (BLF)** bin packing algorithm with the following features:

1. **Part Sorting**: Largest parts first for better efficiency
2. **Position Testing**: Tests positions from bottom-left, preferring lower coordinates
3. **Rotation Support**: Tries both orientations when grain direction allows
4. **Kerf Spacing**: Maintains minimum distance between parts for cutting
5. **Waste Calculation**: Identifies unused areas for remnant management

## Customization

### Adding New Features
- Modify `CuttingOptimizer.ts` for algorithm improvements
- Update `CuttingDiagram.tsx` for visualization enhancements
- Extend `App.tsx` for new UI features

### Styling
- Edit `App.css` for visual customizations
- Component styles are modular and clearly organized
- Responsive design included for mobile devices

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers with modern JavaScript support

## Performance

- Handles 100+ parts efficiently
- SVG diagrams scale well
- Responsive on mobile devices
- Optimized for modern browsers

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Roadmap

- [ ] Advanced nesting algorithms (genetic algorithm, simulated annealing)
- [ ] Remnant reuse functionality
- [ ] Material cost calculations
- [ ] Cloud save/load projects
- [ ] Multi-material optimization
- [ ] CNC G-code generation
- [ ] 3D visualization

---

**Happy cutting!** 🪚✨
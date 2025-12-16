# 🎓 USFQ Campus Tour Optimizer

An interactive web application for optimizing campus tours at Universidad San Francisco de Quito (USFQ). The tool uses optimization algorithms to find the best route that visits the maximum number of locations within a given time limit.

<img width="962" height="615" alt="Screenshot 2025-12-16 at 5 14 23 PM" src="https://github.com/user-attachments/assets/b506f0ad-2802-4bf0-ba0d-fbb838d0718f"/>

## ✨ Features

- **Interactive Visual Interface**: Campus map with nodes representing points of interest.
- **Starting Point Selection**: Click on any node to set it as the starting point.
- **Route Optimization**: Greedy algorithm that finds the best route considering available time.
- **Results Visualization**: Displays the optimized route with transition times between locations.
- **Flexible Configuration**: Adjust the time limit according to your needs.

## 🚀 Installation

1. Clone the repository:
```bash
git clone <https://github.com/rmandors/Campus-Tour-Optimization>
cd USFQ-campus-tour-optimization
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser at `http://localhost:5173`

## 📖 Usage

1. **Select Starting Point**: Click on any node on the map to set it as the starting point.
2. **Set Time Limit**: Enter the maximum available time (in minutes) in the corresponding field.
3. **Optimize Route**: Press the "Optimizar Ruta" button to calculate the best route.
4. **Review Results**: The solution will display:
   - Number of visited locations.
   - Total route time.
   - Detailed route list with transition times.

## 🛠️ Technologies

- **React 19** - UI Framework.
- **Vite** - Build Tool.
- **Tailwind CSS** - Styling.
- **Canvas API** - Map and route visualization.
- **Lucide React** - Icons.

## 📝 Customization

### Modify Points of Interest

Edit the `nodes` array in `src/App.jsx` to add, remove, or modify points of interest:

```javascript
const [nodes, setNodes] = useState([
  { id: 1, name: 'Main Entrance', x: 496, y: 675 },
  // Add more nodes here
]);
```

### Adjust Edge Weights

Modify the connection weights between nodes in the `useEffect` that initializes edges:

```javascript
const initialEdges = [
  { from: 1, to: 2, time: 3 },
  // Customize the times here
];
```

## 👥 Contributing

Contributions are welcome. Please open an issue or pull request for any improvements.


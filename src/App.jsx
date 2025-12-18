import { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Sparkles } from 'lucide-react';
import campusMap from './assets/USFQ_campus_map.png';

function App() {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [nodes, setNodes] = useState([
    { id: 1, name: 'Main Entrance', x: 496, y: 675 },
    { id: 2, name: 'Main Gardens', x: 421, y: 544 },
    { id: 3, name: 'Main Hall', x: 344, y: 379 },
    { id: 4, name: 'Calderón de la Barca Theater', x: 261, y: 396 },
    { id: 5, name: 'Restaurant', x: 231, y: 346 },
    { id: 6, name: 'Academic Plaza', x: 250, y: 295 },
    { id: 7, name: 'Pagoda', x: 806, y: 367 },
    { id: 8, name: 'Alexandros Coliseum', x: 902, y: 405 },
    { id: 9, name: 'Bridge', x: 1201, y: 544 },
    { id: 10, name: 'Hayek Complex', x: 1419, y: 511 },
    { id: 11, name: 'Shakespeare Theater', x: 1467, y: 435 },
    { id: 12, name: 'Dragon Shop', x: 1559, y: 547 }
  ]);
  
  const [edges, setEdges] = useState([]);
  const [timeLimit, setTimeLimit] = useState(30);
  const [solution, setSolution] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [startNode, setStartNode] = useState(null);
  const [currentTry, setCurrentTry] = useState(null);
  const [isFindingBest, setIsFindingBest] = useState(false);
  
  // Load background image
  useEffect(() => {
    const img = new Image();
    img.src = campusMap;
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
    };
  }, []);
  
  useEffect(() => {
    // Initialize with fixed edge weights - fully connected graph
    const initialEdges = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dist = Math.sqrt(
          Math.pow(nodes[i].x - nodes[j].x, 2) + 
          Math.pow(nodes[i].y - nodes[j].y, 2)
        );
        const time = Math.round(dist / 20); 
        
        initialEdges.push({
          from: nodes[i].id,
          to: nodes[j].id,
          time: time
        });
      }
    }
    
    // const initialEdges = [
    //   { from: 1, to: 2, time: 3 },
    //   { from: 1, to: 3, time: 5 },
    //   // ... add all your edges here
    // ];
    
    setEdges(initialEdges);
  }, []);
  
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background image if loaded 
    if (imageRef.current && imageLoaded) {
      ctx.save();
      ctx.globalAlpha = 0.8; 
      ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
    
    // Draw edges
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    edges.forEach(edge => {
      const from = nodes.find(n => n.id === edge.from);
      const to = nodes.find(n => n.id === edge.to);
      if (from && to) {
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
        
        const midX = (from.x + to.x) / 2;
        const midY = (from.y + to.y) / 2;
        ctx.fillStyle = '#999';
        ctx.font = '10px sans-serif';
        ctx.fillText(`${edge.time}min`, midX, midY);
      }
    });
    
    // Draw solution route
    if (solution) {
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 3;
      for (let i = 0; i < solution.route.length - 1; i++) {
        const from = nodes.find(n => n.id === solution.route[i]);
        const to = nodes.find(n => n.id === solution.route[i + 1]);
        if (from && to) {
          ctx.beginPath();
          ctx.moveTo(from.x, from.y);
          ctx.lineTo(to.x, to.y);
          ctx.stroke();
          
          // Arrow
          const angle = Math.atan2(to.y - from.y, to.x - from.x);
          const arrowSize = 10;
          ctx.beginPath();
          ctx.moveTo(to.x, to.y);
          ctx.lineTo(
            to.x - arrowSize * Math.cos(angle - Math.PI / 6),
            to.y - arrowSize * Math.sin(angle - Math.PI / 6)
          );
          ctx.lineTo(
            to.x - arrowSize * Math.cos(angle + Math.PI / 6),
            to.y - arrowSize * Math.sin(angle + Math.PI / 6)
          );
          ctx.closePath();
          ctx.fillStyle = '#3b82f6';
          ctx.fill();
        }
      }
    }
    
    // Draw nodes
    nodes.forEach((node, idx) => {
      const isInSolution = solution && solution.route.includes(node.id);
      const isStartNode = startNode === node.id;
      const isRouteStart = solution && solution.route[0] === node.id;
      const isRouteEnd = solution && solution.route.length > 0 && solution.route[solution.route.length - 1] === node.id && solution.route[0] === node.id && solution.route.length > 1;
      const isCurrentTry = currentTry && currentTry.nodeId === node.id;
      
      ctx.beginPath();
      ctx.arc(node.x, node.y, 20, 0, 2 * Math.PI);
      ctx.fillStyle = isCurrentTry ? '#a855f7' : isRouteStart ? '#10b981' : isInSolution ? '#3b82f6' : isStartNode ? '#fbbf24' : '#f3f4f6';
      ctx.fill();
      ctx.strokeStyle = isCurrentTry ? '#7c3aed' : isStartNode ? '#ef4444' : '#6b7280';
      ctx.lineWidth = isCurrentTry ? 4 : isStartNode ? 3 : 2;
      ctx.stroke();
      
      ctx.fillStyle = isInSolution || isRouteStart || isCurrentTry ? '#fff' : '#000';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.id.toString(), node.x, node.y);
    });
  }, [nodes, edges, solution, startNode, imageLoaded, currentTry]);
  
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);
  
  const generateDefaultEdges = () => {
    const newEdges = [];
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dist = Math.sqrt(
          Math.pow(nodes[i].x - nodes[j].x, 2) + 
          Math.pow(nodes[i].y - nodes[j].y, 2)
        );
        const time = Math.round(dist / 20);
        newEdges.push({
          from: nodes[i].id,
          to: nodes[j].id,
          time: time
        });
      }
    }
    setEdges(newEdges);
  };
  
  const getEdgeTime = (fromId, toId) => {
    const edge = edges.find(e => 
      (e.from === fromId && e.to === toId) || 
      (e.from === toId && e.to === fromId)
    );
    return edge ? edge.time : Infinity;
  };
  
  const greedyOrienteering = (startNodeId) => {
    const visited = new Set([startNodeId]);
    const route = [startNodeId];
    const transitionTimes = []; // Store time for each transition
    let currentNode = startNodeId;
    let totalTime = 0;
    
    while (true) {
      let bestNode = null;
      let bestTime = Infinity;
      
      for (const node of nodes) {
        if (visited.has(node.id)) continue;
        
        const travelTime = getEdgeTime(currentNode, node.id);
        // Reserve time for return trip to start
        const returnTime = getEdgeTime(node.id, startNodeId);
        if (totalTime + travelTime + returnTime > timeLimit) continue;
        
        // Choose closest unvisited node
        if (travelTime < bestTime) {
          bestTime = travelTime;
          bestNode = node.id;
        }
      }
      
      if (bestNode === null) break;
      
      visited.add(bestNode);
      route.push(bestNode);
      transitionTimes.push(bestTime); // Store the transition time
      totalTime += bestTime;
      currentNode = bestNode;
    }
    
    // Add return trip to starting node
    const returnTime = getEdgeTime(currentNode, startNodeId);
    if (totalTime + returnTime <= timeLimit) {
      route.push(startNodeId);
      transitionTimes.push(returnTime);
      totalTime += returnTime;
    }
    
    return { route, totalTime, totalValue: route.length, transitionTimes };
  };
  
  const optimize = () => {
    if (!startNode) {
      alert('Por favor, selecciona un punto de inicio haciendo click en un nodo.');
      return;
    }
    
    setIsRunning(true);
    setSolution(null);
    setCurrentTry(null);
    
    setTimeout(() => {
      const sol = greedyOrienteering(startNode);
      setSolution(sol);
      setIsRunning(false);
    }, 100);
  };

  const findBestRoute = async () => {
    setIsFindingBest(true);
    setSolution(null);
    setCurrentTry(null);
    setStartNode(null);
    
    let bestSolution = null;
    let bestScore = -1;
    
    // Try each node as a starting point
    for (let i = 0; i < nodes.length; i++) {
      const nodeId = nodes[i].id;
      setCurrentTry({ nodeId, index: i + 1, total: nodes.length });
      
      // Show visual feedback with a delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const sol = greedyOrienteering(nodeId);
      
      // Score based on number of places visited (prioritize more places)
      // If same number of places, prefer shorter time
      const score = sol.route.length * 1000 - sol.totalTime;
      
      if (score > bestScore) {
        bestScore = score;
        bestSolution = { ...sol, startNode: nodeId };
      }
      
      // Temporarily show this solution for visual feedback
      setSolution({ ...sol, startNode: nodeId });
    }
    
    // Set the best solution
    setSolution(bestSolution);
    setStartNode(bestSolution.startNode);
    setCurrentTry(null);
    setIsFindingBest(false);
  };
  
  
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    // Scale click coordinates to match canvas internal size
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    
    const clickedNode = nodes.find(n => 
      Math.sqrt(Math.pow(n.x - x, 2) + Math.pow(n.y - y, 2)) < 20
    );
    
    if (clickedNode) {
      setStartNode(clickedNode.id);
      setSolution(null); // Clear previous solution when changing start node
    }
  };

  return (
    <div className="w-full h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          🎓 Optimizador de Recorrido Campus USFQ
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Control panel */}
          <div className="space-y-3">
            <div className="bg-blue-50 p-3 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-2 text-sm">⚙️ Configuración</h3>
              
              <div className="mb-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Tiempo límite (min)
                </label>
                <input
                  type="number"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(parseInt(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded-md"
                />
              </div>
              
              <button
                onClick={optimize}
                disabled={isRunning || isFindingBest}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 disabled:bg-gray-400 mb-2"
              >
                <Play className="w-4 h-4" />
                {isRunning ? 'Calculando...' : 'Optimizar Ruta'}
              </button>
              
              <button
                onClick={findBestRoute}
                disabled={isRunning || isFindingBest}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 disabled:bg-gray-400"
              >
                <Sparkles className="w-4 h-4" />
                {isFindingBest ? 'Buscando mejor ruta...' : 'Encontrar Mejor Ruta'}
              </button>
            </div>
            
            {currentTry && (
              <div className="bg-purple-50 p-3 rounded-lg border-2 border-purple-300">
                <h3 className="font-semibold text-gray-700 mb-1 text-sm">🔄 Probando Rutas</h3>
                <p className="text-xs text-gray-600">
                  Probando nodo {currentTry.nodeId}: {nodes.find(n => n.id === currentTry.nodeId)?.name}
                </p>
                <p className="text-xs text-purple-600 mt-1">
                  {currentTry.index} de {currentTry.total}
                </p>
              </div>
            )}
            
            {startNode && !currentTry && (
              <div className="bg-yellow-50 p-3 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-1 text-sm">📍 Punto de Inicio</h3>
                <p className="text-xs text-gray-600">
                  Nodo {startNode}: {nodes.find(n => n.id === startNode)?.name}
                </p>
              </div>
            )}
            
            {solution && (
              <div className="bg-green-50 p-3 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-2 text-sm">✅ Solución</h3>
                <div className="space-y-1 text-xs">
                  <p><strong>Lugares visitados:</strong> {new Set(solution.route).size}</p>
                  <p><strong>Tiempo:</strong> {solution.totalTime} min</p>
                  <div className="mt-2">
                    <strong>Recorrido:</strong>
                    <ol className="mt-1 space-y-0.5 text-xs">
                      {solution.route.map((nodeId, idx) => {
                        const node = nodes.find(n => n.id === nodeId);
                        const transitionTime = solution.transitionTimes && solution.transitionTimes[idx - 1];
                        return (
                          <li key={idx} className="text-gray-700">
                            {idx + 1}. {node?.name}
                            {transitionTime !== undefined && idx > 0 && (
                              <span className="text-blue-600 ml-1">({transitionTime} min)</span>
                            )}
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Canvas */}
          <div className="lg:col-span-4">
            <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
              <canvas
                ref={canvasRef}
                width={1830}
                height={1222}
                onClick={handleCanvasClick}
                className="cursor-pointer w-full h-auto"
              />
            </div>
            <div className="mt-3 text-sm text-gray-600">
              <p><strong>Instrucciones:</strong></p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Haz clic en un nodo para seleccionarlo como punto de inicio.</li>
                <li>Selecciona el tiempo límite y presiona "Optimizar Ruta".</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

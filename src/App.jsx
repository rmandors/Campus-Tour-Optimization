import { useState, useEffect, useRef, useCallback } from 'react';
import { Play } from 'lucide-react';
import campusMap from './USFQ_campus_map.png';

function App() {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const [nodes, setNodes] = useState([
    { id: 1, name: 'Entrada Principal', x: 100, y: 200 },
    { id: 2, name: 'Biblioteca', x: 250, y: 150 },
    { id: 3, name: 'Cafetería', x: 400, y: 180 },
    { id: 4, name: 'Lab Computación', x: 350, y: 300 },
    { id: 5, name: 'Auditorio', x: 200, y: 350 },
    { id: 6, name: 'Gimnasio', x: 500, y: 250 }
  ]);
  
  const [edges, setEdges] = useState([]);
  const [timeLimit, setTimeLimit] = useState(30);
  const [solution, setSolution] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [startNode, setStartNode] = useState(null);
  
  // Load background image
  useEffect(() => {
    const img = new Image();
    img.src = campusMap;
    img.onload = () => {
      imageRef.current = img;
    };
  }, []);
  
  useEffect(() => {
    // Generate default edges only once on mount
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
    if (newEdges.length > 0) {
      setEdges(newEdges);
    }
  }, []);
  
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw background image if loaded with transparency
    if (imageRef.current) {
      ctx.save();
      ctx.globalAlpha = 0.8; // Make background 60% opaque (40% transparent)
      ctx.drawImage(imageRef.current, 0, 0, canvas.width, canvas.height);
      ctx.restore();
    }
    
    // Dibujar aristas
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
    
    // Dibujar ruta solución
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
          
          // Flecha
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
    
    // Dibujar nodos
    nodes.forEach((node, idx) => {
      const isInSolution = solution && solution.route.includes(node.id);
      const isStartNode = startNode === node.id;
      const isRouteStart = solution && solution.route[0] === node.id;
      
      ctx.beginPath();
      ctx.arc(node.x, node.y, 20, 0, 2 * Math.PI);
      ctx.fillStyle = isRouteStart ? '#10b981' : isInSolution ? '#3b82f6' : isStartNode ? '#fbbf24' : '#f3f4f6';
      ctx.fill();
      ctx.strokeStyle = isStartNode ? '#ef4444' : '#6b7280';
      ctx.lineWidth = isStartNode ? 3 : 2;
      ctx.stroke();
      
      ctx.fillStyle = isInSolution || isRouteStart ? '#fff' : '#000';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.id.toString(), node.x, node.y);
    });
  }, [nodes, edges, solution, startNode]);
  
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
    let currentNode = startNodeId;
    let totalTime = 0;
    
    while (true) {
      let bestNode = null;
      let bestTime = Infinity;
      
      for (const node of nodes) {
        if (visited.has(node.id)) continue;
        
        const travelTime = getEdgeTime(currentNode, node.id);
        if (totalTime + travelTime > timeLimit) continue;
        
        // Choose closest unvisited node (all nodes have equal importance)
        if (travelTime < bestTime) {
          bestTime = travelTime;
          bestNode = node.id;
        }
      }
      
      if (bestNode === null) break;
      
      visited.add(bestNode);
      route.push(bestNode);
      totalTime += bestTime;
      currentNode = bestNode;
    }
    
    return { route, totalTime, totalValue: route.length };
  };
  
  const optimize = () => {
    if (!startNode) {
      alert('Por favor selecciona un punto de inicio haciendo clic en un nodo');
      return;
    }
    
    setIsRunning(true);
    setSolution(null);
    
    setTimeout(() => {
      const sol = greedyOrienteering(startNode);
      setSolution(sol);
      setIsRunning(false);
    }, 100);
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
          🎓 Optimizador de Recorrido Campus
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Panel de control */}
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
                disabled={isRunning}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 disabled:bg-gray-400"
              >
                <Play className="w-4 h-4" />
                {isRunning ? 'Calculando...' : 'Optimizar Ruta'}
              </button>
            </div>
            
            {startNode && (
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
                  <p><strong>Lugares:</strong> {solution.route.length}</p>
                  <p><strong>Tiempo:</strong> {solution.totalTime} min</p>
                  <div className="mt-2">
                    <strong>Recorrido:</strong>
                    <ol className="mt-1 space-y-0.5 text-xs">
                      {solution.route.map((nodeId, idx) => {
                        const node = nodes.find(n => n.id === nodeId);
                        return (
                          <li key={idx} className="text-gray-700">
                            {idx + 1}. {node?.name}
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

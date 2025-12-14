import { useState, useEffect, useRef } from 'react';
import { Play, Plus, Trash2, Download, Upload } from 'lucide-react';

function App() {
  const canvasRef = useRef(null);
  const [nodes, setNodes] = useState([
    { id: 1, name: 'Entrada Principal', x: 100, y: 200, value: 10 },
    { id: 2, name: 'Biblioteca', x: 250, y: 150, value: 15 },
    { id: 3, name: 'Cafetería', x: 400, y: 180, value: 8 },
    { id: 4, name: 'Lab Computación', x: 350, y: 300, value: 12 },
    { id: 5, name: 'Auditorio', x: 200, y: 350, value: 10 },
    { id: 6, name: 'Gimnasio', x: 500, y: 250, value: 7 }
  ]);
  
  const [edges, setEdges] = useState([]);
  const [timeLimit, setTimeLimit] = useState(30);
  const [solution, setSolution] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const [mode, setMode] = useState('view'); // view, addNode, addEdge
  const [edgeStart, setEdgeStart] = useState(null);
  
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
  
  useEffect(() => {
    drawCanvas();
  }, [nodes, edges, solution, selectedNode, edgeStart]);
  
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
    let totalValue = nodes.find(n => n.id === startNodeId)?.value || 0;
    
    while (true) {
      let bestNode = null;
      let bestScore = -Infinity;
      let bestTime = 0;
      
      for (const node of nodes) {
        if (visited.has(node.id)) continue;
        
        const travelTime = getEdgeTime(currentNode, node.id);
        if (totalTime + travelTime > timeLimit) continue;
        
        const score = node.value / (travelTime + 1);
        
        if (score > bestScore) {
          bestScore = score;
          bestNode = node.id;
          bestTime = travelTime;
        }
      }
      
      if (bestNode === null) break;
      
      visited.add(bestNode);
      route.push(bestNode);
      totalTime += bestTime;
      totalValue += nodes.find(n => n.id === bestNode)?.value || 0;
      currentNode = bestNode;
    }
    
    return { route, totalTime, totalValue };
  };
  
  const optimize = () => {
    setIsRunning(true);
    setSolution(null);
    
    setTimeout(() => {
      let bestSolution = null;
      
      for (const startNode of nodes) {
        const sol = greedyOrienteering(startNode.id);
        if (!bestSolution || sol.totalValue > bestSolution.totalValue) {
          bestSolution = sol;
        }
      }
      
      setSolution(bestSolution);
      setIsRunning(false);
    }, 100);
  };
  
  const drawCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
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
    
    // Línea temporal para nueva arista
    if (edgeStart) {
      const startNode = nodes.find(n => n.id === edgeStart);
      if (startNode) {
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(startNode.x, startNode.y);
        ctx.lineTo(startNode.x + 50, startNode.y + 50);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    }
    
    // Dibujar nodos
    nodes.forEach((node, idx) => {
      const isInSolution = solution && solution.route.includes(node.id);
      const isStart = solution && solution.route[0] === node.id;
      const isSelected = selectedNode === node.id;
      
      ctx.beginPath();
      ctx.arc(node.x, node.y, 20, 0, 2 * Math.PI);
      ctx.fillStyle = isStart ? '#10b981' : isInSolution ? '#3b82f6' : '#f3f4f6';
      ctx.fill();
      ctx.strokeStyle = isSelected ? '#ef4444' : '#6b7280';
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.stroke();
      
      ctx.fillStyle = isInSolution || isStart ? '#fff' : '#000';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.id.toString(), node.x, node.y);
      
      ctx.fillStyle = '#000';
      ctx.font = '11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(node.name, node.x, node.y - 30);
      ctx.fillText(`(${node.value}pts)`, node.x, node.y + 30);
    });
  };
  
  const handleCanvasClick = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const clickedNode = nodes.find(n => 
      Math.sqrt(Math.pow(n.x - x, 2) + Math.pow(n.y - y, 2)) < 20
    );
    
    if (mode === 'addNode' && !clickedNode) {
      const newNode = {
        id: Math.max(...nodes.map(n => n.id), 0) + 1,
        name: `Lugar ${nodes.length + 1}`,
        x: x,
        y: y,
        value: 10
      };
      setNodes([...nodes, newNode]);
    } else if (mode === 'addEdge') {
      if (clickedNode) {
        if (edgeStart === null) {
          setEdgeStart(clickedNode.id);
        } else if (edgeStart !== clickedNode.id) {
          const existingEdge = edges.find(e =>
            (e.from === edgeStart && e.to === clickedNode.id) ||
            (e.from === clickedNode.id && e.to === edgeStart)
          );
          
          if (!existingEdge) {
            const time = prompt('Tiempo en minutos:', '5');
            if (time) {
              setEdges([...edges, {
                from: edgeStart,
                to: clickedNode.id,
                time: parseInt(time)
              }]);
            }
          }
          setEdgeStart(null);
        }
      }
    } else if (mode === 'view' && clickedNode) {
      setSelectedNode(clickedNode.id);
    }
  };
  
  const deleteNode = () => {
    if (selectedNode) {
      setNodes(nodes.filter(n => n.id !== selectedNode));
      setEdges(edges.filter(e => e.from !== selectedNode && e.to !== selectedNode));
      setSelectedNode(null);
    }
  };
  
  const updateNodeName = (id, newName) => {
    setNodes(nodes.map(n => n.id === id ? { ...n, name: newName } : n));
  };
  
  const updateNodeValue = (id, newValue) => {
    setNodes(nodes.map(n => n.id === id ? { ...n, value: parseInt(newValue) || 0 } : n));
  };
  
  const exportData = () => {
    const data = { nodes, edges, timeLimit };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'campus_tour.json';
    a.click();
  };
  
  const importData = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const data = JSON.parse(event.target.result);
          if (data.nodes) setNodes(data.nodes);
          if (data.edges) setEdges(data.edges);
          if (data.timeLimit) setTimeLimit(data.timeLimit);
        } catch (error) {
          alert('Error al importar archivo');
        }
      };
      reader.readAsText(file);
    }
  };

  return (
    <div className="w-full h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          🎓 Optimizador de Recorrido Campus
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel de control */}
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-3">⚙️ Configuración</h3>
              
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tiempo límite (minutos)
                </label>
                <input
                  type="number"
                  value={timeLimit}
                  onChange={(e) => setTimeLimit(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
              
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Modo
                </label>
                <div className="space-y-2">
                  <button
                    onClick={() => { setMode('view'); setEdgeStart(null); }}
                    className={`w-full px-3 py-2 rounded ${mode === 'view' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
                  >
                    👁️ Ver/Seleccionar
                  </button>
                  <button
                    onClick={() => { setMode('addNode'); setEdgeStart(null); }}
                    className={`w-full px-3 py-2 rounded ${mode === 'addNode' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
                  >
                    <Plus className="inline w-4 h-4" /> Añadir Lugar
                  </button>
                  <button
                    onClick={() => { setMode('addEdge'); setEdgeStart(null); }}
                    className={`w-full px-3 py-2 rounded ${mode === 'addEdge' ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}
                  >
                    🔗 Conectar Lugares
                  </button>
                </div>
              </div>
              
              <button
                onClick={optimize}
                disabled={isRunning}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-semibold flex items-center justify-center gap-2 disabled:bg-gray-400"
              >
                <Play className="w-5 h-5" />
                {isRunning ? 'Calculando...' : 'Optimizar Ruta'}
              </button>
              
              <div className="flex gap-2 mt-3">
                <button
                  onClick={exportData}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded text-sm flex items-center justify-center gap-1"
                >
                  <Download className="w-4 h-4" /> Exportar
                </button>
                <label className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded text-sm flex items-center justify-center gap-1 cursor-pointer">
                  <Upload className="w-4 h-4" /> Importar
                  <input type="file" accept=".json" onChange={importData} className="hidden" />
                </label>
              </div>
            </div>
            
            {selectedNode && (
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-3">📍 Nodo Seleccionado</h3>
                {nodes.find(n => n.id === selectedNode) && (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={nodes.find(n => n.id === selectedNode).name}
                      onChange={(e) => updateNodeName(selectedNode, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Nombre del lugar"
                    />
                    <input
                      type="number"
                      value={nodes.find(n => n.id === selectedNode).value}
                      onChange={(e) => updateNodeValue(selectedNode, e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Valor (puntos)"
                    />
                    <button
                      onClick={deleteNode}
                      className="w-full bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-4 h-4" /> Eliminar
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {solution && (
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-3">✅ Solución</h3>
                <div className="space-y-2 text-sm">
                  <p><strong>Lugares visitados:</strong> {solution.route.length}</p>
                  <p><strong>Tiempo total:</strong> {solution.totalTime} min</p>
                  <p><strong>Valor total:</strong> {solution.totalValue} puntos</p>
                  <div className="mt-3">
                    <strong>Recorrido:</strong>
                    <ol className="mt-2 space-y-1">
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
          <div className="lg:col-span-2">
            <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
              <canvas
                ref={canvasRef}
                width={700}
                height={500}
                onClick={handleCanvasClick}
                className="cursor-crosshair"
              />
            </div>
            <div className="mt-3 text-sm text-gray-600">
              <p><strong>Instrucciones:</strong></p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Modo Ver: Click en un nodo para seleccionarlo</li>
                <li>Modo Añadir: Click en el canvas para crear un lugar</li>
                <li>Modo Conectar: Click en dos nodos para conectarlos</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;

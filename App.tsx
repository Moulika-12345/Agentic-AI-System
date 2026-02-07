
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { 
  Activity, 
  Brain, 
  Database, 
  Layers, 
  ShieldCheck, 
  Wrench, 
  Play, 
  RefreshCcw, 
  Terminal as TerminalIcon,
  ChevronRight,
  Zap,
  Cpu,
  History,
  Info,
  Search,
  ArrowRightLeft,
  FileText,
  X,
  AlertTriangle,
  CheckCircle2,
  Navigation
} from 'lucide-react';
import { AgentRole, AgentMessage, Scenario, MemoryEntry, Tool } from './types';
import { simulateAgentReasoning } from './services/geminiService';

const SCENARIOS: Scenario[] = [
  {
    id: 'weather',
    title: 'Smart Weather Alerts',
    description: 'Automatic help during bad weather.',
    icon: 'CloudRain',
    problemDefinition: 'A big storm is coming to a city. The AI needs to automatically turn off power in dangerous areas and tell people to move to safety using current map locations.',
    interviewContext: 'Shows how AI handles fast data and works together safely.'
  },
  {
    id: 'syslog',
    title: 'Automatic Computer Fixer',
    description: 'Finding and fixing computer errors.',
    icon: 'Terminal',
    problemDefinition: 'A website is showing errors. The AI must look at logs, find the broken part, and restart it automatically to fix the site.',
    interviewContext: 'Shows how AI solves technical problems by looking at past fixes.'
  },
  {
    id: 'ecommerce',
    title: 'Shopping Helper',
    description: 'Smart stock and price management.',
    icon: 'ShoppingBag',
    problemDefinition: 'A toy becomes very popular on social media. The AI needs to see it is selling fast, order more, and change the price to make the most money.',
    interviewContext: 'Shows how AI plans long steps and makes good business choices.'
  }
];

const INITIAL_TOOLS: Tool[] = [
  { name: 'Smart_Search', description: 'Looks at past information', status: 'idle' },
  { name: 'Web_Connector', description: 'Sends messages to other apps', status: 'idle' },
  { name: 'Server_Control', description: 'Manages computer systems', status: 'idle' },
  { name: 'Price_Tracker', description: 'Checks money and shop trends', status: 'idle' }
];

const AGENT_POSITIONS: Record<AgentRole, { x: number, y: number }> = {
  [AgentRole.PLANNER]: { x: 16.6, y: 20 },
  [AgentRole.REASONING]: { x: 50, y: 20 },
  [AgentRole.TOOL_EXECUTOR]: { x: 83.3, y: 20 },
  [AgentRole.ORCHESTRATOR]: { x: 50, y: 50 },
  [AgentRole.MEMORY]: { x: 16.6, y: 80 },
  [AgentRole.CRITIC]: { x: 83.3, y: 80 }
};

const App: React.FC = () => {
  const [activeScenario, setActiveScenario] = useState<Scenario>(SCENARIOS[0]);
  const [logs, setLogs] = useState<AgentMessage[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [currentAgent, setCurrentAgent] = useState<AgentRole>(AgentRole.ORCHESTRATOR);
  const [activeLink, setActiveLink] = useState<{ from: AgentRole, to: AgentRole } | null>(null);
  const [showDocModal, setShowDocModal] = useState(false);
  const [tools, setTools] = useState<Tool[]>(INITIAL_TOOLS);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
        (err) => console.warn("Location not found", err)
      );
    }
  }, []);

  const addLog = useCallback((from: AgentRole, to: AgentRole, content: string, type: AgentMessage['type']) => {
    const newMsg: AgentMessage = {
      id: Math.random().toString(36).substring(7),
      from,
      to,
      content,
      timestamp: Date.now(),
      type
    };
    setLogs(prev => [...prev, newMsg]);
    setActiveLink({ from, to });
    setTimeout(() => setActiveLink(prev => (prev?.from === from && prev?.to === to ? null : prev)), 1200);
  }, []);

  const updateToolStatus = useCallback((name: string, status: Tool['status']) => {
    setTools(prev => prev.map(t => t.name === name || (name === 'all' && status === 'idle') ? { ...t, status } : t));
  }, []);

  const addMemory = useCallback((type: MemoryEntry['type'], data: string) => {
    setMemories(prev => [{
      id: Math.random().toString(36).substring(7),
      type,
      data,
      timestamp: Date.now()
    }, ...prev].slice(0, 10));
  }, []);

  const runAgentStep = async (role: AgentRole) => {
    setCurrentAgent(role);
    if (role === AgentRole.TOOL_EXECUTOR) {
      updateToolStatus('Web_Connector', 'executing');
      await new Promise(r => setTimeout(r, 800));
    }
    const result = await simulateAgentReasoning(activeScenario.title, role, logs.slice(-10), userLocation || undefined);
    addLog(role, AgentRole.ORCHESTRATOR, result.thought, result.confidence < 0.5 ? 'feedback' : 'thought');
    if (result.action) {
      addLog(role, AgentRole.TOOL_EXECUTOR, `Action: ${result.action}`, 'action');
      if (role === AgentRole.TOOL_EXECUTOR) updateToolStatus('Web_Connector', 'idle');
    }
    if (result.memoryRef) addMemory(result.memoryRef as any, result.thought);
    return result;
  };

  const startSimulation = async () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setLogs([]);
    setMemories([]);
    updateToolStatus('all', 'idle');
    try {
      addLog(AgentRole.ORCHESTRATOR, AgentRole.PLANNER, `Starting: ${activeScenario.title}. Task: Fix the problem automatically.`, 'goal');
      setCurrentAgent(AgentRole.MEMORY);
      addLog(AgentRole.MEMORY, AgentRole.PLANNER, "Looking at past notes to find a way to help...", "observation");
      await new Promise(r => setTimeout(r, 1000));
      addMemory('long-term', `Finding useful ways to solve ${activeScenario.id}...`);
      let loopCount = 0;
      let solved = false;
      while (!solved && loopCount < 3) {
        loopCount++;
        await runAgentStep(AgentRole.PLANNER);
        await new Promise(r => setTimeout(r, 1000));
        await runAgentStep(AgentRole.REASONING);
        await new Promise(r => setTimeout(r, 1000));
        await runAgentStep(AgentRole.TOOL_EXECUTOR);
        await new Promise(r => setTimeout(r, 1000));
        const critique = await runAgentStep(AgentRole.CRITIC);
        if (critique.confidence >= 0.8) {
          solved = true;
          addLog(AgentRole.ORCHESTRATOR, AgentRole.ORCHESTRATOR, "Check: Everything looks good. Work finished.", "observation");
        } else {
          addLog(AgentRole.CRITIC, AgentRole.PLANNER, `Try Again: Confidence too low (${critique.confidence}). Making a better plan.`, "feedback");
          await new Promise(r => setTimeout(r, 1500));
        }
      }
      if (!solved) addLog(AgentRole.ORCHESTRATOR, AgentRole.ORCHESTRATOR, "Stopped: Tried many times but need a human to check.", "feedback");
    } catch (err) {
      addLog(AgentRole.CRITIC, AgentRole.ORCHESTRATOR, "Error: Something went wrong. Fixing automatically.", "feedback");
    } finally {
      setIsSimulating(false);
      setCurrentAgent(AgentRole.ORCHESTRATOR);
    }
  };

  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [logs]);
  const lastMsg = useMemo(() => logs[logs.length - 1], [logs]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-100 selection:bg-indigo-500/30">
      <header className="h-16 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 rounded-lg shadow-lg shadow-indigo-500/20"><Layers className="w-6 h-6 text-white" /></div>
          <div>
            <h1 className="font-bold text-lg tracking-tight uppercase">Nexus AI Team</h1>
            <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">Smart AI System v5.0.0</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => setShowDocModal(true)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-all" title="How it works"><FileText className="w-5 h-5" /></button>
          {userLocation && (
            <div className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-3 py-1 text-[10px] text-indigo-400 font-mono">
              <Navigation className="w-3 h-3" />
              <span>Map: {userLocation.latitude.toFixed(2)}, {userLocation.longitude.toFixed(2)}</span>
            </div>
          )}
          <div className="flex items-center gap-2 bg-slate-800 rounded-full px-3 py-1 border border-slate-700/50">
            <div className={`w-2 h-2 rounded-full ${isSimulating ? 'bg-green-500 animate-pulse shadow-[0_0_8px_#22c55e]' : 'bg-slate-500'}`} />
            <span className="text-xs font-mono uppercase text-slate-300 tracking-tighter">{isSimulating ? 'Working' : 'Ready'}</span>
          </div>
          <button onClick={startSimulation} disabled={isSimulating} className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-all ${isSimulating ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 border border-indigo-400/30'}`}>
            {isSimulating ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
            {isSimulating ? 'Running...' : 'Start Now'}
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <nav className="w-80 border-r border-slate-800 bg-slate-900/30 overflow-y-auto p-4 flex flex-col gap-4 shrink-0">
          <div className="flex items-center gap-2 px-2 text-slate-400 mb-2"><Zap className="w-4 h-4" /><h2 className="text-xs font-bold uppercase tracking-widest">Pick a Task</h2></div>
          {SCENARIOS.map((s) => (
            <button key={s.id} onClick={() => !isSimulating && setActiveScenario(s)} className={`p-4 rounded-xl text-left transition-all border group relative ${activeScenario.id === s.id ? 'bg-indigo-900/20 border-indigo-500/50 shadow-inner shadow-indigo-500/10' : 'bg-slate-900 border-transparent hover:border-slate-700'}`}>
              <div className="flex items-center justify-between mb-2">
                 <div className={`p-2 rounded-lg ${activeScenario.id === s.id ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'}`}>
                    {s.id === 'weather' && <Activity className="w-5 h-5" />}
                    {s.id === 'syslog' && <TerminalIcon className="w-5 h-5" />}
                    {s.id === 'ecommerce' && <Activity className="w-5 h-5 rotate-90" />}
                 </div>
                 {activeScenario.id === s.id && <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />}
              </div>
              <h3 className={`font-semibold text-sm ${activeScenario.id === s.id ? 'text-indigo-300' : 'text-slate-300'}`}>{s.title}</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{s.description}</p>
            </button>
          ))}
          <div className="mt-8 border-t border-slate-800 pt-6">
            <div className="flex items-center gap-2 px-2 text-slate-400 mb-4"><Wrench className="w-4 h-4" /><h2 className="text-xs font-bold uppercase tracking-widest">Tools We Use</h2></div>
            <div className="space-y-3">
              {tools.map((t) => (
                <div key={t.name} className="flex items-center justify-between px-3 py-2 bg-slate-900 rounded-lg border border-slate-800/50 group hover:border-indigo-500/30 transition-all">
                  <div className="flex flex-col"><span className="text-[11px] font-mono text-slate-300">{t.name}</span><span className="text-[8px] text-slate-600 font-mono truncate max-w-[120px]">{t.description}</span></div>
                  <div className={`w-2 h-2 rounded-full ${t.status === 'executing' ? 'bg-indigo-500 animate-ping shadow-[0_0_8px_rgba(79,70,229,0.8)]' : 'bg-slate-700'}`} />
                </div>
              ))}
            </div>
          </div>
        </nav>

        <div className="flex-1 flex flex-col bg-slate-950 p-6 overflow-hidden">
          <section className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6 mb-6 shadow-2xl relative overflow-hidden group shrink-0">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 blur-[100px] -z-10 group-hover:bg-indigo-600/10 transition-all duration-700" />
            <div className="flex items-start gap-4">
              <div className="p-3 bg-slate-800 rounded-xl border border-slate-700 shadow-xl"><Info className="w-6 h-6 text-indigo-400" /></div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded border border-indigo-500/20 uppercase tracking-widest">Problem Details</span>
                    <span className="text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 uppercase tracking-widest flex items-center gap-1"><Search className="w-3 h-3" /> SMART_CHECK</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">ID: {activeScenario.id.toUpperCase()}</span>
                </div>
                <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">{activeScenario.title}</h2>
                <p className="text-slate-400 text-sm leading-relaxed max-w-4xl font-light">{activeScenario.problemDefinition}</p>
              </div>
            </div>
          </section>

          <div className="flex-1 grid grid-cols-12 gap-6 overflow-hidden">
            <div className="col-span-12 lg:col-span-7 flex flex-col gap-4 overflow-hidden">
              <div className="flex-1 bg-slate-900/40 border border-slate-800 rounded-2xl p-6 flex flex-col relative overflow-hidden shadow-inner shadow-black/20">
                <div className="flex items-center justify-between mb-4">
                   <div className="flex items-center gap-2"><Brain className="w-5 h-5 text-indigo-400" /><h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">How They Talk</h3></div>
                   <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500"><span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_5px_rgba(79,70,229,1)]" /> ACTIVE</span><span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-700" /> SLEEPING</span></div>
                </div>
                <div className="flex-1 relative flex items-center justify-center min-h-[400px]">
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" xmlns="http://www.w3.org/2000/svg">
                    <defs><filter id="glow"><feGaussianBlur stdDeviation="2.5" result="coloredBlur"/><feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
                    {Object.keys(AGENT_POSITIONS).map((roleFrom) => Object.keys(AGENT_POSITIONS).map((roleTo) => { if (roleFrom === roleTo) return null; const from = AGENT_POSITIONS[roleFrom as AgentRole]; const to = AGENT_POSITIONS[roleTo as AgentRole]; return <line key={`${roleFrom}-${roleTo}-base`} x1={`${from.x}%`} y1={`${from.y}%`} x2={`${to.x}%`} y2={`${to.y}%`} stroke="rgba(71, 85, 105, 0.15)" strokeWidth="1" />; }))}
                    {activeLink && (() => { const from = AGENT_POSITIONS[activeLink.from]; const to = AGENT_POSITIONS[activeLink.to]; return ( <g className="animate-in fade-in duration-300"> <line x1={`${from.x}%`} y1={`${from.y}%`} x2={`${to.x}%`} y2={`${to.y}%`} stroke="#6366f1" strokeWidth="2" filter="url(#glow)" strokeDasharray="10 5" className="animate-[dash_1s_linear_infinite]" /> <circle r="4" fill="#818cf8" filter="url(#glow)"><animate attributeName="cx" from={`${from.x}%`} to={`${to.x}%`} dur="0.8s" repeatCount="indefinite" /><animate attributeName="cy" from={`${from.y}%`} to={`${to.y}%`} dur="0.8s" repeatCount="indefinite" /></circle> </g> ); })()}
                  </svg>
                  <div className="grid grid-cols-3 gap-12 relative z-10 w-full px-12">
                    <AgentNode role={AgentRole.PLANNER} active={currentAgent === AgentRole.PLANNER} icon={<Layers />} />
                    <AgentNode role={AgentRole.REASONING} active={currentAgent === AgentRole.REASONING} icon={<Brain />} />
                    <AgentNode role={AgentRole.TOOL_EXECUTOR} active={currentAgent === AgentRole.TOOL_EXECUTOR} icon={<Wrench />} />
                    <div className="col-span-3 flex justify-center py-4"><AgentNode role={AgentRole.ORCHESTRATOR} active={currentAgent === AgentRole.ORCHESTRATOR} icon={<Cpu />} /></div>
                    <AgentNode role={AgentRole.MEMORY} active={currentAgent === AgentRole.MEMORY} icon={<Database />} />
                    <div /><AgentNode role={AgentRole.CRITIC} active={currentAgent === AgentRole.CRITIC} icon={<ShieldCheck />} />
                  </div>
                </div>
              </div>
              <div className="h-56 bg-slate-900/40 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3 shadow-inner shadow-black/20 overflow-hidden">
                 <div className="flex items-center justify-between text-slate-400 shrink-0"><div className="flex items-center gap-2"><History className="w-4 h-4 text-indigo-400" /><h3 className="text-xs font-bold uppercase tracking-wider">Storage & Past Experiences</h3></div><span className="text-[10px] font-mono text-slate-600">{memories.length} notes</span></div>
                 <div className="flex-1 overflow-y-auto space-y-2 scrollbar-hide">
                   {memories.length === 0 ? (<div className="h-full flex flex-col items-center justify-center text-slate-600 gap-2 opacity-60"><Search className="w-8 h-8 animate-pulse" /><p className="text-[10px] font-mono uppercase">Notebook is empty...</p></div>) : (memories.map((m) => (
                       <div key={m.id} className={`flex items-start gap-3 bg-slate-800/50 border border-slate-700/30 rounded-lg px-3 py-2 animate-in fade-in slide-in-from-left-2 ${m.type === 'long-term' ? 'border-l-2 border-l-indigo-500' : ''}`}>
                         <div className={`mt-0.5 text-[9px] font-bold font-mono px-1.5 py-0.5 rounded uppercase tracking-tighter shrink-0 ${m.type === 'short-term' ? 'bg-amber-500/10 text-amber-500' : m.type === 'long-term' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-purple-500/10 text-purple-500'}`}>{m.type === 'episodic' ? 'PAST' : m.type === 'long-term' ? 'SMART' : 'FAST'}</div>
                         <div className="text-[11px] text-slate-400 font-mono leading-relaxed flex-1">{m.data}</div>
                         <div className="text-[9px] text-slate-600 font-mono shrink-0">{new Date(m.timestamp).toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' })}</div>
                       </div>
                   )))}
                 </div>
              </div>
            </div>
            <div className="col-span-12 lg:col-span-5 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              <div className="h-10 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-900/80">
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-red-500/80" /><div className="w-2.5 h-2.5 rounded-full bg-amber-500/80" /><div className="w-2.5 h-2.5 rounded-full bg-green-500/80" /></div>
                <div className="flex items-center gap-2 text-slate-500"><TerminalIcon className="w-3.5 h-3.5" /><span className="text-[10px] font-mono uppercase tracking-widest">AI Thoughts</span></div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 font-mono text-sm flex flex-col gap-4 scrollbar-hide">
                {logs.length === 0 && (<div className="h-full flex flex-col items-center justify-center text-slate-600 gap-4 opacity-50"><Cpu className="w-12 h-12 text-slate-800 animate-pulse" /><p className="text-[10px] font-bold uppercase tracking-widest">Team is waiting</p></div>)}
                {logs.map((log) => (
                  <div key={log.id} className={`flex flex-col gap-1 p-3 rounded-lg border transition-all duration-300 ${log.type === 'goal' ? 'bg-indigo-500/5 border-indigo-500/20' : log.type === 'feedback' ? 'bg-red-500/5 border-red-500/20' : log.type === 'thought' ? 'bg-slate-800/50 border-slate-700/50' : log.type === 'action' ? 'bg-emerald-500/5 border-emerald-500/20 shadow-inner' : 'bg-slate-800/30 border-slate-800/50'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2"><span className={`text-[10px] font-bold uppercase ${log.from === AgentRole.PLANNER ? 'text-indigo-400' : 'text-slate-500'}`}>{log.from}</span><ChevronRight className="w-2.5 h-2.5 text-slate-600" /><span className="text-[10px] font-bold text-slate-500 uppercase">{log.to}</span></div>
                      <div className="flex items-center gap-2"> {log.type === 'feedback' && <AlertTriangle className="w-3 h-3 text-red-500" />} {log.type === 'action' && <CheckCircle2 className="w-3 h-3 text-emerald-500" />} <span className={`text-[9px] font-bold uppercase tracking-tighter px-1.5 py-0.5 rounded ${log.type === 'goal' ? 'bg-indigo-500/20 text-indigo-400' : log.type === 'feedback' ? 'bg-red-500/20 text-red-400' : log.type === 'action' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>{log.type}</span></div>
                    </div>
                    <p className={`text-xs leading-relaxed font-mono ${log.type === 'goal' ? 'text-indigo-100' : log.type === 'feedback' ? 'text-red-200 italic' : log.type === 'action' ? 'text-emerald-100 font-bold' : 'text-slate-300'}`}>{log.content}</p>
                  </div>
                ))}
                <div ref={logEndRef} />
              </div>
            </div>
          </div>
        </div>
      </main>

      {showDocModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-sm bg-slate-950/60 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-4xl max-h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="h-14 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/50 shrink-0">
              <div className="flex items-center gap-2"><FileText className="w-5 h-5 text-indigo-400" /><h2 className="font-bold text-sm uppercase tracking-widest text-slate-200">AI Team Concepts Summary</h2></div>
              <button onClick={() => setShowDocModal(false)} className="p-1 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-white transition-all"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-8 text-slate-300 scrollbar-hide">
              <div className="space-y-8">
                <section>
                  <h3 className="text-indigo-400 font-bold uppercase tracking-widest text-xs mb-4">🤖 1. The AI Team (Multi-Agent System)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50"><strong>Leader (Orchestrator):</strong> Controls the team and shares info.</div>
                    <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50"><strong>Goal Setter (Planner):</strong> Breaks problems into easy steps.</div>
                    <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50"><strong>Thinker (Reasoning):</strong> Decides the best logic to use.</div>
                    <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50"><strong>Worker (Tool Executor):</strong> Uses real tools to finish tasks.</div>
                    <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50"><strong>Storage (Memory):</strong> Keeps track of all info and history.</div>
                    <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50"><strong>Checker (Critic):</strong> Looks for errors and forces fixes.</div>
                  </div>
                </section>

                <section>
                  <h3 className="text-indigo-400 font-bold uppercase tracking-widest text-xs mb-4">🧠 2. Smart Memory Types</h3>
                  <ul className="space-y-2 text-sm list-disc pl-5">
                    <li><strong>Fast Notes (Short-term):</strong> Remembers current talk.</li>
                    <li><strong>Smart Search (Long-term / RAG):</strong> Finds helpful tips from past libraries.</li>
                    <li><strong>Past Events (Episodic):</strong> Learns from history so it never repeats mistakes.</li>
                  </ul>
                </section>

                <section>
                  <h3 className="text-indigo-400 font-bold uppercase tracking-widest text-xs mb-4">✨ 3. Advanced Features</h3>
                  <div className="space-y-3 text-sm">
                    <p>• <strong>Self-Fixing:</strong> If a worker fails, the team makes a new plan automatically.</p>
                    <p>• <strong>Thought Stream:</strong> See every thought the AI has in real-time.</p>
                    <p>• <strong>Smart Confidence:</strong> AI only finishes when it's at least 80% sure it is correct.</p>
                  </div>
                </section>
              </div>
            </div>
            <div className="p-4 bg-slate-900/80 border-t border-slate-800 flex justify-end shrink-0">
               <button onClick={() => setShowDocModal(false)} className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold text-xs transition-all">Close Docs</button>
            </div>
          </div>
        </div>
      )}

      <footer className="h-20 bg-slate-900 border-t border-slate-800 px-6 flex items-center justify-between text-slate-400 shrink-0">
         <div className="flex items-center gap-8"><div className="flex flex-col"><span className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-1">System Health</span><div className="flex items-center gap-4 text-xs font-semibold"><div className="flex items-center gap-1.5 text-indigo-400"><CheckCircle2 className="w-3.5 h-3.5" /><span>Self-Healing ON</span></div><span className="text-slate-700">|</span><div className="flex items-center gap-1.5 text-indigo-400"><History className="w-3.5 h-3.5" /><span>Saving Experiences</span></div></div></div></div>
         <div className="max-w-xl text-right"><span className="text-[10px] uppercase tracking-widest font-bold text-indigo-500 mb-1 block flex items-center justify-end gap-1"><Brain className="w-3 h-3" /> Tip</span><p className="text-[11px] leading-tight text-slate-500 italic">"{activeScenario.interviewContext}"</p></div>
      </footer>
      <style>{`@keyframes dash { to { stroke-dashoffset: -100; } }`}</style>
    </div>
  );
};

const AgentNode: React.FC<{ role: AgentRole, active: boolean, icon: React.ReactNode }> = ({ role, active, icon }) => (
  <div className="flex flex-col items-center gap-2 group">
    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 border-2 relative ${active ? 'bg-indigo-600 border-indigo-400 shadow-[0_0_30px_-5px_rgba(79,70,229,0.8)] scale-110 z-20' : 'bg-slate-800 border-slate-700 opacity-40 grayscale group-hover:opacity-100 group-hover:grayscale-0'}`}>
      {active && <div className="absolute inset-0 bg-indigo-500 rounded-2xl animate-ping opacity-20" />}
      {React.isValidElement(icon) ? React.cloneElement(icon as React.ReactElement<any>, { className: `w-8 h-8 ${active ? 'text-white' : 'text-slate-500'}` }) : icon}
    </div>
    <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors ${active ? 'text-indigo-300' : 'text-slate-500'}`}>{role}</span>
  </div>
);

export default App;

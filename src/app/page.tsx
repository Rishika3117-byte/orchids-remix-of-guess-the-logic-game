"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Play, 
  Settings, 
  Volume2, 
  VolumeX, 
  Trophy, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  RotateCcw,
  Gamepad2,
  Lock,
  Star,
  Sparkles,
  Lightbulb
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LEVELS, Level } from "@/lib/game-data";
import { soundManager } from "@/lib/sounds";
import { cn } from "@/lib/utils";

type GameState = "home" | "levels" | "playing" | "summary";

const ANIME_CHARACTERS = {
  thinking: "https://api.dicebear.com/7.x/adventurer/svg?seed=thinking&backgroundColor=b6e3f4",
  happy: "https://api.dicebear.com/7.x/adventurer/svg?seed=happy&backgroundColor=b6e3f4",
  sad: "https://api.dicebear.com/7.x/adventurer/svg?seed=sad&backgroundColor=b6e3f4",
  guide: "https://api.dicebear.com/7.x/adventurer/svg?seed=Felix&backgroundColor=b6e3f4"
};

export default function GuessTheLogicGame() {
  const [gameState, setGameState] = useState<GameState>("home");
  const [currentLevelIndex, setCurrentLevelIndex] = useState(0);
  const [unlockedLevels, setUnlockedLevels] = useState<number[]>([1]);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [userInput, setUserInput] = useState("");
  const [feedback, setFeedback] = useState<"correct" | "wrong" | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(false);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [bgImage, setBgImage] = useState("https://images.unsplash.com/photo-1542332213-9b5a5a3fab35?q=80&w=2070&auto=format&fit=crop");

  // Rotate backgrounds
  useEffect(() => {
    const bgs = [
      "https://images.unsplash.com/photo-1542332213-9b5a5a3fab35?q=80&w=2070&auto=format&fit=crop", // Forest
      "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=2070&auto=format&fit=crop", // Waterfall
      "https://images.unsplash.com/photo-1614728263952-84ea256f9679?q=80&w=2070&auto=format&fit=crop", // Cyberpunk
      "https://images.unsplash.com/photo-1578632738908-45244a17fe45?q=80&w=2070&auto=format&fit=crop", // Temple
      "https://images.unsplash.com/photo-1533107862482-0e6974b06ec4?q=80&w=2070&auto=format&fit=crop", // Night City
      "https://images.unsplash.com/photo-1522383225653-ed111181a951?q=80&w=2070&auto=format&fit=crop", // Sakura
      "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=2070&auto=format&fit=crop", // Mountain
      "https://images.unsplash.com/photo-1506744038136-46273834b3fb?q=80&w=2070&auto=format&fit=crop", // Sunset
      "https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?q=80&w=2070&auto=format&fit=crop", // Winter
      "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2070&auto=format&fit=crop"  // Beach
    ];

    if (gameState === "playing" || gameState === "summary") {
      const levelId = LEVELS[currentLevelIndex].id;
      setBgImage(bgs[levelId % bgs.length]);
    } else {
      setBgImage(bgs[Math.floor(Math.random() * bgs.length)]);
    }
  }, [gameState, currentLevelIndex]);

  // Music handling
  useEffect(() => {
    if (musicEnabled && soundEnabled) {
      soundManager?.startMusic();
    } else {
      soundManager?.stopMusic();
    }
  }, [musicEnabled, soundEnabled]);
  
  const [totalAttempts, setTotalAttempts] = useState(0);

  // Load progress
  useEffect(() => {
    const savedLevels = localStorage.getItem("gtl_unlocked");
    const savedScore = localStorage.getItem("gtl_score");
    if (savedLevels) setUnlockedLevels(JSON.parse(savedLevels));
    if (savedScore) setScore(parseInt(savedScore, 10));
  }, []);

  // Save progress
  useEffect(() => {
    localStorage.setItem("gtl_unlocked", JSON.stringify(unlockedLevels));
    localStorage.setItem("gtl_score", score.toString());
  }, [unlockedLevels, score]);

  useEffect(() => {
    if (soundManager) soundManager.setEnabled(soundEnabled);
  }, [soundEnabled]);

  const handleStartGame = () => {
    soundManager?.playClick();
    setGameState("levels");
  };

  const handleSelectLevel = (levelId: number) => {
    if (!unlockedLevels.includes(levelId)) return;
    soundManager?.playClick();
    const index = LEVELS.findIndex(l => l.id === levelId);
    setCurrentLevelIndex(index);
    setAttempts(0);
    setUserInput("");
    setFeedback(null);
    setShowHint(false);
    setGameState("playing");
  };

  const handleCheckAnswer = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userInput.trim() || feedback === "correct") return;

    const currentLevel = LEVELS[currentLevelIndex];
    const isCorrect = parseFloat(userInput) === currentLevel.answer;

    if (isCorrect) {
      soundManager?.playSuccess();
      setFeedback("correct");
      
      const basePoints = 100;
      const difficultyMultiplier = { "Easy": 1, "Medium": 1.5, "Hard": 2, "Expert": 3 }[currentLevel.difficulty];
      const attemptPenalty = Math.max(0, attempts * 20);
      const levelScore = Math.max(20, Math.floor(basePoints * difficultyMultiplier) - attemptPenalty);
      
      setScore(prev => prev + levelScore);
      
      const nextLevelId = currentLevel.id + 1;
      if (nextLevelId <= LEVELS.length && !unlockedLevels.includes(nextLevelId)) {
        setUnlockedLevels(prev => [...prev, nextLevelId]);
      }

      setTimeout(() => {
        setGameState("summary");
      }, 1000);

    } else {
      soundManager?.playError();
      setFeedback("wrong");
      setAttempts(prev => prev + 1);
      setTotalAttempts(prev => prev + 1);
      
      if (vibrationEnabled && typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(200);
      }

      setTimeout(() => setFeedback(null), 1000);
    }
  };

  const handleNextLevel = () => {
    soundManager?.playClick();
    if (currentLevelIndex < LEVELS.length - 1) {
      setCurrentLevelIndex(prev => prev + 1);
      setAttempts(0);
      setUserInput("");
      setFeedback(null);
      setShowHint(false);
      setGameState("playing");
    } else {
      setGameState("home");
    }
  };

  const CharacterSprite = ({ type }: { type: keyof typeof ANIME_CHARACTERS }) => (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="relative mb-4 h-32 w-32 drop-shadow-2xl"
    >
      <img src={ANIME_CHARACTERS[type]} alt="Anime Character" className="h-full w-full rounded-full border-4 border-white bg-emerald-100/50" />
      {type === 'happy' && <Sparkles className="absolute -right-2 -top-2 h-8 w-8 text-yellow-400 animate-bounce" />}
    </motion.div>
  );

  const renderHome = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex flex-col items-center justify-center space-y-8 text-center relative z-10"
    >
      <CharacterSprite type="guide" />
      
      <div className="space-y-4">
        <h1 className="text-6xl font-black tracking-tight text-white drop-shadow-lg">
          Guess the <span className="bg-gradient-to-r from-emerald-400 to-green-300 bg-clip-text text-transparent">Logic</span>
        </h1>
        <p className="max-w-md text-xl font-medium text-emerald-50 drop-shadow-md">
          Master 1000 levels of brain-twisting patterns with your anime companions!
        </p>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <Button 
          size="lg" 
          className="h-16 rounded-full px-10 text-xl font-bold bg-emerald-500 hover:bg-emerald-600 shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all hover:scale-110 text-white"
          onClick={handleStartGame}
        >
          <Play className="mr-2 h-7 w-7" /> Play Now
        </Button>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="icon" 
            className="h-14 w-14 rounded-full border-2 border-emerald-400/50 bg-emerald-900/40 text-emerald-100 hover:bg-emerald-800/60"
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? <Volume2 /> : <VolumeX />}
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            className={cn("h-14 w-14 rounded-full border-2 border-emerald-400/50 bg-emerald-900/40 text-emerald-100 hover:bg-emerald-800/60", musicEnabled && "bg-emerald-500/30 border-emerald-300 text-white")}
            onClick={() => setMusicEnabled(!musicEnabled)}
          >
            <Gamepad2 className={cn("h-6 w-6", musicEnabled && "animate-pulse")} />
          </Button>
          <Button 
            variant="outline" 
            size="icon" 
            className="h-14 w-14 rounded-full border-2 border-emerald-400/50 bg-emerald-900/40 text-emerald-100 hover:bg-emerald-800/60"
            onClick={() => {
              if (confirm("Reset all progress?")) {
                setUnlockedLevels([1]);
                setScore(0);
                localStorage.clear();
              }
            }}
          >
            <RotateCcw />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 rounded-full bg-emerald-900/50 px-6 py-3 border border-emerald-400/30 backdrop-blur-md">
        <Trophy className="h-6 w-6 text-yellow-400" />
        <span className="font-bold text-emerald-50 text-lg">High Score: {score}</span>
      </div>
    </motion.div>
  );

  const renderLevels = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="w-full max-w-5xl space-y-8 relative z-10 p-4"
    >
      <div className="flex items-center justify-between bg-emerald-900/40 p-4 rounded-3xl backdrop-blur-md border border-emerald-400/20">
        <Button variant="ghost" className="text-emerald-100 hover:bg-emerald-800/50" onClick={() => setGameState("home")}>
          <ArrowLeft className="mr-2 h-5 w-5" /> Home
        </Button>
        <h2 className="text-4xl font-black text-white">Level Selection</h2>
        <div className="flex items-center gap-2 text-emerald-100 font-bold">
          <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
          {score}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
        {LEVELS.map((level) => {
          const isUnlocked = unlockedLevels.includes(level.id);
          return (
            <motion.button
              key={level.id}
              whileHover={isUnlocked ? { scale: 1.1, zIndex: 10 } : {}}
              whileTap={isUnlocked ? { scale: 0.95 } : {}}
              onClick={() => handleSelectLevel(level.id)}
              disabled={!isUnlocked}
              className={cn(
                "relative flex aspect-square flex-col items-center justify-center rounded-2xl border-2 transition-all shadow-lg",
                isUnlocked 
                  ? "border-emerald-300 bg-emerald-50/90 hover:border-emerald-500 hover:bg-white" 
                  : "border-transparent bg-emerald-900/30 opacity-40 cursor-not-allowed"
              )}
            >
              {!isUnlocked && <Lock className="absolute top-2 right-2 h-4 w-4 text-emerald-200" />}
              <span className={cn("text-2xl font-black", isUnlocked ? "text-emerald-800" : "text-emerald-100")}>{level.id}</span>
              {isUnlocked && (
                <span className={cn(
                  "mt-1 text-[8px] font-bold uppercase tracking-wider",
                  level.difficulty === "Easy" && "text-green-600",
                  level.difficulty === "Medium" && "text-amber-600",
                  level.difficulty === "Hard" && "text-orange-600",
                  level.difficulty === "Expert" && "text-red-600"
                )}>
                  {level.difficulty}
                </span>
              )}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );

  const renderPlaying = () => {
    const level = LEVELS[currentLevelIndex];
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-3xl space-y-6 relative z-10"
      >
        <div className="flex items-center justify-between bg-emerald-900/40 p-4 rounded-3xl backdrop-blur-md border border-emerald-400/20">
          <Button variant="ghost" className="text-emerald-100 hover:bg-emerald-800/50" onClick={() => setGameState("levels")}>
            <ArrowLeft className="mr-2 h-5 w-5" /> Map
          </Button>
          <div className="text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-200">Level {level.id}</p>
            <h3 className={cn(
              "text-lg font-black",
              level.difficulty === "Easy" && "text-green-300",
              level.difficulty === "Medium" && "text-amber-300",
              level.difficulty === "Hard" && "text-orange-300",
              level.difficulty === "Expert" && "text-red-300"
            )}>
              {level.difficulty} Mode
            </h3>
          </div>
          <div className="flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 shadow-lg">
            <Star className="h-4 w-4 text-white fill-white" />
            <span className="font-bold text-white">{score}</span>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          <CharacterSprite type={feedback === "wrong" ? "sad" : (feedback === "correct" ? "happy" : "thinking")} />
          
          <Card className="w-full border-4 border-emerald-200/50 bg-white/95 shadow-[0_20px_50px_rgba(0,0,0,0.1)] backdrop-blur-sm rounded-[32px]">
            <CardContent className="flex flex-col items-center gap-10 p-10">
              <div className="flex flex-wrap justify-center gap-3">
                {level.pattern.map((num, i) => (
                  <motion.div 
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex h-20 w-20 items-center justify-center rounded-2xl bg-emerald-50 text-4xl font-black text-emerald-700 border-2 border-emerald-100 shadow-sm sm:h-24 sm:w-24"
                  >
                    {num}
                  </motion.div>
                ))}
                <motion.div 
                  animate={feedback === "wrong" ? { x: [0, -10, 10, -10, 10, 0] } : {}}
                  className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-dashed border-emerald-400 bg-emerald-100/50 text-4xl font-black text-emerald-600 sm:h-24 sm:w-24"
                >
                  ?
                </motion.div>
              </div>

              <form onSubmit={handleCheckAnswer} className="flex w-full max-w-md flex-col gap-5">
                <div className="relative group">
                  <Input
                    type="number"
                    step="any"
                    placeholder="Enter next number..."
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    disabled={feedback === "correct"}
                    className="h-20 rounded-2xl bg-emerald-50/50 px-8 text-center text-3xl font-bold text-emerald-900 border-3 border-emerald-100 focus:border-emerald-500 focus:ring-emerald-500 transition-all"
                    autoFocus
                  />
                  <AnimatePresence>
                    {feedback && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5, x: 20 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        className="absolute -right-4 -top-4"
                      >
                        {feedback === "correct" ? (
                          <div className="rounded-full bg-green-500 p-2 text-white shadow-lg">
                            <CheckCircle2 className="h-8 w-8" />
                          </div>
                        ) : (
                          <div className="rounded-full bg-red-500 p-2 text-white shadow-lg">
                            <XCircle className="h-8 w-8" />
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <Button 
                  type="submit" 
                  size="lg" 
                  disabled={!userInput || feedback === "correct"}
                  className="h-16 rounded-2xl text-xl font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl hover:scale-[1.02] transition-all"
                >
                  Submit Logic
                </Button>

                <AnimatePresence>
                  {showHint ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="w-full bg-amber-50/90 p-6 rounded-2xl border-2 border-amber-200/50 mt-2 text-amber-900 shadow-sm"
                    >
                      <div className="flex items-start gap-4">
                        <div className="rounded-full bg-amber-200 p-2 text-amber-700">
                          <Lightbulb className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-black uppercase tracking-wider text-amber-700 mb-1">Divine Hint</p>
                          <p className="text-lg font-medium leading-tight italic">"{level.hint}"</p>
                        </div>
                      </div>
                    </motion.div>
                  ) : (
                    <Button 
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        soundManager?.playClick();
                        setShowHint(true);
                      }}
                      disabled={feedback === "correct"}
                      className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100/50 mt-2 font-black uppercase tracking-widest text-xs flex items-center gap-2"
                    >
                      <Lightbulb className="h-4 w-4" /> Unlock Hint
                    </Button>
                  )}
                </AnimatePresence>
              </form>
            </CardContent>
          </Card>
        </div>

        {attempts > 0 && (
          <p className="text-center font-bold text-emerald-100 drop-shadow-md">
            Attempts: <span className="text-yellow-300">{attempts}</span>
          </p>
        )}
      </motion.div>
    );
  };

  const renderSummary = () => {
    const level = LEVELS[currentLevelIndex];
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.1 }}
        className="flex flex-col items-center justify-center space-y-8 text-center relative z-10"
      >
        <CharacterSprite type="happy" />
        
        <div className="space-y-4">
          <h2 className="text-6xl font-black text-white drop-shadow-2xl">Victory!</h2>
          <div className="bg-emerald-900/60 p-6 rounded-3xl border-2 border-emerald-400/30 backdrop-blur-xl">
            <p className="text-lg font-bold text-emerald-200 uppercase tracking-widest mb-2">The Hidden Logic</p>
            <p className="text-2xl font-black text-white italic">"{level.logic}"</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 w-full max-w-sm">
          <div className="rounded-3xl bg-white/95 p-6 shadow-2xl border-b-4 border-emerald-200">
            <p className="text-xs font-black text-emerald-500 uppercase">Gained</p>
            <p className="text-4xl font-black text-emerald-800">+{Math.max(20, Math.floor(100 * ({"Easy": 1, "Medium": 1.5, "Hard": 2, "Expert": 3}[level.difficulty])) - (attempts * 20))}</p>
          </div>
          <div className="rounded-3xl bg-white/95 p-6 shadow-2xl border-b-4 border-emerald-200">
            <p className="text-xs font-black text-emerald-500 uppercase">Total</p>
            <p className="text-4xl font-black text-emerald-800">{score}</p>
          </div>
        </div>

        <div className="flex flex-col gap-4 w-full max-w-xs">
          <Button 
            size="lg" 
            className="h-16 rounded-full text-xl font-bold bg-emerald-500 hover:bg-emerald-600 shadow-2xl text-white hover:scale-105 transition-all"
            onClick={handleNextLevel}
          >
            {currentLevelIndex < LEVELS.length - 1 ? "Advance →" : "Grand Finale!"}
          </Button>
          <Button 
            variant="ghost" 
            size="lg" 
            className="h-14 rounded-full text-lg font-bold text-emerald-50 hover:bg-white/10"
            onClick={() => setGameState("levels")}
          >
            Select Map
          </Button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden font-sans selection:bg-emerald-200 selection:text-emerald-900">
      {/* Anime Background Layer */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
        style={{ 
          backgroundImage: `linear-gradient(rgba(6, 78, 59, 0.7), rgba(6, 78, 59, 0.8)), url('${bgImage}')`,
        }}
      />
      
      {/* Dynamic Animated Particles/Shapes */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-emerald-400 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-green-500 rounded-full blur-[150px] animate-pulse delay-700" />
      </div>

      <AnimatePresence mode="wait">
        {gameState === "home" && renderHome()}
        {gameState === "levels" && renderLevels()}
        {gameState === "playing" && renderPlaying()}
        {gameState === "summary" && renderSummary()}
      </AnimatePresence>

      {/* Persistent UI Elements */}
      <footer className="fixed bottom-6 z-20 flex gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-300/50">
        <span>GTL v2.0 - Anime Edition</span>
        <span>Levels: {LEVELS.length}</span>
        <span>Progress: {Math.round((unlockedLevels.length / LEVELS.length) * 100)}%</span>
      </footer>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(6, 78, 59, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(52, 211, 153, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(52, 211, 153, 0.8);
        }
      `}</style>
    </div>
  );
}

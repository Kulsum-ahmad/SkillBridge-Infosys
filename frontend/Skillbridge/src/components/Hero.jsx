import { useEffect, useState } from 'react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Link } from 'react-router-dom';

export function Hero({ onOpenModal }) {
  const [particles, setParticles] = useState([]);

  useEffect(() => {
    // Generate particles
    const newParticles = [];
    for (let i = 0; i < 50; i++) {
      newParticles.push({
        id: i,
        size: Math.random() * 4 + 2,
        left: Math.random() * 100,
        delay: Math.random() * 8,
      });
    }
    setParticles(newParticles);
  }, []);

  return (
    <section className="min-h-screen relative flex items-center justify-center bg-gradient-to-br from-slate-600 via-purple-600 to-sky-300 animate-gradient-shift">
      {/* Animated Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute bg-white/10 rounded-full animate-float"
            style={{
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              left: `${particle.left}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: '8s',
            }}
          />
        ))}
      </div>

      <div className="text-center text-white max-w-4xl px-8 z-10 relative flex flex-col justify-center pt-24">
        <h1 className="text-6xl md:text-7xl font-bold mb-4 animate-fade-in-up">
          SkillBridge
        </h1>
        
        <ImageWithFallback 
          src="https://images.unsplash.com/photo-1517946276741-5a1b37424e4b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx8fDE3NTkxMjEyODR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Bridge connecting communities" 
          className="h-48 w-96 mx-auto mb-12 rounded-lg object-cover"
        />
        
        <p className="text-2xl md:text-3xl mb-8 opacity-90 animate-fade-in-up animation-delay-200">
          Connect Skills with Purpose
        </p>
        
        <p className="text-lg md:text-xl mb-12 opacity-80 animate-fade-in-up animation-delay-400 leading-relaxed">
          Bridge the gap between passionate volunteers and impactful NGOs.
          Share your skills, make a difference, and build meaningful connections
          that create lasting change in communities worldwide.
        </p>

        <div className="flex flex-col md:flex-row gap-6 justify-center flex-wrap animate-fade-in-up animation-delay-600 mb-8">
          <Link
            to="/organization"
            className="px-8 py-4 text-lg font-semibold rounded-full transition-all duration-400 relative overflow-hidden border-2 border-white/50 bg-white/10 backdrop-blur-sm text-white hover:-translate-y-1 hover:scale-105 hover:shadow-2xl hover:bg-white/20 flex items-center justify-center gap-3 min-w-[240px]"
          >
            <span className="text-xl">🏢</span>
            Register as NGO
          </Link>
          
          <Link
            to="/volunteer"
            className="px-8 py-4 text-lg font-semibold rounded-full transition-all duration-400 relative overflow-hidden border-2 border-purple-400/60 bg-purple-500/20 backdrop-blur-sm text-white hover:-translate-y-1 hover:scale-105 hover:shadow-2xl hover:bg-purple-500/30 flex items-center justify-center gap-3 min-w-[240px]"
          >
            <span className="text-xl">👥</span>
            Register as Volunteer
          </Link>
        </div>
      </div>
    </section>
  );
}
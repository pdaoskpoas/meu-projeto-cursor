import React from 'react';
import { ArrowRight, Eye, Search, Shield, Award, Users, TrendingUp, MapPin, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden">
      {/* Background with sophisticated gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-100/20 via-transparent to-transparent"></div>
      
      <div className="container-responsive relative">
        <div className="py-16 lg:py-24">
          <div className="text-center max-w-4xl mx-auto">
            {/* Simple, Clean Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 leading-tight mb-6">
              Cavalos de Todo o Brasil
            </h1>
            
            {/* Simple Description */}
            <p className="text-xl text-slate-600 leading-relaxed mb-12">
              Descubra cavalos excepcionais de criadores apaixonados em todos os estados brasileiros
            </p>

            {/* Simple CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/dashboard">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold transition-all duration-300">
                  Ver Cavalos
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="outline" className="border-2 border-slate-300 hover:border-blue-600 hover:text-blue-600 px-8 py-3 text-lg font-semibold transition-all duration-300">
                  Cadastrar
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
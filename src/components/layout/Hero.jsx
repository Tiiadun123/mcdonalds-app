import { ArrowRight, Flame, Star, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <section className="relative w-full min-h-[600px] lg:min-h-[750px] bg-[#0A0A0A] rounded-[4rem] overflow-visible mb-24 mt-8 isolate animate-fade-in-up">
      {/* Structural Fragmentation / Broken Grid Elements */}
      <div className="absolute top-0 right-0 w-3/4 h-full bg-gradient-to-l from-primary-red/10 to-transparent z-0 rounded-r-[4rem] mix-blend-screen"></div>
      
      {/* Huge abstract typographic background */}
      <div className="absolute -top-10 -left-10 z-0 select-none pointer-events-none opacity-5">
        <h1 className="text-[200px] leading-none font-display font-black text-white whitespace-nowrap">McPRO</h1>
        <h1 className="text-[200px] leading-none font-display font-black text-white whitespace-nowrap -mt-16 ml-32">STORE</h1>
      </div>

      <div className="absolute right-0 top-0 w-full lg:w-3/5 h-full z-10 flex justify-end xl:justify-center items-center pr-10 xl:pr-0">
        <div className="relative group motion-depth w-full max-w-[600px] aspect-square flex items-center justify-center">
          <div className="absolute w-[120%] h-[120%] bg-primary-yellow/20 blur-[100px] rounded-full motion-depth-glow opacity-60"></div>
          
          {/* Breaking the bounding box by using scale-125 and extending outside */}
          <img 
            src="/hero-burger.png" 
            alt="Premium Double Cheeseburger" 
            className="absolute lg:relative -right-20 lg:-right-10 object-contain w-[140%] max-w-none lg:w-[130%] drop-shadow-[0_60px_60px_rgba(0,0,0,0.8)] transform -rotate-[8deg] motion-depth-media animate-float z-30 pointer-events-auto"
          />

          {/* Floating UI Badges - Topological Betrayal */}
          <div className="absolute -left-10 top-1/4 bg-white/10 backdrop-blur-3xl border border-white/20 p-4 rounded-3xl z-40 animate-float shadow-2xl flex flex-col gap-1 items-start w-max" style={{ animationDelay: '200ms' }}>
            <div className="text-[10px] font-black text-primary-yellow tracking-widest">TOP RATED</div>
            <div className="flex items-center gap-1 text-white font-bold text-lg"><Star className="w-5 h-5 fill-primary-yellow text-primary-yellow" /> 4.9/5</div>
          </div>

          <div className="absolute right-0 lg:-right-20 bottom-1/4 bg-gray-900/90 backdrop-blur-2xl border border-white/10 px-6 py-4 rounded-full z-40 animate-float shadow-[0_20px_40px_rgba(255,0,0,0.15)] flex items-center gap-4 w-max" style={{ animationDelay: '500ms' }}>
             <div className="w-12 h-12 bg-primary-red flex items-center justify-center rounded-full"><Flame className="w-6 h-6 text-white" /></div>
             <div className="flex flex-col text-left">
               <span className="text-white font-black text-xl leading-none">SPICY</span>
               <span className="text-gray-400 font-bold text-xs uppercase tracking-widest">Signature</span>
             </div>
          </div>
        </div>
      </div>

      {/* Asymmetric Content Block */}
      <div className="relative z-20 w-full h-full flex items-center px-8 lg:px-20 pt-20 pb-16 lg:py-0 pointer-events-none">
        <div className="max-w-xl space-y-10 pointer-events-auto relative mt-40 lg:mt-0">
          <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/5 backdrop-blur-2xl border-l-4 border-l-primary-yellow border-white/10 shadow-2xl font-bold text-white uppercase tracking-[0.3em] text-[10px] animate-fade-in-up">
            <Zap className="w-4 h-4 text-primary-yellow fill-primary-yellow animate-pulse" />
            Limited Edition
          </div>
          
          <div className="space-y-6 animate-fade-in-up animate-stagger-1 w-max relative">
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-black text-white leading-[0.9] tracking-tighter">
              BITE<br />INTO<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-red via-red-500 to-orange-500">GLORY</span>
            </h1>
            <div className="absolute -left-6 md:-left-8 top-0 w-1.5 md:w-2 h-full bg-primary-red rounded-full"></div>
            <p className="text-gray-300 text-base md:text-lg lg:text-xl font-medium max-w-[280px] md:max-w-sm leading-relaxed border-t border-white/10 pt-6">
              Không phải là thức ăn nhanh. <br/>Đây là một <span className="text-white font-black italic">nghệ thuật</span> được chế tác từ thịt nhập khẩu.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 pt-6 animate-fade-in-up animate-stagger-2">
            <Link to="/catalog" className="mc-button-primary scale-110 flex items-center gap-3 shadow-[0_0_40px_rgba(255,0,0,0.4)] hover:shadow-[0_0_60px_rgba(255,0,0,0.6)]">
              ĐẶT HÀNG NGAY
              <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
            </Link>
            <Link to="/catalog" className="px-8 py-4 bg-transparent border border-white/20 text-white rounded-2xl font-bold hover:bg-white/10 flex items-center gap-3 transition-colors uppercase tracking-widest text-sm">
              Xem chi tiết
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

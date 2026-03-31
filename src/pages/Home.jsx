import { Link } from 'react-router-dom';
import { ArrowRight, Star, Clock, ShieldCheck, Zap, ChevronRight } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import { useEffect, useRef, useState } from 'react';
import CartDrawer from '../components/cart/CartDrawer';
import ScrollReveal from '../components/layout/ScrollReveal';

export default function Home() {
  const [isCartOpen, setIsCartOpen] = useState(false);
   const [searchQuery, setSearchQuery] = useState('');
   const stageRef = useRef(null);
   const sceneRef = useRef(null);
   const frameRef = useRef(null);

   const quickCategories = [
      { label: 'Burgers', slug: 'burgers' },
      { label: 'Fries', slug: 'sides' },
      { label: 'Drinks', slug: 'drinks' },
   ];

   const hotDeals = [
      { name: 'Combo Sinh Viên', price: '$4.99', image: '/hero-burger.png', discount: '-20%' },
      { name: 'Family Đỉnh Cao', price: '$12.99', image: '/hero-burger.png', discount: '-15%' },
      { name: 'McPro Signature', price: '$8.99', image: '/hero-burger.png', discount: 'Bestseller', soldOut: true },
   ];

   useEffect(() => {
      let time = 0;
      const animate = () => {
         time += 0.01;
         if (frameRef.current) {
            const y = Math.sin(time) * 12;
            const r = Math.cos(time * 0.8) * 2;
            frameRef.current.style.transform = `translateY(${y}px) rotate(${r}deg)`;
         }
         requestAnimationFrame(animate);
      };
      animate();
   }, []);

   const handleHeroPointerMove = (e) => {
      if (!stageRef.current || !sceneRef.current) return;
      const rect = stageRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      
      const multiplier = 0.05;
      sceneRef.current.style.setProperty('--rx', `${-y * multiplier}deg`);
      sceneRef.current.style.setProperty('--ry', `${x * multiplier}deg`);
      sceneRef.current.style.setProperty('--tx', `${x * (multiplier * 2)}px`);
      sceneRef.current.style.setProperty('--ty', `${y * (multiplier * 2)}px`);
   };

   const handleHeroPointerLeave = () => {
      if (!sceneRef.current) return;
      sceneRef.current.style.setProperty('--rx', '0deg');
      sceneRef.current.style.setProperty('--ry', '0deg');
      sceneRef.current.style.setProperty('--tx', '0px');
      sceneRef.current.style.setProperty('--ty', '0px');
   };

  return (
    <div className="min-h-screen bg-white font-sans selection:bg-primary-red selection:text-white overflow-x-hidden">
         <Navbar
            onOpenCart={() => setIsCartOpen(true)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
         />
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-40 px-6 overflow-hidden">
        {/* Abstract Background Elements */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary-yellow/10 rounded-full blur-[120px] -mr-96 -mt-96"></div>
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-primary-red/5 rounded-full blur-[100px] -ml-48 -mb-48"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-10">
              <div className="inline-flex items-center gap-3 px-6 py-3 bg-primary-red/5 border border-primary-red/10 rounded-full text-primary-red animate-fade-in-down animate-stagger-1">
                 <Zap className="w-5 h-5 fill-primary-red" />
                 <span className="text-xs font-black uppercase tracking-[0.3em]">New Generation of Fast Food</span>
              </div>
              
              <h1 className="text-7xl lg:text-9xl font-display font-black text-gray-900 tracking-tighter leading-[0.9] uppercase italic animate-slide-in-left animate-stagger-1">
                Savor the <span className="text-primary-red">McPro</span> <br /> 
                <span className="relative">
                  Experience
                  <div className="absolute bottom-4 left-0 w-full h-4 bg-primary-yellow -z-10 rotate-[-1deg] animate-slide-in-left animate-stagger-3 delay-500"></div>
                </span>
              </h1>
              
              <p className="text-2xl text-gray-500 font-medium max-w-xl leading-relaxed animate-slide-in-left animate-stagger-2">
                Nâng tầm trải nghiệm ẩm thực nhanh với những nguyên liệu thượng hạng và công thức McPro độc bản.
              </p>
              
              <div className="flex flex-wrap items-center gap-6 pt-6 animate-slide-in-left animate-stagger-3">
                <Link 
                  to="/catalog" 
                  className="mc-button-primary h-20 px-12 rounded-[2.5rem] bg-gray-900 hover:bg-black text-white flex items-center gap-4 text-lg shadow-2xl shadow-gray-200"
                >
                   KHÁM PHÁ MENU NGAY
                   <ArrowRight className="w-6 h-6" />
                </Link>
                <div className="flex items-center gap-4 px-8 py-5 rounded-[2rem] border-2 border-gray-100 bg-white shadow-sm">
                   <div className="flex -space-x-4">
                      {[1,2,3].map(i => (
                        <div key={i} className="w-12 h-12 rounded-full border-4 border-white bg-gray-100 overflow-hidden shadow-md">
                           <img src={`https://i.pravatar.cc/150?u=${i}`} alt="" />
                        </div>
                      ))}
                   </div>
                   <div>
                      <div className="flex items-center gap-1">
                         {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 text-primary-yellow fill-primary-yellow" />)}
                      </div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">10k+ McPro Fans</p>
                   </div>
                </div>
              </div>
            </div>

                  <div
                     ref={stageRef}
                     onMouseMove={handleHeroPointerMove}
                     onMouseLeave={handleHeroPointerLeave}
                     className="relative animate-slide-in-right animate-stagger-2 motion-depth cinematic-stage w-full max-w-[600px] mx-auto mt-10 lg:mt-0"
                  >
               {/* Decorative Ring */}
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] border-[40px] border-gray-50 rounded-full -z-10 opacity-50"></div>
               
                      <div ref={sceneRef} className="relative isolate group motion-depth cinematic-scene">
                           <div className="absolute inset-0 bg-primary-red/10 rounded-full blur-[80px] motion-depth-glow cinematic-glow opacity-80"></div>
                  <img 
                    src="/hero-burger.png" 
                    alt="McPro Signature Burger" 
                              className="w-[110%] max-w-none h-auto -ml-[5%] drop-shadow-[0_40px_60px_rgba(0,0,0,0.5)] motion-depth-card motion-depth-media cinematic-main-media animate-float z-10 relative"
                  />
                  
                  {/* Detailed Floating Ingredients */}
                  <div className="absolute top-0 right-10 w-16 h-16 bg-[url('/tomato.png')] bg-contain bg-no-repeat bg-center opacity-0 drop-shadow-2xl animate-float [animation-delay:0.5s] hidden"></div>
                  <div className="absolute bottom-20 right-20 w-24 h-24 bg-[url('/leaf.png')] bg-contain bg-no-repeat bg-center opacity-0 drop-shadow-2xl animate-float [animation-delay:1.2s] hidden"></div>

                  {/* Floating Badges - Replicated exactly from the design */}
                  <div className="absolute top-12 -right-4 lg:-right-10 bg-white/95 backdrop-blur-xl py-3 pl-3 pr-8 rounded-full shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] border border-white animate-float hover:scale-105 transition-transform duration-300 z-20">
                     <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-[#00c853] rounded-full flex items-center justify-center text-white shadow-[0_8px_16px_rgba(0,200,83,0.3)]">
                           <Clock className="w-7 h-7" />
                        </div>
                        <div className="flex flex-col justify-center">
                           <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-tight">Giao hàng nhanh</p>
                           <p className="text-xl font-display font-black text-gray-900 tracking-tighter leading-none mt-0.5">15-20 PHÚT</p>
                        </div>
                     </div>
                  </div>

                  <div className="absolute bottom-16 -left-4 lg:-left-12 bg-white/95 backdrop-blur-xl py-3 pl-3 pr-8 rounded-full shadow-[0_20px_40px_-10px_rgba(0,0,0,0.15)] border border-white animate-float [animation-delay:2s] hover:scale-105 transition-transform duration-300 z-20">
                     <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-[#e53935] rounded-full flex items-center justify-center text-white shadow-[0_8px_16px_rgba(229,57,53,0.3)]">
                           <Star className="w-7 h-7 fill-white" />
                        </div>
                        <div className="flex flex-col justify-center">
                           <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-tight">Đánh giá 5-sao</p>
                           <p className="text-xl font-display font-black text-gray-900 tracking-tighter leading-none mt-0.5">CỰC PHẨM</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

         <section className="px-6 py-10">
            <ScrollReveal className="max-w-7xl mx-auto">
               <div className="bg-gray-900 rounded-[2.5rem] p-6 md:p-8 text-white border border-gray-800">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                     <div>
                        <p className="text-xs uppercase tracking-[0.25em] font-black text-gray-400">Quick Nav</p>
                        <h3 className="text-3xl font-black tracking-tight mt-1">Di chuyển nhanh theo danh mục</h3>
                     </div>
                     <div className="flex flex-wrap gap-3">
                        {quickCategories.map((item) => (
                           <Link
                              key={item.slug}
                              to={`/catalog?category=${item.slug}`}
                              className="px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/10 font-bold transition-[background-color,transform,border-color] duration-200 hover:-translate-y-0.5"
                           >
                              {item.label}
                           </Link>
                        ))}
                     </div>
                  </div>
               </div>
            </ScrollReveal>
         </section>

         <section className="px-6 py-12 bg-gray-50/70">
            <div className="max-w-7xl mx-auto">
               <ScrollReveal className="flex items-end justify-between gap-4 mb-8">
                  <div>
                     <p className="text-xs uppercase tracking-[0.25em] font-black text-primary-red">Hot Deals</p>
                     <h2 className="text-4xl font-black text-gray-900 tracking-tight mt-2">Deal nóng hôm nay</h2>
                  </div>
                  <Link to="/catalog" className="font-black text-sm text-gray-700 hover:text-gray-900">
                     Xem toàn bộ menu
                  </Link>
               </ScrollReveal>

               <div className="grid md:grid-cols-3 gap-6">
                  {hotDeals.map((deal, idx) => (
                     <ScrollReveal key={deal.name} delay={idx * 150} animation="animate-slide-in-up">
                        <article className="group motion-depth interactive-panel relative bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm hover:border-primary-red/20 hover:shadow-mc h-full flex flex-col">
                           <div className="absolute top-4 left-4 z-10 px-3 py-1 rounded-full bg-primary-red text-white text-xs font-black">
                              {deal.discount}
                           </div>
                           {deal.soldOut && (
                              <div className="absolute inset-0 z-20 bg-gray-900/55 backdrop-blur-[2px] flex items-center justify-center">
                                 <span className="px-6 py-2 rounded-2xl bg-white text-gray-900 font-black uppercase tracking-widest text-sm">
                                    Hết hàng
                                 </span>
                              </div>
                           )}
                           <div className="h-52 bg-gray-50 flex items-center justify-center p-6 motion-depth-card">
                              <img src={deal.image} alt={deal.name} className="w-full h-full object-contain motion-depth-media" />
                           </div>
                           <div className="p-5 flex-1 flex flex-col justify-between">
                              <h3 className="text-xl font-black text-gray-900">{deal.name}</h3>
                              <p className="mt-2 text-2xl font-black text-primary-red">{deal.price}</p>
                           </div>
                        </article>
                     </ScrollReveal>
                  ))}
               </div>
            </div>
         </section>

      {/* Value Props */}
      <section className="py-32 px-6 bg-gray-50/50">
         <div className="max-w-7xl mx-auto">
            <ScrollReveal className="text-center space-y-4 mb-20" animation="animate-slide-in-up">
               <h2 className="text-5xl font-display font-black text-gray-900 uppercase tracking-tighter">
                 Tại sao chọn <span className="text-primary-red">McPro?</span>
               </h2>
               <p className="text-gray-400 font-medium max-w-2xl mx-auto">
                 Chúng tôi không chỉ bán thức ăn nhanh, chúng tôi kiến tạo những giây phút thưởng thức thượng lưu.
               </p>
            </ScrollReveal>

            <div className="grid md:grid-cols-3 gap-10">
               {[
                 { title: 'Nguyên Liệu Organic', desc: 'Thực phẩm sạch từ các trang trại công nghệ cao được kiểm định nghiêm ngặt.', icon: ShieldCheck, color: 'text-emerald-500' },
                 { title: 'Tích Điểm McPoints', desc: 'Tích lũy điểm thưởng sau mỗi đơn hàng để đổi những phần quà độc quyền.', icon: Zap, color: 'text-primary-red' },
                 { title: 'Hương Vị Độc Bản', desc: 'Công thức nước sốt và cách chế biến chỉ có tại hệ thống McPro Store.', icon: Star, color: 'text-primary-yellow' },
               ].map((item, idx) => (
                 <ScrollReveal key={idx} delay={idx * 200} animation="animate-slide-in-up">
                    <div className="group motion-depth interactive-panel bg-white p-12 rounded-[3.5rem] border border-gray-100 shadow-sm hover:shadow-mc hover:border-primary-red/20 h-full">
                       <div className="motion-depth-card h-full flex flex-col">
                       <div className={`w-20 h-20 rounded-[2rem] bg-gray-50 flex items-center justify-center mb-8 group-hover:scale-105 transition-transform duration-300`}>
                          <item.icon className={`w-10 h-10 ${item.color} fill-current opacity-20 group-hover:opacity-100 transition-opacity`} />
                       </div>
                       <h3 className="text-2xl font-display font-black text-gray-900 uppercase tracking-tighter mb-4">{item.title}</h3>
                       <p className="text-gray-400 font-medium leading-relaxed flex-1">{item.desc}</p>
                       <div className="pt-8 mt-auto flex items-center gap-2 text-[10px] font-black text-primary-red uppercase tracking-widest group-hover:gap-3 transition-[gap,opacity] duration-300 opacity-0 group-hover:opacity-100 italic">
                          Tìm hiểu thêm <ChevronRight className="w-4 h-4" />
                       </div>
                       </div>
                    </div>
                 </ScrollReveal>
               ))}
            </div>
         </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
         <ScrollReveal className="max-w-7xl mx-auto rounded-[4rem] bg-primary-red p-12 lg:p-24 relative overflow-hidden flex flex-col items-center text-center space-y-10 group" animation="animate-slide-in-up">
            {/* Background Texture */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
               {[...Array(6)].map((_, i) => (
                 <div key={i} className="absolute text-9xl font-display font-black text-white italic rotate-[-15deg]" style={{ top: i*150, left: i*200 }}>MCPRO</div>
               ))}
            </div>
            
            <h2 className="text-6xl lg:text-8xl font-display font-black text-white tracking-tighter uppercase italic leading-none relative z-10">
              Bạn Đã Sẵn Sàng <br /> 
              Thưởng Thức <span className="text-primary-yellow underline underline-offset-8">Chưa?</span>
            </h2>
            <p className="text-white/80 text-xl font-medium max-w-2xl relative z-10">
              Đừng để cơn đói chờ đợi. Đặt hàng ngay và trải nghiệm dịch vụ fast-food đẳng cấp McPro.
            </p>
            <Link 
              to="/catalog" 
                     className="px-16 py-8 bg-white text-primary-red rounded-[2.5rem] font-black text-xl hover:scale-105 hover:bg-primary-yellow hover:text-gray-900 transition-[transform,background-color,color,box-shadow] duration-300 shadow-2xl relative z-10 uppercase tracking-widest shadow-white/20"
            >
               ĐẶT HÀNG MCPRO NGAY
            </Link>
         </ScrollReveal>
      </section>

      {/* Minimal Footer */}
      <footer className="py-20 border-t border-gray-100 text-center space-y-10">
         <ScrollReveal className="flex items-center justify-center gap-10">
            <img src="/mcd-logo.png" alt="McPro" className="h-12 w-auto grayscale opacity-20 hover:grayscale-0 hover:opacity-100 transition-[filter,opacity] duration-300 italic" />
            <div className="h-1.5 w-1.5 bg-gray-200 rounded-full"></div>
            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic">Est. 2025 McPro Platform</p>
         </ScrollReveal>
      </footer>
    </div>
  );
}

import { Coffee, Pizza, Croissant, Hash } from 'lucide-react';

const categoryConfig = {
  'burgers': { description: "Real Wagyu & Cheese", icon: Pizza, color: 'text-primary-red', bg: 'bg-red-50', outline: 'hover:border-red-200' },
  'sides': { description: "Khoai tây & Bánh táo", icon: Croissant, color: 'text-primary-yellow', bg: 'bg-yellow-50', outline: 'hover:border-yellow-200' },
  'drinks': { description: "Nước ngọt & Café đá", icon: Coffee, color: 'text-blue-500', bg: 'bg-blue-50', outline: 'hover:border-blue-200' },
  'default': { description: "Món ngon mỗi ngày", icon: Hash, color: 'text-gray-400', bg: 'bg-gray-100', outline: 'hover:border-gray-300' }
};

export default function Sidebar({ categories = [], activeCategoryId, onSelectCategory }) {
  return (
    <aside className="w-full lg:w-80 shrink-0 p-6 lg:p-10 lg:border-r border-gray-100/50 bg-white/40 backdrop-blur-2xl min-h-[calc(100vh-80px)]">
      <div className="sticky top-28">
        <div className="flex items-center gap-2 mb-8 px-2">
          <div className="w-1.5 h-6 bg-primary-red rounded-full"></div>
          <h2 className="text-[10px] font-display font-black text-gray-400 uppercase tracking-[0.3em]">Danh mục món ăn</h2>
        </div>
        
        <nav className="flex lg:flex-col gap-4 overflow-x-auto pb-6 lg:pb-0 hide-scrollbar snap-x">
          {categories.map((category) => {
            const config = categoryConfig[category.slug] || categoryConfig['default'];
            const Icon = config.icon;
            const isActive = activeCategoryId === category.id;
            
            return (
              <button
                key={category.id}
                onClick={() => onSelectCategory(category.id)}
                className={`group interactive-panel relative flex items-center gap-5 p-4 lg:p-5 min-w-[260px] lg:min-w-0 rounded-3xl snap-center animate-mc-entry
                  ${isActive 
                    ? 'bg-gray-900 text-white shadow-gold border-2 border-primary-yellow/20' 
                    : 'bg-white/50 border-2 border-transparent hover:border-gray-200 text-gray-600 hover:text-gray-900 shadow-sm'
                  }
                `}
              >
                <div className={`p-4 rounded-2xl transition-[transform,background-color,color] duration-300 ${
                  isActive ? 'bg-primary-yellow text-gray-900 scale-105 -rotate-1' : config.bg + ' ' + config.color
                }`}>
                  <Icon className={`w-6 h-6 stroke-[2.5]`} />
                </div>
                
                <div className="flex flex-col items-start text-start">
                  <span className={`text-base font-display font-black leading-tight tracking-tight uppercase ${
                    isActive ? 'text-white' : 'text-gray-900'
                  }`}>
                    {category.name}
                  </span>
                  <span className={`text-[10px] mt-1 font-bold uppercase tracking-widest ${
                    isActive ? 'text-primary-yellow/80' : 'text-gray-400'
                  }`}>
                    {config.description}
                  </span>
                </div>

                {isActive && (
                  <div className="absolute right-4 w-2 h-2 bg-primary-yellow rounded-full shadow-[0_0_10px_#FFC72C]"></div>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

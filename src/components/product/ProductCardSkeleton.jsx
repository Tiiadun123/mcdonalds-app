export default function ProductCardSkeleton() {
  return (
    <div className="relative bg-white border border-gray-100/60 rounded-[2.5rem] p-6 overflow-hidden flex flex-col h-full">
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
      <div className="relative space-y-8 flex-1 flex flex-col">
        {/* Image Area */}
        <div className="aspect-square w-full rounded-[2rem] bg-gray-50 animate-pulse flex items-center justify-center">
           <div className="w-20 h-20 bg-gray-100 rounded-full"></div>
        </div>
        
        {/* Content Area */}
        <div className="space-y-4 flex-1">
          <div className="h-7 w-4/5 rounded-xl bg-gray-100 animate-pulse"></div>
          <div className="space-y-2">
            <div className="h-3 w-full rounded-lg bg-gray-100/80 animate-pulse"></div>
            <div className="h-3 w-2/3 rounded-lg bg-gray-100/80 animate-pulse"></div>
          </div>
        </div>

        {/* Footer Area */}
        <div className="pt-6 mt-auto border-t border-gray-50 flex items-end justify-between">
          <div className="space-y-3">
            <div className="h-3 w-12 rounded bg-gray-100 animate-pulse"></div>
            <div className="h-10 w-28 rounded-xl bg-gray-100 animate-pulse"></div>
          </div>
          <div className="h-14 w-14 rounded-2xl bg-gray-100 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}

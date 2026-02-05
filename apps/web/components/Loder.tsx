export const Loder = ({title}: {title:string}) => {
    return (
        <div className="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-10 rounded-2xl flex items-center justify-center">
                        <div className="bg-white shadow-xl px-6 py-4 rounded-xl flex items-center gap-3">
                          <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full spinner"></div>
                          <span className="font-medium text-gray-700">
                            {title}
                          </span>
                        </div>
                      </div>
    )
} 
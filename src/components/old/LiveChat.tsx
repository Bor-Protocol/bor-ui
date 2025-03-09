import { Diamond } from 'lucide-react';
import { useScene } from '../../contexts/ScenesContext';



const truncateText = (text: string, maxLength: number): string => {
  if (text.length > maxLength) {
    return text.slice(0, maxLength) + '...';
  }
  return text;
};

export function LiveChat() {
  const { comments } = useScene();

 
  return (
    <div className="absolute bottom-0 left-0 right-0 z-[0] p-4 bg-gradient-to-t from-black/70 to-transparent">
      <div className="mb-4 space-y-0.5 overflow-hidden">
        {comments
          .slice(Math.max(comments.length - 7, 0))
          .map((comment) => (
            <div
              key={comment.id}
              className="group flex items-start space-x-3 p-1 rounded-lg 
                animate-slide-up transition-all duration-300 ease-out"
            >
              <div className="relative pt-1">
                <img 
                  src={comment.avatar} 
                  alt="User Avatar" 
                  className="w-8 h-8 rounded-full ring-2 ring-white-500/50 
                    group-hover:ring-white-500 transition-all" 
                />
                {/* <div className="absolute -bottom-1 -right-1 w-3 h-3 
                  bg-green-500 rounded-full border-1 border-black"></div> */}
              </div>
              
              <div className="flex-1 max-w-sm">
                <div className="flex items-center space-x-2">
                  <span 
                    className="font-bold text-sm text-white/80">
                    {comment.handle}
                  </span>
                </div>
                
                <div>
                  {comment.message.includes('diamonds') ? (
                    <div className="flex items-center space-x-2 bg-yellow-500/10 
                      px-3 py-1.5 rounded-full inline-block">
                      <Diamond className="w-4 h-4 text-yellow-400" />
                      <span className="text-yellow-100 text-sm">{truncateText(comment.message, 100)}</span>
                    </div>
                  ) : (
                    <span className="text-[14px] leading-tight text-white/70">
                      {truncateText(comment.message, 100)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
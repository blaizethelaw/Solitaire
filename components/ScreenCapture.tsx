
import React, { forwardRef } from 'react';

const ScreenCapture = forwardRef<HTMLVideoElement, {}>((props, ref) => {
  return (
    <div className="aspect-video w-full bg-black rounded-lg overflow-hidden shadow-2xl border-2 border-indigo-500/50">
      <video ref={ref} className="w-full h-full object-contain" playsInline muted />
    </div>
  );
});

ScreenCapture.displayName = 'ScreenCapture';

export default ScreenCapture;

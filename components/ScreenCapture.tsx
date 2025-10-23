
import React, { forwardRef } from 'react';

const ScreenCapture = forwardRef<HTMLVideoElement, {}>((props, ref) => {
  return (
    <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
      <video ref={ref} className="w-full h-full" playsInline autoPlay muted />
    </div>
  );
});

ScreenCapture.displayName = 'ScreenCapture';

export default ScreenCapture;

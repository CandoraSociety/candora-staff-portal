import React from "react";

export default function EditorCanvas({
  fileKind,
  docUrl,
  zoom,
  canvasRef,
  overlayCanvasRef,
  tool,
  color,
  size,
  drawing,
  startPos,
  setDrawing,
  setStartPos,
  pushHistory,
}) {
  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const touch = e.touches?.[0] || e.changedTouches?.[0];
    return {
      x: ((touch ? touch.clientX : e.clientX) - rect.left) * scaleX,
      y: ((touch ? touch.clientY : e.clientY) - rect.top) * scaleY,
    };
  };

  const handleMouseDown = (e) => {
    const canvas = fileKind === "image" ? canvasRef.current : overlayCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    setDrawing(true);
    setStartPos(pos);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const handleMouseMove = (e) => {
    const canvas = fileKind === "image" ? canvasRef.current : overlayCanvasRef.current;
    if (!canvas || !drawing) return;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);

    if (tool === "pen" || tool === "eraser") {
      ctx.globalCompositeOperation = tool === "eraser" ? "destination-out" : "source-over";
      ctx.strokeStyle = color;
      ctx.lineWidth = size;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    } else if (tool === "highlight") {
      ctx.globalCompositeOperation = "source-over";
      ctx.strokeStyle = color + "88";
      ctx.lineWidth = size * 4;
      ctx.lineCap = "square";
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
  };

  const handleMouseUp = (e) => {
    const canvas = fileKind === "image" ? canvasRef.current : overlayCanvasRef.current;
    if (!canvas || !drawing) return;
    const ctx = canvas.getContext("2d");
    const pos = getPos(e, canvas);
    setDrawing(false);
    ctx.globalCompositeOperation = "source-over";

    if (tool === "rect") {
      ctx.strokeStyle = color;
      ctx.lineWidth = size;
      ctx.strokeRect(startPos.x, startPos.y, pos.x - startPos.x, pos.y - startPos.y);
    } else if (tool === "circle") {
      const rx = Math.abs(pos.x - startPos.x) / 2;
      const ry = Math.abs(pos.y - startPos.y) / 2;
      ctx.strokeStyle = color;
      ctx.lineWidth = size;
      ctx.beginPath();
      ctx.ellipse(
        startPos.x + (pos.x - startPos.x) / 2,
        startPos.y + (pos.y - startPos.y) / 2,
        rx,
        ry,
        0,
        0,
        2 * Math.PI
      );
      ctx.stroke();
    } else if (tool === "line") {
      ctx.strokeStyle = color;
      ctx.lineWidth = size;
      ctx.beginPath();
      ctx.moveTo(startPos.x, startPos.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }

    pushHistory(ctx, canvas);
  };

  const commonProps = {
    onMouseDown: handleMouseDown,
    onMouseMove: handleMouseMove,
    onMouseUp: handleMouseUp,
    onMouseLeave: handleMouseUp,
    onTouchStart: handleMouseDown,
    onTouchMove: handleMouseMove,
    onTouchEnd: handleMouseUp,
  };

  if (fileKind === "image") {
    return (
      <div className="flex-1 overflow-auto">
        <div className="min-h-full flex items-start justify-center p-6">
          <div style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}>
            <canvas
              ref={canvasRef}
              className="shadow-xl rounded cursor-crosshair block"
              style={{ touchAction: "none" }}
              {...commonProps}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-auto">
      <div className="relative w-full" style={{ minHeight: "calc(100vh - 52px)" }}>
        <iframe
          src={`https://docs.google.com/viewer?url=${encodeURIComponent(docUrl)}&embedded=true`}
          className="w-full border-0"
          style={{ height: "calc(100vh - 52px)", display: "block" }}
        />
        <canvas
          ref={overlayCanvasRef}
          width={1240}
          height={1754}
          className="absolute top-0 left-0 w-full"
          style={{
            height: "calc(100vh - 52px)",
            touchAction: tool === "scroll" ? "auto" : "none",
            cursor: tool === "scroll" ? "grab" : "crosshair",
            pointerEvents: tool === "scroll" ? "none" : "auto",
          }}
          {...commonProps}
        />
        <div className="absolute top-3 left-3 z-10 bg-yellow-50 border border-yellow-300 text-yellow-800 text-xs px-3 py-1.5 rounded-full shadow-sm">
          Annotation layer — draw on top of document
        </div>
      </div>
    </div>
  );
}
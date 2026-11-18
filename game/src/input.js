export function createInput(canvas) {
  const input = {
    keys: {},
    start: false,
    pause: false,
    dash: false,
    mouseDown: false,
    mouseX: 0,
    mouseY: 0,
    autoPilot: false,
    clearFrameState() {
      this.start = false;
      this.pause = false;
      this.dash = false;
    }
  };

  window.addEventListener('keydown', (e) => {
    if (e.repeat) return;
    input.keys[e.code] = true;

    if (e.code === 'Enter') {
      input.start = true;
    }
    if (e.code === 'KeyP' || e.code === 'Escape') {
      input.pause = true;
    }
    if (e.code === 'Space' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
      input.dash = true;
    }
  });

  window.addEventListener('keyup', (e) => {
    input.keys[e.code] = false;
  });

  function updateMousePos(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    input.mouseX = (clientX - rect.left) * scaleX;
    input.mouseY = (clientY - rect.top) * scaleY;
  }

  canvas.addEventListener('mousemove', (e) => {
    updateMousePos(e.clientX, e.clientY);
  });

  canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) {
      input.mouseDown = true;
      updateMousePos(e.clientX, e.clientY);
    }
  });

  window.addEventListener('mouseup', (e) => {
    if (e.button === 0) {
      input.mouseDown = false;
    }
  });

  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length > 0) {
      input.mouseDown = true;
      updateMousePos(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  canvas.addEventListener('touchmove', (e) => {
    if (e.touches.length > 0) {
      updateMousePos(e.touches[0].clientX, e.touches[0].clientY);
    }
  }, { passive: true });

  canvas.addEventListener('touchend', (e) => {
    if (e.touches.length === 0) {
      input.mouseDown = false;
    }
  }, { passive: true });

  return input;
}

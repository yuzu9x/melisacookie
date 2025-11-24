const socket = io("https://melisacookie-1.onrender.com");
// My base functionalities for the cookie decorating
const COOKIE_COUNT = 6;
let currentCookie = 0;
let drawing = false;
let lastX, lastY;
let currentColor = '#8B4513';
let lineWidth = 3;
let brushType = 'normal'; 

const cookieCanvases = [];
const cookieContexts = [];

socket.on('connect', () => {
  console.log('Connected to server!', socket.id);
  updateConnectionStatus('connected');
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
  updateConnectionStatus('disconnected');
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected from server:', reason);
  updateConnectionStatus('disconnected');
});

socket.on('reconnect', (attemptNumber) => {
  console.log('Reconnected after', attemptNumber, 'attempts');
  updateConnectionStatus('connected');
});

socket.on('user-count', (count) => {
  const userCountEl = document.getElementById('user-count');
  if (userCountEl) {
    userCountEl.textContent = `${count} baker${count !== 1 ? 's' : ''} online`;
  }
});
// Added a connection status indicator cause I couldn't tell if the collaborative part was working or not
function updateConnectionStatus(status) {
  const statusEl = document.getElementById('connection-status');
  if (statusEl) {
    statusEl.className = status;
    if (status === 'connected') {
      statusEl.textContent = '🟢 Connected';
    } else if (status === 'disconnected') {
      statusEl.textContent = '🔴 Disconnected';
    } else {
      statusEl.textContent = '🟡 Connecting...';
    }
  }
}

function initializeCookies() {
  const tray = document.getElementById('cookie-tray');
  
  if (!tray) {
    console.error('Cookie tray element not found!');
    return;
  }
  
  for (let i = 0; i < COOKIE_COUNT; i++) {
    const cookieContainer = document.createElement('div');
    cookieContainer.className = 'cookie-container';
    cookieContainer.dataset.cookieId = i;
    // Individual canvases for each cookie
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    canvas.className = 'cookie-canvas';
    canvas.dataset.cookieId = i;
    
    const ctx = canvas.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = lineWidth;
    ctx.strokeStyle = currentColor;
    
    // Draw cookie base
    drawCookieBase(ctx, canvas.width, canvas.height);
    
    cookieContainer.appendChild(canvas);
    tray.appendChild(cookieContainer);
    
    cookieCanvases[i] = canvas;
    cookieContexts[i] = ctx;
    
    setupCanvasListeners(canvas, ctx, i);
  }
  
  highlightCookie(0);
}

function drawCookieBase(ctx, width, height) {
  ctx.fillStyle = '#F4A460';
  ctx.beginPath();
  ctx.arc(width/2, height/2, 80, 0, Math.PI * 2);
  ctx.fill();
}

function setupCanvasListeners(canvas, ctx, cookieId) {
  canvas.addEventListener('mousedown', (e) => {
    currentCookie = cookieId;
    highlightCookie(cookieId);
    drawing = true;
    const rect = canvas.getBoundingClientRect();
    lastX = e.clientX - rect.left;
    lastY = e.clientY - rect.top;
  });

  canvas.addEventListener('mouseup', () => {
    drawing = false;
  });

  canvas.addEventListener('mouseleave', () => {
    drawing = false;
  });

  canvas.addEventListener('mousemove', (e) => {
    if (!drawing) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    drawLine(cookieId, lastX, lastY, x, y, currentColor, lineWidth, true, brushType);
    lastX = x;
    lastY = y;
  });
}

function highlightCookie(cookieId) {
  document.querySelectorAll('.cookie-container').forEach((container, idx) => {
    container.classList.toggle('active', idx === cookieId);
  });
}

function drawLine(cookieId, x1, y1, x2, y2, color, width, emit, brush = 'normal') {
  const ctx = cookieContexts[cookieId];
  
  if (!ctx) {
    console.error('Context not found for cookie', cookieId);
    return;
  }
  
  if (brush === 'sprinkles') {
    // Draw the sprinkles along the path
    const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    const steps = Math.ceil(distance / 5);
    
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const x = x1 + (x2 - x1) * t;
      const y = y1 + (y2 - y1) * t;
      
      // Random offset for natural sprinkle placement
      const offsetX = (Math.random() - 0.5) * width * 2;
      const offsetY = (Math.random() - 0.5) * width * 2;
      
      // Random sprinkle size + rotations
      const sprinkleWidth = Math.random() * 2 + 1;
      const sprinkleHeight = Math.random() * 4 + 3;
      const angle = Math.random() * Math.PI;
      
      ctx.save();
      ctx.translate(x + offsetX, y + offsetY);
      ctx.rotate(angle);
      ctx.fillStyle = color;
      ctx.fillRect(-sprinkleWidth / 2, -sprinkleHeight / 2, sprinkleWidth, sprinkleHeight);
      ctx.restore();
    }
  } else {
    // Normal brush
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }

  if (emit) {
    socket.emit('draw', { cookieId, x1, y1, x2, y2, color, width, brush });
  }
}

// Receive drawing from other users
socket.on('draw', ({ cookieId, x1, y1, x2, y2, color, width, brush }) => {
  drawLine(cookieId, x1, y1, x2, y2, color, width, false, brush || 'normal');
});

// To load existing drawings when joining
socket.on('load-drawings', (drawings) => {
  console.log('Loading', drawings.length, 'existing drawings');
  drawings.forEach(({ cookieId, x1, y1, x2, y2, color, width, brush }) => {
    drawLine(cookieId, x1, y1, x2, y2, color, width, false, brush || 'normal');
  });
});

// Color picker and also preset colors
const colorPicker = document.getElementById('color-picker');
if (colorPicker) {
  colorPicker.addEventListener('input', (e) => {
    currentColor = e.target.value;
  });
}

const colorPresets = document.querySelectorAll('.color-preset');
colorPresets.forEach(btn => {
  btn.addEventListener('click', () => {
    const color = btn.dataset.color;
    currentColor = color;
    if (colorPicker) {
      colorPicker.value = color;
    }
  });
});

// Brush size
const brushSize = document.getElementById('brush-size');
const brushSizeValue = document.getElementById('brush-size-value');
if (brushSize) {
  brushSize.addEventListener('input', (e) => {
    lineWidth = parseInt(e.target.value);
    if (brushSizeValue) {
      brushSizeValue.textContent = lineWidth;
    }
  });
}

// Brush type selector
const brushButtons = document.querySelectorAll('.brush-btn');
brushButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    brushButtons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    if (btn.id === 'brush-normal') {
      brushType = 'normal';
    } else if (btn.id === 'brush-sprinkles') {
      brushType = 'sprinkles';
    }
  });
});

// Clear one specific cookie
const clearCookieBtn = document.getElementById('clear-cookie');
if (clearCookieBtn) {
  clearCookieBtn.addEventListener('click', () => {
    const ctx = cookieContexts[currentCookie];
    const canvas = cookieCanvases[currentCookie];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawCookieBase(ctx, canvas.width, canvas.height);
    socket.emit('clear-cookie', currentCookie);
  });
}

socket.on('clear-cookie', (cookieId) => {
  const ctx = cookieContexts[cookieId];
  const canvas = cookieCanvases[cookieId];
  if (ctx && canvas) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawCookieBase(ctx, canvas.width, canvas.height);
  }
});

// Clear all cookies
const clearAllBtn = document.getElementById('clear-all');
if (clearAllBtn) {
  clearAllBtn.addEventListener('click', () => {
    cookieContexts.forEach((ctx, i) => {
      const canvas = cookieCanvases[i];
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawCookieBase(ctx, canvas.width, canvas.height);
    });
    socket.emit('clear-all');
  });
}

socket.on('clear-all', () => {
  cookieContexts.forEach((ctx, i) => {
    const canvas = cookieCanvases[i];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawCookieBase(ctx, canvas.width, canvas.height);
  });
});

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeCookies);
} else {
  initializeCookies();
}
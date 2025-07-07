let video;
let handposeModel;
let predictions = [];
let hueVal = 0;
let showRect = false;


let gestureBuffer = [];
let bufferSize = 5;
let lastGestureTime = 0;
let gestureDelay = 200;
let currentGesture = 'none';
let confidence = 0;


const config = {
  openThreshold: 120,
  fistThreshold: 70,
  thumbThreshold: 30,
  thumbMovementThreshold: 40,
  gestureDelay: 200,
  bufferSize: 5,
  hueChangeSpeed: 2
};


let particles = [];
let showParticles = false;

function setup() {
  createCanvas(640, 480);
  colorMode(HSB, 360, 100, 100, 100);
  
 
  try {
    video = createCapture(VIDEO);
    video.size(width, height);
    video.hide();
  } catch (error) {
    console.error("Error accessing camera:", error);
    return;
  }

  handposeModel = ml5.handpose(video, modelLoaded);
  handposeModel.on("predict", results => {
    predictions = results;
  });
}

function modelLoaded() {
  console.log("Handpose model loaded successfully.");
}

function draw() {
  image(video, 0, 0, width, height);

  if (predictions.length > 0) {
    const landmarks = predictions[0].landmarks;
    handleGestures(landmarks);
    drawKeypoints(landmarks);
  }


  noStroke();
  fill(hueVal, 100, 100, 30);
  rect(0, 0, width, height);


  if (showRect) {
    fill(200, 100, 100, 80);
    rectMode(CENTER);
    rect(width/2, height/2, 100, 60);
    rectMode(CORNER);
  }

  
  if (showParticles) {
    updateParticles();
    drawParticles();
  }

 
  drawGestureInfo();
  drawColorWheel();
  drawInstructions();
}

function drawKeypoints(landmarks) {
  for (let i = 0; i < landmarks.length; i++) {
    const [x, y] = landmarks[i];
    fill(0, 0, 100);
    noStroke();
    ellipse(x, y, 8, 8);
    
   
    fill(0, 0, 100);
    textAlign(CENTER);
    textSize(10);
    text(i, x, y - 10);
  }
}

function handleGestures(landmarks) {
  const currentGestureDetected = detectGesture(landmarks);
  

  gestureBuffer.push(currentGestureDetected);
  if (gestureBuffer.length > bufferSize) {
    gestureBuffer.shift();
  }
  
 
  const consistentGesture = getMostFrequentGesture(gestureBuffer);
  
  // Apply debouncing
  if (millis() - lastGestureTime > gestureDelay) {
    if (consistentGesture !== 'none') {
      currentGesture = consistentGesture;
      applyGesture(consistentGesture);
      lastGestureTime = millis();
    }
  }
}

function detectGesture(landmarks) {
  const thumbTip = landmarks[4];
  const thumbMCP = landmarks[2];
  const indexTip = landmarks[8];
  const middleTip = landmarks[12];
  const ringTip = landmarks[16];
  const pinkyTip = landmarks[20];
  const wrist = landmarks[0];

  // thumb gestures
  const thumbYDiff = thumbTip[1] - thumbMCP[1];
  
  if (Math.abs(thumbTip[0] - thumbMCP[0]) < config.thumbThreshold) {
    if (thumbYDiff < -config.thumbMovementThreshold) return 'thumbUp';
    if (thumbYDiff > config.thumbMovementThreshold) return 'thumbDown';
  }


  const isOpen =
    dist(indexTip[0], indexTip[1], wrist[0], wrist[1]) > config.openThreshold &&
    dist(middleTip[0], middleTip[1], wrist[0], wrist[1]) > config.openThreshold &&
    dist(ringTip[0], ringTip[1], wrist[0], wrist[1]) > config.openThreshold &&
    dist(pinkyTip[0], pinkyTip[1], wrist[0], wrist[1]) > config.openThreshold;


  const isFist =
    dist(indexTip[0], indexTip[1], wrist[0], wrist[1]) < config.fistThreshold &&
    dist(middleTip[0], middleTip[1], wrist[0], wrist[1]) < config.fistThreshold &&
    dist(ringTip[0], ringTip[1], wrist[0], wrist[1]) < config.fistThreshold &&
    dist(pinkyTip[0], pinkyTip[1], wrist[0], wrist[1]) < config.fistThreshold;


  if (detectPeaceSign(landmarks)) return 'peace';
  

  if (detectPointingGesture(landmarks)) return 'pointing';

  if (isOpen) return 'open';
  if (isFist) return 'fist';
  return 'none';
}

function detectPeaceSign(landmarks) {
  const indexTip = landmarks[8];
  const middleTip = landmarks[12];
  const ringTip = landmarks[16];
  const pinkyTip = landmarks[20];
  const wrist = landmarks[0];
  
  const indexUp = dist(indexTip[0], indexTip[1], wrist[0], wrist[1]) > 100;
  const middleUp = dist(middleTip[0], middleTip[1], wrist[0], wrist[1]) > 100;
  const ringDown = dist(ringTip[0], ringTip[1], wrist[0], wrist[1]) < 80;
  const pinkyDown = dist(pinkyTip[0], pinkyTip[1], wrist[0], wrist[1]) < 80;
  
  return indexUp && middleUp && ringDown && pinkyDown;
}

function detectPointingGesture(landmarks) {
  const indexTip = landmarks[8];
  const middleTip = landmarks[12];
  const ringTip = landmarks[16];
  const pinkyTip = landmarks[20];
  const wrist = landmarks[0];
  
  const indexUp = dist(indexTip[0], indexTip[1], wrist[0], wrist[1]) > 100;
  const othersDown = 
    dist(middleTip[0], middleTip[1], wrist[0], wrist[1]) < 80 &&
    dist(ringTip[0], ringTip[1], wrist[0], wrist[1]) < 80 &&
    dist(pinkyTip[0], pinkyTip[1], wrist[0], wrist[1]) < 80;
  
  return indexUp && othersDown;
}

function getMostFrequentGesture(buffer) {
  const counts = {};
  buffer.forEach(gesture => {
    counts[gesture] = (counts[gesture] || 0) + 1;
  });
  return Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b);
}

function applyGesture(gesture) {
  switch(gesture) {
    case 'thumbUp':
      hueVal = (hueVal + config.hueChangeSpeed) % 360;
      break;
    case 'thumbDown':
      hueVal = (hueVal - config.hueChangeSpeed + 360) % 360;
      break;
    case 'open':
      showRect = true;
      break;
    case 'fist':
      showRect = false;
      break;
    case 'peace':
      showParticles = true;
      createParticles();
      break;
    case 'pointing':
      showParticles = false;
      particles = [];
      break;
  }
}

function createParticles() {
  for (let i = 0; i < 5; i++) {
    particles.push({
      x: random(width),
      y: random(height),
      vx: random(-2, 2),
      vy: random(-2, 2),
      size: random(5, 15),
      hue: random(360),
      life: 255
    });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 2;
    
    if (p.life <= 0) {
      particles.splice(i, 1);
    }
  }
}

function drawParticles() {
  for (let p of particles) {
    fill(p.hue, 100, 100, p.life);
    noStroke();
    ellipse(p.x, p.y, p.size);
  }
}

function drawGestureInfo() {
  fill(0, 0, 100);
  textAlign(LEFT);
  textSize(16);
  text(`Current Gesture: ${currentGesture}`, 10, 30);
  text(`Hue: ${Math.round(hueVal)}°`, 10, 50);
  text(`Buffer Size: ${gestureBuffer.length}`, 10, 70);
  text(`Rectangle: ${showRect ? 'ON' : 'OFF'}`, 10, 90);
  text(`Particles: ${showParticles ? 'ON' : 'OFF'}`, 10, 110);
}

function drawColorWheel() {
  push();
  translate(width - 60, 60);
  noFill();
  strokeWeight(10);
  for (let i = 0; i < 360; i += 10) {
    stroke(i, 100, 100);
    arc(0, 0, 40, 40, radians(i), radians(i + 10));
  }
  

  stroke(0, 0, 100);
  strokeWeight(2);
  let angle = radians(hueVal);
  line(0, 0, cos(angle) * 25, sin(angle) * 25);
  pop();
}

function drawInstructions() {
  fill(0, 0, 100);
  textAlign(RIGHT);
  textSize(12);
  text("👍 Thumb Up: Increase Hue", width - 10, height - 100);
  text("👎 Thumb Down: Decrease Hue", width - 10, height - 85);
  text("✋ Open Hand: Show Rectangle", width - 10, height - 70);
  text("✊ Fist: Hide Rectangle", width - 10, height - 55);
  text("✌️ Peace Sign: Show Particles", width - 10, height - 40);
  text("👉 Pointing: Hide Particles", width - 10, height - 25);
  text("Press 'C' to calibrate", width - 10, height - 10);
}


function calibrateGestures() {
  if (predictions.length > 0) {
    const landmarks = predictions[0].landmarks;
    
    
    const handSize = dist(landmarks[0][0], landmarks[0][1], landmarks[9][0], landmarks[9][1]);
    config.openThreshold = handSize * 1.2;
    config.fistThreshold = handSize * 0.7;
    
    console.log(`Calibrated for hand size: ${handSize}`);
    console.log(`New thresholds - Open: ${config.openThreshold}, Fist: ${config.fistThreshold}`);
  }
}


function keyPressed() {
  if (key === 'c' || key === 'C') {
    calibrateGestures();
  }
  if (key === 'r' || key === 'R') {
    hueVal = 0;
    showRect = false;
    showParticles = false;
    particles = [];
    gestureBuffer = [];
    currentGesture = 'none';
  }
  if (key === 's' || key === 'S') {
   
    saveCanvas('gesture-detection', 'png');
  }
}
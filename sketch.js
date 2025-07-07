let video;
let handposeModel;
let predictions = [];
let hueVal = 0;
let showRect = false;

function setup() {
  createCanvas(640, 480);
  colorMode(HSB, 360, 100, 100, 100);
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();

  handposeModel = ml5.handpose(video, () => {
    console.log("Handpose model loaded.");
  });

  handposeModel.on("predict", results => {
    predictions = results;
  });
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
    rect(width/2, height/2, 100, 60);
  }
}

function drawKeypoints(landmarks) {
  for (let i = 0; i < landmarks.length; i++) {
    const [x, y] = landmarks[i];
    fill(0, 0, 100);
    noStroke();
    ellipse(x, y, 8, 8);
  }
}

function handleGestures(landmarks) {
  const thumbTip = landmarks[4];
  const thumbMCP = landmarks[2];
  const indexTip = landmarks[8];
  const middleTip = landmarks[12];
  const ringTip = landmarks[16];
  const pinkyTip = landmarks[20];
  const wrist = landmarks[0];

  const thumbYDiff = thumbTip[1] - thumbMCP[1];

  if (Math.abs(thumbTip[0] - thumbMCP[0]) < 30) {
    if (thumbYDiff < -40) {
      hueVal = (hueVal + 2) % 360;
    } else if (thumbYDiff > 40) {
      hueVal = (hueVal - 2 + 360) % 360;
    }
  }

  const openThreshold = 120;
  const isOpen =
    dist(indexTip[0], indexTip[1], wrist[0], wrist[1]) > openThreshold &&
    dist(middleTip[0], middleTip[1], wrist[0], wrist[1]) > openThreshold &&
    dist(ringTip[0], ringTip[1], wrist[0], wrist[1]) > openThreshold &&
    dist(pinkyTip[0], pinkyTip[1], wrist[0], wrist[1]) > openThreshold;

  const isFist =
    dist(indexTip[0], indexTip[1], wrist[0], wrist[1]) < 70 &&
    dist(middleTip[0], middleTip[1], wrist[0], wrist[1]) < 70 &&
    dist(ringTip[0], ringTip[1], wrist[0], wrist[1]) < 70 &&
    dist(pinkyTip[0], pinkyTip[1], wrist[0], wrist[1]) < 70;

  if (isOpen) {
    showRect = true;
  } else if (isFist) {
    showRect = false;
  }
}

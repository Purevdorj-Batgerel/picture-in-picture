let analyser;

let audio = document.createElement('audio');
audio.crossOrigin = 'anonymous';

const BASE_URL = 'https://storage.googleapis.com/media-session/';
const track = {
  src: BASE_URL + 'sintel/snow-fight.mp3',
  title: 'Snow Fight',
  artist: 'Jan Morgenstern',
  album: 'Sintel',
  artwork: [
    {
      src: BASE_URL + 'sintel/artwork-96.png',
      sizes: '96x96',
      type: 'image/png',
    },
    {
      src: BASE_URL + 'sintel/artwork-128.png',
      sizes: '128x128',
      type: 'image/png',
    },
    {
      src: BASE_URL + 'sintel/artwork-192.png',
      sizes: '192x192',
      type: 'image/png',
    },
    {
      src: BASE_URL + 'sintel/artwork-256.png',
      sizes: '256x256',
      type: 'image/png',
    },
    {
      src: BASE_URL + 'sintel/artwork-384.png',
      sizes: '384x384',
      type: 'image/png',
    },
    {
      src: BASE_URL + 'sintel/artwork-512.png',
      sizes: '512x512',
      type: 'image/png',
    },
  ],
},

function onPlayButtonClick() {
  playAudio();
}

function log(text) {
  console.log(text);
}

function draw() {
  ctx.drawImage(canvas.offScreenCanvas, 0, 0);
  if (analyser) {
    visualize();
  }

  requestAnimationFrame(draw);
}

let max = -1;
function visualize() {
  analyser.fftSize = 256;
  let bufferLength = analyser.frequencyBinCount;
  let dataArray = new Uint8Array(bufferLength);

  analyser.getByteFrequencyData(dataArray);
  let barWidth = 512 / bufferLength;
  let barHeight;
  let x = 0;

  for (let i = 0; i < bufferLength; i++) {
    ctx.save();
    barHeight = dataArray[i];
    if (max < dataArray[i]) {
      max = dataArray[i];
    }
    ctx.fillStyle = 'rgba(255, 255, 255,.8)';
    ctx.fillRect(x, 512 - barHeight, barWidth, barHeight);
    x += barWidth + 1;
    ctx.restore();
  }
}

async function playAudio() {
  audio.src = track.src;
  try {
    // Play audio
    await audio.play();

    // Update Media Session metadata
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      album: track.album,
      artwork: track.artwork,
    });

    // create New analyser WEB AUDIO API
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    analyser.minDecibels = -110;
    analyser.maxDecibels = -30;
    analyser.smoothingTimeConstant = 0.9;

    const source = audioCtx.createMediaElementSource(audio);
    source.connect(analyser);
    analyser.connect(audioCtx.destination);

    // Show track album in a Picture-in-Picture window
    await showPictureInPictureWindow();

    requestAnimationFrame(draw);

    log(`Playing "${track.album}" audio track in Picture-in-Picture...`);
  } catch (error) {
    log(error);
  }
}

/* Picture-in-Picture Canvas */

const canvas = document.createElement('canvas');
canvas.width = canvas.height = 512;
const ctx = canvas.getContext('2d', { alpha: false });
canvas.offScreenCanvas = document.createElement('canvas');
canvas.offScreenCanvas.height = canvas.offScreenCanvas.width = 512;

const video = document.createElement('video');
video.srcObject = canvas.captureStream();
video.muted = true;

const image = new Image();
image.crossOrigin = true;

async function showPictureInPictureWindow() {
  image.src = [...navigator.mediaSession.metadata.artwork].pop().src;
  await image.decode();

  canvas.offScreenCanvas
    .getContext('2d', { alpha: false })
    .drawImage(image, 0, 0, 512, 512);
  ctx.drawImage(canvas.offScreenCanvas, 0, 0);
  await video.play();
  await video.requestPictureInPicture();
}

audio.addEventListener('ended', function () {
  log("Audio Ended");
  // playAudio();
});

/* Feature Support */

playButton.disabled = !document.pictureInPictureEnabled;

// By @fupete (c) 2024 | MIT License
//
// Credits: the base keyboard VJ engine idea is inspired and builded upon the works: 
// RBVJ by George Gally Radarboy https://github.com/GeorgeGally/rbvj/ 
// P5-VJ by Salil Parekh https://github.com/burnedsap/p5-vj 
//
// HELP:
// [0-9] changeSet (and choose the first [A] sketch] 
// [A-Z] changeSketch ([A] sketch is always empty/black screen)
// [\] toggleMouse
// [F6] toggleFullscreen
// [?] [shift+?] activate mic audio support
// [mouse] orbit controls + depends on the sketch (testing)
// 
// SCENES:
// 0 - COLORS
// 1 - MIRROR
// 2 - BIG
// 3 - LANDSCAPE
// 4 - MACRO
// ...
// 
// COMING UP: 
// - Initial loader
// - Optional menu 
// - TouchOSC support

import "./init"
import * as THREE from 'three'
import * as GUI from 'dat.gui'
import * as CANNON from 'cannon-es'
import * as NOISE from 'simplex-noise'
import Stats from 'three/addons/libs/stats.module.js'
global.THREE = THREE
global.GUI = GUI
global.CANNON = CANNON
global.NOISE = NOISE
global.PI = Math.PI

global.showStats = false // xxx

let myThree
const artFolder = "sketch"
let current_sketch = 0
let current_set = 0
let isFullscreen = false
let showCursor = false
let areTexturesReady = false
global.canvas3D = document.getElementById("canvas3D") // global canvas3D

let playingDirector = false
let nextCut

// CHANGE SET & SKETCH
const changeSet = (set) => {
	current_set = set
	changeSketch(0)
}
const isSketchValid = (url) => {
	const http = new XMLHttpRequest()
	http.open('HEAD', url, false)
	http.send()
	return http.status == 200
}
const changeSketch = (sketch) => {
	sketch
	const loc = current_set + '/' + sketch
	const sketchName = loc + '.js'
	// if (isSketchValid(`../sketch/${sketchName}`)) { // <<< enable locally to avoid stops on empty sketches
		current_sketch = sketch
		loadSketch(sketchName)
		// console.log('Loading Sketch: ' + sketchName)
		document.location.hash = loc
	// }
}
const loadSketch = async (sketchName) => {
	if (myThree?.dispose()) {
		myThree.dispose()
		myThree = {}
	}
	// canvas3D.replaceChildren()
	myThree = await import(`../sketch/${sketchName}`)
	myThree.sketch() // LET'S ROCK
}
global.map = (value, min1, max1, min2, max2) => {
	const returnvalue = ((value - min1) / (max1 - min1) * (max2 - min2)) + min2
	return returnvalue
}

// MICROPHONE INPUT (info https://medium.com/hackernoon/creative-coding-using-the-microphone-to-make-sound-reactive-art-part1-164fd3d972f3)
class mic {
	constructor(_fft) {
		const FFT_SIZE = _fft || 1024
		this.spectrum_size = FFT_SIZE / 2
		this.spectrum = []
		this.volume = this.vol = 0
		this.peak_volume = 0
		let self = this
		const audioContext = new AudioContext()
		const SAMPLE_RATE = audioContext.sampleRate
		window.AudioContext = window.AudioContext || window.webkitAudioContext || window.mozAudioContext
		navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia

		function startMic(context) {
			const processSound = (stream) => {
				// console.log("Starting microphone...")
				// analyser extracts frequency, waveform, and other data
				const analyser = context.createAnalyser()
				analyser.smoothingTimeConstant = 0.2
				analyser.fftSize = FFT_SIZE
				let node = context.createScriptProcessor(FFT_SIZE * 2, 1, 1)
				node.onaudioprocess = () => {
					// bitcount returns array which is half the FFT_SIZE
					self.spectrum = new Uint8Array(analyser.frequencyBinCount)
					// getByteFrequencyData returns the amplitude for each frequency
					analyser.getByteFrequencyData(self.spectrum)
					// getByteTimeDomainData gets volumes over the sample time
					//analyser.getByteTimeDomainData(dataArray)
					self.vol = self.getRMS(self.spectrum)
					// get peak
					if (self.vol > self.peak_volume)
						self.peak_volume = self.vol
					self.volume = self.vol
				}
				const input = context.createMediaStreamSource(stream)
				input.connect(analyser)
				analyser.connect(node)
				node.connect(context.destination)
			}
			const error = () => {
				console.log(arguments)
			}
			navigator.getUserMedia({ audio: true }, processSound, error)
		}
		try {
			startMic(new AudioContext())
		}
		catch (e) {
			console.error(e)
			alert('Web Audio API is not supported in this browser')
		}
		// SOUND UTILITIES
		this.mapSound = function (_me, _total, _min, _max) {
			if (self.spectrum.length > 0) {
				const min = _min || 0
				const max = _max || 100
				//actual new freq
				const new_freq = Math.round(_me / _total * self.spectrum.length)
				//console.log(Math.round(self.peak_volume) + " : " + Math.round(self.spectrum[new_freq]))
				// map the volumes to a useful number
				const s = map(self.spectrum[new_freq], 0, self.peak_volume, min, max)
				//console.log(s)
				return s
			}
			else
				return 0
		}
		this.getVol = function (_min, _max) {
			const min_max = _min || 100
			const min = _min || 0
			const max = _max || min_max
			// map total volume to 100 for convenience
			self.volume = map(self.vol, 0, self.peak_volume, min, max)
			return self.volume || 0
		}
		this.getVolume = function () { return this.getVol() }
		//A more accurate way to get overall volume
		this.getRMS = function (spectrum) {
			var rms = 0
			for (var i = 0; i < spectrum.length; i++) {
				rms += spectrum[i] * spectrum[i]
			}
			rms /= spectrum.length
			rms = Math.sqrt(rms)
			return rms
		}
		//freq = n * SAMPLE_RATE / MY_FFT_SIZE
		global.mapFreq = function (i) {
			// const freq = i * SAMPLE_RATE / FFT_SIZE;
			const freq = i * SAMPLE_RATE / self.spectrum.length
			return freq
		}
		// getMix function. Computes the current frequency with
		// computeFreqFromFFT, then returns bass, mids and his
		// sub bass : 0 > 100hz
		// mid bass : 80 > 500hz
		// mid range: 400 > 2000hz
		// upper mid: 1000 > 6000hz
		// high freq: 4000 > 12000hz
		// Very high freq: 10000 > 20000hz and above
		this.getMix = function () {
			var highs = []
			var mids = []
			var bass = []
			var bass = []
			for (var i = 0; i < self.spectrum.length; i++) {
				var band = mapFreq(i)
				var v = map(self.spectrum[i], 0, self.peak_volume, 0, 100)
				if (band < 500) {
					bass.push(v)
				}
				if (band > 400 && band < 6000) {
					mids.push(v)
				}
				if (band > 4000) {
					highs.push(v)
				}
			}
			return { bass: bass, mids: mids, highs: highs }
		}
		this.getBass = function () {
			return this.getMix().bass
		}
		this.getMids = function () {
			return this.getMix().mids
		}

		this.getHighs = function () {
			return this.getMix().highs
		}
		this.getHighsVol = function (_min, _max) {
			var min = _min || 0
			var max = _max || 100
			var v = global.map(this.getRMS(this.getMix().highs), 0, self.peak_volume, min, max)
			return v
		}
		this.getMidsVol = function (_min, _max) {
			var min = _min || 0
			var max = _max || 100
			var v = map(this.getRMS(this.getMix().mids), 0, self.peak_volume, min, max)
			return v
		}
		this.getBassVol = function (_min, _max) {
			var min = _min || 0
			var max = _max || 100
			var v = map(this.getRMS(this.getMix().bass), 0, self.peak_volume, min, max)
			return v
		}
		return this
	}
}
global.initAudio = () => { // OPENDAY 2024 AND BROWSER EDITION + SOUNDTRACK
	global.MIC = new mic()
	// console.log(global.MIC)
	document.getElementById("loader").style.display = "none"
	toggleFullscreen();
	toggleMouse();
	randomSketch()
	toggleDirector()
	const soundtrack = document.createElement('audio')
	soundtrack.src = "assets/soundtrack/soundtrack.mp3"
	soundtrack.loop = true;
	soundtrack.play();
}

// UI
const onKeyDown = (event) => {
	if (areTexturesReady) {
		var keyCode = event.keyCode
		if (keyCode >= 65 && keyCode <= 90)
			changeSketch(keyCode - 65) // a-z
		else if (keyCode >= 48 && keyCode <= 57) { // 0-9
			changeSet(keyCode - 48)
		} else if (keyCode == 220) toggleMouse() // \
		else if (keyCode == 117) {
			event.preventDefault()
			toggleFullscreen() // F6
		}
		else if (keyCode == 222) initAudio() // (shift) + ?
		else if (keyCode == 32) { // SPACE - Change to a random set and sketch
			event.preventDefault()
			randomSketch()
		} else if (keyCode == 13) { // RETURN - Reclick current sketch
			event.preventDefault()
			reclickSketch()
		} else if (keyCode == 116) {
			event.preventDefault() // F5 - Director mode
			toggleDirector()
		}
	}
}
window.addEventListener('keydown', function (e) {
	if (typeof onKeyDown == 'function') onKeyDown(e);
})
const toggleMouse = () => {
	showCursor = !showCursor
	if (showCursor) window.document.body.style.cursor = 'crosshair'
	else window.document.body.style.cursor = 'none'
}
const toggleDirector = () => {
	if (!playingDirector) {
		document.getElementById("directorModeStatus").style.display = "initial"
		playingDirector = true;
		playDirector();
	} else {
		document.getElementById("directorModeStatus").style.display = "none"
		playingDirector = false;
		clearInterval(nextCut);
	}
}
const toggleFullscreen = () => {
	isFullscreen = false
	if (document.fullscreenElement == null) {
		canvas3D.requestFullscreen()
		isFullscreen = true
	} else {
		document.exitFullscreen()
		isFullscreen = false
	}
}

// TEXTURES PRELOAD
THREE.Cache.enabled = true
THREE.DefaultLoadingManager.onLoad = () => {
	// console.log('Loading Complete!')
	areTexturesReady = true
	document.getElementById("loaderButton").style.display = "initial"
	document.getElementById("loaderText").style.display = "none"
}
global.cubeTextures = []
const loadCubeTexture = (name, path, format) => {
	const urls = [
		path + 'px' + format, path + 'nx' + format,
		path + 'py' + format, path + 'ny' + format,
		path + 'pz' + format, path + 'nz' + format
	]
	const cubeTextureLoader = new THREE.CubeTextureLoader()
	global.cubeTextures.push({
		name: name,
		texture: cubeTextureLoader.load(urls, (cube) => {
			cube.colorSpace = THREE.SRGBColorSpace
			// console.log('loadedCubeTexture: ' + cube)
		})
	})
}
global.textures = []
const loadTexture = (name, path, format) => {
	const textureLoader = new THREE.TextureLoader()
	const url = path + format
	global.textures.push({
		name: name,
		texture: textureLoader.load(url, (texture) => {
			texture.colorSpace = THREE.SRGBColorSpace
			// console.log('loadedTexture: ' + texture)
		})
	})
}
// Let's preload our textures
// global.cubeTextures[n]
loadCubeTexture('PureSky', './assets/textures/cube/PureSky-256/', '.png') // 0
loadCubeTexture('PureSky', './assets/textures/cube/PureSky-2048/', '.png') // 1
// ...
// global.textures[n]
loadTexture('luna_1k_diff', './assets/textures/luna_1k_diff', '.png') // 0
loadTexture('eye', './assets/models/eye/textures/01___Default_baseColor1', '.jpeg') // 1
loadTexture('luna_1k_diff', './assets/textures/luna_1k_diff', '.jpg') // 2
loadTexture('NASA_moon', './assets/textures/moon/moon', '.png') // 5 > 3
loadTexture('NASA_moon_disp', './assets/textures/moon/moon_disp', '.png') // 6 > 4

/// ...
// INIT
const init = () => {
	window.document.body.style.cursor = 'none'
	toggleMouse() // xxx OPENDAY 2024 AND BROWSER EDITION */ 
	changeSet(0)
	// RENDERER
	global.renderer = new THREE.WebGLRenderer({
		alpha: true,
		antialias: true
	})
	renderer.shadowMap.enabled = true // < Shadows enabled
	renderer.shadowMap.Type = THREE.PCFShadowMap // BasicShadowMap | PCFShadowMap | PCFSoftShadowMap | THREE.VSMShadowMap
	renderer.toneMapping = THREE.ACESFilmicToneMapping
	renderer.toneMappingExposure = 1.2
	renderer.setSize(window.innerWidth, window.innerHeight)
	canvas3D.appendChild(renderer.domElement)
	if (showStats) {
		global.stats = new Stats() // XXX
		canvas3D.appendChild(stats.dom)
	}
}
window.addEventListener('load', init)

/* xxx OPENDAY 2024 AND BROWSER EDITION */
/* change to a random set and sketch */
const randomSketch = () => {
	/* 
	0 Landscapes
	1 Mirrors
	2 Textiles
	3 Surrealism
	4 Tarots
	5 Madness
	*/
	const sets = [0, 1, 2, 3, 4, 5] // available sets
	const setsWeights = [0.30, 0.20, 0.30, 0.10, 0.05, 0.05] // available sets: probability weight (sum = 1)
	const sketches = [10, 2, 8, 3, 3, 2] // no. of available sketches for each set
	// playSet
	// pure random
	// global.playSet = Math.round(Math.random() * (sets.length - 1));
	// weighted random
	// let totalWeights = setsWeights.reduce((a, b) => a + b, 0)
	const totalWeights = 1
	// console.log(totalWeights)
	let r = Math.random() * totalWeights
	global.playSet = sets.find((_, i) => (r -= setsWeights[i]) <= 0)
	// playSketch
	const playSetHowManySketches = sketches[playSet];
	global.playSketch = 1 + Math.floor(Math.random() * (playSetHowManySketches));
	// console.log(playSet, playSetHowManySketches, playSketch);
	changeSet(global.playSet);
	changeSketch(global.playSketch);
}

/* reclick (re-init) current sketch */
const reclickSketch = () => {
	if (global.playSketch) {
		changeSketch(global.playSketch);
	}
}

/* director mode, auto play and switch between sketches 5-30 sec */
const playDirector = () => {
	const randSec = 5 + Math.round(Math.random() * 25);
	nextCut = setTimeout(() => {
		const randSix = Math.round(Math.random() * 6);
		if (randSix > 4) reclickSketch(); // 1/3 chances next reclick current sketch
		else randomSketch(); // 2/3 chances next random sketch
		playDirector()
	}, randSec * 1000);
}

/* Double tap check - based on this http://jsfiddle.net/brettwp/J4djY/*/
const detectDoubleTapClosure = () => {
	let lastTap = 0;
	let timeout;
	return function detectDoubleTap(event) {
		const curTime = new Date().getTime();
		const tapLen = curTime - lastTap;
		if (tapLen < 500 && tapLen > 0) {
			// console.log('Double tapped!');
			randomSketch();
			event.preventDefault();
		} else {
			timeout = setTimeout(() => {
				clearTimeout(timeout);
			}, 500);
		}
		lastTap = curTime;
	};
}
/* Regex test to determine if user is on mobile */
if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
	document.body.addEventListener('touchend', detectDoubleTapClosure(), { passive: false });
}

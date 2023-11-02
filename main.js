const canvas = document.getElementById("myCanvas");
canvas.width = 400;
const loadingScreen = document.getElementById("loading-screen");
const gameContainer = document.getElementById("game-container");
const startButton = document.getElementById("start-button");
let distance = 0;

const ctx = canvas.getContext("2d");
const field = new Field(canvas.width / 2, canvas.width * 0.95);

const N = 250;
const cops = generateCars(N);
let bestCar = cops[0];
if (localStorage.getItem("bestBrain")) {
	for (let i = 0; i < cops.length; i++) {
		cops[i].brain = JSON.parse(localStorage.getItem("bestBrain"));
		if (i != 0) {
			NeuralNetwork.mutate(cops[i].brain, 0.2);
		}
	}
}
const player = new Player(field.getLaneCenter(1), 100, 30, 50, "KEYS");

const traffic = [
	new Player(field.getLaneCenter(4), -100, 30, 50, "DUMMY", 0.5),
];

const car = document.getElementById("car");
const popo = document.getElementById("police");
car.onload = initializeGame;
car.src = "images/car2.avif";

startButton.addEventListener("click", startGame);

//Game Over Stuff
const endScreen = document.getElementById("game-over-screen");
const restartButton = document.getElementById("restart-button");
restartButton.addEventListener("click", resetGame);

function resetGame() {
	player.reset();
	traffic.length = 0;
	for (let i = 0; i < cops.length; i++) {
		cops[i].reset();
	}
}

const trafficImages = [
	"traffic/car.png",
	"traffic/hb_u36.png",
	"traffic/ship.gif",
	"traffic/biker.png",
	"traffic/car4.png",
	"traffic/car5.png",
	"traffic/tank.gif",
	"traffic/tank2.gif",
	"traffic/tank3.gif",
];

//Loading Screens
function initializeGame() {
	loadingScreen.style.display = "block"; // Show the loading screen
	gameContainer.style.display = "none"; // Hide the game container
	startButton.disabled = false;
}

function startGame() {
	loadingScreen.style.display = "none"; // Hide the loading screen
	gameContainer.style.display = "block"; // Show the game container
	startButton.style.display = "none";
	startButton.disabled = true;

	startAddingPlayers();
	animate();
}

//Traffic
function createTraffic() {
	const randomLane = Math.floor(Math.random() * 3);
	const randomX = field.getLaneCenter(randomLane);
	const newPlayer = new Player(randomX, player.y + -1000, 30, 50, "DUMMY", 0.5);

	//Gives traffic random image
	const randomImageIndex = Math.floor(Math.random() * trafficImages.length);
	const carImage = new Image();
	carImage.src = trafficImages[randomImageIndex];
	newPlayer.image = carImage;

	traffic.push(newPlayer);
}

function startAddingPlayers() {
	createTraffic();
	setInterval(createTraffic, 1000);
}

//Self - Drive;
function generateCars(N) {
	const cars = [];

	// Spawn the first car on lane 1
	cars.push(new Police(field.getLaneCenter(1), 200, 30, 50, "AI"));

	// Alternate between lane 0 and 2 for the rest of the cars
	for (let i = 2; i <= N; i++) {
		const lane = i % 2 === 0 ? 2 : 0;
		const offset = lane === 2 ? -42 : 42;
		setTimeout(() => {
			cars.push(
				new Police(field.getLaneCenter(lane) + offset, 300, 30, 50, "AI")
			);
		}, i * 100);
	}

	return cars;
}

function animate() {
	//Updates
	let closestDistance = Number.MAX_VALUE;
	let closestXDistance = Number.MAX_VALUE;
	let newBestCar;

	for (let i = 0; i < cops.length; i++) {
		const dx = cops[i].x - player.x;
		const dy = cops[i].y - player.y;
		const distance = Math.hypot(dx, dy);

		if (distance < closestDistance) {
			closestDistance = distance;
			closestXDistance = Math.abs(dx);
			newBestCar = cops[i];
		} else if (
			distance === closestDistance &&
			Math.abs(dx) < closestXDistance
		) {
			closestXDistance = Math.abs(dx);
			newBestCar = cops[i];
		}
	}

	bestCar = newBestCar;
	for (let i = 0; i < traffic.length; i++) {
		traffic[i].update(field.borders, []);
	}

	for (let i = 0; i < cops.length; i++) {
		cops[i].update(field.borders, traffic, bestCar);
	}
	player.update(field.borders, traffic, cops);

	canvas.height = window.innerHeight - 10;
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.save();
	ctx.translate(0, -player.y + canvas.height * 0.7);

	//Drawing cars on canvas
	field.draw(ctx);
	for (let k = 0; k < traffic.length; k++) {
		traffic[k].draw(ctx);
	}
	for (let k = 0; k < cops.length; k++) {
		cops[k].draw(ctx);
	}
	player.draw(ctx);
	ctx.fillStyle = "yellow";
	ctx.font = "20px 'Press Start 2P', 'consolas', sans-serif";
	const distanceText = `Distance: ${player.distance.toFixed(0)} meters`;
	const distanceTextWidth = ctx.measureText(distanceText).width;

	ctx.fillText(
		distanceText,
		canvas.width / 2 - distanceTextWidth / 2 + 10,
		player.y - player.height / 2 - 500
	);

	requestAnimationFrame(animate);
}

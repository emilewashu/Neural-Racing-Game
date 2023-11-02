class Police {
	constructor(x, y, width, height, controlType, maxSpeed = 4.9) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;

		this.speed = 0;
		this.acceleration = 0.15;
		this.maxSpeed = maxSpeed;
		this.friction = 0.05;
		this.angle = 0;
		this.damaged = false;
		this.image = document.getElementById("police");

		this.useBrain = controlType == "AI";

		if (controlType != "DUMMY") {
			this.sensor = new Sensor(this);
			this.brain = new NeuralNetwork([this.sensor.rayCount, 6, 4]);
		}
		this.controls = new Controls(controlType);
	}

	update(roadBorders, traffic, bestCar) {
		if (!this.damaged) {
			if (this == bestCar) {
				this.#chasePlayer(player, traffic);
			} else {
				this.#move();
			}
			this.polygon = this.#createPolygon();
			this.damaged = this.#assessDamage(roadBorders, traffic);
		}
		if (this.sensor) {
			this.sensor.update(roadBorders, traffic);
			const offsets = this.sensor.readings.map((s) =>
				s == null ? 0 : 1 - s.offset
			);
			const outputs = NeuralNetwork.feedForward(offsets, this.brain);
			console.log(outputs);
			if (this.useBrain) {
				this.controls.forward = outputs[0];
				this.controls.left = outputs[1];
				this.controls.right = outputs[2];
				this.controls.reverse = outputs[3];
			}
		}
	}

	#chasePlayer(player, traffic) {
		const distanceFromPlayer = 40; // Adjust this value as desired

		const dx = player.x - this.x;
		const dy = player.y - this.y;
		const distance = Math.hypot(dx, dy);

		if (distance > distanceFromPlayer) {
			this.angle = Math.atan2(dy, dx);
			if (this.angle < -Math.PI) {
				this.angle += 2 * Math.PI;
			}
			if (this.angle > Math.PI) {
				this.angle -= 2 * Math.PI;
			}

			// Accelerate towards the player
			if (this.speed < this.maxSpeed) {
				this.speed += this.acceleration;
			}
		} else {
			if (this.speed > 0) {
				this.speed -= this.acceleration;
			}
		}

		// Update position based on angle and speed
		this.x += Math.cos(this.angle) * this.speed;
		this.y += Math.sin(this.angle) * this.speed;
	}

	#assessDamage(roadBorders, traffic) {
		for (let i = 0; i < roadBorders.length; i++) {
			if (polysIntersect(this.polygon, roadBorders[i])) {
				return true;
			}
		}
		for (let i = 0; i < traffic.length; i++) {
			if (polysIntersect(this.polygon, traffic[i].polygon)) {
				return true;
			}
		}
		return false;
	}

	#createPolygon() {
		const points = [];
		const rad = Math.hypot(this.width, this.height) / 2;
		const alpha = Math.atan2(this.width, this.height);
		points.push({
			x: this.x - Math.sin(this.angle - alpha) * rad,
			y: this.y - Math.cos(this.angle - alpha) * rad,
		});
		points.push({
			x: this.x - Math.sin(this.angle + alpha) * rad,
			y: this.y - Math.cos(this.angle + alpha) * rad,
		});
		points.push({
			x: this.x - Math.sin(Math.PI + this.angle - alpha) * rad,
			y: this.y - Math.cos(Math.PI + this.angle - alpha) * rad,
		});
		points.push({
			x: this.x - Math.sin(Math.PI + this.angle + alpha) * rad,
			y: this.y - Math.cos(Math.PI + this.angle + alpha) * rad,
		});
		return points;
	}

	#move() {
		this.speed++;

		if (this.speed > this.maxSpeed) {
			this.speed = this.maxSpeed;
		}
		if (this.speed < -this.maxSpeed / 2) {
			this.speed = -this.maxSpeed / 2;
		}

		if (this.speed > 0) {
			this.speed -= this.friction;
		}
		if (this.speed < 0) {
			this.speed += this.friction;
		}
		if (Math.abs(this.speed) < this.friction) {
			this.speed = 0;
		}

		// Adjust the initial angle to face upward
		this.angle = -Math.PI / 2;

		// Swap sin and cos functions to face upward
		this.x += Math.cos(this.angle) * this.speed;
		this.y += Math.sin(this.angle) * this.speed;
	}

	draw(ctx) {
		const isBestCar = this === bestCar;

		if (isBestCar) {
			ctx.save();
			ctx.translate(this.x, this.y);
			ctx.rotate(this.angle + Math.PI / 2);

			ctx.beginPath();
			ctx.drawImage(
				this.image,
				-this.width / 2,
				-this.height / 2,
				this.width * 2.3,
				this.height * 2.3
			);
			if (this.damaged) {
				this.distance = 0;
			}

			ctx.fill();

			ctx.restore();
		}
	}
	reset() {
		this.x = field.getLaneCenter(1);
		this.y = 300;
		this.speed = 0;
		this.angle = 0;
		this.damaged = false;
		const gameOverScreen = document.getElementById("game-over-screen");
		gameOverScreen.style.display = "none";
	}
}

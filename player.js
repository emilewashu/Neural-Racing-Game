class Player {
	constructor(x, y, width, height, controlType, maxSpeed = 5) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.speed = 0;
		this.acceleration = 0.2;
		this.maxSpeed = maxSpeed;
		this.friction = 0.05;
		this.angle = 0;
		this.damaged = false;
		this.image = document.getElementById("car");
		this.image2 = document.getElementById("boom");
		this.distance = 0;

		if (controlType != "DUMMY") {
			this.sensor = new Sensor(this);
			this.brain = new NeuralNetwork([this.sensor.rayCount, 6, 4]);
		}
		this.controls = new Controls(controlType);
	}

	update(roadBorders, traffic, cops) {
		if (!this.damaged) {
			this.#move();
			this.polygon = this.#createPolygon();
			this.damaged = this.#assessDamage(roadBorders, traffic, cops);
		}
		if (this.sensor) {
			this.sensor.update(roadBorders, traffic);
		}
		const distanceIncrement = Math.abs(this.speed) * 0.02;
		this.distance += distanceIncrement;
	}

	#assessDamage(roadBorders, traffic, cops) {
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
		if (cops !== undefined) {
			for (let i = 0; i < cops.length; i++) {
				if (polysIntersect(this.polygon, cops[i].polygon)) {
					return true;
				}
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

		if (this.speed != 0) {
			const flip = this.speed > 0 ? 1 : -1;
			if (this.controls.left) {
				this.angle += 0.03 * flip;
			}
			if (this.controls.right) {
				this.angle -= 0.03 * flip;
			}
		}

		this.x -= Math.sin(this.angle) * this.speed;
		this.y -= Math.cos(this.angle) * this.speed;
	}

	draw(ctx) {
		ctx.save();
		ctx.translate(this.x, this.y);
		ctx.rotate(-this.angle);

		ctx.beginPath();
		ctx.drawImage(
			this.image,
			-this.width / 2,
			-this.height / 2,
			this.width * 2.3,
			this.height * 2.3
		);
		if (this.damaged) {
			this.crash();
			ctx.drawImage(
				this.image2,
				-this.width / 0.7,
				-this.height / 2,
				this.width * 4,
				this.height * 2.1
			);
			this.distance = 0;
		}

		ctx.fill();

		ctx.restore();
	}
	crash() {
		this.damaged = true;
		const gameOverScreen = document.getElementById("game-over-screen");
		gameOverScreen.style.display = "flex";
	}
	reset() {
		this.x = field.getLaneCenter(1);
		this.y = 100;
		this.speed = 0;
		this.angle = 0;
		this.damaged = false;
		const gameOverScreen = document.getElementById("game-over-screen");
		gameOverScreen.style.display = "none";
	}
}

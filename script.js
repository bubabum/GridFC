"use strict";

const config = {
	dX: 0,
	dY: 0,
}

let ctx;
let plane = {}
let standartTile = {
	width: 585,
	height: 585,
	joint: 15,
}
const canvasPaddingX = 700;
const canvasPaddingY = 700;

function addCanvas(plane) {
	const canvas = document.createElement('canvas');
	ctx = canvas.getContext('2d');
	canvas.width = plane.width + canvasPaddingX * 2;
	canvas.height = plane.height + canvasPaddingY * 2;
	document.querySelector('.canvas').appendChild(canvas);
	renderCanvas();
}

function addPlane() {
	let planeWidth = Number(document.getElementById('planeWidth').value);
	let planeHeight = Number(document.getElementById('planeHeight').value);
	plane = {
		width: 5250,
		height: 2850,
		excisions: [],
		tiles: [],
	}
	addCanvas(plane);
}

function addExcision() {
	let excision = {
		width: 2000,
		height: 1500,
		dX: 700,
		dY: 500,
	}
	excision.x = canvasPaddingX + excision.dX;
	excision.y = canvasPaddingY + plane.height - excision.height - excision.dY;
	plane.excisions.push(excision);
	renderCanvas();
}

function addStandartTiles() {
	plane.tiles = [];
	let starPointX;
	let starPointY;
	if (config.dX > 0) {
		starPointX = canvasPaddingX - 570 + config.dX;
	} else {
		starPointX = canvasPaddingX + config.dX;
	}
	if (config.dY > 0) {
		starPointY = canvasPaddingY - 570 + config.dY;
	} else {
		starPointY = canvasPaddingY + config.dY;
	}
	for (let i = starPointX; i < canvasPaddingX + plane.width - 15; i += standartTile.width - standartTile.joint) {
		for (let j = starPointY; j < canvasPaddingY + plane.height - 15; j += standartTile.height - standartTile.joint) {
			let tile = {
				width: 585,
				height: 585,
				joint: 15,
				x: i,
				y: j,
			};
			plane.tiles.push(tile);
		}
	}
	// plane.tiles.forEach(element => {
	// 	element.x += config.dX;
	// 	element.y += config.dY;
	// })
	renderCanvas();
}

function checkExcisions() {
	for (let i = 0; i < plane.tiles.length; i++) {
		plane.excisions.forEach(element => {
			let tile = plane.tiles[i];
			let excision = element;
			if (excision.x < tile.x && excision.x + excision.width > tile.x + tile.width && excision.y < tile.y && excision.y + excision.height > tile.y + tile.height) {
				plane.tiles[i].del = true;
			}
		});
	}
}

function changeDelta(id) {
	switch (id) {
		case 'moveUp':
			config.dY -= 5; break;
		case 'moveLeft':
			config.dX -= 5; break;
		case 'moveRight':
			config.dX += 5; break;
		case 'moveDown':
			config.dY += 5; break;
	}

	addStandartTiles();
}

function renderCanvas() {
	checkExcisions();
	ctx.fillStyle = "#FFFFFF";
	ctx.fillRect(0, 0, plane.width + canvasPaddingX * 2, plane.height + canvasPaddingY * 2);
	ctx.lineWidth = 5;
	plane.tiles.forEach(element => {
		renderTile(element);
	});
	plane.excisions.forEach(element => {
		renderExcision(element);
	});
	ctx.strokeStyle = "#AA0000";
	ctx.strokeRect(canvasPaddingX, canvasPaddingY, plane.width, plane.height);
	ctx.fillStyle = "#000000";
	ctx.font = "120px san-serif";
	ctx.fillText(`${plane.width}`, canvasPaddingX + plane.width / 2, canvasPaddingY / 2);
	ctx.fillText(`${plane.height}`, canvasPaddingX / 2, canvasPaddingY + plane.height / 2);
}

function renderExcision(excision) {
	ctx.strokeStyle = "#00AA00";
	ctx.strokeRect(excision.x, excision.y, excision.width, excision.height);
}

function renderTile(tile) {
	if (tile.del === true) return
	ctx.fillStyle = "#DDDDDD";
	ctx.fillRect(tile.x, tile.y, tile.width, tile.height);
	// ctx.strokeStyle = "#DDDDDD";
	// ctx.strokeRect(tile.x, tile.y, tile.width, tile.height);
	ctx.fillStyle = "#FAFAFA";
	ctx.fillRect(tile.x + 15, tile.y + 15, tile.width - 30, tile.height - 30);
	ctx.fillStyle = "#000000";
	ctx.font = "60px san-serif";
	ctx.fillText(`${tile.width} x ${tile.height}`, tile.x + 100, tile.y + tile.height / 2);
}

document.addEventListener('DOMContentLoaded', function (event) {
	document.getElementById('addPlane').addEventListener('click', function (event) {
		addPlane();
	});
	document.getElementById('addExcision').addEventListener('click', function (event) {
		addExcision();
	});
	document.getElementById('addStandartTiles').addEventListener('click', function (event) {
		addStandartTiles();
	});
	document.querySelector('.move').addEventListener('click', function (event) {
		changeDelta(event.target.id);
	});
});
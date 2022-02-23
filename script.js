"use strict";

const config = {
	dX: 0,
	dY: 0,
	step: 10,
	tile: {
		width: 585,
		height: 585,
		joint: 15,
	},
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
		width: 3000,
		height: 2850,
		excisions: [],
		tiles: [],
	}
	addCanvas(plane);
}

function addExcision() {
	let excisionWidth = Number(document.getElementById('excisionWidth').value);
	let excisionHeight = Number(document.getElementById('excisionHeight').value);
	let excisionDX = Number(document.getElementById('excisionDX').value);
	let excisionDY = Number(document.getElementById('excisionDY').value);
	let excision = {
		width: 1470,
		height: 1310,
		dX: 700,
		dY: 930,
	}
	excision.x = canvasPaddingX + excision.dX;
	excision.y = canvasPaddingY + plane.height - excision.height - excision.dY;
	plane.excisions.push(excision);
	renderCanvas();
}

function addTiles() {
	let tile = config.tile;
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
	let column = 0;
	for (let i = starPointX; i < canvasPaddingX + plane.width - 15; i += config.tile.width - config.tile.joint) {
		let row = 0;
		for (let j = starPointY; j < canvasPaddingY + plane.height - 15; j += config.tile.height - config.tile.joint) {
			let newTile = {
				width: tile.width,
				height: tile.height,
				joint: tile.joint,
				x: i,
				y: j,
				column: column,
				row: row,
				isActive: false,
			};
			row++;
			plane.tiles.push(newTile);
		}
		column++;
	}
	renderCanvas();
}

function checkExcisions() {
	for (let i = 0; i < plane.tiles.length; i++) {
		plane.excisions.forEach(element => {
			let tile = plane.tiles[i];
			tile.del = false;
			let excision = element;
			if (excision.x <= tile.x + tile.joint && excision.x + excision.width >= tile.x + tile.width - tile.joint && excision.y <= tile.y + tile.joint && excision.y + excision.height >= tile.y + tile.height - tile.joint) {
				tile.del = true;
			}
		});
	}
}

function setTileGrid() {
	const columns = Number(document.getElementById('columns').value);
	const rows = Number(document.getElementById('rows').value);
	const tileWidth = Math.floor((plane.width - config.tile.joint) / columns) + config.tile.joint;
	const tileHeight = Math.floor((plane.height - config.tile.joint) / rows) + config.tile.joint;
	config.tile.width = tileWidth - tileWidth % 5;
	config.tile.height = tileHeight - tileHeight % 5;
	config.dX = 0;
	config.dY = 0;
	addTiles();
	checkGrid(columns, rows);
	renderCanvas();
}

function checkGrid(columns, rows) {
	for (let i = 0; i < plane.tiles.length; i++) {
		let tile = plane.tiles[i];
		tile.del = false;
		if (tile.column === columns || tile.row === rows) {
			tile.del = true;
		}
	}
}

function moveTiles(btn) {
	let id = btn.id;
	if (!btn.id) {
		id = btn.parentElement.id;
	}
	const step = config.step
	switch (id) {
		case 'moveUp':
			config.dY -= step; break;
		case 'moveLeft':
			config.dX -= step; break;
		case 'moveRight':
			config.dX += step; break;
		case 'moveDown':
			config.dY += step; break;
	}
	addTiles();
}

function trim() {
	trimLeft();
	trimRight();
	trimUp();
	trimDown();
	plane.tiles.forEach((item) => {
		if (item.width < 120 || item.height < 120) {
			item.del = true;
		}
	})
	renderCanvas();
}

function trimLeft() {
	plane.tiles.forEach((element) => {
		if (element.column === 0) {
			element.width -= canvasPaddingX - element.x;
			element.x = canvasPaddingX;
		}
	})
	renderCanvas();
}

function trimRight() {
	let firstColumnWidth = plane.tiles.find(item => item.column === 0).width;
	plane.tiles.forEach((element) => {
		if (element.column === Math.max(...plane.tiles.map(item => item.column))) {
			element.width = canvasPaddingX + plane.width - element.x;
			if (element.width > firstColumnWidth) element.width -= 5;
		}
	})
	renderCanvas();
}

function trimUp() {
	plane.tiles.forEach((element) => {
		if (element.row === 0) {
			element.height -= canvasPaddingY - element.y;
			element.y = canvasPaddingY;
		}
	})
	renderCanvas();
}

function trimDown() {
	let firstRowHeight = plane.tiles.find(item => item.row === 0).height;
	plane.tiles.forEach((element) => {
		if (element.row === Math.max(...plane.tiles.map(item => item.row))) {
			element.height = canvasPaddingY + plane.height - element.y;
			if (element.height > firstRowHeight) element.height -= 5;
		}
	})
	renderCanvas();
}

function centerX() {
	let tilesWidth = plane.tiles.filter((element) => element.row === 0).map((element) => element.width).reduce((previousValue, currentValue) => previousValue + currentValue - config.tile.joint);
	config.dX = Math.floor(((canvasPaddingX * 2) + plane.width - tilesWidth) / 20) * 10 - canvasPaddingX;
	addTiles();
}

function centerY() {
	let tilesHeight = plane.tiles.filter((element) => element.column === 0).map((element) => element.height).reduce((previousValue, currentValue) => previousValue + currentValue - config.tile.joint);
	config.dY = Math.floor(((canvasPaddingY * 2) + plane.height - tilesHeight) / 20) * 10 - canvasPaddingY + 5;
	addTiles();
}

function changeStep(value) {
	config.step = Number(value);
}

function renderCanvas() {
	renderExcisionBtn();
	checkExcisions();
	ctx.fillStyle = "#FFFFFF";
	ctx.fillRect(0, 0, plane.width + canvasPaddingX * 2, plane.height + canvasPaddingY * 2);
	ctx.lineWidth = 10;
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
	plane.tiles.forEach(item => {
		renderActiveTile(item);
	});
}

function renderExcisionBtn() {
	const excisions = document.getElementById('excisions');
	excisions.innerHTML = '';
	if (plane.excisions.length === 0) return
	for (let i = 0; i < plane.excisions.length; i++) {
		let btn = document.createElement('button');
		btn.dataset.id = i;
		btn.innerHTML = `<i class="fa-solid fa-trash"></i> Видалити виріз ${i + 1}: ${plane.excisions[i].width} ${plane.excisions[i].height} ${plane.excisions[i].dX} ${plane.excisions[i].dY}`;
		excisions.appendChild(btn);
	}
}

function renderExcision(excision) {
	ctx.strokeStyle = "#fcba03";
	ctx.strokeRect(excision.x, excision.y, excision.width, excision.height);
}

function renderTile(tile) {
	if (tile.del === true) return
	ctx.fillStyle = "#DDDDDD";
	ctx.fillRect(tile.x, tile.y, tile.width, tile.height);
	ctx.fillStyle = "#FAFAFA";
	ctx.fillRect(tile.x + 15, tile.y + 15, tile.width - 30, tile.height - 30);
	ctx.fillStyle = "#000000";
	ctx.font = "60px san-serif";
	ctx.fillText(`${tile.width}x${tile.height}`, tile.x + 100, tile.y + tile.height / 2);
}

function renderActiveTile(tile) {
	if (!tile.isActive) return
	ctx.strokeStyle = "#79a884";
	ctx.strokeRect(tile.x + 15, tile.y + 15, tile.width - 30, tile.height - 30);
}

function deleteExcision(id) {
	plane.excisions.splice(id, 1);
	addTiles();
}

function setTile() {
	const tileWidth = Number(document.getElementById('tileWidth').value);
	const tileHeight = Number(document.getElementById('tileHeight').value);
	const tileJoint = Number(document.getElementById('tileJoint').value);
	config.tile.width = tileWidth;
	config.tile.height = tileHeight;
	config.tile.joint = tileJoint;
}

function getTile(event, canvas) {
	let x = event.offsetX / parseInt(window.getComputedStyle(canvas).width) * (plane.width + canvasPaddingX * 2);
	let y = event.offsetY / parseInt(window.getComputedStyle(canvas).height) * (plane.height + canvasPaddingY * 2);
	plane.tiles.forEach(item => {
		if (item.x < x && item.x + item.width > x && item.y < y && item.y + item.height > y) {
			item.isActive = !item.isActive;
		}
	})
	renderCanvas();
}

function sizeLeft() {
	let column = plane.tiles.find(item => item.isActive === true).column;
	plane.tiles.forEach(item => {
		if (item.column === column) {
			item.width += 10;
		}
		if (item.column === column + 1) {
			item.x += 10;
			item.width -= 10;
		}
	})
	renderCanvas();
}

document.addEventListener('DOMContentLoaded', function (event) {
	document.getElementById('addPlane').addEventListener('click', function (event) {
		addPlane();
	});
	document.getElementById('addExcision').addEventListener('click', function (event) {
		addExcision();
	});
	document.getElementById('excisions').addEventListener('click', function (event) {
		deleteExcision(event.target.dataset.id);
	});
	document.getElementById('addStandartTiles').addEventListener('click', function (event) {
		config.dX = 0;
		config.dY = 0;
		addTiles();
	});
	document.getElementById('addTiles').addEventListener('click', function (event) {
		config.dX = 0;
		config.dY = 0;
		setTile();
		addTiles();
	});
	document.getElementById('columns').addEventListener('input', function (event) {
		setTileGrid();
	});
	document.getElementById('rows').addEventListener('input', function (event) {
		setTileGrid();
	});
	document.getElementById('trim').addEventListener('click', function (event) {
		trim();
	});
	document.getElementById('trimLeft').addEventListener('click', function (event) {
		trimLeft();
	});
	document.getElementById('trimRight').addEventListener('click', function (event) {
		trimRight();
	});
	document.getElementById('trimUp').addEventListener('click', function (event) {
		trimUp();
	});
	document.getElementById('trimDown').addEventListener('click', function (event) {
		trimDown();
	});
	document.querySelector('.control__step').addEventListener('click', function (event) {
		if (event.target.classList.contains('step')) changeStep(event.target.value);
	});
	document.querySelector('.move').addEventListener('click', function (event) {
		moveTiles(event.target);
	});
	document.getElementById('centerX').addEventListener('click', function (event) {
		centerX();
	});
	document.getElementById('centerY').addEventListener('click', function (event) {
		centerY();
	});
	document.getElementById('sizeLeft').addEventListener('click', function (event) {
		sizeLeft();
	});
	document.querySelector('.canvas').addEventListener('click', function (event) {
		getTile(event, this);
	});

});
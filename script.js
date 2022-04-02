"use strict";

const config = {
	activePlane: 0,
	step: 10,
	tile: {
		width: 585,
		height: 585,
		joint: 15,
	},
}

let ctx;
let planes = [];
const canvasPaddingX = 700;
const canvasPaddingY = 700;

function addCanvas(plane) {
	removeCanvas();
	const canvas = document.createElement('canvas');
	const canvasElement = document.querySelector('.canvas');
	canvas.id = 'canvas';
	ctx = canvas.getContext('2d');
	canvas.width = plane.width + canvasPaddingX * 2;
	canvas.height = plane.height + canvasPaddingY * 2;
	// canvas.width = parseInt(window.getComputedStyle(document.querySelector('.canvas')).width);
	// canvas.height = parseInt(window.getComputedStyle(document.querySelector('.canvas')).height);
	//	console.log(document.documentElement.clientWidth);
	const width = document.createElement('div');
	width.classList.add('canvas__size', 'canvas__size_width');
	width.innerHTML = plane.width;
	const height = document.createElement('div');
	height.classList.add('canvas__size', 'canvas__size_height');
	height.innerHTML = plane.height;
	canvasElement.appendChild(canvas);
	width.style.top = (parseInt(window.getComputedStyle(document.querySelector('.canvas')).height) - parseInt(window.getComputedStyle(document.getElementById('canvas')).height)) / 2 + 20 + 'px';
	height.style.left = (parseInt(window.getComputedStyle(document.querySelector('.canvas')).width) - parseInt(window.getComputedStyle(document.getElementById('canvas')).width)) / 2 + 20 + 'px';
	canvasElement.appendChild(width);
	canvasElement.appendChild(height);
	renderCanvas();
}

function removeCanvas() {
	document.querySelector('.canvas').innerHTML = '';
}

function renderTabs() {
	const planesElement = document.querySelector('.planes');
	planesElement.innerHTML = '';
	if (planes.length === 0) return
	planes.forEach(item => {
		let div = document.createElement('div');
		div.dataset.id = planes.indexOf(item);
		div.classList.add('planes__item')
		if (planes.indexOf(item) === config.activePlane) {
			div.classList.add('active')
		}
		div.innerHTML = `Площина ${planes.indexOf(item) + 1} <i class="fa-solid fa-xmark"></i>`;
		planesElement.appendChild(div);
	})
}

function closePlaneTab(id) {
	id = Number(id);
	planes.splice(id, 1);
	renderTabs();
	if (planes.length === 0) {
		removeCanvas();
		return
	}
	if (config.activePlane === id) { //якщо активна вкладка
		if (id === planes.length) { //якщо остання
			changeActivePlane(id - 1);
		} else { //якщо не остання
			changeActivePlane(id);
		}
	} else {
		if (id < config.activePlane) {
			changeActivePlane(config.activePlane - 1);
		}
	}

}

function changeActivePlane(id) {
	id = Number(id);
	config.activePlane = id;
	changeActivePlaneTab();
}

function changeActivePlaneTab() {
	let planesTabs = document.querySelectorAll('.planes__item');
	planesTabs.forEach(item => item.classList.remove('active'));
	planesTabs[config.activePlane].classList.add('active');
	//addCanvas(planes[config.activePlane]);
	renderCanvas();
}

function addPlane() {
	let planeWidth = Number(document.getElementById('planeWidth').value);
	let planeHeight = Number(document.getElementById('planeHeight').value);
	let plane = {
		dX: 0,
		dY: 0,
		width: 5000,
		height: 2000,
		excisions: [],
		tiles: [],
	}
	planes.push(plane);
	renderTabs();
	changeActivePlane(planes.length - 1);
}

function addExcision() {
	let excisionWidth = Number(document.getElementById('excisionWidth').value);
	let excisionHeight = Number(document.getElementById('excisionHeight').value);
	let excisionDX = Number(document.getElementById('excisionDX').value);
	let excisionDY = Number(document.getElementById('excisionDY').value);
	// let excision = {
	// 	width: 200,
	// 	height: 200,
	// 	dX: 700,
	// 	dY: 930,
	// }
	let excision = {
		width: 500,
		height: 500,
		dX: excisionDX,
		dY: excisionDY,
	}
	excision.x = canvasPaddingX + excision.dX;
	excision.y = canvasPaddingY + planes[config.activePlane].height - excision.height - excision.dY;
	planes[config.activePlane].excisions.push(excision);
	renderCanvas();
}

function deleteExcision(id) {
	planes[config.activePlane].excisions.splice(id, 1);
	renderCanvas();
}

function addTiles() {
	let tile = config.tile;
	let plane = planes[config.activePlane];
	plane.tiles = [];
	let dX = plane.dX;
	let dY = plane.dY;
	let starPointX = dX;
	let starPointY = dY;
	// if (dX > 0) {
	// 	starPointX = tile.width - dX;
	// } else {
	// 	starPointX = dX;
	// }
	if (dY > 0) {
		starPointY = tile.height + dY;
	} else {
		starPointY = dY;
	}
	let column = 0;
	for (let i = starPointX; i < plane.width - tile.joint; i += tile.width - tile.joint) {
		let row = 0;
		for (let j = starPointY; j < plane.height - tile.joint; j += tile.height - tile.joint) {
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
	let plane = planes[config.activePlane];
	for (let i = 0; i < plane.tiles.length; i++) {
		if (plane.excisions.length === 0) {
			plane.tiles[i].del = false;
		}
		plane.excisions.forEach(item => {
			let tile = plane.tiles[i];
			tile.del = false;
			let excision = item;
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
			planes[config.activePlane].dY += step; break;
		case 'moveLeft':
			planes[config.activePlane].dX -= step; break;
		case 'moveRight':
			planes[config.activePlane].dX += step; break;
		case 'moveDown':
			planes[config.activePlane].dY -= step; break;
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

function changeStep(input) {
	let newStep;
	switch (Number(input.value)) {
		case 0:
			newStep = 5;
			break;
		case 1:
			newStep = 10;
			break;
		case 2:
			newStep = 50;
			break;
		case 3:
			newStep = 100;
			break;
	}
	config.step = newStep;
	document.getElementById('stepLabel').innerHTML = `Крок ${newStep}мм`;
}

function renderCanvas() {
	let canvas = document.querySelector('.canvas');
	canvas.innerHTML = '';
	let plane = planes[config.activePlane];
	let ratio = (parseInt(window.getComputedStyle(canvas).width) - 100) / plane.width;
	let planeElement = document.createElement('div');
	planeElement.classList.add('canvas__plane');
	planeElement.style.width = parseInt(window.getComputedStyle(canvas).width) - 100 + 'px';
	planeElement.style.height = (parseInt(window.getComputedStyle(canvas).width) - 100) * plane.height / plane.width + 'px';
	let tilesElement = document.createElement('div');
	tilesElement.classList.add('canvas__tiles');
	planeElement.appendChild(tilesElement);
	plane.tiles.forEach(item => {
		renderTile(item, ratio, tilesElement);
	});
	canvas.appendChild(planeElement);
}

function renderTile(tile, ratio, tilesElement) {
	if (tile.del === true) return
	let tileElement = document.createElement('div');
	tileElement.classList.add('canvas__tile');
	tileElement.style.top = tile.y * ratio + 'px';
	tileElement.style.left = tile.x * ratio + 'px';
	tileElement.style.width = tile.width * ratio + 'px';
	tileElement.style.height = tile.height * ratio + 'px';
	let mirrorElement = document.createElement('div');
	mirrorElement.classList.add('canvas__mirror');
	mirrorElement.style.top = tile.joint * ratio + 'px';
	mirrorElement.style.left = tile.joint * ratio + 'px';
	mirrorElement.style.width = (tile.width - tile.joint * 2) * ratio + 'px';
	mirrorElement.style.height = (tile.height - tile.joint * 2) * ratio + 'px';
	mirrorElement.innerHTML = `${tile.width}<i class="fa-solid fa-xmark"></i>${tile.height}`;
	tileElement.appendChild(mirrorElement);
	tilesElement.appendChild(tileElement);
}

function renderCanvas1() {
	renderExcisionTabs();
	checkExcisions();
	let plane = planes[config.activePlane];
	// let ratioX = (document.documentElement.clientWidth - 240) / (plane.width + canvasPaddingX * 2);
	// let ratioY = document.documentElement.clientHeight / (plane.height + canvasPaddingY * 2);
	// ctx.save();
	// ctx.scale(ratioX, ratioX);
	ctx.fillStyle = "#FFFFFF";
	ctx.fillRect(0, 0, plane.width + canvasPaddingX * 2, plane.height + canvasPaddingY * 2);
	if (plane.width > plane.height) {
		ctx.lineWidth = (plane.width + canvasPaddingX * 2) / 800;
	} else {
		ctx.lineWidth = (plane.height + canvasPaddingY * 2) / 800;
	}
	plane.tiles.forEach(element => {
		renderTile(element);
	});
	plane.excisions.forEach(element => {
		renderExcision(element);
	});
	ctx.strokeStyle = "#AA0000";
	ctx.strokeRect(canvasPaddingX, canvasPaddingY, plane.width, plane.height);
	ctx.fillStyle = "#000000";
	ctx.font = "small-caps 120px Arial";
	// ctx.fillText(`${plane.width}`, canvasPaddingX + plane.width / 2, canvasPaddingY / 2);
	// ctx.fillText(`${plane.height}`, canvasPaddingX / 2, canvasPaddingY + plane.height / 2);
	// ctx.restore();
}

function renderExcisionTabs() {
	const excisions = document.getElementById('excisions');
	let plane = planes[config.activePlane];
	excisions.innerHTML = '';
	if (plane.excisions.length === 0) return
	for (let i = 0; i < plane.excisions.length; i++) {
		let div = document.createElement('div');
		div.classList.add('excisions__tab')
		div.innerHTML = `Виріз ${i + 1}: ${plane.excisions[i].width} ${plane.excisions[i].height} ${plane.excisions[i].dX} ${plane.excisions[i].dY} <i data-id="${i}" class="fa-solid fa-xmark"></i>`;
		excisions.appendChild(div);
	}
}

function renderExcision(excision) {
	ctx.strokeStyle = "#fcba03";
	ctx.strokeRect(excision.x, excision.y, excision.width, excision.height);
}

function renderTile1(tile) {
	if (tile.del === true) return
	ctx.fillStyle = "#AAAAAA";
	ctx.fillRect(tile.x, tile.y, tile.width, tile.height);
	if (tile.isActive) {
		ctx.fillStyle = "#DFDFDF";
	} else {
		ctx.fillStyle = "#FAFAFA";
	}
	ctx.fillRect(tile.x + tile.joint, tile.y + tile.joint, tile.width - tile.joint * 2, tile.height - tile.joint * 2);
	if (tile.isActive) {
		ctx.fillStyle = "#000000";
		ctx.font = "small-caps 60px Arial";
		ctx.fillText(`${tile.width}x${tile.height}`, tile.x + 100, tile.y + tile.height / 2);
	}


}

function renderActiveTile(tile) {
	// if (!tile.isActive) return
	// ctx.strokeStyle = "#79a884";
	// ctx.strokeRect(tile.x + tile.joint, tile.y + tile.joint, tile.width - tile.joint * 2, tile.height - tile.joint * 2);
}

function setTile() {
	const tileWidth = Number(document.getElementById('tileWidth').value);
	const tileHeight = Number(document.getElementById('tileHeight').value);
	const tileJoint = Number(document.getElementById('tileJoint').value);
	config.tile.width = tileWidth;
	config.tile.height = tileHeight;
	config.tile.joint = tileJoint;
}

function setStandartTile() {
	config.tile.width = 585;
	config.tile.height = 585;
	config.tile.joint = 15;
}

function getTile(event) {
	let x = event.offsetX / parseInt(window.getComputedStyle(document.getElementById('canvas')).width) * (planes[config.activePlane].width + canvasPaddingX * 2);
	let y = event.offsetY / parseInt(window.getComputedStyle(document.getElementById('canvas')).height) * (planes[config.activePlane].height + canvasPaddingY * 2);
	planes[config.activePlane].tiles.forEach(item => {
		let isActive = item.isActive;
		item.isActive = false;
		if (item.x < x && item.x + item.width > x && item.y < y && item.y + item.height > y) {
			item.isActive = !isActive;
		}
	})
	renderCanvas();
}

function tileTopIncrease() {
	let row = plane.tiles.find(item => item.isActive === true).row;
	plane.tiles.forEach(item => {
		if (item.row === row) {
			item.y -= 10;
			item.height += 10;
		}
		if (item.row === row - 1) {
			item.height -= 10;
		}
	})
	renderCanvas();
}

function tileTopDecrease() {
	let row = plane.tiles.find(item => item.isActive === true).row;
	plane.tiles.forEach(item => {
		if (item.row === row) {
			item.y += 10;
			item.height -= 10;
		}
		if (item.row === row - 1) {
			item.height += 10;
		}
	})
	renderCanvas();
}

function tileBottomIncrease() {
	let row = plane.tiles.find(item => item.isActive === true).row;
	plane.tiles.forEach(item => {
		if (item.row === row) {
			item.height += 10;
		}
		if (item.row === row + 1) {
			item.y += 10;
			item.height -= 10;
		}
	})
	renderCanvas();
}

function tileBottomDecrease() {
	let row = plane.tiles.find(item => item.isActive === true).row;
	plane.tiles.forEach(item => {
		if (item.row === row) {
			item.height -= 10;
		}
		if (item.row === row + 1) {
			item.y -= 10;
			item.height += 10;
		}
	})
	renderCanvas();
}

function tileLeftIncrease() {
	let column = plane.tiles.find(item => item.isActive === true).column;
	plane.tiles.forEach(item => {
		if (item.column === column) {
			item.x -= 10;
			item.width += 10;
		}
		if (item.column === column - 1) {
			item.width -= 10;
		}
	})
	renderCanvas();
}

function tileLeftDecrease() {
	let column = plane.tiles.find(item => item.isActive === true).column;
	plane.tiles.forEach(item => {
		if (item.column === column) {
			item.x += 10;
			item.width -= 10;
		}
		if (item.column === column - 1) {
			item.width += 10;
		}
	})
	renderCanvas();
}

function tileRightIncrease() {
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

function tileRightDecrease() {
	let column = plane.tiles.find(item => item.isActive === true).column;
	plane.tiles.forEach(item => {
		if (item.column === column) {
			item.width -= 10;
		}
		if (item.column === column + 1) {
			item.x -= 10;
			item.width += 10;
		}
	})
	renderCanvas();
}

function openPanel(btn) {
	if (btn.classList.contains('active')) {
		btn.classList.remove('active');
		document.getElementById(btn.dataset.id).classList.remove('active');
	} else {
		document.querySelectorAll('.control__item.active, .sidebar__btn.active').forEach(element => element.classList.remove('active'));
		btn.classList.add('active');
		document.getElementById(btn.dataset.id).classList.add('active');
	}
}

function openDropDown(btn) {
	if (btn.closest('.navigation__item').classList.contains('active')) {
		btn.closest('.navigation__item').classList.remove('active');
		btn.querySelector('.dropdown__menu').classList.remove('active');
	} else {
		document.querySelectorAll('.dropdown__menu.active, .navigation__item.active').forEach(element => element.classList.remove('active'));
		btn.closest('.navigation__item').classList.add('active');
		btn.querySelector('.dropdown__menu').classList.add('active');
	}
}

document.addEventListener('DOMContentLoaded', function (event) {
	document.getElementById('addPlane').addEventListener('click', function (event) {
		addPlane();
	});
	document.querySelector('.planes').addEventListener('click', function (event) {
		if (event.target.classList.contains('planes__item')) {
			changeActivePlane(event.target.dataset.id);
		};
		if (event.target.classList.contains('fa-xmark')) {
			closePlaneTab(event.target.closest('.planes__item').dataset.id);
		};
	});
	document.getElementById('addExcision').addEventListener('click', function (event) {
		addExcision();
	});
	document.getElementById('excisions').addEventListener('click', function (event) {
		if (event.target.classList.contains('fa-xmark')) {
			deleteExcision(event.target.dataset.id);
		}
	});
	document.getElementById('addStandartTiles').addEventListener('click', function (event) {
		setStandartTile();
		addTiles();
	});
	document.getElementById('addTiles').addEventListener('click', function (event) {
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
	document.querySelector('.move').addEventListener('click', function (event) {
		moveTiles(event.target);
	});
	document.getElementById('centerX').addEventListener('click', function (event) {
		centerX();
	});
	document.getElementById('centerY').addEventListener('click', function (event) {
		centerY();
	});
	document.getElementById('tileTopIncrease').addEventListener('click', function (event) {
		tileTopIncrease();
	});
	document.getElementById('tileTopDecrease').addEventListener('click', function (event) {
		tileTopDecrease();
	});
	document.getElementById('tileBottomIncrease').addEventListener('click', function (event) {
		tileBottomIncrease();
	});
	document.getElementById('tileBottomDecrease').addEventListener('click', function (event) {
		tileBottomDecrease();
	});
	document.getElementById('tileLeftIncrease').addEventListener('click', function (event) {
		tileLeftIncrease();
	});
	document.getElementById('tileLeftDecrease').addEventListener('click', function (event) {
		tileLeftDecrease();
	});
	document.getElementById('tileRightIncrease').addEventListener('click', function (event) {
		tileRightIncrease();
	});
	document.getElementById('tileRightDecrease').addEventListener('click', function (event) {
		tileRightDecrease();
	});
	document.querySelector('.canvas').addEventListener('click', function (event) {
		getTile(event);
	});
	document.querySelector('.sidebar').addEventListener('click', function (event) {
		openPanel(event.target);
	});
	document.querySelectorAll('.dropdown').forEach(item => {
		item.addEventListener('click', function (event) {
			openDropDown(this);
		});
	});
	// document.querySelector('.navigation').addEventListener('click', function (event) {
	// 	console.log(event.target);
	// 	if (!event.target.classList.contains('navigation')) {

	// 	}
	// })
	// document.querySelector('.workspace').addEventListener('click', function (event) {
	// 	console.log(this);
	// 	if (!this.classList.contains('navigation')) {
	// 		console.log(this);
	// 	}
	// });
	document.querySelector('.control__step').addEventListener('change', function (event) {
		changeStep(event.target);
	});
	for (let e of document.querySelectorAll('input[type="range"].slider-progress')) {
		e.style.setProperty('--value', e.value);
		e.style.setProperty('--min', e.min == '' ? '0' : e.min);
		e.style.setProperty('--max', e.max == '' ? '100' : e.max);
		e.addEventListener('input', () => e.style.setProperty('--value', e.value));
	}
});
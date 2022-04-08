"use strict";

const config = {
	tabs: [],
	activeTab: -1,
	// activeTabHasExscisions: false,
	// activeTabHasTiles: false,
	// activeTabIsColored: false,
	step: 10,
	selectionType: 'row',
	tile: {
		width: 585,
		height: 585,
		joint: 15,
	},
	settings: {
		standartTile: {
			width: 585,
			height: 585,
			joint: 15,
		},
		minTileSize: 120,
		tileFontSize: 10,
		planeColor: '#ff0000',
		excisionColor: '#ffaf00',
		jointColor: '#bebebe',
		mirrorColor: '#f5f5f5',
		activeTileColor: '#ffa768',
	}
}

function checkButtons() {
	const buttons = document.querySelectorAll('.disabled');
	const tab = config.tabs[config.activeTab];
	if (!tab || tab.type !== 'plane') {
		buttons.forEach(item => item.disabled = true);
		return
	}
	const plane = config.tabs[config.activeTab].data;
	const planes = config.tabs.filter(item => item.type === 'plane');
	buttons.forEach(item => {
		item.disabled = true;
		if (!plane) return
		if (planes.length > 0 && item.classList.contains('disabled-plane')) {
			item.disabled = false;
		}
		if (plane.excisions.length > 0 && item.classList.contains('disabled-excisions')) {
			item.disabled = false;
		}
		if (!config.tabs.filter(item => item.type === 'plane').find(item => item.data.tiles.length === 0)) {
			item.disabled = false;
		}
	});
}

function showAlert(message) {
	document.querySelector('.alert').classList.add('active');
	document.querySelector('.alert__message').innerHTML = message;
}

function closeAlert() {
	document.querySelector('.alert').classList.remove('active');
}

function createTab(name, type, data) {
	const newTab = {
		name: name,
		type: type,
		data: data,
	}
	config.tabs.push(newTab);
	changeActiveTab(config.tabs.length - 1);
}

function removeTab(id) {
	const tabs = config.tabs;
	if (typeof id === 'object') {
		id = config.activeTab;
	} else {
		id = Number(id);
		tabs.splice(id, 1);
		if (config.activeTab === id) { //якщо активна вкладка
			if (id === tabs.length) { //якщо остання
				changeActiveTab(id - 1);
			} else { //якщо не остання
				changeActiveTab(id);
			}
		} else {
			if (id < config.activeTab) {
				changeActiveTab(config.activeTab - 1);
			} else {
				changeActiveTab(config.activeTab);
			}
		}
	}
}

function changeActiveTab(id) {
	id = Number(id);
	config.activeTab = id;
	renderTabs();
	const tabs = document.querySelectorAll('.tabs__item');
	// переробити!!! додати у форич
	tabs.forEach(item => item.classList.remove('active'));
	if (id >= 0) {
		tabs[id].classList.add('active');
	}
	renderTab();
}

function addPlane() {
	const planeWidth = Number(document.getElementById('planeWidth').value);
	const planeHeight = Number(document.getElementById('planeHeight').value);
	if (planeWidth <= 0 || planeHeight <= 0) {
		showAlert("Ширина або висота площини не може дорівнювати нулю чи бути від'ємною");
		return
	}
	const plane = {
		dX: 0,
		dY: 0,
		width: planeWidth,
		height: planeHeight,
		excisions: [],
		tiles: [],
		// jointColor: settings.jointColor,
	}
	const report = config.tabs.find(item => item.type === 'report');
	if (report) {
		removeTab(config.tabs.indexOf(report));
	}
	createTab(`Площина ${config.tabs.filter(item => item.type === 'plane').length + 1}`, 'plane', plane);
}

function clonePlane() {
	const oldPlane = config.tabs[config.activeTab].data;
	createTab(`Площина ${config.tabs.filter(item => item.type === 'plane').length + 1}`, 'plane', oldPlane);
}

function removeAllTabs() {
	// закриває все. Якщо налаштування в окремій вкладці будуть, то теж їх закриє
	config.tabs = [];
	changeActiveTab(-1);
}


function addExcision() {
	const planes = config.tabs.filter(item => item.type === 'plane');
	if (planes.length === 0) {
		showAlert("Площина не задана");
		return
	}
	const plane = config.tabs[config.activeTab].data;
	const excisionWidth = Number(document.getElementById('excisionWidth').value);
	const excisionHeight = Number(document.getElementById('excisionHeight').value);
	const excisionDX = Number(document.getElementById('excisionDX').value);
	const excisionDY = Number(document.getElementById('excisionDY').value);
	const excision = {
		width: excisionWidth,
		height: excisionHeight,
		dX: excisionDX,
		dY: excisionDY,
	}
	excision.x = excision.dX;
	excision.y = plane.height - excision.height - excision.dY;
	if (excisionWidth <= 0 || excisionHeight <= 0) {
		showAlert("Ширина або висота вирізу не може дорівнювати нулю чи бути від'ємною");
		return
	}
	if (excisionDX < 0 || excisionDY < 0 || excisionDX + excisionWidth > plane.width || excisionDY + excisionHeight > plane.height) {
		showAlert("Виріз виходить за площину");
		return
	}
	if (plane.excisions.length > 0) {
		let intersections = 0;
		plane.excisions.forEach(item => {
			if (Math.abs(item.x - excision.x) < excision.width / 2 + item.width / 2 && Math.abs(item.y - excision.y) < excision.height / 2 + item.height / 2) {
				intersections++;
			}
		})
		if (intersections > 0) {
			showAlert("Вирізи пересікаються");
			return
		}

	}
	plane.excisions.push(excision);
	renderCanvas();
}

function removeExcision(id) {
	config.tabs[config.activeTab].data.excisions.splice(id, 1);
	renderCanvas();
}

function removeAllEcisions() {
	config.tabs[config.activeTab].data.excisions = [];
	renderCanvas();
}

function addTiles() {
	const planes = config.tabs.filter(item => item.type === 'plane');
	if (planes.length === 0) {
		showAlert("Площина не задана");
		return
	}
	const tile = config.tile;
	const plane = config.tabs[config.activeTab].data;
	const dX = plane.dX;
	const dY = plane.dY;
	let starPointX = 0;
	let starPointY = 0;
	plane.tiles = [];
	if (dX > 0 && dX < tile.width - tile.joint) {
		starPointX = dX - tile.width + tile.joint;
	} else if (dX < 0 && Math.abs(dX) < tile.width - tile.joint) {
		starPointX = dX;
	} else {
		plane.dX = 0;
		starPointX = 0;
	}
	if (dY > 0 && dY < tile.height - tile.joint) {
		starPointY = dY - tile.height + tile.joint;
	} else if (dY < 0 && Math.abs(dY) < tile.height - tile.joint) {
		starPointY = dY;
	} else {
		plane.dY = 0;
		starPointY = 0;
	}
	let column = 0;
	for (let i = starPointX; i < plane.width - tile.joint; i += tile.width - tile.joint) {
		let row = 0;
		for (let j = starPointY; j < plane.height - tile.joint; j += tile.height - tile.joint) {
			const newTile = {
				width: tile.width,
				height: tile.height,
				joint: tile.joint,
				x: i,
				y: j,
				column: column,
				row: row,
				isActive: false,
				// color: config.settings.tileColor,
			};
			row++;
			plane.tiles.push(newTile);
		}
		column++;
	}
	renderCanvas();
}

function addStandartTiles() {
	const tile = {
		width: 585,
		height: 585,
		joint: 15,
	}
	config.tile = tile;
	addTiles();
}

function addCustomTiles() {
	const tile = {
		width: Number(document.getElementById('tileWidth').value),
		height: Number(document.getElementById('tileHeight').value),
		joint: Number(document.getElementById('tileJoint').value),
	}
	config.tile = tile;
	addTiles();
}

function removeTiles() {
	const plane = config.tabs[config.activeTab].data;
	plane.tiles = [];
	renderCanvas();
}

function checkExcisions() {
	const plane = config.tabs[config.activeTab].data;
	const minTileSize = config.settings.minTileSize;
	for (let i = 0; i < plane.tiles.length; i++) {
		let tile = plane.tiles[i];
		tile.del = false;
		if (plane.width - tile.x < minTileSize || plane.height - tile.y < minTileSize || tile.x < 0 && tile.x + tile.width < minTileSize || tile.y < 0 && tile.y + tile.height < minTileSize) {
			tile.del = true;
		}
		plane.excisions.forEach(item => {
			let excision = item;
			let effectiveX;
			let effectiveWidth;
			let effectiveY;
			let effectiveHeight;
			if (tile.x < 0) {
				effectiveX = 0;
			} else {
				effectiveX = tile.x;
			}
			if (tile.x + tile.width > plane.width) {
				effectiveWidth = plane.width - tile.x;
			} else {
				effectiveWidth = tile.width;
			}
			if (tile.y < 0) {
				effectiveY = 0;
			} else {
				effectiveY = tile.y;
			}
			if (tile.y + tile.height > plane.height) {
				effectiveHeight = plane.height - tile.y;
			} else {
				effectiveHeight = tile.height;
			}
			let tileInExcisionStartX = excision.x <= effectiveX + tile.joint;
			let tileInExcisionEndX = excision.x + excision.width >= tile.x + effectiveWidth - tile.joint;
			let tileInExcisionStartY = excision.y <= effectiveY + tile.joint;
			let tileInExcisionEndY = excision.y + excision.height >= tile.y + effectiveHeight - tile.joint;
			if (tileInExcisionStartX && tileInExcisionEndX && tileInExcisionStartY && tileInExcisionEndY) {
				tile.del = true;
			}
		});
	}
}

function setTileGrid() {
	const planes = config.tabs.filter(item => item.type === 'plane');
	if (planes.length === 0) {
		showAlert("Площина не задана");
		return
	}
	const plane = config.tabs[config.activeTab].data;
	const columns = Number(document.getElementById('columns').value);
	const rows = Number(document.getElementById('rows').value);
	const tileWidth = Math.floor((plane.width - config.tile.joint) / columns) + config.tile.joint;
	const tileHeight = Math.floor((plane.height - config.tile.joint) / rows) + config.tile.joint;
	config.tile.width = tileWidth - tileWidth % 5;
	config.tile.height = tileHeight - tileHeight % 5;
	plane.dX = 0;
	plane.dY = 0;
	addTiles(columns, rows);
	renderCanvas();
}

function moveTiles(btn) {
	const planes = config.tabs.filter(item => item.type === 'plane');
	if (planes.length === 0) {
		showAlert("Площина не задана");
		return
	}
	let id = btn.id;
	if (!btn.id) {
		id = btn.parentElement.id;
	}
	const plane = config.tabs[config.activeTab].data;
	const step = config.step
	switch (id) {
		case 'moveUp':
			plane.dY -= step; break;
		case 'moveLeft':
			plane.dX -= step; break;
		case 'moveRight':
			plane.dX += step; break;
		case 'moveDown':
			plane.dY += step; break;
	}
	addTiles();
}

function trim() {
	trimLeft();
	trimRight();
	trimUp();
	trimDown();
}

function trimLeft() {
	const plane = config.tabs[config.activeTab].data;
	plane.tiles.forEach((item) => {
		if (item.column === 0) {
			item.width -= Math.abs(item.x);
			item.x = 0;
		}
	})
	renderCanvas();
}

function trimRight() {
	const plane = config.tabs[config.activeTab].data;
	let firstColumnWidth = plane.tiles.find(item => item.column === 0).width;
	plane.tiles.forEach((item) => {
		if (item.column === Math.max(...plane.tiles.map(item => item.column))) {
			item.width = plane.width - item.x;
			if (item.width > firstColumnWidth) {
				// item.width = firstColumnWidth;
			}
		}
	})
	renderCanvas();
}

function trimUp() {
	const plane = config.tabs[config.activeTab].data;
	plane.tiles.forEach((item) => {
		if (item.row === 0) {
			item.height -= Math.abs(item.y);
			item.y = 0;
		}
	})
	renderCanvas();
}

function trimDown() {
	const plane = config.tabs[config.activeTab].data;
	let firstRowHeight = plane.tiles.find(item => item.row === 0).height;
	plane.tiles.forEach((item) => {
		if (item.row === Math.max(...plane.tiles.map(item => item.row))) {
			item.height = plane.height - item.y;
			if (item.height !== firstRowHeight) {
				// item.height = firstRowHeight;
			}
		}
	})
	renderCanvas();
}

function centerX() {
	const plane = config.tabs[config.activeTab].data;
	let tilesWidth = plane.tiles.filter((item) => item.row === 0).map((item) => item.width).reduce((previousValue, currentValue) => previousValue + currentValue - config.tile.joint);
	plane.dX = Math.floor((plane.width - tilesWidth) / 20) * 10;
	addTiles();
}

function centerY() {
	const plane = config.tabs[config.activeTab].data;
	let tilesHeight = plane.tiles.filter((item) => item.column === 0).map((item) => item.height).reduce((previousValue, currentValue) => previousValue + currentValue - config.tile.joint);
	plane.dY = Math.floor((plane.height - tilesHeight) / 20) * 10 + 5;
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

function calcPlaneArea(plane) {
	let planeArea = plane.width / 1000 * plane.height / 1000;
	let excisionsArea = 0;
	if (plane.excisions.length > 0) {
		excisionsArea = plane.excisions.map((item) => item.width / 1000 * item.height / 1000).reduce((acc, cur) => acc + cur);
	}
	let planeEffectiveArea = planeArea - excisionsArea;
	return planeEffectiveArea;
}

function makePlaneMap(plane) {
	let planeMap = plane.tiles.map((tile) => tile.width + '<i class="bi-x"></i>' + tile.height).reduce((acc, cur) => {
		acc[cur] = (acc[cur] || 0) + 1;
		return acc;
	}, {})
	return planeMap;
}

function calcTileArea(plane) {
	let tileArea = plane.tiles.filter(item => !item.del).map(item => item.width / 1000 * item.height / 1000).reduce((acc, cur) => acc + cur);
	return tileArea;
}

function calcFullReportData() {
	let planesData = [];
	let allTiles = [];
	const planes = config.tabs.filter(item => item.type === 'plane').map(item => item.data);
	planes.forEach(item => {
		let planeData = {
			width: item.width,
			height: item.height,
			area: calcPlaneArea(item),
			tileArea: calcTileArea(item),
		}
		planesData.push(planeData);
		allTiles.push(...item.tiles)
	})
	let fullArea = planesData.map(item => item.area).reduce((acc, cur) => acc + cur);
	let fullTileArea = planesData.map(item => item.tileArea).reduce((acc, cur) => acc + cur);
	let fullTileMap = allTiles.map((tile) => tile.width + '<i class="bi-x"></i>' + tile.height).reduce((acc, cur) => {
		acc[cur] = (acc[cur] || 0) + 1;
		return acc;
	}, {})
	let fullReportData = {
		order: 1,
		planesData: planesData,
		fullArea: fullArea,
		fullTileArea: fullTileArea,
		fullTileMap: fullTileMap,
	};
	return fullReportData;
}

function setActiveTile(tile) {
	let active = document.querySelector('.sidebar').querySelector('.active');
	if (!active || active.dataset.id === 'paint') {
		config.tabs[config.activeTab].data.tiles[Number(tile.closest('.canvas__tile').dataset.id)].color = document.getElementById('tileColor').value;
		renderCanvas();
		return
	}
	if (!active || active.dataset.id !== 'edit') return
	let id = Number(tile.closest('.canvas__tile').dataset.id);
	let tiles = config.tabs[config.activeTab].data.tiles;
	tiles.forEach(item => item.isActive = false);
	let type = config.selectionType;
	if (type === 'row') {
		let row = tiles[id].row;
		tiles.forEach(item => {
			if (item.row === row && !item.del) {
				item.isActive = true;
			}
		});
	} else {
		let column = tiles[id].column;
		tiles.forEach(item => {
			if (item.column === column && !item.del) {
				item.isActive = true;
			}
		});
	}
	renderCanvas();
}

function changeJointColor(color) {
	config.tabs[config.activeTab].data.jointColor = color.value;
	renderCanvas();
}

function changeSelectionType(input) {
	config.selectionType = input.value;
	// if (config.planes.length > 0) {
	// 	config.planes[config.activeTab].tiles.forEach(item => item.isActive = false);
	// 	renderCanvas();
	// }
}

function changeTileSize(id) {
	const plane = config.tabs[config.activeTab].data;
	const step = config.step
	let row = plane.tiles.find(item => item.isActive === true).row;
	let column = plane.tiles.find(item => item.isActive === true).column;
	plane.tiles.forEach(item => {
		switch (id) {
			case 'tileTopIncrease':
				if (item.row === row) {
					item.y -= step;
					item.height += step;
				}
				if (item.row === row - 1) {
					item.height -= step;
				} break;
			case 'tileTopDecrease':
				if (item.row === row) {
					item.y += step;
					item.height -= step;
				}
				if (item.row === row - 1) {
					item.height += step;
				} break;
			case 'tileBottomIncrease':
				if (item.row === row) {
					item.height += step;
				}
				if (item.row === row + 1) {
					item.y += step;
					item.height -= step;
				} break;
			case 'tileBottomDecrease':
				if (item.row === row) {
					item.height -= step;
				}
				if (item.row === row + 1) {
					item.y -= step;
					item.height += step;
				} break;
			case 'tileLeftIncrease':
				if (item.column === column) {
					item.x -= step;
					item.width += step;
				}
				if (item.column === column - 1) {
					item.width -= step;
				} break;
			case 'tileLeftDecrease':
				if (item.column === column) {
					item.x += step;
					item.width -= step;
				}
				if (item.column === column - 1) {
					item.width += step;
				} break;
			case 'tileRightIncrease':
				if (item.column === column) {
					item.width += step;
				}
				if (item.column === column + 1) {
					item.x += step;
					item.width -= step;
				} break;
			case 'tileRightDecrease':
				if (item.column === column) {
					item.width -= step;
				}
				if (item.column === column + 1) {
					item.x -= step;
					item.width += step;
				} break;
		}
	});
	renderCanvas();
}

function resetPlaneColors() {
	const settings = config.settings;
	document.getElementById('jointColor').value = settings.jointColor;
	document.getElementById('tileColor').value = settings.tileColor;
	config.tabs[config.activeTab].data.jointColor = settings.jointColor;
	config.tabs[config.activeTab].data.tiles.forEach(item => item.color = settings.tileColor);
	renderCanvas();
}

function changeSettings(input) {
	let key = input.dataset.id;
	let value = input.value;
	config.settings[key] = value;
	console.log(config.settings);
	applySettings();
}

function applySettings() {
	let settings = config.settings;
	const root = document.querySelector(':root');
	root.style.setProperty('--plane-color', settings.planeColor);
	root.style.setProperty('--excision-color', settings.excisionColor);
	root.style.setProperty('--joint-color', settings.jointColor);
	root.style.setProperty('--mirror-color', settings.mirrorColor);
	root.style.setProperty('--active-tile-color', settings.activeTileColor);
	root.style.setProperty('--tile-font-size', settings.tileFontSize + 'px');

}

function saveSettings() {
	// save to Json file
}

function openSettings() {
	const settings = config.tabs.find(item => item.type === 'settings');
	if (settings) {
		changeActiveTab(config.tabs.indexOf(settings));
		return
	}
	const settingsData = config.settings;
	createTab('Налаштування', 'settings', settingsData)
}

function openFullReport() {
	const report = config.tabs.find(item => item.type === 'report');
	if (report) {
		changeActiveTab(config.tabs.indexOf(report));
		return
	}
	const reportData = calcFullReportData();
	createTab('Специфікація', 'report', reportData)
}

function renderTab() {
	document.querySelector('.workarea').innerHTML = '';
	document.getElementById('excisions').innerHTML = '';
	document.getElementById('report').innerHTML = '<div class="control__caption">Специфікація площини</div><div class="control__label control__label_center">Площина не задана</div>';
	if (config.tabs.length === 0) return
	switch (config.tabs[config.activeTab].type) {
		case 'plane':
			renderCanvas();
			break;
		case 'report':
			document.getElementById('excisions').innerHTML = '';
			document.getElementById('report').innerHTML = '<div class="control__caption">Специфікація площини</div><div class="control__label control__label_center">Площина не вибрана</div>';
			renderFullReport();
			break;
		case 'settings':
			document.getElementById('excisions').innerHTML = '';
			document.getElementById('report').innerHTML = '<div class="control__caption">Специфікація площини</div><div class="control__label control__label_center">Площина не вибрана</div>';
			renderSettings();
			break;
	}
	checkButtons();
}

function renderTabs() {
	const tabs = config.tabs;
	const tabsElement = document.querySelector('.tabs');
	tabsElement.innerHTML = '';
	if (tabs.length === 0) return
	tabs.forEach((item, index) => {
		let icon;
		switch (item.type) {
			case 'plane':
				icon = ' bi bi-bounding-box-circles';
				break;
			case 'report':
				icon = ' bi bi-layout-text-sidebar-reverse';
				break;
			case 'settings':
				icon = ' bi bi-gear';
				break;
		}
		if (item.type === 'plane') {
			item.name = `Площина ${tabs.filter(item => item.type === 'plane').indexOf(item) + 1}`;
		}
		tabsElement.insertAdjacentHTML('beforeend', `
			<div data-id="${index}" class="tabs__item${icon}">${item.name}<i class="bi bi-x"></i></div>
		`)
	})

}


function renderExcisionTabs() {
	const excisionsElement = document.getElementById('excisions');
	excisionsElement.innerHTML = '';
	const tab = config.tabs[config.activeTab];
	// if (!tab || tab.type !== 'plane') return
	const excisions = tab.data.excisions;
	if (excisions.length === 0) return
	excisions.forEach((item, index) => {
		excisionsElement.insertAdjacentHTML('beforeend', `
			<div class="excisions__tab">Ш: ${item.width} В: ${item.height}<br>dX: ${item.dX} dY: ${item.dY}<i data-id="${index}" class="bi bi-x"></i></div>
		`)
	});
}

function renderSettings() {
	const settings = config.settings;
	document.querySelector('.workarea').insertAdjacentHTML('beforeend', `
		<div class="settings">
			<div class="settings__item">
				<div class="settings__title">Розміри стандартної касети</div>
				<div class="settings__details">Визначає розмір касети, по якій буде формуватись розкладка через меню Розкладка->Стандартні</div>
				<div class="settings__block">
					<input data-id="standartTileWidth" class="settings__input" type="text" value="${settings.standartTile.width}">
					<label for="">Ширина, мм</label>
					<input data-id="standartTileHeight" class="settings__input" type="text" value="${settings.standartTile.height}">
					<label for="">Висота, мм</label>
					<input data-id="standartTileJoint" class="settings__input" type="text" value="${settings.standartTile.joint}">
					<label for="">Стик, мм</label>
				</div>
			</div>
			<div class="settings__item">
				<div class="settings__title">Мінімальний розмір касети</div>
				<div class="settings__details">Визначає розмір, менше якого касети в розкладці не будуть формуватись</div>
				<div class="settings__block">
					<input data-id="minTileSize" class="settings__input" type="text" value="${settings.minTileSize}">
					<label for="">мм</label>
				</div>
			</div>
			<div class="settings__item">
				<div class="settings__title">Розмір шрифту касети</div>
				<div class="settings__details">Визначає розмір шрифту дял написів розмірів на касеті</div>
				<div class="settings__block">
					<input data-id="tileFontSize" class="settings__input" type="number" value="${settings.tileFontSize}">
					<label for="">px</label>
				</div>	
			</div>
			<div class="settings__item">
				<div class="settings__title">Колір лінії площини</div>
				<input data-id="planeColor" class="settings__input" type="color" value="${settings.planeColor}">
			</div>
			<div class="settings__item">
				<div class="settings__title">Колір лінії вирізу</div>
				<input data-id="excisionColor" class="settings__input" type="color" value="${settings.excisionColor}">
			</div>
			<div class="settings__item">
				<div class="settings__title">Колір стиків касет</div>
				<input data-id="jointColor" class="settings__input" type="color" value="${settings.jointColor}">
			</div>
			<div class="settings__item">
				<div class="settings__title">Колір дзеркала касет</div>
				<input data-id="mirrorColor" class="settings__input" type="color" value="${settings.mirrorColor}">
			</div>
			<div class="settings__item">
				<div class="settings__title">Колір активних касет</div>
				<input data-id="activeTileColor" class="settings__input" type="color" value="${settings.activeTileColor}">
			</div>
		</div>
	`);
}

function renderCanvas() {
	checkButtons();
	document.querySelector('.workarea').innerHTML = '<div class="canvas"></div>';
	const canvas = document.querySelector('.canvas');
	const planes = config.tabs.filter(item => item.type === 'plane');
	const plane = config.tabs[config.activeTab].data;
	renderPlaneReport(plane);
	renderExcisionTabs();
	checkExcisions();
	let ratio = (parseInt(window.getComputedStyle(canvas).width) - 100) / plane.width;
	let maxHeight = parseInt(window.getComputedStyle(canvas).height) - 100;
	let planeElement = document.createElement('div');
	planeElement.classList.add('canvas__plane');
	if ((parseInt(window.getComputedStyle(canvas).width) - 100) * plane.height / plane.width > maxHeight) {
		planeElement.style.height = parseInt(window.getComputedStyle(canvas).height) - 100 + 'px';
		planeElement.style.width = (parseInt(window.getComputedStyle(canvas).height) - 100) * plane.width / plane.height + 'px';
		ratio = (parseInt(window.getComputedStyle(canvas).height) - 100) / plane.height;
	} else {
		planeElement.style.width = parseInt(window.getComputedStyle(canvas).width) - 100 + 'px';
		planeElement.style.height = (parseInt(window.getComputedStyle(canvas).width) - 100) * plane.height / plane.width + 'px';
	}
	planeElement.style.borderColor = config.settings.planeColor;
	let tilesElement = document.createElement('div');
	tilesElement.classList.add('canvas__tiles');
	let excisionsElement = document.createElement('div');
	excisionsElement.classList.add('canvas__excisions');
	planeElement.appendChild(tilesElement);
	plane.tiles.forEach(item => {
		renderTile(item, ratio, tilesElement, plane);
	});
	planeElement.appendChild(excisionsElement);
	plane.excisions.forEach(item => {
		renderExcision(item, ratio, excisionsElement);
	});
	canvas.appendChild(planeElement);
	if (plane.tiles.filter(item => item.isActive).length > 0) {
		renderMoveButtons();
	}
}

function renderTile(tile, ratio, tilesElement, plane) {
	if (tile.del === true) return
	let tileElement = document.createElement('div');
	tileElement.dataset.id = plane.tiles.indexOf(tile);
	tileElement.dataset.row = tile.row;
	tileElement.dataset.column = tile.column;
	tileElement.classList.add('canvas__tile');
	tileElement.style.top = tile.y * ratio + 'px';
	tileElement.style.left = tile.x * ratio + 'px';
	tileElement.style.width = tile.width * ratio + 'px';
	tileElement.style.height = tile.height * ratio + 'px';
	let mirrorElement = document.createElement('div');
	mirrorElement.classList.add('canvas__mirror');
	if (tile.isActive) {
		tileElement.classList.add('active');
	}
	if (plane.jointColor) {
		tileElement.style.backgroundColor = plane.jointColor;
	}
	mirrorElement.style.top = tile.joint * ratio + 'px';
	mirrorElement.style.left = tile.joint * ratio + 'px';
	mirrorElement.style.width = (tile.width - tile.joint * 2) * ratio + 'px';
	mirrorElement.style.height = (tile.height - tile.joint * 2) * ratio + 'px';
	if (tile.color) {
		mirrorElement.style.backgroundColor = tile.color;
	}
	mirrorElement.innerHTML = `${tile.width}<i class="bi-x"></i>${tile.height}`;
	tileElement.appendChild(mirrorElement);
	tilesElement.appendChild(tileElement);
}

function renderExcision(excision, ratio, excisionsElement) {
	let excisionElement = document.createElement('div');
	excisionElement.classList.add('canvas__excision');
	excisionElement.style.top = excision.y * ratio + 'px';
	excisionElement.style.left = excision.x * ratio + 'px';
	excisionElement.style.width = excision.width * ratio + 'px';
	excisionElement.style.height = excision.height * ratio + 'px';
	excisionsElement.appendChild(excisionElement);
}

function renderPlaneReport(plane) {
	let reportElement = document.getElementById('report');
	reportElement.innerHTML = '';
	// if (!plane) {
	// 	reportElement.insertAdjacentHTML('beforeend', `
	// 		<div class="control__caption">Специфікація площини</div>
	// 		<div class="control__label control__label_center">Площина не задана</div>
	// 	`);
	// 	return
	// }
	let planeArea = calcPlaneArea(plane);
	reportElement.insertAdjacentHTML('beforeend', `
		<div class="control__caption">Специфікація площини</div>
		<div class="control__label">Ширина: ${plane.width}мм</div>
		<div class="control__label">Висота: ${plane.height}мм</div>
		<div class="control__label">Площа: ${planeArea.toFixed(3)} м²</div>
	`);
	if (plane.tiles.length === 0) return
	reportElement.insertAdjacentHTML('beforeend', `
		<div class="dropdown__divider"></div>
		<div class="control__caption">Фасадні касети:</div>
		<div class="control__label control__label_small">Ширина<i class="bi bi-x"></i>Висота</div>
	`);
	let planeMap = makePlaneMap(plane);
	for (let key in planeMap) {
		reportElement.insertAdjacentHTML('beforeend', `
			<div class="control__label">${key} - ${planeMap[key]} шт.</div>
		`);
	}
	let tileArea = calcTileArea(plane);
	reportElement.insertAdjacentHTML('beforeend', `
		<div class="dropdown__divider"></div>
		<div class="control__caption">Площа:</div>
		<div class="control__label control__label_small">Фасадних касет</div>
		<div class="control__label">${tileArea.toFixed(3)} м²</div>
	`);
}

function renderFullReport() {
	config.tabs[config.activeTab].data = calcFullReportData();
	let newFullReport = config.tabs[config.activeTab].data;
	let workarea = document.querySelector('.workarea');
	workarea.insertAdjacentHTML('beforeend', `
		<div class= "report">
			<div class="report__title">Специфікація</div>
			<div class="report__gridfc">GridFC v1.0.0</div>
			<div class="report__subtitle">Замовлення №${newFullReport.order}</div>
			<hr class="report__line">
			<div class="report__table">
				<div class="report__column">
					<div class="report__data">№</div>
					<div class="report__data">Ширина:</div>
					<div class="report__data">Висота:</div>
					<div class="report__data">Площа:</div>
				</div>
			</div>
			<hr class="report__line report__line_small">
			<div class="report__caption">Всього: ${newFullReport.fullArea.toFixed(3)} м²</div>
			<hr class="report__line">
			<div class="report__caption">Фасадні касети:</div>
			<div class="report__tiles"></div>
			<hr class="report__line report__line_small">
			<div class="report__caption">Всього касет: ${newFullReport.fullTileArea.toFixed(3)} м²</div>
		</div>
	`);
	newFullReport.planesData.forEach(item => {
		workarea.querySelector('.report__table').insertAdjacentHTML('beforeend', `
			<div class="report__column">
				<div class="report__data">Площина ${newFullReport.planesData.indexOf(item) + 1}</div>
				<div class="report__data">${item.width}мм:</div>
				<div class="report__data">${item.height}мм:</div>
				<div class="report__data">${item.area.toFixed(3)} м²</div>
			</div>
		`);
	})
	for (let key in newFullReport.fullTileMap) {
		workarea.querySelector('.report__tiles').insertAdjacentHTML('beforeend', `
			<div class="report__label">${key} - ${newFullReport.fullTileMap[key]} шт.</div>
		`);
	}
}

function renderMoveButtons() {
	let type = config.selectionType;
	let minRow = Math.min(...config.tabs[config.activeTab].data.tiles.filter(item => item.isActive).map(item => item.row))
	let minColumn = Math.min(...config.tabs[config.activeTab].data.tiles.filter(item => item.isActive).map(item => item.column));
	let tilesElements = document.querySelectorAll('.canvas__tile');
	let firstTileElement;
	for (let i = 0; i < tilesElements.length; i++) {
		if (Number(tilesElements[i].dataset.row) === minRow && Number(tilesElements[i].dataset.column) === minColumn) {
			firstTileElement = tilesElements[i];
		}

	}
	let left = parseInt(window.getComputedStyle(firstTileElement).left);
	let top = parseInt(window.getComputedStyle(firstTileElement).top);
	let height = parseInt(window.getComputedStyle(firstTileElement).height);
	let width = parseInt(window.getComputedStyle(firstTileElement).width);
	let margin = -25;
	if (height < 50 || width < 50) {
		margin = -46;
	}
	if (type === 'row') {
		document.querySelector('.canvas__plane').insertAdjacentHTML('beforeend', `
			<button id="tileTopIncrease" class="canvas__button bi bi-caret-up-fill" style="top: ${top - 20}px; left:  ${margin}px;"></button>
			<button id="tileTopDecrease" class="canvas__button bi bi-caret-down-fill" style="top: ${top + 3}px; left: ${margin}px;"></button>
			<button id="tileBottomDecrease" class="canvas__button bi bi-caret-up-fill" style="top: ${top + height - 20}px; left: -25px;"></button>
			<button id="tileBottomIncrease" class="canvas__button bi bi-caret-down-fill" style="top: ${top + height + 3}px; left: -25px;"></button>
		`)
	} else {
		document.querySelector('.canvas__plane').insertAdjacentHTML('beforeend', `
			<button id="tileLeftIncrease" class="canvas__button bi bi-caret-left-fill" style="top: ${margin}px; left:${left - 20}px;"></button>
			<button id="tileLeftDecrease" class="canvas__button bi bi-caret-right-fill" style="top: ${margin}px; left: ${left + 3}px;"></button>
			<button id="tileRightDecrease" class="canvas__button bi bi-caret-left-fill" style="top: -25px; left: ${left + width - 20}px;"></button>
			<button id="tileRightIncrease" class="canvas__button bi bi-caret-right-fill" style="top: -25px; left: ${left + width + 3}px;"></button>
		`)
	}
}

function openPanel(btn) {
	if (btn.classList.contains('active')) {
		btn.classList.remove('active');
		document.getElementById(btn.dataset.id).classList.remove('active');
		document.querySelector('.control').classList.remove('active');
	} else {
		document.querySelectorAll('.control__item.active, .sidebar__btn.active').forEach(element => element.classList.remove('active'));
		btn.classList.add('active');
		document.getElementById(btn.dataset.id).classList.add('active');
		document.querySelector('.control').classList.add('active');
	}
	// renderCanvas();
}

function openDropDown(btn) {
	if (!btn) {
		document.querySelectorAll('.dropdown__menu.active, .navigation__item.active').forEach(element => element.classList.remove('active'));
		return
	}
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
	checkButtons();
	// меню - Файл
	document.getElementById('removeAllTabs').addEventListener('click', removeAllTabs);
	// меню - Площина
	document.getElementById('removeAllExcisions').addEventListener('click', removeAllEcisions);
	document.getElementById('clonePlane').addEventListener('click', clonePlane);
	document.getElementById('removePlane').addEventListener('click', removeTab);
	// меню - Розкладка
	document.getElementById('addStandartTiles').addEventListener('click', addStandartTiles);
	document.getElementById('removeTiles').addEventListener('click', removeTiles);
	document.getElementById('fullReport').addEventListener('click', openFullReport);
	// меню - Редагування
	document.getElementById('centerX').addEventListener('click', centerX);
	document.getElementById('centerY').addEventListener('click', centerY);
	document.getElementById('trim').addEventListener('click', trim);
	document.getElementById('trimLeft').addEventListener('click', trimLeft);
	document.getElementById('trimRight').addEventListener('click', trimRight);
	document.getElementById('trimUp').addEventListener('click', trimUp);
	document.getElementById('trimDown').addEventListener('click', trimDown);
	// меню - Довідка
	// панель - Площина
	document.getElementById('addPlane').addEventListener('click', function (event) {
		addPlane();
	});
	document.querySelector('.tabs').addEventListener('click', function (event) {
		if (event.target.classList.contains('tabs__item')) {
			changeActiveTab(event.target.dataset.id);
		};
		if (event.target.classList.contains('bi-x')) {
			removeTab(event.target.closest('.tabs__item').dataset.id);
		};
	});
	document.getElementById('addExcision').addEventListener('click', function (event) {
		addExcision();
	});
	document.getElementById('excisions').addEventListener('click', function (event) {
		if (event.target.classList.contains('bi-x')) {
			removeExcision(event.target.dataset.id);
		}
	});
	document.getElementById('addTiles').addEventListener('click', addCustomTiles);
	document.getElementById('columns').addEventListener('change', function (event) {
		setTileGrid();
	});
	document.getElementById('rows').addEventListener('change', function (event) {
		setTileGrid();
	});
	document.querySelector('.move').addEventListener('click', function (event) {
		moveTiles(event.target);
	});
	document.getElementsByName('selection-type').forEach(item => {
		item.addEventListener('change', function () {
			changeSelectionType(this);
		});
	})
	document.querySelector('.sidebar__group_panels').addEventListener('click', function (event) {
		openPanel(event.target);
	});
	document.querySelectorAll('.dropdown').forEach(item => {
		item.addEventListener('click', function (event) {
			openDropDown(this);
		});
	});
	document.querySelector('.workspace').addEventListener('click', function (event) {
		openDropDown();
	});
	document.querySelector('.workarea').addEventListener('click', function (event) {
		if (event.target.classList.contains('canvas__mirror')) {
			setActiveTile(event.target);
		}
		if (event.target.classList.contains('canvas__button')) {
			changeTileSize(event.target.id);
		}
	});
	document.querySelector('.workarea').addEventListener('change', function (event) {
		if (event.target.classList.contains('settings__input')) {
			changeSettings(event.target);
		}
	});
	document.getElementById('defaultColors').addEventListener('click', function (event) {
		resetPlaneColors();
	});
	document.getElementById('jointColor').addEventListener('change', function (event) {
		changeJointColor(this);
	});
	document.querySelector('.alert__close').addEventListener('click', function (event) {
		closeAlert();
	});
	document.querySelector('.control__step').addEventListener('change', function (event) {
		changeStep(event.target);
	});
	document.getElementById('settings').addEventListener('click', openSettings);
	for (let e of document.querySelectorAll('input[type="range"].slider-progress')) {
		e.style.setProperty('--value', e.value);
		e.style.setProperty('--min', e.min == '' ? '0' : e.min);
		e.style.setProperty('--max', e.max == '' ? '100' : e.max);
		e.addEventListener('input', () => e.style.setProperty('--value', e.value));
	}
});
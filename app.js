"use strict";
async function init() {
	const SETTINGS_PATH = 'settings.json';
	const ORDERS_PATH = 'orders/';
	const electron = globalThis.electronAPI;

	const config = {
		file: null,
		tabs: [],
		activeTab: -1,
		activePanel: null,
		step: 10,
		selectionType: 'row',
		inputs: [],
		zoom: 1,
		transformOriginX: 0,
		transformOriginY: 0,
	}

	Promise.all([initSettings(), createOrdersDir()]).then(() => {
		renderFiles();
		renderApp();
	});

	function renderApp() {
		const tab = getActiveTab();
		renderTab(tab);
		checkUnsavedFiles();
		checkButtons();
		applySettings();
	}

	async function createOrdersDir() {
		const ordersDirExist = await electron.invoke('check-file', ORDERS_PATH);
		if (ordersDirExist) return
		await electron.invoke('create-dir', ORDERS_PATH);
	}

	function getActiveTab() {
		if (config.activeTab === -1) return
		return config.tabs[config.activeTab]
	}

	function getActivePlane() {
		if (!getActiveTab()) return
		return config.tabs[config.activeTab].data[config.tabs[config.activeTab].activePlane]
	}

	function getPlanes() {
		if (!getActiveTab()) return
		return config.tabs[config.activeTab].data
	}

	function createFilePath(file) {
		return file + '.json'
	}

	function checkButtons() {
		const buttons = document.querySelectorAll('[data-disabled]');
		buttons.forEach(item => item.disabled = true);
		const tab = getActiveTab();
		if (!tab || tab.type !== 'file') return
		const planes = getPlanes();
		const plane = getActivePlane();
		buttons.forEach(item => {
			if (config.file && item.dataset.disabled === 'file') {
				item.disabled = false;
			}
			if (tab.activeState > 0 && item.dataset.disabled === 'unDo') {
				item.disabled = false;
			}
			if (tab.activeState !== tab.states.length - 1 && item.dataset.disabled === 'reDo') {
				item.disabled = false;
			}
			if (planes.length > 0 && item.dataset.disabled === 'plane') {
				item.disabled = false;
			}
			if (!plane) return
			if (plane.excisions.length > 0 && item.dataset.disabled === 'excisions') {
				item.disabled = false;
			}
			if (plane.tiles.length > 0 && item.dataset.disabled === 'tiles') {
				item.disabled = false;
			}
			if (!tab.data.find(item => item.tiles.length === 0) && item.dataset.disabled === 'pdf') {
				item.disabled = false;
			}
		})
	}

	async function initSettings() {
		const settingsFileExist = await electron.invoke('check-file', SETTINGS_PATH);
		if (settingsFileExist) {
			config.settings = await electron.invoke('read-file', SETTINGS_PATH);
		} else {
			config.settings = {
				minTileSize: 120,
				tileFontSize: 8,
				planeColor: "#ff0000",
				excisionColor: "#ffaf00",
				jointColor: "#bebebe",
				mirrorColor: "#f5f5f5",
				activeTileColor: "#ffa768",
				standartTileWidth: 585,
				standartTileHeight: 585,
				standartTileJoint: 15,
			};
			saveSettings();
		}
		config.tile = {
			width: config.settings.standartTileWidth,
			height: config.settings.standartTileHeight,
			joint: config.settings.standartTileJoint,
		}
	}

	function changeSettings(input) {
		const key = input.dataset.id;
		const value = input.value;
		config.settings[key] = value;
		applySettings();
		saveSettings();
	}

	function applySettings() {
		const settings = config.settings;
		const root = document.querySelector(':root');
		root.style.setProperty('--plane-color', settings.planeColor);
		root.style.setProperty('--excision-color', settings.excisionColor);
		root.style.setProperty('--joint-color', settings.jointColor);
		root.style.setProperty('--mirror-color', settings.mirrorColor);
		root.style.setProperty('--active-tile-color', settings.activeTileColor);
		root.style.setProperty('--tile-font-size', settings.tileFontSize + 'px');
	}

	function saveSettings() {
		const settings = config.settings;
		electron.invoke('write-file', [SETTINGS_PATH, settings]);
	}

	async function openFile(file) {
		const filePath = createFilePath(file.innerHTML);
		if (config.tabs.find(item => item.name === filePath)) return
		const fileData = await electron.invoke('read-file', ORDERS_PATH + filePath);
		createTab(filePath, 'file', fileData);
		setFile(filePath);
	}

	async function newFile() {
		await renderFiles();
		if (config.activePanel !== 'files') {
			openPanel(document.querySelector('[data-id="files"]'));
		}
		const files = document.querySelectorAll('.files__item');
		files.forEach(item => item.classList.remove('active'));
		const filesElement = document.querySelector('.files__items');
		filesElement.insertAdjacentHTML('afterbegin', `
		<div class="files__item files__item_active active"><input class="files__input files__create" value=""></div>
	`)
		document.querySelector('.files__create').focus();
	}

	async function createFile(input) {
		const filePath = createFilePath(input.value);
		await electron.invoke('write-file', [ORDERS_PATH + filePath, []]);
		renderFiles();
		createTab(filePath, 'file', []);
		setFile(filePath);
	}

	function setFile(filePath) {
		config.file = filePath;
		document.querySelector('.navigation__file').innerHTML = `${filePath} - GridFC`;
	}

	async function saveFile() {
		const planes = getPlanes();
		const tab = getActiveTab();
		await electron.invoke('write-file', [ORDERS_PATH + config.file, planes]);
		tab.isSaved = true;
		checkUnsavedFiles()
	}

	function checkUnsavedFiles() {
		document.querySelectorAll('.tabs__item').forEach((item, index) => {
			item.classList.remove('unsaved');
			if (config.tabs[index].isSaved === false) {
				item.classList.add('unsaved');
			}
		})
	}

	async function deleteFile() {
		let options = {
			message: `???? ????????????????, ???? ???????????? ???????????????? ???????? '${config.file}'`,
			detail: '???? ?????????????? ?????????????????? ???????? ???? ????????????????.',
			buttons: ['????????????????', '??????????????????'],
		}
		let result = await showQuestion(options);
		if (result === '??????????????????') return
		await electron.invoke('delete-file', ORDERS_PATH + config.file);
		renderFiles();
		const tab = getActiveTab();
		removeTab(config.tabs.indexOf(tab));
		renderApp();
	}

	async function deleteExplorerFile() {
		const file = document.querySelector('.files__item.active');
		if (!file) return
		let options = {
			message: `???? ????????????????, ???? ???????????? ???????????????? ???????? '${createFilePath(file.innerHTML)}'`,
			detail: '???? ?????????????? ?????????????????? ???????? ???? ????????????????.',
			buttons: ['????????????????', '??????????????????'],
		}
		let result = await showQuestion(options);
		if (result === '??????????????????') return
		const filePath = createFilePath(file.innerHTML);
		await electron.invoke('delete-file', ORDERS_PATH + filePath);
		renderFiles();
		const openedTab = config.tabs.find(item => item.name === `${file.innerHTML}.json`);
		if (openedTab) {
			removeTab(config.tabs.indexOf(openedTab));
		}
		renderApp();
	}

	function renameFile() {
		const file = document.querySelector('.files__item.active');
		if (!file) return
		file.classList.add('files__item_active');
		const name = file.innerHTML;
		file.innerHTML = `<input data-name="${name}" class="files__input files__rename" value="${name}">`;
		file.querySelector('input').select();
	}

	async function changeFileName(input) {
		const oldFilePath = createFilePath(input.dataset.name);
		const newFilePath = createFilePath(input.value);
		await electron.invoke('rename-file', [ORDERS_PATH + oldFilePath, ORDERS_PATH + newFilePath]);
		if (config.file === oldFilePath) {
			setFile(newFilePath)
		}
		const openedTab = config.tabs.find(item => item.name === oldFilePath)
		if (openedTab) {
			openedTab.name = newFilePath;
		}
		renderTabs();
		renderFiles();
	}

	async function renderFiles() {
		const files = await electron.invoke('read-dir', ORDERS_PATH);
		const filesElement = document.querySelector('.files__items')
		filesElement.innerHTML = '';
		files.forEach(item => {
			filesElement.insertAdjacentHTML('beforeend', `
			<div data-ext="${item.split('.').pop()}" class="files__item bi bi-file-earmark">${item.split('.').shift()}</div>
		`)
		})
	}

	function createTab(name, type, data) {
		const newTab = {
			name: name,
			type: type,
			data: data,
			isSaved: true,
			states: [],
			activeState: -1,
			activePlane: 0,
		}
		config.tabs.push(newTab);
		changeActiveTab(config.tabs.length - 1);
		if (type === 'settings') return
		setState();
	}

	async function removeTab(id) {
		const tabs = config.tabs;
		if (typeof id === 'object') {
			id = config.activeTab;
		} else {
			id = Number(id);
		}
		if (tabs[id].isSaved === false) {
			let options = {
				message: `???? ?????????????? ???????????????? ?????????? ?????????????? ?? '${config.file}'`,
				detail: '?????????? ???????????? ????????????????, ???????? ???? ???? ???? ??????????????????.',
				buttons: ['????????????????', '???? ??????????????????', '??????????????????'],
			}
			let result = await showQuestion(options);
			if (result === '??????????????????') return
			if (result === '????????????????') saveFile();
		}
		tabs.splice(id, 1);
		if (config.activeTab === id) { //???????? ?????????????? ??????????????
			if (id === tabs.length) { //???????? ??????????????
				changeActiveTab(id - 1);
			} else { //???????? ???? ??????????????
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

	function removeAllTabs() {
		const length = config.tabs.length;
		for (let i = 0; i < length; i++) {
			removeTab(0);
		}
	}

	function changeActiveTab(id) {
		id = Number(id);
		config.activeTab = id;
		if (id >= 0) {
			if (config.tabs[id].type === 'settings') {
				config.file = null;
				document.querySelector('.navigation__file').innerHTML = '???????????????????????? - GridF??';
			} else {
				config.file = config.tabs[id].name;
				document.querySelector('.navigation__file').innerHTML = `${config.tabs[id].name} - GridF??`;
			}
		} else {
			config.file = null;
			document.querySelector('.navigation__file').innerHTML = `GridF??`;
		}
		renderTabs();
		renderApp();
	}

	function setState() {
		const tab = getActiveTab();
		const planes = getPlanes();
		const activePlaneIndex = planes.indexOf(getActivePlane());
		const newState = tab.data.map(item => JSON.parse(JSON.stringify(item)));
		if (tab.states.length === 10) {
			tab.states.shift();
		}
		if (tab.activeState < tab.states.length - 1) {
			tab.states.splice(tab.activeState + 1);
		}
		tab.states.push({ activePlane: activePlaneIndex, state: newState });
		tab.activeState = tab.states.length - 1;
		if (tab.activeState > 0) {
			tab.isSaved = false;
		}
	}

	function changeState(id) {
		const tab = getActiveTab();
		if (id === 'unDo') {
			tab.activeState--;
		} else {
			tab.activeState++;
		}
		tab.data = tab.states[tab.activeState].state.map(item => JSON.parse(JSON.stringify(item)));
		changeActivePlane(tab.states[tab.activeState].activePlane);
	}

	function addPlane() {
		const activeTab = getActiveTab();
		const planeWidth = Number(document.getElementById('planeWidth').value);
		const planeHeight = Number(document.getElementById('planeHeight').value);
		if (planeWidth <= 0 || planeHeight <= 0) {
			showAlert("???????????? ?????? ???????????? ?????????????? ???? ???????? ?????????????????????? ???????? ???? ???????? ??????'??????????");
			return
		}
		const plane = {
			dX: 0,
			dY: 0,
			width: planeWidth,
			height: planeHeight,
			excisions: [],
			tiles: [],
		}
		activeTab.data.push(plane);
		activeTab.activePlane = activeTab.data.length - 1;
		setState();
		renderApp();
	}

	function removePlane(id) {
		const planes = getPlanes();
		const activePlaneIndex = planes.indexOf(getActivePlane());
		if (typeof id === 'object') {
			id = activePlaneIndex;
		} else {
			id = Number(id);
		}
		planes.splice(id, 1);
		setState();
		if (activePlaneIndex === id) { // if the active tab
			if (id === planes.length) { // if the last tab
				changeActivePlane(id - 1);
			} else { // if not the last
				changeActivePlane(id);
			}
		} else {
			if (id < activePlaneIndex) {
				changeActivePlane(activePlaneIndex - 1);
			} else {
				changeActivePlane(activePlaneIndex);
			}
		}
	}

	function changeActivePlane(id) {
		id = Number(id);
		const tab = getActiveTab();
		tab.activePlane = id;
		tab.states[tab.activeState].activePlane = id;
		renderApp();
	}

	function clonePlane() {
		const plane = getActivePlane();
		const activeTab = getActiveTab();
		activeTab.data.push(plane)
		setState();
		renderApp();
	}

	function addExcision() {
		const plane = getActivePlane();
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
			showAlert("???????????? ?????? ???????????? ???????????? ???? ???????? ?????????????????????? ???????? ???? ???????? ??????'??????????");
			return
		}
		if (excisionDX < 0 || excisionDY < 0 || excisionDX + excisionWidth > plane.width || excisionDY + excisionHeight > plane.height) {
			showAlert("?????????? ???????????????? ???? ??????????????");
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
				showAlert("???????????? ??????????????????????????");
				return
			}

		}
		plane.excisions.push(excision);
		setState();
		renderApp();
	}

	function removeExcision(id) {
		const plane = getActivePlane();
		plane.excisions.splice(id, 1);
		setState();
		renderApp();
	}

	function removeAllEcisions() {
		const plane = getActivePlane();
		plane.excisions = [];
		setState();
		renderApp();
	}

	function addTiles() {
		const plane = getActivePlane();
		const tile = config.tile;
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
				};
				row++;
				plane.tiles.push(newTile);
			}
			column++;
		}
		setState();
		renderApp();
	}

	function restorePlaneDXDY() {
		const plane = getActivePlane();
		plane.dX = 0;
		plane.dY = 0;
	}

	function addStandartTiles() {
		const settings = config.settings;
		config.tile = {
			width: settings.standartTileWidth,
			height: settings.standartTileHeight,
			joint: settings.standartTileJoint,
		}
		restorePlaneDXDY()
		addTiles();
	}

	function addCustomTiles() {
		const width = Number(document.getElementById('tileWidth').value);
		const height = Number(document.getElementById('tileHeight').value);
		const joint = Number(document.getElementById('tileJoint').value);
		if (width <= 0 || height <= 0 || joint <= 0) {
			document.getElementById('tileWidth').value = config.tile.width;
			document.getElementById('tileHeight').value = config.tile.height;
			document.getElementById('tileJoint').value = config.tile.joint;
			return showAlert("?????????????? ???? ???????????? ?????????????????????? ???????? ???? ???????? ??????'????????????");
		}
		const tile = {
			width: width,
			height: height,
			joint: joint,
		}
		config.tile = tile;
		restorePlaneDXDY();
		addTiles();
	}

	function removeTiles() {
		const plane = getActivePlane();
		plane.tiles = [];
		restorePlaneDXDY();
		setState();
		renderApp();
	}

	function setTileGrid() {
		const plane = getActivePlane();
		config.tile.joint = Number(document.getElementById('tileGridJoint').value);
		const columns = Number(document.getElementById('columns').value);
		const rows = Number(document.getElementById('rows').value);
		if (columns <= 0 || rows <= 0) {
			if (columns <= 0) document.getElementById('columns').value = 1;
			if (rows <= 0) document.getElementById('rows').value = 1;
			return showAlert("?????????????????? ???? ???????? ?????????????????????? ???????? ???? ???????? ??????'??????????");
		}
		const tileWidth = Math.floor((plane.width - config.tile.joint) / columns) + config.tile.joint;
		const tileHeight = Math.floor((plane.height - config.tile.joint) / rows) + config.tile.joint;
		config.tile.width = tileWidth - tileWidth % 5;
		config.tile.height = tileHeight - tileHeight % 5;
		restorePlaneDXDY();
		addTiles(columns, rows);
	}

	function moveTiles(btn) {
		let id = btn.id;
		if (!btn.id) return
		const plane = getActivePlane();
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
		const plane = getActivePlane();
		plane.tiles.forEach((item) => {
			if (item.column === 0) {
				item.width -= Math.abs(item.x);
				item.x = 0;
			}
		})
		setState();
		renderApp();
	}

	function trimRight() {
		const plane = getActivePlane();
		plane.tiles.forEach((item) => {
			if (item.column === Math.max(...plane.tiles.map(item => item.column))) {
				item.width = plane.width - item.x;
			}
		})
		setState();
		renderApp();
	}

	function trimUp() {
		const plane = getActivePlane();
		plane.tiles.forEach((item) => {
			if (item.row === 0) {
				item.height -= Math.abs(item.y);
				item.y = 0;
			}
		})
		setState();
		renderApp();
	}

	function trimDown() {
		const plane = getActivePlane();
		plane.tiles.forEach((item) => {
			if (item.row === Math.max(...plane.tiles.map(item => item.row))) {
				item.height = plane.height - item.y;
			}
		})
		setState();
		renderApp();
	}

	function centerX() {
		const plane = getActivePlane();
		let tilesWidth = plane.tiles.filter((item) => item.row === 0).map((item) => item.width).reduce((previousValue, currentValue) => previousValue + currentValue - config.tile.joint);
		if ((plane.width - tilesWidth) % 10 === -5) {
			tilesWidth -= 5;
		}
		let newDX = (plane.width - tilesWidth) / 2;
		if (plane.dX === newDX) return
		plane.dX = newDX;
		plane.tiles.forEach(item => item.x += plane.dX);
		setState();
		renderApp();
	}

	function centerY() {
		const plane = getActivePlane();
		let tilesHeight = plane.tiles.filter((item) => item.column === 0).map((item) => item.height).reduce((previousValue, currentValue) => previousValue + currentValue - config.tile.joint);
		if ((plane.height - tilesHeight) % 10 === -5) {
			tilesHeight -= 5;
		}
		let newDY = (plane.height - tilesHeight) / 2;
		if (plane.dY === newDY) return
		plane.dY = newDY;
		plane.tiles.forEach(item => item.y += plane.dY);
		setState();
		renderApp();
	}

	function changeTile(id) {
		const plane = getActivePlane();
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
				case 'tileRemove':
					if (item.row === row && item.column === column) {
						item.isRemoved = !item.isRemoved;
					} break;
			}
			if (item.width < 5 || item.height < 5) {
				if (item.width < 5) item.width = 5;
				if (item.height < 5) item.height = 5;
			}
		});
		setState();
		renderApp();
	}

	function changeStep() {
		let newStep;
		switch (Number(this.value)) {
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
		document.getElementById('stepLabel').innerHTML = `???????? ${newStep}????`;
	}

	function changeSelectionType() {
		config.selectionType = this.value;
		const plane = getActivePlane();
		if (plane) {
			plane.tiles.forEach(item => item.isActive = false);
			renderApp();
		}
	}

	function getTile(tile) {
		switch (config.activePanel) {
			case 'edit':
				setActiveTiles(tile);
				break;
			case 'paint':
				paintTile(tile);
				break;
			default: return
		}
	}

	function setActiveTiles(tile) {
		const plane = getActivePlane();
		const tiles = plane.tiles;
		const id = Number(tile.closest('.canvas__tile').dataset.id);
		tiles.forEach(item => item.isActive = false);
		switch (config.selectionType) {
			case 'row':
				const row = tiles[id].row;
				tiles.forEach(item => {
					if (item.row === row && !item.del) {
						item.isActive = true;
					}
				});
				break;
			case 'column':
				const column = tiles[id].column;
				tiles.forEach(item => {
					if (item.column === column && !item.del) {
						item.isActive = true;
					}
				});
				break;
			case 'single':
				tiles[id].isActive = true;
				break;
		}
		renderApp();
	}

	function paintTile(tile) {
		const plane = getActivePlane();
		plane.tiles[Number(tile.closest('.canvas__tile').dataset.id)].color = document.getElementById('tileColor').value;
		setState();
		renderApp();
	}

	function changeJointColor(color) {
		const plane = getActivePlane();
		plane.jointColor = color.value;
		setState();
		renderApp();
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
		if (plane.tiles.length === 0) return
		let planeMap = plane.tiles.filter(item => !item.del && !item.isRemoved).map((tile) => tile.width + '<i class="bi-x"></i>' + tile.height).reduce((acc, cur) => {
			acc[cur] = (acc[cur] || 0) + 1;
			return acc;
		}, {})
		return planeMap;
	}

	function calcTileArea(plane) {
		if (plane.tiles.length === 0) return 0
		let tileArea = plane.tiles.filter(item => !item.del && !item.isRemoved).map(item => item.width / 1000 * item.height / 1000).reduce((acc, cur) => acc + cur);
		return tileArea;
	}

	function calcFullReportData(planes) {
		let planesData = [];
		let allTiles = [];
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
		let fullTileMap = allTiles.filter(tile => !tile.del && !tile.isRemoved).map((tile) => tile.width + '<i class="bi-x"></i>' + tile.height).reduce((acc, cur) => {
			acc[cur] = (acc[cur] || 0) + 1;
			return acc;
		}, {})
		let fullReportData = {
			order: config.file.split('.').shift(),
			planesData: planesData,
			fullArea: fullArea,
			fullTileArea: fullTileArea,
			fullTileMap: fullTileMap,
		};
		return fullReportData;
	}

	function checkExcisions(plane) {
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

	function resetPlaneColors() {
		const settings = config.settings;
		const plane = getActivePlane();
		document.getElementById('jointColor').value = settings.jointColor;
		document.getElementById('tileColor').value = settings.mirrorColor;
		plane.jointColor = settings.jointColor;
		plane.tiles.forEach(item => item.color = settings.mirrorColor);
		setState();
		renderApp();
	}

	function openSettings() {
		const settings = config.tabs.find(item => item.type === 'settings');
		if (settings) {
			changeActiveTab(config.tabs.indexOf(settings));
			return
		}
		const settingsData = config.settings;
		createTab('????????????????????????', 'settings', settingsData);
	}

	function renderTab(tab) {
		document.querySelector('.workarea').innerHTML = '<img class="workarea__img" src="./img/logo.png" alt="">';
		document.querySelector('.planes__tabs').innerHTML = '';
		document.querySelector('.excisions__tabs').innerHTML = '';
		document.getElementById('report').querySelector('.control__report').innerHTML = '<div class="control__label control__label_center">?????????????? ???? ????????????</div>';
		document.getElementById('fullReport').querySelector('.control__report').innerHTML = '<div class="control__label control__label_center">?????????????? ???? ????????????</div>';
		if (config.tabs.length === 0) return
		switch (tab.type) {
			case 'file':
				renderCanvas(tab.data, tab.activePlane);
				break;
			case 'settings':
				document.querySelector('.planes__tabs').innerHTML = '';
				document.querySelector('.excisions__tabs').innerHTML = '';
				document.getElementById('report').querySelector('.control__report').innerHTML = '<div class="control__label control__label_center">???????? ???? ????????????????</div>';
				document.getElementById('fullReport').querySelector('.control__report').innerHTML = '<div class="control__label control__label_center">???????? ???? ????????????????</div>';
				renderSettings(tab.data);
				break;
		}
	}

	function renderTabs() {
		const tabs = config.tabs;
		const tabsElement = document.querySelector('.tabs');
		tabsElement.innerHTML = '';
		if (tabs.length === 0) return
		tabs.forEach((item, index) => {
			let icon;
			switch (item.type) {
				case 'file':
					icon = ' bi bi-filetype-json';
					break;
				case 'settings':
					icon = ' bi bi-gear';
					break;
			}
			tabsElement.insertAdjacentHTML('beforeend', `
			<div data-id="${index}" class="tabs__item${icon}">${item.name}<i class="bi bi-x"></i></div>
		`)
		})
		tabsElement.querySelectorAll('.tabs__item')[config.activeTab].classList.add('active');
	}

	function renderSettings(settings) {
		document.querySelector('.workarea').insertAdjacentHTML('beforeend', `
		<div class="settings">
			<div class="settings__item">
				<div class="settings__title">?????????????? ?????????????????????? ????????????</div>
				<div class="settings__details">???????????????? ???????????? ????????????, ???? ???????? ???????? ?????????????????????? ?????????????????? ?????????? ???????? ??????????????????->????????????????????</div>
				<div class="settings__block">
					<input data-id="standartTileWidth" class="settings__input" type="number" value="${settings.standartTileWidth}">
					<label for="">????????????, ????</label>
					<input data-id="standartTileHeight" class="settings__input" type="number" value="${settings.standartTileHeight}">
					<label for="">????????????, ????</label>
					<input data-id="standartTileJoint" class="settings__input" type="number" value="${settings.standartTileJoint}">
					<label for="">????????, ????</label>
				</div>
			</div>
			<div class="settings__item">
				<div class="settings__title">?????????????????????? ???????????? ????????????</div>
				<div class="settings__details">???????????????? ????????????, ?????????? ?????????? ???????????? ?? ?????????????????? ???? ???????????? ??????????????????????</div>
				<div class="settings__block">
					<input data-id="minTileSize" class="settings__input" type="number" value="${settings.minTileSize}">
					<label for="">????</label>
				</div>
			</div>
			<div class="settings__item">
				<div class="settings__title">???????????? ???????????? ????????????</div>
				<div class="settings__details">???????????????? ???????????? ???????????? ?????? ?????????????? ???????????????? ???? ????????????</div>
				<div class="settings__block">
					<input data-id="tileFontSize" class="settings__input" type="number" value="${settings.tileFontSize}">
					<label for="">px</label>
				</div>	
			</div>
			<div class="settings__item">
				<div class="settings__title">?????????? ?????????? ??????????????</div>
				<input data-id="planeColor" class="settings__input" type="color" value="${settings.planeColor}">
			</div>
			<div class="settings__item">
				<div class="settings__title">?????????? ?????????? ????????????</div>
				<input data-id="excisionColor" class="settings__input" type="color" value="${settings.excisionColor}">
			</div>
			<div class="settings__item">
				<div class="settings__title">?????????? ???????????? ??????????</div>
				<input data-id="jointColor" class="settings__input" type="color" value="${settings.jointColor}">
			</div>
			<div class="settings__item">
				<div class="settings__title">?????????? ???????????????? ??????????</div>
				<input data-id="mirrorColor" class="settings__input" type="color" value="${settings.mirrorColor}">
			</div>
			<div class="settings__item">
				<div class="settings__title">?????????? ???????????????? ??????????</div>
				<input data-id="activeTileColor" class="settings__input" type="color" value="${settings.activeTileColor}">
			</div>
		</div>
	`);
	}

	function renderPlanesTabs(planes, activePlane) {
		const planesElement = document.querySelector('.planes__tabs');
		planesElement.innerHTML = '';
		if (planes.length === 0) return
		planes.forEach((item, index) => {
			planesElement.insertAdjacentHTML('beforeend', `
		<div data-id="${index}" class="planes__tab bi bi-bounding-box-circles">??: ${item.width} ??: ${item.height}<i data-id="${index}" class="bi bi-x planes__close"></i></div>
		`)
		});
		document.querySelectorAll('.planes__tab')[activePlane].classList.add('active');
	}

	function renderExcisionTabs(plane) {
		const excisionsElement = document.querySelector('.excisions__tabs');
		excisionsElement.innerHTML = '';
		const excisions = plane.excisions;
		if (excisions.length === 0) return
		excisions.forEach((item, index) => {
			excisionsElement.insertAdjacentHTML('beforeend', `
			<div class="excisions__tab">??: ${item.width} ??: ${item.height}<br>dX: ${item.dX} dY: ${item.dY}<i data-id="${index}" class="bi bi-x"></i></div>
		`)
		});
	}

	function renderCanvas(planes, activePlane) {
		document.querySelector('.workarea').innerHTML = '<div class="canvas"></div>';
		if (planes.length === 0) return
		const canvas = document.querySelector('.canvas');
		const plane = planes[activePlane];
		renderPlanesTabs(planes, activePlane);
		renderExcisionTabs(plane);
		renderPlaneReport(plane);
		renderFullReport();
		checkExcisions(plane);
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
			renderCanvasButtons();
		}
		canvas.insertAdjacentHTML('beforeend', `
		<div class="canvas__size canvas__size_width">${plane.width}????</div>
		<div class="canvas__size canvas__size_height">${plane.height}????</div>
	`)
		canvas.style.transform = `scale(${config.zoom})`;
		canvas.style.transformOrigin = `${config.transformOriginX}% ${config.transformOriginY}%`;
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
		if (tile.isRemoved) {
			tileElement.classList.add('removed');
		}
		if (plane.jointColor) {
			tileElement.style.backgroundColor = plane.jointColor;
		}
		if (config.activePanel === 'edit' || config.activePanel === 'paint') {
			mirrorElement.classList.add('selectable');
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
		let reportElement = document.getElementById('report').querySelector('.control__report');
		reportElement.innerHTML = '';
		let planeArea = calcPlaneArea(plane);
		reportElement.insertAdjacentHTML('beforeend', `
		<div class="control__label">????????????: ${plane.width}????</div>
		<div class="control__label">????????????: ${plane.height}????</div>
		<div class="control__label">??????????: ${planeArea.toFixed(3)} ????</div>
	`);
		if (plane.tiles.length === 0) return
		reportElement.insertAdjacentHTML('beforeend', `
		<div class="dropdown__divider"></div>
		<div class="control__caption">?????????????? ????????????:</div>
		<div class="control__label control__label_small">????????????<i class="bi bi-x"></i>????????????</div>
	`);
		let planeMap = makePlaneMap(plane);
		for (let key in planeMap) {
			reportElement.insertAdjacentHTML('beforeend', `
			<div class="control__label">${key} - ${planeMap[key]} ????.</div>
		`);
		}
		let tileArea = calcTileArea(plane);
		reportElement.insertAdjacentHTML('beforeend', `
		<div class="dropdown__divider"></div>
		<div class="control__caption">??????????:</div>
		<div class="control__label control__label_small">???????????????? ??????????</div>
		<div class="control__label">${tileArea.toFixed(3)} ????</div>
	`);
	}

	function renderFullReport() {
		let planes = getPlanes();
		let reportData = calcFullReportData(planes);
		let reportElement = document.getElementById('fullReport').querySelector('.control__report');
		reportElement.innerHTML = '';
		reportElement.insertAdjacentHTML('beforeend', `
		<div class="control__caption">?????????????? ????????????:</div>
		<div class="control__label control__label_small">????????????<i class="bi bi-x"></i>????????????</div>
	`)
		if (Object.keys(reportData.fullTileMap).length === 0) {
			reportElement.insertAdjacentHTML('beforeend', `
			<div class="control__label control__label_center">?????????????????? ???? ????????????</div>
		`);
		} else {
			for (let key in reportData.fullTileMap) {
				reportElement.insertAdjacentHTML('beforeend', `
				<div class="control__label">${key} - ${reportData.fullTileMap[key]} ????.</div>
			`);
			}
		}
		reportElement.insertAdjacentHTML('beforeend', `
		<div class="dropdown__divider"></div>
		<div class="control__caption">??????????:</div>
		<div class="control__label control__label_small">????????????</div>
		<div class="control__label">${reportData.fullArea.toFixed(3)} ????</div>
		<div class="control__label control__label_small">???????????????? ??????????</div>
		<div class="control__label">${reportData.fullTileArea.toFixed(3)} ????</div>
	`);
	}

	function renderCanvasButtons() {
		const type = config.selectionType;
		const plane = getActivePlane();
		const minRow = Math.min(...plane.tiles.filter(item => item.isActive).map(item => item.row))
		const minColumn = Math.min(...plane.tiles.filter(item => item.isActive).map(item => item.column));
		const tilesElements = document.querySelectorAll('.canvas__tile');
		let firstTileElement;
		for (let i = 0; i < tilesElements.length; i++) {
			if (Number(tilesElements[i].dataset.row) === minRow && Number(tilesElements[i].dataset.column) === minColumn) {
				firstTileElement = tilesElements[i];
			}
		}
		const left = parseInt(window.getComputedStyle(firstTileElement).left);
		const top = parseInt(window.getComputedStyle(firstTileElement).top);
		const height = parseInt(window.getComputedStyle(firstTileElement).height);
		const width = parseInt(window.getComputedStyle(firstTileElement).width);
		let margin = -25;
		if (height < 50 || width < 50) {
			margin = -46;
		}
		switch (type) {
			case 'row':
				document.querySelector('.canvas__plane').insertAdjacentHTML('beforeend', `
				<button id="tileTopIncrease" class="canvas__button bi bi-caret-up-fill" style="top: ${top - 20}px; left:  ${margin}px;"></button>
				<button id="tileTopDecrease" class="canvas__button bi bi-caret-down-fill" style="top: ${top + 3}px; left: ${margin}px;"></button>
				<button id="tileBottomDecrease" class="canvas__button bi bi-caret-up-fill" style="top: ${top + height - 20}px; left: -25px;"></button>
				<button id="tileBottomIncrease" class="canvas__button bi bi-caret-down-fill" style="top: ${top + height + 3}px; left: -25px;"></button>
			`)
				break;
			case 'column':
				document.querySelector('.canvas__plane').insertAdjacentHTML('beforeend', `
				<button id="tileLeftIncrease" class="canvas__button bi bi-caret-left-fill" style="top: ${margin}px; left:${left - 20}px;"></button>
				<button id="tileLeftDecrease" class="canvas__button bi bi-caret-right-fill" style="top: ${margin}px; left: ${left + 3}px;"></button>
				<button id="tileRightDecrease" class="canvas__button bi bi-caret-left-fill" style="top: -25px; left: ${left + width - 20}px;"></button>
				<button id="tileRightIncrease" class="canvas__button bi bi-caret-right-fill" style="top: -25px; left: ${left + width + 3}px;"></button>
			`)
				break;
			case 'single':
				let icon = 'bi bi-trash3';
				if (firstTileElement.classList.contains('removed')) {
					icon = 'bi bi-arrow-counterclockwise';
				}
				document.querySelector('.canvas__plane').insertAdjacentHTML('beforeend', `
				<button id="tileRemove" class="canvas__button ${icon}" style="top: ${top}px; left:${left + width}px;"></button>
			`)
				break;
		}
	}

	function openPanel(btn) {
		let plane = getActivePlane();
		if (plane && plane.tiles.length > 0) {
			plane.tiles.forEach(item => item.isActive = false);
		}
		if (btn.classList.contains('active')) {
			btn.classList.remove('active');
			document.getElementById(btn.dataset.id).classList.remove('active');
			document.querySelector('.control').classList.remove('active');
			config.activePanel = null;
		} else {
			document.querySelectorAll('.control__item.active, .sidebar__btn.active').forEach(element => element.classList.remove('active'));
			btn.classList.add('active');
			document.getElementById(btn.dataset.id).classList.add('active');
			document.querySelector('.control').classList.add('active');
			config.activePanel = btn.dataset.id;
		}
		renderApp();
	}

	function openDropDown() {
		if (!this) {
			document.querySelectorAll('.dropdown__menu.active, .navigation__item.active').forEach(element => element.classList.remove('active'));
			return
		}
		if (this.closest('.navigation__item').classList.contains('active')) {
			this.closest('.navigation__item').classList.remove('active');
			this.querySelector('.dropdown__menu').classList.remove('active');
		} else {
			document.querySelectorAll('.dropdown__menu.active, .navigation__item.active').forEach(element => element.classList.remove('active'));
			this.closest('.navigation__item').classList.add('active');
			this.querySelector('.dropdown__menu').classList.add('active');
		}
	}

	function setActiveFile(file) {
		document.querySelectorAll('.files__item').forEach(item => {
			item.classList.remove('active');
			if (item === file) {
				item.classList.add('active');
			}
		})
	}

	function showAlert(message) {
		document.querySelector('.workarea').insertAdjacentHTML('beforeend', `
		<div class="alert">
			<div class="alert__body">
				<div class="alert__title"></div>
				<div class="alert__message">${message}</div>
				<button class="alert__close">????</button>
			</div>
		</div>
	`)
	}

	function closeAlert() {
		document.querySelector('.alert').remove();
	}

	async function exportToPDF() {
		const planes = getPlanes();
		const fullReportData = calcFullReportData(planes);
		await electron.invoke('export-to-pdf', [planes, fullReportData]);
	}

	async function showQuestion(options) {
		const questionOptions = {
			type: "warning",
			title: 'GridFC',
			message: options.message,
			detail: options.detail,
			buttons: options.buttons,
			normalizeAccessKeys: true,
			noLink: true,
		};
		let result = await electron.invoke('show-question', questionOptions);
		return questionOptions.buttons[result.response]
	}

	async function showAppVersion() {
		let result = await electron.invoke('get-app-version');
		let message = `
		GridFC: ${result.version}<br>
		Electron: ${result.versions.electron}<br>
		Chromium: ${result.versions.chrome}<br>
		Node.js: ${result.versions.node}<br>
		OS: ${result.os}
	`;
		showAlert(message);
	}

	function zoomMove(event) {
		const canvas = document.querySelector('.canvas');
		if (!config.inputs.includes('Space') || !canvas) return
		document.body.classList.add('grabbing');
		let [startX, startY] = [event.pageX, event.pageY];
		function moveAtPoint(event) {
			const originX = (startX - event.pageX) / window.innerWidth * 500 / config.zoom;
			const originY = (startY - event.pageY) / window.innerHeight * 500 / config.zoom;
			config.transformOriginX += originX;
			config.transformOriginY += originY;
			if (config.transformOriginX < 0) config.transformOriginX = 0;
			if (config.transformOriginY < 0) config.transformOriginY = 0;
			if (config.transformOriginX > 100) config.transformOriginX = 100;
			if (config.transformOriginY > 100) config.transformOriginY = 100;
			canvas.style.transformOrigin = `${config.transformOriginX}% ${config.transformOriginY}%`;
			startX = event.pageX;
			startY = event.pageY;
		}
		document.onmousemove = function (event) {
			moveAtPoint(event);
		};
		document.onmouseup = function () {
			document.onmousemove = null;
			document.onmouseup = null;
			document.body.classList.remove('grabbing');
		};
	}

	function changeZoom(event) {
		if (!config.inputs.includes('ControlLeft')) return
		config.zoom -= event.deltaY / Math.abs(event.deltaY) * 0.1
		if (config.zoom > 2.5) config.zoom = 2.5;
		if (config.zoom < 1) config.zoom = 1;
		document.querySelector('.canvas').style.transform = `scale(${config.zoom})`
	}

	function keyHandler(event) {
		// event.preventDefault();
		// return console.log(event.code);
		const keys = ['Space', 'AltLeft', 'ControlLeft', 'ShiftLeft', 'F4', 'KeyZ', 'KeyY', 'KeyN', 'KeyS', 'KeyD', 'KeyE', 'KeyU', 'KeyJ', 'KeyK', 'KeyL', 'KeyP', 'KeyQ', 'KeyA', 'KeyT'];
		if (!keys.includes(event.code)) return
		switch (event.type) {
			case 'keydown':
				if (config.inputs.includes(event.code)) return
				config.inputs.push(event.code);
				break

			case 'keyup':
				config.inputs.splice(config.inputs.indexOf(event.code), 1)
				break
		}
		document.body.classList.remove('grab');
		switch (config.inputs.join('+')) {
			case 'Space':
				if (config.zoom > 1) document.body.classList.add('grab');
				break
			case 'ControlLeft+KeyN':
				openDropDown();
				newFile();
				config.inputs = [];
				break
			case 'ControlLeft+KeyS':
				saveFile();
				config.inputs = [];
				break
			case 'ControlLeft+KeyD':
				deleteFile();
				config.inputs = [];
				break
			case 'ControlLeft+F4':
				removeTab(config.activeTab);
				config.inputs = [];
				break
			case 'ControlLeft+ShiftLeft+F4':
				removeAllTabs();
				config.inputs = [];
				break
			case 'ControlLeft+KeyE':
				if (checkButton('export')) return
				exportToPDF();
				config.inputs = [];
				break
			case 'ControlLeft+KeyU':
				if (checkButton('removeAllExcisions')) return
				removeAllEcisions();
				break
			case 'ControlLeft+KeyJ':
				if (checkButton('clonePlane')) return
				clonePlane();
				break
			case 'ControlLeft+KeyK':
				if (checkButton('removePlane')) return
				removePlane();
				break
			case 'ControlLeft+KeyL':
				if (checkButton('addStandartTiles')) return
				addStandartTiles();
				break
			case 'ControlLeft+KeyP':
				if (checkButton('removeTiles')) return
				removeTiles();
				break
			case 'ControlLeft+KeyZ':
				if (checkButton('unDo')) return
				changeState('unDo');
				break
			case 'ControlLeft+KeyY':
				if (checkButton('reDo')) return
				changeState('reDo');
				break
			case 'ControlLeft+KeyQ':
				if (checkButton('centerX')) return
				centerX();
				break
			case 'ControlLeft+KeyA':
				if (checkButton('centerY')) return
				centerY();
				break
			case 'ControlLeft+KeyT':
				if (checkButton('trim')) return
				trim();
				break
		}
		function checkButton(btnId) {
			const element = document.getElementById(btnId);
			if (element) return element.disabled
		}
	}

	// ???????? - ????????
	document.getElementById('newFile').addEventListener('click', newFile);
	document.getElementById('saveFile').addEventListener('click', saveFile);
	document.getElementById('deleteFile').addEventListener('click', deleteFile);
	document.getElementById('removeTab').addEventListener('click', removeTab);
	document.getElementById('removeAllTabs').addEventListener('click', removeAllTabs);
	document.getElementById('export').addEventListener('click', exportToPDF);
	// ???????? - ??????????????
	document.getElementById('removeAllExcisions').addEventListener('click', removeAllEcisions);
	document.getElementById('clonePlane').addEventListener('click', clonePlane);
	document.getElementById('removePlane').addEventListener('click', removePlane);
	document.getElementById('addStandartTiles').addEventListener('click', addStandartTiles);
	document.getElementById('removeTiles').addEventListener('click', removeTiles);
	// ???????? - ??????????????????????
	document.getElementById('unDo').addEventListener('click', function () { changeState(this.id) });
	document.getElementById('reDo').addEventListener('click', function () { changeState(this.id) });
	document.getElementById('centerX').addEventListener('click', centerX);
	document.getElementById('centerY').addEventListener('click', centerY);
	document.getElementById('trim').addEventListener('click', trim);
	document.getElementById('trimLeft').addEventListener('click', trimLeft);
	document.getElementById('trimRight').addEventListener('click', trimRight);
	document.getElementById('trimUp').addEventListener('click', trimUp);
	document.getElementById('trimDown').addEventListener('click', trimDown);
	// ???????? - ??????????????
	document.getElementById('showAppVersion').addEventListener('click', showAppVersion);
	// ??????????????
	document.querySelector('.tabs').addEventListener('click', function (event) {
		if (event.target.classList.contains('tabs__item')) {
			changeActiveTab(event.target.dataset.id);
		};
		if (event.target.classList.contains('bi-x')) {
			removeTab(event.target.closest('.tabs__item').dataset.id);
		};
	});

	// ???????????? ??????????????
	document.getElementById('explorerNewFile').addEventListener('click', newFile);
	document.getElementById('explorerRefresh').addEventListener('click', renderFiles);
	document.getElementById('explorerRename').addEventListener('click', renameFile);
	document.getElementById('explorerDelete').addEventListener('click', deleteExplorerFile);
	document.querySelector('.files__items').addEventListener('click', function (event) {
		if (event.target.classList.contains('files__item')) {
			setActiveFile(event.target);
		};
	});
	document.querySelector('.files__items').addEventListener('dblclick', function (event) {
		if (event.target.classList.contains('files__item')) {
			openFile(event.target);
		};
	});
	document.querySelector('.files__items').addEventListener('change', function (event) {
		if (event.target.classList.contains('files__create')) {
			createFile(event.target);
		};
		if (event.target.classList.contains('files__rename')) {
			changeFileName(event.target);
		};
	});
	// ???????????? - ??????????????
	document.getElementById('addPlane').addEventListener('click', addPlane);
	document.querySelector('.planes__tabs').addEventListener('click', function (event) {
		if (event.target.classList.contains('planes__tab')) {
			changeActivePlane(event.target.dataset.id);
		}
		if (event.target.classList.contains('planes__close')) {
			removePlane(event.target.dataset.id);
		}
	});
	// ???????????? - ????????????
	document.getElementById('addExcision').addEventListener('click', addExcision);
	document.querySelector('.excisions__tabs').addEventListener('click', function (event) {
		if (event.target.classList.contains('bi-x')) {
			removeExcision(event.target.dataset.id);
		}
	});
	// ???????????? - ??????????????????
	document.getElementById('addTiles').addEventListener('click', addCustomTiles);
	document.getElementById('columns').addEventListener('change', setTileGrid);
	document.getElementById('rows').addEventListener('change', setTileGrid);
	// ???????????? - ??????????????????????
	document.querySelector('.control__step').addEventListener('change', changeStep);
	document.querySelector('.move').addEventListener('click', function (event) { moveTiles(event.target) });
	document.getElementsByName('selection-type').forEach(item => {
		item.addEventListener('change', changeSelectionType);
	})
	// ???????????? - ????????????????????
	document.getElementById('defaultColors').addEventListener('click', function (event) {
		resetPlaneColors();
	});
	document.getElementById('jointColor').addEventListener('change', function (event) {
		changeJointColor(this);
	});
	// ????????????????????????
	document.getElementById('settings').addEventListener('click', openSettings);
	// ????????????
	document.querySelector('.sidebar__group_panels').addEventListener('click', function (event) { openPanel(event.target) });
	document.querySelectorAll('.dropdown').forEach(item => {
		item.addEventListener('click', openDropDown);
	});
	document.querySelector('.workspace').addEventListener('click', function (event) {
		openDropDown();
		if (document.querySelector('.files__input') && !event.target.classList.contains('files__input') && !event.target.classList.contains('files__item_active') && event.target.id !== 'explorerNewFile' && event.target.id !== 'explorerRename') {
			renderFiles();
		}
	});
	document.querySelector('.workarea').addEventListener('click', function (event) {
		if (event.target.classList.contains('canvas__mirror')) {
			getTile(event.target);
		}
		if (event.target.classList.contains('canvas__button')) {
			changeTile(event.target.id);
		}
		if (event.target.classList.contains('alert__close')) {
			closeAlert();
		}
	});
	document.querySelector('.workarea').addEventListener('change', function (event) {
		if (event.target.classList.contains('settings__input')) {
			changeSettings(event.target);
		}
	});
	document.querySelector('.workarea').addEventListener('mousedown', function (event) {
		zoomMove(event);
	});
	document.addEventListener('wheel', function (event) {
		changeZoom(event);
	});
	document.addEventListener('keydown', function (event) {
		keyHandler(event);
	});
	document.addEventListener('keyup', function (event) {
		keyHandler(event);
	});
	for (let e of document.querySelectorAll('input[type="range"].slider-progress')) {
		e.style.setProperty('--value', e.value);
		e.style.setProperty('--min', e.min == '' ? '0' : e.min);
		e.style.setProperty('--max', e.max == '' ? '100' : e.max);
		e.addEventListener('input', () => e.style.setProperty('--value', e.value));
	}
}

document.addEventListener('DOMContentLoaded', init);
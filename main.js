const fs = require('fs');
const path = require('path');
const url = require('url');
const os = require("os");
const PDFDocument = require('pdfkit');
const { app, BrowserWindow, ipcMain, dialog } = require('electron');

let win;

function createWindow() {
	const userData = app.getPath('userData');

	win = new BrowserWindow({
		// width: 1280,
		// height: 720,
		minWidth: 800,
		minHeight: 600,
		autoHideMenuBar: true,
		// fullscreen: true,
		icon: path.join(__dirname, '/img/logo.png'),
		titleBarStyle: 'hidden',
		titleBarOverlay: {
			color: '#333333',
			symbolColor: '#ffffff',
			height: 25,
		},
		webPreferences: {
			nodeIntegration: false, // is default value after Electron v5
			contextIsolation: true, // protect against prototype pollution
			enableRemoteModule: false, // turn off remote
			preload: path.join(__dirname, 'preload.js'),
		},
	});

	win.loadURL(url.format({
		pathname: path.join(__dirname, 'index.html'),
		protocol: 'file:',
		slashes: true,
	}));

	// win.webContents.openDevTools();

	win.webContents.on('new-window', function (e, url) {
		e.preventDefault();
		require('electron').shell.openExternal(url);
	});

	win.on('closed', () => {
		win = null;
	});

	ipcMain.handle('check-file', (event, filePath) => {
		return fs.existsSync(path.join(userData, filePath));
	})

	ipcMain.handle('read-file', (event, filePath) => {
		return JSON.parse(fs.readFileSync(path.join(userData, filePath)));
	})

	ipcMain.handle('rename-file', (event, oldPath, newPath) => {
		return fs.renameSync(path.join(userData, oldPath), path.join(userData, newPath))
	})

	ipcMain.handle('write-file', (event, filePath, value) => {
		fs.writeFileSync(path.join(userData, filePath), JSON.stringify(value));
	})

	ipcMain.handle('delete-file', (event, filePath) => {
		fs.unlinkSync(path.join(userData, filePath));
	})

	ipcMain.handle('read-dir', (event, dirPath) => {
		return (
			fs.readdirSync(path.join(userData, dirPath))
				.map(name => ({
					name,
					time: fs.statSync(path.join(userData, dirPath, name))['birthtime'].getTime()
				}))
				.sort((a, b) => (b.time - a.time)) // ascending
				.map(f => f.name)
				.filter(name => path.extname(name) === '.json')
		);
	})

	ipcMain.handle('create-dir', (event, dirPath) => {
		fs.mkdirSync(path.join(userData, dirPath));
	})

	ipcMain.handle('show-question', (event, options) => {
		return dialog.showMessageBox(options);
	})

	ipcMain.handle('save-file', (event, options) => {
		return dialog.showSaveDialog(options);
	})

	ipcMain.handle('export-to-pdf', async (event, planes, fullReportData) => {
		const doc = new PDFDocument({ size: 'A4', layout: 'landscape' });
		let options = {
			title: "Зберегти файл, як PDF",
			defaultPath: `${fullReportData.order}.pdf`,
			filters: [
				{ name: 'Documents', extensions: ['pdf'] },
			]
		}
		let result = await dialog.showSaveDialog(options);
		if (result.canceled === true) return
		const docWidth = 841.89;
		const docHeight = 595.28;
		doc.pipe(fs.createWriteStream(result.filePath));
		for (let i = 0; i < planes.length; i++) {
			const plane = planes[i];
			let width = 700
			let ratio = 700 / plane.width;
			let height = plane.height * ratio;
			if (height > 500) {
				height = 500;
				ratio = 500 / plane.height;
				width = plane.width * ratio;
			}
			const paddingLeft = (docWidth - width) / 2;
			const paddingTop = (docHeight - height) / 2;
			let jointColor = "#bebebe";
			if (plane.jointColor) {
				jointColor = plane.jointColor;
			}
			for (let j = 0; j < plane.tiles.length; j++) {
				const tile = plane.tiles[j];
				const joint = tile.joint * ratio;
				let mirrorColor = "#f5f5f5";
				if (tile.color) {
					mirrorColor = tile.color;
				}
				if (!tile.del && !tile.isRemoved) {
					doc
						.rect(tile.x * ratio + paddingLeft, tile.y * ratio + paddingTop, tile.width * ratio, tile.height * ratio)
						.fill(jointColor)
						.rect(tile.x * ratio + paddingLeft + joint, tile.y * ratio + paddingTop + joint, tile.width * ratio - joint * 2, tile.height * ratio - joint * 2)
						.fill(mirrorColor)
						.fillColor('#333333')
						.fontSize(8)
						.text(`${tile.width}x${tile.height}`, tile.x * ratio + paddingLeft + 10, tile.y * ratio + paddingTop + 10, { lineBreak: false });
				}
			}
			for (let j = 0; j < plane.excisions.length; j++) {
				let excision = plane.excisions[j];
				doc
					.rect(excision.x * ratio + paddingLeft, excision.y * ratio + paddingTop, excision.width * ratio, excision.height * ratio)
					.stroke("#ffaf00");
			}
			doc
				.rect(paddingLeft, paddingTop, width, height)
				.stroke("#ff0000")
				.fontSize(8)
				.font(path.join(__dirname, 'css/fonts/Montserrat-Medium.ttf'))
				.text(`Площина ${i + 1} | Ширина: ${plane.width}мм | Висота: ${plane.height}мм`, 20, 20)
				.addPage();
		}
		doc
			.fillColor('#333333')
			.fontSize(25)
			.font(path.join(__dirname, 'css/fonts/Montserrat-Medium.ttf'))
			.text('Специфікація', 100, 50)
			.font(path.join(__dirname, 'css/fonts/Roboto-Regular.ttf'))
			.fontSize(8)
			.text('GridFC', 780, 20)
			.moveTo(20, 85)
			.lineTo(821, 85)
			.stroke("#333333")
		let column = 50;
		for (let i = 0; i < planes.length; i++) {
			const plane = planes[i];
			doc
				.fontSize(12)
				.text(`Площина ${i + 1}`, column, 92)
				.fontSize(8)
				.text(`Ширина - ${plane.width} мм`, column, 110)
				.text(`Висота - ${plane.height} мм`, column, 120)
			column += 120;
		}
		doc
			.fontSize(16)
			.font(path.join(__dirname, 'css/fonts/Montserrat-Medium.ttf'))
			.text('Фасадні касети:', 50, 150)
			.font(path.join(__dirname, 'css/fonts/Roboto-Regular.ttf'))
			.moveTo(20, 171)
			.lineTo(421, 171)
			.stroke("#333333")
			.fontSize(8)
			.text('Ширина/Висота, мм', 50, 180)
		let row = 195
		for (let key in fullReportData.fullTileMap) {
			let size = key.split('<i class="bi-x"></i>');
			doc
				.fontSize(10)
				.text(`${size[0]}x${size[1]}`, 50, row)
				.text(`-`, 120, row)
				.text(`${fullReportData.fullTileMap[key]}`, 150, row)
				.text(`шт.`, 170, row)
			row += 15
		}
		doc
			.fontSize(16)
			.font(path.join(__dirname, 'css/fonts/Montserrat-Medium.ttf'))
			.text('Площа:', 50, row + 20)
			.font(path.join(__dirname, 'css/fonts/Roboto-Regular.ttf'))
			.moveTo(20, row + 41)
			.lineTo(421, row + 41)
			.stroke("#333333")
			.fontSize(8)
			.text('Всього по площинам, м²', 50, row + 50)
			.fontSize(10)
			.text(`${fullReportData.fullArea.toFixed(3)}`, 50, row + 60)
			.fontSize(8)
			.text('Всього фасадних касет, м²', 50, row + 80)
			.fontSize(10)
			.text(`${fullReportData.fullTileArea.toFixed(3)}`, 50, row + 90)
		doc.end();
	})

	ipcMain.handle('get-app-version', () => {
		return {
			version: app.getVersion(),
			node: process.version,
			versions: process.versions,
			os: os.version(),
		}
	})
}

app.on('ready', createWindow);

app.on('window-all-closed', () => {
	app.quit();
});
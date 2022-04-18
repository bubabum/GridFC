const path = require('path');
const url = require('url');
const os = require("os");
const { app, BrowserWindow, ipcMain, dialog } = require('electron');

let win;

function createWindow() {
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

	ipcMain.handle('show-question', (event, options) => {
		return dialog.showMessageBox(options);
	})

	ipcMain.handle('save-file', (event, options) => {
		return dialog.showSaveDialog(options);
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